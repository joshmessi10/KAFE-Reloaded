const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');

for (const request of ['  How do I use machine.train_quantum_transformer()?\n',
  '¿Cómo uso machine.train_quantum_transformer() para entrenar?']) {
  test(`unknown-only qualified API omits generic fixtures: ${request.trim()}`, async () => {
    const result = await new ContextComposer({ documentReader: {}, knowledgeRetriever: {} }).compose({ request });
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: request });
    assert.ok(result.snapshots.some(source => source.id === 'kafe-essentials'));
    const unsupported = result.snapshots.filter(source => source.provenance.status === 'unsupported');
    assert.equal(unsupported.length, 1);
    assert.equal(unsupported[0].provenance.apiId, 'machine.train_quantum_transformer');
    assert.match(unsupported[0].text, /not in the reviewed intended public API inventory/);
    assert.deepEqual(result.snapshots.filter(source => source.category === 'test-reference'), []);
    assert.deepEqual(result.dependencies.fileUris, []);
  });
}

test('mixed known/unknown API retains only complete fixtures tied to selected supported contracts', async () => {
  const request = 'Explain machine.DecisionTreeClassifier.tree_ and machine.train_quantum_transformer()';
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  const result = await composer.compose({ request });
  const contract = result.snapshots.find(source => source.provenance.apiId === 'machine.decision_tree_classifier');
  assert.ok(contract);
  assert.match(contract.text, /criterion, max_depth, min_samples_split, min_samples_leaf/);
  assert.ok(result.snapshots.some(source => source.id === 'kafe-essentials'));
  assert.ok(result.snapshots.some(source => source.provenance.apiId === 'machine.train_quantum_transformer'));
  const allowed = new Set(result.snapshots.filter(source => source.provenance.status !== 'unsupported')
    .flatMap(source => source.provenance.examplePaths || []));
  const fixtures = result.snapshots.filter(source => source.category === 'test-reference');
  assert.ok(fixtures.some(source => source.provenance.path === 'tests/KafeMACHINE/tree/test_decision_tree_basic.kf'));
  for (const source of fixtures) {
    assert.ok(allowed.has(source.provenance.path), source.provenance.path);
    assert.equal(JSON.parse(source.text.split('\n').slice(1).join('\n')).path, source.provenance.path);
  }
  assert.equal(result.payload.messages.at(-1).content, request);
  assert.ok(result.snapshots.filter(source => ['test-reference', 'library-reference'].includes(source.category))
    .reduce((sum, source) => sum + Buffer.byteLength(source.text), 0) <= 12 * 1024);
});

test('ordinary supported API retains unrestricted retrieval, complete expected fixtures and source hashes', async () => {
  const { createKafeReferences } = require('../../src/tutor/KafeReferences');
  const { createLibraryReferences } = require('../../src/tutor/LibraryReferences');
  const request = 'Explain machine.train_test_split(X, y, 0.2, 42, True)';
  const library = createLibraryReferences().select(request), references = createKafeReferences();
  const expected = references.select(request, {
    maxBytes: 12 * 1024 - library.reduce((sum, source) => sum + Buffer.byteLength(source.text), 0),
    preferredPaths: library.flatMap(source => source.provenance.examplePaths || []),
  });
  const result = await new ContextComposer({ documentReader: {}, knowledgeRetriever: {} }).compose({ request });
  assert.ok(expected.length > 0);
  assert.deepEqual(result.snapshots.filter(source => source.category === 'test-reference').map(source =>
    ({ id: source.id, text: source.text, provenance: source.provenance })), expected.map(source =>
    ({ id: source.id, text: source.text, provenance: source.provenance })));
  for (const source of result.snapshots) assert.equal(source.contentSha256, require('../../src/tutor/RequestSnapshot').sha256(source.text));
});

test('message-only code advice includes bundled KAFE fundamentals and BMI fixture expectations without claiming a ready knowledge pack', async () => {
  const composer = new ContextComposer({ documentReader: { readDocument() { throw Error('No workspace reads permitted'); } },
    knowledgeRetriever: { search() { throw Error('Unavailable pack must not be searched'); } } });
  const result = await composer.compose({ request: 'Write BMI calc_imc with weight and height, zero and negative height' });
  const reference = result.snapshots.find(source => source.category === 'language-reference');
  assert.ok(reference, 'language guidance must be available independently of the managed runtime');
  assert.match(reference.text, /show\(/);
  assert.match(reference.text, /main\(\);/);
  const example = result.snapshots.find(source => source.category === 'test-reference' && source.text.includes('calc_imc'));
  assert.ok(example, 'retrieve a complete relevant repository fixture, not an unrelated chunk');
  assert.match(example.text, /22\.857142857142858/);
  assert.match(example.text, /repository expectations/i);
  assert.equal(example.uri, null);
  assert.equal(result.dependencies.knowledgeLineage, null);
  assert.deepEqual(result.dependencies.fileUris, []);
  assert.match(result.payload.messages[0].content, /full KAFE knowledge pack is unavailable/i);
  const message = result.payload.messages.find(item => item.content.startsWith(`[Source ${example.id}]`));
  assert.match(message.content, /bundled KAFE test fixture/);
  assert.doesNotMatch(message.content, /origin":"host-observed action facts/);
});

test('bare greetings retain brief greeting policy and essentials but do not retrieve incidental fixture examples', async () => {
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  const result = await composer.compose({ request: 'Hola!' });
  assert.equal(result.snapshots.filter(source => source.category === 'language-reference').length, 1);
  assert.equal(result.snapshots.filter(source => source.category === 'test-reference').length, 0);
  assert.equal(result.payload.messages.at(-1).content, 'Hola!');
  assert.match(result.payload.messages[0].content, /greet briefly/);
});

test('Spanish code questions retrieve the same tested BMI example and preserve the literal request', async () => {
  const request = 'Haz una función para calcular el IMC con peso y altura';
  const result = await new ContextComposer({ documentReader: {}, knowledgeRetriever: {} }).compose({ request });
  assert.ok(result.snapshots.some(source => source.category === 'test-reference' && source.text.includes('calc_imc')));
  assert.equal(result.payload.messages.at(-1).content, request);
});
