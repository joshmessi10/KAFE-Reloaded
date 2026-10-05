const { randomUUID } = require('node:crypto');
const { createRequestSnapshot, sha256 } = require('../../src/tutor/RequestSnapshot');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { TurnController } = require('../../src/tutor/TurnController');
const { ToolRouter, KnowledgeLineageChanged } = require('../../src/tutor/ToolRouter');
const { ProviderError } = require('../../src/tutor/providers/ProviderError');
const { LearningSession } = require('../../src/tutor/LearningSession');

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const terminal = (text = 'A hint.', toolCalls = []) => ({ type: 'complete', text, toolCalls, finishReason: toolCalls.length ? 'tool_calls' : 'stop' });
const call = (name = 'getLatestRunResult', id = 'call') => ({ id, name, arguments: {} });
function fixture(options = {}) {
  const learningSession = options.learningSession || new LearningSession();
  const session = new ConversationSession(); session.setDraft('Help');
  const retriever = { knowledgeLineage: null, search: async () => [] };
  const contextComposer = new ContextComposer({ documentReader: {}, knowledgeRetriever: retriever });
  const preparedTarget = { uri: 'file:///a.kf', version: 1, contentSha256: sha256('show(1)') };
  let calls = 0;
  const sent = [], states = [];
  session.subscribe(s => { if (s.turn) states.push(s.turn.status); });
  const provider = { async *stream(input) { calls++; sent.push(input.request); yield* options.events?.(input, calls) || [terminal()]; } };
  const capture = async submission => {
    const s = session.snapshot();
    const composition = await contextComposer.compose({ request: submission.text, history: session.historyPairs(), learningSession, ...(options.prepared ? { activeDocument: { uri: { scheme: 'file', toString: () => preparedTarget.uri }, text: 'show(1)', version: 1 } } : {}) });
    return createRequestSnapshot({ sessionId: s.sessionId, generation: s.generation, submission, runSequence: 0,
      sources: composition.snapshots, history: composition.history, learning: composition.learning, dependencies: composition.dependencies, request: composition.payload });
  };
  const controller = new TurnController({ session, provider, contextComposer, learningSession,
    isSubmissionAuthorized: options.isSubmissionAuthorized || (options.prepared ? () => true : undefined),
    diagnostic: options.diagnostic,
    toolRouter: options.prepared && options.toolRouter ? { async route(call, context) {
      const result = await options.toolRouter.route(call, context);
      return call.name === 'proposeCodeChange' ? { documentVersion: 1, contentSha256: preparedTarget.contentSha256, ...result } : result;
    } } : options.toolRouter || new ToolRouter({ knowledgeRetriever: retriever }), proposalProvider: options.proposalProvider,
    captureSubmission: options.inputs || capture,
    onCompletedPair: options.onCompletedPair || (pair => session.recordCompletedPair(pair)),
    validateSubmission: async () => { await options.context?.(); return options.valid?.() !== false; } });
  const submit = (text = session.snapshot().draft || 'Help', id = randomUUID()) => controller.submit({ submissionId: id, text, contextRevision: session.snapshot().context.revision, ...(options.prepared ? { reservation: controller.reserveFollowup(), preparation: { targetUri: preparedTarget.uri, scopeSummary: 'Prepare one scoped proposal', dependencies: { files: [preparedTarget], knowledgeLineage: null } } } : {}) });
  return { session, controller, contextComposer, learningSession, retriever, sent, states, submit, get calls() { return calls; } };
}

