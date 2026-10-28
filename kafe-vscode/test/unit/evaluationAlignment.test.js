const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { ToolRouter, selectedSourceId } = require('../../src/tutor/ToolRouter');
const { ActionEvidence } = require('../../src/tutor/ActionEvidence');
const { LearningSession } = require('../../src/tutor/LearningSession');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { createRequestSnapshot, sha256 } = require('../../src/tutor/RequestSnapshot');

const uri = filename => ({ scheme: 'file', toString: () => `file://${filename}` });
const activeDocument = () => ({ uri: uri('/study/fraud.kf'), version: 1, text: 'function main() { show(1); }' });
// Synthetic host observations test transport and provenance, not classifier efficacy.
const metrics = 'OBSERVED_CLASSIFIER_METRICS\ntree recall=0.42\nlogistic recall=0.71\nGaussianNB recall=0.67\n';
const reportedMetrics = 'Mis resultados: árbol sensibilidad 0.42, regresión logística 0.71 y Gaussian Naive Bayes 0.67. Ayúdame a interpretarlos.';
const resultFor = (document, patch = {}) => ({ stdout: metrics, stderr: 'SYNTHETIC_HOST_DIAGNOSTIC\n', exitCode: 0,
  outputTruncated: false, runtimeVersion: '0.3.0', knowledgePackVersion: '0.3.0',
  sourceUri: document.uri.toString(), runSequence: 3,
  sourceIdentity: { launch: sha256(document.text), completion: sha256(document.text) }, ...patch });

function fixture() {
  const document = activeDocument();
  let saved = sha256(document.text), reads = 0;
  const reader = { validateUri: async () => true, readSavedIdentity: async () => saved,
    readDocument: async target => { reads++; return { uri: target, text: 'included helper', version: 1 }; } };
  const knowledgeRetriever = { getKnowledgeLineage: async () => null, search: async () => [] };
  const composer = new ContextComposer({ documentReader: reader, knowledgeRetriever });
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever });
  const ledger = new ActionEvidence();
  const run = resultFor(document);
  ledger.recordRun(run);
  const compose = (patch = {}) => composer.compose({ request: 'Ayúdame a interpretar la sensibilidad de estos tres clasificadores.',
    activeDocument: document, runResult: run, actionEvidence: ledger, ...patch });
  return { document, reader, composer, router, ledger, run, compose, reads: () => reads, save: text => { saved = sha256(text); } };
}

function seal(composition) {
  return createRequestSnapshot({ sessionId: 'study-conversation', generation: 1, runSequence: 3,
    submission: { submissionId: randomUUID(), text: composition.payload.messages.at(-1).content, inputRevision: 0,
      context: { revision: 1, restricted: false, sources: [] } },
    sources: composition.snapshots, history: composition.history, learning: composition.learning,
    dependencies: composition.dependencies, request: composition.payload });
}

test('authorized same-file Run metrics and diagnostics survive real composition, immutable capture and tool decoding', async () => {
  const f = fixture(), composition = await f.compose(), captured = seal(composition);
  const runSource = captured.sources.find(source => source.id === 'run-result');
  assert.ok(runSource);
  assert.deepEqual(runSource.provenance, { sourceUri: f.document.uri.toString(), runSequence: 3 });
  const sourceMessage = captured.request.messages.find(message => message.content.startsWith('[Source run-result]'));
  assert.match(sourceMessage.content, /learner-started Run observation/);
  assert.match(sourceMessage.content, /OBSERVED_CLASSIFIER_METRICS/);
  assert.match(sourceMessage.content, /SYNTHETIC_HOST_DIAGNOSTIC/);
  assert.equal(captured.request.messages.at(-1).content, 'Ayúdame a interpretar la sensibilidad de estos tres clasificadores.');
  f.run.stdout = 'LATER_UNCAPTURED_RUN';
  const actual = await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: captured, runResult: f.run });
  assert.equal(actual.stdout, metrics);
  assert.equal(actual.stderr, 'SYNTHETIC_HOST_DIAGNOSTIC\n');
  assert.equal(actual.exitCode, 0);
  assert.equal(actual.sourceRelationship, 'unchanged-at-observed-boundaries');
  assert.equal(actual.currentDocumentRelationship, 'same-content');
  assert.equal(actual.correctness, 'not-established');
  assert.equal(actual.exactExecutedBytes, 'unknown');
  assert.equal(f.reads(), 0, 'Run interpretation cannot silently read another document');
});

