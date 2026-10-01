const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createRunFileHandler, createProviderKeyHandlers, createClearProgressHandler, createTutorHost, ANTLR_COMMAND } = require('../../extension');
const PINNED_RUNTIME = require('../../src/runtimeManifest').runtime;
const { MAX_FILE_BYTES } = require('../../src/tutor/DevelopmentKnowledgePack');
const { knowledgeContentDigest } = require('../../src/tutor/KnowledgeRetriever');
const { randomUUID } = require('node:crypto');

function conversationHostFixture() {
  const listeners = {}, calls = [], reads = [], watcher = {}, disposals = [];
  const uri = name => ({ scheme: 'file', fsPath: `C:/workspace/${name}`, toString: () => `file:///C:/workspace/${name}` });
  const document = (name, text) => ({ uri: uri(name), languageId: 'kafe', version: 1, text, getText() { reads.push(name); return this.text; } });
  const active = document('main.kf', 'ACTIVE'), optional = document('optional.kf', 'OPTIONAL_OLD'), excluded = document('excluded.kf', 'EXCLUDED');
  const documents = new Map([active, optional, excluded].map(d => [d.uri.toString(), d]));
  const on = name => fn => { listeners[name] = fn; return { dispose() { disposals.push(name); } }; };
  const vscode = { Uri: { parse: value => documents.get(value)?.uri || uri('') },
    window: { activeTextEditor: { document: active }, visibleTextEditors: [active, optional, excluded].map(document => ({ document })),
      onDidChangeActiveTextEditor: on('active'), onDidChangeVisibleTextEditors: on('visible') },
    workspace: { isTrusted: true, getWorkspaceFolder: () => ({ uri: uri('') }),
      openTextDocument: async u => documents.get(u.toString()),
      onDidChangeTextDocument: on('change'), onDidOpenTextDocument: on('open'), onDidCloseTextDocument: on('close'),
      onDidChangeWorkspaceFolders: on('workspace'), onDidGrantWorkspaceTrust: on('trust'),
      createFileSystemWatcher() { for (const name of ['Change', 'Create', 'Delete']) watcher[`onDid${name}`] = fn => { watcher[name.toLowerCase()] = fn; return { dispose() {} }; }; watcher.dispose = () => disposals.push('watcher'); return watcher; } } };
  let availabilityHook;
  const host = createTutorHost({ vscode, extensionUri: {}, secrets: {}, runtimeManager: {
    getReadyKnowledgePack: async () => { if (availabilityHook) await availabilityHook(); return { status: 'unavailable', code: 'knowledge_missing' }; } },
    provider: { async *stream({ request }) { calls.push(request); yield { type: 'complete', text: 'Answer', toolCalls: [], finishReason: 'stop' }; } } });
  return { host, vscode, listeners, watcher, active, optional, excluded, reads, calls, disposals,
    setAvailabilityHook: fn => { availabilityHook = fn; } };
}

function contextRunEnvelope(host) {
  const s = host.coordinator.snapshot();
  assert.ok(s.contextActions, 'production host must project contextual capabilities');
  const action = s.contextActions.actions.find(a => a.type === 'runFile' && a.enabled);
  assert.ok(action, 'production issuer must bind the eligible active file');
  return { type: 'invokeAction', sessionId: s.sessionId, generation: s.generation,
    entryId: s.contextActions.entryId, actionId: action.id, args: action.args };
}

test('production contextual Run names its target and launches that file after focus changes without readiness work', async () => {
  const f = conversationHostFixture(), terminals = [], launched = []; let cancels = 0, finish, knowledge = 0, closes = 0;
  f.setAvailabilityHook(async () => { knowledge++; });
  f.vscode.EventEmitter = class { constructor() { this.listeners = []; this.event = fn => this.listeners.push(fn); } fire(value) { this.listeners.forEach(fn => fn(value)); } dispose() {} };
  f.vscode.window.createTerminal = options => { terminals.push(options); return { show() {} }; };
  f.host.actions.runFile = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeMode: 'contributor', runtimeRoot: 'C:/runtime' }) },
    onRunState: e => f.host.actions.recordRunState(e), onRunResult: r => f.host.actions.recordRunResult(r),
    startKafeFile: options => { launched.push(options); return { completion: new Promise(r => { finish = r; }), cancel() { cancels++; }, sendInput() {} }; } });
  try {
    await f.host.readiness; const action = contextRunEnvelope(f.host);
    assert.match(f.host.coordinator.snapshot().contextActions.actions[0].label, /main\.kf/);
    assert.deepEqual(action.args, { targetUri: 'file:///C:/workspace/main.kf' }); assert.deepEqual(f.host.coordinator.snapshot().entries, []);
    f.vscode.window.activeTextEditor = { document: f.optional }; f.listeners.active(); await f.host.actions.refreshContext();
    assert.equal((await f.host.tutorView.onMessage(action)).status, 'completed');
    assert.equal((await f.host.tutorView.onMessage(action)).status, 'stale'); assert.equal(terminals.length, 1);
    const pty = terminals[0].pty; pty.onDidClose(() => { closes++; }); pty.open();
    assert.equal(launched[0].filePath, 'C:/workspace/main.kf'); assert.equal(knowledge, 0);
    f.host.coordinator.newConversation(); await f.host.actions.refreshContext(); assert.equal(cancels, 0);
    finish({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false }); await new Promise(r => setImmediate(r));
    assert.equal(closes, 1); assert.equal(cancels, 0); assert.deepEqual(f.host.coordinator.snapshot().entries, []);
  } finally { f.host.dispose(); }
});

for (const revoke of ['trust', 'workspace', 'delete', 'reset']) test(`production contextual Run capability cannot launch after ${revoke}`, async () => {
  const f = conversationHostFixture(); let runs = 0; f.host.actions.runFile = async () => { runs++; return { status: 'completed' }; };
  try {
    await f.host.readiness; const action = contextRunEnvelope(f.host);
    if (revoke === 'trust') { f.vscode.workspace.isTrusted = false; f.listeners.trust(); }
    if (revoke === 'workspace') { f.vscode.workspace.getWorkspaceFolder = () => undefined; f.listeners.workspace(); }
    if (revoke === 'delete') { f.vscode.window.activeTextEditor = { document: f.optional }; f.listeners.active(); await f.host.actions.refreshContext(); f.watcher.delete(f.active.uri); }
    if (revoke === 'reset') f.host.coordinator.newConversation();
    assert.ok(['stale', 'unavailable'].includes((await f.host.tutorView.onMessage(action)).status)); assert.equal(runs, 0);
  } finally { f.host.dispose(); }
});

test('runtime setup is issued only for an explicit native Run with typed missing runtime and never downloads automatically', async () => {
  const f = conversationHostFixture(); let installs = 0, checks = 0;
  f.vscode.window.showInformationMessage = async () => {};
  f.host.actions.runFile = createRunFileHandler({ vscode: f.vscode, runtimeManager: { resolveWorkspace: async () => ({ status: 'missing' }) } });
  f.host.actions.runtimeManager = { installRuntime: async ({ onProgress }) => { installs++; onProgress({ stage: 'checking' }); return { status: 'unavailable' }; } };
  f.host.actions.getReadiness = async () => { checks++; return { trusted: true }; };
  try {
    await f.host.readiness; assert.equal(checks, 0); assert.equal(installs, 0);
    assert.deepEqual(f.host.coordinator.snapshot().entries, []);
    assert.equal((await f.host.tutorView.onMessage(contextRunEnvelope(f.host))).code, 'runtime_unavailable');
    const setup = actionEnvelope(f.host, 'installRuntime'); assert.equal(installs, 0); assert.equal(checks, 0);
    assert.equal((await f.host.tutorView.onMessage(setup)).status, 'unavailable'); assert.equal(installs, 1);
    assert.equal((await f.host.tutorView.onMessage(setup)).status, 'stale'); assert.equal(installs, 1);
  } finally { f.host.dispose(); }
});