const checkpoint = (patch = {}) => ({ kind: 'design', name: 'Loop', learnerProposalSummary: 'Learner approach', tutorProposedAdditions: [], scopeSummary: 'Print items', tradeoffs: [], unresolvedChoices: [], sourceIds: [], ...patch });
const checkpointCall = (patch = {}, id = 'checkpoint') => ({ id, name: 'proposeLearningCheckpoint', arguments: checkpoint(patch) });
for (const phase of ['actions', 'assistant', 'turn', 'checkpoint']) for (const inherited of [false, true]) test(`revocation during ${phase} publication retains invalidation of ${inherited ? 'inherited' : 'direct'} checkpoint dependency`, async () => {
  const learningSession = new LearningSession();
  const { sha256 } = require('../../src/tutor/RequestSnapshot');
  const source = { id: 'active-file', category: 'active-file', uri: 'file:///a.kf', version: 1, text: 'show(1)', contentSha256: sha256('show(1)'), provenance: {} };
  const inheritedFile = { uri: 'file:///inherited.kf', version: 3, contentSha256: sha256('show(2)') };
  const prior = inherited ? learningSession.addDecision({ ...checkpoint(), priorDecisionIds: [] }, { files: [inheritedFile], knowledgeLineage: null }) : null;
  let authorized = true, revoked = false, f;
  f = fixture({ learningSession, isSubmissionAuthorized: () => authorized,
    events: async function* () { yield terminal('Choice.', [checkpointCall({ sourceIds: ['active-file'], ...(prior ? { priorDecisionIds: [prior.id] } : {}) })]); },
    inputs: async submission => {
      const state = f.session.snapshot();
      return createRequestSnapshot({ submission, sessionId: state.sessionId, generation: state.generation, runSequence: 0,
        sources: [source], history: { pairs: [], omissions: [], byteLength: 0, dependencies: { fileUris: [], knowledgeLineage: null } },
        learning: learningSession.selectContext({ authorizedFiles: [{ uri: source.uri, version: source.version, contentSha256: source.contentSha256 }, inheritedFile] }),
        dependencies: { fileUris: [source.uri, ...(prior ? [inheritedFile.uri] : [])], knowledgeLineage: null },
        request: { messages: [{ role: 'user', content: submission.text }], tools: [], model: 'test', thinking: { type: 'disabled' }, stream: true } });
    } });
  f.session.subscribe(state => {
    if (revoked || learningSession.snapshot().decisions.length !== (prior ? 2 : 1)) return;
    const hit = phase === 'actions' ? state.entries.some(e => e.kind === 'learner' && e.actions.some(a => a.type === 'stopTurn' && !a.enabled)) :
      phase === 'assistant' ? state.entries.some(e => e.kind === 'assistant' && e.status === 'completed') :
      phase === 'turn' ? state.turn.status === 'completed' : state.entries.some(e => e.kind === 'checkpoint' && e.status === 'ready');
    if (!hit) return;
    assert.equal(f.controller.publishedCheckpoints().length, 0);
    assert.equal(f.controller.checkpoint(learningSession.snapshot().decisions.at(-1).id), null);
    revoked = true; authorized = false; f.controller.revokeSource(prior ? inheritedFile.uri : source.uri);
  });
  assert.equal((await f.submit()).status, 'cancelled'); assert.equal(revoked, true);
  assert.equal(f.controller.publishedCheckpoints().length, 0);
  assert.equal(f.session.snapshot().entries.some(e => e.kind === 'checkpoint' && e.status === 'ready'), false);
  assert.equal(f.session.snapshot().turn.status, 'cancelled');
  const stored = learningSession.snapshot().decisions.at(-1);
  assert.equal(stored.disposition, 'proposed');
  assert.equal(stored.dependencies.files.some(file => file.uri === (prior ? inheritedFile.uri : source.uri)), true);
});
test('owned checkpoint settles once with host identity and no provider continuation or authority', async () => {
  const f = fixture({ events: async function* () { yield terminal('Consider this choice.', [checkpointCall()]); } });
  assert.equal((await f.submit()).status, 'completed');
  assert.equal(f.calls, 1);
  const [decision] = f.learningSession.snapshot().decisions;
  assert.ok(decision); assert.equal(decision.disposition, 'proposed'); assert.equal(decision.summaryAttribution, 'tutor-unconfirmed');
  const entry = f.session.snapshot().entries.find(e => e.kind === 'checkpoint');
  assert.equal(entry.status, 'ready'); assert.equal(entry.data.decisionId, decision.id);
  assert.equal(entry.data.generation, f.session.snapshot().generation);
  assert.equal(entry.data.teachingRevision, decision.revision);
  assert.deepEqual(entry.actions, []); assert.equal(f.controller.current.busy, false);
  assert.deepEqual(f.controller.checkpoint(decision.id).dependencies, { files: [], knowledgeLineage: null });
});
for (const calls of [[checkpointCall(), call('proposeCodeChange')], [checkpointCall(), checkpointCall({}, 'second')]]) test('contradictory checkpoint batch rejects before routing or staging', async () => {
  let routed = 0, staged = 0;
  const f = fixture({ events: async function* () { yield terminal('', calls); }, toolRouter: { route() { routed++; return {}; } }, proposalProvider: { stage() { staged++; return { id: 'p' }; } } });
  assert.equal((await f.submit()).status, 'failed'); assert.equal(routed, 0); assert.equal(staged, 0);
  assert.equal(f.learningSession.snapshot().decisions.length, 0); assert.equal(f.calls, 1);
});
test('Stop fences a checkpoint tool result that arrives after settlement', async () => {
  const entered = deferred(), gate = deferred();
  const f = fixture({ events: async function* () { yield terminal('', [checkpointCall()]); }, toolRouter: { async route() { entered.resolve(); return gate.promise; } } });
  const pending = f.submit(); await Promise.race([entered.promise, pending]);
  assert.equal(f.session.snapshot().turn.status, 'processing-tools');
  const t = f.session.snapshot().turn; f.controller.stop({ turnId: t.id, turnGeneration: t.turnGeneration });
  assert.equal((await pending).status, 'cancelled'); gate.resolve({ ...checkpoint(), priorDecisionIds: [] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.learningSession.snapshot().decisions.length, 0); assert.equal(f.session.snapshot().entries.some(e => e.kind === 'checkpoint'), false);
});
test('checkpoint is never committed when completing history fails', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [checkpointCall()]); }, onCompletedPair() { throw Error('failure'); } });
  assert.equal((await f.submit()).status, 'failed'); assert.equal(f.learningSession.snapshot().decisions.length, 0);
  assert.equal(f.session.snapshot().entries.some(e => e.kind === 'checkpoint'), false);
});
test('checkpoint fails closed when final tool validation observes source change', async () => {
  let valid = true;
  const f = fixture({ events: async function* () { yield terminal('', [checkpointCall()]); }, valid: () => valid,
    toolRouter: { route() { valid = false; return { ...checkpoint(), priorDecisionIds: [] }; } } });
  assert.equal((await f.submit()).status, 'stale'); assert.equal(f.learningSession.snapshot().decisions.length, 0);
});
test('learning limit rejection is visible and leaves no completed history or decision', async () => {
  const learningSession = new LearningSession();
  for (let i = 0; i < 32; i++) learningSession.addDecision({ ...checkpoint(), priorDecisionIds: [] }, { files: [], knowledgeLineage: null });
  const before = learningSession.snapshot();
  const f = fixture({ learningSession, events: async function* () { yield terminal('', [checkpointCall()]); } });
  assert.equal((await f.submit()).status, 'failed'); assert.deepEqual(learningSession.snapshot(), before);
  assert.equal(f.session.historyPairs().length, 0);
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'error').data.code, 'learning_limit');
});
test('checkpoint tool failure diagnostics remain bounded and identify the new tool', async () => {
  const records = [];
  const f = fixture({ diagnostic: r => records.push(r), events: async function* () { yield terminal('', [checkpointCall({ confirmed: true })]); } });
  assert.equal((await f.submit()).status, 'failed');
  const failure = records.find(r => r.event === 'tool-failed');
  assert.equal(failure.tool, 'proposeLearningCheckpoint'); assert.equal(failure.reason, 'invalid-checkpoint');
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'error').data.code, 'invalid_checkpoint');
  assert.doesNotMatch(JSON.stringify(records), /Learner approach|Print items|confirmed/);
});
test('reentrant display observers cannot turn successful checkpoint settlement into a failure', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [checkpointCall()]); } });
  f.session.subscribe(state => { if (state.entries.some(e => e.kind === 'checkpoint')) throw Error('Private display failure'); });
  assert.equal((await f.submit()).status, 'completed'); assert.equal(f.learningSession.snapshot().decisions.length, 1);
});
test('later read tool failure discards a staged checkpoint with no learning mutation', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [checkpointCall(), { ...call('readActiveDocument'), arguments: { sourceId: `selected:${'a'.repeat(64)}` } }]); } });
  assert.equal((await f.submit()).status, 'failed'); assert.equal(f.learningSession.snapshot().decisions.length, 0);
  assert.equal(f.session.snapshot().entries.some(e => e.kind === 'checkpoint'), false);
});
test('session reset fences checkpoint completion from an older owner', async () => {
  const entered = deferred(), gate = deferred();
  const f = fixture({ events: async function* () { entered.resolve(); await gate.promise; yield terminal('', [checkpointCall()]); } });
  const pending = f.submit(); await entered.promise; f.session.reset();
  assert.equal((await pending).status, 'cancelled'); gate.resolve(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.learningSession.snapshot().decisions.length, 0); assert.equal(f.controller.publishedCheckpoints().length, 0);
});

