const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { CodeProposalProvider } = require('../../src/tutor/CodeProposalProvider');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { ToolRouter, selectedSourceId, metadataLineage } = require('../../src/tutor/ToolRouter');
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const uri = path => ({ scheme: 'file', path, toString() { return `file://${path}`; } });
const metadata = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack-a', expectedContentSha256: 'a'.repeat(64) };
const ready = { status: 'ready', metadata };
const unavailable = { status: 'unavailable', code: 'knowledge_missing' };
const terminal = (text = 'Hello.', toolCalls = []) => ({ type: 'complete', text, toolCalls, finishReason: toolCalls.length ? 'tool_calls' : 'stop' });
function fixture(options = {}) {
  let context = options.context || {}, availability = options.availability || unavailable;
  const sent = [], reads = [];
  const reader = { validateUri: async () => true, readDocument: async u => { reads.push(u.toString()); return options.read ? options.read(u) : { uri: u, text: 'optional', version: 1 }; } };
  const retriever = { getKnowledgeLineage: async () => availability.status === 'ready' ? metadataLineage(availability.metadata) : null,
    search: options.search || (async () => []) };
  const composer = new ContextComposer({ documentReader: reader, knowledgeRetriever: retriever });
  const provider = { getRequestParameters: () => ({ model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true }),
    async *stream(input) { sent.push(input.request); yield* options.events?.(input, sent.length) || [terminal()]; } };
  const coordinator = new SessionCoordinator({ provider, contextComposer: composer,
    proposalProvider: options.proposalProvider,
    toolRouter: new ToolRouter({ knowledgeRetriever: retriever }), getContext: options.getContext || (() => context), getSourceRevision: options.getSourceRevision || (() => 0),
    getKnowledgeAvailability: options.getKnowledgeAvailability || (async () => availability),
    progressStore: { load() { throw Error('Progress must not be loaded'); }, save() { throw Error('Progress must not be changed'); } } });
  const submit = (text = 'Hello', submissionId = randomUUID()) => coordinator.handleLearnerMessage({ type: 'submitMessage', text, submissionId, contextRevision: coordinator.snapshot().context?.revision ?? 0 });
  return { coordinator, composer, provider, reader, sent, reads, submit, setContext: c => context = c, setAvailability: a => availability = a };
}

test('action evidence changing during awaited capture cannot be admitted under a later revision', async () => {
  const f = fixture({ context: { activeDocument: { uri: uri('/a.kf'), text: 'A', version: 1 } } });
  await f.coordinator.refreshContext();
  const original = f.composer.compose.bind(f.composer);
  f.composer.compose = async options => {
    const result = await original(options);
    f.coordinator.actionEvidence.recordRunState({ sourceUri: 'file:///a.kf', status: 'failed' }); return result;
  };
  const state = f.coordinator.session.snapshot();
  const submission = { submissionId: randomUUID(), text: 'Explain', inputRevision: state.inputRevision, context: state.context };
  const captured = await f.coordinator.captureSubmission(submission);
  assert.equal(f.coordinator.isSubmissionAuthorized(captured), false);
});

test('conversation generation reset clears host evidence even through the shared session reset path', () => {
  const f = fixture();
  f.coordinator.recordRunResult({ stdout: 'OLD_OUTPUT', stderr: '', exitCode: null, outputTruncated: false,
    runtimeVersion: '1', knowledgePackVersion: '1', sourceUri: 'file:///a.kf', runSequence: 1 });
  assert.equal(f.coordinator.actionEvidence.selectContext({ authorizedFiles: [{ uri: 'file:///a.kf' }] }).records.length, 1);
  f.coordinator.session.reset();
  assert.equal(f.coordinator.actionEvidence.selectContext({ authorizedFiles: [{ uri: 'file:///a.kf' }] }).records.length, 0);
  assert.equal(f.coordinator.evidence, null);
});

