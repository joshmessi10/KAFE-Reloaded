const assert = require('node:assert/strict');
const test = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');
const { ConversationManager } = require('../../src/tutor/ConversationManager');
const { createConversationCommands } = require('../../src/tutor/ConversationCommands');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { CONVERSATIONS_KEY } = require('../../src/tutor/ConversationStore');

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function fixture(values = new Map()) {
  const errors = [], writes = [];
  const workspaceState = { get: key => values.get(key), async update(key, value) {
    writes.push(structuredClone(value)); values.set(key, structuredClone(value));
  } };
  const coordinator = new SessionCoordinator();
  const manager = new ConversationManager({ coordinator, workspaceState, debounceMs: 2, onError: message => errors.push(message) });
  const vscode = { Uri: { file: value => value, joinPath: (uri, name) => `${uri}/${name}` },
    window: { showSaveDialog: async () => 'output.json', showErrorMessage: async message => errors.push(message) },
    workspace: { workspaceFolders: [{ uri: 'workspace' }], fs: { async writeFile(uri, data) { writes.push({ uri, json: JSON.parse(data.toString('utf8')) }); } } } };
  const commands = createConversationCommands({ vscode, manager });
  return { values, workspaceState, coordinator, manager, errors, writes, vscode, commands,
    async close() { await manager.dispose(); coordinator.dispose(); } };
}

test('workspace chats preserve independent transcripts, drafts and preferences across switching and restart', async () => {
  const f = fixture(), first = f.manager.activeId;
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: 'Explain KAFE functions' });
  f.coordinator.session.setDraft('first draft');
  f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } });
  assert.equal((await f.manager.newConversation()).status, 'completed');
  const second = f.manager.activeId;
  assert.notEqual(second, first); assert.equal(f.manager.list().length, 2);
  assert.equal(f.coordinator.snapshot().draft, '');
  f.coordinator.session.setDraft('second draft');
  await f.manager.switchConversation(first);
  assert.equal(f.coordinator.snapshot().draft, 'first draft');
  assert.deepEqual(f.coordinator.snapshot().learning.preferences, { mode: 'paused' });
  assert.equal(f.coordinator.snapshot().entries[0].text, 'Explain KAFE functions');
  await f.close();
  const reopened = fixture(f.values);
  assert.equal(reopened.manager.activeId, first);
  assert.equal(reopened.coordinator.snapshot().draft, 'first draft');
  await reopened.manager.switchConversation(second);
  assert.equal(reopened.coordinator.snapshot().draft, 'second draft');
  assert.deepEqual(reopened.coordinator.snapshot().learning.preferences, { mode: 'guided' });
  await reopened.close();
});

test('rename persists current title without stopping a response; deletion selects another chat', async () => {
  const f = fixture(), original = f.manager.activeId; let stops = 0;
  const stop = f.coordinator.stopConversationResponse.bind(f.coordinator);
  f.coordinator.stopConversationResponse = () => { stops++; return stop(); };
  await f.manager.renameConversation(original, 'My learning notes');
  assert.equal(f.manager.record().title, 'My learning notes'); assert.equal(stops, 0);
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations[0].title, 'My learning notes');
  await f.manager.newConversation();
  const added = f.manager.activeId;
  await f.manager.deleteConversation(added);
  assert.equal(f.manager.activeId, original); assert.equal(f.manager.list().length, 1);
  await f.manager.deleteConversation(original);
  assert.notEqual(f.manager.activeId, original); assert.equal(f.manager.list().length, 1);
  await f.close();
});

for (const failAt of [1, 2]) test(`failed archive write ${failAt} preserves departing chat, draft and generation`, async () => {
  const f = fixture(), original = f.manager.activeId;
  f.coordinator.session.setDraft('Never lose this');
  const generation = f.coordinator.snapshot().generation;
  let attempts = 0;
  const update = f.workspaceState.update;
  f.workspaceState.update = async (...args) => { if (++attempts === failAt) throw Error('PRIVATE_STORAGE_ERROR'); return update(...args); };
  assert.equal((await f.manager.newConversation()).status, 'failed');
  assert.equal(f.manager.activeId, original); assert.equal(f.manager.list().length, 1);
  assert.equal(f.coordinator.snapshot().draft, 'Never lose this');
  assert.equal(f.coordinator.snapshot().generation, generation);
  assert.equal(f.errors.length, 1); assert.doesNotMatch(f.errors[0], /PRIVATE/);
  f.workspaceState.update = update;
  assert.equal((await f.manager.newConversation()).status, 'completed');
  await f.close();
});

