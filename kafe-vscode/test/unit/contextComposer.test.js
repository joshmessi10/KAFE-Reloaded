const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { KnowledgeRetriever } = require('../../src/tutor/KnowledgeRetriever');
const { selectedSourceId } = require('../../src/tutor/ToolRouter');

const uri = (path) => ({ scheme: 'file', path, toString() { return `file://${path}`; } });

test('does not read or include candidate content until its source ID is explicitly included', async () => {
  const candidate = uri('/work/optional.kf');
  const reads = [];
  const composer = new ContextComposer({
    documentReader: { readDocument: async selected => {
      reads.push(selected.toString());
      return { uri: selected, text: 'UNCONSENTED_CANDIDATE_SENTINEL', version: 1 };
    } },
    knowledgeRetriever: { search: async () => [] },
  });
  const result = await composer.compose({ request: 'Help', candidateUris: [candidate], includedSourceIds: [] });

  assert.deepEqual(reads, []);
  assert.equal(JSON.stringify(result.payload).includes('UNCONSENTED_CANDIDATE_SENTINEL'), false);
  assert.deepEqual(result.sources.filter(source => source.category === 'selected-file'), [{
    id: selectedSourceId(candidate), category: 'selected-file', label: candidate.toString(), included: false,
  }]);
});

test('context preview identifies exact payload segments and optional removal removes content', async () => {
  const composer = new ContextComposer({
    documentReader: { readDocument: async selected => ({ uri: selected, text: 'SECRET_OPTIONAL', version: 1 }) },
    knowledgeRetriever: { search: async () => [{ id: 'language/lists.md#1', path: 'language/lists.md', category: 'language', text: 'KAFE list guidance' }] },
  });
  const input = {
    request: 'How do lists work?', session: { goal: 'Learn lists', milestones: ['Create one'], confirmed: true },
    activeDocument: { uri: uri('/work/main.kf'), text: 'show(1)', version: 2 },
    runResult: { stdout: '1', stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
      sourceUri: uri('/work/main.kf').toString(), runSequence: 1 },
    candidateUris: [uri('/work/extra.kf')],
    includedSourceIds: [selectedSourceId(uri('/work/extra.kf'))],
  };
  const first = await composer.compose(input);
  assert.deepEqual(first.payload.tools.map(tool => tool.function.name), [
    'readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange',
  ]);
  for (const source of first.sources.filter(item => item.included)) {
    assert.equal(first.payload.messages.filter(message => message.content.startsWith(`[Source ${source.id}]\n`)).length, 1);
  }
  assert.ok(first.sources.some(item => item.category === 'knowledge' && item.id === 'knowledge:language/lists.md#1'));
  const previewedRun = first.payload.messages.find(message => message.content.startsWith('[Source run-result]'));
  assert.match(previewedRun.content, /"stdout":"1"/);
  assert.ok(!previewedRun.content.includes('sourceUri'));
  assert.ok(!previewedRun.content.includes('runSequence'));
  assert.match(first.sources.find(item => item.id === 'run-result').label, /main\.kf/);
  const selectedId = first.sources.find(item => item.category === 'selected-file').id;
  const removed = await composer.compose({ ...input, includedSourceIds: [] });
  assert.equal(removed.sources.find(item => item.id === selectedId).included, false);
  assert.equal(JSON.stringify(removed.payload).includes('SECRET_OPTIONAL'), false);
  assert.equal(JSON.stringify(removed.payload).includes(selectedId), false);
});

