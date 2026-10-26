const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { buildLibraryEvals, reviewedExamples } = require('../../scripts/build-library-evals.cjs');
const { apiInventory } = require('../../scripts/build-library-references.cjs');
const { createLibraryReferences } = require('../../src/tutor/LibraryReferences');
const { TOOL_NAMES, TOOL_DEFINITIONS } = require('../../src/tutor/ToolRouter');

const root = path.resolve(__dirname, '../../..');
const read = filename => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
const dataset = read('kafe-vscode/test/evals/library-api.json');
const documents = ['machine', 'gesha'].map(library => read(`kafe-vscode/reference/${library}-api.json`));
const entries = documents.flatMap(document => document.entries);

test('generated bilingual evaluations are fresh and cover the source-derived intended top-level inventory', () => {
  assert.deepEqual(dataset, buildLibraryEvals(root));
  const inventory = apiInventory(root);
  const intended = Object.entries(inventory).flatMap(([library, value]) =>
    [...value.functions, ...Object.keys(value.aliases)].map(name => `${library}.${name}`)).sort();
  const top = dataset.cases.filter(item => item.kind === 'top-level-api');
  assert.equal(new Set(dataset.cases.map(item => item.id)).size, dataset.cases.length);
  assert.deepEqual([...new Set(top.map(item => item.contractId))].sort(), intended);
  assert.equal(dataset.coverage.intendedTopLevel, intended.length);
  assert.equal(top.length, intended.length * 2);
  for (const id of intended) assert.deepEqual(top.filter(item => item.contractId === id).map(item => item.language).sort(), ['en', 'es']);
  assert.match(dataset.evaluationStatus.realProvider, /pending.*not run/i);
});

test('every pure reviewed API example is catalogued and all isolated filesystem fixtures remain excluded', () => {
  const catalogue = read('kafe-vscode/reference/catalogue.json');
  assert.equal(new Set(catalogue.fixtures).size, catalogue.fixtures.length);
  for (const item of reviewedExamples(documents)) {
    assert.equal(catalogue.fixtures.includes(item.path), item.bundledTeachingFixture, item.path);
    assert.ok(fs.statSync(path.join(root, item.path)).isFile());
    assert.ok(fs.statSync(path.join(root, item.path.slice(0, -3) + '.expec')).isFile());
  }
  for (const preserved of ['tests/TutorReferences/bmi_imc.kf', 'tests/TutorReferences/undefined_print.error.kf',
    'tests/functions/function_currying_basic.kf', 'tests/KafeMATH/constants_pi_e.kf', 'tests/KafeNUMK/matrix_multiplication.kf']) {
    assert.ok(catalogue.fixtures.includes(preserved), `Preserve reviewed fundamentals: ${preserved}`);
  }
  assert.equal(dataset.coverage.pureEvidenceFixtures, reviewedExamples(documents).filter(item => item.bundledTeachingFixture).length);
});

test('all English and Spanish API concepts and full prompts retrieve the intended complete contract first', () => {
  const references = createLibraryReferences();
  for (const item of dataset.cases.filter(value => value.kind === 'top-level-api')) {
    const entry = entries.find(entry => entry.id === item.contractId);
    for (const query of [item.retrievalQuery, item.prompt]) {
      const selected = references.select(query);
      assert.equal(selected[0]?.provenance.apiId, item.contractId, `${item.id}: ${query}`);
      assert.equal(selected[0]?.provenance.status, item.expectedStatus, item.id);
      for (const signature of entry.signatures) assert.ok(selected[0].text.includes(signature), `${item.id}: intact signature`);
      for (const constraint of entry.constraints) assert.ok(selected[0].text.includes(constraint), `${item.id}: intact limit`);
      assert.ok(selected.reduce((bytes, source) => bytes + Buffer.byteLength(source.text, 'utf8'), 0) <= 8 * 1024);
    }
  }
});

test('known limitations and the learner decision-tree regression retrieve reviewed API facts', () => {
  const references = createLibraryReferences();
  for (const item of dataset.cases.filter(value => ['known-limit', 'teaching-behavior'].includes(value.kind))) {
    const selected = references.select(item.retrievalQuery);
    assert.equal(selected[0]?.provenance.apiId, item.contractId, `${item.id}: ${item.retrievalQuery}`);
    assert.equal(selected[0]?.provenance.status, item.expectedStatus, item.id);
    assert.ok(item.review.criteria.length, item.id);
    assert.ok(item.review.evidence.length, item.id);
  }
  const screenshot = dataset.cases.find(item => item.id === 'teaching-decision-tree-concept-es');
  assert.equal(screenshot.prompt, 'Que es un decision tree y como lo implemento?');
  assert.ok(screenshot.review.signatures.includes('machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)'));
  assert.ok(screenshot.review.criteria.some(criterion => /no-argument example does not exclude/.test(criterion)));
});

test('invented and wrong-library names return an explicit unavailable result without substituted APIs', () => {
  const references = createLibraryReferences();
  for (const item of dataset.cases.filter(value => value.kind === 'unknown-api')) {
    const selected = references.select(item.prompt);
    assert.equal(selected.length, 1, item.id);
    assert.equal(selected[0]?.provenance.apiId, item.expectedApiIds[0], item.id);
    assert.equal(selected[0]?.provenance.status, 'unsupported', item.id);
    assert.match(selected[0].text, /not in the reviewed intended public API inventory/);
  }
});

test('evaluation capabilities match actual provider tools and distinguish run snapshots from execution', () => {
  assert.deepEqual(dataset.capabilities.providerTools, [...TOOL_NAMES]);
  assert.deepEqual(TOOL_DEFINITIONS.map(item => item.function.name), [...TOOL_NAMES]);
  assert.ok(!TOOL_NAMES.some(name => /^(?:run|execute)/i.test(name)));
  assert.match(TOOL_DEFINITIONS.find(item => item.function.name === 'getLatestRunResult').function.description, /Read.*learner-started/);
  assert.match(dataset.capabilities.referenceRetrieval, /no program execution/);
  assert.match(dataset.capabilities.execution, /explicit learner Run.*trusted workspace/);
  assert.match(dataset.capabilities.modelOutputExecution, /never/);
  const boundaries = dataset.cases.filter(item => item.kind === 'capability-boundary');
  assert.equal(boundaries.length, 6);
  assert.ok(boundaries.every(item => item.expectedApiIds.length === 0 && item.review.evidence.length === 0));
});