test('old-file Run output remains excluded even when its file is explicitly included beside another active file', async () => {
  const f = fixture(), other = { uri: uri('/study/xor.kf'), text: 'function main() { show(0); }', version: 1 };
  const composition = await f.compose({ activeDocument: other, candidateUris: [f.document.uri], includedSourceIds: [selectedSourceId(f.document.uri)] });
  assert.ok(composition.snapshots.some(source => source.category === 'selected-file'));
  assert.equal(composition.snapshots.some(source => source.id === 'run-result'), false);
  assert.doesNotMatch(JSON.stringify(composition.payload), /OBSERVED_CLASSIFIER_METRICS|SYNTHETIC_HOST_DIAGNOSTIC/);
  assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(composition) }), null);
  const noActive = await f.compose({ activeDocument: undefined });
  assert.equal(noActive.snapshots.some(source => source.id === 'run-result'), false);
  assert.doesNotMatch(JSON.stringify(noActive.payload), /OBSERVED_CLASSIFIER_METRICS/);
});

test('changed source keeps earlier output historical and invalidates the original current-source snapshot', async () => {
  const f = fixture(), original = await f.compose(), captured = seal(original);
  const revalidate = active => f.composer.revalidateSnapshot({ snapshot: captured, current: captured,
    activeDocument: active, runResult: f.run, actionEvidence: f.ledger,
    knowledgeAvailability: { status: 'unavailable', code: 'knowledge_unavailable' } });
  assert.equal(await revalidate(f.document), true);
  const changed = { ...f.document, text: 'function main() { show(2); }', version: 2 };
  assert.equal(await revalidate(changed), false);
  let composed = await f.compose({ activeDocument: changed });
  let actual = await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(composed) });
  assert.equal(actual.stdout, metrics);
  assert.equal(actual.currentDocumentRelationship, 'changed');
  assert.equal(actual.sourceRelationship, 'unchanged-at-observed-boundaries', 'dirty editor and saved bytes are distinct observations');
  f.save(changed.text);
  assert.equal(await revalidate(f.document), false, 'changed saved bytes also invalidate the original capture');
  composed = await f.compose({ activeDocument: changed });
  actual = await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(composed) });
  assert.equal(actual.sourceRelationship, 'changed');
  assert.equal(actual.currentDocumentRelationship, 'changed');
  assert.equal(actual.correctness, 'not-established');
  assert.equal(actual.exactExecutedBytes, 'unknown');
});

test('failed, truncated and unattributed Runs preserve diagnostics and uncertainty without becoming correctness proof', async () => {
  const f = fixture(), run = resultFor(f.document, { stdout: '', stderr: 'MODEL_TRAINING_FAILED\n', exitCode: null,
    outputTruncated: true, sourceIdentity: null, runtimeVersion: null, knowledgePackVersion: null, runtimeMode: 'contributor' });
  const ledger = new ActionEvidence(); ledger.recordRun(run);
  const composition = await f.compose({ runResult: run, actionEvidence: ledger });
  const actual = await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(composition) });
  assert.equal(actual.stdout, '');
  assert.equal(actual.stderr, 'MODEL_TRAINING_FAILED\n');
  assert.equal(actual.exitCode, null);
  assert.equal(actual.outputTruncated, true);
  assert.equal(actual.sourceRelationship, 'unknown');
  assert.equal(actual.runtimeProvenance, 'unknown');
  assert.equal(actual.exitOutcome, 'unknown');
  assert.equal(actual.correctness, 'not-established');
});