const learningCheckpoint = patch => ({ id: 'checkpoint', name: 'proposeLearningCheckpoint', arguments: { kind: 'design', name: 'Loop', learnerProposalSummary: 'Learner idea', tutorProposedAdditions: [], scopeSummary: 'Print items', tradeoffs: [], unresolvedChoices: [], sourceIds: [], ...patch } });
test('Restricted search then design checkpoint publishes retrieved file-free knowledge without continuation', async () => {
  let searches = 0;
  const f = fixture({ context: { restricted: true }, availability: ready,
    search: async () => { searches++; return searches === 1 ? [] : [{ id: 'loops', path: 'language/loops.md', text: 'Loop details', category: 'language', ...metadata }]; },
    events: async function* () { yield terminal('', [{ id: 'lookup', name: 'searchKafeKnowledge', arguments: { query: 'loop' } }, learningCheckpoint({ sourceIds: ['knowledge:loops'] })]); } });
  await f.coordinator.refreshContext(); assert.equal((await f.submit('Explain lists')).status, 'completed');
  assert.equal(f.sent.length, 1); assert.equal(searches, 2);
  assert.deepEqual(f.sent[0].tools.map(tool => tool.function.name), ['searchKafeKnowledge', 'proposeLearningCheckpoint']);
  const decision = f.coordinator.learningSession.snapshot().decisions[0];
  assert.deepEqual(decision.dependencies, { files: [], knowledgeLineage: metadataLineage(metadata) });
  assert.deepEqual(decision.checkpoint.sourceIds, ['knowledge:loops']);
  const entry = f.coordinator.snapshot().entries.find(e => e.kind === 'checkpoint');
  assert.equal(entry.status, 'ready'); assert.equal(entry.data.preparationEligible, false); assert.deepEqual(entry.actions, []);
});
test('checkpoint settlement advances only the learning revision while preserving the original source fence', async () => {
  let sourceRevision = 0;
  const f = fixture({ context: { activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 1 } }, getSourceRevision: () => sourceRevision,
    events: async function* () { yield terminal('', [learningCheckpoint({ sourceIds: ['active-file'] })]); } });
  await f.coordinator.refreshContext(); assert.equal((await f.submit()).status, 'completed');
  const captured = f.coordinator.controller.current.snapshot, decision = f.coordinator.learningSession.snapshot().decisions[0];
  assert.equal(f.coordinator.isSubmissionAuthorized(captured), false);
  assert.equal(f.coordinator.isSubmissionAuthorized(captured, { learningRevision: decision.revision }), true);
  assert.equal(await f.coordinator.validateSubmission(captured), false);
  sourceRevision++;
  assert.equal(f.coordinator.isSubmissionAuthorized(captured, { learningRevision: decision.revision }), false);
});
test('source revision changed during checkpoint publication cancels without explicit revocation', async () => {
  let sourceRevision = 0, changed = false;
  const f = fixture({ context: { activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 1 } }, getSourceRevision: () => sourceRevision,
    events: async function* () { yield terminal('', [learningCheckpoint({ sourceIds: ['active-file'] })]); } });
  await f.coordinator.refreshContext();
  f.coordinator.subscribe(state => {
    if (!changed && state.entries.some(entry => entry.kind === 'checkpoint')) { changed = true; sourceRevision++; }
  });
  assert.equal((await f.submit()).status, 'cancelled'); assert.equal(changed, true);
  assert.equal(f.coordinator.controller.publishedCheckpoints().length, 0);
  assert.equal(f.coordinator.snapshot().entries.find(entry => entry.kind === 'checkpoint').status, 'stale');
});
test('New conversation during checkpoint cancellation cleanup cannot restore the old turn', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [learningCheckpoint({})]); } });
  const initialGeneration = f.coordinator.snapshot().generation;
  let invalidated = false, reset = false;
  f.coordinator.subscribe(state => {
    if (!invalidated && state.entries.some(entry => entry.kind === 'checkpoint' && entry.status === 'ready')) {
      invalidated = true; f.coordinator.controller.invalidateCheckpoints();
    }
    if (invalidated && !reset && state.entries.some(entry => entry.kind === 'assistant' && entry.status === 'cancelled')) {
      reset = true; f.coordinator.newConversation();
    }
  });
  assert.equal((await f.submit()).status, 'cancelled');
  assert.equal(invalidated, true); assert.equal(reset, true);
  const state = f.coordinator.snapshot();
  assert.equal(state.generation, initialGeneration + 1);
  assert.deepEqual(state.entries, []); assert.equal(state.turn, null);
  assert.deepEqual(f.coordinator.learningSession.snapshot().decisions, []);
  assert.equal(f.coordinator.controller.current, null);
  assert.deepEqual(f.coordinator.controller.publishedCheckpoints(), []);
});
test('checkpoint inherits prior decision and tool-retrieved knowledge with no continuation', async () => {
  let searches = 0;
  const f = fixture({ context: { activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 2 } }, availability: ready,
    search: async () => { searches++; return searches === 1 ? [] : [{ id: 'loops', path: 'language/loops.md', text: 'Loop details', category: 'language', ...metadata }]; },
    events: async function* () { yield terminal('', [{ id: 'lookup', name: 'searchKafeKnowledge', arguments: { query: 'loop' } }, learningCheckpoint({ sourceIds: ['knowledge:loops'] })]); } });
  await f.coordinator.refreshContext();
  const file = { uri: 'file:///a.kf', version: 2, contentSha256: require('../../src/tutor/RequestSnapshot').sha256('show(1)') };
  const prior = f.coordinator.learningSession.addDecision({ ...learningCheckpoint({}).arguments, priorDecisionIds: [] }, { files: [file], knowledgeLineage: metadataLineage(metadata) });
  f.coordinator.session.recordCompletedPair({ id: 'old-history', learnerText: 'Old discussion', assistantText: 'Old source discussion', dependencies: { fileUris: ['file:///a.kf'], knowledgeLineage: metadataLineage(metadata) } });
  assert.equal((await f.submit('Explain lists')).status, 'completed'); assert.equal(f.sent.length, 1);
  const decision = f.coordinator.learningSession.snapshot().decisions.at(-1);
  assert.deepEqual(decision.dependencies.files, [file]); assert.equal(decision.dependencies.knowledgeLineage, metadataLineage(metadata));
  assert.equal(prior.id !== decision.id, true);
  assert.equal(f.coordinator.controller.checkpoint(decision.id).decisionId, decision.id);
  f.coordinator.controller.revokeSource(file.uri);
  assert.equal(f.coordinator.controller.checkpoint(decision.id), null);
  assert.equal(f.coordinator.snapshot().entries.find(e => e.kind === 'checkpoint').status, 'stale');
  assert.equal(f.coordinator.learningSession.snapshot().decisions.at(-1).disposition, 'proposed');
});
for (const change of ['removed', 'trust', 'knowledge']) test(`settled checkpoint becomes stale after ${change} grounding change`, async () => {
  const active = { uri: uri('/a.kf'), text: 'show(1)', version: 2 };
  const f = fixture({ context: { activeDocument: active }, availability: ready,
    events: async function* () { yield terminal('', [learningCheckpoint({ sourceIds: ['active-file'] })]); } });
  await f.coordinator.refreshContext(); assert.equal((await f.submit()).status, 'completed');
  const id = f.coordinator.learningSession.snapshot().decisions[0].id;
  if (change === 'removed') f.setContext({});
  if (change === 'trust') f.setContext({ restricted: true });
  if (change === 'knowledge') f.setAvailability({ status: 'ready', metadata: { ...metadata, packIdentity: 'pack-b' } });
  await f.coordinator.refreshContext();
  assert.equal(f.coordinator.controller.checkpoint(id), null);
  assert.equal(f.coordinator.snapshot().entries.find(e => e.kind === 'checkpoint').status, 'stale');
});
test('unrelated source edits and draft changes retain checkpoint ownership', async () => {
  const f = fixture({ context: { activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 2 } },
    events: async function* () { yield terminal('', [learningCheckpoint({ sourceIds: ['active-file'] })]); } });
  await f.coordinator.refreshContext(); assert.equal((await f.submit()).status, 'completed');
  const id = f.coordinator.learningSession.snapshot().decisions[0].id;
  f.coordinator.controller.revokeSource('file:///unrelated.kf'); f.coordinator.session.setDraft('Next draft');
  await f.coordinator.refreshContext(); assert.ok(f.coordinator.controller.checkpoint(id));
});
test('new conversation during checkpoint publication cannot retain an old actionable record', async () => {
  const f = fixture({ events: async function* () { yield terminal('', [learningCheckpoint({})]); } });
  let reset = false;
  f.coordinator.subscribe(state => {
    if (!reset && state.entries.some(entry => entry.kind === 'checkpoint')) { reset = true; f.coordinator.newConversation(); }
  });
  assert.equal((await f.submit()).status, 'cancelled');
  assert.equal(f.coordinator.controller.publishedCheckpoints().length, 0);
  assert.equal(f.coordinator.learningSession.snapshot().decisions.length, 0);
  assert.equal(f.coordinator.snapshot().entries.some(e => e.kind === 'checkpoint'), false);
});

