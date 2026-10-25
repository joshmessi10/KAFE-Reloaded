const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { ToolRouter } = require('../../src/tutor/ToolRouter');
const { selectHistory } = require('../../src/tutor/ConversationHistory');

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const pair = (dependencies = { fileUris: [], knowledgeLineage: null }) => ({ id: randomUUID(), learnerText: 'Question', assistantText: 'Answer', dependencies });
const entry = (kind, text, patch = {}) => ({ id: randomUUID(), kind, status: 'completed', text, data: null, actions: [], ...patch });
const content = patch => ({ draft: '', entries: [], historyPairs: [], preferences: { mode: 'guided', level: 'beginner' }, ...patch });

function fixture(options = {}) {
  const provider = { getRequestParameters: () => ({ model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true }),
    stream: options.stream || (async function* () { yield { type: 'complete', text: 'Hello', toolCalls: [], finishReason: 'stop' }; }) };
  const reader = { validateUri: async () => true };
  const retriever = { getKnowledgeLineage: async () => null, search: async () => [] };
  const coordinator = new SessionCoordinator({ provider, proposalProvider: options.proposalProvider,
    contextComposer: new ContextComposer({ documentReader: reader, knowledgeRetriever: retriever }),
    toolRouter: new ToolRouter({ documentReader: reader, knowledgeRetriever: retriever }),
    getContext: () => ({}), getSourceRevision: () => 0 });
  return { coordinator, submit: text => coordinator.handleLearnerMessage({ type: 'submitMessage',
    submissionId: randomUUID(), text, contextRevision: coordinator.snapshot().context.revision }) };
}

test('capture is detached and pure, with safe display, full history, draft and preferences', () => {
  const { coordinator } = fixture();
  coordinator.session.setDraft('Unsent\nCAFÉ ☕');
  coordinator.learningSession.setPreferences({ mode: 'paused', level: 'expert' });
  const entryId = coordinator.session.appendEntry({ kind: 'host', status: 'ready', text: 'Confirm scope',
    data: { scopeSummary: 'Explain this loop', targetUri: 'file:///private.kf', request: { secret: 'private' } } });
  coordinator.session.registerAction(entryId, { type: 'prepareChange', label: 'Prepare', enabled: true, args: { scopeId: 'private' } });
  for (let index = 0; index < 12; index++) coordinator.session.recordCompletedPair(pair());
  const before = coordinator.snapshot();
  const captured = coordinator.captureConversation();
  assert.deepEqual(coordinator.snapshot(), before);
  assert.equal(captured.draft, 'Unsent\nCAFÉ ☕');
  assert.deepEqual(captured.preferences, { mode: 'paused', level: 'expert' });
  assert.equal(captured.historyPairs.length, 12, 'archive history is independent of provider context bounds');
  assert.deepEqual(captured.entries[0].actions, []);
  assert.equal(captured.entries[0].data.scopeSummary, 'Explain this loop');
  assert.equal(JSON.stringify(captured).includes('private'), false);
  captured.entries[0].text = 'mutated'; captured.historyPairs[0].learnerText = 'mutated';
  assert.equal(coordinator.snapshot().entries[0].text, 'Confirm scope');
  assert.equal(coordinator.session.historyPairs()[0].learnerText, 'Question');
  coordinator.dispose();
});

test('restore preserves the live session object, advances generation, and restores only inert conversation data', () => {
  const { coordinator } = fixture();
  const session = coordinator.session;
  const id = session.appendEntry({ kind: 'host', status: 'ready', text: 'Old action' });
  const action = session.registerAction(id, { type: 'retryTurn', label: 'Retry', enabled: true, args: { turnId: 'old' } });
  const before = session.snapshot();
  const envelope = { type: 'invokeAction', sessionId: before.sessionId, generation: before.generation,
    entryId: id, actionId: action.id, args: { turnId: 'old' } };
  session.setContext({ restricted: false, activeSource: null, sources: [{ id: 'optional:a', uri: 'file:///a.kf',
    label: 'a.kf', category: 'selected-file', included: true }] });
  coordinator.learningSession.addObservation({ kind: 'concept', text: 'Old observation', attribution: 'tutor',
    uncertainty: 'Unknown', status: 'observed', priorDecisionIds: [] }, { files: [], knowledgeLineage: null });
  const history = pair({ fileUris: ['file:///a.kf'], knowledgeLineage: 'pack-a' });
  const restored = content({ draft: 'New draft\n☕', preferences: { mode: 'paused', level: 'intermediate' },
    entries: [entry('learner', 'Question'), entry('assistant', '```kf\nshow("CAFÉ");\n```'),
      entry('proposal', 'Historical proposed change', { status: 'ready', data: { proposalId: 'old-private-id' } }),
      entry('checkpoint', 'Historical checkpoint', { status: 'ready', data: { checkpoint: { kind: 'design', name: 'Loop',
        learnerProposalSummary: '', tutorProposedAdditions: [], scopeSummary: 'Explain', tradeoffs: [], unresolvedChoices: [] } } })],
    historyPairs: [history] });
  assert.deepEqual(coordinator.restoreConversation(restored), { status: 'completed' });
  const state = coordinator.snapshot();
  assert.equal(coordinator.session, session);
  assert.equal(state.sessionId, before.sessionId);
  assert.equal(state.generation, before.generation + 1);
  assert.equal(state.draft, restored.draft);
  assert.equal(state.entries[1].text, restored.entries[1].text);
  assert.deepEqual(state.learning.preferences, restored.preferences);
  assert.deepEqual(coordinator.learningSession.snapshot().observations, []);
  assert.deepEqual(state.context.sources, []);
  assert.equal(state.context.activeSource, null);
  assert.equal(state.turn, null);
  assert.deepEqual(session.historyPairs(), [history]);
  assert.ok(state.entries.every(value => value.actions.length === 0));
  assert.equal(state.entries[2].status, 'stale');
  assert.equal(state.entries[3].status, 'stale');
  assert.equal(session.resolveAction(envelope), null);
  assert.equal(coordinator.proposal, null);
  assert.deepEqual(coordinator.controller.publishedCheckpoints(), []);
  coordinator.dispose();
});