test('failed contextual Run cannot project an old-target button after native focus changes', async () => {
  const f = conversationHostFixture();
  f.host.actions.runFile = async () => {
    f.vscode.window.activeTextEditor = { document: f.optional }; f.listeners.active(); await f.host.actions.refreshContext();
    throw new Error('private failure payload');
  };
  try {
    await f.host.readiness; const issued = contextRunEnvelope(f.host);
    assert.equal((await f.host.tutorView.onMessage(issued)).status, 'failed');
    assert.deepEqual(f.host.coordinator.snapshot().contextActions.actions.filter(a => a.enabled).map(a => a.args.targetUri), ['file:///C:/workspace/optional.kf']);
    assert.ok(!JSON.stringify(f.host.coordinator.snapshot()).includes('private failure payload'));
    assert.equal((await f.host.tutorView.onMessage(issued)).status, 'stale');
  } finally { f.host.dispose(); }
});

for (const code of ['trust_unavailable', 'target_unavailable', 'parser_unavailable', undefined]) test(`unrelated native Run unavailability cannot issue setup: ${code}`, async () => {
  const f = conversationHostFixture(); f.host.actions.runFile = async () => ({ status: 'unavailable', ...(code ? { code } : {}) });
  try {
    await f.host.readiness; await f.host.tutorView.onMessage(contextRunEnvelope(f.host));
    assert.ok(f.host.coordinator.snapshot().entries.every(e => e.actions.every(a => a.type !== 'installRuntime')));
  } finally { f.host.dispose(); }
});

for (const [runtime, expected] of [[{ status: 'unavailable', runtimeMode: 'contributor' }, 'contributor_runtime_unavailable'],
  [{ status: 'unsupported' }, 'runtime_unsupported'], [{ status: 'cancelled' }, undefined], [{ status: 'failed' }, undefined]]) {
  test(`native runtime boundary does not classify unrelated prerequisite or ${runtime.status} as installable`, async () => {
    const f = conversationHostFixture(); f.vscode.window.showInformationMessage = async () => {};
    f.host.actions.runFile = createRunFileHandler({ vscode: f.vscode, runtimeManager: { resolveWorkspace: async () => runtime } });
    try {
      await f.host.readiness; const result = await f.host.tutorView.onMessage(contextRunEnvelope(f.host));
      assert.equal(result.code, expected);
      assert.ok(f.host.coordinator.snapshot().entries.every(e => e.actions.every(a => a.type !== 'installRuntime')));
    } finally { f.host.dispose(); }
  });
}

async function includeOptional(f) {
  await f.host.readiness;
  const context = f.host.coordinator.snapshot().context;
  const optional = context.sources.find(s => s.uri === f.optional.uri.toString());
  return f.host.tutorView.onMessage(commandEnvelope(f.host, 'setSourceIncluded', { sourceId: optional.id, included: true, contextRevision: context.revision }));
}
function submit(f, text = 'Question') {
  return f.host.tutorView.onMessage(commandEnvelope(f.host, 'submitMessage', { submissionId: randomUUID(), text, contextRevision: f.host.coordinator.snapshot().context.revision }));
}

function proposalHostFixture({ optionalTarget = false } = {}) {
  const f = conversationHostFixture(), diffs = [], edits = [], boundaries = [];
  const target = optionalTarget ? f.optional : f.active;
  const parse = f.vscode.Uri.parse;
  f.vscode.Uri.parse = value => value.startsWith('kafe-proposal:') ? { scheme: 'kafe-proposal', toString: () => value } : parse(value);
  target.positionAt = offset => ({ offset });
  f.vscode.Range = class { constructor(start, end) { Object.assign(this, { start, end }); } };
  f.vscode.WorkspaceEdit = class { replace(uri, range, text) { this.change = { uri, range, text }; } };
  f.vscode.workspace.applyEdit = async edit => { edits.push(edit.change); target.text = edit.change.text; target.version++; f.listeners.change({ document: target }); return true; };
  f.host.coordinator.controller.provider = { async *stream() { yield { type: 'complete', text: '', finishReason: 'tool_calls',
    toolCalls: [{ id: 'proposal', name: 'proposeCodeChange', arguments: { newText: 'items <- [42]',
      ...(optionalTarget ? { sourceId: require('../../src/tutor/ToolRouter').selectedSourceId(f.optional.uri) } : {}) } }] }; } };
  f.vscode.commands = { async executeCommand(name, original, proposed) {
    assert.equal(name, 'vscode.diff'); diffs.push({ original, proposed });
    boundaries.push({ stage: 'before-active-event', pending: !!f.host.proposalProvider.pending });
    f.vscode.window.activeTextEditor = { document: { uri: proposed, languageId: 'plaintext', version: 1, getText: () => '' } };
    f.listeners.active();
    boundaries.push({ stage: 'after-active-event', pending: !!f.host.proposalProvider.pending });
    assert.equal(f.host.proposalProvider.provideTextDocumentContent(proposed), 'items <- [42]', JSON.stringify(boundaries));
  } };
  return Object.assign(f, { diffs, edits, boundaries });
}

test('provider submission stages a target-bound proposal without native diff or Apply; explicit Review survives its active-editor event', async () => {
  const f = proposalHostFixture();
  try {
    await f.host.readiness; await submit(f, 'Repair');
    assert.equal(f.diffs.length, 0, JSON.stringify(f.boundaries));
    assert.equal(f.host.coordinator.snapshot().turn.status, 'completed');
    assert.equal(f.host.proposalProvider.pending.reviewed, false);
    assert.equal(f.host.coordinator.snapshot().entries.flatMap(e => e.actions).some(a => a.type === 'acceptProposal' && a.enabled), false);
    assert.equal((await f.host.proposalProvider.accept(f.host.proposalProvider.pending.id)).status, 'invalid');
    assert.equal((await f.host.tutorView.onMessage(actionEnvelope(f.host, 'reviewProposal'))).status, 'completed');
    assert.deepEqual(f.boundaries.map(b => b.pending), [true, true]);
    assert.equal(f.diffs.length, 1); assert.equal(f.diffs[0].original.toString(), f.active.uri.toString());
    assert.equal(f.host.proposalProvider.pending.reviewed, true);
    assert.equal((await f.host.tutorView.onMessage(actionEnvelope(f.host, 'acceptProposal'))).status, 'completed');
    assert.equal(f.edits.length, 1); assert.equal(f.edits[0].uri.toString(), f.active.uri.toString());
  } finally { f.host.dispose(); }
});

for (const event of ['change', 'delete']) for (const heldReview of [false, true]) {
  test(`former active non-target dependency revokes ${heldReview ? 'held Review' : 'reviewed Apply'} through registered ${event} callback`, async () => {
    const f = proposalHostFixture({ optionalTarget: true }); let release, entered;
    const barrier = new Promise(resolve => { release = resolve; }), opening = new Promise(resolve => { entered = resolve; });
    const open = f.vscode.commands.executeCommand;
    if (heldReview) f.vscode.commands.executeCommand = async (...args) => { await open(...args); entered(); await barrier; };
    try {
      await includeOptional(f); await submit(f, 'Repair selected file');
      assert.deepEqual(new Set(f.host.coordinator.controller.pendingProposal.fileUris), new Set([f.active.uri.toString(), f.optional.uri.toString()]));
      assert.equal(f.host.proposalProvider.pending.sourceId, f.optional.uri.toString());
      const reviewing = f.host.tutorView.onMessage(actionEnvelope(f.host, 'reviewProposal'));
      if (heldReview) await opening; else assert.equal((await reviewing).status, 'completed');
      const issued = heldReview ? null : actionEnvelope(f.host, 'acceptProposal');
      f.vscode.window.activeTextEditor = { document: f.excluded }; f.listeners.active(); await f.host.actions.refreshContext();
      const context = f.host.coordinator.snapshot().context;
      assert.equal(context.activeSource.uri, f.excluded.uri.toString());
      assert.ok(!context.sources.some(s => s.uri === f.active.uri.toString() && s.included));
      assert.ok(f.host.proposalProvider.pending, 'Authorized focus alone preserves proposal');
      if (event === 'change') { f.active.text += 'changed'; f.active.version++; f.listeners.change({ document: f.active }); }
      else f.watcher.delete(f.active.uri);
      assert.equal(f.host.proposalProvider.pending, null, 'Former active dependency remains observed');
      if (heldReview) { release(); assert.ok(['stale', 'cancelled'].includes((await reviewing).status)); }
      else assert.equal((await f.host.tutorView.onMessage(issued)).status, 'stale');
      assert.ok(!f.host.coordinator.snapshot().entries.flatMap(e => e.actions).some(a => a.type === 'acceptProposal' && a.enabled));
      assert.equal(f.edits.length, 0); assert.equal(f.optional.text, 'OPTIONAL_OLD');
    } finally { release(); f.host.dispose(); }
  });
}

