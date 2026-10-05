const test = require('node:test');
const assert = require('node:assert/strict');
const { ToolRouter, TOOL_DEFINITIONS } = require('../../src/tutor/ToolRouter');
const { LearningSession } = require('../../src/tutor/LearningSession');
const { sha256 } = require('../../src/tutor/RequestSnapshot');
const value = (patch = {}) => ({ kind: 'design', name: 'Loop choice', learnerProposalSummary: 'A loop', tutorProposedAdditions: [], scopeSummary: 'Display items', tradeoffs: [], unresolvedChoices: [], sourceIds: [], ...patch });
const source = { id: 'active-file', category: 'active-file', uri: 'file:///a.kf', version: 1, text: 'show(1)', contentSha256: sha256('show(1)'), provenance: {} };
const router = new ToolRouter({ knowledgeRetriever: { search: async () => [] } });
const context = (patch = {}) => ({ snapshot: { sources: [source], submission: { context: { restricted: false } }, learning: { decisions: [] }, dependencies: { fileUris: [source.uri], knowledgeLineage: null }, ...patch } });
const route = (args, ctx = context()) => router.route({ name: 'proposeLearningCheckpoint', arguments: args }, ctx);

test('checkpoint tool validates, normalizes optional prior IDs and cannot confer authority', async () => {
  const result = await route(value({ sourceIds: ['active-file'] }));
  assert.deepEqual(result, { ...value({ sourceIds: ['active-file'] }), priorDecisionIds: [] });
  assert.equal(Object.hasOwn(result, 'confirmed'), false);
  assert.equal(Object.hasOwn(result, 'grant'), false);
  const schema = TOOL_DEFINITIONS.find(t => t.function.name === 'proposeLearningCheckpoint')?.function.parameters;
  assert.ok(schema); assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.name.maxLength, 120);
});
test('checkpoint tool rejects malformed fields, forged references, counts, characters and aggregate bytes', async () => {
  await route(value());
  for (const args of ['{', value({ confirmed: true }), value({ grant: 'forged' }), value({ understanding: 'mastered' }), value({ name: 'x'.repeat(121) }), value({ sourceIds: ['secret'] }), value({ priorDecisionIds: ['forged'] }), value({ tradeoffs: Array(9).fill('x') }), value({ tutorProposedAdditions: ['x'.repeat(501)] }), value({ learnerProposalSummary: 'x'.repeat(2001) }), value({ tradeoffs: Array(8).fill('😀'.repeat(500)), tutorProposedAdditions: Array(8).fill('😀'.repeat(500)) })]) {
    await assert.rejects(() => route(args));
  }
});
test('Restricted Mode permits message-only design but rejects implementation and source claims', async () => {
  const ctx = context({ sources: [], submission: { context: { restricted: true } }, dependencies: { fileUris: [], knowledgeLineage: null } });
  assert.equal((await route(value(), ctx)).kind, 'design');
  await assert.rejects(() => route(value({ kind: 'implementation' }), ctx));
  await assert.rejects(() => route(value({ sourceIds: ['active-file'] }), ctx));
});
test('Restricted checkpoint explicitly admits retrieved knowledge while rejecting files and unadmitted IDs', async () => {
  const ctx = context({ sources: [], submission: { context: { restricted: true } }, dependencies: { fileUris: [], knowledgeLineage: 'pack' } });
  ctx.retrievedSourceIds = ['knowledge:loops'];
  assert.deepEqual((await route(value({ sourceIds: ['knowledge:loops'] }), ctx)).sourceIds, ['knowledge:loops']);
  await assert.rejects(() => route(value({ sourceIds: ['knowledge:forged'] }), ctx));
  const withFile = { ...ctx, snapshot: { ...ctx.snapshot, sources: [source] } };
  await assert.rejects(() => route(value({ sourceIds: ['active-file'] }), withFile));
  await assert.rejects(() => route(value({ kind: 'implementation', sourceIds: ['knowledge:loops'] }), ctx));
});
test('checkpoint uses Unicode code points and implementation requires an eligible target', async () => {
  assert.equal((await route(value({ name: '😀'.repeat(120) }))).name, '😀'.repeat(120));
  await assert.rejects(() => route(value({ name: '😀'.repeat(121) })));
  await assert.rejects(() => route(value({ priorDecisionIds: null })));
  await assert.rejects(() => route(value({ sourceIds: Array(9).fill('active-file') })));
  await assert.rejects(() => route(value({ kind: 'implementation' }), context({ sources: [] })));
});
test('only admitted prior decisions can be referenced and dependencies are inherited by host', async () => {
  const learning = new LearningSession();
  const prior = learning.addDecision({ ...value(), priorDecisionIds: [] }, { files: [{ uri: source.uri, version: 1, contentSha256: source.contentSha256 }], knowledgeLineage: 'pack' });
  const ctx = context({ learning: { decisions: [prior] } });
  const result = await route(value({ priorDecisionIds: [prior.id] }), ctx);
  const next = learning.addDecision(result, { files: [], knowledgeLineage: null });
  assert.deepEqual(next.dependencies, prior.dependencies);
  assert.equal(next.summaryAttribution, 'tutor-unconfirmed');
  await assert.rejects(() => route(value({ priorDecisionIds: [prior.id] }), context()));
});
test('checkpoint closure retains all current, history and admitted-learning dependencies without model narrowing', async () => {
  const { checkpointDependencies } = require('../../src/tutor/LearningCheckpoint');
  assert.equal(typeof checkpointDependencies, 'function');
  const other = { uri: 'file:///b.kf', version: 4, contentSha256: sha256('show(2)') };
  const ctx = context({ sources: [source, { ...source, id: 'selected:b', text: 'show(2)', ...other }],
    history: { dependencies: { fileUris: [other.uri], knowledgeLineage: 'pack' } },
    learning: { decisions: [{ id: 'host-prior', dependencies: { files: [other], knowledgeLineage: 'pack' } }], observations: [] },
    dependencies: { fileUris: [source.uri, other.uri], knowledgeLineage: 'pack' } });
  const proposed = await route(value({ sourceIds: ['active-file'] }), ctx);
  assert.deepEqual(proposed.sourceIds, ['active-file']);
  assert.deepEqual(checkpointDependencies(ctx.snapshot).files, [{ uri: source.uri, version: 1, contentSha256: source.contentSha256 }, other]);
  assert.equal(checkpointDependencies(ctx.snapshot).knowledgeLineage, 'pack');
  assert.throws(() => checkpointDependencies({ ...ctx.snapshot, dependencies: { fileUris: ['file:///unknown.kf'], knowledgeLineage: 'pack' } }), /identity/i);
});
