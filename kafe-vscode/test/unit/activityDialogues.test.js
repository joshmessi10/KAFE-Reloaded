const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { ToolRouter, metadataLineage } = require('../../src/tutor/ToolRouter');
const data = require('../evals/activity-dialogues.json');

// Deliberately content-free: these replies exercise transport, never teaching quality.
function fixture() {
  let context = {}, availability = { status: 'unavailable', code: 'knowledge_unavailable' };
  const captured = [], reads = [];
  const reader = { validateUri: async () => true,
    readDocument: async uri => { reads.push(uri.toString()); throw Error('No optional file was authorized'); } };
  const retriever = { getKnowledgeLineage: async () => availability.status === 'ready' ? metadataLineage(availability.metadata) : null,
    search: async () => [] };
  const composer = new ContextComposer({ documentReader: reader, knowledgeRetriever: retriever });
  const router = new ToolRouter({ documentReader: reader, knowledgeRetriever: retriever });
  const provider = { async *stream(input) {
    captured.push({ request: structuredClone(input.request), snapshot: coordinator.controller.current.snapshot });
    yield { type: 'complete', text: `Respuesta sintética de transporte ${captured.length}.`, finishReason: 'stop', toolCalls: [] };
  } };
  const coordinator = new SessionCoordinator({ provider, contextComposer: composer, toolRouter: router,
    getContext: () => context, getKnowledgeAvailability: async () => availability, getSourceRevision: () => 0 });
  const submit = async text => {
    await coordinator.refreshContext();
    const result = await coordinator.handleLearnerMessage({ type: 'submitMessage', submissionId: randomUUID(), text,
      contextRevision: coordinator.snapshot().context.revision });
    assert.equal(result.status, 'completed');
    return captured.at(-1);
  };
  return { coordinator, router, captured, reads, submit, setContext: value => context = value,
    setAvailability: value => availability = value };
}

const dialogue = id => data.dialogues.find(item => item.id === id);

test('synthetic review data keeps both novice activities, evidence origins and independent answer-review criteria', () => {
  assert.equal(data.syntheticOnly, true);
  assert.equal(data.language, 'es');
  assert.deepEqual(data.dialogues.map(item => item.id), ['fraud', 'xor']);
  assert.deepEqual(data.review.statuses, ['supported', 'concern', 'not observable']);
  assert.equal(data.review.boundaryScenarios.length, 2);
  for (const sequence of data.dialogues) {
    assert.ok(sequence.evidenceOrigin.length > 40);
    assert.ok(sequence.turns.length >= 3);
    assert.ok(sequence.turns.some(turn => turn.misconception?.length > 20));
    for (const turn of sequence.turns) {
      assert.ok(turn.learnerText.length > 100, turn.id);
      assert.ok(turn.evidenceOrigin.length > 30, turn.id);
      assert.ok(turn.referenceFamilies.length > 0, turn.id);
      assert.ok(turn.expected.required.length > 0 && turn.expected.mustNot.length > 0, turn.id);
      assert.ok(turn.expected.criteria.includes('learner-ownership'), turn.id);
      assert.ok(turn.expected.criteria.includes('honest-origin'), turn.id);
      assert.ok(turn.expected.criteria.includes('useful-step'), turn.id);
      assert.ok(turn.expected.criteria.every(id => Object.hasOwn(data.review.criteria, id)), turn.id);
    }
  }
});

test('fraud synthetic oracle derives positive-label TP/FN and compatible error trade-offs from actual-class rows', () => {
  const turns = dialogue('fraud').turns;
  const expected = [[2, 3, 1, 94, 0.4], [4, 1, 6, 89, 0.8], [3, 2, 3, 92, 0.6]];
  const overall = [[96, 100, 0.96], [93, 100, 0.93], [95, 100, 0.95]];
  const models = turns.flatMap(turn => turn.oracle?.models || []);
  assert.equal(models.length, 3);
  let index = 0;
  for (const turn of turns.filter(turn => turn.oracle)) {
    const oracle = turn.oracle, positive = oracle.labels.indexOf(oracle.positiveLabel);
    assert.equal(oracle.orientation, 'rows-actual-columns-predicted');
    assert.equal(positive, 0, 'fraud deliberately precedes the other class');
    for (const model of oracle.models) {
      const tp = model.matrix[positive][positive];
      const fn = model.matrix[positive].reduce((sum, value, column) => sum + (column === positive ? 0 : value), 0);
      const fp = model.matrix.reduce((sum, row, actual) => sum + (actual === positive ? 0 : row[positive]), 0);
      const tn = model.matrix[1][1];
      assert.deepEqual([tp, fn, fp, tn, tp / (tp + fn)], expected[index]);
      assert.deepEqual([model.tp, model.fn, model.fp, model.tn, model.sensitivity], [tp, fn, fp, tn, tp / (tp + fn)]);
      assert.deepEqual(model.matrix.map(row => row.reduce((sum, value) => sum + value, 0)), [5, 95]);
      const correct = model.matrix.reduce((sum, row, actual) => sum + row[actual], 0);
      const total = model.matrix.flat().reduce((sum, value) => sum + value, 0);
      assert.deepEqual([correct, total, correct / total], overall[index++]);
      assert.deepEqual([model.correct, model.total, model.accuracy], [correct, total, correct / total]);
    }
  }
});

