const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createRunFileHandler, createProviderKeyHandlers, createClearProgressHandler, createTutorHost, ANTLR_COMMAND } = require('../../extension');
const PINNED_RUNTIME = require('../../src/runtimeManifest').runtime;
const { MAX_FILE_BYTES } = require('../../src/tutor/DevelopmentKnowledgePack');

test('recordReviewedCheck stores a relative source path only for a KAFE file inside an open workspace', async () => {
  const root = 'C:\\workspace';
  const vscode = { Uri: { parse: value => {
    const parsed = new URL(value);
    return { scheme: parsed.protocol.slice(0, -1), fsPath: decodeURIComponent(parsed.pathname).replace(/^\/(C:)/, '$1').replaceAll('/', '\\'),
      toString: () => value };
  } }, window: {}, workspace: { getWorkspaceFolder: uri =>
    uri.scheme === 'file' && uri.fsPath.toLowerCase().startsWith(root.toLowerCase()) ?
      { uri: { fsPath: root } } : undefined } };
  const host = createTutorHost({ vscode, extensionUri: {}, secrets: {},
    workspaceState: { values: new Map(), get(key) { return this.values.get(key); },
      async update(key, value) { if (value === undefined) this.values.delete(key); else this.values.set(key, value); } },
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) } });
  for (const [sourceUri, expected] of [
    ['file:///C:/workspace/examples/main.kf', 'examples/main.kf'],
    ['file:///C:/workspace2/outside.kf', undefined],
  ]) {
    const sequence = host.coordinator.lastRunSequence + 1;
    host.coordinator.recordRunResult({ stdout: 'PRIVATE', stderr: '', exitCode: 0, outputTruncated: false,
      runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri, runSequence: sequence });
    const result = await host.coordinator.handleLearnerMessage({ type: 'recordReviewedCheck', runSequence: sequence,
      label: 'Reviewed', outcome: 'passed' });
    assert.equal(result.kind, 'coaching');
    assert.equal(host.coordinator.state.completedChecks.at(-1).sourcePath, expected);
  }
  assert.equal(host.coordinator.getWorkspaceRelativeSourcePath('file:///C:/workspace/readme.md'), null);
  assert.equal(host.coordinator.getWorkspaceRelativeSourcePath('untitled:main.kf'), null);
});

test('Tutor host tags the transient render produced by a failed reviewed-check response', async () => {
  const host = createTutorHost({
    vscode: { window: {}, workspace: {} }, extensionUri: {}, secrets: {},
    workspaceState: { get() { return undefined; }, async update() { throw new Error('storage unavailable'); } },
    runtimeManager: {}, provider: { complete: async () => { throw new Error('unexpected provider call'); } },
  });
  host.coordinator.recordRunResult({ stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeVersion: null, knowledgePackVersion: null, runtimeMode: 'contributor',
    sourceUri: 'file:///workspace/main.kf', runSequence: 1 });
  let rendered;
  host.tutorView.render = state => { rendered = state; };

  await host.tutorView.onMessage({ type: 'recordReviewedCheck', runSequence: 1,
    label: 'Loop output', outcome: 'failed' });

  assert.equal(rendered.responseMessageType, 'recordReviewedCheck');
  assert.match(rendered.interactionStatus, /could not be saved/i);
  assert.equal(Object.hasOwn(host.coordinator.state, 'responseMessageType'), false,
    'response metadata is kept off coordinator progress state');
  assert.deepEqual(host.coordinator.state.completedChecks, []);
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
    workspace: { openTextDocument: async () => { throw new Error('unexpected document read'); } },
  };
  const createHost = mode => createTutorHost({
    vscode, extensionUri: {}, secrets: {}, extensionMode: mode, extensionPath,
    runtimeManager: { storageRoot, manifest: { runtime }, getReadyRuntime: async () => readyRuntime },
    provider: { complete: async request => { providerCalls.push(request); return { text: 'Try one feature at a time.', toolCalls: [] }; } },
  });
  return { host: createHost(extensionMode), createHost, temporary, storageRoot, providerCalls };
}

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

