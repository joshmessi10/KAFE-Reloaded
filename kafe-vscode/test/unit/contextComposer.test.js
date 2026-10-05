const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { KnowledgeRetriever } = require('../../src/tutor/KnowledgeRetriever');
const { selectedSourceId, metadataLineage } = require('../../src/tutor/ToolRouter');

const pack = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'pack' };
const availability = { status: 'ready', metadata: pack };
const uri = (path) => ({ scheme: 'file', path, toString() { return `file://${path}`; } });

test('bare greetings omit incidental real error catalogue retrieval while retaining current lineage and exact learner text', async t => {
  const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
  const { knowledgeContentDigest } = require('../../src/tutor/KnowledgeRetriever');
  const { ToolRouter } = require('../../src/tutor/ToolRouter');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kafe-greeting-context-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const knowledgeRoot = path.join(root, 'knowledge-pack'); await fs.mkdir(knowledgeRoot);
  const bytes = Buffer.from('Error catalogue: show("Hello\\qworld"); invalid escape sequence. Hello world strings, lists and loops.');
  await fs.writeFile(path.join(knowledgeRoot, 'errors.md'), bytes);
  const digest = knowledgeContentDigest([{ relative: 'errors.md', bytes }]);
  const metadata = { ...pack, knowledgeRoot, expectedContentSha256: digest.contentSha256, expectedFileCount: 1 };
  const retriever = new KnowledgeRetriever({ knowledgeRoot, runtimeVersion: '1', knowledgePackVersion: '1', expectedRuntimeVersion: '1', expectedKnowledgePackVersion: '1', expectedContentSha256: digest.contentSha256, expectedFileCount: 1 });
  assert.ok((await retriever.search('Hello')).length > 0, 'actual catalogue matches the incidental string');
  let searches = 0; const original = retriever.search.bind(retriever); retriever.search = async (...args) => { searches++; return original(...args); };
  const composer = new ContextComposer({ documentReader: { readDocument() { throw Error('No optional reads'); } }, knowledgeRetriever: retriever });
  const lineage = metadataLineage(metadata), history = [{ id: 'prior', learnerText: 'Explain strings', assistantText: 'A string contains text.', dependencies: { fileUris: [], knowledgeLineage: lineage } }];
  for (const request of ['Hello', '  Hello!  ', 'hi', 'Hey.', 'Hola!']) {
    const result = await composer.compose({ request, history, candidateUris: [uri('/private/optional.kf')], knowledgeAvailability: { status: 'ready', metadata } });
    assert.equal(result.snapshots.some(s => s.category === 'knowledge'), false);
    assert.equal(result.dependencies.knowledgeLineage, lineage);
    assert.deepEqual(result.payload.messages.slice(1, 3), [{ role: 'user', content: history[0].learnerText }, { role: 'assistant', content: history[0].assistantText }]);
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: request });
    assert.doesNotMatch(JSON.stringify(result.payload), /Error catalogue|invalid escape|optional\.kf/);
  }
  assert.equal(searches, 0);
  for (const request of ['Hello world', 'Explain "Hello" strings', 'Hello, explain loops', 'show("Hello")', 'What is a list?', 'Hello again, continue']) {
    const result = await composer.compose({ request, knowledgeAvailability: { status: 'ready', metadata } });
    assert.equal(result.payload.messages.at(-1).content, request);
  }
  assert.equal(searches, 6);
  const explicit = await new ToolRouter({ knowledgeRetriever: retriever }).route({ name: 'searchKafeKnowledge', arguments: { query: 'Hello' } }, { snapshot: { sources: [], dependencies: { knowledgeLineage: lineage } } });
  assert.ok(explicit.length > 0); assert.equal(searches, 7);
});