test('preferences changed during provider response queue until settlement without mutating the request', async () => {
  const gate = deferred(), entered = deferred();
  const f = fixture({ events: async function* () { entered.resolve(); await gate.promise; yield terminal(); } });
  const sending = f.submit('Design a list'); await entered.promise;
  const captured = f.coordinator.controller.current.snapshot;
  assert.equal((await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } })).status, 'queued');
  assert.equal(captured.learning?.preferences.mode, 'guided');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'guided');
  gate.resolve(); assert.equal((await sending).status, 'completed');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'paused');
  assert.equal(captured.learning.preferences.mode, 'guided');
  await f.submit('What is a loop?');
  assert.match(f.sent.at(-1).messages[0].content, /paused.*do not require.*reasoning/i);
});

test('new conversation and recreated host clear learning independently of legacy state and credentials', async () => {
  const f = fixture();
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused', familiarity: 'beginner' } });
  f.coordinator.learningSession.addObservation({ kind: 'concept', text: 'Iteration explained', attribution: 'tutor', uncertainty: 'Unknown', status: 'observed', priorDecisionIds: [] }, { files: [], knowledgeLineage: null });
  f.coordinator.newConversation(); await f.coordinator.refreshContext();
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'guided');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.familiarity, 'unknown');
  assert.deepEqual(f.coordinator.learningSession.snapshot().observations, []);
  const another = fixture();
  assert.equal(another.coordinator.learningSession.snapshot().preferences.mode, 'guided');
});

test('settlement observers cannot replace completion or retry, and run once after busy clears', async () => {
  const f = fixture(); let calls = 0;
  f.coordinator.controller.onSettled = () => {
    calls++; assert.equal(f.coordinator.controller.current.busy, false); throw new Error('Observer failure');
  };
  assert.equal((await f.submit()).status, 'completed');
  assert.equal(calls, 1);
  assert.equal(f.sent.length, 1);
});

test('native host submission and retry settle queued preferences through the shared controller', async () => {
  const { TutorHostActions } = require('../../src/tutor/TutorHostActions');
  const { ProviderError } = require('../../src/tutor/providers/ProviderError');
  const gates = [deferred(), deferred()], entered = [deferred(), deferred()];
  const f = fixture({ events: async function* (input, count) {
    entered[count - 1].resolve(); await gates[count - 1].promise;
    if (count === 1) throw new ProviderError('provider_unavailable');
    yield terminal();
  } });
  const actions = new TutorHostActions({ session: f.coordinator.session, controller: f.coordinator.controller, coordinator: f.coordinator });
  const first = actions.submitMessage({ submissionId: randomUUID(), text: 'Help', contextRevision: f.coordinator.snapshot().context.revision });
  await entered[0].promise;
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { frequency: 'light' } });
  gates[0].resolve(); assert.equal((await first).status, 'failed');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.frequency, 'light');
  const state = f.coordinator.snapshot(), entry = state.entries.find(e => e.actions.some(a => a.type === 'retryTurn' && a.enabled));
  const action = entry.actions.find(a => a.type === 'retryTurn');
  const retry = actions.dispatch({ type: 'invokeAction', sessionId: state.sessionId, generation: state.generation, entryId: entry.id, actionId: action.id, args: action.args });
  await entered[1].promise;
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } });
  assert.equal(f.coordinator.controller.current.snapshot.learning.preferences.mode, 'guided');
  gates[1].resolve(); assert.equal((await retry).status, 'completed');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'paused');
  actions.dispose();
});

