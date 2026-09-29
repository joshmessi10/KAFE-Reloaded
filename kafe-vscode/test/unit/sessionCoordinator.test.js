const assert = require('node:assert/strict');
const test = require('node:test');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { selectedSourceId } = require('../../src/tutor/ToolRouter');
const { ProviderError } = require('../../src/tutor/providers/DeepSeekProvider');
const { CodeProposalProvider } = require('../../src/tutor/CodeProposalProvider');
const { createHash } = require('node:crypto');
const { ProgressStore, PROGRESS_KEY } = require('../../src/tutor/ProgressStore');

function reviewedProgressFixture() {
  const values = new Map();
  const workspaceState = { get: key => values.get(key), update: async (key, value) => {
    if (value === undefined) values.delete(key); else values.set(key, value);
  } };
  const progressStore = new ProgressStore({ workspaceState });
  const coordinator = new SessionCoordinator({ progressStore,
    getWorkspaceRelativeSourcePath: source => source === 'file:///work/main.kf' ? 'examples/main.kf' : null });
  const run = (runSequence, exitCode = 0) => ({ stdout: 'PRIVATE_OUTPUT', stderr: 'PRIVATE_ERROR',
    exitCode, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceUri: 'file:///work/main.kf', runSequence });
  return { coordinator, progressStore, workspaceState, values, run };
}

function holdNextProgressSave(workspaceState) {
  const update = workspaceState.update;
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  let waiting = true;
  workspaceState.update = async (key, value) => {
    if (waiting && key === PROGRESS_KEY && value !== undefined) {
      waiting = false;
      entered();
      await held;
    }
    return update(key, value);
  };
  return { started, release: () => release() };
}

test('recordReviewedCheck and clearProgress serialize so a late record cannot reappear', async () => {
  const { coordinator, progressStore, workspaceState, run } = reviewedProgressFixture();
  coordinator.recordRunResult(run(1));
  const gate = holdNextProgressSave(workspaceState);
  const recording = coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Review', outcome: 'passed' });
  await gate.started;
  const clearing = coordinator.handleLearnerMessage({ type: 'clearProgress' });
  assert.equal(coordinator.state.evidence.runSequence, 1, 'state remains until clear succeeds');
  gate.release();
  assert.equal((await recording).kind, 'coaching');
  assert.equal((await clearing).kind, 'coaching');
  assert.deepEqual(coordinator.state.completedChecks, []);
  assert.deepEqual(progressStore.load().completedChecks, []);
});

test('recordReviewedCheck and startSession serialize so a new goal retains the recorded check', async () => {
  const { coordinator, progressStore, workspaceState, run } = reviewedProgressFixture();
  coordinator.recordRunResult(run(1));
  const gate = holdNextProgressSave(workspaceState);
  const recording = coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Review', outcome: 'passed' });
  await gate.started;
  const starting = coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Next goal' });
  gate.release();
  assert.equal((await recording).kind, 'coaching');
  assert.equal((await starting).kind, 'coaching');
  assert.equal(coordinator.state.goal, 'Next goal');
  assert.equal(coordinator.state.completedChecks.length, 1);
  assert.deepEqual(progressStore.load().completedChecks, coordinator.state.completedChecks);
});

test('recordReviewedCheck serializes distinct evidence records without lost updates', async () => {
  const { coordinator, progressStore, workspaceState, run } = reviewedProgressFixture();
  coordinator.recordRunResult(run(1));
  const gate = holdNextProgressSave(workspaceState);
  const first = coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'First', outcome: 'passed' });
  await gate.started;
  coordinator.recordRunResult(run(2, 1));
  const second = coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 2,
    label: 'Second', outcome: 'failed' });
  gate.release();
  assert.equal((await first).kind, 'coaching');
  assert.equal((await second).kind, 'coaching');
  assert.deepEqual(progressStore.load().completedChecks.map(item => item.label), ['First', 'Second']);
  assert.deepEqual(coordinator.state.completedChecks.map(item => item.label), ['First', 'Second']);
});

test('clearProgress failure retains the current session and evidence', async () => {
  const { coordinator, run } = reviewedProgressFixture();
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  coordinator.recordRunResult(run(1));
  coordinator.progressStore.clear = async () => { throw new Error('storage failed'); };
  assert.equal((await coordinator.handleLearnerMessage({ type: 'clearProgress' })).kind, 'error');
  assert.equal(coordinator.state.goal, 'Lists');
  assert.equal(coordinator.state.evidence.runSequence, 1);
});

