const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { createLibraryReferences } = require('../../src/tutor/LibraryReferences');
const runtime = require('../../src/runtimeManifest.json').runtime;

function bundle() {
  const entry = (id, aliases) => ({ id, kind: 'function', status: 'supported', signatures: [`${id}()`],
    summary: `Reviewed contract for ${id}.`, parameters: [], returns: 'MACHINE or GESHA object.',
    constraints: ['Call fit before prediction.'], aliases, sources: ['src/lib/functions.py'], examples: ['tests/example.kf'], evidence: [], related: [] });
  const body = { schemaVersion: 1, referenceVersion: 1, runtimeVersion: runtime.version, runtimeSourceRevision: runtime.sourceRevision,
    sourceFingerprint: 'a'.repeat(64), runtimeSourceFingerprint: 'a'.repeat(64), corpusFingerprint: 'b'.repeat(64),
    contractFingerprint: 'c'.repeat(64), evidenceFingerprint: 'd'.repeat(64),
    entries: [entry('machine.random_forest_classifier', ['random forest', 'bosque aleatorio']),
      entry('gesha.create_conv2d', ['convolutional network', 'red convolucional', 'CNN'])],
    units: [{ id: 'tutorial:cnn', path: 'examples/tutorials/gesha-cnn.md', text: '# CNN\n\n```kafe\nimport gesha;\nshow(1);\n```' }],
    inventory: { machine: { functions: ['random_forest_classifier'], aliases: {} }, gesha: { functions: ['create_conv2d'], aliases: {} } } };
  return sign(body);
}
function sign(value) {
  const { contentSha256, ...body } = value;
  return { ...body, contentSha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') };
}

test('bundled library integrity, runtime and source-version mismatches fail closed', () => {
  const original = bundle(); assert.ok(createLibraryReferences(original));
  for (const mutate of [value => { value.entries[0].summary = 'Unreviewed'; },
    value => { value.runtimeVersion = '99.0.0'; }, value => { value.runtimeSourceRevision = '0'.repeat(40); }]) {
    const changed = structuredClone(original); mutate(changed); assert.throws(() => createLibraryReferences(changed), /integrity|mismatch/);
  }
  const wrongSource = { ...original, sourceFingerprint: 'f'.repeat(64) };
  assert.throws(() => createLibraryReferences(sign(wrongSource)), /integrity|mismatch/);
});

test('English, Spanish, accent and exact-symbol queries retrieve the reviewed API', () => {
  const refs = createLibraryReferences(bundle());
  for (const query of ['random forest', '¿Cómo usar un bosque aleatorio?', 'machine.random_forest_classifier']) {
    assert.equal(refs.select(query)[0].provenance.apiId, 'machine.random_forest_classifier');
  }
  for (const query of ['CNN', 'red convoluciónal', 'gesha.create_conv2d', 'geshaDeep.create_conv2d']) {
    assert.equal(refs.select(query)[0].provenance.apiId, 'gesha.create_conv2d');
  }
});

test('unknown qualified symbols cannot masquerade as a different reviewed API', () => {
  const refs = createLibraryReferences(bundle()), results = refs.select('machine.train_quantum_transformer()');
  assert.equal(results.length, 1); assert.equal(results[0].provenance.status, 'unsupported');
  assert.match(results[0].text, /not in the reviewed/);
  assert.doesNotMatch(results[0].text, /random_forest_classifier/);
  for (const query of ['machine.random_forest_classifier._secret_method', 'gesha.Model.predict._secret_method', 'machine._private_factory']) {
    const selected = createLibraryReferences().select(query);
    assert.equal(selected.length, 1, query);
    assert.equal(selected[0].provenance.status, 'unsupported', query);
    assert.equal(selected[0].provenance.apiId, query);
  }
});

test('library results preserve complete contracts and enforce aggregate UTF-8 budgets', () => {
  const refs = createLibraryReferences(bundle());
  const selected = refs.select('machine.random_forest_classifier gesha.create_conv2d CNN');
  assert.ok(selected.length >= 2);
  assert.ok(selected.reduce((sum, source) => sum + Buffer.byteLength(source.text), 0) <= 8 * 1024);
  assert.deepEqual(refs.select('CNN', { maxBytes: 0 }), []);
  assert.throws(() => refs.select('CNN', { maxItems: 999 }), /budget/);
  assert.match(selected.find(source => source.provenance.apiId === 'gesha.create_conv2d').text, /Returns:.*object/);
});

test('returned source metadata cannot mutate the shared contract evidence', () => {
  const refs = createLibraryReferences(bundle()), first = refs.select('CNN');
  first[0].text = 'CORRUPTED'; first[0].provenance.examplePaths.push('tests/private.kf');
  assert.doesNotMatch(JSON.stringify(refs.select('CNN')), /CORRUPTED|private/);
});

test('unsafe source paths, duplicate ids and oversized API units are rejected even with recomputed hashes', () => {
  for (const mutate of [value => { value.entries[0].sources = ['../private']; },
    value => { value.entries[0].sources = ['C:/private']; },
    value => { value.entries.push(structuredClone(value.entries[0])); },
    value => { value.entries[0].summary = 'x'.repeat(7000); }]) {
    const value = bundle(); mutate(value); assert.throws(() => createLibraryReferences(sign(value)), /Invalid/);
  }
});

test('every shipped qualified contract and grouped receiver alias resolves to its own contract first', () => {
  const data = require('../../src/tutor/libraryReferences.json');
  const refs = createLibraryReferences(data);
  for (const entry of data.entries) {
    assert.equal(refs.select(entry.id)[0]?.provenance.apiId, entry.id, entry.id);
    for (const symbol of entry.sourceSymbols || []) {
      if (symbol.split('.').some(part => !/^[A-Za-z][A-Za-z0-9_]*$/.test(part))) continue;
      const query = `${entry.id.split('.')[0]}.${symbol}`;
      const canonical = data.entries.find(value => value.id.toLowerCase() === query.toLowerCase());
      assert.equal(refs.select(query)[0]?.provenance.apiId, canonical?.id || entry.id, query);
    }
  }
});

test('ordinary English and Spanish concepts resolve the specific shipped API', () => {
  const refs = createLibraryReferences();
  for (const [query, id] of [
    ['transposed convolution', 'gesha.create_conv2d_transpose'],
    ['convolución transpuesta', 'gesha.create_conv2d_transpose'],
    ['parada temprana', 'gesha.early_stopping'],
    ['create_conv2d_transpose', 'gesha.create_conv2d_transpose'],
    ['inicializador de ceros', 'gesha.zeros_initializer'],
    ['bosque aleatorio', 'machine.random_forest_classifier'],
    ['MACHINE imputar valores faltantes', 'machine.simple_imputer'],
    ['GESHA guardar pesos', 'gesha.Model.save_weights'],
  ]) assert.equal(refs.select(query)[0]?.provenance.apiId, id, query);
  assert.equal(refs.select('machine.create_conv2d_transpose')[0].provenance.status, 'unsupported');
  for (const query of ['Write BMI calc_imc with weight and height, zero and negative height', 'Haz una función para calcular el IMC con peso y altura']) {
    assert.deepEqual(refs.select(query), [], 'incidental weights/zeros must not turn a language exercise into a library lesson');
  }
});

test('study concept questions receive complete teaching guidance and related verified APIs without prior-topic carryover', () => {
  const refs = createLibraryReferences();
  for (const [id, queries] of [
    ['classification-sensitivity', ['How do I interpret sensitivity?', '¿Cuál es la sensibilidad del modelo para detectar fraudes?']],
    ['classifier-cost-tradeoffs', ['How should I compare classifiers when false alarms and missed positives have different costs?', '¿Cómo comparar clasificadores con costos de errores diferentes?']],
    ['imbalanced-accuracy', ['Why can high accuracy be misleading with imbalanced data?', '¿Una alta exactitud basta con datos desbalanceados?']],
    ['held-out-validation', ['Why evaluate on held-out data?', '¿Por qué evaluar con datos nuevos reservados?']],
    ['prediction-thresholds', ['How does a prediction threshold turn a score into a class?', '¿Cómo interpretar un umbral de clasificación?']],
    ['nonlinear-representation', ['Why is a single neuron limited for XOR?', '¿Por qué una sola neurona tiene límites con XOR?']],
    ['learning-rate-oscillation', ['My loss oscillates during training. How can I reason about the learning rate?', 'La pérdida oscila durante el entrenamiento. ¿Cómo pensar en la tasa de aprendizaje?']],
    ['overfitting', ['What can a training and test performance gap indicate?', '¿Qué indica una brecha entre entrenamiento y prueba?']],
  ]) for (const query of queries) {
    const selected = refs.select(query);
    assert.equal(selected[0]?.provenance.topicId, id, query);
    assert.ok(selected.some(source => source.provenance.apiId), 'related implementation evidence remains available');
    assert.ok(selected.length <= 3);
    assert.ok(selected.reduce((sum, source) => sum + Buffer.byteLength(source.text), 0) <= 8 * 1024);
  }
  const exact = refs.select('machine.confusion_matrix');
  assert.equal(exact[0].provenance.apiId, 'machine.confusion_matrix');
  assert.equal(exact.some(source => source.provenance.topicId), false);
  const unknown = refs.select('gesha.Model.predict._unknown sensibilidad');
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].provenance.status, 'unsupported');
});