test('tool failure diagnostics identify routing and settled owner without private content', async () => {
  const records = [];
  const f = fixture({ diagnostic: record => records.push(record), events: async function* () {
    yield terminal('PRIVATE_PROVIDER_TEXT', [{ id: 'PRIVATE_CALL_ID', name: 'readActiveDocument', arguments: { sourceId: `selected:${'a'.repeat(64)}` } }]);
  } });
  assert.equal((await f.submit('PRIVATE_USER_TEXT')).status, 'failed');
  const failure = records.find(r => r.event === 'tool-failed');
  assert.equal(failure?.tool, 'readActiveDocument');
  assert.equal(failure.reason, 'source-unavailable');
  assert.equal(failure.round, 1);
  assert.equal(records.at(-1).event, 'turn-settled');
  assert.equal(records.at(-1).status, 'failed');
  assert.equal(records.at(-1).busy, false);
  assert.equal(f.session.snapshot().turn.status, 'failed');
  assert.equal(f.calls, 1);
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE|file:\/\/|arguments|stack|message/);
});

test('diagnostic callback failure cannot change successful conversation or cancellation', async () => {
  let observed = 0;
  const f = fixture({ diagnostic() { observed++; throw Error('PRIVATE_SINK_FAILURE'); } });
  assert.equal((await f.submit()).status, 'completed');
  assert.equal(f.session.snapshot().turn.status, 'completed');
  assert.equal(f.controller.current.busy, false);
  assert.ok(observed > 0);
});