test('recordReviewedCheck requires current evidence', async () => {
  const { coordinator, progressStore, run } = reviewedProgressFixture();
  assert.equal((await coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Inspected output', outcome: 'passed' })).kind, 'error');
  assert.deepEqual(progressStore.load().completedChecks, []);
  coordinator.recordRunResult(run(1));
  coordinator.recordRunResult(run(2));
  assert.equal((await coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Inspected output', outcome: 'passed' })).kind, 'error');
  assert.deepEqual(progressStore.load().completedChecks, []);
});

test('recordReviewedCheck permits learner-marked fail or unknown without storing output', async () => {
  for (const outcome of ['failed', 'unknown']) {
    const { coordinator, progressStore, values, run } = reviewedProgressFixture();
    coordinator.recordRunResult(run(1, 0));
    assert.deepEqual(progressStore.load().completedChecks, []);
    const result = await coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
      label: '  Reviewed output  ', outcome });
    assert.equal(result.kind, 'coaching');
    const [record] = progressStore.load().completedChecks;
    assert.deepEqual(Object.keys(record), ['id', 'runSequence', 'label', 'outcome', 'recordedAt',
      'runExitCode', 'sourcePath', 'runtimeVersion', 'knowledgePackVersion']);
    assert.match(record.id, /^[0-9a-f-]{36}$/i);
    assert.equal(record.runSequence, 1);
    assert.equal(record.label, 'Reviewed output');
    assert.equal(record.outcome, outcome);
    assert.equal(record.runExitCode, 0);
    assert.equal(record.sourcePath, 'examples/main.kf');
    assert.equal(record.runtimeVersion, '0.1.0');
    assert.equal(record.knowledgePackVersion, '0.1.0');
    assert.equal(new Date(record.recordedAt).toISOString(), record.recordedAt);
    assert.equal(coordinator.state.evidence.reviewedCheckId, record.id);
    assert.equal(JSON.stringify(values.get(PROGRESS_KEY)).includes('PRIVATE_'), false);
  }
});

test('recordReviewedCheck rejects stale or duplicate current evidence but accepts a reused sequence after reload', async () => {
  const { coordinator, progressStore, run } = reviewedProgressFixture();
  coordinator.recordRunResult(run(1));
  const message = { type: 'recordReviewedCheck', runSequence: 1, label: 'First review', outcome: 'passed' };
  assert.equal((await coordinator.handleLearnerMessage(message)).kind, 'coaching');
  assert.equal((await coordinator.handleLearnerMessage(message)).kind, 'error');
  coordinator.recordRunResult(run(2));
  assert.equal((await coordinator.handleLearnerMessage(message)).kind, 'error');
  const next = new SessionCoordinator({ progressStore });
  next.restoreProgress();
  next.recordRunResult(run(1));
  assert.equal((await next.handleLearnerMessage({ ...message, label: 'After reload' })).kind, 'coaching');
  assert.deepEqual(progressStore.load().completedChecks.map(item => item.runSequence), [1, 1]);
});

test('recordReviewedCheck does not expose a record when progress save fails', async () => {
  const { coordinator, run } = reviewedProgressFixture();
  coordinator.recordRunResult(run(1));
  coordinator.progressStore.save = async () => { throw new Error('storage failed'); };
  assert.equal((await coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Review', outcome: 'passed' })).kind, 'error');
  assert.deepEqual(coordinator.state.completedChecks, []);
  assert.equal(coordinator.state.evidence.reviewedCheckId, undefined);
});

test('startSession preserves reviewed checks while clearing the prior goal', async () => {
  const { coordinator, progressStore, run } = reviewedProgressFixture();
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Old goal' });
  coordinator.state.legacyCompletedCheckIds = ['legacy-check'];
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones',
    milestones: [{ id: 'old', text: 'Old milestone' }] });
  coordinator.recordRunResult(run(1));
  await coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Review', outcome: 'passed' });
  const [saved] = progressStore.load().completedChecks;
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'New goal' });
  assert.equal(coordinator.state.goal, 'New goal');
  assert.equal(coordinator.state.confirmed, false);
  assert.equal(coordinator.state.evidence, null);
  assert.deepEqual(coordinator.state.completedChecks, [saved]);
  assert.deepEqual(coordinator.state.legacyCompletedCheckIds, ['legacy-check']);
  assert.deepEqual(progressStore.load().completedChecks, [saved]);
  assert.deepEqual(progressStore.load().legacyCompletedCheckIds, ['legacy-check']);
  assert.equal(progressStore.load().goal, '');
});

test('rejecting visible A while newer B diff opens cannot delete B', async () => {
  let openCount = 0;
  let openBEntered;
  const entered = new Promise(resolve => { openBEntered = resolve; });
  let releaseOpenB;
  const gate = new Promise(resolve => { releaseOpenB = resolve; });
  const vscode = { Uri: { parse: value => ({ scheme: 'kafe-proposal', toString: () => value }) },
    commands: { executeCommand: async () => {
      openCount++;
      if (openCount === 2) { openBEntered(); await gate; }
    } } };
  const proposalProvider = new CodeProposalProvider({ vscode });
  const uri = { scheme: 'file', toString: () => 'file:///workspace/test.kf' };
  const rawProposal = newText => ({ uri, documentVersion: 1,
    contentSha256: createHash('sha256').update('print(1)').digest('hex'), newText });
  let routed = 0;
  let modelCalls = 0;
  const coordinator = new SessionCoordinator({ proposalProvider,
    provider: { complete: async () => ({ text: 'Review the change',
      toolCalls: [{ id: `call-${++modelCalls}`, name: 'proposeCodeChange', arguments: { newText: 'model code' } }] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [], tools: [] }, sources: [] }) },
    toolRouter: { route: async () => rawProposal(++routed === 1 ? 'print(2)' : 'print(3)') } });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  assert.equal((await sendReviewed(coordinator, 'First proposal')).kind, 'proposal');
  const idA = coordinator.state.proposal.id;
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Second proposal' });
  const sendB = coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Second proposal', previewToken: coordinator.state.preview.token });
  await entered;
  const idB = proposalProvider.pending.id;
  assert.notEqual(idA, idB);
  assert.equal(coordinator.state.proposal, null, 'A must stop being actionable as soon as B owns the pending review');
  const rejectedA = await coordinator.handleLearnerMessage({ type: 'rejectProposal', id: idA });
  const pendingAfterReject = proposalProvider.pending?.id;
  releaseOpenB();
  const resultB = await sendB;
  assert.equal(rejectedA.kind, 'error');
  assert.match(rejectedA.text, /no matching|no longer|changed|unavailable/i);
  assert.equal(pendingAfterReject, idB);
  assert.equal(resultB.kind, 'proposal');
  assert.equal(coordinator.state.proposal.id, idB);
  assert.equal(proposalProvider.pending.id, idB);
});

function proposalRaceFixture() {
  const uri = { scheme: 'file', toString: () => 'file:///workspace/test.kf' };
  const document = { uri, languageId: 'kafe', version: 1, getText: () => 'print(1)', positionAt: offset => ({ offset }) };
  let readGate;
  let applyGate;
  let readEntered;
  let applyEntered;
  const readStarted = new Promise(resolve => { readEntered = resolve; });
  const applyStarted = new Promise(resolve => { applyEntered = resolve; });
  const waitRead = new Promise(resolve => { readGate = resolve; });
  const waitApply = new Promise(resolve => { applyGate = resolve; });
  let gatePhase = 'read';
  let writes = 0;
  class WorkspaceEdit { replace() {} }
  class Range { constructor(start, end) { this.start = start; this.end = end; } }
  const vscode = { Uri: { parse: value => ({ scheme: 'kafe-proposal', toString: () => value }) },
    Range, WorkspaceEdit, commands: { executeCommand: async () => {} },
    workspace: { openTextDocument: async () => {
      if (gatePhase === 'read') { readEntered(); await waitRead; }
      return document;
    }, applyEdit: async () => { writes++; applyEntered(); await waitApply; return true; } } };
  const proposalProvider = new CodeProposalProvider({ vscode });
  const summary = proposalProvider.stage({ uri, documentVersion: 1,
    contentSha256: createHash('sha256').update('print(1)').digest('hex'), newText: 'print(2)' });
  const ready = proposalProvider.open(summary.id);
  let clears = 0;
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {}, proposalProvider,
    progressStore: { clear: async () => { clears++; } } });
  coordinator.state.goal = 'Saved goal';
  coordinator.state.confirmed = true;
  coordinator.state.proposal = summary;
  return { coordinator, ready, summary, readStarted, applyStarted,
    releaseRead: () => readGate(), releaseApply: () => applyGate(),
    setGatePhase: value => { gatePhase = value; }, get writes() { return writes; }, get clears() { return clears; } };
}