for (const closed of [false, true]) test(`explicit optional inclusion survives active focus and return with closed=${closed}`, async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] } });
  await f.coordinator.refreshContext();
  const include = included => f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included, contextRevision: f.coordinator.snapshot().context.revision });
  await include(true); await f.submit('KEEP_HISTORY');
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 }, candidateUris: [a, b] });
  await f.coordinator.refreshContext(); const beforeReads = f.reads.length;
  await f.submit('B active');
  assert.equal(f.reads.length, beforeReads, 'Active B is not reread as an optional file');
  assert.equal(f.sent.at(-1).messages.filter(m => m.content.startsWith('[Source ')).length, 1);
  f.setContext({ activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: closed ? [] : [b] });
  await f.coordinator.refreshContext();
  assert.equal(f.coordinator.snapshot().context.sources.find(s => s.uri === b.toString())?.included, true);
  await f.submit('Return to A');
  assert.ok(f.sent.at(-1).messages.some(m => m.content === 'KEEP_HISTORY'));
  assert.ok(f.sent.at(-1).messages.some(m => m.content.startsWith(`[Source ${selectedSourceId(b)}]`)));
  await include(false); await f.coordinator.refreshContext(); const readsAfterRemoval = f.reads.length; await f.submit('Removed');
  assert.equal(f.sent.at(-1).messages.at(-1).content, 'Removed');
  assert.equal(f.reads.length, readsAfterRemoval);
  assert.equal(f.sent.at(-1).messages.some(m => m.content === 'KEEP_HISTORY'), false);
  if (!closed) { await include(true); f.coordinator.newConversation(); await f.coordinator.refreshContext();
    assert.equal(f.coordinator.snapshot().context.sources.some(s => s.included), false); }
});

test('authorization loss while an explicitly included file is active revokes future inclusion', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] } });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 } }); await f.coordinator.refreshContext();
  f.reader.validateUri = async () => false; f.setContext({}); await f.coordinator.refreshContext();
  f.reader.validateUri = async () => true;
  f.setContext({ activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] }); await f.coordinator.refreshContext();
  assert.equal(f.coordinator.snapshot().context.sources.find(s => s.uri === b.toString()).included, false);
});

test('Hello submits once without runtime or knowledge', async () => {
  const f = fixture(); f.coordinator.session.setDraft('Hello');
  await f.submit();
  assert.equal(f.sent.length, 1);
  assert.deepEqual(f.coordinator.snapshot().entries.map(e => e.kind), ['learner', 'assistant']);
  assert.equal(f.coordinator.snapshot().entries[1].text, 'Hello.');
  assert.match(f.sent[0].messages[0].content, /knowledge.*unavailable/i);
  assert.equal(f.sent[0].tools.length, 5);
});

test('duplicate submission ID cannot resend during or after settlement', { timeout: 1000 }, async () => {
  const gate = deferred(), entered = deferred();
  const f = fixture({ events: async function* () { entered.resolve(); await gate.promise; yield terminal(); } });
  const id = randomUUID(), sending = f.submit('Hello', id); await entered.promise;
  assert.equal((await f.submit('Other', id)).status, 'stale'); gate.resolve(); await sending;
  assert.equal((await f.submit('Hello', id)).status, 'stale');
  assert.equal(f.sent.length, 1); assert.equal(f.coordinator.snapshot().entries.filter(e => e.kind === 'learner').length, 1);
});

test('captured submission is independent of next draft', { timeout: 1000 }, async () => {
  const gate = deferred(), entered = deferred(); const f = fixture({ availability: ready, search: async () => { entered.resolve(); await gate.promise; return []; } });
  f.coordinator.session.setDraft('Original'); const sending = f.submit('Original'); await entered.promise;
  f.coordinator.session.setDraft('Next question'); gate.resolve(); await sending;
  assert.equal(f.sent[0].messages.at(-1).content, 'Original'); assert.equal(f.coordinator.snapshot().draft, 'Next question');
});



test('same text typed again is not cleared at completion', async () => {
  const gate = deferred(), entered = deferred(); const f = fixture({ events: async function* () { entered.resolve(); await gate.promise; yield terminal(); } });
  f.coordinator.session.setDraft('Hello'); const sending = f.submit(); await entered.promise;
  assert.equal(f.coordinator.snapshot().draft, ''); f.coordinator.session.setDraft('Hello'); gate.resolve(); await sending;
  assert.equal(f.coordinator.snapshot().draft, 'Hello');
});

test('active A cannot become B after Send', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), gate = deferred(), entered = deferred();
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 } }, availability: ready,
    search: async () => { entered.resolve(); await gate.promise; return []; } });
  await f.coordinator.refreshContext(); const sending = f.submit('Explain lists'); await entered.promise;
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 } }); gate.resolve();
  assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 0);
});

test('optional read is followed by fresh active validation', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), gate = deferred(), entered = deferred(); let reads = 0;
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] },
    read: async u => { if (++reads === 2) { entered.resolve(); await gate.promise; } return { uri: u, text: 'B', version: 1 }; } });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  const sending = f.submit(); await entered.promise;
  f.setContext({ activeDocument: { uri: a, text: 'CHANGED', version: 2 }, candidateUris: [b] }); gate.resolve();
  assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 0);
});

test('pack disappears before send and cannot transmit captured knowledge', async () => {
  const gate = deferred(), entered = deferred(); const f = fixture({ availability: ready, search: async () => { entered.resolve(); await gate.promise; return []; } });
  const sending = f.submit('Explain lists'); await entered.promise; f.setAvailability(unavailable); gate.resolve(); await sending;
  assert.equal(f.sent.length, 0);
});