for (const event of ['change', 'delete', 'trust', 'workspace', 'reset']) test(`settled reviewed proposal is revoked by real host callback: ${event}`, async () => {
  const f = proposalHostFixture();
  try {
    await f.host.readiness; await submit(f, 'Repair');
    await f.host.tutorView.onMessage(actionEnvelope(f.host, 'reviewProposal'));
    const issued = actionEnvelope(f.host, 'acceptProposal');
    if (event === 'change') { f.active.text += 'changed'; f.active.version++; f.listeners.change({ document: f.active }); }
    if (event === 'delete') f.watcher.delete(f.active.uri);
    if (event === 'trust') { f.vscode.workspace.isTrusted = false; f.listeners.trust(); }
    if (event === 'workspace') { f.vscode.workspace.getWorkspaceFolder = () => undefined; f.listeners.workspace(); }
    if (event === 'reset') f.host.coordinator.newConversation();
    assert.equal(f.host.proposalProvider.pending, null);
    assert.equal((await f.host.tutorView.onMessage(issued)).status, 'stale'); assert.equal(f.edits.length, 0);
  } finally { f.host.dispose(); }
});

for (const event of ['change', 'reset']) test(`pending explicit native Review cannot enable Apply after ${event}`, async () => {
  const f = proposalHostFixture(); let release, entered;
  const barrier = new Promise(resolve => { release = resolve; }), opening = new Promise(resolve => { entered = resolve; });
  const open = f.vscode.commands.executeCommand;
  f.vscode.commands.executeCommand = async (...args) => { await open(...args); entered(); await barrier; };
  try {
    await f.host.readiness; await submit(f, 'Repair');
    const reviewing = f.host.tutorView.onMessage(actionEnvelope(f.host, 'reviewProposal')); await opening;
    if (event === 'reset') f.host.coordinator.newConversation();
    else { f.active.version++; f.listeners.change({ document: f.active }); }
    release(); const result = await reviewing;
    assert.ok(['cancelled', 'stale'].includes(result.status)); assert.equal(f.host.proposalProvider.pending, null);
    assert.equal(f.host.coordinator.snapshot().entries.flatMap(e => e.actions).some(a => a.enabled && a.type === 'acceptProposal'), false);
    assert.equal(f.edits.length, 0);
  } finally { release(); f.host.dispose(); }
});

test('synchronous authorization sampling fences native workspace change at provider admission', async () => {
  const f = conversationHostFixture(); await includeOptional(f);
  const unsubscribe = f.host.coordinator.subscribe(snapshot => {
    if (snapshot.turn?.status === 'responding') f.vscode.workspace.getWorkspaceFolder = () => undefined;
  });
  try { assert.equal((await submit(f)).status, 'stale'); assert.equal(f.calls.length, 0); }
  finally { unsubscribe(); f.host.dispose(); }
});

test('included closed document mutation during awaited native read cannot transmit', async () => {
  const f = conversationHostFixture(); await includeOptional(f);
  f.vscode.window.visibleTextEditors = [{ document: f.active }]; await f.host.actions.refreshContext();
  let entered, release;
  const waiting = new Promise(r => { entered = r; }), held = new Promise(r => { release = r; });
  f.vscode.workspace.openTextDocument = async uri => {
    assert.equal(uri.toString(), f.optional.uri.toString()); entered(); await held; return f.optional;
  };
  try {
    const sending = submit(f); await waiting;
    f.optional.text = 'NATIVE_READ_CHANGED'; f.optional.version++; f.listeners.change({ document: f.optional });
    release(); assert.ok(['stale', 'cancelled'].includes((await sending).status)); assert.equal(f.calls.length, 0);
  } finally { f.host.dispose(); }
});

test('disposed host subscriptions and queued source callbacks cannot mutate conversation or fence', async () => {
  const f = conversationHostFixture(); await includeOptional(f);
  f.host.dispose(); const before = f.host.coordinator.snapshot(), stamp = f.host.coordinator.getSourceRevision();
  f.active.version++; f.listeners.change({ document: f.active }); f.watcher.delete(f.optional.uri);
  f.listeners.active(); f.listeners.workspace(); f.listeners.trust();
  await f.host.actions.refreshContext();
  assert.deepEqual(f.host.coordinator.snapshot(), before); assert.equal(f.host.coordinator.getSourceRevision(), stamp);
  for (const name of ['active', 'visible', 'change', 'open', 'close', 'workspace', 'trust', 'watcher']) assert.ok(f.disposals.includes(name), name);
});

test('optional candidates are metadata only until included, including closed selected editors', async () => {
  const f = conversationHostFixture();
  try {
    await f.host.readiness;
    assert.equal(f.reads.includes('optional.kf'), false); assert.equal(f.reads.includes('excluded.kf'), false);
    assert.equal((await includeOptional(f)).status, 'completed');
    assert.equal(f.reads.includes('optional.kf'), false);
    f.vscode.window.visibleTextEditors = [{ document: f.active }]; f.listeners.visible();
    await f.host.actions.refreshContext();
    assert.equal(f.reads.includes('optional.kf'), false);
    assert.equal((await submit(f)).status, 'completed');
    assert.ok(JSON.stringify(f.calls[0]).includes('OPTIONAL_OLD')); assert.equal(f.reads.includes('excluded.kf'), false);
  } finally { f.host.dispose(); }
});

test('editor, trust and draft refresh leave empty transcript and do not retrieve knowledge', async () => {
  const f = conversationHostFixture(); let knowledge = 0;
  f.setAvailabilityHook(async () => { knowledge++; });
  try {
    await f.host.readiness;
    for (const text of ['D', 'Draft', 'Next draft']) await f.host.tutorView.onMessage(commandEnvelope(f.host, 'setDraft', { text }));
    f.vscode.window.activeTextEditor = { document: f.optional }; f.listeners.active(); await f.host.actions.refreshContext();
    assert.equal(f.host.coordinator.snapshot().context.activeSource.uri, f.optional.uri.toString());
    f.vscode.workspace.isTrusted = false; f.listeners.trust(); await f.host.actions.refreshContext();
    assert.equal(f.host.coordinator.snapshot().context.restricted, true);
    assert.equal(f.host.coordinator.snapshot().context.activeSource, null);
    await f.host.actions.refreshContext();
    assert.deepEqual(f.host.coordinator.snapshot().entries, []);
    assert.equal(f.host.coordinator.snapshot().draft, 'Next draft'); assert.equal(knowledge, 0);
  } finally { f.host.dispose(); }
});

test('removed live bridge messages cannot invoke provider, native Run, edit or legacy writes', async () => {
  const f = conversationHostFixture(); await f.host.readiness;
  let runs = 0, edits = 0, writes = 0;
  f.host.actions.runFile = async () => { runs++; };
  f.vscode.workspace.applyEdit = async () => { edits++; };
  f.host.progressStore = { save: async () => { writes++; }, clear: async () => { writes++; } };
  const before = f.host.coordinator.snapshot();
  for (const type of ['prepareRequest', 'sendReviewed', 'reviewContext', 'useLearningGoal', 'startSession', 'newSession', 'confirmMilestones', 'reviseMilestones', 'showProgress', 'recordReviewedCheck', 'clearProgress', 'confirmClearProgress', 'cancelPendingInput']) {
    assert.equal((await f.host.tutorView.onMessage(commandEnvelope(f.host, type))).status, 'stale');
    assert.equal((await f.host.tutorView.onMessage(commandEnvelope(f.host, 'invokeAction', { entryId: 'legacy-entry', actionId: type, args: {} }))).status, 'stale');
  }
  assert.deepEqual(f.host.coordinator.snapshot(), before); assert.deepEqual([f.calls.length, runs, edits, writes], [0, 0, 0, 0]); f.host.dispose();
});

