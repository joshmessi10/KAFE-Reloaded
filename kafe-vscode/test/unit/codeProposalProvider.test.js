const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { CodeProposalProvider } = require('../../src/tutor/CodeProposalProvider');

function fixture() {
  const original = { scheme: 'file', path: '/workspace/example.kf', toString() { return 'file:///workspace/example.kf'; } };
  let document = { uri: original, languageId: 'kafe', version: 7, text: 'print(1)',
    getText() { return this.text; }, positionAt(offset) { return { offset }; } };
  const edits = [];
  const diffs = [];
  let applyResult = true;
  class WorkspaceEdit { replace(...args) { edits.push(args); } }
  class Range { constructor(start, end) { this.start = start; this.end = end; } }
  const vscode = { Uri: { parse: value => ({ scheme: value.split(':')[0], path: value.split(':')[1], toString() { return value; } }) },
    Range, WorkspaceEdit, commands: { executeCommand: async (...args) => { diffs.push(args); } },
    workspace: { openTextDocument: async () => document,
      applyEdit: async () => { if (applyResult) document.text = edits.at(-1)[2]; return applyResult; } } };
  const provider = new CodeProposalProvider({ vscode });
  const proposal = () => ({ uri: original, documentVersion: 7,
    contentSha256: createHash('sha256').update('print(1)').digest('hex'), newText: 'print(2)' });
  return { provider, vscode, proposal, original, edits, diffs, get document() { return document; },
    setDocument(value) { document = value; }, setApplyResult(value) { applyResult = value; } };
}

test('virtual proposal is read only and opens original-left native diff without applying', async () => {
  const f = fixture();
  const summary = f.provider.stage(f.proposal());
  assert.deepEqual(Object.keys(summary).sort(), ['description', 'id']);
  assert.ok(!JSON.stringify(summary).includes('print(2)'));
  const opened = await f.provider.open(summary.id);
  assert.equal(opened.status, 'opened');
  assert.equal(f.diffs[0][0], 'vscode.diff');
  assert.equal(f.diffs[0][1], f.original);
  assert.equal(f.diffs[0][2].scheme, 'kafe-proposal');
  assert.equal(f.provider.provideTextDocumentContent(f.diffs[0][2]), 'print(2)');
  assert.deepEqual(f.edits, []);
});

test('matching explicit acceptance applies exactly one whole-document text edit', async () => {
  const f = fixture();
  const { id } = f.provider.stage(f.proposal());
  assert.equal((await f.provider.accept(id)).status, 'invalid');
  assert.deepEqual(f.edits, []);
  await f.provider.open(id);
  assert.equal((await f.provider.accept('wrong')).status, 'invalid');
  assert.deepEqual(f.edits, []);
  const result = await f.provider.accept(id);
  assert.equal(result.status, 'applied');
  assert.equal(f.edits.length, 1);
  assert.equal(f.edits[0][0], f.original);
  assert.deepEqual(f.edits[0][1].start, { offset: 0 });
  assert.deepEqual(f.edits[0][1].end, { offset: 8 });
  assert.equal(f.edits[0][2], 'print(2)');
  assert.equal(f.document.text, 'print(2)');
  assert.equal((await f.provider.accept(id)).status, 'invalid');
});

test('matching rejection and clear discard proposal without writing', async () => {
  const f = fixture();
  const { id } = f.provider.stage(f.proposal());
  assert.equal(f.provider.reject('wrong').status, 'invalid');
  assert.equal(f.provider.reject(id).status, 'rejected');
  assert.equal((await f.provider.accept(id)).status, 'invalid');
  const next = f.provider.stage(f.proposal());
  f.provider.clear();
  assert.equal((await f.provider.accept(next.id)).status, 'invalid');
  assert.deepEqual(f.edits, []);
});

test('changed URI, version, hash and oversized text reject stale proposal with no edit', async () => {
  for (const change of ['uri', 'version', 'hash']) {
    const f = fixture();
    const { id } = f.provider.stage(f.proposal());
    await f.provider.open(id);
    const doc = { ...f.document };
    if (change === 'uri') doc.uri = { scheme: 'file', toString: () => 'file:///workspace/other.kf' };
    if (change === 'version') doc.version = 8;
    if (change === 'hash') doc.text = 'print(3)';
    f.setDocument(doc);
    assert.equal((await f.provider.accept(id)).status, 'stale');
    assert.deepEqual(f.edits, []);
    assert.equal((await f.provider.accept(id)).status, 'invalid');
  }
  const f = fixture();
  assert.throws(() => f.provider.stage({ ...f.proposal(), newText: 'x'.repeat(64 * 1024 + 1) }));
});