test('includes only opted-in candidate content and binds IDs to URI identity', async () => {
  const a = uri('/work/a.kf');
  const b = uri('/work/b.kf');
  const composer = new ContextComposer({
    documentReader: { readDocument: async selected => ({ uri: selected,
      text: selected.toString() === a.toString() ? 'CONTENT_A_ONLY' : 'CONTENT_B_ONLY', version: 1 }) },
    knowledgeRetriever: { search: async () => [] },
  });
  const input = { request: 'Help', session: { confirmed: false }, candidateUris: [a, b],
    includedSourceIds: [selectedSourceId(a), selectedSourceId(b)] };
  const initial = await composer.compose(input);
  const aSource = initial.sources.find(source => source.label === a.toString());
  const bSource = initial.sources.find(source => source.label === b.toString());
  assert.ok(aSource?.id.startsWith('selected:'));
  assert.ok(bSource?.id.startsWith('selected:'));
  assert.notEqual(aSource.id, bSource.id);
  const reordered = await composer.compose({ ...input, candidateUris: [b, a], includedSourceIds: [bSource.id] });
  assert.equal(reordered.sources.find(source => source.label === a.toString()).id, aSource.id);
  assert.equal(reordered.sources.find(source => source.label === a.toString()).included, false);
  assert.equal(reordered.sources.find(source => source.label === b.toString()).id, bSource.id);
  assert.equal(reordered.sources.find(source => source.label === b.toString()).included, true);
  assert.ok(!JSON.stringify(reordered.payload).includes('CONTENT_A_ONLY'));
  assert.ok(JSON.stringify(reordered.payload).includes('CONTENT_B_ONLY'));
  assert.equal(reordered.payload.messages.filter(message => message.content.includes('CONTENT_B_ONLY')).length, 1);
});

test('run evidence from another active file is omitted from composed provider payload', async () => {
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: { search: async () => [] } });
  const result = await composer.compose({ request: 'Help', activeDocument: { uri: uri('/work/b.kf'), text: 'B', version: 1 },
    runResult: { stdout: 'EVIDENCE_FROM_A', stderr: '', exitCode: 0, outputTruncated: false,
      runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', sourceUri: uri('/work/a.kf').toString(), runSequence: 1 } });
  assert.ok(!JSON.stringify(result.payload).includes('EVIDENCE_FROM_A'));
  assert.ok(!result.sources.some(source => source.id === 'run-result'));
});

test('knowledge search uses the confirmed learning goal and milestones while preserving the learner request', async () => {
  let searchArguments;
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {
    search: async (...args) => { searchArguments = args; return []; },
  } });
  const request = 'Let us get started';
  const goal = 'Create a supervised model for house prices';
  const milestone = 'Identify SalePrice as the prediction target';
  const result = await composer.compose({ request,
    session: { confirmed: true, goal, milestones: [{ id: 'explore', text: milestone }] } });
  assert.deepEqual(searchArguments, [request, [goal, milestone]]);
  assert.equal(result.payload.messages.at(-1).content, request);
});

test('knowledge retrieval fails closed without matching version and rejects escape paths', async () => {
  const files = {
    '/runtime/knowledge-pack/language/lists.md': 'Lists contain values. Lists support indexing.',
  };
  const normalize = value => value.replaceAll('\\', '/');
  const fileSystem = {
    lstat: async value => ({ isDirectory: () => normalize(value) === '/runtime/knowledge-pack' || normalize(value) === '/runtime/knowledge-pack/language', isFile: () => normalize(value) in files, isSymbolicLink: () => false, size: Buffer.byteLength(files[normalize(value)] || '') }),
    readdir: async value => normalize(value) === '/runtime/knowledge-pack' ? [{ name: 'language', isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false }] : [{ name: 'lists.md', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false }],
    readFile: async value => files[normalize(value)],
  };
  const options = { knowledgeRoot: '/runtime/knowledge-pack', runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    expectedRuntimeVersion: '0.1.0', expectedKnowledgePackVersion: '0.1.0', fileSystem };
  const passages = await new KnowledgeRetriever(options).search('indexing');
  assert.equal(passages[0].path, 'language/lists.md');
  assert.match(passages[0].text, /indexing/);
  await assert.rejects(() => new KnowledgeRetriever({ ...options, knowledgePackVersion: '0.2.0' }).search('lists'), /version/i);
  await assert.rejects(() => new KnowledgeRetriever({ ...options, runtimeVersion: '0.2.0' }).search('lists'), /version/i);
  await assert.rejects(() => new KnowledgeRetriever({ ...options, knowledgeRoot: '/work/docs' }).search('lists'), /knowledge-pack/i);
});
