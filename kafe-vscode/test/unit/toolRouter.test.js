const assert = require('node:assert/strict');
const test = require('node:test');
const { ToolRouter, selectedSourceId } = require('../../src/tutor/ToolRouter');
const { ContextComposer } = require('../../src/tutor/ContextComposer');

const uri = path => ({ scheme: 'file', path, toString() { return `file://${path}`; } });

test('router permits only allowlisted reads from learner-selected URI IDs', async () => {
  const active = { uri: uri('/work/main.kf'), text: 'show(1)', version: 3 };
  const selectedUris = [uri('/work/extra.kf')];
  const router = new ToolRouter({ documentReader: { readDocument: async selected => ({ uri: selected, text: 'extra content', version: 1 }) }, knowledgeRetriever: { search: async () => [] } });
  const context = { activeDocument: active, selectedUris, excludedSourceIds: [], runResult: null };
  const selectedId = selectedSourceId(selectedUris[0]);
  assert.equal((await router.route({ name: 'readActiveDocument', arguments: '{}' }, context)).text, 'show(1)');
  assert.equal((await router.route({ name: 'readActiveDocument', arguments: { sourceId: selectedId } }, context)).text, 'extra content');
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: '{"path":"/secret"}' }, context), /argument/i);
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: '{"sourceId":"selected:1"}' }, context), /selected/i);
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: { sourceId: selectedId } }, { ...context, excludedSourceIds: [selectedId] }), /selected/i);
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: { sourceId: selectedId } }, { ...context, selectedUris: [{ scheme: 'https', path: '/work/extra.kf' }] }), /scheme/i);
});

test('router binds opaque selected IDs to URI after reorder and denies excluded A', async () => {
  const a = uri('/work/a.kf');
  const b = uri('/work/b.kf');
  const readDocument = async selected => ({ uri: selected, text: selected.toString() === a.toString() ? 'A' : 'B', version: 1 });
  const knowledgeRetriever = { search: async () => [] };
  const composer = new ContextComposer({ documentReader: { readDocument }, knowledgeRetriever });
  const sources = (await composer.compose({ request: 'Help', selectedUris: [a, b] })).sources;
  const aId = sources.find(source => source.label === a.toString()).id;
  const bId = sources.find(source => source.label === b.toString()).id;
  const router = new ToolRouter({ documentReader: { readDocument }, knowledgeRetriever });
  const context = { selectedUris: [b, a], excludedSourceIds: [aId] };
  assert.equal((await router.route({ name: 'readActiveDocument', arguments: { sourceId: bId } }, context)).text, 'B');
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: { sourceId: aId } }, context), /selected/i);
});

test('router rejects malformed, unknown, oversized and executable operations', async () => {
  const router = new ToolRouter({ documentReader: { readDocument: async selected => ({ uri: selected, text: 'x'.repeat(70000), version: 1 }) }, knowledgeRetriever: { search: async () => [] } });
  const context = { activeDocument: { uri: uri('/work/main.kf'), text: 'ok', version: 1 }, selectedUris: [uri('/work/large.kf')] };
  for (const call of [
    { name: 'runKafe', arguments: '{}' }, { name: 'shell', arguments: '{"command":"echo"}' },
    { name: 'readActiveDocument', arguments: '{' }, { name: 'searchKafeKnowledge', arguments: '{"query":1}' },
  ]) await assert.rejects(() => router.route(call, context));
  await assert.rejects(() => router.route({ name: 'readActiveDocument', arguments: { sourceId: selectedSourceId(context.selectedUris[0]) } }, context), /size/i);
});

test('proposal targets active document by default and never applies the edit', async () => {
  const active = { uri: uri('/work/main.kf'), text: 'show(1)', version: 4 };
  const router = new ToolRouter({ documentReader: { readDocument: async () => { throw Error('unexpected'); } }, knowledgeRetriever: { search: async () => [] } });
  const result = await router.route({ name: 'proposeCodeChange', arguments: JSON.stringify({ newText: 'show(2)' }) }, { activeDocument: active, selectedUris: [] });
  assert.equal(result.uri, active.uri);
  assert.equal(result.documentVersion, 4);
  assert.equal(result.newText, 'show(2)');
  assert.match(result.contentSha256, /^[a-f0-9]{64}$/);
  await assert.rejects(() => router.route({ name: 'proposeCodeChange', arguments: '{"newText":"x","path":"/work/other.kf"}' }, { activeDocument: active, selectedUris: [] }), /argument/i);
});

test('latest run result accepts only bounded learner evidence with complete version fields', async () => {
  const router = new ToolRouter({ documentReader: {}, knowledgeRetriever: { search: async () => [] } });
  const call = { name: 'getLatestRunResult', arguments: '{}' };
  const valid = { stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceUri: uri('/work/main.kf').toString(), runSequence: 1 };
  const activeDocument = { uri: uri('/work/main.kf') };
  const { sourceUri, runSequence, ...shareable } = valid;
  assert.deepEqual(await router.route(call, { runResult: valid, activeDocument }), shareable);
  assert.equal(await router.route(call, { runResult: valid, activeDocument: { uri: uri('/work/other.kf') } }), null);
  await assert.rejects(() => router.route(call, { runResult: { ...valid, knowledgePackVersion: null }, activeDocument }), /result shape/i);
  await assert.rejects(() => router.route(call, { runResult: { ...valid, stdout: 'x'.repeat(1024 * 1024 + 1) }, activeDocument }), /size/i);
  const contributor = { ...valid, runtimeMode: 'contributor', runtimeVersion: null, knowledgePackVersion: null };
  assert.deepEqual(await router.route(call, { runResult: contributor, activeDocument }),
    { ...shareable, runtimeMode: 'contributor', runtimeVersion: null, knowledgePackVersion: null });
  await assert.rejects(() => router.route(call, { runResult: { ...contributor, runtimeVersion: '0.1.0' }, activeDocument }), /result shape/i);
  await assert.rejects(() => router.route(call, { runResult: { ...valid, runtimeMode: 'managed', knowledgePackVersion: null }, activeDocument }), /result shape/i);
  await assert.rejects(() => router.route(call, { runResult: { ...valid, sourceUri: 'https://unsafe' }, activeDocument }), /result shape/i);
});