test('clear-progress command uses the same coordinator path as Tutor button and renders cleared state', async () => {
  const messages = [];
  const rendered = [];
  const coordinator = { state: { goal: 'before' }, async handleLearnerMessage(message) {
    messages.push(message);
    this.state = { goal: '' };
  } };
  await createClearProgressHandler({ coordinator, tutorView: { render: state => rendered.push(state) } })();
  assert.deepEqual(messages, [{ type: 'clearProgress' }]);
  assert.deepEqual(rendered, [{ goal: '' }]);
});

test('provider key commands use password input and SecretStorage only without provider requests', async () => {
  const key = 'fake-test-key-NOT-REAL';
  const calls = { store: [], delete: [], prompt: [], message: [], provider: 0 };
  const handlers = createProviderKeyHandlers({
    secrets: { store: async (...args) => calls.store.push(args), delete: async value => calls.delete.push(value) },
    vscode: { window: {
      showInputBox: async options => { calls.prompt.push(options); return key; },
      showInformationMessage: async message => calls.message.push(message),
    } },
    provider: { complete: async () => { calls.provider++; } },
  });
  await handlers.configure();
  await handlers.clear();
  assert.equal(calls.prompt[0].password, true);
  assert.deepEqual(calls.store, [['kafe.deepseekApiKey', key]]);
  assert.deepEqual(calls.delete, ['kafe.deepseekApiKey']);
  assert.equal(calls.provider, 0);
  assert.ok(!JSON.stringify({ prompt: calls.prompt, message: calls.message }).includes(key));
});

test('host preview fails closed on absent managed knowledge pack without provider or runtime execution', async () => {
  let providerCalls = 0;
  let packChecks = 0;
  const host = createTutorHost({
    vscode: { window: {}, workspace: { openTextDocument: async () => { throw new Error('unexpected read'); } } },
    extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => { packChecks++; return { status: 'missing' }; },
      resolveWorkspace: async () => { throw new Error('runtime execution forbidden'); } },
    provider: { complete: async () => { providerCalls++; throw new Error('provider execution forbidden'); } },
  });
  await host.coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  await host.coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
  const turn = await host.coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help' });
  assert.equal(turn.kind, 'error');
  assert.equal(packChecks, 1);
  assert.equal(providerCalls, 0);
  assert.equal(host.coordinator.state.preview, null);
});

test('Tutor host renders milestone confirmation and managed-pack preview errors as visible interaction feedback', async () => {
  const host = createTutorHost({
    vscode: { window: {}, workspace: { openTextDocument: async () => { throw new Error('unexpected read'); } } },
    extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }),
      resolveWorkspace: async () => { throw new Error('runtime execution forbidden'); } },
    provider: { complete: async () => { throw new Error('provider execution forbidden'); } },
  });
  const rendered = [];
  host.tutorView.render = state => rendered.push({
    milestoneStatus: state.milestoneStatus,
    interactionStatus: state.interactionStatus,
  });

  await host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
  await host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
  assert.match(rendered.at(-1).milestoneStatus, /milestones confirmed/i);

  await host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help with lists' });
  assert.match(rendered.at(-1).interactionStatus, /managed KAFE knowledge pack is required/i);
  assert.equal(host.coordinator.state.preview, null);
});

test('Tutor host keeps a context-review coaching turn visible when it is not in conversation history', async () => {
  const host = createTutorHost({
    vscode: { window: {}, workspace: {} }, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { complete: async () => { throw new Error('unexpected provider call'); } },
  });
  const rendered = [];
  host.tutorView.render = state => rendered.push(state.interactionStatus);
  host.coordinator.handleLearnerMessage = async message => {
    host.coordinator.state.preview = { draft: message.text };
    return { kind: 'coaching', text: 'Review the updated context preview before sending.' };
  };

  await host.tutorView.onMessage({ type: 'sendMessage', text: 'Question' });
  assert.equal(rendered.at(-1), 'Review the updated context preview before sending.');
});

test('development host builds a matching local pack and previews curated KAFE knowledge without calling the provider', async () => {
  const fixture = developmentTutorFixture();
  try {
    await fixture.host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
    await fixture.host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
    await fixture.host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });

    const state = fixture.host.coordinator.state;
    assert.ok(state.preview);
    const knowledgeSource = state.contextSources.find(source => source.category === 'knowledge');
    assert.ok(knowledgeSource);
    assert.match(knowledgeSource.label, /development.*0\.1\.0.*0\.1\.0/i);
    assert.ok(state.preview.payload.messages.some(message => message.content.includes('LISTS_LESSON_SENTINEL')));
    assert.equal(JSON.stringify(state.preview.payload).includes('EXTENSION_PRIVATE_SENTINEL'), false);
    assert.equal(fixture.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(fixture); }
});