test('malformed saved archive is preserved and never overwritten by temporary chat', async () => {
  const raw = { schemaVersion: 3, secret: 'PRIVATE' }, values = new Map([[CONVERSATIONS_KEY, raw]]);
  const f = fixture(values); await Promise.resolve();
  f.coordinator.session.setDraft('temporary');
  assert.equal((await f.manager.newConversation()).status, 'failed');
  assert.deepEqual(values.get(CONVERSATIONS_KEY), raw); assert.equal(f.writes.length, 0);
  assert.match(f.errors[0], /preserved/); await f.close();
});

test('debounced autosave and disposal persist the latest draft', async () => {
  const f = fixture();
  f.coordinator.session.setDraft('autosaved');
  await delay(20); if (f.manager.flushing) await f.manager.flushing;
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations[0].content.draft, 'autosaved');
  f.coordinator.session.setDraft('last keystroke');
  await f.close();
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations[0].content.draft, 'last keystroke');
});

test('metadata notifications preserve a pending content save deadline while new content restarts it', async () => {
  const f = fixture(); f.manager.debounceMs = 30;
  try {
    f.coordinator.session.setDraft('first');
    const first = f.manager.timer;
    f.coordinator.session.setDraft('latest');
    const pending = f.manager.timer;
    assert.notEqual(pending, first, 'new content restarts the debounce');
    for (let i = 0; i < 10; i++) f.coordinator.publishLearning();
    assert.equal(f.manager.timer, pending, 'metadata must not postpone the content deadline');
    await delay(60); if (f.manager.flushing) await f.manager.flushing;
    assert.equal(f.writes.length, 1);
    assert.equal(f.writes[0].conversations[0].content.draft, 'latest');
    f.coordinator.session.setDraft('next');
    await delay(60); if (f.manager.flushing) await f.manager.flushing;
    assert.equal(f.writes.length, 2);
    assert.equal(f.writes[1].conversations[0].content.draft, 'next');
  } finally { await f.close(); }
});

test('draft typed while storage awaits is included before transition commits', async () => {
  const f = fixture(), original = f.manager.activeId, entered = deferred(), gate = deferred();
  const update = f.workspaceState.update; let attempts = 0;
  f.workspaceState.update = async (...args) => { if (++attempts === 2) { entered.resolve(); await gate.promise; } return update(...args); };
  const changing = f.manager.newConversation();
  await entered.promise;
  f.coordinator.session.setDraft('typed during save'); gate.resolve();
  assert.equal((await changing).status, 'completed');
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations.find(record => record.id === original).content.draft, 'typed during save');
  await f.manager.switchConversation(original);
  assert.equal(f.coordinator.snapshot().draft, 'typed during save'); await f.close();
});

test('workspace storage is isolated and simultaneous New commands are serialized', async () => {
  const a = fixture(), b = fixture(); a.coordinator.session.setDraft('Workspace A');
  await Promise.all([a.manager.newConversation(), a.manager.newConversation()]);
  assert.equal(a.manager.list().length, 3); assert.equal(b.manager.list().length, 1);
  assert.equal(b.coordinator.snapshot().draft, ''); await a.close(); await b.close();
});

test('selected JSON export stays bound to its captured chat while Save dialog is open', async () => {
  const f = fixture(), gate = deferred(), selected = f.manager.activeId;
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: 'Código\n```kf\nshow("☕");\n```' });
  f.vscode.window.showSaveDialog = options => { assert.deepEqual(options.filters, { JSON: ['json'] }); return gate.promise; };
  const exporting = f.commands.exportConversation();
  await f.manager.newConversation();
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: 'Other conversation' });
  gate.resolve('chosen.json');
  assert.equal((await exporting).status, 'completed');
  const output = f.writes.find(write => write.uri === 'chosen.json').json;
  assert.equal(output.conversation.id, selected);
  assert.match(output.conversation.entries[0].text, /Código/);
  assert.doesNotMatch(JSON.stringify(output), /Other conversation|historyPairs|preferences|actions/);
  await f.close();
});

