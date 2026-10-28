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
  assert.match(policy, /qualitative.*objective.*valid/i);
  assert.match(policy, /draft.*one.*gap.*without.*replacement/i);
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
