const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { createLibraryReferences } = require('../../src/tutor/LibraryReferences');
const activities = require('../evals/activity-dialogues.json');

const composer = () => new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });

for (const [request, topicId] of [
  [activities.dialogues[0].turns[0].learnerText, 'imbalanced-accuracy'],
  [activities.dialogues[1].turns[0].learnerText, 'nonlinear-representation'],
  ['Why does high accuracy hide missed positives? Explain one first step.', 'imbalanced-accuracy'],
  ['¿Por qué apilar una capa oculta lineal no cambia la capacidad para XOR?', 'nonlinear-representation'],
]) {
  test(`concept-only composition omits incidental contracts and fixtures: ${topicId}: ${request.slice(0, 35)}`, async () => {
    const result = await composer().compose({ request });
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: request });
    assert.deepEqual(result.snapshots.map(source => source.id), ['kafe-essentials', `learning:${topicId}`]);
    const topic = result.snapshots[1];
    assert.equal(topic.provenance.topicId, topicId);
    assert.match(topic.provenance.contentSha256, /^[a-f0-9]{64}$/);
    assert.equal(topic.contentSha256, require('../../src/tutor/RequestSnapshot').sha256(topic.text));
    assert.deepEqual(result.dependencies, { fileUris: [], knowledgeLineage: null });
  });
}

test('actual topic code help retains reviewed contracts and only their complete linked examples', async () => {
  for (const request of ['Show KAFE code for sensitivity', 'Necesito código para una capa oculta no lineal',
    'Explain the positional API for learning rate', '¿Cómo implemento sensibilidad en KAFE?']) {
    const result = await composer().compose({ request });
    const contracts = result.snapshots.filter(source => source.provenance.apiId);
    assert.ok(contracts.length, request);
    const paths = new Set(contracts.flatMap(source => source.provenance.examplePaths || []));
    const examples = result.snapshots.filter(source => source.category === 'test-reference');
    assert.ok(examples.length, request);
    for (const example of examples) {
      assert.ok(paths.has(example.provenance.path), example.provenance.path);
      assert.equal(JSON.parse(example.text.slice(example.text.indexOf('\n') + 1)).path, example.provenance.path);
    }
    assert.ok(result.snapshots.filter(source => source.category !== 'language-reference')
      .reduce((sum, source) => sum + Buffer.byteLength(source.text), 0) <= 12 * 1024);
    assert.equal(result.payload.messages.at(-1).content, request);
  }
});

for (const [request, apiIds] of [
  ['Create a KAFE function to calculate sensitivity.', ['machine.confusion_matrix', 'machine.recall_score']],
  ['Crea una función en KAFE para calcular la sensibilidad.', ['machine.confusion_matrix', 'machine.recall_score']],
  ['Help me build a KAFE program with a hidden layer.', ['gesha.create_dense', 'gesha.sequential']],
  ['Construye un programa en KAFE con una capa oculta.', ['gesha.create_dense', 'gesha.sequential']],
  ['Quiero crear una función para calcular sensibilidad en KAFE.', ['machine.confusion_matrix', 'machine.recall_score']],
  ['Ayúdame a construir un programa en KAFE con una capa oculta.', ['gesha.create_dense', 'gesha.sequential']],
  ['Write a KAFE function to calculate sensitivity.', ['machine.confusion_matrix', 'machine.recall_score']],
  ['Escribe una función en KAFE para calcular la sensibilidad.', ['machine.confusion_matrix', 'machine.recall_score']],
  ['¿Cómo programar una capa oculta no lineal en KAFE?', ['gesha.create_dense', 'gesha.sequential']],
  ['Show an example of using a hidden layer in KAFE.', ['gesha.create_dense', 'gesha.sequential']],
  ['Muéstrame un ejemplo de uso de una capa oculta en KAFE.', ['gesha.create_dense', 'gesha.sequential']],
  ['Could you write a small KAFE program with a hidden layer?', ['gesha.create_dense', 'gesha.sequential']],
  ['Quiero escribir una función para calcular sensibilidad en KAFE.', ['machine.confusion_matrix', 'machine.recall_score']],
]) {
  test(`explicit authoring retains related contracts and linked examples: ${request}`, async () => {
    const result = await composer().compose({ request });
    const contracts = result.snapshots.filter(source => source.provenance.apiId);
    assert.deepEqual(contracts.map(source => source.provenance.apiId).sort(), [...apiIds].sort());
    const paths = new Set(contracts.flatMap(source => source.provenance.examplePaths || []));
    const examples = result.snapshots.filter(source => source.category === 'test-reference');
    assert.ok(examples.length > 0);
    for (const example of examples) {
      assert.ok(paths.has(example.provenance.path), example.provenance.path);
      const fixture = JSON.parse(example.text.slice(example.text.indexOf('\n') + 1));
      assert.equal(fixture.path, example.provenance.path);
      assert.deepEqual(fixture, require('../../src/tutor/kafeReferences.json').fixtures
        .find(candidate => candidate.path === example.provenance.path));
    }
    assert.ok(result.snapshots.filter(source => source.category !== 'language-reference')
      .reduce((sum, source) => sum + Buffer.byteLength(source.text), 0) <= 12 * 1024);
    assert.ok(result.snapshots.filter(source => source.category === 'library-reference')
      .every(source => Buffer.byteLength(source.text) <= 6 * 1024));
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: request });
  });
}

