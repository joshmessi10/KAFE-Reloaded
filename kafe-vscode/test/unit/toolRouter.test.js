const assert = require('node:assert/strict');
const test = require('node:test');

test('provider cannot manufacture host evidence through a tool name or Run arguments', async () => {
  const { ToolRouter } = require('../../src/tutor/ToolRouter');
  const router = new ToolRouter({ documentReader: {}, knowledgeRetriever: {} }), context = { snapshot: { sources: [] } };
  await assert.rejects(router.route({ name: 'recordActionEvidence', arguments: { outcome: 'applied' } }, context), /Unknown tutor tool/);
  await assert.rejects(router.route({ name: 'getLatestRunResult', arguments: { sourceObservation: { sourceRelationship: 'unchanged-at-observed-boundaries' } } }, context), /arguments are invalid/);
});
const { createHash } = require('node:crypto');
const { ToolRouter, TOOL_NAMES, selectedSourceId } = require('../../src/tutor/ToolRouter');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const uri = path => ({ scheme: 'file', path, toString() { return `file://${path}`; } });
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const snapshot = (id, path, text = 'reviewed buffer', version = 3) => ({ id, category: id === 'active-file' ? 'active-file' : 'selected-file', uri: uri(path).toString(), text, version, contentSha256: sha(text), provenance: { uri: uri(path).toString() } });
const review = sources => ({ sources });
const reader = { readDocument: async () => { throw Error('Live read forbidden'); } };

test('absent captured active document is recoverable only for valid default reads', async () => {
  let reads = 0;
  const router = new ToolRouter({ documentReader: { readDocument: async () => { reads++; throw Error('Live read forbidden'); } }, knowledgeRetriever: {} });
  const context = { snapshot: review([]), activeDocument: { uri: uri('/live.kf'), text: 'LIVE', version: 1 } };
  assert.deepEqual(await router.route({ name: 'readActiveDocument', arguments: {} }, context), { status: 'unavailable', code: 'no_active_document' });
  for (const args of ['{', { path: '/secret' }, { sourceId: null }, { sourceId: 'active-file' }, { sourceId: `selected:${'a'.repeat(64)}` }]) await assert.rejects(router.route({ name: 'readActiveDocument', arguments: args }, context));
  await assert.rejects(router.route({ name: 'proposeCodeChange', arguments: { newText: 'change' } }, context), /unavailable/);
  for (const captured of [{ ...snapshot('active-file', '/work/main.kf'), contentSha256: 'invalid' }, { ...snapshot('active-file', '/work/main.kf'), category: 'knowledge' }, { ...snapshot('active-file', '/work/main.kf'), id: 'wrong-id' }]) await assert.rejects(router.route({ name: 'readActiveDocument', arguments: {} }, { snapshot: review([captured]) }));
  assert.equal(reads, 0);
});

test('tools read reviewed bytes after buffer changes without any live reader call', async () => {
  let liveReaderCalls = 0;
  const router = new ToolRouter({ documentReader: { readDocument: async () => { liveReaderCalls++; return { text: 'live buffer' }; } }, knowledgeRetriever: { search: async () => [] } });
  const context = { snapshot: review([snapshot('active-file', '/work/main.kf')]), activeDocument: { uri: uri('/work/main.kf'), text: 'later live buffer', version: 4 } };
  assert.deepEqual(await router.route({ name: 'readActiveDocument', arguments: {} }, context), { uri: 'file:///work/main.kf', text: 'reviewed buffer', version: 3 });
  assert.equal(liveReaderCalls, 0);
});

test('router selected IDs resolve only immutable included snapshots after reorder', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf'), aId = selectedSourceId(a), bId = selectedSourceId(b);
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { search: async () => [] } });
  const context = { snapshot: review([snapshot(bId, '/work/b.kf', 'B')]), candidateUris: [b, a], includedSourceIds: [aId, bId] };
  assert.equal((await router.route({ name: 'readActiveDocument', arguments: { sourceId: bId } }, context)).text, 'B');
  for (const name of ['readActiveDocument', 'proposeCodeChange']) await assert.rejects(() => router.route({ name, arguments: { sourceId: aId, ...(name === 'proposeCodeChange' ? { newText: 'change' } : {}) } }, context), /selected/i);
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: {} }, { activeDocument: { uri: a, text: 'LIVE', version: 1 } }), /snapshot/i);
});

test('router preserves five-tool allowlist and rejects malformed executable and oversized operations', async () => {
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { search: async () => [] } });
  const context = { snapshot: review([snapshot('active-file', '/work/main.kf')]) };
  assert.deepEqual(TOOL_NAMES, ['readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange', 'proposeLearningCheckpoint']);
  for (const call of [{ name: 'runKafe', arguments: {} }, { name: 'shell', arguments: {} }, { name: 'readActiveDocument', arguments: '{' }, { name: 'searchKafeKnowledge', arguments: { query: 1 } }, { name: 'readActiveDocument', arguments: { path: '/secret' } }, { name: 'proposeCodeChange', arguments: { newText: 'x'.repeat(64 * 1024 + 1) } }]) await assert.rejects(() => router.route(call, context));
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: {} }, { snapshot: review([snapshot('active-file', '/work/main.kf', 'x'.repeat(64 * 1024 + 1))]) }), /size/i);
});