test('private Run transport retains the combined 1MiB UTF-8 bound and restricted-workspace gate', async () => {
  const f = fixture(), large = resultFor(f.document, { stdout: 'é'.repeat(512 * 1024), stderr: '' });
  const ledger = new ActionEvidence(); ledger.recordRun(large);
  const composition = await f.compose({ runResult: large, actionEvidence: ledger });
  const captured = seal(composition);
  assert.equal((await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: captured })).stdout, large.stdout);
  await assert.rejects(f.compose({ runResult: { ...large, stderr: 'x' }, actionEvidence: ledger }), /run result size/);
  const runSource = captured.sources.find(source => source.id === 'run-result');
  const text = JSON.stringify({ ...JSON.parse(runSource.text), stderr: 'x' });
  const tooLarge = { ...runSource, text, contentSha256: sha256(text) };
  await assert.rejects(f.router.route({ name: 'getLatestRunResult', arguments: {} }, {
    snapshot: { sources: [captured.sources.find(source => source.id === 'active-file'), tooLarge] },
  }), /snapshot shape or size/);
  await assert.rejects(f.router.route({ name: 'getLatestRunResult', arguments: {} }, {
    snapshot: { ...captured, submission: { ...captured.submission, context: { ...captured.submission.context, restricted: true } } },
  }), /Restricted workspace tools/);
});

test('New and restored conversations cannot reacquire prior private Run metrics from the same active file', async t => {
  const f = fixture();
  const coordinator = new SessionCoordinator({ contextComposer: f.composer, toolRouter: f.router,
    getContext: () => ({ activeDocument: f.document }), getSourceRevision: () => 0 });
  t.after(() => coordinator.dispose());
  const capture = async () => {
    await coordinator.refreshContext();
    const current = coordinator.snapshot();
    return coordinator.captureSubmission({ submissionId: randomUUID(), text: 'Explain my results',
      inputRevision: current.inputRevision, context: current.context });
  };
  assert.equal(coordinator.recordRunResult(f.run), true);
  const original = await capture();
  assert.equal((await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: original })).stdout, metrics);
  const archive = coordinator.captureConversation();
  assert.doesNotMatch(JSON.stringify(archive), /OBSERVED_CLASSIFIER_METRICS|SYNTHETIC_HOST_DIAGNOSTIC/);
  coordinator.newConversation();
  let current = await capture();
  assert.equal(coordinator.isSubmissionAuthorized(original), false);
  assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: current }), null);
  assert.doesNotMatch(JSON.stringify(current.request), /OBSERVED_CLASSIFIER_METRICS/);
  assert.equal(coordinator.restoreConversation(archive).status, 'completed');
  current = await capture();
  assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: current }), null);
  assert.doesNotMatch(JSON.stringify(current.request), /OBSERVED_CLASSIFIER_METRICS/);
});

test('real getLatestRunResult tool continuation retains the private observed source and coaching policy in both teaching modes', async t => {
  for (const mode of ['guided', 'paused']) {
    const f = fixture(), sent = [];
    const answer = 'La sensibilidad indica qué proporción de los positivos reales detecta el clasificador. Relaciona los falsos negativos con el coste de omitir fraude.';
    const provider = { async *stream(input) {
      sent.push(input.request);
      if (sent.length === 1) yield { type: 'complete', text: '', finishReason: 'tool_calls',
        toolCalls: [{ id: 'inspect-authorized-run', name: 'getLatestRunResult', arguments: {} }] };
      else yield { type: 'complete', text: answer, finishReason: 'stop', toolCalls: [] };
    } };
    const coordinator = new SessionCoordinator({ provider, contextComposer: f.composer, toolRouter: f.router,
      getContext: () => ({ activeDocument: f.document }), getSourceRevision: () => 0 });
    t.after(() => coordinator.dispose());
    coordinator.learningSession.setPreferences({ mode });
    assert.equal(coordinator.recordRunResult(f.run), true);
    await coordinator.refreshContext();
    assert.equal((await coordinator.handleLearnerMessage({ type: 'submitMessage', submissionId: randomUUID(),
      text: 'Ayúdame a interpretar la sensibilidad de mi último resultado.', contextRevision: coordinator.snapshot().context.revision })).status, 'completed');
    assert.equal(sent.length, 2, `${mode}`);
    assert.equal(sent[1].messages[0].content, sent[0].messages[0].content);
    assert.match(sent[1].messages[0].content, /Keep this scope on follow-ups and after tools/);
    assert.match(sent[1].messages[0].content, /Use numbers already supplied by the learner or present in authorized Run stdout\/stderr/);
    const original = sent[0].messages.find(message => message.content.startsWith('[Source run-result]'));
    const continued = sent[1].messages.find(message => message.content?.startsWith('[Source run-result]'));
    assert.deepEqual(continued, original);
    assert.match(continued.content, /OBSERVED_CLASSIFIER_METRICS/);
    assert.match(continued.content, /SYNTHETIC_HOST_DIAGNOSTIC/);
    assert.deepEqual(sent[1].messages.find(message => message.role === 'tool'), {
      role: 'tool', tool_call_id: 'inspect-authorized-run', content: 'Source already included: run-result',
    });
    const assistant = coordinator.snapshot().entries.find(entry => entry.kind === 'assistant');
    assert.equal(assistant.text, answer);
    assert.doesNotMatch(JSON.stringify(coordinator.captureConversation()), /OBSERVED_CLASSIFIER_METRICS|SYNTHETIC_HOST_DIAGNOSTIC/);
  }
});