test('restricted workspace submits message only and denies file tools and Run evidence', async () => {
  const a = uri('/work/a.kf'); const f = fixture({ context: { restricted: true, activeDocument: { uri: a, text: 'PRIVATE', version: 1 }, candidateUris: [a] } });
  await f.coordinator.refreshContext(); f.coordinator.recordRunResult({ stdout: 'PRIVATE_RUN', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '1', knowledgePackVersion: '1', sourceUri: a.toString(), runSequence: 1 });
  await f.submit(); assert.equal(f.sent.length, 1); assert.equal(f.reads.length, 0);
  assert.equal(JSON.stringify(f.sent[0]).includes('PRIVATE'), false);
  assert.deepEqual(f.sent[0].tools.map(t => t.function.name), ['searchKafeKnowledge', 'proposeLearningCheckpoint']);
  assert.equal(f.coordinator.snapshot().context.activeSource, null);
});

test('removed file cannot reenter through inherited history', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const f = fixture({ context: { activeDocument: { uri: a, text: 'SECRET_A', version: 1 }, candidateUris: [b] } });
  await f.coordinator.refreshContext(); await f.submit('Question A');
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 }, candidateUris: [] }); await f.coordinator.refreshContext(); await f.submit('Question B');
  assert.equal(JSON.stringify(f.sent[1]).includes('SECRET_A'), false); assert.equal(JSON.stringify(f.sent[1]).includes('Question A'), false);
});

test('stale displayed context is rejected before entry admission', async () => {
  const f = fixture(); await f.coordinator.refreshContext();
  const result = await f.coordinator.handleLearnerMessage({ type: 'submitMessage', text: 'Hello', submissionId: randomUUID(), contextRevision: 999 });
  assert.equal(result.status, 'stale'); assert.equal(f.coordinator.snapshot().entries.length, 0); assert.equal(f.sent.length, 0);
});

test('retry preserves next draft and restarts only the original question', async () => {
  const { ProviderError } = require('../../src/tutor/providers/ProviderError');
  const f = fixture({ events: async function* (_, n) { if (n === 1) throw new ProviderError('timeout'); yield terminal(); } });
  await f.submit('Original'); f.coordinator.session.setDraft('Next');
  await f.coordinator.controller.retry(f.coordinator.snapshot().turn.id);
  assert.equal(f.sent.length, 2); assert.equal(f.sent[1].messages.at(-1).content, 'Original');
  assert.equal(f.coordinator.snapshot().draft, 'Next'); assert.equal(f.coordinator.snapshot().entries.filter(e => e.kind === 'learner').length, 1);
});

test('reset releases deduplication only in a fresh generation', async () => {
  const f = fixture(), id = randomUUID(); await f.submit('Hello', id); f.coordinator.session.reset(); await f.submit('Hello', id);
  assert.equal(f.sent.length, 2); assert.equal(f.coordinator.snapshot().entries.filter(e => e.kind === 'learner').length, 1);
});

test('formal learning and review commands have no effect', async () => {
  const f = fixture();
  for (const type of ['useLearningGoal','startSession','confirmMilestones','recordReviewedCheck','prepareReview','sendReviewed']) {
    const before = f.coordinator.snapshot(); assert.equal((await f.coordinator.handleLearnerMessage({ type, goal: 'Lists' })).status, 'unavailable'); assert.deepEqual(f.coordinator.snapshot(), before);
  }
});


test('Retry captures current host editor without overwriting the next draft', async () => {
  const { ProviderError } = require('../../src/tutor/providers/ProviderError'); const a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 } }, events: async function* (_, n) { if (n === 1) throw new ProviderError('timeout'); yield terminal(); } });
  await f.coordinator.refreshContext(); await f.submit('Original');
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 } }); f.coordinator.session.setDraft('Next');
  assert.equal((await f.coordinator.controller.retry(f.coordinator.snapshot().turn.id)).status, 'completed');
  assert.equal(f.sent.length, 2);
  const source = f.sent[1].messages.find(m => m.content.startsWith('[Source active-file]\n'));
  assert.match(source.content, /Host-provided reference context; not learner-pasted text/);
  assert.equal(source.content.slice(source.content.lastIndexOf('\n') + 1), 'B');
  assert.equal(f.coordinator.snapshot().draft, 'Next');
});

test('new knowledge continues from the authorized pack and preserves dependency lineage', async () => {
  let searches = 0;
  const f = fixture({ availability: ready, search: async () => ++searches === 1 ? [] : [{ id: 'lists', text: 'PACK_BYTES', path: 'language/lists.md', category: 'language', ...metadata }],
    events: async function* (_, n) { yield n === 1 ? terminal('', [{ id: 'k', name: 'searchKafeKnowledge', arguments: { query: 'lists' } }]) : terminal('Answer'); } });
  assert.equal((await f.submit('Explain lists')).status, 'completed'); assert.equal(f.sent.length, 2);
  assert.ok(f.sent[1].messages.some(m => m.role === 'tool' && m.content.includes('PACK_BYTES')));
  assert.equal(JSON.stringify(f.coordinator.snapshot()).includes('PACK_BYTES'), false);
  assert.equal(f.coordinator.session.historyPairs()[0].dependencies.knowledgeLineage, metadataLineage(metadata));
  f.setAvailability(unavailable); await f.submit('New'); assert.equal(f.sent[2].messages.some(m => m.content === 'Answer'), false);
});

test('Stop during capture registers retry and fences late composed data', async () => {
  const gate = deferred(), entered = deferred(); const f = fixture({ availability: ready, search: async () => { entered.resolve(); await gate.promise; return []; } });
  const sending = f.submit('Explain lists'); await entered.promise; const turn = f.coordinator.snapshot().turn;
  f.coordinator.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration });
  assert.ok(f.coordinator.snapshot().entries.flatMap(e => e.actions).some(a => a.enabled && a.type === 'retryTurn'));
  gate.resolve(); assert.equal((await sending).status, 'cancelled'); assert.equal(f.sent.length, 0);
});