test('cancelled export writes nothing and write failure is reported without private errors', async () => {
  const f = fixture(); f.vscode.window.showSaveDialog = async () => undefined;
  assert.equal((await f.commands.exportConversation()).status, 'cancelled'); assert.equal(f.writes.length, 0);
  f.vscode.window.showSaveDialog = async () => 'output.json';
  f.vscode.workspace.fs.writeFile = async () => { throw Error('PRIVATE_PATH'); };
  assert.equal((await f.commands.exportConversation()).status, 'failed');
  assert.equal(f.errors.length, 1); assert.doesNotMatch(f.errors[0], /PRIVATE_PATH/); await f.close();
});

for (const command of ['switchConversation', 'renameConversation', 'deleteConversation']) test(`${command} rejects a stale native dialog`, async () => {
  const f = fixture(), gate = deferred(); let choices;
  f.vscode.window.showQuickPick = values => { choices = values; return gate.promise; };
  f.vscode.window.showInputBox = () => gate.promise;
  f.vscode.window.showWarningMessage = () => gate.promise;
  const pending = f.commands[command]();
  await f.manager.newConversation(); const current = f.manager.activeId;
  gate.resolve(command === 'switchConversation' ? choices[0] : command === 'renameConversation' ? 'Wrong chat' : 'Delete conversation');
  assert.equal((await pending).status, 'stale'); assert.equal(f.manager.activeId, current);
  assert.equal(f.manager.list().length, 2); assert.notEqual(f.manager.record().title, 'Wrong chat'); await f.close();
});

test('Apply busy gate prevents new/switch/delete without changing transcript', async () => {
  const f = fixture(), original = f.manager.activeId;
  f.coordinator.canTransitionConversation = () => false;
  assert.equal((await f.manager.newConversation()).status, 'busy');
  assert.equal((await f.manager.deleteConversation(original)).status, 'busy');
  assert.equal(f.manager.activeId, original); assert.equal(f.manager.list().length, 1); await f.close();
});

test('oversized private draft does not block recovery export or explicitly confirmed deletion', async () => {
  const f = fixture();
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: 'Keep this visible message' });
  f.coordinator.session.setDraft('x'.repeat(3 * 1024 * 1024));
  await assert.rejects(f.manager.flush(), /limit/);
  const exported = JSON.parse(f.manager.selectedExport().json);
  assert.equal(exported.conversation.entries[0].text, 'Keep this visible message');
  assert.equal(Object.hasOwn(exported.conversation, 'draft'), false);
  assert.equal((await f.manager.deleteConversation(f.manager.activeId)).status, 'completed');
  assert.equal(f.coordinator.snapshot().draft, ''); await f.close();
});

test('Apply starting during storage prevents restore and restores persisted selection', async () => {
  const f = fixture(), original = f.manager.activeId, update = f.workspaceState.update;
  let attempts = 0;
  f.workspaceState.update = async (...args) => {
    await update(...args);
    if (++attempts === 2) f.coordinator.acceptingProposalId = 'busy-apply';
  };
  assert.equal((await f.manager.newConversation()).status, 'busy');
  assert.equal(f.manager.activeId, original);
  assert.equal(f.values.get(CONVERSATIONS_KEY).activeId, original);
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations.length, 1);
  f.coordinator.acceptingProposalId = null; await f.close();
});

test('selecting the current conversation is a true no-op during a response', async () => {
  const f = fixture(); let stops = 0;
  f.coordinator.stopConversationResponse = () => { stops++; return { status: 'completed' }; };
  const generation = f.coordinator.snapshot().generation;
  assert.equal((await f.manager.switchConversation(f.manager.activeId)).status, 'cancelled');
  assert.equal(stops, 0); assert.equal(f.coordinator.snapshot().generation, generation);
  assert.equal(f.writes.length, 0); await f.close();
});

test('shutdown flush during destination write cannot overwrite the new archive with the departing chat', async () => {
  const f = fixture(), entered = deferred(), gate = deferred(), update = f.workspaceState.update;
  let attempts = 0;
  f.workspaceState.update = async (...args) => { if (++attempts === 2) { entered.resolve(); await gate.promise; } return update(...args); };
  const changing = f.manager.newConversation(); await entered.promise;
  const shutdownSave = f.manager.flush(); gate.resolve();
  await changing; await shutdownSave;
  const saved = f.values.get(CONVERSATIONS_KEY);
  assert.equal(saved.activeId, f.manager.activeId);
  assert.equal(saved.conversations.length, 2); await f.close();
});