test('XOR synthetic oracle derives thresholded labels and wrong cases in truth-table order', () => {
  const first = dialogue('xor').turns[0].oracle, last = dialogue('xor').turns[2].oracle;
  assert.deepEqual(first.inputs, [[0, 0], [0, 1], [1, 0], [1, 1]]);
  assert.deepEqual(last.inputs, first.inputs);
  for (const [oracle, expectedLabels, wrongIndices] of [[first, [0, 1, 1, 1], [3]], [last, [0, 1, 1, 0], []]]) {
    assert.deepEqual(oracle.targets, [0, 1, 1, 0]);
    assert.equal(oracle.threshold, 0.5);
    const labels = oracle.scores.map(score => score >= oracle.threshold ? 1 : 0);
    assert.deepEqual(labels, expectedLabels);
    assert.deepEqual(oracle.labels, expectedLabels);
    assert.deepEqual(labels.flatMap((label, index) => label === oracle.targets[index] ? [] : [index]), wrongIndices);
    assert.deepEqual(oracle.wrongIndices, wrongIndices);
  }
});

for (const sequence of data.dialogues) {
  test(`${sequence.id}: successive literal learner turns retain whole eligible pairs without oracle or execution authority`, async t => {
    const f = fixture(); t.after(() => f.coordinator.dispose());
    const expectedHistory = [];
    for (const turn of sequence.turns) {
      const capture = await f.submit(turn.learnerText), { request, snapshot } = capture;
      assert.deepEqual(request.messages.at(-1), { role: 'user', content: turn.learnerText });
      assert.deepEqual(request.messages.slice(1, 1 + expectedHistory.length), expectedHistory,
        `${turn.id}: prior reasoning and supplied evidence must remain complete and ordered`);
      assert.deepEqual(snapshot.history.pairs.flatMap(pair => [
        { role: 'user', content: pair.learnerText }, { role: 'assistant', content: pair.assistantText },
      ]), expectedHistory);
      assert.deepEqual(snapshot.history.omissions, []);
      assert.ok(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.request.messages));
      assert.equal(snapshot.learning.policyVersion, 'kafe-guided-5');
      assert.ok(snapshot.sources.every(source => source.uri === null));
      assert.equal(snapshot.sources.some(source => ['run-result', 'action-evidence'].includes(source.id)), false);
      assert.deepEqual(snapshot.dependencies, { fileUris: [], knowledgeLineage: null });
      assert.equal(await f.router.route({ name: 'getLatestRunResult', arguments: {} }, { snapshot }), null);
      const ordinaryUsers = request.messages.filter(message => message.role === 'user' && !message.content.startsWith('[Source '));
      assert.deepEqual(ordinaryUsers.map(message => message.content), [...expectedHistory.filter(message => message.role === 'user').map(message => message.content), turn.learnerText]);
      const serialized = JSON.stringify(request);
      assert.doesNotMatch(serialized, /"oracle"|"referenceFamilies"|"requiredCriteria"|"boundaryScenarios"/);
      for (const criterion of turn.expected.required) assert.equal(serialized.includes(criterion), false, 'offline answer rubric must not enter provider content');
      assert.equal(request.messages.some(message => message.role === 'tool'), false);
      const assistant = f.coordinator.snapshot().entries.filter(entry => entry.kind === 'assistant').at(-1);
      expectedHistory.push({ role: 'user', content: turn.learnerText }, { role: 'assistant', content: assistant.text });
    }
    assert.equal(f.captured.length, sequence.turns.length);
    assert.equal(f.reads.length, 0);
    assert.equal(f.coordinator.snapshot().entries.some(entry => ['run', 'proposal', 'checkpoint'].includes(entry.kind)), false);
    assert.deepEqual(f.coordinator.session.runTargetUris(), []);
    const before = structuredClone(f.captured[0].snapshot.request);
    f.coordinator.session.setDraft('Later unsent draft');
    assert.deepEqual(f.captured[0].snapshot.request, before, 'later mutations cannot change the captured request');
  });
}

