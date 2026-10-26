const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { TOOL_NAMES } = require('../../src/tutor/ToolRouter');

const data = require('../evals/study-alignment.json');
const root = path.resolve(__dirname, '../../..');
const requiredConcepts = ['sensitivity', 'classifier-comparison', 'class-imbalance', 'unseen-data-evaluation',
  'prediction-interpretation', 'representation-capacity', 'learning-rate', 'overfitting'];
const scenario = id => data.cases.filter(item => item.scenarioId === id);
const sensitivityCases = data.cases.filter(item => item.scenarioId.startsWith('sensitivity-'));

test('study scenarios have a strict, balanced bilingual schema and explicit unevaluated model status', () => {
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.dataset, 'study-alignment');
  assert.deepEqual(data.languages, ['en', 'es']);
  assert.equal(data.coverage.cases, data.cases.length);
  assert.equal(data.cases.length, 36);
  assert.equal(new Set(data.cases.map(item => item.id)).size, data.cases.length);
  const ids = [...new Set(data.cases.map(item => item.scenarioId))];
  assert.equal(data.coverage.scenarios, ids.length);
  for (const id of ids) {
    const pair = scenario(id);
    assert.deepEqual(pair.map(item => item.language).sort(), ['en', 'es'], id);
    assert.notEqual(pair[0].prompt, pair[1].prompt, id);
    assert.deepEqual(pair[0].context, pair[1].context, `${id}: same evidence across languages`);
    assert.deepEqual(pair[0].expected, pair[1].expected, `${id}: same review standard across languages`);
  }
  for (const item of data.cases) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'scenarioId', 'language', 'kind', 'concepts', 'prompt', 'context', 'expected'].sort());
    assert.ok(typeof item.prompt === 'string' && item.prompt.length > 20 && item.prompt.length < 1200, item.id);
    assert.ok(item.concepts.length > 0 && item.concepts.every(value => requiredConcepts.includes(value)), item.id);
    assert.ok(['explain-concept', 'scaffold-exercise', 'feedback-on-attempt'].includes(item.expected.responseMode), item.id);
    assert.ok(item.expected.requiredCriteria.length > 0 && item.expected.requiredCriteria.every(value => Object.hasOwn(data.criteria, value)), item.id);
    assert.ok(typeof item.expected.leadWith === 'string' && item.expected.leadWith.length > 20, item.id);
    assert.ok(item.expected.mustNot.length > 0 && item.expected.mustNot.every(value => typeof value === 'string'), item.id);
  }
  assert.match(data.evaluationStatus.realProvider, /pending.*no model answers or quality scores/i);
  assert.match(data.evaluationStatus.deterministic, /schema.*coverage.*oracle/i);
});

test('the eight concept areas have direct concept scenarios without mandatory learner quizzes', () => {
  assert.deepEqual(data.concepts.map(item => item.id), requiredConcepts);
  assert.equal(data.concepts.filter(item => item.area === 'ml').length, 4);
  assert.equal(data.concepts.filter(item => item.area === 'dl').length, 4);
  assert.equal(data.coverage.conceptAreas, requiredConcepts.length);
  for (const id of requiredConcepts) {
    const pair = data.cases.filter(item => item.kind === 'concept' && item.concepts[0] === id);
    assert.equal(pair.length, 2, id);
    for (const item of pair) {
      assert.equal(item.context.taskKind, 'concept', item.id);
      assert.equal(item.expected.responseMode, 'explain-concept', item.id);
      assert.ok(item.expected.requiredCriteria.includes('direct-concept'), item.id);
      assert.ok(item.expected.requiredCriteria.includes('quiet-grounding'), item.id);
    }
  }
  assert.match(data.criteria['direct-concept'], /do not require a quiz/i);
});

test('the exact sensitivity regression leads with its formula in all four evidence states', () => {
  assert.equal(sensitivityCases.length, 8);
  assert.equal(data.coverage.sensitivityEvidenceStates, 4);
  assert.equal(new Set(sensitivityCases.map(item => item.context.evidenceState)).size, 4);
  for (const item of sensitivityCases) {
    assert.equal(item.prompt, item.language === 'es' ? '¿Cuál es la sensibilidad del modelo para detectar fraudes?' : "What is the model's sensitivity for detecting fraud?");
    assert.match(item.expected.leadWith, /^Sensitivity = TP\/\(TP\+FN\)/, item.id);
    assert.equal(item.context.taskKind, 'exercise');
    for (const criterion of ['learner-reasoning', 'honest-evidence', 'quiet-grounding', 'minimal-missing-info']) {
      assert.ok(item.expected.requiredCriteria.includes(criterion), `${item.id}: ${criterion}`);
    }
    assert.ok(item.expected.nextLearnerStep.length > 20, item.id);
    assert.equal(item.expected.finalAnswer, undefined, item.id);
    assert.equal(item.expected.sensitivity, undefined, item.id);
  }
  assert.match(data.criteria['versioned-kafe'], /macro recall is not automatically positive-class sensitivity/);
  assert.ok(scenario('concept-sensitivity')[0].expected.facts.some(value => /TP\+FN=0.*undefined/.test(value)));
});