test('invalid knowledge arguments are identified before retrieval without logging the query', async () => {
  const records = [];
  const f = fixture({ diagnostic: r => records.push(r), events: async function* () {
    yield terminal('', [{ id: 'PRIVATE_CALL', name: 'searchKafeKnowledge', arguments: { query: 'PRIVATE_QUERY'.repeat(30) } }]);
  } });
  let searches = 0; f.retriever.search = async () => { searches++; return []; };
  assert.equal((await f.submit()).status, 'failed');
  assert.equal(records.find(r => r.event === 'tool-failed').reason, 'invalid-query');
  assert.equal(searches, 0); assert.equal(f.calls, 1);
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE|"query"|"arguments"/);
});

test('no-file read and knowledge search continue a greeting and leave the composer usable', async () => {
  const records = [];
  const f = fixture({ diagnostic: r => records.push(r), events: async function* (input, round) {
    if (round === 1) yield terminal('', [call('readActiveDocument', 'read'), { id: 'knowledge', name: 'searchKafeKnowledge', arguments: { query: 'KAFE introduction' } }]);
    else {
      if (round === 2) assert.deepEqual(input.request.messages.filter(m => m.role === 'tool').map(m => JSON.parse(m.content)), [{ status: 'unavailable', code: 'no_active_document' }, { status: 'unavailable', code: 'knowledge_unavailable' }]);
      yield terminal(round === 2 ? 'Hello. I can explain KAFE concepts.' : 'A list holds multiple values.');
    }
  } });
  assert.equal((await f.submit('Hello')).status, 'completed'); assert.equal(f.calls, 2);
  assert.equal(f.controller.current.busy, false); assert.equal(f.session.historyPairs()[0].assistantText, 'Hello. I can explain KAFE concepts.');
  assert.equal(records.some(r => r.event === 'tool-failed'), false);
  assert.deepEqual(records.filter(r => r.event === 'tool-result').map(r => r.unavailable), [true, true]);
  assert.equal((await f.submit('Explain lists')).status, 'completed'); assert.equal(f.calls, 3);
  assert.equal(f.session.snapshot().entries.some(e => ['proposal', 'checkpoint'].includes(e.kind)), false);
});

