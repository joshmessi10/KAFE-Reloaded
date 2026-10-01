const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { KnowledgeRetriever } = require('../../src/tutor/KnowledgeRetriever');
const { selectedSourceId, metadataLineage } = require('../../src/tutor/ToolRouter');

const pack = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack' };
const availability = { status: 'ready', metadata: pack };
const uri = (path) => ({ scheme: 'file', path, toString() { return `file://${path}`; } });

test('long ordinary messages reach actual ready knowledge retrieval intact and integrity failures stay fatal', async t => {
  const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
  const { knowledgeContentDigest } = require('../../src/tutor/KnowledgeRetriever');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kafe-query-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const knowledgeRoot = path.join(root, 'knowledge-pack'); await fs.mkdir(knowledgeRoot);
  const bytes = Buffer.from('Lists support indexing and contain ordered values.');
  await fs.writeFile(path.join(knowledgeRoot, 'lists.md'), bytes);
  const digest = knowledgeContentDigest([{relative:'lists.md',bytes}]);
  const metadata = { sourceMode:'managed',runtimeVersion:'1',knowledgePackVersion:'1',knowledgeRoot,expectedContentSha256:digest.contentSha256 };
  const retriever = new KnowledgeRetriever({knowledgeRoot,runtimeVersion:'1',knowledgePackVersion:'1',expectedRuntimeVersion:'1',expectedKnowledgePackVersion:'1',expectedContentSha256:digest.contentSha256,expectedFileCount:1});
  const composer = new ContextComposer({documentReader:{},knowledgeRetriever:retriever});
  const request = '  Explain lists and indexing.\n' + 'I need a detailed example showing how the values change at each step. '.repeat(7) + ' Preserve this final sentence.  ';
  const result = await composer.compose({request,knowledgeAvailability:{status:'ready',metadata}});
  assert.equal(result.payload.messages.at(-1).content, request);
  assert.ok(result.snapshots.some(s => s.category === 'knowledge' && s.text.includes('Lists support indexing')));
  assert.doesNotMatch(result.payload.messages[0].content, /knowledge is unavailable/);
  await assert.rejects(() => retriever.search(request), /Invalid KAFE knowledge query/);
  await fs.writeFile(path.join(knowledgeRoot,'lists.md'),'Tampered pack');
  await assert.rejects(() => composer.compose({request,knowledgeAvailability:{status:'ready',metadata}}), /integrity|digest|changed|mismatch/i);
});

test('workspace display labels preserve canonical active and optional provenance without reading excluded files', async () => {
  const a = uri('/work/examples/main.kf'), b = uri('/work/lib/extra.kf'); let reads = 0;
  const composer = new ContextComposer({ documentReader: { displayLabel: u => u.path.slice('/work/'.length),
    readDocument: async u => { reads++; return { uri: u, version: 3, text: 'extra' }; } }, knowledgeRetriever: { search: async () => [] } });
  for (const included of [false, true]) {
    const result = await composer.compose({ request: 'Help', activeDocument: { uri: a, text: 'main', version: 2 }, candidateUris: [b], includedSourceIds: included ? [selectedSourceId(b)] : [] });
    assert.deepEqual(result.sources.map(s => s.label), ['examples/main.kf', 'lib/extra.kf']);
    assert.deepEqual(result.sources.map(s => s.provenance.uri), [a.toString(), b.toString()]);
    assert.equal(result.snapshots[0].uri, a.toString()); assert.equal(reads, included ? 1 : 0);
  }
});

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
  const source = result.sources.find(source => source.category === 'selected-file');
  assert.equal(source.id, selectedSourceId(candidate));
  assert.equal(source.included, false);
  assert.equal(source.label, candidate.toString());
  assert.equal(source.text, undefined);
});

test('composition binds only included snapshots and eligible ordinary history to the exact payload', async () => {
  const a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const composer = new ContextComposer({ documentReader: { readDocument: async selected => ({ uri: selected, text: 'B_BUFFER', version: 3 }) },
    knowledgeRetriever: { search: async () => [], getKnowledgeLineage: async () => metadataLineage(pack) } });
  const result = await composer.compose({ request: 'New question', knowledgeAvailability: availability, activeDocument: { uri: b, text: 'B_BUFFER', version: 3 },
    candidateUris: [a], includedSourceIds: [], history: [
      { id: 'revoked', learnerText: 'REVOKED_QUESTION', assistantText: 'REVOKED_ANSWER', dependencies: { fileUris: [a.toString()], knowledgeLineage: null } },
      { id: 'eligible', learnerText: 'Question with `show(1)`', assistantText: 'Ordinary answer', dependencies: { fileUris: [b.toString()], knowledgeLineage: metadataLineage(pack) } },
    ], providerParameters: { model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true } });
  assert.deepEqual(result.history.pairs.map(pair => pair.id), ['eligible']);
  assert.deepEqual(result.payload.messages.slice(1, 3), [{ role: 'user', content: 'Question with `show(1)`' }, { role: 'assistant', content: 'Ordinary answer' }]);
  assert.equal(JSON.stringify(result.payload).includes('REVOKED_'), false);
  assert.equal(result.snapshots.some(source => source.id === selectedSourceId(a)), false);
  assert.equal(result.snapshots[0].uri, b.toString());
  assert.deepEqual(result.dependencies, { fileUris: [b.toString()], knowledgeLineage: metadataLineage(pack) });
  assert.equal(result.payload.model, 'deepseek-flash');
  assert.equal(result.payload.stream, true);
});