test('failed apply reports failure and clears proposal without a second or partial write', async () => {
  const f = fixture();
  const { id } = f.provider.stage(f.proposal());
  await f.provider.open(id);
  f.setApplyResult(false);
  assert.equal((await f.provider.accept(id)).status, 'failed');
  assert.equal(f.document.text, 'print(1)');
  assert.equal(f.edits.length, 1);
  assert.equal((await f.provider.accept(id)).status, 'invalid');
});

test('concurrent matching accepts are single-flight and issue exactly one write', async () => {
  const f = fixture();
  const { id } = f.provider.stage(f.proposal());
  await f.provider.open(id);
  let openCalls = 0;
  let writes = 0;
  let releaseFirst;
  const firstGate = new Promise(resolve => { releaseFirst = resolve; });
  let firstEntered;
  const entered = new Promise(resolve => { firstEntered = resolve; });
  f.vscode.workspace.openTextDocument = async () => {
    openCalls++;
    if (openCalls === 1) { firstEntered(); await firstGate; }
    return f.document;
  };
  f.vscode.workspace.applyEdit = async () => { writes++; return true; };
  const first = f.provider.accept(id);
  await entered;
  const second = await f.provider.accept(id);
  releaseFirst();
  const firstResult = await first;
  assert.equal(second.status, 'invalid');
  assert.equal(firstResult.status, 'applied');
  assert.equal(openCalls, 1);
  assert.equal(writes, 1);
});

for (const action of ['reject', 'clear']) {
  test(`${action} during source read cancels acceptance before any edit`, async () => {
    const f = fixture();
    const { id } = f.provider.stage(f.proposal());
    await f.provider.open(id);
    let enteredRead;
    const entered = new Promise(resolve => { enteredRead = resolve; });
    let releaseRead;
    const gate = new Promise(resolve => { releaseRead = resolve; });
    let writes = 0;
    f.vscode.workspace.openTextDocument = async () => { enteredRead(); await gate; return f.document; };
    f.vscode.workspace.applyEdit = async () => { writes++; return true; };
    const first = f.provider.accept(id);
    await entered;
    const cancelled = action === 'reject' ? f.provider.reject(id) : f.provider.clear();
    releaseRead();
    const firstResult = await first;
    assert.equal(cancelled?.status, action === 'reject' ? 'rejected' : 'cleared');
    assert.equal(firstResult.status, 'cancelled');
    assert.equal(writes, 0);
    assert.equal(f.provider.pending, null);
  });
}

test('reject and clear report busy after apply begins and do not hide an in-flight write', async () => {
  const f = fixture();
  const { id } = f.provider.stage(f.proposal());
  await f.provider.open(id);
  let enteredApply;
  const entered = new Promise(resolve => { enteredApply = resolve; });
  let releaseApply;
  const gate = new Promise(resolve => { releaseApply = resolve; });
  let writes = 0;
  f.vscode.workspace.applyEdit = async () => { writes++; enteredApply(); await gate; return true; };
  const first = f.provider.accept(id);
  await entered;
  const rejected = f.provider.reject(id);
  const cleared = f.provider.clear();
  const pendingId = f.provider.pending?.id;
  releaseApply();
  const firstResult = await first;
  assert.equal(rejected.status, 'busy');
  assert.equal(cleared?.status, 'busy');
  assert.equal(pendingId, id);
  assert.equal(firstResult.status, 'applied');
  assert.equal(writes, 1);
  assert.equal(f.provider.pending, null);
});

test('scoped clear for superseded A cannot delete current B', () => {
  const f = fixture();
  const first = f.provider.stage(f.proposal());
  const second = f.provider.stage({ ...f.proposal(), newText: 'print(3)' });
  assert.equal(f.provider.clear(first.id).status, 'invalid');
  assert.equal(f.provider.pending.id, second.id);
  assert.equal(f.provider.clear(second.id).status, 'cleared');
  assert.equal(f.provider.pending, null);
});

test('a failed older diff open cannot clear a newer staged proposal', async () => {
  const f = fixture();
  let failOlderOpen;
  f.vscode.commands.executeCommand = () => new Promise((resolve, reject) => { failOlderOpen = reject; });
  const first = f.provider.stage(f.proposal());
  const openingFirst = f.provider.open(first.id);
  const second = f.provider.stage({ ...f.proposal(), newText: 'print(3)' });
  failOlderOpen(new Error('private failure details'));
  assert.equal((await openingFirst).status, 'failed');
  assert.equal(f.provider.pending.id, second.id);
});