test('new conversation clears optional selection, ephemeral history and capabilities while retaining legacy storage and Run sequence', async () => {
  const f = conversationHostFixture(); await includeOptional(f);
  assert.equal((await submit(f)).status, 'completed');
  f.host.coordinator.lastRunSequence = 7;
  const id = f.host.coordinator.session.appendEntry({ kind: 'host', status: 'ready', text: 'Native key configuration' });
  const action = f.host.coordinator.session.registerAction(id, { type: 'configureProviderKey', label: 'Configure', enabled: true, args: {} });
  const stale = commandEnvelope(f.host, 'invokeAction', { entryId: id, actionId: action.id, args: {} });
  let writes = 0; f.host.progressStore = { clear: async () => { writes++; }, save: async () => { writes++; } };
  f.host.coordinator.session.setDraft('Old draft'); f.host.coordinator.newConversation(); await f.host.actions.refreshContext();
  assert.equal(f.host.coordinator.lastRunSequence, 7); assert.equal(writes, 0);
  assert.deepEqual(f.host.coordinator.session.historyPairs(), []); assert.equal(f.host.coordinator.includedSourceUris.size, 0);
  assert.ok(f.host.coordinator.snapshot().context.sources.every(s => !s.included));
  assert.equal((await f.host.tutorView.onMessage(stale)).status, 'stale'); f.host.dispose();
});

for (const event of ['buffer', 'external', 'delete', 'active', 'workspace', 'trust']) {
  test(`synchronous source event during final awaited availability prevents transmission: ${event}`, async () => {
    const f = conversationHostFixture();
    try {
      await includeOptional(f); f.vscode.window.visibleTextEditors = [{ document: f.active }];
      await f.host.actions.refreshContext();
      let entered, release, checks = 0;
      const waiting = new Promise(r => { entered = r; }); const held = new Promise(r => { release = r; });
      f.setAvailabilityHook(async () => { if (++checks === 3) { entered(); await held; } });
      const sending = submit(f); await waiting;
      const stamp = f.host.coordinator.getSourceRevision();
      if (event === 'buffer') { f.optional.text = 'CHANGED'; f.optional.version++; f.listeners.change({ document: f.optional }); }
      if (event === 'external') f.watcher.change(f.optional.uri);
      if (event === 'delete') f.watcher.delete(f.optional.uri);
      if (event === 'active') { f.vscode.window.activeTextEditor = { document: f.excluded }; f.listeners.active(); }
      if (event === 'workspace') { f.vscode.workspace.getWorkspaceFolder = () => undefined; f.listeners.workspace(); }
      if (event === 'trust') { f.vscode.workspace.isTrusted = false; f.listeners.trust(); }
      assert.ok(f.host.coordinator.getSourceRevision() > stamp);
      release(); assert.ok(['stale', 'cancelled'].includes((await sending).status)); assert.equal(f.calls.length, 0);
    } finally { f.host.dispose(); }
  });
}

test('source fence is monotonic across new conversation and stable for draft, tokens and excluded files', async () => {
  const f = conversationHostFixture();
  try {
    await f.host.readiness; const initial = f.host.coordinator.getSourceRevision();
    f.host.coordinator.session.setDraft('Draft');
    f.host.coordinator.session.appendEntry({ kind: 'assistant', status: 'responding', text: 'Token' });
    f.listeners.change({ document: f.excluded }); f.watcher.change(f.excluded.uri);
    assert.equal(f.host.coordinator.getSourceRevision(), initial);
    f.listeners.change({ document: f.active }); const changed = f.host.coordinator.getSourceRevision();
    assert.ok(changed > initial); f.host.coordinator.newConversation(); await f.host.actions.refreshContext();
    assert.equal(f.host.coordinator.getSourceRevision(), changed);
    assert.deepEqual(f.host.coordinator.snapshot().entries, []);
    assert.equal(f.host.coordinator.snapshot().draft, '');
    assert.ok(f.host.coordinator.snapshot().context.activeSource);
  } finally { f.host.dispose(); }
  assert.ok(f.disposals.includes('watcher'));
});

for (const confirmed of [false, true]) test(`native legacy clear affects only confirmed legacy records: confirmed=${confirmed}`, async () => {
  const { ProgressStore } = require('../../src/tutor/ProgressStore');
  const values = new Map([['kafeTutor.progress.v1', { schemaVersion: 1, goal: 'Old', milestones: [{ id: 'one', text: 'Old step' }], completedChecks: [] }], ['independent', 'retained']]);
  const writes = [], prompts = []; const f = conversationHostFixture(); await f.host.readiness;
  f.host.coordinator.session.setDraft('Unsent'); const before = f.host.coordinator.snapshot();
  const handler = createClearProgressHandler({ vscode: { window: { showWarningMessage: async (...args) => { prompts.push(args); return confirmed ? 'Clear legacy progress' : undefined; } } },
    progressStore: new ProgressStore({ workspaceState: { get: key => values.get(key), update: async (key, value) => { writes.push([key, value]); values.delete(key); } } }) });
  assert.equal((await handler()).status, confirmed ? 'completed' : 'cancelled');
  assert.equal(prompts[0][1].modal, true); assert.equal(values.has('kafeTutor.progress.v1'), !confirmed);
  assert.equal(values.get('independent'), 'retained'); assert.equal(writes.length, confirmed ? 2 : 0);
  assert.deepEqual(f.host.coordinator.snapshot(), before); f.host.dispose();
});

test('native legacy clear is single-flight through confirmation and deletion', async () => {
  let release, prompts = 0, clears = 0;
  const handler = createClearProgressHandler({ vscode: { window: { showWarningMessage: () => { prompts++; return new Promise(r => { release = r; }); } } },
    progressStore: { clear: async () => { clears++; } } });
  const first = handler(), second = handler();
  assert.equal(prompts, 1); release('Clear legacy progress');
  assert.equal((await first).status, 'completed'); assert.equal((await second).status, 'completed'); assert.equal(clears, 1);
});

test('native legacy clear sanitizes confirmation failure without deleting records', async () => {
  let clears = 0;
  const handler = createClearProgressHandler({ vscode: { window: { showWarningMessage: async () => { throw new Error('private native payload'); } } },
    progressStore: { clear: async () => { clears++; } } });
  assert.deepEqual(await handler(), { status: 'failed', code: 'legacy_clear_failed' }); assert.equal(clears, 0);
});

function commandEnvelope(host, type, fields = {}) {
  const snapshot = host.coordinator.snapshot();
  return { type, sessionId: snapshot.sessionId, generation: snapshot.generation, ...fields };
}
function actionEnvelope(host, type) {
  const s = host.coordinator.snapshot();
  const entry = s.entries.findLast(e => e.actions.some(a => a.type === type && a.enabled));
  assert.ok(entry, `Missing action ${type}`);
  const a = entry.actions.find(a => a.type === type && a.enabled);
  return { type: 'invokeAction', sessionId: s.sessionId, generation: s.generation, entryId: entry.id, actionId: a.id, args: a.args };
}
test('native Run closes once after New conversation while old chat result remains suppressed', async () => {
  const f = setup(); let resolve, closes = 0, writes = '', cancels = 0;
  f.vscode.EventEmitter = class { constructor() { this.listeners = []; this.event = fn => { this.listeners.push(fn); }; } fire(value) { this.listeners.forEach(fn => fn(value)); } dispose() { this.listeners = []; } };
  const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {}, runtimeManager: {} }); await host.readiness;
  const handler = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
    getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }) },
    onRunState: e => host.actions.recordRunState(e), onRunResult: r => host.actions.recordRunResult(r),
    startKafeFile: () => ({ completion: new Promise(r => { resolve = r; }), cancel() { cancels++; }, sendInput() {} }) });
  await handler(); const pty = f.calls.terminals[0].pty;
  pty.onDidClose(() => { closes++; }); pty.onDidWrite(text => { writes += text; }); pty.open();
  host.coordinator.newConversation(); await host.actions.refreshContext();
  assert.equal(cancels, 0); assert.equal(closes, 0);
  resolve({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false }); await new Promise(r => setImmediate(r));
  assert.equal(cancels, 0); assert.equal(closes, 1); assert.match(writes, /exited with code 0/);
  assert.equal(host.coordinator.snapshot().entries.filter(e => e.kind === 'run').length, 0);
  pty.close(); assert.equal(closes, 1); host.dispose();
});