test('returning to the original chat does not revive an old Delete confirmation', async () => {
  const f = fixture(), original = f.manager.activeId, gate = deferred();
  f.vscode.window.showWarningMessage = () => gate.promise;
  const deleting = f.commands.deleteConversation();
  await f.manager.newConversation(); await f.manager.switchConversation(original);
  gate.resolve('Delete conversation');
  assert.equal((await deleting).status, 'stale');
  assert.equal(f.manager.list().length, 2); await f.close();
});

test('exporting does not rewrite the conversation modification timestamp', async () => {
  const f = fixture();
  const before = f.manager.record().updatedAt;
  f.manager.now = () => '2030-01-01T00:00:00.000Z';
  assert.equal(JSON.parse(f.manager.selectedExport().json).conversation.updatedAt, before); await f.close();
});

test('a quiescent burst defers persistence captures and saves once with the last mutation date', async () => {
  const f = fixture(); let captures = 0;
  const capture = f.coordinator.captureConversation.bind(f.coordinator);
  f.coordinator.captureConversation = () => { captures++; return capture(); };
  let date = '2030-01-01T00:00:00.000Z'; f.manager.now = () => date;
  try {
    for (let i = 0; i < 100; i++) f.coordinator.session.setDraft(`draft ${i}`);
    assert.equal(captures, 0, 'notifications do not capture persistence content');
    date = '2030-01-02T00:00:00.000Z';
    await delay(20); if (f.manager.flushing) await f.manager.flushing;
    assert.equal(f.writes.length, 1); assert.equal(captures, 2, 'capture before and after the awaited write');
    assert.equal(f.writes[0].conversations[0].content.draft, 'draft 99');
    assert.equal(f.writes[0].conversations[0].updatedAt, '2030-01-01T00:00:00.000Z');
  } finally { await f.close(); }
});

for (const revert of [false, true]) test(`awaited save includes ${revert ? 'edit/revert recency' : 'latest mutation'} with only two writes`, async () => {
  const f = fixture(), gate = deferred(), entered = deferred(), update = f.workspaceState.update;
  f.manager.debounceMs = 60000;
  let attempts = 0; f.workspaceState.update = async (...args) => {
    if (++attempts === 1) { entered.resolve(); await gate.promise; } return update(...args);
  };
  f.manager.now = () => '2030-01-01T00:00:00.000Z'; f.coordinator.session.setDraft('original');
  const saving = f.manager.flush(); const settled = saving.then(() => null, error => error);
  try {
    await entered.promise;
    f.manager.now = () => '2030-01-02T00:00:00.000Z'; f.coordinator.session.setDraft('edited');
    if (revert) f.coordinator.session.setDraft('original');
    gate.resolve(); assert.equal(await settled, null);
    assert.equal(f.writes.length, 2);
    assert.equal(f.writes[0].conversations[0].content.draft, 'original');
    assert.equal(f.writes[0].conversations[0].updatedAt, '2030-01-01T00:00:00.000Z');
    assert.equal(f.writes[1].conversations[0].content.draft, revert ? 'original' : 'edited');
    assert.equal(f.writes[1].conversations[0].updatedAt, '2030-01-02T00:00:00.000Z');
  } finally { gate.resolve(); await settled; await f.close(); }
});

test('metadata-only context, actions and learning view changes preserve dates, title and selection', async () => {
  const f = fixture(); f.manager.debounceMs = 60000;
  const id = f.coordinator.session.appendEntry({ kind: 'host', status: 'ready', text: 'Ready', data: { ignored: 'first' } });
  await f.manager.flush(); const before = f.manager.list(), activeId = f.manager.activeId, writes = f.writes.length;
  f.manager.now = () => '2030-01-01T00:00:00.000Z';
  let captures = 0; const capture = f.coordinator.captureConversation.bind(f.coordinator);
  f.coordinator.captureConversation = () => { captures++; return capture(); };
  try {
    f.coordinator.session.setContext({ restricted: false, activeSource: null, sources: [
      { id: 'optional:a', uri: 'file:///a.kf', label: 'a.kf', category: 'selected-file', included: true } ] });
    f.coordinator.session.setSelectedSources([]);
    f.coordinator.session.registerAction(id, { type: 'retryTurn', label: 'Retry', enabled: true, args: { turnId: 'old' } });
    f.coordinator.session.updateEntry(id, { data: { ignored: 'second' } });
    f.coordinator.preferenceChangeQueued = true; f.coordinator.publishLearning();
    assert.equal(captures, 0); assert.equal(f.writes.length, writes);
    assert.deepEqual(f.manager.list(), before); assert.equal(f.manager.activeId, activeId);
    assert.equal(f.coordinator.snapshot().context.sources[0].included, false);
  } finally { await f.close(); }
});