for (const mode of ['guided', 'paused']) {
  test(`assessment coaching distinguishes observed, learner-reported and missing values: ${mode}`, async () => {
    const f = fixture(), learningSession = new LearningSession(); learningSession.setPreferences({ mode });
    const composition = await f.compose({ request: reportedMetrics, runResult: null, actionEvidence: new ActionEvidence(), learningSession });
    assert.deepEqual(composition.payload.messages.at(-1), { role: 'user', content: reportedMetrics });
    assert.deepEqual(composition.learning.preferences, { mode });
    assert.equal(composition.snapshots.some(source => source.id === 'run-result'), false);
    assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(composition) }), null);
    assert.doesNotMatch(JSON.stringify(composition.payload), /OBSERVED_CLASSIFIER_METRICS|SYNTHETIC_HOST_DIAGNOSTIC/);
    const observed = await f.compose({ learningSession });
    assert.equal((await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(observed) })).stdout, metrics);
    const request = '¿Qué es la sensibilidad y cómo se relaciona con los falsos negativos?';
    const missing = await f.compose({ request, runResult: null, actionEvidence: new ActionEvidence(), learningSession });
    assert.deepEqual(missing.payload.messages.at(-1), { role: 'user', content: request });
    assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot: seal(missing) }), null);
    for (const result of [composition, observed, missing]) {
      const policy = result.payload.messages[0].content;
      assert.match(policy, /Use numbers already supplied by the learner or present in authorized Run stdout\/stderr/);
      assert.match(policy, /inspect the captured run-result or getLatestRunResult before claiming its output is unavailable/);
      assert.match(policy, /Treat learner-supplied values as learner-reported, not host-verified/);
      assert.match(policy, /If indispensable values are missing, explain the relationship first and ask only for those missing values/);
      assert.match(policy, /Never invent measurements or imply that you ran a program/);
      assert.match(policy, /Historical results from changed source stay historical/);
      assert.match(policy, /machine\.recall_score returns macro recall across classes, not automatically the sensitivity/);
      assert.match(policy, /Locate the positive label in the supplied label order/);
      assert.match(policy, /never provide the final answer.*complete ready-to-submit solution/);
      assert.match(policy, /Keep this scope on follow-ups and after tools/);
      assert.match(policy, /closed-book pretest or posttest that forbids assistance, do not solve, hint at or select its answers/);
      assert.match(policy, /Do not infer an active assessment merely because a practice question resembles one/);
      assert.match(policy, /Do not claim a learner score, mastery, study participation or learning improvement/);
      assert.match(policy, /Research collection and transcript sharing require separate explicit consent; do not initiate them/);
      assert.match(policy, /Help, Skip and Pause never authorize file writes or Run/);
      if (mode === 'paused') assert.match(policy, /Teaching is paused: do not require additional learner reasoning/);
    }
  });
}
