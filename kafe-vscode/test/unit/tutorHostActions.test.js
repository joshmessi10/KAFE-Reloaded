const assert = require('node:assert/strict');
const test = require('node:test');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { TutorHostActions } = require('../../src/tutor/TutorHostActions');
const { ProgressStore } = require('../../src/tutor/ProgressStore');

function fixture(options = {}) {
  const session = new ConversationSession();
  const saved = [];
  const progressStore = new ProgressStore({ workspaceState: { get() {}, async update(key, value) { saved.push({ key, value }); } } });
  const coordinator = new SessionCoordinator({ session, progressStore });
  const actions = new TutorHostActions({ session, controller: coordinator.controller, coordinator, progressStore,
    authorizeRunTarget: () => true, getReadiness: async () => ({ trusted: true, keyPresent: false, knowledgeReady: false, runtimeStatus: 'unavailable' }), ...options });
  return { session, saved, coordinator, actions };
}

test('host keeps completed Run evidence private and never projects it into the Tutor timeline', () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  let launches = 0; const f = fixture({runFile:() => { launches++; }}), v = loadView();
  f.actions.recordRunState({runSequence:1,sourceUri:'file:///workspace/a.kf',status:'running'});
  v.render(f.session.snapshot()); assert.equal(v.byId('timeline').querySelector('details'), null);
  assert.equal(f.actions.recordRunResult({runSequence:1,sourceUri:'file:///workspace/a.kf',stdout:'PARTIAL',stderr:'child failed',exitCode:null,outputTruncated:true,runtimeVersion:'1',knowledgePackVersion:'1'}), true);
  v.render(f.session.snapshot());
  assert.equal(f.session.snapshot().entries.length, 0);
  assert.equal(v.byId('timeline').querySelector('details'), null);
  assert.doesNotMatch(v.byId('timeline').textContent, /PARTIAL|child failed|Exit code/);
  assert.equal(f.coordinator.evidence.exitCode,null); assert.equal(launches,0); assert.deepEqual(v.sent,[]);
});
function envelope(session, type, entryId) {
  const s = session.snapshot();
  const entry = s.entries.findLast(e => (!entryId || e.id === entryId) && e.actions.some(a => a.type === type && a.enabled)) ||
    (s.contextActions.actions.some(a => a.type === type && a.enabled) ? { id: s.contextActions.entryId, actions: s.contextActions.actions } : null);
  assert.ok(entry, `Missing ${type}`);
  const a = entry.actions.find(a => a.type === type && a.enabled);
  return { type: 'invokeAction', sessionId: s.sessionId, generation: s.generation, entryId: entry.id, actionId: a.id, args: a.args };
}

test('context refresh does not append transcript entries or query readiness', async () => {
  let readiness = 0;
  const f = fixture({ getReadiness: async () => { readiness++; return {}; } });
  f.coordinator.contextComposer = { documentReader: {} };
  await f.actions.refreshContext();
  f.session.setDraft('Next draft');
  await f.actions.refreshContext();
  assert.deepEqual(f.session.snapshot().entries, []);
  assert.equal(f.session.snapshot().draft, 'Next draft');
  assert.equal(readiness, 0);
});

test('key configuration refreshes context without resending or clearing the next draft', async () => {
  let submits = 0;
  const f = fixture({ configureProvider: async () => ({ status: 'completed' }) });
  f.coordinator.contextComposer = { documentReader: {} };
  f.coordinator.controller.submit = () => { submits++; };
  issue(f, 'configureProviderKey'); f.session.setDraft('Unsent');
  assert.equal((await f.actions.dispatch(envelope(f.session, 'configureProviderKey'))).status, 'completed');
  assert.equal(submits, 0); assert.equal(f.session.snapshot().draft, 'Unsent');
  assert.ok(!f.session.snapshot().entries.some(e => e.actions.some(a => a.type === 'reviewContext')));
});
function activeRun(f) { f.session.setContext({ restricted: false, activeSource: { id: 'active-file', uri: 'file:///workspace/a.kf', label: 'a.kf', category: 'active-file', included: true }, sources: [] }); }
function issue(f, type, args = {}) { const id = f.session.appendEntry({ kind: 'host', status: 'ready', text: type }); return f.session.registerAction(id, { type, label: type, enabled: true, args }); }
test('forged and replayed mutation capabilities perform no second side effect', async () => {
  let calls = 0, release;
  const f = fixture({ configureProvider: () => { calls++; return new Promise(r => { release = r; }); } });
  issue(f, 'configureProviderKey');
  const e = envelope(f.session, 'configureProviderKey');
  assert.equal((await f.actions.dispatch({ ...e, args: { key: 'forged' } })).status, 'stale');
  const first = f.actions.dispatch(e);
  assert.equal((await f.actions.dispatch(e)).status, 'stale');
  release({ status: 'completed' }); await first;
  assert.equal(calls, 1);
});