test('activity follow-up admits only the eight latest whole eligible pairs through the real coordinator', async t => {
  const f = fixture(); t.after(() => f.coordinator.dispose());
  for (let index = 0; index < 9; index++) f.coordinator.session.recordCompletedPair({ id: `prior-${index}`,
    learnerText: `Pregunta previa ${index}`, assistantText: `Respuesta previa ${index}`,
    dependencies: { fileUris: [], knowledgeLineage: null } });
  const { request, snapshot } = await f.submit(dialogue('xor').turns[0].learnerText);
  assert.deepEqual(snapshot.history.pairs.map(pair => pair.id), ['prior-1', 'prior-2', 'prior-3', 'prior-4', 'prior-5', 'prior-6', 'prior-7', 'prior-8']);
  assert.deepEqual(snapshot.history.omissions, [{ id: 'prior-0', reason: 'pair-limit' }]);
  assert.deepEqual(request.messages.slice(1, 3), [{ role: 'user', content: 'Pregunta previa 1' }, { role: 'assistant', content: 'Respuesta previa 1' }]);
  assert.deepEqual(request.messages.slice(15, 17), [{ role: 'user', content: 'Pregunta previa 8' }, { role: 'assistant', content: 'Respuesta previa 8' }]);
  assert.doesNotMatch(JSON.stringify(request), /Pregunta previa 0|Respuesta previa 0/);
});

test('New removes activity evidence and invalidates its old captured submission', async t => {
  const f = fixture(); t.after(() => f.coordinator.dispose());
  const original = await f.submit(dialogue('fraud').turns[0].learnerText);
  f.coordinator.newConversation();
  assert.equal(f.coordinator.isSubmissionAuthorized(original.snapshot), false);
  const next = await f.submit(dialogue('xor').turns[0].learnerText);
  assert.deepEqual(next.snapshot.history.pairs, []);
  assert.doesNotMatch(JSON.stringify(next.request), /clasificador base|\[\[2, 3\], \[1, 94\]\]/);
  assert.deepEqual(f.coordinator.session.runTargetUris(), []);
});

for (const boundary of ['source', 'knowledge']) {
  test(`${boundary} revocation removes dependent activity history before a follow-up`, async t => {
    const f = fixture(); t.after(() => f.coordinator.dispose());
    const file = { scheme: 'file', toString: () => 'file:///activity/private.kf' };
    const metadata = { sourceMode: 'managed', runtimeVersion: '1', knowledgePackVersion: '1', packIdentity: 'activity-pack', expectedContentSha256: 'a'.repeat(64) };
    if (boundary === 'source') f.setContext({ activeDocument: { uri: file, text: 'PRIVATE_ACTIVITY_SOURCE', version: 1 } });
    else f.setAvailability({ status: 'ready', metadata });
    const original = await f.submit(dialogue('fraud').turns[0].learnerText);
    assert.equal(original.snapshot.history.pairs.length, 0);
    const stored = f.coordinator.session.historyPairs()[0];
    if (boundary === 'source') assert.deepEqual(stored.dependencies.fileUris, [file.toString()]);
    else assert.equal(stored.dependencies.knowledgeLineage, metadataLineage(metadata));
    f.setContext({}); f.setAvailability({ status: 'unavailable', code: 'knowledge_unavailable' });
    const next = await f.submit(dialogue('fraud').turns[2].learnerText);
    assert.equal(await f.coordinator.validateSubmission(original.snapshot), false);
    assert.deepEqual(next.snapshot.history.pairs, []);
    assert.deepEqual(next.snapshot.history.omissions, [{ id: stored.id, reason: boundary === 'source' ? 'source-revoked' : 'knowledge-lineage-changed' }]);
    assert.equal(JSON.stringify(next.request).includes(dialogue('fraud').turns[0].learnerText), false);
    assert.doesNotMatch(JSON.stringify(next.request), /PRIVATE_ACTIVITY_SOURCE/);
    assert.equal(next.snapshot.sources.some(source => source.uri !== null || source.id === 'run-result'), false);
    assert.deepEqual(f.coordinator.session.runTargetUris(), []);
  });
}