test('repeated recoverable no-file reads retain the four tool-round bound', async () => {
  const f = fixture({ events: async function* (_, round) { yield terminal('', [call('readActiveDocument', `read-${round}`)]); } });
  assert.equal((await f.submit('Hello')).status, 'failed'); assert.equal(f.calls, 5);
  assert.equal(f.controller.current.busy, false); assert.equal(f.session.historyPairs().length, 0);
});

for (const boundary of ['stopped', 'stale']) test(`no-file tool recovery cannot continue after ${boundary} ownership`, async () => {
  let valid = true, f;
  f = fixture({ valid: () => valid, diagnostic: record => {
    if (record.event !== 'tool-result') return;
    if (boundary === 'stale') valid = false;
    else { const turn = f.session.snapshot().turn; f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration }); }
  }, events: async function* () { yield terminal('', [call('readActiveDocument')]); } });
  const result = await f.submit('Hello');
  assert.equal(result.status, boundary === 'stopped' ? 'cancelled' : 'stale');
  assert.equal(f.calls, 1); assert.equal(f.controller.current.busy, false); assert.equal(f.session.historyPairs().length, 0);
});

test('unavailable knowledge is recorded as a result and continues once without a second Send', async () => {
  const records = [];
  const f = fixture({ diagnostic: r => records.push(r), events: async function* (_, round) {
    yield round === 1 ? terminal('', [{ id: 'PRIVATE_CALL', name: 'searchKafeKnowledge', arguments: { query: 'PRIVATE_QUERY' } }]) : terminal('PRIVATE_ANSWER');
  } });
  assert.equal((await f.submit()).status, 'completed');
  assert.equal(f.calls, 2);
  assert.equal(records.find(r => r.event === 'tool-result').unavailable, true);
  assert.equal(records.some(r => r.event === 'tool-failed'), false);
  assert.deepEqual(records.filter(r => r.event === 'provider-start').map(r => r.round), [0, 1]);
  assert.equal(records.at(-1).status, 'completed');
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE/);
});

test('cancelled pending provider records idle settlement without a late failure', async () => {
  const records = [], entered = deferred(), gate = deferred();
  const f = fixture({ diagnostic: r => records.push(r), events: async function* () { entered.resolve(); await gate.promise; yield terminal('PRIVATE_LATE'); } });
  const sending = f.submit(); await entered.promise;
  const turn = f.session.snapshot().turn;
  f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration });
  assert.equal((await sending).status, 'cancelled');
  assert.equal(records.at(-1).status, 'cancelled'); assert.equal(records.at(-1).busy, false);
  assert.equal(records.some(r => r.event === 'turn-failed'), false);
  gate.resolve(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(records.at(-1).status, 'cancelled'); assert.doesNotMatch(JSON.stringify(records), /PRIVATE/);
});