test('reset during a pending stream immediately admits a new generation and rejects late work', async () => {
  const gate = deferred(), entered = deferred(); const f = fixture({ events: async function* (_, n) { if (n === 1) { entered.resolve(); await gate.promise; } yield terminal(n === 1 ? 'OLD' : 'NEW'); } });
  const id = randomUUID(), old = f.submit('Hello', id); await entered.promise;
  f.coordinator.session.reset(); const next = f.submit('Hello', id); gate.resolve();
  await old; assert.equal((await next).status, 'completed'); assert.equal(f.sent.length, 2);
  assert.deepEqual(f.coordinator.snapshot().entries.map(e => e.text), ['Hello', 'NEW']);
});


for (const mutation of ['trust', 'selection', 'provider', 'run']) test(`post-read validation rejects changed ${mutation} before provider transmission`, async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), gate = deferred(), entered = deferred(); let reads = 0;
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] },
    read: async u => { if (++reads === 2) { entered.resolve(); await gate.promise; } return { uri: u, text: 'B', version: 1 }; } });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  const sending = f.submit(); await entered.promise;
  if (mutation === 'trust') f.setContext({ restricted: true });
  if (mutation === 'selection') f.coordinator.session.setSelectedSources([]);
  if (mutation === 'provider') f.provider.getRequestParameters = () => ({ model: 'changed', thinking: { type: 'enabled' }, stream: true });
  if (mutation === 'run') f.coordinator.recordRunResult({ stdout: 'NEW', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '1', knowledgePackVersion: '1', sourceUri: a.toString(), runSequence: 1 });
  gate.resolve(); assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 0);
});

test('selected files stay authorized after their editors close without reading excluded candidates', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), c = uri('/work/excluded.kf');
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b, c] } });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  f.setContext({ activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [c] }); await f.coordinator.refreshContext();
  assert.equal((await f.submit()).status, 'completed'); assert.ok(f.reads.length > 0); assert.ok(f.reads.every(read => read === b.toString()));
  assert.ok(f.coordinator.snapshot().context.sources.some(s => s.id === selectedSourceId(b) && s.included));
});


test('closed selected-file authorization cannot publish stale active context or overwrite a changed selection', async () => {
  for (const changed of ['active', 'selection']) {
    const a = uri('/work/a.kf'), b = uri('/work/b.kf'), c = uri('/work/c.kf'), gate = deferred(), entered = deferred();
    const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] } });
    await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
    f.setContext({ activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [] });
    f.reader.validateUri = async () => { entered.resolve(); await gate.promise; return true; };
    const refresh = f.coordinator.refreshContext(); await entered.promise;
    if (changed === 'active') f.setContext({ activeDocument: { uri: c, text: 'C', version: 1 }, candidateUris: [] });
    else f.coordinator.session.setSelectedSources([]);
    gate.resolve(); await refresh;
    if (changed === 'active') assert.equal(f.coordinator.snapshot().context.activeSource.uri, c.toString());
    else assert.equal(f.coordinator.snapshot().context.sources.some(s => s.included), false);
  }
});


test('selected bytes changed after asynchronous revalidation are checked again before send', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), gate = deferred(), entered = deferred(); let text = 'B';
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] }, read: async u => ({ uri: u, text, version: text === 'B' ? 1 : 2 }) });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  const validate = f.composer.revalidateSnapshot.bind(f.composer);
  f.composer.revalidateSnapshot = async input => { const valid = await validate(input); entered.resolve(); await gate.promise; return valid; };
  const sending = f.submit(); await entered.promise; text = 'CHANGED'; gate.resolve();
  assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 0);
});


for (const phase of ['availability', 'context', 'controller-resume']) test(`final ${phase} await cannot authorize stale selected bytes`, async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), held = deferred(), entered = deferred();
  let text = 'B_OLD', version = 1, checks = 0, contexts = 0;
  const f = fixture({ getSourceRevision: () => version,
    read: async u => ({ uri: u, text, version }),
    getContext: async () => {
      if (++contexts === 5 && phase === 'context') { entered.resolve(); await held.promise; }
      return { activeDocument: { uri: a, text: 'A', version: 1 }, candidateUris: [b] };
    },
    getKnowledgeAvailability: async () => { if (++checks === 3 && phase === 'availability') { entered.resolve(); await held.promise; } return unavailable; } });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(b), included: true, contextRevision: f.coordinator.snapshot().context.revision });
  if (phase === 'controller-resume') {
    const validate = f.coordinator.controller.validateSubmission;
    f.coordinator.controller.validateSubmission = async snapshot => { const valid = await validate(snapshot); entered.resolve(); await held.promise; return valid; };
  }
  const sending = f.submit(); await entered.promise; text = 'B_CHANGED'; version = 2; held.resolve();
  assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 0);
});

test('file transmission fails closed without a synchronous source revision fence', async () => {
  const f = fixture({ context: { activeDocument: { uri: uri('/work/a.kf'), text: 'A', version: 1 } }, getSourceRevision: () => null });
  await f.coordinator.refreshContext(); assert.equal((await f.submit()).status, 'stale'); assert.equal(f.sent.length, 0);
});