for (const [request, topicId] of [
  ['Create a brief explanation of sensitivity in KAFE.', 'classification-sensitivity'],
  ['Help me build an explanation of why one neuron cannot learn XOR.', 'nonlinear-representation'],
  ['Create my conclusion about classifier comparison and false alarms.', 'classifier-cost-tradeoffs'],
  ['Build a conclusion about classifier comparison and false alarms.', 'classifier-cost-tradeoffs'],
  ['Crea una explicación de sensibilidad en KAFE.', 'classification-sensitivity'],
  ['Construye una conclusión sobre la comparación de clasificadores y las falsas alarmas.', 'classifier-cost-tradeoffs'],
  ['Help me write a short explanation of why one neuron cannot learn XOR.', 'nonlinear-representation'],
  ['Ayúdame a escribir mi conclusión sobre la comparación de clasificadores y las falsas alarmas.', 'classifier-cost-tradeoffs'],
  ['Write a brief explanation of sensitivity in KAFE.', 'classification-sensitivity'],
  ['Escribe una breve explicación de por qué una capa oculta lineal no cambia la capacidad para XOR.', 'nonlinear-representation'],
]) {
  test(`prose authoring remains concept-only: ${request}`, async () => {
    const result = await composer().compose({ request });
    assert.deepEqual(result.snapshots.map(source => source.id), ['kafe-essentials', `learning:${topicId}`]);
    assert.deepEqual(result.payload.messages.at(-1), { role: 'user', content: request });
  });
}

test('explicit qualified APIs retain contract guidance even alongside a conceptual question', async () => {
  for (const [request, apiId] of [
    ['How does machine.confusion_matrix help with sensitivity?', 'machine.confusion_matrix'],
    ['¿Cómo uso gesha.create_dense(2, "relu", [2]) para una capa oculta?', 'gesha.create_dense'],
    ['MACHINE train test split holdout', 'machine.train_test_split'],
  ]) {
    const result = await composer().compose({ request });
    assert.equal(result.snapshots.find(source => source.category === 'library-reference').provenance.apiId, apiId);
    assert.ok(result.snapshots.some(source => source.category === 'test-reference'));
    assert.equal(result.payload.messages.at(-1).content, request);
  }
});

test('domain and numerical guidance is transported without importing rehearsal answers into production references', async () => {
  const result = await composer().compose({ request: 'Why can one affine threshold miss Boolean XOR?' });
  const policy = result.payload.messages[0].content;
  assert.match(policy, /check.*numerator.*denominator.*percentage/i);
  assert.match(policy, /each.*threshold.*decision/i);
  assert.match(policy, /recompute.*supplied.*rather than.*prior.*Tutor/i);
  assert.match(policy, /qualified request for error-cost evidence.*valid.*qualitative priorities.*valid/i);
  assert.match(policy, /draft.*affirm supported claims.*at most one actual justification gap if present/i);
  assert.match(policy, /do not write a replacement conclusion/i);
  assert.match(policy, /adjacent.*metrics.*API caveats.*needed/i);
  assert.match(policy, /reported predictions.*convergence.*memorization/i);
  const topic = result.snapshots.find(source => source.provenance.topicId === 'nonlinear-representation');
  assert.match(topic.text, /three.*four.*not all four/i);
  assert.match(topic.text, /suitable.*architecture.*not.*arbitrary hidden/i);
  assert.match(topic.text, /exhaustive.*finite.*domain/i);
  assert.match(topic.text, /outside.*domain.*target rule/i);
  assert.doesNotMatch(topic.text, /0\.48|0\.52|0\.51|0\.55|0\.03|0\.96|0\.94|0\.04/);
  const directRelu = createLibraryReferences().select('gesha.create_dense')[0];
  assert.match(directRelu.text, /returned.*output.*not.*internal hidden/i);
  assert.match(directRelu.text, /FLOAT inputs.*not.*fix/i);
});

test('canonical F3 selects conditional draft guidance consistent with the policy', async () => {
  const request = activities.dialogues[0].turns[2].learnerText;
  const result = await composer().compose({ request });
  assert.deepEqual(result.snapshots.map(source => source.id), ['kafe-essentials', 'learning:classifier-cost-tradeoffs']);
  const topic = result.snapshots[1].text;
  assert.match(topic, /draft, affirm supported claims.*at most one actual justification gap if present/i);
  assert.match(topic, /sound draft needs no forced revision/i);
  assert.match(topic, /without supplying a replacement conclusion/i);
  assert.match(result.payload.messages[0].content, /draft.*affirm supported claims.*at most one actual justification gap if present/i);
  assert.equal(result.payload.messages.at(-1).content, request);
});

test('canonical X3 topic permits defined-population comparison without mandatory temporal traces', async () => {
  const request = activities.dialogues[1].turns[2].learnerText;
  const result = await composer().compose({ request });
  assert.deepEqual(result.snapshots.map(source => source.id), ['kafe-essentials', 'learning:overfitting']);
  const topic = result.snapshots[1].text;
  assert.match(topic, /compatible training and evaluation evidence.*defined population/i);
  assert.match(topic, /temporal trends.*one possible form.*not a prerequisite/i);
  assert.match(topic, /unknown training membership and settings unknown/i);
  assert.match(topic, /exhaustive finite task.*all defined cases/i);
  assert.doesNotMatch(topic, /0\.03|0\.96|0\.94|0\.04/);
  assert.equal(result.payload.messages.at(-1).content, request);
});