function proposalResetFixture() {
  const uri = { scheme: 'file', toString: () => 'file:///workspace/test.kf' };
  const document = { uri, languageId: 'kafe', version: 1, getText: () => 'print(1)',
    positionAt: offset => ({ offset }) };
  let writes = 0;
  class WorkspaceEdit { replace() {} }
  class Range { constructor(start, end) { this.start = start; this.end = end; } }
  const vscode = { Uri: { parse: value => ({ scheme: 'kafe-proposal', toString: () => value }) },
    Range, WorkspaceEdit, commands: { executeCommand: async () => {} },
    workspace: { openTextDocument: async () => document,
      applyEdit: async () => { writes++; return true; } } };
  const proposalProvider = new CodeProposalProvider({ vscode });
  const progressStore = { clear: async () => { throw new Error('storage failed'); },
    clearSession: async () => { throw new Error('storage failed'); } };
  const coordinator = new SessionCoordinator({ proposalProvider, progressStore });
  coordinator.state.goal = 'Saved goal';
  coordinator.state.confirmed = true;
  const summary = proposalProvider.stage({ uri, documentVersion: 1,
    contentSha256: createHash('sha256').update('print(1)').digest('hex'), newText: 'print(2)' });
  coordinator.state.proposal = summary;
  return { coordinator, proposalProvider, summary, get writes() { return writes; } };
}

for (const action of ['clearProgress', 'startSession']) {
  test(`${action} storage failure keeps the opened proposal usable`, async () => {
    const f = proposalResetFixture();
    await f.proposalProvider.open(f.summary.id);
    const before = f.coordinator.state;
    const result = await f.coordinator.handleLearnerMessage({ type: action, goal: 'Next goal' });
    assert.equal(result.kind, 'error');
    assert.equal(f.coordinator.state, before);
    assert.equal(f.coordinator.state.goal, 'Saved goal');
    assert.equal(f.coordinator.state.proposal.id, f.summary.id);
    assert.equal(f.proposalProvider.pending.id, f.summary.id);
    assert.equal(f.proposalProvider.provideTextDocumentContent(f.proposalProvider.proposalUri(f.summary.id)), 'print(2)');
    assert.equal((await f.proposalProvider.accept(f.summary.id)).status, 'applied');
    assert.equal(f.writes, 1);
  });
}

test('accept and reject cannot consume a proposal while Clear Progress storage is pending', async () => {
  const f = proposalResetFixture();
  await f.proposalProvider.open(f.summary.id);
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  f.coordinator.progressStore.clear = async () => { entered(); await held; throw new Error('storage failed'); };
  const clearing = f.coordinator.handleLearnerMessage({ type: 'clearProgress' });
  await started;
  assert.equal((await f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id: f.summary.id })).kind, 'error');
  assert.equal((await f.coordinator.handleLearnerMessage({ type: 'rejectProposal', id: f.summary.id })).kind, 'error');
  assert.equal(f.coordinator.state.proposal.id, f.summary.id);
  assert.equal(f.proposalProvider.pending.id, f.summary.id);
  assert.equal(f.writes, 0);
  release();
  assert.equal((await clearing).kind, 'error');
  assert.equal((await f.proposalProvider.accept(f.summary.id)).status, 'applied');
});

for (const action of ['rejectProposal', 'clearProgress']) {
  test(`coordinator ${action} during source read cancels before applyEdit`, async () => {
    const f = proposalRaceFixture();
    await f.ready;
    const acceptance = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id: f.summary.id });
    await f.readStarted;
    const actionResult = await f.coordinator.handleLearnerMessage({ type: action, id: f.summary.id });
    f.releaseRead();
    const accepted = await acceptance;
    assert.equal(actionResult.kind, 'coaching');
    assert.match(accepted.text, /cancelled/);
    assert.equal(f.writes, 0);
    assert.equal(f.coordinator.state.proposal, null);
    assert.equal(f.clears, action === 'clearProgress' ? 1 : 0);
  });
}

test('coordinator startSession during source read cancels before applyEdit', async () => {
  const f = proposalRaceFixture();
  f.coordinator.progressStore.clearSession = async () => ({ completedChecks: [], legacyCompletedCheckIds: [] });
  await f.ready;
  const acceptance = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id: f.summary.id });
  await f.readStarted;
  const started = await f.coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Next goal' });
  f.releaseRead();
  const accepted = await acceptance;
  assert.equal(started.kind, 'coaching');
  assert.match(accepted.text, /cancelled/);
  assert.equal(f.writes, 0);
  assert.equal(f.coordinator.state.goal, 'Next goal');
  assert.equal(f.coordinator.state.proposal, null);
});

test('coordinator Reject and Clear stay busy after applyEdit starts and keep progress until result', async () => {
  const f = proposalRaceFixture();
  await f.ready;
  f.setGatePhase('apply');
  const acceptance = f.coordinator.handleLearnerMessage({ type: 'acceptProposal', id: f.summary.id });
  await f.applyStarted;
  const rejected = await f.coordinator.handleLearnerMessage({ type: 'rejectProposal', id: f.summary.id });
  const cleared = await f.coordinator.handleLearnerMessage({ type: 'clearProgress' });
  const stateBeforeResult = { goal: f.coordinator.state.goal, proposal: f.coordinator.state.proposal };
  f.releaseApply();
  const accepted = await acceptance;
  assert.equal(rejected.kind, 'error');
  assert.equal(cleared.kind, 'error');
  assert.match(rejected.text, /in progress/);
  assert.match(cleared.text, /in progress/);
  assert.equal(stateBeforeResult.goal, 'Saved goal');
  assert.equal(stateBeforeResult.proposal.id, f.summary.id);
  assert.equal(f.clears, 0);
  assert.equal(f.writes, 1);
  assert.equal(accepted.kind, 'coaching');
  assert.equal(f.coordinator.state.proposal, null);
});

test('busy Reject and Clear retain the in-flight proposal and persisted progress', async () => {
  let clears = 0;
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {},
    progressStore: { clear: async () => { clears++; } },
    proposalProvider: { reject: () => ({ status: 'busy' }), clear: () => ({ status: 'busy' }),
      prepareClear: () => ({ status: 'busy' }) } });
  coordinator.state.goal = 'Saved goal';
  coordinator.state.confirmed = true;
  coordinator.state.proposal = { id: 'opaque-1', description: 'Review proposed KAFE change' };
  const rejected = await coordinator.handleLearnerMessage({ type: 'rejectProposal', id: 'opaque-1' });
  assert.equal(rejected.kind, 'error');
  assert.match(rejected.text, /busy|being applied|in progress/i);
  assert.equal(coordinator.state.proposal.id, 'opaque-1');
  const cleared = await coordinator.handleLearnerMessage({ type: 'clearProgress' });
  assert.equal(cleared.kind, 'error');
  assert.match(cleared.text, /busy|being applied|in progress/i);
  assert.equal(coordinator.state.goal, 'Saved goal');
  assert.equal(coordinator.state.proposal.id, 'opaque-1');
  assert.equal(clears, 0);
});

