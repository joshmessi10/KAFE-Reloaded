const assert = require('node:assert/strict');
const test = require('node:test');
const data = require('../../reference/learning-topics.json');
const { LEARNING_TOPIC_IDS, validateLearningTopics, selectLearningTopics } = require('../../src/tutor/LearningTopics');

const objectives = [
  ['classification-sensitivity', 'How can I count missed positives and explain positive class recall?',
    '¿Cómo calculo la sensibilidad a partir de falsos negativos?'],
  ['classifier-cost-tradeoffs', 'How should I compare classifiers when the cost of errors differs?',
    '¿Cómo comparar clasificadores si el costo de errores es distinto?'],
  ['imbalanced-accuracy', 'Why can high accuracy hide poor performance on the minority class?',
    '¿Por qué una alta exactitud puede esconder fallas en la clase minoritaria?'],
  ['held-out-validation', 'Why evaluate a fitted model on unseen data rather than only training data?',
    '¿Para qué evaluar con datos nuevos en vez de solo datos de entrenamiento?'],
  ['prediction-thresholds', 'How do I interpret a sigmoid output before choosing a label?',
    '¿Cómo interpretar predicciones y el umbral de una salida sigmoid?'],
  ['nonlinear-representation', 'What does XOR reveal about a single linear decision boundary?',
    '¿Cómo razonar sobre XOR y la capacidad de representación?'],
  ['learning-rate-oscillation', 'The loss keeps jumping during training. How does learning rate affect that?',
    'La pérdida sube y baja: ¿qué relación tiene la tasa de aprendizaje?'],
  ['overfitting', 'Training gets better but validation gets worse. What should I investigate?',
    'El entrenamiento mejora pero la validación empeora: ¿puede ser sobreajuste?'],
];

test('all eight conceptual objectives remain in the explicit production denominator and use canonical reviewed APIs', () => {
  assert.equal(Object.isFrozen(LEARNING_TOPIC_IDS), true);
  assert.equal(LEARNING_TOPIC_IDS.length, 8);
  assert.deepEqual(LEARNING_TOPIC_IDS, objectives.map(([id]) => id));
  const topics = validateLearningTopics(data);
  assert.deepEqual(topics.map(topic => topic.id), LEARNING_TOPIC_IDS);
  const entries = ['machine', 'gesha'].flatMap(library => require(`../../reference/${library}-api.json`).entries);
  const ids = new Set(entries.map(entry => entry.id));
  for (const topic of topics) {
    assert.ok(topic.apiIds.every(id => ids.has(id)), topic.id);
    assert.match(topic.text, /Concept:/);
    assert.match(topic.text, /KAFE grounding:/);
    assert.match(topic.text, /Optional coaching question:/);
    assert.match(topic.text, /Small next step:/);
    assert.match(topic.text, /Caveat:/);
    assert.doesNotMatch(topic.text, /forms\.gle|pretest|posttest|postest|answer key|correct option|respuesta correcta/i);
  }
});

for (const [id, ...questions] of objectives) for (const [index, question] of questions.entries()) {
  test(`${id} is retrieved by a natural ${index ? 'Spanish' : 'English'} question`, () => {
    const selected = selectLearningTopics(data, question);
    assert.equal(selected[0]?.id, id);
    assert.ok(selected.length <= 2);
    assert.ok(selected.reduce((total, topic) => total + Buffer.byteLength(topic.text, 'utf8'), 0) <= 4 * 1024);
  });
}

test('sensitivity preserves positive-label, macro recall and absent-positive distinctions', () => {
  const topic = data.topics.find(item => item.id === 'classification-sensitivity');
  assert.match(topic.text, /TP \/ \(TP \+ FN\)/);
  assert.match(topic.text, /actual-class rows and predicted-class columns/);
  assert.match(topic.text, /sorted union/);
  assert.match(topic.text, /macro recall over classes observed in y_true/);
  assert.match(topic.text, /not automatically positive-class sensitivity/);
  assert.match(topic.text, /no actual positives.*not estimable/);
});

test('training versus test performance gaps retrieve the overfitting hypothesis with its caveats', () => {
  for (const query of ['What can a training and test performance gap indicate?',
    '¿Qué indica una brecha entre entrenamiento y prueba?']) {
    const result = selectLearningTopics(data, query);
    assert.equal(result[0]?.id, 'overfitting');
    assert.match(result[0].text, /warning sign/);
    assert.match(result[0].text, /Distribution shift, split mistakes or noise/);
  }
});