test('immediate list/export/switch/dispose preserve the freshest partial text, draft, title and full pairs', async () => {
  const f = fixture(); f.manager.debounceMs = 60000; const first = f.manager.activeId;
  f.manager.now = () => '2030-01-01T00:00:00.000Z';
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: 'First question' });
  const answer = f.coordinator.session.appendEntry({ kind: 'assistant', status: 'responding', text: 'Partial' });
  f.coordinator.session.updateEntry(answer, { text: 'Partial latest' }); f.coordinator.session.setDraft('next draft');
  f.coordinator.session.recordCompletedPair({ id: 'pair', learnerText: 'Earlier', assistantText: 'Answer', dependencies: { fileUris: [], knowledgeLineage: null } });
  assert.equal(f.manager.record().title, 'First question', 'title notification remains immediate');
  const exported = JSON.parse(f.manager.selectedExport().json).conversation;
  assert.equal(exported.title, 'First question'); assert.equal(exported.entries.at(-1).text, 'Partial latest');
  const list = f.manager.list(); list[0].title = 'observer mutation';
  assert.equal(f.manager.record().title, 'First question');
  assert.equal((await f.manager.newConversation()).status, 'completed');
  const saved = f.values.get(CONVERSATIONS_KEY).conversations.find(record => record.id === first);
  assert.equal(saved.content.draft, 'next draft'); assert.equal(saved.content.entries.length, 2);
  assert.equal(saved.content.entries.at(-1).text, 'Partial latest'); assert.equal(saved.content.historyPairs.length, 1);
  await f.manager.switchConversation(first); f.coordinator.session.setDraft('final draft'); await f.close();
  assert.equal(f.values.get(CONVERSATIONS_KEY).conversations.find(record => record.id === first).content.draft, 'final draft');
});

for (const surface of ['session', 'coordinator']) for (const mutateDraft of [false, true]) test(`reentrant ${surface} ${mutateDraft ? 'content' : 'metadata'} observer before the manager preserves dirty state`, async () => {
  const { ConversationSession } = require('../../src/tutor/ConversationSession');
  const session = new ConversationSession(), writes = [], seen = []; let reentered = false, coordinator;
  const observe = state => {
    if (state.draft === 'first' && !reentered) {
      reentered = true;
      if (mutateDraft) coordinator.session.setDraft('latest');
      else if (surface === 'session') session.setContext({ restricted: true, activeSource: null, sources: [] });
      else coordinator.publishLearning();
    }
  };
  if (surface === 'session') session.subscribe(observe);
  coordinator = new SessionCoordinator({ session });
  if (surface === 'coordinator') coordinator.subscribe(observe);
  const manager = new ConversationManager({ coordinator, debounceMs: 2,
    workspaceState: { get: () => undefined, async update(key, value) { writes.push(structuredClone(value)); } } });
  coordinator.subscribe(state => seen.push(state));
  try {
    coordinator.session.setDraft('first');
    await delay(20); if (manager.flushing) await manager.flushing;
    assert.equal(writes.length, 1, 'nested publication cannot hide a content mutation');
    assert.equal(writes[0].conversations[0].content.draft, mutateDraft ? 'latest' : 'first');
    assert.ok(seen.every(state => state.draft === (mutateDraft ? 'latest' : 'first')));
  } finally { await manager.dispose(); coordinator.dispose(); }
});

test('reentrant metadata after the manager does not duplicate a content mutation or its timestamp', async () => {
  const f = fixture(); f.manager.debounceMs = 60000; let calls = 0, nested = false;
  f.manager.now = () => { calls++; return '2030-01-01T00:00:00.000Z'; };
  f.coordinator.subscribe(() => { if (!nested) { nested = true; f.coordinator.publishLearning(); } });
  f.coordinator.session.setDraft('one mutation');
  assert.equal(calls, 1); await f.close();
});