test('duplicate Accept remains single-flight in coordinator and does not hide the first result', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {},
    proposalProvider: { accept: async () => { calls++; return calls === 1 ? gate : { status: 'invalid' }; } } });
  coordinator.state.proposal = { id: 'opaque-1', description: 'Review proposed KAFE change' };
  const first = coordinator.handleLearnerMessage({ type: 'acceptProposal', id: 'opaque-1' });
  const second = await coordinator.handleLearnerMessage({ type: 'acceptProposal', id: 'opaque-1' });
  const proposalAfterSecond = coordinator.state.proposal;
  release({ status: 'applied' });
  const firstResult = await first;
  assert.equal(second.kind, 'error');
  assert.match(second.text, /busy|in progress|being applied/i);
  assert.equal(calls, 1);
  assert.equal(proposalAfterSecond?.id, 'opaque-1');
  assert.equal(firstResult.kind, 'coaching');
  assert.equal(coordinator.state.proposal, null);
});

test('restored summary, confirmation save, new session and clear use progress store only', async () => {
  const writes = [];
  const progressStore = { load: () => ({ goal: 'Saved goal', milestones: [{ id: 'saved', text: 'Saved check' }], completedChecks: ['saved'], confirmed: true }),
    save: async state => writes.push({ type: 'save', state: { goal: state.goal, milestones: state.milestones, completedChecks: state.completedChecks } }),
    clearSession: async () => { writes.push({ type: 'clearSession' });
      return { completedChecks: ['saved'], legacyCompletedCheckIds: [] }; },
    clear: async () => writes.push({ type: 'clear' }) };
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {}, progressStore });
  coordinator.restoreProgress();
  assert.equal(coordinator.state.goal, 'Saved goal');
  assert.equal(coordinator.state.confirmed, true);
  assert.deepEqual(coordinator.state.completedChecks, ['saved']);
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'New goal' });
  assert.deepEqual(writes.at(-1), { type: 'clearSession' });
  assert.equal(coordinator.state.confirmed, false);
  assert.deepEqual(coordinator.state.completedChecks, ['saved']);
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'new', text: 'New check' }] });
  assert.equal(writes.at(-1).type, 'save');
  assert.equal(writes.at(-1).state.goal, 'New goal');
  await coordinator.handleLearnerMessage({ type: 'clearProgress' });
  assert.deepEqual(writes.at(-1), { type: 'clear' });
  assert.equal(coordinator.state.goal, '');
});

test('proposal tool result stays host-only; matching accept and reject use explicit ID', async () => {
  const calls = [];
  const raw = { uri: { scheme: 'file', toString: () => 'file:///secret.kf' }, documentVersion: 1,
    contentSha256: 'hash', newText: 'SECRET_PROPOSED_CODE' };
  const proposalHost = { stage: value => { calls.push(['stage', value]); return { id: 'opaque-1', description: 'Review proposed KAFE change' }; },
    open: async id => { calls.push(['open', id]); return { status: 'opened' }; },
    accept: async id => { calls.push(['accept', id]); return { status: 'applied' }; },
    reject: id => { calls.push(['reject', id]); return { status: 'rejected' }; }, clear: () => calls.push(['clear']) };
  const coordinator = new SessionCoordinator({ proposalProvider: proposalHost,
    provider: { complete: async () => ({ text: `Change to ${raw.newText} in file:///secret.kf`, toolCalls: [{ id: 'call-1', name: 'proposeCodeChange', arguments: { newText: raw.newText } }] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [], tools: [] }, sources: [] }) },
    toolRouter: { route: async () => raw } });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  assert.equal((await sendReviewed(coordinator, 'Propose a fix')).kind, 'proposal');
  assert.deepEqual(coordinator.state.proposal, { id: 'opaque-1', description: 'Review proposed KAFE change' });
  assert.ok(!JSON.stringify(coordinator.state).includes(raw.newText));
  assert.ok(!JSON.stringify(coordinator.state).includes('file:///secret.kf'));
  assert.deepEqual(calls.slice(-2).map(call => call[0]), ['stage', 'open']);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'acceptProposal', id: 'wrong' })).kind, 'error');
  assert.equal(calls.filter(call => call[0] === 'accept').length, 0);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'acceptProposal', id: 'opaque-1' })).kind, 'coaching');
  assert.deepEqual(calls.at(-1), ['accept', 'opaque-1']);
  assert.equal(coordinator.state.proposal, null);
});

test('reject, stale acceptance and clear discard pending proposal without applying', async () => {
  const calls = [];
  const proposalProvider = { reject: id => { calls.push(['reject', id]); return { status: 'rejected' }; },
    accept: async id => { calls.push(['accept', id]); return { status: 'stale' }; },
    clear: () => calls.push(['clear']),
    prepareClear: () => ({ status: 'ready', commit: () => calls.push(['clear']), rollback: () => {} }) };
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {}, proposalProvider });
  coordinator.state.proposal = { id: 'opaque-1', description: 'Review proposed KAFE change' };
  assert.equal((await coordinator.handleLearnerMessage({ type: 'rejectProposal', id: 'wrong' })).kind, 'error');
  assert.deepEqual(calls, []);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'rejectProposal', id: 'opaque-1' })).kind, 'coaching');
  assert.deepEqual(calls, [['reject', 'opaque-1']]);
  assert.equal(coordinator.state.proposal, null);
  coordinator.state.proposal = { id: 'opaque-2', description: 'Review proposed KAFE change' };
  const stale = await coordinator.handleLearnerMessage({ type: 'acceptProposal', id: 'opaque-2' });
  assert.equal(stale.kind, 'error');
  assert.match(stale.text, /changed/);
  assert.equal(coordinator.state.proposal, null);
  coordinator.state.proposal = { id: 'opaque-3', description: 'Review proposed KAFE change' };
  await coordinator.handleLearnerMessage({ type: 'clearProgress' });
  assert.equal(coordinator.state.proposal, null);
  assert.deepEqual(calls.at(-1), ['clear']);
  proposalProvider.reject = () => ({ status: 'failed' });
  coordinator.state.proposal = { id: 'opaque-4', description: 'Review proposed KAFE change' };
  assert.equal((await coordinator.handleLearnerMessage({ type: 'rejectProposal', id: 'opaque-4' })).kind, 'error');
  assert.equal(coordinator.state.proposal, null);
});