test('stop before transport opens fences revalidation and invalidates only this turn actions', async () => {
  const gate = deferred(), entered = deferred();
  const f = fixture({ context: async () => { entered.resolve(); await gate.promise; return {}; } });
  const sending = f.submit(); await entered.promise;
  const turn = f.session.snapshot().turn;
  const unrelated = f.session.appendEntry({ kind: 'run', status: 'ready', text: 'Run' });
  f.session.registerAction(unrelated, { type: 'openTerminal', label: 'Review', enabled: true, args: { runSequence: 9 } });
  assert.equal(f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration }), true);
  assert.equal(f.session.snapshot().turn.status, 'cancelled');
  assert.ok(f.session.snapshot().turn.turnGeneration > turn.turnGeneration);
  gate.resolve(); await sending;
  assert.equal(f.calls, 0); assert.equal(f.session.snapshot().entries.find(e => e.id === unrelated).actions[0].enabled, true);
});

test('second sends are blocked; stop between chunks retains text and ignores late completion', async () => {
  const gate = deferred(), entered = deferred();
  const f = fixture({ events: async function* () { yield { type: 'text', text: 'Partial' }; entered.resolve(); await gate.promise; yield terminal('Partial late'); } });
  const sending = f.submit(); await entered.promise;
  await f.submit(); assert.equal(f.calls, 1);
  const turn = f.session.snapshot().turn; f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration });
  gate.resolve(); await sending;
  assert.equal(f.session.snapshot().turn.status, 'cancelled'); assert.equal(f.session.historyPairs().length, 0);
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'assistant').text, 'Partial');
});

for (const name of ['searchKafeKnowledge', 'proposeCodeChange']) test(`stop fences late ${name} results and proposal stage`, async () => {
  const gate = deferred(), entered = deferred(); let stages = 0;
  const f = fixture({ prepared: name === 'proposeCodeChange', events: async function* () { yield terminal('', [call(name)]); },
    toolRouter: { route: async () => { entered.resolve(); return gate.promise; } },
    proposalProvider: { stage: () => { stages++; return { id: 'p' }; } } });
  const sending = f.submit(); await entered.promise;
  const turn = f.session.snapshot().turn; f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration });
  gate.resolve(name === 'searchKafeKnowledge' ? [] : { uri: 'file:///a.kf', newText: 'secret' }); await sending;
  assert.equal(stages, 0); assert.equal(f.session.historyPairs().length, 0); assert.equal(f.session.snapshot().turn.status, 'cancelled');
});

test('submission stages a proposal without opening a diff or enabling Apply', async () => {
  let opened = 0;
  const f = fixture({ prepared: true, events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'secret' }) },
    proposalProvider: { stage: () => ({ id: 'own' }), open: async () => { opened++; return { status: 'opened' }; } } });
  await f.submit();
  assert.equal(opened, 0); assert.equal(f.session.snapshot().turn.status, 'completed');
  const actions = f.session.snapshot().entries.find(e => e.kind === 'proposal').actions;
  assert.deepEqual(actions.filter(a => a.enabled).map(a => a.type), ['rejectProposal']);
});

test('four calls per round and four tool rounds allow a final response; fifth tool round rejects', async () => {
  for (const rounds of [4, 5]) {
    let routes = 0;
    const f = fixture({ events: async function* (_, n) { yield n <= rounds ? terminal('', [1, 2, 3, 4].map(i => call('getLatestRunResult', `${n}-${i}`))) : terminal(); },
      toolRouter: { route: async () => { routes++; return null; } } });
    await f.submit();
    assert.equal(routes, 16); assert.equal(f.calls, 5);
    assert.equal(f.session.snapshot().turn.status, rounds === 4 ? 'completed' : 'failed');
    assert.ok(f.states.includes('processing-tools'));
  }
});