test('host reference attribution identifies source category and safe provenance without impersonating learner input', async () => {
  const { LearningSession } = require('../../src/tutor/LearningSession');
  const retriever = { search: async () => [{ id: 'errors/catalogue.md#1', path: 'errors/catalogue.md', category: 'errors', text: 'REFERENCE_SENTINEL show("Hello")', sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'PRIVATE_PACK_ID' }] };
  const metadata = { ...pack, packIdentity: 'PRIVATE_PACK_ID' };
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: retriever });
  for (const mode of ['guided', 'paused']) {
    const learning = new LearningSession(); learning.setPreferences({ mode });
    const result = await composer.compose({ request: 'Explain this syntax exactly.\n', learningSession: learning, knowledgeAvailability: { status: 'ready', metadata } });
    const reference = result.payload.messages.find(m => m.content.includes('REFERENCE_SENTINEL'));
    assert.match(reference.content, /Host-provided reference context/);
    assert.match(reference.content, /not learner-pasted/); assert.match(reference.content, /untrusted data/i);
    assert.match(reference.content, /"category":"knowledge"/); assert.match(reference.content, /errors\/catalogue\.md/);
    assert.doesNotMatch(reference.content, /PRIVATE_PACK_ID/);
    assert.match(result.payload.messages[0].content, /latest literal learner request/);
    assert.match(result.payload.messages[0].content, /pure greeting.*briefly/i);
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: 'Explain this syntax exactly.\n' });
  }
});

test('greeting search suppression still rejects changed current knowledge lineage', async () => {
  let searches = 0;
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {
    getKnowledgeLineage: async () => metadataLineage({ ...pack, packIdentity: 'changed-pack' }),
    search: async () => { searches++; return []; },
  } });
  await assert.rejects(composer.compose({ request: 'Hello', knowledgeAvailability: availability }), /Knowledge pack changed/);
  assert.equal(searches, 0);
});

test('composer projects only real host facts and preserves historical Run attribution across same URI edits', async () => {
  const { ActionEvidence } = require('../../src/tutor/ActionEvidence'), { sha256 } = require('../../src/tutor/RequestSnapshot');
  const ledger = new ActionEvidence(), a = uri('/work/a.kf');
  const result = { sourceUri: a.toString(), runSequence: 1, stdout: 'HISTORICAL_OUTPUT', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeVersion: '1', knowledgePackVersion: '1', sourceIdentity: { launch: sha256('OLD'), completion: sha256('OLD') } };
  ledger.recordRun(result);
  const composer = new ContextComposer({ documentReader: { readSavedIdentity: () => sha256('NEW') }, knowledgeRetriever: {} });
  const composition = await composer.compose({ request: 'Explain', activeDocument: { uri: a, version: 2, text: 'NEW' }, runResult: result, actionEvidence: ledger });
  assert.equal(composition.actionEvidence.records[0].sourceRelationship, 'changed');
  const output = composition.snapshots.find(s => s.id === 'run-result'); assert.equal(JSON.parse(output.text).sourceRelationship, 'changed');
  assert.match(JSON.stringify(composition.payload), /exactExecutedBytes.*unknown/);
  const denied = await composer.compose({ request: 'Explain', actionEvidence: ledger, runResult: result });
  assert.doesNotMatch(JSON.stringify(denied.payload), /HISTORICAL_OUTPUT/); assert.equal(denied.actionEvidence.records.length, 0);
  const forged = await composer.compose({ request: 'Explain', actionEvidence: { selectContext: () => ({ records: [{ outcome: 'applied' }] }) } });
  assert.equal(forged.actionEvidence.records.length, 0);
});

test('revoked transitive Apply dependency suppresses matching Run output in real composition', async () => {
  const { ActionEvidence } = require('../../src/tutor/ActionEvidence'), { sha256 } = require('../../src/tutor/RequestSnapshot');
  const ledger = new ActionEvidence(), a = uri('/work/a.kf'), b = uri('/work/b.kf');
  const observed = { uri: a.toString(), version: 2, contentSha256: sha256('APPLIED') };
  ledger.recordApply({ id: 'private-native', sourceId: a.toString(), preparation: { grantId: 'host', scopeSummary: 'TRANSITIVE_SCOPE', dependencies: {
    files: [{ ...observed, version: 1 }, { uri: b.toString(), version: 1, contentSha256: sha256('helper') }], knowledgeLineage: null } } }, 'applied', observed);
  const result = { sourceUri: a.toString(), runSequence: 1, stdout: 'TRANSITIVE_RUN_OUTPUT', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeVersion: '1', knowledgePackVersion: '1', sourceIdentity: { launch: sha256('APPLIED'), completion: sha256('APPLIED') } };
  ledger.recordRun(result);
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  const composed = await composer.compose({ request: 'Explain', activeDocument: { uri: a, version: 2, text: 'APPLIED' }, runResult: result, actionEvidence: ledger });
  assert.doesNotMatch(JSON.stringify(composed.payload), /TRANSITIVE_RUN_OUTPUT|TRANSITIVE_SCOPE/);
  assert.ok(composed.actionEvidence.omissions.every(o => o.reason === 'source-revoked'));
});