test('provider failure shows safe retry status and retry reuses the exact reviewed payload once', async () => {
  let calls = 0;
  const sent = [];
  const payload = { messages: [{ role: 'user', content: 'EXACT_REVIEWED_CONTENT' }], tools: [] };
  const coordinator = new SessionCoordinator({
    provider: { complete: async request => { sent.push(request); calls++; if (calls === 1) throw new ProviderError('rate_limit'); return { text: 'Try one more example.', toolCalls: [] }; } },
    contextComposer: { compose: async () => ({ payload, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  const token = coordinator.state.preview.token;
  assert.equal(calls, 0);
  const failed = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: token });
  assert.equal(failed.kind, 'error');
  assert.equal(coordinator.state.providerStatus, failed.text);
  assert.equal(coordinator.state.preview.token, token);
  assert.equal(coordinator.state.retryAvailable, true);
  assert.equal(calls, 1);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: token })).kind, 'error');
  assert.equal(calls, 1);
  const retry = await coordinator.handleLearnerMessage({ type: 'retryMessage', previewToken: token });
  assert.equal(retry.kind, 'coaching');
  assert.equal(calls, 2);
  assert.deepEqual(sent[0].messages, payload.messages);
  assert.deepEqual(sent[1].messages, payload.messages);
  assert.equal(coordinator.state.retryAvailable, false);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'retryMessage', previewToken: token })).kind, 'error');
  assert.equal(calls, 2);
});

test('non-provider failure refreshes the same request preview before another explicit send', async () => {
  let providerCalls = 0;
  let composeCalls = 0;
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => { providerCalls++; throw new Error('internal failure detail'); } },
    contextComposer: { compose: async ({ request }) => {
      composeCalls++;
      return { payload: { messages: [
        { role: 'user', content: `REVIEWED_CONTEXT_${composeCalls}` },
        { role: 'user', content: request },
      ], tools: [] }, sources: [] };
    } },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Question' });
  const firstToken = coordinator.state.preview.token;
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Question', previewToken: firstToken });

  assert.equal(turn.kind, 'error');
  assert.match(turn.text, /refreshed context preview/i);
  assert.doesNotMatch(turn.text, /internal failure detail/);
  assert.equal(providerCalls, 1);
  assert.equal(composeCalls, 2);
  assert.notEqual(coordinator.state.preview.token, firstToken);
  assert.equal(coordinator.state.preview.draft, 'Question');
  assert.equal(coordinator.state.preview.payload.messages[0].content, 'REVIEWED_CONTEXT_2');
  assert.notEqual(coordinator.pendingPreview.attempted, true);
  assert.equal(coordinator.state.retryAvailable, false);
});

const uri = path => ({ scheme: 'file', path, toString() { return `file://${path}`; } });

async function sendReviewed(coordinator, text) {
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text });
  return coordinator.handleLearnerMessage({ type: 'sendMessage', text, previewToken: coordinator.state.preview.token });
}

test('a goal proposes milestones and coaching waits for learner confirmation', async () => {
  let calls = 0;
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => { calls++; return { text: 'A hint', toolCalls: [] }; } },
    contextComposer: { compose: async () => ({ payload: { messages: [], tools: [] }, sources: [] }) },
  });
  const start = await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Learn KAFE lists' });
  assert.equal(start.kind, 'coaching');
  assert.equal(coordinator.state.goal, 'Learn KAFE lists');
  assert.ok(coordinator.state.milestones.length >= 2);
  assert.equal(coordinator.state.confirmed, false);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help' })).kind, 'error');
  assert.equal(calls, 0);
  const confirmed = [{ id: 'create', text: 'Create a list' }, { id: 'explain', text: 'Explain its output' }];
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: confirmed });
  const turn = await sendReviewed(coordinator, 'Help');
  assert.equal(turn.text, 'A hint');
  assert.equal(calls, 1);
  assert.deepEqual(coordinator.state.milestones, confirmed);
});

test('a passing run and explanation remain evidence and observations, never mastery', async () => {
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: 'Try another example.', toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Functions' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'write', text: 'Write a function' }] });
  const run = { stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: 'file:///work/main.kf', runSequence: 1 };
  coordinator.recordRunResult(run);
  const turn = await sendReviewed(coordinator, 'I think it returns a value.');
  assert.deepEqual(turn.evidence, run);
  assert.equal(coordinator.state.observations.at(-1), 'I think it returns a value.');
  assert.deepEqual(coordinator.state.completedChecks, []);
  assert.doesNotMatch(turn.text, /mastered|mastery/i);
});

test('coordinator previews run evidence only for its source document after an active-file switch', async () => {
  let active = uri('/work/main.kf');
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: 'Inspect the output.', toolCalls: [] }) },
    contextComposer: new ContextComposer({
      documentReader: { readDocument: async source => ({ uri: source, text: 'show(1)', version: 1 }) },
      knowledgeRetriever: { search: async () => [] },
    }),
    getContext: () => ({ activeDocument: { uri: active, text: 'show(1)', version: 1 } }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Inspect a list' }] });
  coordinator.recordRunResult({ stdout: 'SOURCE_A_RESULT', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: active.toString(), runSequence: 1 });
  active = uri('/work/other.kf');
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  assert.equal(JSON.stringify(coordinator.state.preview.payload).includes('SOURCE_A_RESULT'), false);
  assert.equal(coordinator.state.contextSources.some(source => source.id === 'run-result'), false);
  assert.equal(coordinator.state.evidence.sourceUri, uri('/work/main.kf').toString());
});