test('execution and partial/malformed tool responses cannot route or enter history', async () => {
  for (const events of [[terminal('', [call('executeCode')])], [terminal('', Array.from({ length: 5 }, (_, i) => call('getLatestRunResult', String(i))))], [{ type: 'text', text: 'partial' }], [terminal(), terminal()], [{ ...terminal(), finishReason: 'length' }], [{ ...terminal('', [call()]), finishReason: 'stop' }]]) {
    let routes = 0; const f = fixture({ events: async function* () { yield* events; }, toolRouter: { route: async () => { routes++; } } });
    await f.submit();
    assert.equal(routes, 0); assert.equal(f.session.historyPairs().length, 0); assert.equal(f.session.snapshot().turn.status, 'failed');
  }
});

for (const code of ['missing_key', 'auth', 'timeout', 'rate_limit', 'malformed_response', 'knowledge_unavailable', 'trust_unavailable', 'tool_failed', 'stale_proposal']) test(`safe recovery code ${code}`, async () => {
  const f = fixture({ events: async function* () { const error = ['missing_key', 'auth', 'timeout', 'rate_limit', 'malformed_response'].includes(code) ? new ProviderError(code) : Object.assign(new Error('SECRET'), { code }); throw error; } });
  await f.submit();
  const error = f.session.snapshot().entries.find(e => e.kind === 'error');
  assert.equal(error.data.code, code); assert.equal(JSON.stringify(f.session.snapshot()).includes('SECRET'), false);
  assert.equal(f.session.historyPairs().length, 0); assert.ok(error.actions.some(a => a.enabled));
});

test('retry starts the exact initial request, never tool continuation, with one learner entry', async () => {
  const f = fixture({ events: async function* (_, n) { if (n === 1) yield terminal('', [call()]); else if (n === 2) throw new ProviderError('timeout'); else yield terminal(); } });
  await f.submit();
  const id = f.session.snapshot().turn.id; await f.controller.retry(id);
  assert.deepEqual(f.sent[2], f.sent[0]); assert.equal(f.session.snapshot().entries.filter(e => e.kind === 'learner').length, 1);
  assert.equal(f.session.historyPairs().length, 1);
});

test('same-pack new knowledge continues without exposing request bytes to display state', async () => {
  const passage = { id: 'new', text: 'NEW BYTES', path: 'new.md', category: 'language' };
  const f = fixture({ events: async function* (_, n) { yield n === 1 ? terminal('', [call('searchKafeKnowledge')]) : terminal('Answer'); },
    toolRouter: { route: async () => [passage] } });
  await f.submit(); assert.equal(f.calls, 2); assert.equal(f.session.snapshot().turn.status, 'completed');
  assert.equal(f.session.snapshot().entries.filter(e => e.kind === 'learner').length, 1);
  assert.equal(JSON.stringify(f.session.snapshot()).includes('NEW BYTES'), false);
  assert.ok(f.sent[1].messages.some(m => m.role === 'tool' && m.content.includes('NEW BYTES')));
});

test('changed lineage rejects continuation without an automatic resend', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [call('searchKafeKnowledge')]); },
    toolRouter: { route: async () => { throw new KnowledgeLineageChanged(); } } });
  assert.equal((await f.submit()).status, 'stale'); assert.equal(f.calls, 1); assert.equal(f.session.historyPairs().length, 0);
});

test('next draft survives completion and added selection does not cancel streaming', async () => {
  const gate = deferred(), entered = deferred();
  const f = fixture({ events: async function* () { entered.resolve(); await gate.promise; yield terminal(); } });
  const sending = f.submit(); await entered.promise;
  f.session.setDraft('Next question'); f.session.setContext({ restricted: false, activeSource: null, sources: [{ id: 'new-source', uri: 'file:///new.kf', category: 'selected-file', label: 'new', included: true }] }); gate.resolve(); await sending;
  assert.equal(f.session.snapshot().draft, 'Next question'); assert.equal(f.session.snapshot().turn.status, 'completed');
  assert.equal(f.session.historyPairs()[0].learnerText, 'Help');
});