test('same-workspace authorization rejects excluded folders before selected content reads', async () => {
  const outside = uri('/other/private.kf');
  let reads = 0;
  const composer = new ContextComposer({ documentReader: { validateUri: async source => !source.path.startsWith('/other/'), readDocument: async selected => { reads++; return { uri: selected, text: 'sentinel', version: 1 }; } }, knowledgeRetriever: { search: async () => [] } });
  await assert.rejects(() => composer.compose({ request: 'Help', candidateUris: [outside], includedSourceIds: [selectedSourceId(outside)] }), /authoriz/i);
  assert.equal(reads, 0);
});

test('selected documents reject changed identity, deleted files and exact source/run size excess', async () => {
  const selected = uri('/work/extra.kf');
  const search = async () => [];
  for (const readDocument of [async () => ({ uri: uri('/work/renamed.kf'), text: 'x', version: 1 }), async () => { throw Error('deleted'); }, async () => ({ uri: selected, text: 'x'.repeat(64 * 1024 + 1), version: 1 })]) {
    const composer = new ContextComposer({ documentReader: { readDocument }, knowledgeRetriever: { search } });
    await assert.rejects(() => composer.compose({ request: 'Help', candidateUris: [selected], includedSourceIds: [selectedSourceId(selected)] }));
  }
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: { search } });
  await assert.rejects(() => composer.compose({ request: 'Help', activeDocument: { uri: selected, text: 'x', version: 1 }, runResult: { sourceUri: selected.toString(), runSequence: 1, stdout: 'x'.repeat(1024 * 1024 + 1), stderr: '', exitCode: 0, outputTruncated: false, runtimeVersion: '1', knowledgePackVersion: '1' } }), /size/i);
});

test('context preview identifies exact payload segments and optional removal removes content', async () => {
  const composer = new ContextComposer({
    documentReader: { readDocument: async selected => ({ uri: selected, text: 'SECRET_OPTIONAL', version: 1 }) },
    knowledgeRetriever: { search: async () => [{ id: 'language/lists.md#1', path: 'language/lists.md', category: 'language', text: 'KAFE list guidance' }] },
  });
  const input = {
    request: 'How do lists work?', knowledgeAvailability: availability,
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

test('pack switch during search rejects A bytes rather than authorizing them under live pack B', async () => {
  const { metadataLineage } = require('../../src/tutor/ContextComposer');
  const packA = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack-A', contentSha256: 'a'.repeat(64) };
  const packB = { ...packA, packIdentity: 'pack-B', contentSha256: 'b'.repeat(64) };
  let currentPack = packA;
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {
    getKnowledgeLineage: async () => metadataLineage(currentPack),
    search: async () => { const passage = { id: 'language/x.md#1', path: 'language/x.md', category: 'language', text: 'PACK_A_BYTES', ...currentPack }; currentPack = packB; return [passage]; },
  } });
  await assert.rejects(() => composer.compose({ request: 'Help', knowledgeAvailability: { status: 'ready', metadata: currentPack } }), error => error.code === 'KNOWLEDGE_LINEAGE_CHANGED');
});

test('stable live lineage still rejects passages returned from a different captured pack', async () => {
  const { metadataLineage } = require('../../src/tutor/ContextComposer');
  const packA = { sourceMode: 'development', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack-A', contentSha256: 'a'.repeat(64) };
  const packB = { ...packA, packIdentity: 'pack-B', contentSha256: 'b'.repeat(64) };
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: { getKnowledgeLineage: async () => metadataLineage(packB), search: async () => [{ id: 'language/x.md#1', path: 'language/x.md', category: 'language', text: 'PACK_A_BYTES', ...packA }] } });
  await assert.rejects(() => composer.compose({ request: 'Help', knowledgeAvailability: { status: 'ready', metadata: packB } }), error => error.code === 'KNOWLEDGE_LINEAGE_CHANGED');
});


test('unavailable knowledge omits dependent history and never calls retrieval', async () => {
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: { search() { throw Error('Unavailable knowledge must not search'); } } });
  const result = await composer.compose({ request: 'Hello', knowledgeAvailability: { status: 'unavailable', code: 'knowledge_missing' },
    history: [{ id: 'old', learnerText: 'PRIVATE_KNOWLEDGE', assistantText: 'old', dependencies: { fileUris: [], knowledgeLineage: 'prior' } }] });
  assert.equal(result.history.pairs.length, 0); assert.equal(result.dependencies.knowledgeLineage, null);
  assert.equal(JSON.stringify(result.payload).includes('PRIVATE_KNOWLEDGE'), false);
  assert.match(result.payload.messages[0].content, /knowledge.*unavailable/i);
});

test('learning state cannot enter composition or knowledge search', async () => {
  let found;
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: { search: async (...args) => { found = args; return []; } } });
  const result = await composer.compose({ request: 'Hello', knowledgeAvailability: availability,
    session: { confirmed: true, goal: 'PRIVATE_GOAL', milestones: [{ text: 'PRIVATE_MILESTONE' }] } });
  assert.deepEqual(found, ['Hello', []]); assert.equal(JSON.stringify(result.payload).includes('PRIVATE_'), false);
});