test('restored source-grounded history retains dependencies and needs current source and knowledge eligibility', () => {
  const { coordinator } = fixture();
  const history = pair({ fileUris: ['file:///private.kf'], knowledgeLineage: 'pack-a' });
  assert.equal(coordinator.restoreConversation(content({ historyPairs: [history] })).status, 'completed');
  const restored = coordinator.session.historyPairs();
  assert.deepEqual(restored, [history]);
  assert.deepEqual(selectHistory({ pairs: restored }).pairs, []);
  assert.deepEqual(selectHistory({ pairs: restored, authorizedFileUris: ['file:///private.kf'], knowledgeLineage: 'other' }).pairs, []);
  assert.deepEqual(selectHistory({ pairs: restored, authorizedFileUris: ['file:///private.kf'], knowledgeLineage: 'pack-a' }).pairs, [history]);
  assert.deepEqual(coordinator.snapshot().context.sources, []);
  coordinator.dispose();
});

test('invalid restoration is rejected before changing the current transcript or generation', () => {
  const { coordinator } = fixture();
  coordinator.session.setDraft('Keep this');
  coordinator.session.appendEntry({ kind: 'learner', status: 'submitted', text: 'Existing conversation' });
  const before = coordinator.snapshot();
  for (const invalid of [null, {}, content({ draft: null }), content({ entries: [entry('unknown', 'Invalid')] }),
    content({ preferences: { mode: 'guided', level: 'invalid' } }), content({ historyPairs: [pair({ fileUris: 'invalid', knowledgeLineage: null })] })]) {
    assert.deepEqual(coordinator.restoreConversation(invalid), { status: 'unavailable', code: 'invalid_conversation' });
    assert.deepEqual(coordinator.snapshot(), before);
  }
  coordinator.dispose();
});

test('Apply and pending native reset block transitions without stopping or mutating the conversation', () => {
  const proposalProvider = { pending: { phase: 'applying' }, isResetPending: () => false, clear: () => ({ status: 'busy' }) };
  const { coordinator } = fixture({ proposalProvider });
  coordinator.session.setDraft('Keep this during Apply');
  const before = coordinator.snapshot();
  assert.equal(coordinator.canTransitionConversation(), false);
  assert.deepEqual(coordinator.stopConversationResponse(), { status: 'busy' });
  assert.deepEqual(coordinator.restoreConversation(content()), { status: 'busy' });
  assert.deepEqual(coordinator.snapshot(), before);
  proposalProvider.pending = null; proposalProvider.isResetPending = () => true;
  assert.equal(coordinator.canTransitionConversation(), false);
  proposalProvider.isResetPending = () => false; coordinator.acceptingProposalId = 'accepting';
  assert.equal(coordinator.canTransitionConversation(), false);
  coordinator.acceptingProposalId = null;
  assert.equal(coordinator.canTransitionConversation(), true);
  coordinator.dispose();
  assert.equal(coordinator.canTransitionConversation(), false);
});

test('switching stops a streaming response, preserves partial text as cancelled and fences late completion', async () => {
  const release = deferred(), partial = deferred();
  const { coordinator, submit } = fixture({ stream: async function* ({ signal }) {
    yield { type: 'text', text: 'Partial CAFÉ ☕' }; partial.resolve(signal);
    await release.promise;
    yield { type: 'complete', text: 'Late completion', toolCalls: [], finishReason: 'stop' };
  } });
  const sending = submit('Explain loops');
  const signal = await partial.promise;
  await new Promise(resolve => setImmediate(resolve));
  const beforeCapture = coordinator.snapshot();
  assert.equal(coordinator.captureConversation().entries.at(-1).status, 'responding');
  assert.deepEqual(coordinator.snapshot(), beforeCapture, 'autosave capture must not cancel a response');
  assert.equal((await coordinator.handleLearnerMessage({ type: 'setLearningPreferences',
    preferences: { mode: 'paused', level: 'expert' } })).status, 'queued');
  assert.deepEqual(coordinator.stopConversationResponse(), { status: 'completed' });
  const saved = coordinator.captureConversation();
  assert.equal(signal.aborted, true);
  assert.equal(saved.entries.at(-1).text, 'Partial CAFÉ ☕');
  assert.equal(saved.entries.at(-1).status, 'cancelled');
  assert.deepEqual(saved.preferences, { mode: 'paused', level: 'expert' }, 'capture includes queued preferences after stopping');
  assert.equal(coordinator.restoreConversation(content({ entries: [entry('learner', 'Different chat')] })).status, 'completed');
  release.resolve();
  assert.equal((await sending).status, 'cancelled');
  assert.deepEqual(coordinator.snapshot().entries.map(value => value.text), ['Different chat']);
  coordinator.dispose();
});

test('restoring a saved unfinished response marks it cancelled and issues no retry or execution actions', () => {
  const session = new ConversationSession();
  session.restoreConversation(content({ entries: [entry('assistant', 'Interrupted partial text', { status: 'responding' }),
    entry('host', 'Old authorized scope', { status: 'ready', data: { scopeSummary: 'Change loop' } })] }));
  const state = session.snapshot();
  assert.equal(state.entries[0].status, 'cancelled');
  assert.equal(state.entries[1].status, 'stale');
  assert.ok(state.entries.every(value => value.actions.length === 0));
  assert.deepEqual(state.contextActions.actions, []);
});
