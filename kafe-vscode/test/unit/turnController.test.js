const { randomUUID } = require('node:crypto');
const { createRequestSnapshot } = require('../../src/tutor/RequestSnapshot');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { TurnController } = require('../../src/tutor/TurnController');
const { ToolRouter, KnowledgeLineageChanged } = require('../../src/tutor/ToolRouter');
const { ProviderError } = require('../../src/tutor/providers/ProviderError');

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const terminal = (text = 'A hint.', toolCalls = []) => ({ type: 'complete', text, toolCalls, finishReason: toolCalls.length ? 'tool_calls' : 'stop' });
const call = (name = 'getLatestRunResult', id = 'call') => ({ id, name, arguments: {} });
function fixture(options = {}) {
  const session = new ConversationSession(); session.setDraft('Help');
  const retriever = { knowledgeLineage: null, search: async () => [] };
  const contextComposer = new ContextComposer({ documentReader: {}, knowledgeRetriever: retriever });
  let calls = 0;
  const sent = [], states = [];
  session.subscribe(s => { if (s.turn) states.push(s.turn.status); });
  const provider = { async *stream(input) { calls++; sent.push(input.request); yield* options.events?.(input, calls) || [terminal()]; } };
  const capture = async submission => {
    const s = session.snapshot();
    const composition = await contextComposer.compose({ request: submission.text, history: session.historyPairs() });
    return createRequestSnapshot({ sessionId: s.sessionId, generation: s.generation, submission, runSequence: 0,
      sources: composition.snapshots, history: composition.history, dependencies: composition.dependencies, request: composition.payload });
  };
  const controller = new TurnController({ session, provider, contextComposer,
    toolRouter: options.toolRouter || new ToolRouter({ knowledgeRetriever: retriever }), proposalProvider: options.proposalProvider,
    captureSubmission: options.inputs || capture,
    validateSubmission: async () => { await options.context?.(); return true; } });
  const submit = (text = session.snapshot().draft || 'Help', id = randomUUID()) => controller.submit({ submissionId: id, text, contextRevision: session.snapshot().context.revision });
  return { session, controller, contextComposer, retriever, sent, states, submit, get calls() { return calls; } };
}

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
  const f = fixture({ events: async function* () { yield terminal('', [call(name)]); },
    toolRouter: { route: async () => { entered.resolve(); return gate.promise; } },
    proposalProvider: { stage: () => { stages++; return { id: 'p' }; } } });
  const sending = f.submit(); await entered.promise;
  const turn = f.session.snapshot().turn; f.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration });
  gate.resolve(name === 'searchKafeKnowledge' ? [] : { uri: 'file:///a.kf', newText: 'secret' }); await sending;
  assert.equal(stages, 0); assert.equal(f.session.historyPairs().length, 0); assert.equal(f.session.snapshot().turn.status, 'cancelled');
});

test('submission stages a proposal without opening a diff or enabling Apply', async () => {
  let opened = 0;
  const f = fixture({ events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
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
  const f = fixture({ events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
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
  const f = fixture({ events: async function* (_, n) { yield n === 1 ? terminal('', [call('proposeCodeChange')]) : terminal(); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'private' }) },
    proposalProvider: { stage: () => ({ id: 'pending' }), open: async () => ({ status: 'opened' }), clear: id => cleared.push(id) } });
  await f.submit(); const entry = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  const before = f.session.snapshot(); assert.equal((await f.submit('')).status, 'stale'); assert.deepEqual(f.session.snapshot(), before);
  await f.submit('Next'); assert.equal(f.session.snapshot().entries.find(e => e.id === entry.id).actions.filter(a => a.enabled).length, 1);
  assert.deepEqual(cleared, []); f.controller.invalidate('session-reset'); assert.deepEqual(cleared, ['pending']);
});

test('source invalidation settles an older pending proposal after an ordinary subsequent turn', async () => {
  const cleared = [];
  const f = fixture({ events: async function* (_, n) { yield n === 1 ? terminal('', [call('proposeCodeChange')]) : terminal(); },
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
  const f = fixture({ events: async function* () { yield terminal('', [call('proposeCodeChange')]); },
    toolRouter: { route: async () => ({ uri: 'file:///a.kf', newText: 'private' }) },
    proposalProvider: { stage: () => { if (++stages === 2) throw new Error('native busy'); return { id: 'pending' }; }, open: async () => ({ status: 'opened' }), clear: () => {} } });
  await f.submit();
  f.session.setDraft('Second'); await f.submit();
  const proposal = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  assert.equal(proposal.status, 'ready'); assert.equal(proposal.actions.filter(a => a.enabled).length, 1);
});