test('proposal guards use reviewed URI version hash and never apply or reread an edit', async () => {
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { search: async () => [] } });
  const result = await router.route({ name: 'proposeCodeChange', arguments: { newText: 'show(2)' } }, { snapshot: review([snapshot('active-file', '/work/main.kf', 'show(1)', 4)]), authorizePreparation: target => target.uri === 'file:///work/main.kf' && target.version === 4 && target.contentSha256 === sha('show(1)') });
  assert.equal(result.uri, 'file:///work/main.kf'); assert.equal(result.documentVersion, 4); assert.equal(result.contentSha256, sha('show(1)')); assert.equal(result.newText, 'show(2)');
  await assert.rejects(() => router.route({ name: 'proposeCodeChange', arguments: { newText: 'x' } }, { snapshot: review([snapshot('active-file', '/work/main.txt')]) }), /KAFE/i);
});

test('reviewed run evidence decodes through validator with explicit source and sequence provenance', async () => {
  const composer = new ContextComposer({ documentReader: reader, knowledgeRetriever: { search: async () => [] } });
  const activeDocument = { uri: uri('/work/main.kf'), text: 'show(1)', version: 1 };
  const runResult = { stdout: 'reviewed output', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '1', knowledgePackVersion: '1', sourceUri: activeDocument.uri.toString(), runSequence: 7 };
  const composed = await composer.compose({ request: 'Help', activeDocument, runResult });
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { search: async () => [] } });
  const context = { snapshot: review(composed.snapshots), runResult: { ...runResult, stdout: 'later run output', runSequence: 8 } };
  assert.equal((await router.route({ name: 'getLatestRunResult', arguments: {} }, context)).stdout, 'reviewed output');
  const run = composed.snapshots.find(source => source.id === 'run-result');
  assert.equal(run.provenance.runSequence, 7); assert.equal(run.provenance.sourceUri, activeDocument.uri.toString());
  assert.equal(await router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: review([]) }), null);
  const invalid = { ...run, text: JSON.stringify({ stdout: 'x', stderr: '', exitCode: 0, outputTruncated: false }) };
  await assert.rejects(() => router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: review([composed.snapshots[0], invalid]) }), /shape|snapshot/i);
});

test('knowledge tool crossing a pack replacement cannot return refreshable bytes under the new pack', async () => {
  const { metadataLineage } = require('../../src/tutor/ContextComposer');
  const packA = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack-A', contentSha256: 'a'.repeat(64) };
  let currentPack = packA;
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { getKnowledgeLineage: async () => metadataLineage(currentPack), search: async () => {
    const passage = { id: 'language/x.md#1', path: 'language/x.md', category: 'language', text: 'PACK_A_BYTES', ...currentPack };
    currentPack = { ...packA, packIdentity: 'pack-B', contentSha256: 'b'.repeat(64) };
    return [passage];
  } } });
  await assert.rejects(() => router.route({ name: 'searchKafeKnowledge', arguments: { query: 'lists' } }, { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: metadataLineage(packA) } } }), error => error.code === 'KNOWLEDGE_LINEAGE_CHANGED' && error.passages === undefined);
});

test('A-B-A search cannot stamp A bytes as B', async () => {
  const { metadataLineage } = require('../../src/tutor/ContextComposer');
  const packA = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack-A', contentSha256: 'a'.repeat(64) };
  const packB = { ...packA, packIdentity: 'pack-B', contentSha256: 'b'.repeat(64) };
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: {
    getKnowledgeLineage: async () => metadataLineage(packB),
    search: async () => [{ id: 'language/x.md#1', path: 'language/x.md', category: 'language', text: 'PACK_A_BYTES', ...packA }],
  } });
  await assert.rejects(() => router.route({ name: 'searchKafeKnowledge', arguments: { query: 'lists' } },
    { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: metadataLineage(packB) } } }),
  error => error.code === 'KNOWLEDGE_LINEAGE_CHANGED');
});

test('knowledge availability error becomes a typed tool result', async () => {
  const { KnowledgeUnavailable } = require('../../src/tutor/KnowledgeRetriever');
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: {
    getKnowledgeLineage: async () => 'pack',
    search: async () => { throw new KnowledgeUnavailable('knowledge_missing'); },
  } });
  assert.deepEqual(await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'lists' } },
    { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: 'pack' } } }),
  { status: 'unavailable', code: 'knowledge_missing' });
});


test('same authorized pack returns new validated passage bytes without a second Send', async () => {
  const passage = { id: 'new', path: 'language/new.md', category: 'language', text: 'NEW BYTES', knowledgeLineage: 'pack' };
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { getKnowledgeLineage: async () => 'pack', search: async () => [passage] } });
  const result = await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'new' } }, { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: 'pack' } } });
  assert.deepEqual(result, [passage]); result[0].text = 'mutated'; assert.equal(passage.text, 'NEW BYTES');
});

test('unavailable snapshot never authorizes a newly appearing pack or file tools in restricted mode', async () => {
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { search: async () => { throw Error('must not search'); } } });
  const context = { snapshot: { sources: [], submission: { context: { restricted: true } }, dependencies: { fileUris: [], knowledgeLineage: null } } };
  assert.equal((await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'new' } }, context)).status, 'unavailable');
  for (const name of ['readActiveDocument', 'getLatestRunResult', 'proposeCodeChange']) await assert.rejects(() => router.route({ name, arguments: {} }, context), /restricted/i);
});


test('knowledge tool results cannot exceed the retriever five-passage bound', async () => {
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: { getKnowledgeLineage: async () => 'pack',
    search: async () => Array.from({ length: 6 }, (_, i) => ({ id: String(i), path: 'x.md', category: 'language', text: 'x', knowledgeLineage: 'pack' })) } });
  await assert.rejects(() => router.route({ name: 'searchKafeKnowledge', arguments: { query: 'x' } }, { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: 'pack' } } }), /passage|size/i);
});