test('a superseded proposal becomes non-actionable when the replacement is staged', async () => {
  let staged = 0;
  const f = fixture({ prepared: true, events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', documentVersion: 1, newText: 'PRIVATE_CODE' }) },
    proposalProvider: { stage: () => ({ id: `p${++staged}` }), open: async () => { assert.fail('Send cannot open a diff'); }, clear: () => {} } });
  await f.submit();
  const before = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  assert.equal(before.actions.filter(a => a.enabled).length, 1);
  assert.equal(JSON.stringify(f.session.snapshot()).includes('PRIVATE_CODE'), false);
  f.session.setDraft('Second'); await f.submit();
  assert.equal(f.session.snapshot().entries.find(e => e.id === before.id).status, 'superseded');
  assert.equal(f.session.snapshot().entries.find(e => e.id === before.id).actions.some(a => a.enabled), false);
  assert.equal(f.session.snapshot().entries.findLast(e => e.kind === 'proposal').data.proposalId, 'p2');
});

test('preparation failure provides a usable prepare capability instead of retrying a missing review', async () => {
  const f = fixture({ inputs: async () => { throw Object.assign(new Error('secret'), { code: 'knowledge_unavailable' }); } });
  await f.submit();
  assert.equal(f.session.snapshot().turn.status, 'failed');
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'error').actions[0].type, 'retryTurn');
});

test('unknown thrown values stay safe and preparation without a review offers review context', async () => {
  const f = fixture({ events: async function* () { throw null; } });
  await f.submit();
  assert.equal(f.session.snapshot().turn.status, 'failed');
  const broken = fixture({ inputs: async () => { throw null; } }); await broken.submit();
  assert.equal(broken.session.snapshot().entries.find(e => e.kind === 'error').actions[0].type, 'retryTurn');
});

test('a cancelled prior generation cannot be retried into a reset session', async () => {
  const f = fixture(); await f.submit(); const turn = f.session.snapshot().turn;
  f.session.reset(); const before = f.session.snapshot(); await f.controller.retry(turn.id);
  assert.deepEqual(f.session.snapshot(), before); assert.equal(f.calls, 1);
});

test('empty submission and subsequent turns preserve completed native proposal capabilities', async () => {
  const cleared = [];
  const f = fixture({ prepared: true, events: async function* (_, n) { yield n === 1 ? terminal('', [call('proposeCodeChange')]) : terminal(); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'private' }) },
    proposalProvider: { stage: () => ({ id: 'pending' }), open: async () => ({ status: 'opened' }), clear: id => cleared.push(id) } });
  await f.submit(); const entry = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  const before = f.session.snapshot(); assert.equal((await f.submit('')).status, 'stale'); assert.deepEqual(f.session.snapshot(), before);
  await f.submit('Next'); assert.equal(f.session.snapshot().entries.find(e => e.id === entry.id).actions.filter(a => a.enabled).length, 1);
  assert.deepEqual(cleared, []); f.controller.invalidate('session-reset'); assert.deepEqual(cleared, ['pending']);
});

test('source invalidation settles an older pending proposal after an ordinary subsequent turn', async () => {
  const cleared = [];
  const f = fixture({ prepared: true, events: async function* (_, n) { yield n === 1 ? terminal('', [call('proposeCodeChange')]) : terminal(); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'private' }) },
    proposalProvider: { stage: () => ({ id: 'pending' }), open: async () => ({ status: 'opened' }), clear: id => cleared.push(id) } });
  await f.submit();
  f.session.setDraft('Next'); await f.submit();
  f.controller.revokeSource('file:///a.kf');
  assert.deepEqual(cleared, ['pending']);
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'proposal').actions.some(a => a.enabled), false);
});

test('a rejected native replacement stage preserves the previous ready proposal capabilities', async () => {
  let stages = 0;
  const f = fixture({ prepared: true, events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'private' }) },
    proposalProvider: { stage: () => { if (++stages === 2) throw new Error('native busy'); return { id: 'pending' }; }, open: async () => ({ status: 'opened' }), clear: () => {} } });
  await f.submit();
  f.session.setDraft('Second'); await f.submit();
  const proposal = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  assert.equal(proposal.status, 'ready'); assert.equal(proposal.actions.filter(a => a.enabled).length, 1);
});