test('runtime-unavailable Run remains outside Tutor actions and downloads', async () => {
  let downloads = 0;
  const f = fixture({ runFile: async () => ({ status: 'unavailable', code: 'runtime_unavailable' }), runtimeManager: { async installRuntime({ onProgress }) { onProgress({ stage: 'checking' }); return { status: 'unavailable' }; }, download() { downloads++; } } });
  issue(f, 'configureProviderKey');
  activeRun(f); await f.actions.dispatch(envelope(f.session, 'runFile'));
  assert.equal(f.session.snapshot().entries.some(entry => entry.kind === 'run'), false);
  assert.equal(f.session.snapshot().entries.some(entry => entry.actions.some(action => action.type === 'installRuntime')), false);
  assert.equal(downloads, 0);
});

test('native setup recovery capability delegates to the shared host helper without running a learner program', async () => {
  let setups = 0, installs = 0, runs = 0;
  const f = fixture({ getReadiness: async () => ({ trusted: true }), prepareRuntime: async args => { assert.deepEqual(args, { origin: 'retry' }); setups++; return { status: 'ready' }; },
    runtimeManager: { installRuntime: () => { installs++; } }, runFile: () => { runs++; } });
  try {
    f.session.setDraft('Unsent'); issue(f, 'installRuntime');
    assert.equal((await f.actions.dispatch(envelope(f.session, 'installRuntime'))).status, 'completed');
    assert.equal(setups, 1); assert.equal(installs, 0); assert.equal(runs, 0); assert.equal(f.session.snapshot().draft, 'Unsent');
  } finally { f.actions.dispose(); f.coordinator.dispose(); }
});
module.exports = { fixture, envelope };


test('Run completion remains private evidence and creates no Tutor entries', () => {
  const f = fixture();
  f.actions.recordRunState({ runSequence: 1, sourceUri: 'file:///workspace/a.kf', documentVersion: 4, terminal: { show() {} }, status: 'running' });
  f.actions.recordRunResult({ stdout: 'bounded output', stderr: '', exitCode: 0, outputTruncated: false, runtimeMode: 'contributor', runtimeVersion: null, knowledgePackVersion: null, sourceUri: 'file:///workspace/a.kf', runSequence: 1 });
  assert.deepEqual(f.session.snapshot().entries, []);
  assert.equal(f.coordinator.evidence.stdout, 'bounded output');
  assert.equal(f.coordinator.evidence.runSequence, 1);
});

test('cancelled Run stays outside the Tutor and does not become evidence', () => {
  const f = fixture();
  f.actions.recordRunState({ runSequence: 1, sourceUri: 'file:///workspace/a.kf', status: 'running' });
  f.actions.recordRunState({ runSequence: 1, sourceUri: 'file:///workspace/a.kf', status: 'cancelled' });
  assert.deepEqual(f.session.snapshot().entries, []);
  assert.equal(f.coordinator.evidence, null);
});

test('source-revoked proposal cannot reopen its native diff using an old review capability', async () => {
  let opens = 0;
  const f = fixture({ proposalProvider: { async open() { opens++; return { status: 'opened' }; } } });
  const id = f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'native-id', turnId: 'old-turn' } });
  const e = envelope(f.session, 'reviewProposal');
  f.session.updateEntry(id, { status: 'cancelled' });
  assert.equal((await f.actions.dispatch(e)).status, 'stale');
  assert.equal(opens, 0);
});

test('cancelled native acceptance settles its proposal entry as cancelled and never claims applied', async () => {
  const proposalProvider = { async accept() { return { status: 'cancelled' }; } };
  const f = fixture({ proposalProvider });
  f.coordinator.proposalProvider = proposalProvider;
  const id = f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'native-id', turnId: 'turn-id' } });
  f.session.registerAction(id, { type: 'acceptProposal', label: 'Accept', enabled: true, args: { id: 'native-id', turnId: 'turn-id' } });
  assert.equal((await f.actions.dispatch(envelope(f.session, 'acceptProposal'))).status, 'cancelled');
  assert.equal(f.session.snapshot().entries.find(e => e.id === id).status, 'cancelled');
});