test('captured history does not change recency again on a later metadata notification', async () => {
  const f = fixture(); f.manager.debounceMs = 60000;
  f.coordinator.session.recordCompletedPair({ id: 'pair', learnerText: 'Question', assistantText: 'Answer', dependencies: { fileUris: [], knowledgeLineage: null } });
  f.manager.now = () => '2030-01-01T00:00:00.000Z'; await f.manager.flush();
  const before = f.manager.list(); f.manager.now = () => '2030-01-02T00:00:00.000Z';
  f.coordinator.session.setContext({ restricted: true, activeSource: null, sources: [] });
  assert.deepEqual(f.manager.list(), before); await f.close();
});

test('resetting identical empty archive content changes generation without changing recency', async () => {
  const f = fixture(), before = f.manager.list(), generation = f.coordinator.snapshot().generation;
  f.manager.now = () => '2030-01-01T00:00:00.000Z';
  f.coordinator.newConversation();
  assert.equal(f.coordinator.snapshot().generation, generation + 1);
  assert.deepEqual(f.manager.list(), before); await f.close();
});

test('control-bearing pasted text generates a safe title while transcript and export preserve the original', async () => {
  const f = fixture(), message = 'Explain \u001b[31mRED\u001b[0m ANSI output';
  f.coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: message });
  await f.manager.flush();
  assert.doesNotMatch(f.manager.record().title, /[\x00-\x1f\x7f]/);
  assert.equal(JSON.parse(f.manager.selectedExport().json).conversation.entries[0].text, message);
  assert.equal((await f.manager.newConversation()).status, 'completed'); await f.close();
});

test('legacy selected chat remains live and inert after failed first upgrade, export, restart and explicit retry', async () => {
  const date = '2026-10-25T12:00:00.000Z';
  const record = (id, mode, level) => ({ id, title: `Café ☕ ${id}`, createdAt: date, updatedAt: date,
    content: { draft: `¿Qué sigue? ${id}`, preferences: { mode, level }, historyPairs: [], entries: [
      { id: 'old-checkpoint', kind: 'checkpoint', status: 'ready', text: 'Historical Expert choice', data: null, actions: [] },
      { id: 'answer', kind: 'assistant', status: 'completed', text: 'Exact old response.\r\n☕', data: null, actions: [] },
    ] } });
  const original = { schemaVersion: 1, activeId: 'selected', conversations: [record('first', 'guided', 'beginner'), record('selected', 'paused', 'expert')] };
  const values = new Map([[CONVERSATIONS_KEY, structuredClone(original)]]), f = fixture(values);
  try {
    assert.equal(f.writes.length, 0); assert.equal(f.manager.activeId, 'selected');
    assert.deepEqual(f.coordinator.snapshot().learning.preferences, { mode: 'paused' });
    assert.equal(f.coordinator.snapshot().draft, '¿Qué sigue? selected');
    assert.equal(f.coordinator.snapshot().entries[0].status, 'stale');
    assert.ok(f.coordinator.snapshot().entries.every(entry => entry.actions.length === 0));
    assert.equal(f.coordinator.proposal, null); assert.equal(f.coordinator.controller.isBusy(), false);
    const update = f.workspaceState.update;
    f.workspaceState.update = async () => { throw Error('disk unavailable'); };
    await assert.rejects(f.manager.flush(), /disk unavailable/);
    assert.deepEqual(values.get(CONVERSATIONS_KEY), original); assert.equal(f.manager.activeId, 'selected');
    assert.equal(f.coordinator.snapshot().entries[1].text, original.conversations[1].content.entries[1].text);
    assert.match(f.errors[0], /current chat is still open.*try again or export/);
    assert.equal((await f.commands.exportConversation()).status, 'completed');
    const exported = f.writes.find(write => write.json).json;
    assert.equal(exported.schemaVersion, 1); assert.equal(exported.conversation.id, 'selected');
    assert.equal(exported.conversation.entries[1].text, original.conversations[1].content.entries[1].text);
    const restarted = fixture(values);
    assert.equal(restarted.manager.activeId, 'selected'); assert.deepEqual(restarted.coordinator.snapshot().learning.preferences, { mode: 'paused' });
    assert.deepEqual(values.get(CONVERSATIONS_KEY), original);
    await restarted.close();
    f.workspaceState.update = update; await f.manager.flush();
    assert.equal(values.get(CONVERSATIONS_KEY).schemaVersion, 2);
    await f.manager.switchConversation('first'); assert.deepEqual(f.coordinator.snapshot().learning.preferences, { mode: 'guided' });
  } finally { await f.close(); }
});