test('secure configure returns cancellation without storing or success notification', async () => {
  let stores = 0, messages = 0;
  const h = createProviderKeyHandlers({ vscode: { window: { showInputBox: async () => undefined,
    showInformationMessage: async () => { messages++; } } }, secrets: { store: async () => { stores++; } } });
  assert.deepEqual(await h.configure(), { status: 'cancelled' });
  assert.equal(stores, 0); assert.equal(messages, 0);
});
test('native credential storage failure returns a safe result without exposing the entered key', async () => {
  const h = createProviderKeyHandlers({ vscode: { window: { showInputBox: async () => 'private-test-key', showInformationMessage: async () => {} } },
    secrets: { store: async () => { throw new Error('private-test-key'); } } });
  assert.deepEqual(await h.configure(), { status: 'failed', code: 'credential_store_failed' });
});
test('explicit Run target survives changed editor focus and emits shared sequence and terminal capability', async () => {
  const f = setup();
  const target = f.doc;
  f.vscode.Uri = { parse: () => target.uri };
  f.vscode.workspace.openTextDocument = async () => target;
  f.vscode.window.activeTextEditor = { document: { ...target, uri: { ...target.uri, fsPath: 'C:/other/b.kf' } } };
  const events = [], results = [];
  const handler = createRunFileHandler({ vscode: f.vscode, runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }) },
    fs: { existsSync: () => true }, startKafeFile: options => { f.calls.runner.push(options); return { completion: Promise.resolve({ stdout: '', stderr: '', exitCode: 0, outputTruncated: false }), cancel() {}, sendInput() {} }; },
    onRunState: e => events.push(e), onRunResult: r => results.push(r) });
  assert.equal((await handler({ targetUri: target.uri.toString() })).status, 'completed');
  f.calls.terminals[0].pty.open();
  await new Promise(r => setImmediate(r));
  assert.equal(f.calls.runner[0].filePath, target.uri.fsPath);
  assert.equal(events[0].runSequence, 1);
  assert.equal(results[0].runSequence, 1);
  assert.equal(typeof events[0].terminal.show, 'function');
});
test('Run rechecks dirty save and trust before PTY open', async () => {
  const f = setup();
  await f.handler();
  f.doc.isDirty = true;
  f.calls.terminals[0].pty.open();
  assert.equal(f.calls.runner.length, 0);
});

test('Run request held in runtime resolution cannot launch or populate chat after New conversation', async () => {
  const f = setup();
  let entered, release;
  const started = new Promise(r => { entered = r; });
  const held = new Promise(r => { release = r; });
  const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) } });
  const handler = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
    getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
    runtimeManager: { async resolveWorkspace() { entered(); await held; return { status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }; } },
    onRunState: e => host.actions.recordRunState(e), onRunResult: r => host.actions.recordRunResult(r),
    startKafeFile: options => { f.calls.runner.push(options); return { completion: new Promise(() => {}), sendInput() {}, cancel() {} }; } });
  const running = handler(); await started;
  host.coordinator.newConversation(); await host.actions.refreshContext();
  const cleared = host.coordinator.snapshot();
  release();
  assert.equal((await running).status, 'cancelled');
  for (const terminal of f.calls.terminals) terminal.pty.open();
  assert.equal(f.calls.runner.length, 0);
  assert.deepEqual(host.coordinator.snapshot(), cleared);
  host.dispose();
});
for (const boundary of ['document', 'save']) {
  test(`Run request ownership also fences New conversation while native ${boundary} is pending`, async () => {
    const f = setup({ dirty: boundary === 'save' });
    let entered, release;
    const started = new Promise(r => { entered = r; });
    const held = new Promise(r => { release = r; });
    f.vscode.Uri = { parse: () => f.doc.uri };
    f.vscode.workspace.openTextDocument = async () => { if (boundary === 'document') { entered(); await held; } return f.doc; };
    f.doc.save = async () => { entered(); await held; f.doc.isDirty = false; return true; };
    const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {}, runtimeManager: {} }); await host.readiness;
    const handler = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
      getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
      runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }) },
      onRunState: e => host.actions.recordRunState(e), startKafeFile: options => { f.calls.runner.push(options); return { completion: new Promise(() => {}), sendInput() {}, cancel() {} }; } });
    const pending = handler({ targetUri: f.doc.uri.toString() }); await started;
    host.coordinator.newConversation(); await host.actions.refreshContext();
    const before = host.coordinator.snapshot(); release();
    assert.equal((await pending).status, 'cancelled');
    assert.equal(f.calls.terminals.length, 0); assert.equal(f.calls.runner.length, 0);
    assert.deepEqual(host.coordinator.snapshot(), before);
    host.dispose();
  });
}
test('provider Stop preserves ownership of a Run waiting in runtime resolution', async () => {
  const f = setup();
  let entered, release;
  const started = new Promise(r => { entered = r; });
  const held = new Promise(r => { release = r; });
  const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {}, runtimeManager: {} }); await host.readiness;
  host.coordinator.controller.captureSubmission = () => new Promise(() => {});
  host.coordinator.session.setDraft('Question');
  const reviewPreparation = host.coordinator.controller.submit({ submissionId: require('node:crypto').randomUUID(), text: 'Question', contextRevision: host.coordinator.snapshot().context.revision });
  const handler = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
    getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
    runtimeManager: { async resolveWorkspace() { entered(); await held; return { status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }; } },
    onRunState: e => host.actions.recordRunState(e), onRunResult: r => host.actions.recordRunResult(r),
    startKafeFile: options => { f.calls.runner.push(options); return { completion: Promise.resolve({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false }), sendInput() {}, cancel() { f.calls.cancellations++; } }; } });
  const pending = handler(); await started;
  const turn = host.coordinator.snapshot().turn;
  assert.equal(host.coordinator.controller.stop({ turnId: turn.id, turnGeneration: turn.turnGeneration }), true);
  await reviewPreparation;
  release(); assert.equal((await pending).status, 'completed');
  f.calls.terminals[0].pty.open(); await new Promise(r => setImmediate(r));
  assert.equal(f.calls.runner.length, 1); assert.equal(f.calls.cancellations, 0);
  assert.equal(host.coordinator.evidence.runSequence, 1);
  assert.equal(host.coordinator.snapshot().entries.filter(e => e.kind === 'run').length, 1);
  host.dispose();
});
for (const change of ['dirty', 'version', 'deauthorized', 'new-conversation']) {
  test(`PTY prelaunch rejection settles its initiating Run without a sequence: ${change}`, async () => {
    const f = setup(); f.doc.version = 1;
    const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {}, runtimeManager: {} });
    const handler = createRunFileHandler({ vscode: f.vscode, fs: { existsSync: () => true },
      getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
      runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }) },
      onRunState: e => host.actions.recordRunState(e), startKafeFile: options => { f.calls.runner.push(options); return { completion: new Promise(() => {}), sendInput() {}, cancel() {} }; } });
    await host.readiness;
    await handler();
    if (change === 'dirty') f.doc.isDirty = true;
    if (change === 'version') f.doc.version = 2;
    if (change === 'deauthorized') f.vscode.workspace.getWorkspaceFolder = () => undefined;
    if (change === 'new-conversation') host.coordinator.newConversation(); await host.actions.refreshContext();
    const before = host.coordinator.snapshot();
    f.calls.terminals[0].pty.open();
    assert.equal(f.calls.runner.length, 0);
    if (change === 'new-conversation') assert.deepEqual(host.coordinator.snapshot(), before);
    else {
      const runs = host.coordinator.snapshot().entries.filter(e => e.kind === 'run');
      assert.equal(runs.length, 1);
      assert.equal(runs[0].status, 'cancelled');
      assert.equal(Object.hasOwn(runs[0].data, 'runSequence'), false);
    }
    host.dispose();
  });
}