test('coordinator forwards exactly the composed payload with optional sources excluded', async () => {
  let sent;
  const selected = uri('/work/extra.kf');
  const selectedId = selectedSourceId(selected);
  const coordinator = new SessionCoordinator({
    provider: { complete: async value => { sent = value; return { text: 'Hint', toolCalls: [] }; } },
    contextComposer: { compose: async ({ includedSourceIds }) => ({
      payload: { messages: [{ role: 'user', content: includedSourceIds.includes(selectedId) ? 'file' : 'no file' }], tools: [] },
      sources: [{ id: selectedId, category: 'selected-file', label: 'extra.kf', included: includedSourceIds.includes(selectedId) }],
    }) },
    getContext: () => ({ candidateUris: [selected] }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'use', text: 'Use a list' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: coordinator.state.preview.token });
  assert.deepEqual(sent.messages, [{ role: 'user', content: 'no file' }]);
  assert.equal(turn.contextSources[0].included, false);
});

test('coordinator returns allowlisted tool evidence to the provider before final coaching', async () => {
  const calls = [];
  const provider = { complete: async payload => {
    calls.push(payload);
    return calls.length === 1
      ? { text: '', toolCalls: [{ id: 'call-1', name: 'searchKafeKnowledge', arguments: { query: 'lists' } }] }
      : { text: 'Try indexing the list.', toolCalls: [] };
  } };
  const coordinator = new SessionCoordinator({
    provider,
    contextComposer: { compose: async () => ({ payload: { messages: [
      { role: 'user', content: '[Source knowledge:language/lists.md#1]\nList indexing starts at zero.' },
      { role: 'user', content: 'Help' },
    ], tools: [] }, sources: [{ id: 'knowledge:language/lists.md#1', category: 'knowledge', label: 'language: language/lists.md', included: true }] }) },
    toolRouter: { route: async () => [{ id: 'language/lists.md#1', path: 'language/lists.md', category: 'language', text: 'List indexing starts at zero.' }] },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'index', text: 'Index a list' }] });
  const turn = await sendReviewed(coordinator, 'Help');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].messages.at(-1).role, 'tool');
  assert.match(calls[1].messages.at(-1).content, /Source already included: knowledge:language\/lists.md#1/);
  assert.equal(turn.text, 'Try indexing the list.');
  assert.ok(turn.contextSources.some(source => source.id === 'knowledge:language/lists.md#1'));
});

test('follow-up read tools refer to already previewed source content without resending it', async () => {
  const calls = [];
  const coordinator = new SessionCoordinator({
    provider: { complete: async payload => {
      calls.push(payload);
      return calls.length === 1
        ? { text: '', toolCalls: [{ id: 'read-1', name: 'readActiveDocument', arguments: {} }] }
        : { text: 'Check the output.', toolCalls: [] };
    } },
    contextComposer: { compose: async () => ({
      payload: { messages: [{ role: 'user', content: '[Source active-file]\nPRIVATE_KAFE_CODE' }], tools: [] },
      sources: [{ id: 'active-file', category: 'active-file', label: 'main.kf', included: true }],
    }) },
    toolRouter: { route: async () => ({ uri: 'file:///main.kf', text: 'PRIVATE_KAFE_CODE', version: 1 }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Run a program' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'write', text: 'Write code' }] });
  await sendReviewed(coordinator, 'Help');
  assert.equal(JSON.stringify(calls[1].messages).split('PRIVATE_KAFE_CODE').length - 1, 1);
  assert.equal(calls[1].messages.at(-1).content, 'Source already included: active-file');
});

test('generated and confirmed milestones use view-compatible IDs and text', async () => {
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {} });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  assert.ok(coordinator.state.milestones.every(item => typeof item.id === 'string' && item.id && typeof item.text === 'string' && item.text));
  const input = coordinator.state.milestones.map(item => ({ id: item.id, text: `${item.text} edited` }));
  assert.equal((await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: input })).kind, 'coaching');
  assert.deepEqual(coordinator.state.milestones, input);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'x', text: '' }] })).kind, 'error');
  assert.equal((await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'x', text: 'One' }, { id: 'x', text: 'Two' }] })).kind, 'error');
  assert.equal((await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: ' x ', text: 'One' }, { id: 'x', text: 'Two' }] })).kind, 'error');
});

test('local draft preview precedes provider call and the exact reviewed payload is sent once', async () => {
  const calls = [];
  const selected = uri('/work/extra.kf');
  const composer = new ContextComposer({
    documentReader: { readDocument: async source => ({ uri: source, text: 'OPTIONAL_SECRET', version: 1 }) },
    knowledgeRetriever: { search: async () => [{ id: 'language/lists.md#1', path: 'language/lists.md', category: 'language', text: 'Indexing starts at zero.' }] },
  });
  const coordinator = new SessionCoordinator({
    provider: { complete: async payload => { calls.push(payload); return { text: 'Try an index.', toolCalls: [] }; } },
    contextComposer: composer,
    getContext: () => ({ activeDocument: { uri: uri('/work/main.kf'), text: 'show(1)', version: 2 }, candidateUris: [selected] }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
  assert.equal((await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help with lists' })).kind, 'error');
  assert.equal(calls.length, 0);
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help with lists' });
  const first = coordinator.state.preview;
  assert.ok(first.token);
  assert.equal(JSON.stringify(first.payload).includes('OPTIONAL_SECRET'), false);
  assert.equal(calls.length, 0);
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: selectedSourceId(selected), included: true });
  const reviewed = coordinator.state.preview;
  assert.notEqual(reviewed.token, first.token);
  assert.ok(JSON.stringify(reviewed.payload).includes('OPTIONAL_SECRET'));
  assert.equal((await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help with lists', previewToken: first.token })).kind, 'error');
  assert.equal(calls.length, 0);
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help with lists', previewToken: reviewed.token });
  assert.equal(turn.text, 'Try an index.');
  assert.equal(calls.length, 1);
  assert.deepEqual({ messages: calls[0].messages, tools: calls[0].tools }, reviewed.payload);
  assert.ok(JSON.stringify(calls[0]).includes('OPTIONAL_SECRET'));
});

test('new candidates default to excluded; a selected URI stays included after it leaves visible editors', async () => {
  const retained = uri('/work/retained.kf');
  const newcomer = uri('/work/new.kf');
  let candidateUris = [retained];
  const coordinator = new SessionCoordinator({
    provider: {},
    contextComposer: new ContextComposer({
      documentReader: { readDocument: async source => ({ uri: source, text: source === retained ? 'RETAINED' : 'NEW', version: 1 }) },
      knowledgeRetriever: { search: async () => [] },
    }),
    getContext: () => ({ candidateUris }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  assert.equal(JSON.stringify(coordinator.state.preview.payload).includes('RETAINED'), false);
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: selectedSourceId(retained), included: true });
  candidateUris = [newcomer];
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help again' });
  const payload = JSON.stringify(coordinator.state.preview.payload);
  assert.ok(payload.includes('RETAINED'));
  assert.equal(payload.includes('NEW'), false);
  assert.ok(coordinator.state.contextSources.some(source => source.id === selectedSourceId(retained) && source.included));
  assert.ok(coordinator.state.contextSources.some(source => source.id === selectedSourceId(newcomer) && !source.included));
});

test('source selection invalidates a reviewed preview and a stale token cannot send', async () => {
  const selected = uri('/work/extra.kf');
  let calls = 0;
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => { calls++; return { text: 'Hint', toolCalls: [] }; } },
    contextComposer: new ContextComposer({
      documentReader: { readDocument: async source => ({ uri: source, text: 'SELECTED_CONTENT', version: 1 }) },
      knowledgeRetriever: { search: async () => [] },
    }),
    getContext: () => ({ candidateUris: [selected] }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  const stale = coordinator.state.preview.token;
  assert.equal((await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: selectedSourceId(selected), included: 'true' })).kind, 'error');
  assert.equal(coordinator.state.preview.token, stale);
  assert.equal((await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: 'selected:ABC', included: true })).kind, 'error');
  assert.equal((await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: selectedSourceId(selected), included: true })).kind, 'coaching');
  assert.notEqual(coordinator.state.preview.token, stale);
  assert.ok(JSON.stringify(coordinator.state.preview.payload).includes('SELECTED_CONTENT'));
  assert.equal((await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: stale })).kind, 'error');
  assert.equal(calls, 0);
});

