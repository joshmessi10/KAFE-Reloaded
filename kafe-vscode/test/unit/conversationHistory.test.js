const assert = require('node:assert/strict');
const test = require('node:test');
const history = () => require('../../src/tutor/ConversationHistory');
const pair = (id, learnerText = '问题🙂', assistantText = '`show(1)` 答案', dependencies = { fileUris: [], knowledgeLineage: null }) => ({ id, learnerText, assistantText, dependencies });

test('selects newest eight whole completed pairs and reports omissions oldest first', () => {
  const pairs = Array.from({ length: 10 }, (_, i) => pair(String(i)));
  const result = history().selectHistory({ pairs, authorizedFileUris: [], knowledgeLineage: null });
  assert.deepEqual(result.pairs.map(item => item.id), ['2', '3', '4', '5', '6', '7', '8', '9']);
  assert.deepEqual(result.omissions, [{ id: '0', reason: 'pair-limit' }, { id: '1', reason: 'pair-limit' }]);
  assert.equal(result.byteLength, 8 * (Buffer.byteLength('问题🙂', 'utf8') + Buffer.byteLength('`show(1)` 答案', 'utf8')));
  assert.ok(result.byteLength <= 32768);
});

test('UTF-8 budget drops oldest pairs and individually oversized pairs without truncation', () => {
  const pairs = [pair('old', '界'.repeat(6000), ''), pair('huge', '🙂'.repeat(8193), ''), pair('new', '🙂'.repeat(4000), 'inline `code`')];
  const result = history().selectHistory({ pairs, authorizedFileUris: [], knowledgeLineage: null });
  assert.deepEqual(result.pairs.map(item => item.id), ['new']);
  assert.equal(result.pairs[0].learnerText, '🙂'.repeat(4000));
  assert.equal(result.byteLength, 16013);
  assert.deepEqual(result.omissions, [{ id: 'old', reason: 'byte-limit' }, { id: 'huge', reason: 'oversized-pair' }]);
});

test('revocation excludes inherited file and changed pack dependencies', () => {
  const { mergeDependencies, selectHistory } = history();
  const fileA = 'file:///work/a.kf', fileB = 'file:///work/b.kf';
  const inherited = mergeDependencies([{ fileUris: [fileA], knowledgeLineage: 'pack-v1' }, { fileUris: [fileB], knowledgeLineage: null }]);
  const pairs = [pair('A', 'A question', 'A answer', { fileUris: [fileA], knowledgeLineage: null }), pair('B-inherits-A', 'B question', 'B answer', inherited), pair('B', 'B question', 'B answer', { fileUris: [fileB], knowledgeLineage: null })];
  assert.deepEqual(selectHistory({ pairs, authorizedFileUris: [fileB], knowledgeLineage: 'pack-v1' }).pairs.map(item => item.id), ['B']);
  assert.deepEqual(selectHistory({ pairs, authorizedFileUris: [fileA, fileB], knowledgeLineage: 'pack-v2' }).pairs.map(item => item.id), ['A', 'B']);
  assert.deepEqual(inherited, { fileUris: [fileA, fileB], knowledgeLineage: 'pack-v1' });
  assert.throws(() => mergeDependencies([{ fileUris: [], knowledgeLineage: 'a' }, { fileUris: [], knowledgeLineage: 'b' }]), /lineage/i);
});

test('partial cancelled failed or malformed entries cannot enter provider history', () => {
  const { selectHistory } = history();
  const result = selectHistory({ pairs: [pair('completed'), { ...pair('partial'), status: 'streaming' }, { ...pair('cancelled'), status: 'cancelled' }, { ...pair('failed'), status: 'failed' }, { id: 'host', text: 'setup' }], authorizedFileUris: [], knowledgeLineage: null });
  assert.deepEqual(result.pairs.map(item => item.id), ['completed']);
  result.pairs[0].dependencies.fileUris.push('file:///mutated.kf');
  assert.deepEqual(selectHistory({ pairs: [pair('completed')], authorizedFileUris: [], knowledgeLineage: null }).dependencies.fileUris, []);
});

test('byte budget omits older eligible pairs first even if an older smaller pair could fit', () => {
  const { selectHistory } = history();
  const result = selectHistory({ pairs: [pair('old-small', 'small', ''), pair('middle', 'x'.repeat(20000), ''), pair('newest', 'x'.repeat(20000), '')], authorizedFileUris: [], knowledgeLineage: null });
  assert.deepEqual(result.pairs.map(pair => pair.id), ['newest']);
  assert.deepEqual(result.omissions.map(item => item.id), ['old-small', 'middle']);
});