test('Run rejects nonfile target before opening it and settles native terminal cancellation', async () => {
  const f = setup();
  let reads = 0;
  f.vscode.Uri = { parse: value => ({ scheme: value.split(':')[0], fsPath: 'C:/outside/a.kf', toString: () => value }) };
  f.vscode.workspace.openTextDocument = async () => { reads++; return f.doc; };
  assert.equal((await f.handler({ targetUri: 'untitled:a.kf' })).status, 'unavailable');
  assert.equal(reads, 0);
  const events = [];
  const handler = createRunFileHandler({ vscode: f.vscode, runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeRoot: 'C:/runtime', runtimeMode: 'contributor' }) },
    fs: { existsSync: () => true }, onRunState: e => events.push(e), startKafeFile: () => ({ completion: new Promise(() => {}), cancel() {}, sendInput() {} }) });
  await handler(); f.calls.terminals[0].pty.open(); f.calls.terminals[0].pty.close();
  assert.deepEqual(events.map(e => e.status), ['running', 'cancelled']);
});

function developmentTutorFixture({ runtime = PINNED_RUNTIME, extensionMode = 2, readyRuntime = { status: 'missing' } } = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-tutor-dev-pack-'));
  const extensionPath = path.join(temporary, 'kafe-vscode');
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-tutor-global-storage-'));
  fs.mkdirSync(extensionPath, { recursive: true });
  fs.mkdirSync(path.join(temporary, 'src'), { recursive: true });
  fs.mkdirSync(path.join(temporary, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(temporary, 'pyproject.toml'), 'requires-python = ">=3.10"\n');
  fs.writeFileSync(path.join(temporary, 'uv.lock'), 'version = 1\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe.py'), '# KAFE entry point\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe_Grammar.g4'), 'grammar Kafe;\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe_Lexer.g4'), 'lexer grammar Kafe_Lexer;\n');
  for (const section of ['getting-started', 'language', 'libraries', 'specification', 'errors', 'examples']) {
    const directory = path.join(temporary, 'docs', section);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'lesson.md'), `${section} KAFE lesson.\n`);
  }
  fs.writeFileSync(path.join(temporary, 'docs', 'language', 'lists.md'), 'LISTS_LESSON_SENTINEL explains KAFE list indexing.\n');
  fs.mkdirSync(path.join(temporary, 'docs', 'extension'), { recursive: true });
  fs.writeFileSync(path.join(temporary, 'docs', 'extension', 'private.md'), 'EXTENSION_PRIVATE_SENTINEL\n');
  const providerCalls = [];
  const vscode = {
    ExtensionMode: { Production: 1, Development: 2, Test: 3 },
    window: {},
    workspace: { isTrusted: true, openTextDocument: async () => { throw new Error('unexpected document read'); } },
  };
  const createHost = mode => createTutorHost({
    vscode, extensionUri: {}, secrets: {}, extensionMode: mode, extensionPath,
    runtimeManager: { storageRoot, manifest: { runtime }, getReadyRuntime: async () => readyRuntime },
    provider: { async *stream({ request }) { providerCalls.push(request); yield { type: 'complete', text: 'Try one feature at a time.', toolCalls: [], finishReason: 'stop' }; } },
  });
  return { host: createHost(extensionMode), createHost, temporary, storageRoot, providerCalls, vscode };
}

test('missing knowledge has null lineage and a typed search error', async () => {
  let runtimeChecks = 0;
  const host = createTutorHost({
    vscode: { ExtensionMode: { Production: 1, Development: 2 }, window: {}, workspace: { isTrusted: true } },
    extensionUri: {}, secrets: {}, extensionMode: 1,
    runtimeManager: { getReadyKnowledgePack: async () => ({ status: 'unavailable', code: 'knowledge_missing' }),
      getReadyRuntime: async () => { runtimeChecks++; throw new Error('runtime readiness must not gate knowledge'); } },
    provider: { async *stream() { throw new Error('provider must not run'); } },
  });
  try {
    await host.readiness;
    const readinessRuntimeChecks = runtimeChecks;
    assert.deepEqual(await host.resolveKnowledge(), { status: 'unavailable', code: 'knowledge_missing' });
    assert.equal(await host.knowledgeRetriever.getKnowledgeLineage(), null);
    await assert.rejects(host.knowledgeRetriever.search('KAFE lists'), error =>
      error.code === 'knowledge_missing' && error.name === 'KnowledgeUnavailable');
    assert.equal(runtimeChecks, readinessRuntimeChecks, 'knowledge resolution and search do not inspect execution readiness');
  } finally { host.dispose(); }
});

test('development fallback remains development-only', async () => {
  const fixture = developmentTutorFixture({ extensionMode: 1 });
  try {
    const development = fixture.createHost(2);
    const production = fixture.createHost(1);
    assert.equal((await development.resolveKnowledge()).status, 'ready');
    assert.equal((await production.resolveKnowledge()).code, 'knowledge_missing');
    assert.equal(await production.knowledgeRetriever.getKnowledgeLineage(), null);
    await assert.rejects(production.knowledgeRetriever.search('lists'), error => error.code === 'knowledge_missing');
    development.dispose(); production.dispose();
  } finally { removeDevelopmentFixture(fixture); }
});

test('development knowledge appears in one direct provider request while executable runtime is missing', async () => {
  const f = developmentTutorFixture();
  try {
    await f.host.readiness;
    assert.equal((await f.host.resolveKnowledge()).status, 'ready');
    const result = await f.host.tutorView.onMessage(commandEnvelope(f.host, 'submitMessage', { submissionId: randomUUID(), text: 'KAFE list indexing', contextRevision: f.host.coordinator.snapshot().context.revision }));
    assert.equal(result.status, 'completed'); assert.equal(f.providerCalls.length, 1);
    assert.ok(JSON.stringify(f.providerCalls[0]).includes('LISTS_LESSON_SENTINEL'));
    assert.ok(!JSON.stringify(f.providerCalls[0]).includes('EXTENSION_PRIVATE_SENTINEL'));
    assert.deepEqual(f.host.coordinator.snapshot().entries.map(e => e.kind), ['learner', 'assistant']);
  } finally { removeDevelopmentFixture(f); }
});

test('incompatible knowledge versions are unavailable without provider or runtime execution', async () => {
  const f = developmentTutorFixture({ runtime: { ...PINNED_RUNTIME, knowledgePackVersion: '9.9.9' } });
  try { assert.equal((await f.host.resolveKnowledge()).status, 'unavailable'); await assert.rejects(f.host.knowledgeRetriever.search('lists'), error => error.name === 'KnowledgeUnavailable'); assert.equal(f.providerCalls.length, 0); }
  finally { removeDevelopmentFixture(f); }
});

test('production and test hosts exclude development knowledge while ordinary message chat remains available', async () => {
  const f = developmentTutorFixture();
  try {
    for (const mode of [1, 3]) {
      const host = f.createHost(mode); await host.readiness;
      assert.equal((await host.resolveKnowledge()).status, 'unavailable');
      assert.equal((await host.tutorView.onMessage(commandEnvelope(host, 'submitMessage', { submissionId: randomUUID(), text: 'Hello', contextRevision: host.coordinator.snapshot().context.revision }))).status, 'completed');
      assert.ok(!JSON.stringify(f.providerCalls.at(-1)).includes('LISTS_LESSON_SENTINEL')); host.dispose();
    }
  } finally { removeDevelopmentFixture(f); }
});