test('teaching request fixtures carry direct concepts, learner-owned decisions, requested help and optional setup without hint-first defaults', async () => {
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  for (const request of ['What is a loop?', 'Design storage for my program', 'Show a worked example', 'Skip this question', 'Use defaults']) {
    const result = await composer.compose({ request });
    const policy = result.payload.messages[0].content;
    assert.match(policy, /concept or syntax question.*explain directly/i);
    assert.match(policy, /meaningful engineering choice.*learner.*approach/i);
    assert.match(policy, /hints, options.*worked examples.*requested/i);
    assert.match(policy, /skip.*named reasoning step/i);
    assert.match(policy, /onboarding.*optional.*one question/i);
    assert.doesNotMatch(policy, /Start with a hint/i);
    assert.equal(result.payload.messages.at(-1).content, request);
    assert.equal(result.learning.preferences.familiarity, 'unknown');
  }
});

test('paused teaching removes reasoning prerequisite while retaining scoped preparation and native authorities', async () => {
  const { LearningSession } = require('../../src/tutor/LearningSession');
  const learning = new LearningSession(); learning.setPreferences({ mode: 'paused' });
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  const result = await composer.compose({ request: 'Prepare the change', learningSession: learning });
  assert.match(result.payload.messages[0].content, /paused.*do not require.*reasoning/i);
  assert.match(result.payload.messages[0].content, /scoped.*confirmation/i);
  assert.match(result.payload.messages[0].content, /Help.*Skip.*Pause.*never authorize.*writes.*Run/i);
  assert.equal(result.learning.preferences.mode, 'paused');
});

test('learning records join context dependency union and revoked transitive records never reach provider', async () => {
  const { LearningSession } = require('../../src/tutor/LearningSession');
  const { sha256 } = require('../../src/tutor/RequestSnapshot');
  const learning = new LearningSession(), a = uri('/work/a.kf');
  const parent = learning.addDecision({ kind: 'design', name: 'List', learnerProposalSummary: 'A list', tutorProposedAdditions: [],
    scopeSummary: 'Use source', tradeoffs: [], unresolvedChoices: [], sourceIds: ['active-file'], priorDecisionIds: [] },
  { files: [{ uri: a.toString(), version: 1, contentSha256: sha256('A') }], knowledgeLineage: null });
  learning.confirmDecision(parent.id);
  learning.addObservation({ kind: 'reasoning', text: 'TRANSITIVE_LEARNER_DATA', attribution: 'learner', uncertainty: 'Unknown', status: 'observed', priorDecisionIds: [parent.id] }, { files: [], knowledgeLineage: null });
  const composer = new ContextComposer({ documentReader: { validateUri: async () => true }, knowledgeRetriever: {} });
  const admitted = await composer.compose({ request: 'Explain', activeDocument: { uri: a, version: 1, text: 'A' }, learningSession: learning });
  assert.match(JSON.stringify(admitted.payload), /TRANSITIVE_LEARNER_DATA/);
  assert.deepEqual(admitted.dependencies.fileUris, ['file:///work/a.kf']);
  for (const activeDocument of [undefined, { uri: a, version: 2, text: 'A' }, { uri: a, version: 1, text: 'changed' }]) {
    const filtered = await composer.compose({ request: 'Explain', activeDocument, learningSession: learning });
    assert.doesNotMatch(JSON.stringify(filtered.payload), /TRANSITIVE_LEARNER_DATA/);
    assert.equal(filtered.learning.decisions.length, 0);
  }
});

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
    'readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange', 'proposeLearningCheckpoint',
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
  const result = await composer.compose({ request: 'Explain lists', knowledgeAvailability: availability,
    session: { confirmed: true, goal: 'PRIVATE_GOAL', milestones: [{ text: 'PRIVATE_MILESTONE' }] } });
  assert.deepEqual(found, ['Explain lists', []]); assert.equal(JSON.stringify(result.payload).includes('PRIVATE_'), false);
});