test('cleared session ignores completion of an earlier Run', async () => {
  const f = fixture();
  f.actions.recordRunState({ runSequence: 1, sourceUri: 'file:///workspace/a.kf', status: 'running' });
  f.coordinator.newConversation();
  f.actions.recordRunResult({ stdout: '', stderr: '', exitCode: 0, outputTruncated: false, runtimeMode: 'contributor', runtimeVersion: null, knowledgePackVersion: null, sourceUri: 'file:///workspace/a.kf', runSequence: 1 });
  assert.equal(f.coordinator.evidence, null);
  assert.equal(f.session.snapshot().entries.filter(e => e.kind === 'run').length, 0);
});

test('cancelled chat Run creates no Tutor status and no evidence', async () => {
  const f = fixture({ getReadiness: async () => ({ trusted: true, targetUri: 'file:///workspace/a.kf' }), runFile: async () => ({ status: 'cancelled' }) });
  issue(f, 'configureProviderKey');
  activeRun(f);
  assert.equal((await f.actions.dispatch(envelope(f.session, 'runFile'))).status, 'cancelled');
  assert.equal(f.session.snapshot().entries.some(e => e.kind === 'run'), false);
  assert.equal(f.coordinator.evidence, null);
});

test('proposal display exposes native target metadata without proposed bytes', () => {
  const f = fixture({ displayTargetLabel: () => 'workspace/a.kf', proposalProvider: { pending: { id: 'proposal', sourceId: 'file:///workspace/a.kf', documentVersion: 7, newText: 'private proposal bytes' } } });
  f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'proposal', turnId: 'turn' } });
  const entry = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  assert.equal(entry.data.targetUri, 'file:///workspace/a.kf');
  assert.equal(entry.data.targetLabel, 'workspace/a.kf');
  assert.equal(entry.data.documentVersion, 7);
  assert.ok(!JSON.stringify(entry.data).includes('private proposal bytes'));
});

test('busy native Reject preserves the proposal while its authorized edit is applying', async () => {
  let release;
  const provider = { accept: () => new Promise(r => { release = r; }), reject: () => ({ status: 'busy' }) };
  const f = fixture({ proposalProvider: provider }); f.coordinator.proposalProvider = provider;
  const id = f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'proposal', turnId: 'turn' } });
  for (const type of ['acceptProposal', 'rejectProposal']) f.session.registerAction(id, { type, label: type, enabled: true, args: { id: 'proposal', turnId: 'turn' } });
  const applying = f.actions.dispatch(envelope(f.session, 'acceptProposal'));
  const reject = await f.actions.dispatch(envelope(f.session, 'rejectProposal'));
  assert.equal(reject.code, 'proposal_busy');
  assert.equal(f.session.snapshot().entries.find(e => e.id === id).status, 'ready');
  assert.ok(envelope(f.session, 'rejectProposal'));
  release({ status: 'applied' }); await applying;
  assert.equal(f.session.snapshot().entries.find(e => e.id === id).status, 'applied');
});

test('pending progress reset blocks Accept without consuming the native proposal on rollback', async () => {
  let resetting = true;
  const provider = { isResetPending: () => resetting, async accept() { return { status: 'applied' }; } };
  const f = fixture({ proposalProvider: provider }); f.coordinator.proposalProvider = provider;
  const id = f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'proposal', turnId: 'turn' } });
  f.session.registerAction(id, { type: 'acceptProposal', label: 'Accept', enabled: true, args: { id: 'proposal', turnId: 'turn' } });
  assert.equal((await f.actions.dispatch(envelope(f.session, 'acceptProposal'))).code, 'proposal_busy');
  assert.equal(f.session.snapshot().entries.find(e => e.id === id).status, 'ready');
  resetting = false;
  await f.actions.dispatch(envelope(f.session, 'acceptProposal'));
  assert.equal(f.session.snapshot().entries.find(e => e.id === id).status, 'applied');
});


test('failed native Review settles discarded proposal and disables its sibling controls', async () => {
  const provider = { pending: { id: 'proposal', sourceId: 'file:///workspace/a.kf', documentVersion: 1 },
    async open() { this.pending = null; return { status: 'failed' }; } };
  const f = fixture({ proposalProvider: provider });
  const id = f.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review', data: { proposalId: 'proposal', turnId: 'turn' } });
  for (const type of ['acceptProposal', 'rejectProposal']) f.session.registerAction(id, { type, label: type, enabled: true, args: { id: 'proposal', turnId: 'turn' } });
  assert.equal((await f.actions.dispatch(envelope(f.session, 'reviewProposal'))).status, 'failed');
  const entry = f.session.snapshot().entries.find(e => e.id === id);
  assert.equal(entry.status, 'failed');
  assert.ok(entry.actions.every(a => !a.enabled));
});