test('revoking a selected source while provider responds prevents stale proposal routing and preserves the new preview', async () => {
  const selected = uri('/work/extra.kf');
  const sourceId = selectedSourceId(selected);
  let releaseProvider;
  let providerEntered;
  const entered = new Promise(resolve => { providerEntered = resolve; });
  const heldResponse = new Promise(resolve => { releaseProvider = resolve; });
  let routes = 0;
  let stages = 0;
  let opens = 0;
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => { providerEntered(); return heldResponse; } },
    contextComposer: new ContextComposer({
      documentReader: { readDocument: async source => ({ uri: source, text: 'OPTIONAL_CODE', version: 1 }) },
      knowledgeRetriever: { search: async () => [] },
    }),
    toolRouter: { route: async () => { routes++; return { uri: selected, documentVersion: 1,
      contentSha256: '0'.repeat(64), newText: 'changed' }; } },
    proposalProvider: { clear: () => ({ status: 'cleared' }), stage: () => { stages++; return { id: 'proposal' }; },
      open: async () => { opens++; return { status: 'opened' }; } },
    getContext: () => ({ candidateUris: [selected] }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: sourceId, included: true });
  const oldToken = coordinator.state.preview.token;
  const sending = coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: oldToken });
  await entered;
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: sourceId, included: false });
  const newPreview = coordinator.state.preview;
  assert.notEqual(newPreview.token, oldToken);
  assert.equal(JSON.stringify(newPreview.payload).includes('OPTIONAL_CODE'), false);
  releaseProvider({ text: '', toolCalls: [{ id: 'proposal-call', name: 'proposeCodeChange',
    arguments: { sourceId, newText: 'changed' } }] });
  assert.equal((await sending).kind, 'error');
  assert.equal(routes, 0);
  assert.equal(stages, 0);
  assert.equal(opens, 0);
  assert.equal(coordinator.state.preview?.token, newPreview.token);
  assert.equal(coordinator.pendingPreview?.token, newPreview.token);
  assert.equal(coordinator.state.proposal, null);
});

test('revoking a selected source during tool routing prevents proposal staging', async () => {
  const selected = uri('/work/extra.kf');
  const sourceId = selectedSourceId(selected);
  let routeEntered;
  const entered = new Promise(resolve => { routeEntered = resolve; });
  let releaseRoute;
  const heldRoute = new Promise(resolve => { releaseRoute = resolve; });
  let stages = 0;
  let opens = 0;
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: '', toolCalls: [{ id: 'proposal-call',
      name: 'proposeCodeChange', arguments: { sourceId, newText: 'changed' } }] }) },
    contextComposer: new ContextComposer({
      documentReader: { readDocument: async source => ({ uri: source, text: 'OPTIONAL_CODE', version: 1 }) },
      knowledgeRetriever: { search: async () => [] },
    }),
    toolRouter: { route: async () => { routeEntered(); return heldRoute; } },
    proposalProvider: { clear: () => ({ status: 'cleared' }), stage: () => { stages++; return { id: 'proposal' }; },
      open: async () => { opens++; return { status: 'opened' }; } },
    getContext: () => ({ candidateUris: [selected] }),
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'One' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: sourceId, included: true });
  const sending = coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Help', previewToken: coordinator.state.preview.token });
  await entered;
  await coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: sourceId, included: false });
  const newToken = coordinator.state.preview.token;
  releaseRoute({ uri: selected, documentVersion: 1, contentSha256: '0'.repeat(64), newText: 'changed' });
  assert.equal((await sending).kind, 'error');
  assert.equal(stages, 0);
  assert.equal(opens, 0);
  assert.equal(coordinator.state.preview?.token, newToken);
  assert.equal(coordinator.pendingPreview?.token, newToken);
});

test('new model-requested knowledge is previewed before any provider follow-up request', async () => {
  const calls = [];
  const coordinator = new SessionCoordinator({
    provider: { complete: async payload => {
      calls.push(payload);
      return calls.length < 3
        ? { text: '', toolCalls: [{ id: `lookup-${calls.length}`, name: 'searchKafeKnowledge', arguments: { query: 'unpreviewed topic' } }] }
        : { text: 'Use the reviewed passage as a clue.', toolCalls: [] };
    } },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Question' }], tools: [] }, sources: [] }) },
    toolRouter: { route: async () => [{ id: 'language/new.md#1', path: 'language/new.md', category: 'language', text: 'UNREVIEWED_CONTENT' }] },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
  const firstTurn = await sendReviewed(coordinator, 'Question');
  const refreshedPreview = coordinator.state.preview;
  assert.equal(firstTurn.kind, 'coaching');
  assert.match(firstTurn.text, /review.*preview/i);
  assert.equal(calls.length, 1, 'the provider must not receive a follow-up before learner review');
  assert.match(JSON.stringify(refreshedPreview.payload), /UNREVIEWED_CONTENT/);
  assert.ok(refreshedPreview.payload.messages.some(message =>
    message.content === '[Source knowledge:language/new.md#1]\nUNREVIEWED_CONTENT'));
  assert.ok(coordinator.state.contextSources.some(source => source.id === 'knowledge:language/new.md#1' && source.included));

  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Question', previewToken: refreshedPreview.token });
  assert.equal(turn.kind, 'coaching');
  assert.equal(turn.text, 'Use the reviewed passage as a clue.');
  assert.equal(calls.length, 3);
  assert.equal(JSON.stringify(calls[0].messages).includes('UNREVIEWED_CONTENT'), false);
  assert.ok(JSON.stringify(calls[1].messages).includes('UNREVIEWED_CONTENT'));
  assert.match(calls[2].messages.at(-1).content, /Source already included: knowledge:language\/new\.md#1/);
  assert.equal(coordinator.state.preview, null);
});

test('a model mastery claim based on a passing run and explanation is replaced', async () => {
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: 'You have mastered KAFE because your program passed and your explanation is correct.', toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Explain' }], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Functions' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Write a function' }] });
  coordinator.recordRunResult({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: 'file:///work/main.kf', runSequence: 1 });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'I think it returns a value.' });
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'I think it returns a value.', previewToken: coordinator.state.preview.token });
  assert.equal(turn.kind, 'coaching');
  assert.doesNotMatch(turn.text, /you have mastered|mastery confirmed/i);
  assert.match(turn.text, /do not establish mastery/i);
  assert.equal(coordinator.state.completedChecks.length, 0);
});