test('development host uses the confirmed learning topic when the learner asks to get started', async () => {
  const fixture = developmentTutorFixture();
  try {
    fs.writeFileSync(path.join(fixture.temporary, 'docs', 'libraries', 'lesson.md'), [
      'A supervised regression model can predict SalePrice from house features.',
      'Fit a baseline model and evaluate its predictions on held-out validation data.',
    ].join('\n\n'));
    fs.writeFileSync(path.join(fixture.temporary, 'docs', 'getting-started', 'lesson.md'),
      'General getting started installation instructions for the KAFE runtime.');

    await fixture.host.tutorView.onMessage({ type: 'startSession',
      goal: 'Create a supervised model for house prices and predict SalePrice' });
    await fixture.host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [
      { id: 'first', text: 'Identify SalePrice as the prediction target and choose a baseline regression model' },
    ] });
    await fixture.host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Let us get started' });

    const payload = fixture.host.coordinator.state.preview.payload;
    assert.ok(payload.messages.some(message => message.content.includes('supervised regression model')));
    assert.equal(payload.messages.some(message => message.content.includes('installation instructions')), false);
    assert.equal(fixture.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(fixture); }
});

test('development tutor pack rejects incompatible runtime and knowledge-pack versions', async () => {
  const fixture = developmentTutorFixture({ runtime: { ...PINNED_RUNTIME, knowledgePackVersion: '0.2.0' } });
  try {
    await fixture.host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
    await fixture.host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
    await fixture.host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });

    assert.equal(fixture.host.coordinator.state.preview, null);
    assert.match(fixture.host.coordinator.state.interactionStatus, /version.*match|mismatch/i);
    assert.equal(fixture.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(fixture); }
});

test('production and test modes ignore a local checkout knowledge pack and continue to fail closed', async () => {
  const fixture = developmentTutorFixture({ extensionMode: 1 });
  try {
    for (const mode of [1, 3]) {
      const host = fixture.createHost(mode);
      await host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
      await host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
      await host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });
      assert.equal(host.coordinator.state.preview, null);
      assert.match(host.coordinator.state.interactionStatus, /managed KAFE knowledge pack is required/i);
    }
    assert.equal(fs.existsSync(path.join(fixture.storageRoot, 'kafe-tutor-development')), false);
    assert.equal(fixture.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(fixture); }
});

test('development Tutor prefers a verified managed pack over its local checkout source', async () => {
  const fixture = developmentTutorFixture();
  try {
    const runtimeRoot = path.join(fixture.storageRoot, 'installed-runtime');
    const managedPack = path.join(runtimeRoot, 'knowledge-pack', 'libraries');
    fs.mkdirSync(managedPack, { recursive: true });
    fs.writeFileSync(path.join(managedPack, 'regression.md'),
      'MANAGED_REGRESSION_SENTINEL: A supervised regression model predicts SalePrice for houses.');
    const managedHost = createTutorHost({
      vscode: {
        ExtensionMode: { Production: 1, Development: 2, Test: 3 }, window: {},
        workspace: { openTextDocument: async () => { throw new Error('unexpected document read'); } },
      },
      extensionUri: {}, secrets: {}, extensionMode: 2, extensionPath: path.join(fixture.temporary, 'kafe-vscode'),
      runtimeManager: { storageRoot: fixture.storageRoot, manifest: { runtime: PINNED_RUNTIME },
        getReadyRuntime: async () => ({ status: 'ready', runtimeMode: 'managed', runtimeRoot,
          runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0' }) },
      provider: { complete: async () => { fixture.providerCalls.push('unexpected'); } },
    });
    await managedHost.tutorView.onMessage({ type: 'startSession',
      goal: 'Create a supervised model for house prices and predict SalePrice' });
    await managedHost.tutorView.onMessage({ type: 'confirmMilestones', milestones: [
      { id: 'first', text: 'Identify SalePrice as the prediction target' },
    ] });
    await managedHost.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Let us get started' });

    const knowledgeSource = managedHost.coordinator.state.contextSources.find(source => source.category === 'knowledge');
    assert.match(knowledgeSource.label, /^Managed KAFE runtime 0\.1\.0 · knowledge pack 0\.1\.0:/);
    assert.ok(managedHost.coordinator.state.preview.payload.messages.some(message =>
      message.content.includes('MANAGED_REGRESSION_SENTINEL')));
    assert.equal(fs.existsSync(path.join(fixture.storageRoot, 'kafe-tutor-development')), false);
    assert.equal(fixture.providerCalls.length, 0);
  } finally { removeDevelopmentFixture(fixture); }
});

test('development tutor pack rejects a tampered cache before returning preview passages', async () => {
  const fixture = developmentTutorFixture();
  try {
    await fixture.host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
    await fixture.host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
    await fixture.host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });
    const cachedLesson = findFile(fixture.storageRoot, 'lists.md');
    assert.ok(cachedLesson);
    fs.writeFileSync(cachedLesson, 'TAMPERED_DEVELOPMENT_PACK\n');

    const nextHost = fixture.createHost(2);
    await nextHost.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
    await nextHost.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
    await nextHost.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });

    assert.equal(nextHost.coordinator.state.preview, null);
    assert.match(nextHost.coordinator.state.interactionStatus, /integrity|tamper/i);
  } finally { removeDevelopmentFixture(fixture); }
});