test('provided and current-run sensitivity oracles identify fraud TP/FN from the stated matrix orientation', () => {
  const provided = scenario('sensitivity-supplied-matrix')[0];
  assert.deepEqual(provided.context.labels, [0, 1]);
  assert.equal(provided.context.positiveLabel, 1);
  assert.equal(provided.context.matrixOrientation, 'rows-actual-columns-predicted');
  const positive = provided.context.labels.indexOf(provided.context.positiveLabel);
  const row = provided.context.confusionMatrix[positive];
  assert.deepEqual(provided.expected.counts, { tp: row[positive], fn: row.reduce((sum, n, i) => sum + (i === positive ? 0 : n), 0) });
  assert.equal(provided.expected.toolUse, 'not-needed');
  assert.ok(provided.expected.mustNot.some(value => /resend the supplied matrix/.test(value)));

  const current = scenario('sensitivity-authorized-run')[0];
  const result = current.context.toolFixture.result;
  assert.equal(result.hostObserved, true);
  assert.equal(result.documentVersion, current.context.currentDocument.version);
  assert.equal(result.sourceIdentity, current.context.currentDocument.sourceIdentity);
  assert.equal(result.sourceRelationship, 'matches-saved-current');
  const matrix = JSON.parse(result.stdout.match(/matrix=(\[.*\])/)[1]);
  assert.deepEqual(current.expected.counts, { tp: matrix[1][1], fn: matrix[1][0] });
  assert.equal(result.exitCode, 0);
  assert.equal(result.outputTruncated, false);
  assert.ok(current.expected.mustNot.some(value => /Paste raw private stdout/.test(value)));
});

test('authorized output is inspected before unavailability claims and stale data never becomes current evidence', () => {
  for (const item of sensitivityCases.filter(item => item.context.availableTools)) {
    assert.deepEqual(item.expected.requiredTools, ['getLatestRunResult'], item.id);
    assert.equal(item.context.toolFixture.name, 'getLatestRunResult', item.id);
    assert.ok(item.expected.requiredTools.every(name => TOOL_NAMES.includes(name)), item.id);
    assert.equal(item.expected.toolUse, 'must-read-authorized-run-before-claiming-unavailable', item.id);
  }
  const missing = scenario('sensitivity-no-output')[0];
  assert.equal(missing.context.toolFixture.result, null);
  assert.deepEqual(missing.expected.missingFields, ['tp', 'fn']);
  assert.equal(missing.expected.counts, undefined);
  assert.match(missing.expected.nextLearnerStep, /request only the missing fraud TP and FN/);
  const stale = scenario('sensitivity-stale-run')[0];
  assert.notEqual(stale.context.toolFixture.result.sourceIdentity, stale.context.currentDocument.sourceIdentity);
  assert.ok(stale.context.toolFixture.result.documentVersion < stale.context.currentDocument.version);
  assert.equal(stale.context.toolFixture.result.sourceRelationship, 'changed');
  assert.equal(stale.expected.counts, undefined);
  assert.deepEqual(stale.expected.missingFields, ['current-tp', 'current-fn']);
  assert.ok(stale.expected.mustNot.some(value => /old matrix as the current model/.test(value)));
});

test('practical scenarios preserve three-model comparison, the initial single XOR unit and learner decisions', () => {
  const fraud = scenario('practical-three-classifiers')[0];
  assert.deepEqual(fraud.context.models.map(model => model.name), ['starter_classifier', 'machine.logistic_regression', 'machine.gaussian_nb']);
  const totals = fraud.context.models.map(model => model.matrix.map(row => row.reduce((sum, n) => sum + n, 0)));
  assert.ok(totals.every(value => JSON.stringify(value) === JSON.stringify(totals[0])), 'Compare the same class totals');
  assert.ok(fraud.expected.requiredCriteria.includes('learner-reasoning'));
  assert.ok(fraud.expected.requiredCriteria.includes('no-answer-dump'));
  assert.ok(fraud.expected.mustNot.some(value => /Choose a winner/.test(value)));
  const xor = scenario('practical-xor-initial-single-unit')[0];
  assert.deepEqual(xor.context.initialArchitecture, { neurons: 1, hiddenLayers: 0 });
  assert.deepEqual(xor.context.candidateExperiments, ['epochs', 'learning-rate', 'hidden-layers', 'seed']);
  assert.match(xor.expected.nextLearnerStep, /learner's hypothesis.*controlled comparison/);
  for (const id of ['exercise-answer-dump-request', 'participation-autonomy', 'honest-unrun-results']) {
    assert.ok(scenario(id)[0].expected.requiredCriteria.includes('learner-reasoning'), id);
  }
  assert.ok(scenario('exercise-answer-dump-request')[0].expected.requiredCriteria.includes('no-answer-dump'));
  assert.ok(scenario('quiet-decision-tree-guidance')[0].expected.requiredCriteria.includes('quiet-grounding'));
});

test('study prompts remain development-only synthetic cases without copied assessment forms or quality scores', () => {
  assert.equal(data.assessmentProtection.syntheticOnly, true);
  assert.equal(data.assessmentProtection.containsActualPretestOrPosttestQuestions, false);
  assert.equal(data.assessmentProtection.containsAssessmentAnswerKey, false);
  assert.match(fs.readFileSync(path.join(root, 'kafe-vscode/.vscodeignore'), 'utf8'), /^test\/\*\*$/m);
  const serialized = JSON.stringify(data);
  assert.doesNotMatch(serialized, /forms\.gle|docs\.google\.com\/forms|api[_-]?key|Bearer /i);
  assert.ok(data.cases.every(item => item.score === undefined && item.modelAnswer === undefined));
  assert.ok(data.cases.every(item => !/```/.test(item.prompt)), 'No ready-made programs or assessment answer dumps in prompts');
});