function nativeFixture() {
  const source = uri('/work/native.kf'), read = deferred(), readEntered = deferred(), apply = deferred(), applyEntered = deferred();
  const opening = deferred(), openEntered = deferred();
  let phase = 'none', writes = 0, opens = 0, trusted = true;
  const document = { uri: source, languageId: 'kafe', version: 1, getText: () => 'show(1)', positionAt: offset => ({ offset }) };
  class WorkspaceEdit { replace() {} }
  class Range { constructor(start, end) { this.start = start; this.end = end; } }
  const vscode = { Uri: { parse: value => ({ scheme: value.startsWith('file:') ? 'file' : 'kafe-proposal', toString: () => value }) },
    Range, WorkspaceEdit, commands: { executeCommand: async () => { if (++opens === 2 && phase === 'open') { openEntered.resolve(); await opening.promise; } } },
    workspace: { openTextDocument: async () => { if (phase === 'read') { readEntered.resolve(); await read.promise; } return document; },
      applyEdit: async () => { writes++; if (phase === 'apply') { applyEntered.resolve(); await apply.promise; } return true; } } };
  const native = new CodeProposalProvider({ vscode, authorizeUri: () => trusted });
  const f = fixture({ proposalProvider: native, context: { activeDocument: { uri: source, text: 'show(1)', version: 1 } },
    events: async function* () { yield terminal('', [{ id: 'proposal', name: 'proposeCodeChange', arguments: { newText: 'show(2)' } }]); } });
  const issue = async () => {
    await f.coordinator.refreshContext(); await f.submit('Change code');
    const { TutorHostActions } = require('../../src/tutor/TutorHostActions');
    const actions = new TutorHostActions({ session: f.coordinator.session, coordinator: f.coordinator, controller: f.coordinator.controller, proposalProvider: native });
    actions.projectDisplay();
    const state = f.coordinator.snapshot(), entry = state.entries.findLast(e => e.actions.some(a => a.type === 'prepareChange' && a.enabled));
    const action = entry.actions.find(a => a.type === 'prepareChange' && a.enabled);
    await actions.dispatch({ type: 'invokeAction', sessionId: state.sessionId, generation: state.generation, entryId: entry.id, actionId: action.id, args: action.args });
    const id = native.pending.id;
    return native.open(id, { isCurrent: () => f.coordinator.proposal?.id === id });
  };
  return { ...f, native, document, issue, read, readEntered, apply, applyEntered, opening, openEntered,
    phase: value => phase = value, revoke: () => trusted = false, get writes() { return writes; } };
}

test('coordinator duplicate Accept is single-flight and retains the first native result', async () => {
  const f = nativeFixture(); await f.issue(); f.phase('apply'); const id = f.coordinator.proposal.id;
  const first = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id }); await f.applyEntered.promise;
  const duplicate = await f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id });
  assert.equal(duplicate.code, 'proposal_busy'); assert.equal(f.coordinator.proposal.id, id); assert.equal(f.writes, 1);
  f.apply.resolve(); assert.equal((await first).status, 'completed'); assert.equal(f.coordinator.proposal, null); assert.equal(f.native.pending, null);
});

test('coordinator Reject and native Clear remain busy after applyEdit starts', async () => {
  const f = nativeFixture(); await f.issue(); f.phase('apply'); const id = f.coordinator.proposal.id;
  const accepting = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id }); await f.applyEntered.promise;
  assert.equal((await f.coordinator.handleLearnerMessage({ type: 'rejectProposal', id })).code, 'proposal_busy');
  assert.equal(f.native.clear(id).status, 'busy'); assert.equal(f.native.prepareClear().status, 'busy');
  assert.equal(f.coordinator.proposal.id, id); assert.equal(f.native.pending.id, id); assert.equal(f.writes, 1);
  f.apply.resolve(); assert.equal((await accepting).status, 'completed'); assert.equal(f.coordinator.proposal, null);
});

for (const change of ['reject', 'reset', 'revoke', 'buffer']) test(`native acceptance during source read is fenced by ${change}`, async () => {
  const f = nativeFixture(); await f.issue(); f.phase('read'); const id = f.coordinator.proposal.id;
  const accepting = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id }); await f.readEntered.promise;
  if (change === 'reject') assert.equal((await f.coordinator.handleLearnerMessage({ type: 'rejectProposal', id })).status, 'completed');
  if (change === 'reset') f.coordinator.session.reset();
  if (change === 'revoke') f.revoke();
  if (change === 'buffer') f.document.version++;
  const afterChange = f.coordinator.snapshot(); f.read.resolve(); const result = await accepting;
  assert.equal(f.writes, 0); assert.equal(f.native.pending, null); assert.equal(f.coordinator.proposal, null);
  assert.equal(result.status, change === 'revoke' || change === 'buffer' ? 'failed' : 'cancelled');
  if (change === 'reset') assert.deepEqual(f.coordinator.snapshot(), afterChange);
});

test('late native apply completion after reset cannot append into the new conversation', async () => {
  const f = nativeFixture(); await f.issue(); f.phase('apply'); const id = f.coordinator.proposal.id;
  const accepting = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id }); await f.applyEntered.promise;
  f.coordinator.session.reset(); const fresh = f.coordinator.snapshot(); f.apply.resolve();
  assert.equal((await accepting).status, 'cancelled'); assert.deepEqual(f.coordinator.snapshot(), fresh); assert.equal(f.writes, 1);
});

test('rejecting old native proposal A while B opens cannot clear pending B', async () => {
  const f = nativeFixture(); await f.issue(); const idA = f.coordinator.proposal.id; f.phase('open');
  const next = f.issue(); await f.openEntered.promise; const idB = f.native.pending.id;
  assert.notEqual(idA, idB); assert.equal((await f.coordinator.handleLearnerMessage({ type: 'rejectProposal', id: idA })).status, 'failed');
  assert.equal(f.native.pending.id, idB); assert.equal(f.native.pending.reviewed, false); assert.equal(f.coordinator.proposal.id, idB);
  f.opening.resolve(); await next; assert.equal(f.native.pending.reviewed, true); assert.equal(f.coordinator.proposal.id, idB);
});