test('development Tutor prefers managed knowledge over local documentation', async () => {
  const f = developmentTutorFixture();
  try {
    const pack = path.join(f.temporary, 'knowledge-pack'); fs.mkdirSync(pack);
    fs.writeFileSync(path.join(pack, 'lists.md'), 'MANAGED_LISTS_SENTINEL list indexing');
    const digest = knowledgeContentDigest([{ relative: 'lists.md', bytes: fs.readFileSync(path.join(pack, 'lists.md')) }]);
    const host = createTutorHost({ vscode: f.vscode, extensionUri: {}, secrets: {}, extensionMode: 2, extensionPath: path.join(f.temporary, 'kafe-vscode'), runtimeManager: {
      storageRoot: f.storageRoot, manifest: { runtime: PINNED_RUNTIME }, getReadyKnowledgePack: async () => ({ status: 'ready', knowledgeRoot: pack, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', packIdentity: pack, expectedContentSha256: digest.contentSha256, expectedFileCount: digest.fileCount }) } });
    const passages = await host.knowledgeRetriever.search('list indexing');
    assert.ok(passages.some(p => p.text.includes('MANAGED_LISTS_SENTINEL'))); assert.ok(passages.every(p => p.sourceMode === 'managed'));
    assert.equal(fs.existsSync(path.join(f.storageRoot, 'kafe-tutor-development')), false); host.dispose();
  } finally { removeDevelopmentFixture(f); }
});

test('tampered development cache cannot return trusted passage bytes', async () => {
  const f = developmentTutorFixture();
  try {
    await f.host.knowledgeRetriever.search('list indexing'); const cached = findFile(f.storageRoot, 'lists.md'); assert.ok(cached);
    fs.writeFileSync(cached, 'TAMPERED_CACHE'); const host = f.createHost(2);
    await assert.rejects(host.knowledgeRetriever.search('list indexing'), error => error.name === 'KnowledgeUnavailable'); assert.equal(f.providerCalls.length, 0); host.dispose();
  } finally { removeDevelopmentFixture(f); }
});

test('oversized development documentation cannot be admitted as knowledge', async () => {
  const f = developmentTutorFixture();
  try {
    fs.writeFileSync(path.join(f.temporary, 'docs', 'language', 'oversized.md'), 'x'.repeat(MAX_FILE_BYTES + 1));
    await assert.rejects(f.host.knowledgeRetriever.search('lists'), error => error.name === 'KnowledgeUnavailable'); assert.equal(f.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(f); }
});

test('pack loss during retrieval yields a typed sanitized availability error', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-knowledge-race-'));
  const knowledgeRoot = path.join(temporary, 'knowledge-pack');
  fs.mkdirSync(knowledgeRoot);
  const member = path.join(knowledgeRoot, 'lists.md');
  fs.writeFileSync(member, 'KAFE lists use indexes.');
  const digest = knowledgeContentDigest([{ relative: 'lists.md', bytes: fs.readFileSync(member) }]);
  let removeOnResolve = false;
  const host = createTutorHost({
    vscode: { ExtensionMode: { Production: 1 }, window: {}, workspace: { isTrusted: true } },
    extensionUri: {}, secrets: {}, extensionMode: 1,
    runtimeManager: { manifest: { runtime: PINNED_RUNTIME },
      getReadyKnowledgePack: async () => {
        if (removeOnResolve) { fs.rmSync(member, { force: true }); removeOnResolve = false; }
        return { status: 'ready', knowledgeRoot, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
          packIdentity: knowledgeRoot, expectedContentSha256: digest.contentSha256,
          expectedFileCount: digest.fileCount };
      } },
  });
  try {
    await host.readiness;
    removeOnResolve = true;
    await assert.rejects(host.knowledgeRetriever.search('lists'), error =>
      error.name === 'KnowledgeUnavailable' && error.code === 'knowledge_integrity_failed' &&
      !error.message.includes(member));
    await assert.rejects(host.knowledgeRetriever.search(''), error =>
      error.name !== 'KnowledgeUnavailable' && /invalid.*query/i.test(error.message));
  } finally { host.dispose(); fs.rmSync(temporary, { recursive: true, force: true }); }
});

function removeDevelopmentFixture(fixture) {
  fs.rmSync(fixture.temporary, { recursive: true, force: true });
  fs.rmSync(fixture.storageRoot, { recursive: true, force: true });
}

function findFile(root, name) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name === name) return candidate;
    if (entry.isDirectory()) {
      const found = findFile(candidate, name);
      if (found) return found;
    }
  }
  return undefined;
}

test('provider key commands use password input and SecretStorage only without provider requests', async () => {
  const key = 'fake-test-key-NOT-REAL';
  const calls = { store: [], delete: [], prompt: [], message: [], provider: 0 };
  const handlers = createProviderKeyHandlers({
    secrets: { store: async (...args) => calls.store.push(args), delete: async value => calls.delete.push(value) },
    vscode: { window: {
      showInputBox: async options => { calls.prompt.push(options); return key; },
      showInformationMessage: async message => calls.message.push(message),
    } },
    provider: { stream: async () => { calls.provider++; } },
  });
  await handlers.configure();
  await handlers.clear();
  assert.equal(calls.prompt[0].password, true);
  assert.deepEqual(calls.store, [['kafe.deepseekApiKey', key]]);
  assert.deepEqual(calls.delete, ['kafe.deepseekApiKey']);
  assert.equal(calls.provider, 0);
  assert.ok(!JSON.stringify({ prompt: calls.prompt, message: calls.message }).includes(key));
});

function setup({ trusted = true, languageId = 'kafe', dirty = false, saveResult = true,
  selectedFolder = 1, contributor = true, generated = true, selection = 'Save' } = {}) {
  const roots = ['C:/other', 'C:/KAFE repo'];
  const doc = { languageId, version: 1, getText: () => 'print(1)', isDirty: dirty, uri: { scheme: 'file', fsPath: 'C:/KAFE repo/examples/test.kf',
    toString: () => 'file:///C:/KAFE%20repo/examples/test.kf' },
    saveCalls: 0, async save() { this.saveCalls++; if (saveResult) this.isDirty = false; return saveResult; } };
  const calls = { runner: [], terminals: [], messages: [], prompts: [], folder: [], runtime: [], inputs: [], cancellations: 0 };
  const existing = new Set();
  if (contributor) {
    for (const name of ['pyproject.toml', 'uv.lock', 'src/Kafe.py']) existing.add(path.join(roots[selectedFolder ?? 1], name));
    if (generated) for (const name of ['Kafe_GrammarLexer.py', 'Kafe_GrammarParser.py', 'Kafe_GrammarVisitor.py']) {
      existing.add(path.join(roots[selectedFolder ?? 1], 'src', name));
    }
  }
  class Emitter { constructor() { this.event = () => {}; } fire() {} dispose() {} }
  const vscode = {
    EventEmitter: Emitter,
    workspace: { isTrusted: trusted, getWorkspaceFolder(uri) {
      calls.folder.push(uri);
      return selectedFolder === null ? undefined : { uri: { fsPath: roots[selectedFolder] } };
    } },
    window: {
      activeTextEditor: { document: doc },
      showWarningMessage: async (message, ...buttons) => {
        calls.prompts.push({ message, buttons }); return selection;
      },
      showErrorMessage: async message => { calls.messages.push(message); },
      showInformationMessage: async message => { calls.messages.push(message); },
      createTerminal: options => { calls.terminals.push(options); return { show() {} }; },
    },
  };
  const runner = options => { calls.runner.push(options); return {
    completion: Promise.resolve({ stdout: '', stderr: '', exitCode: 0, outputTruncated: false }),
    sendInput(value) { calls.inputs.push(value); }, cancel() { calls.cancellations++; },
  }; };
  const runtimeManager = { async resolveWorkspace(workspaceRoot) {
    calls.runtime.push(workspaceRoot);
    if (!contributor) return { status: 'unavailable', message: 'Pinned runtime is not published.' };
    return { status: 'ready', runtimeMode: 'contributor', runtimeRoot: workspaceRoot, uvPath: 'uv', uvEnvironment: {} };
  } };
  const handler = createRunFileHandler({ vscode, runtimeManager, fs: { existsSync: p => existing.has(p) }, path, startKafeFile: runner });
  return { handler, calls, doc, vscode, roots };
}

test('Run starts only for trusted active KAFE editor', async () => {
  for (const options of [{ trusted: false }, { languageId: 'plaintext' }]) {
    const fixture = setup(options);
    await fixture.handler();
    assert.equal(fixture.calls.terminals.length, 0);
    assert.equal(fixture.calls.runner.length, 0);
    assert.equal(fixture.calls.messages.length, 1);
  }
});

test('dirty editor requires Save; cancel and failed save never start a process', async () => {
  for (const options of [{ dirty: true, selection: 'Cancel' }, { dirty: true, saveResult: false },
    { dirty: true, selection: null }]) {
    const fixture = setup(options);
    await fixture.handler();
    assert.equal(fixture.calls.terminals.length, 0);
    assert.equal(fixture.calls.runner.length, 0);
  }
  const fixture = setup({ dirty: true });
  await fixture.handler();
  assert.equal(fixture.doc.saveCalls, 1);
  assert.equal(fixture.calls.terminals.length, 1);
});

test('Run uses matching workspace in a multi-root project and launches from pseudo terminal', async () => {
  const fixture = setup();
  await fixture.handler();
  assert.deepEqual(fixture.calls.folder, [fixture.doc.uri]);
  assert.equal(fixture.calls.runner.length, 0);
  fixture.calls.terminals[0].pty.open();
  assert.equal(fixture.calls.runner.length, 1);
  assert.equal(fixture.calls.runner[0].runtimeRoot, fixture.roots[1]);
  assert.equal(fixture.calls.runner[0].runtimeMode, 'contributor');
  assert.equal(fixture.calls.runner[0].uvPath, 'uv');
  assert.equal(fixture.calls.runner[0].filePath, fixture.doc.uri.fsPath);
  fixture.calls.terminals[0].pty.handleInput('42\r');
  assert.deepEqual(fixture.calls.inputs, ['42\n']);
  fixture.calls.terminals[0].pty.close();
  assert.equal(fixture.calls.cancellations, 1);
});

test('missing parser and non-contributor runtime prevent process launch', async () => {
  const missing = setup({ generated: false });
  await missing.handler();
  assert.equal(missing.calls.terminals.length, 0);
  assert.match(missing.calls.messages[0], /Kafe_GrammarLexer.py/);
  assert.match(missing.calls.messages[0], /antlr-4\.13\.2-complete\.jar/);
  assert.equal(ANTLR_COMMAND, 'java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4');
  assert.match(missing.calls.messages[0], new RegExp(ANTLR_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const learner = setup({ contributor: false });
  await learner.handler();
  assert.equal(learner.calls.terminals.length, 0);
  assert.match(learner.calls.messages[0], /runtime/i);
});

test('no matching workspace prevents launch', async () => {
  const fixture = setup({ selectedFolder: null });
  await fixture.handler();
  assert.equal(fixture.calls.terminals.length, 0);
  assert.equal(fixture.calls.runner.length, 0);
});

test('Run passes a verified managed runtime and its isolated uv environment to the runner', async () => {
  const fixture = setup({ contributor: false });
  fixture.vscode.workspace.getWorkspaceFolder = () => ({ uri: { fsPath: fixture.roots[1] } });
  fixture.handler = createRunFileHandler({
    vscode: fixture.vscode,
    runtimeManager: { async resolveWorkspace(root) {
      fixture.calls.runtime.push(root);
      return {
        status: 'ready', runtimeMode: 'managed', runtimeRoot: 'C:/extension-storage/runtime-0.1.0',
        uvPath: 'C:/extension-storage/uv/uv.exe',
        uvEnvironment: { UV_PROJECT_ENVIRONMENT: 'C:/extension-storage/python/env', UV_CACHE_DIR: 'C:/extension-storage/cache' },
      };
    } },
    fs: { existsSync: () => true }, path,
    startKafeFile: options => {
      fixture.calls.runner.push(options);
      return { completion: Promise.resolve({ stdout: '', stderr: '', exitCode: 0, outputTruncated: false }), sendInput() {}, cancel() {} };
    },
  });
  await fixture.handler();
  assert.equal(fixture.calls.terminals.length, 1);
  fixture.calls.terminals[0].pty.open();
  assert.equal(fixture.calls.runner[0].runtimeMode, 'managed');
  assert.equal(fixture.calls.runner[0].runtimeRoot, 'C:/extension-storage/runtime-0.1.0');
  assert.deepEqual(fixture.calls.runner[0].env, {
    UV_PROJECT_ENVIRONMENT: 'C:/extension-storage/python/env', UV_CACHE_DIR: 'C:/extension-storage/cache',
  });
});

test('learner Run completion records versioned evidence in the injected tutor host without provider execution', async () => {
  const fixture = setup();
  let finish;
  let providerCalls = 0;
  const host = createTutorHost({ vscode: fixture.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { stream: async () => { providerCalls++; throw new Error('unexpected provider call'); } } });
  fixture.handler = createRunFileHandler({ vscode: fixture.vscode, path,
    fs: { existsSync: () => true },
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeMode: 'managed',
      runtimeRoot: 'C:/managed', runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', uvPath: 'uv', uvEnvironment: {} }) },
    startKafeFile: () => ({ completion: new Promise(resolve => { finish = resolve; }), sendInput() {}, cancel() {} }),
    onRunResult: result => { host.coordinator.recordRunResult(result); host.tutorView.render(host.coordinator.snapshot()); },
  });
  await fixture.handler();
  assert.equal(host.coordinator.evidence, null);
  fixture.calls.terminals[0].pty.open();
  assert.equal(host.coordinator.evidence, null);
  finish({ stdout: '2\n', stderr: '', exitCode: 0, outputTruncated: false });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(host.coordinator.evidence, { stdout: '2\n', stderr: '', exitCode: 0, runtimeMode: 'managed',
    outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceUri: fixture.doc.uri.toString(), runSequence: 1 });
  assert.equal(providerCalls, 0);
});

test('contributor Run completion records null versions and explicit contributor provenance', async () => {
  const fixture = setup();
  const host = createTutorHost({ vscode: fixture.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { stream: async () => { throw new Error('unexpected provider call'); } } });
  const handler = createRunFileHandler({ vscode: fixture.vscode, path,
    fs: { existsSync: () => true },
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeMode: 'contributor',
      runtimeRoot: fixture.roots[1], uvPath: 'uv', uvEnvironment: {} }) },
    startKafeFile: () => ({ completion: Promise.resolve({ stdout: '', stderr: 'problem', exitCode: 1,
      outputTruncated: false }), sendInput() {}, cancel() {} }),
    onRunResult: result => host.coordinator.recordRunResult(result),
  });
  await handler();
  fixture.calls.terminals[0].pty.open();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(host.coordinator.evidence.runtimeMode, 'contributor');
  assert.equal(host.coordinator.evidence.runtimeVersion, null);
  assert.equal(host.coordinator.evidence.knowledgePackVersion, null);
  assert.equal(host.coordinator.evidence.sourceUri, fixture.doc.uri.toString());
});

test('older learner Run completion cannot replace evidence from a newer-started Run', async () => {
  const fixture = setup();
  fixture.doc.uri.scheme = 'file';
  fixture.doc.uri.toString = () => 'file:///workspace/main.kf';
  const finishers = [];
  const host = createTutorHost({ vscode: fixture.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { stream: async () => { throw new Error('unexpected provider'); } } });
  const handler = createRunFileHandler({ vscode: fixture.vscode, path, fs: { existsSync: () => true },
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeMode: 'managed',
      runtimeRoot: fixture.roots[1], uvPath: 'uv', uvEnvironment: {}, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0' }) },
    startKafeFile: () => ({ completion: new Promise(resolve => finishers.push(resolve)), sendInput() {}, cancel() {} }),
    onRunResult: result => host.coordinator.recordRunResult(result) });
  await handler(); fixture.calls.terminals[0].pty.open();
  await handler(); fixture.calls.terminals[1].pty.open();
  finishers[1]({ stdout: 'NEWER_RESULT', stderr: '', exitCode: 0, outputTruncated: false });
  await new Promise(resolve => setImmediate(resolve));
  finishers[0]({ stdout: 'OLDER_RESULT', stderr: '', exitCode: 0, outputTruncated: false });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(host.coordinator.evidence.stdout, 'NEWER_RESULT');
  assert.equal(host.coordinator.evidence.sourceUri, fixture.doc.uri.toString());
});

test('runtime-unavailable learner route never creates a terminal or invokes the process runner', async () => {
  const fixture = setup({ contributor: false });
  await fixture.handler();
  assert.equal(fixture.calls.terminals.length, 0);
  assert.equal(fixture.calls.runner.length, 0);
  assert.match(fixture.calls.messages[0], /not published/i);
});