test('development tutor pack rejects oversized learner documentation', async () => {
  const fixture = developmentTutorFixture();
  try {
    fs.writeFileSync(path.join(fixture.temporary, 'docs', 'language', 'oversized.md'), 'x'.repeat(MAX_FILE_BYTES + 1));
    await fixture.host.tutorView.onMessage({ type: 'startSession', goal: 'Learn lists' });
    await fixture.host.tutorView.onMessage({ type: 'confirmMilestones', milestones: [{ id: 'first', text: 'Index a list' }] });
    await fixture.host.tutorView.onMessage({ type: 'sendMessage', phase: 'preview', text: 'Help me understand KAFE list indexing' });

    assert.equal(fixture.host.coordinator.state.preview, null);
    assert.match(fixture.host.coordinator.state.interactionStatus, /size limit|too large|exceeds/i);
  } finally { removeDevelopmentFixture(fixture); }
});

test('host exposes selected-file candidates from the active workspace and includes only learner-approved content', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-tutor-context-'));
  const pack = path.join(temporary, 'knowledge-pack');
  fs.mkdirSync(pack);
  fs.writeFileSync(path.join(pack, 'lists.md'), 'KAFE lists use indexes.');
  const uri = (name, scheme = 'file') => ({ scheme, fsPath: `C:/workspace/${name}`,
    toString() { return `${scheme}:///C:/workspace/${name}`; } });
  const document = (name, text, languageId = 'kafe', scheme = 'file') => ({ uri: uri(name, scheme),
    languageId, version: 1, getText: () => text });
  const active = document('main.kf', 'main <- 1');
  const optional = document('other.kf', 'OPTIONAL_SECRET_MARKER <- 2');
  const excluded = [document('readme.md', 'markdown', 'markdown'),
    document('virtual.kf', 'virtual', 'kafe', 'untitled')];
  const calls = [];
  const docs = new Map([active, optional, ...excluded].map(item => [item.uri.toString(), item]));
  const vscode = { window: { activeTextEditor: { document: active },
    visibleTextEditors: [active, optional, ...excluded, optional].map(item => ({ document: item })) },
  workspace: { getWorkspaceFolder: candidate => candidate.scheme === 'file' && candidate.fsPath.startsWith('C:/workspace/') ?
    { uri: uri('') } : undefined, openTextDocument: async candidate => docs.get(candidate.toString()) } };
  try {
    const host = createTutorHost({ vscode, extensionUri: {}, secrets: {},
      runtimeManager: { getReadyRuntime: async () => ({ status: 'ready', runtimeMode: 'managed',
        runtimeRoot: temporary, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0' }) },
      provider: { complete: async request => { calls.push(request); return { text: 'Try indexing the first item.', toolCalls: [] }; } } });
    await host.coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
    await host.coordinator.handleLearnerMessage({ type: 'confirmMilestones', milestones: [{ id: 'one', text: 'Index a list' }] });
    await host.coordinator.handleLearnerMessage({ type: 'sendMessage', phase: 'preview', text: 'Help with lists' });
    assert.equal(calls.length, 0);
    const selectedId = host.coordinator.state.contextSources.find(source => source.category === 'selected-file')?.id;
    assert.ok(host.coordinator.state.contextSources.some(source => source.id === selectedId && !source.included));
    assert.equal(host.coordinator.state.contextSources.filter(source => source.category === 'selected-file').length, 1);
    assert.equal(JSON.stringify(host.coordinator.state.preview.payload).includes('OPTIONAL_SECRET_MARKER'), false);
    await host.coordinator.handleLearnerMessage({ type: 'setContextSourceIncluded', id: selectedId, included: true });
    const preview = host.coordinator.state.preview;
    assert.ok(preview);
    assert.ok(JSON.stringify(preview.payload).includes('OPTIONAL_SECRET_MARKER'));
    assert.ok(host.coordinator.state.contextSources.some(source => source.id === selectedId && source.included));
    await host.coordinator.handleLearnerMessage({ type: 'sendMessage', text: preview.draft, previewToken: preview.token });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].messages, preview.payload.messages);
    assert.deepEqual(calls[0].tools, preview.payload.tools);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

function setup({ trusted = true, languageId = 'kafe', dirty = false, saveResult = true,
  selectedFolder = 1, contributor = true, generated = true, selection = 'Save' } = {}) {
  const roots = ['C:/other', 'C:/KAFE repo'];
  const doc = { languageId, isDirty: dirty, uri: { scheme: 'file', fsPath: 'C:/KAFE repo/examples/test.kf',
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
    provider: { complete: async () => { providerCalls++; throw new Error('unexpected provider call'); } } });
  fixture.handler = createRunFileHandler({ vscode: fixture.vscode, path,
    fs: { existsSync: () => true },
    runtimeManager: { resolveWorkspace: async () => ({ status: 'ready', runtimeMode: 'managed',
      runtimeRoot: 'C:/managed', runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', uvPath: 'uv', uvEnvironment: {} }) },
    startKafeFile: () => ({ completion: new Promise(resolve => { finish = resolve; }), sendInput() {}, cancel() {} }),
    onRunResult: result => { host.coordinator.recordRunResult(result); host.tutorView.render(host.coordinator.state); },
  });
  await fixture.handler();
  assert.equal(host.coordinator.state.evidence, null);
  fixture.calls.terminals[0].pty.open();
  assert.equal(host.coordinator.state.evidence, null);
  finish({ stdout: '2\n', stderr: '', exitCode: 0, outputTruncated: false });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(host.coordinator.state.evidence, { stdout: '2\n', stderr: '', exitCode: 0, runtimeMode: 'managed',
    outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceUri: fixture.doc.uri.toString(), runSequence: 1 });
  assert.equal(providerCalls, 0);
});

test('contributor Run completion records null versions and explicit contributor provenance', async () => {
  const fixture = setup();
  const host = createTutorHost({ vscode: fixture.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { complete: async () => { throw new Error('unexpected provider call'); } } });
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
  assert.equal(host.coordinator.state.evidence.runtimeMode, 'contributor');
  assert.equal(host.coordinator.state.evidence.runtimeVersion, null);
  assert.equal(host.coordinator.state.evidence.knowledgePackVersion, null);
  assert.equal(host.coordinator.state.evidence.sourceUri, fixture.doc.uri.toString());
});

test('older learner Run completion cannot replace evidence from a newer-started Run', async () => {
  const fixture = setup();
  fixture.doc.uri.scheme = 'file';
  fixture.doc.uri.toString = () => 'file:///workspace/main.kf';
  const finishers = [];
  const host = createTutorHost({ vscode: fixture.vscode, extensionUri: {}, secrets: {},
    runtimeManager: { getReadyRuntime: async () => ({ status: 'missing' }) },
    provider: { complete: async () => { throw new Error('unexpected provider'); } } });
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
  assert.equal(host.coordinator.state.evidence.stdout, 'NEWER_RESULT');
  assert.equal(host.coordinator.state.evidence.sourceUri, fixture.doc.uri.toString());
});

test('runtime-unavailable learner route never creates a terminal or invokes the process runner', async () => {
  const fixture = setup({ contributor: false });
  await fixture.handler();
  assert.equal(fixture.calls.terminals.length, 0);
  assert.equal(fixture.calls.runner.length, 0);
  assert.match(fixture.calls.messages[0], /not published/i);
});