test('Run evidence is monotonic and included only for its current authorized target', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'); const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 } } });
  const run = n => ({ stdout: `RUN_A_${n}`, stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '1', knowledgePackVersion: '1', sourceUri: a.toString(), runSequence: n });
  assert.equal(f.coordinator.recordRunResult(run(2)), true);
  const entries = f.coordinator.snapshot().entries.length;
  assert.equal(f.coordinator.recordRunResult(run(2)), false); assert.equal(f.coordinator.recordRunResult(run(1)), false);
  assert.equal(f.coordinator.snapshot().entries.length, entries); assert.equal(f.coordinator.evidence.runSequence, 2);
  await f.coordinator.refreshContext(); await f.submit('Result A'); assert.ok(JSON.stringify(f.sent[0]).includes('RUN_A_2'));
  f.setContext({ activeDocument: { uri: b, text: 'B', version: 1 } }); await f.coordinator.refreshContext(); await f.submit('Result B');
  assert.equal(JSON.stringify(f.sent[1]).includes('RUN_A_2'), false); assert.equal(f.coordinator.evidence.sourceUri, a.toString());
  assert.equal(f.coordinator.recordRunResult(run(3)), true); assert.equal(f.coordinator.evidence.runSequence, 3);
});

for (const claim of [
  'You have mastered KAFE because your program passed and your explanation is correct.',
  'Your explanation proves mastery of KAFE lists.', 'A passing run proves mastery of KAFE.',
  'A passing run demonstrates mastery of KAFE.', 'Mastery was demonstrated by a passing run.',
  'Your explanation is proof of KAFE mastery.', 'A passing run proves you understand KAFE.',
  'Your explanation is proof that you understand KAFE lists.', 'Understanding was confirmed by your explanation.',
  'Your successful run shows you understand this concept.', 'Your explanation shows you learned how KAFE lists work.',
  'A passing run is a clear sign that you know KAFE.', 'You mastered KAFE.', 'You have mastered KAFE.',
  'The learner mastered KAFE.', 'You are a master of KAFE.', 'You now master KAFE.',
]) test(`coaching guard rejects unsupported attainment: ${claim}`, async () => {
  const f = fixture({ events: async function* () { yield { type: 'text', text: claim }; yield terminal(claim); } });
  await f.submit(); const coordinator = f.coordinator; const assistant = coordinator.snapshot().entries.find(e => e.kind === 'assistant');
  assert.notEqual(assistant.text, claim); assert.match(assistant.text, /do not establish mastery/);
  assert.equal(coordinator.snapshot().entries.some(e => ['check', 'progress', 'milestones'].includes(e.kind)), false);
  assert.equal(coordinator.session.historyPairs()[0].assistantText, assistant.text);
});

for (const guidance of [
  'Try indexing the first list item, then explain its output.',
  'To understand list indexing, try the first and last positions, then compare their outputs.',
  'To understand list indexing, show the first and last outputs.',
  'To understand your explanation, show the intermediate output and inspect each step.',
  'Your explanation shows how to understand KAFE lists.',
  'A passing run shows where to inspect the output so you understand the result.',
  'To understand, show your explanation and inspect each step.',
  'To build mastery of KAFE lists, practice indexing one item at a time.',
  'To become proficient, explain one more run result in your own words.',
  'Here is how to master KAFE lists through practice.', 'You can master KAFE lists with more examples.',
]) test(`ordinary guidance is preserved: ${guidance}`, async () => {
  const f = fixture({ events: async function* () { yield terminal(guidance); } }); await f.submit();
  assert.equal(f.coordinator.snapshot().entries.find(e => e.kind === 'assistant').text, guidance);
});


for (const revision of [undefined, -1, NaN, Infinity, '0']) test(`invalid source fence ${String(revision)} cannot authorize files`, async () => {
  const f = fixture({ context: { activeDocument: { uri: uri('/work/a.kf'), text: 'A', version: 1 } }, getSourceRevision: () => revision });
  await f.coordinator.refreshContext(); assert.equal((await f.submit()).status, 'stale'); assert.equal(f.sent.length, 0);
});

test('source mutation during knowledge tool retrieval blocks continuation', async () => {
  const a = uri('/work/a.kf'), gate = deferred(), entered = deferred(); let revision = 0, searches = 0;
  const f = fixture({ context: { activeDocument: { uri: a, text: 'A', version: 1 } }, availability: ready, getSourceRevision: () => revision,
    search: async () => { if (++searches === 2) { entered.resolve(); await gate.promise; } return []; },
    events: async function* () { yield terminal('', [{ id: 'k', name: 'searchKafeKnowledge', arguments: { query: 'lists' } }]); } });
  await f.coordinator.refreshContext(); const sending = f.submit('Explain lists'); await entered.promise; revision++; gate.resolve();
  assert.equal((await sending).status, 'stale'); assert.equal(f.sent.length, 1); assert.equal(f.coordinator.session.historyPairs().length, 0);
});

test('source revocation while explicit native replacement review opens suppresses late proposal capabilities', async () => {
  const f = nativeFixture();
  await f.issue(); f.phase('open'); const sending = f.issue(); await f.openEntered.promise;
  f.coordinator.controller.revokeSource(f.document.uri.toString()); f.opening.resolve(); assert.equal((await sending).status, 'cancelled');
  assert.equal(f.native.pending, null); assert.equal(f.coordinator.proposal, null); assert.equal(f.writes, 0);
  assert.equal(f.coordinator.snapshot().entries.flatMap(e => e.actions).some(a => a.enabled && a.type === 'acceptProposal'), false);
});