test('natural singular-layer and Spanish sigmoid vocabulary retain their conceptual meaning', () => {
  assert.equal(selectLearningTopics(data, 'Why would I need a hidden layer?')[0]?.id, 'nonlinear-representation');
  assert.equal(selectLearningTopics(data, '¿Para qué sirve una capa oculta?')[0]?.id, 'nonlinear-representation');
  assert.equal(selectLearningTopics(data, '¿Cómo interpreto una salida sigmoide?')[0]?.id, 'prediction-thresholds');
});

test('single generic words, greetings, unrelated BMI and API-only requests do not start a conceptual lesson', () => {
  for (const query of ['Hello!', 'Hola', 'linear', 'lineal', 'weights', 'peso', 'model', 'training',
    'Calculate BMI from weight and height', 'Calcular IMC con peso y altura',
    'machine.recall_score', 'machine.recall_score()', 'recall_score', 'gesha.Model.predict_label']) {
    assert.deepEqual(selectLearningTopics(data, query), [], query);
  }
});

test('topic selection respects exact UTF-8/item limits and never clips a conceptual reference', () => {
  const topic = structuredClone(data.topics[0]); topic.text = '界'.repeat(20);
  assert.deepEqual(selectLearningTopics([topic], 'sensitivity', { maxBytes: 59 }), []);
  const selected = selectLearningTopics([topic], 'sensitivity', { maxBytes: 60 });
  assert.deepEqual(selected, [topic]);
  assert.equal(Buffer.byteLength(selected[0].text, 'utf8'), 60);
  assert.deepEqual(selectLearningTopics(data, 'overfitting', { maxBytes: 0 }), []);
  assert.deepEqual(selectLearningTopics(data, 'overfitting', { maxItems: 0 }), []);
  assert.equal(selectLearningTopics(data, 'sensitivity and overfitting', { maxItems: 1 }).length, 1);
  for (const options of [{ maxItems: 6 }, { maxItems: -1 }, { maxBytes: 12 * 1024 + 1 }, { maxBytes: NaN }]) {
    assert.throws(() => selectLearningTopics(data, 'sensitivity', options), /Invalid/);
  }
});

test('selection is deterministic, detached and reevaluates the current question and topic bytes', () => {
  const original = JSON.stringify(data);
  const first = selectLearningTopics(data, 'sensitivity');
  const baseline = structuredClone(first);
  first[0].text = 'CORRUPTED'; first[0].aliases.push('private content'); first[0].apiIds.push('machine.nonexistent');
  assert.deepEqual(selectLearningTopics(data, 'sensitivity'), baseline);
  assert.equal(JSON.stringify(data), original);
  assert.equal(selectLearningTopics(data, 'overfitting')[0].id, 'overfitting');
  const changed = structuredClone(data); changed.topics[0].text = 'Changed reviewed conceptual reference.';
  assert.equal(selectLearningTopics(changed, 'sensitivity')[0].text, 'Changed reviewed conceptual reference.');
  const validated = validateLearningTopics(data); validated[0].aliases.length = 0;
  assert.ok(data.topics[0].aliases.length > 0);
});

test('malformed collections, duplicate IDs, oversized text and hidden assessment fields fail closed', () => {
  for (const value of [{}, { schemaVersion: 2, topics: [] }, null]) assert.throws(() => validateLearningTopics(value), /Invalid/);
  for (const mutate of [
    topics => topics.push(structuredClone(topics[0])),
    topics => { topics[0].text = '界'.repeat(2100); },
    topics => { topics[0].apiIds = ['../private']; },
    topics => { topics[0].apiIds.push(topics[0].apiIds[0]); },
    topics => { topics[0].aliases = []; },
    topics => { topics[0].answerKey = 'Not a reference field'; },
  ]) {
    const topics = structuredClone(data.topics); mutate(topics);
    assert.throws(() => validateLearningTopics(topics), /Invalid/);
  }
  assert.deepEqual(validateLearningTopics([]), [], 'old synthetic bundles can omit optional topics');
  assert.throws(() => selectLearningTopics(data, null), /Invalid/);
});