test('a claim that the learner explanation proves mastery is replaced', async () => {
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: 'Your explanation proves mastery of KAFE lists.', toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Explain' }], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Explain a list' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Here is my explanation.' });
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Here is my explanation.', previewToken: coordinator.state.preview.token });
  assert.doesNotMatch(turn.text, /proves mastery/i);
  assert.match(turn.text, /do not establish mastery/i);
});

test('a claim that a passing run proves mastery is replaced', async () => {
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: 'A passing run proves mastery of KAFE.', toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Run passed' }], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'KAFE syntax' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Write syntax' }] });
  await coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Run passed' });
  const turn = await coordinator.handleLearnerMessage({ type: 'sendMessage', text: 'Run passed', previewToken: coordinator.state.preview.token });
  assert.doesNotMatch(turn.text, /proves mastery/i);
  assert.match(turn.text, /do not establish mastery/i);
});

for (const { claim, request } of [
  { claim: 'A passing run demonstrates mastery of KAFE.', request: 'My run passed.' },
  { claim: 'Mastery was demonstrated by a passing run.', request: 'My run passed.' },
  { claim: 'Your explanation is proof of KAFE mastery.', request: 'Here is my explanation.' },
]) {
  test(`unsupported mastery certification is replaced: ${claim}`, async () => {
    const coordinator = new SessionCoordinator({
      provider: { complete: async () => ({ text: claim, toolCalls: [] }) },
      contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: request }], tools: [] }, sources: [] }) },
    });
    await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'KAFE lists' });
    await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Explain and run a list' }] });
    coordinator.recordRunResult({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: 'file:///work/main.kf', runSequence: 1 });
    const turn = await sendReviewed(coordinator, request);
    assert.notEqual(turn.text, claim);
    assert.match(turn.text, /do not establish mastery/i);
    assert.equal(coordinator.state.messages.at(-1).text, turn.text);
    assert.deepEqual(coordinator.state.completedChecks, []);
  });
}

test('ordinary hint and next-step coaching is preserved', async () => {
  const hint = 'Try indexing the first list item, then explain its output.';
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: hint, toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Help' }], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
  assert.equal((await sendReviewed(coordinator, 'Help')).text, hint);
});

for (const { claim, request } of [
  { claim: 'A passing run proves you understand KAFE.', request: 'My run passed.' },
  { claim: 'Your explanation is proof that you understand KAFE lists.', request: 'Here is my explanation.' },
  { claim: 'Understanding was confirmed by your explanation.', request: 'Here is my explanation.' },
  { claim: 'Your successful run shows you understand this concept.', request: 'My run passed.' },
  { claim: 'Your explanation shows you learned how KAFE lists work.', request: 'Here is my explanation.' },
  { claim: 'A passing run is a clear sign that you know KAFE.', request: 'My run passed.' },
]) {
  test(`run or explanation cannot certify understanding: ${claim}`, async () => {
    const coordinator = new SessionCoordinator({
      provider: { complete: async () => ({ text: claim, toolCalls: [] }) },
      contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: request }], tools: [] }, sources: [] }) },
    });
    await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'KAFE lists' });
    await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Explain and run a list' }] });
    coordinator.recordRunResult({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: 'file:///work/main.kf', runSequence: 1 });
    const turn = await sendReviewed(coordinator, request);
    assert.notEqual(turn.text, claim);
    assert.match(turn.text, /do not establish mastery/i);
    assert.equal(coordinator.state.messages.at(-1).text, turn.text);
    assert.deepEqual(coordinator.state.completedChecks, []);
  });
}

test('ordinary guidance about how to understand a KAFE concept is preserved', async () => {
  const guidance = 'To understand list indexing, try the first and last positions, then compare their outputs.';
  const coordinator = new SessionCoordinator({
    provider: { complete: async () => ({ text: guidance, toolCalls: [] }) },
    contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Help' }], tools: [] }, sources: [] }) },
  });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
  assert.equal((await sendReviewed(coordinator, 'Help')).text, guidance);
});

for (const guidance of [
  'To understand list indexing, show the first and last outputs.',
  'To understand your explanation, show the intermediate output and inspect each step.',
  'Your explanation shows how to understand KAFE lists.',
  'A passing run shows where to inspect the output so you understand the result.',
  'To understand, show your explanation and inspect each step.',
]) {
  test(`ordinary show-and-inspect guidance is preserved: ${guidance}`, async () => {
    const coordinator = new SessionCoordinator({
      provider: { complete: async () => ({ text: guidance, toolCalls: [] }) },
      contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Help' }], tools: [] }, sources: [] }) },
    });
    await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
    await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
    assert.equal((await sendReviewed(coordinator, 'Help')).text, guidance);
  });
}

for (const guidance of [
  'To build mastery of KAFE lists, practice indexing one item at a time.',
  'To become proficient, explain one more run result in your own words.',
  'Here is how to master KAFE lists through practice.',
  'You can master KAFE lists with more examples.',
]) {
  test(`ordinary practice guidance with learning vocabulary is preserved: ${guidance}`, async () => {
    const coordinator = new SessionCoordinator({
      provider: { complete: async () => ({ text: guidance, toolCalls: [] }) },
      contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'Help' }], tools: [] }, sources: [] }) },
    });
    await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
    await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
    assert.equal((await sendReviewed(coordinator, 'Help')).text, guidance);
  });
}

for (const claim of [
  'You mastered KAFE.',
  'You have mastered KAFE.',
  'The learner mastered KAFE.',
  'You are a master of KAFE.',
  'You now master KAFE.',
]) {
  test(`direct learner-mastery claim is replaced: ${claim}`, async () => {
    const coordinator = new SessionCoordinator({
      provider: { complete: async () => ({ text: claim, toolCalls: [] }) },
      contextComposer: { compose: async () => ({ payload: { messages: [{ role: 'user', content: 'How am I doing?' }], tools: [] }, sources: [] }) },
    });
    await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'KAFE lists' });
    await coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'm1', text: 'Index a list' }] });
    const turn = await sendReviewed(coordinator, 'How am I doing?');
    assert.notEqual(turn.text, claim);
    assert.match(turn.text, /do not establish mastery/i);
    assert.equal(coordinator.state.messages.at(-1).text, turn.text);
  });
}
