const assert = require('node:assert/strict');
const test = require('node:test');
const { createHash } = require('node:crypto');
const api = () => require('../../src/tutor/RequestSnapshot');
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
function reviewInputs() {
  return { sessionId: 'session', generation: 1, submission: { submissionId: 'submission', text: 'Help', inputRevision: 2, context: { revision: 1, activeSource: null, sources: [], restricted: false } }, runSequence: 4,
    selectedSourceIds: ['active-file'], sources: [{ id: 'active-file', uri: 'file:///work/main.kf', version: 1, text: 'reviewed buffer', contentSha256: sha('reviewed buffer'), category: 'active-file', provenance: { uri: 'file:///work/main.kf' } }],
    history: { pairs: [], omissions: [], byteLength: 0, dependencies: { fileUris: [], knowledgeLineage: null } },
    dependencies: { fileUris: ['file:///work/main.kf'], knowledgeLineage: 'pack-v1' },
    request: { messages: [{ role: 'user', content: 'Help' }], tools: [], model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true } };
}

test('source identity projection validates captured bytes and rejects unknown file versions', () => {
  const { sourceIdentities } = api();
  assert.equal(typeof sourceIdentities, 'function');
  const input = reviewInputs();
  assert.deepEqual(sourceIdentities(input), [{ uri: 'file:///work/main.kf', version: 1, contentSha256: sha('reviewed buffer') }]);
  input.sources[0].text = 'tampered'; assert.throws(() => sourceIdentities(input), /snapshot/i);
  input.sources[0].text = 'reviewed buffer'; input.sources[0].version = null;
  assert.throws(() => sourceIdentities(input), /identity/i);
});

test('request snapshot freezes teaching preferences and includes their revision in freshness', () => {
  const { createRequestSnapshot, isSnapshotCurrent } = api();
  const input = { ...reviewInputs(), learning: { policyVersion: 'kafe-guided-1', revision: 1, preferences: { mode: 'guided' }, decisions: [], observations: [], dependencies: { fileUris: [], knowledgeLineage: null } } };
  const captured = createRequestSnapshot(input);
  input.learning.preferences.mode = 'paused';
  assert.equal(captured.learning?.preferences.mode, 'guided');
  assert.ok(Object.isFrozen(captured.learning.preferences));
  assert.equal(isSnapshotCurrent(captured, input), false);
});

test('review deeply copies and freezes exact source and initial provider request data', () => {
  const { createRequestSnapshot } = api();
  const input = reviewInputs(), review = createRequestSnapshot(input);
  input.sources[0].text = 'later live bytes'; input.request.messages[0].content = 'changed';
  assert.equal(review.sources[0].text, 'reviewed buffer');
  assert.equal(review.request.messages[0].content, 'Help');
  assert.ok(Object.isFrozen(review.sources[0].provenance));
  assert.ok(Object.isFrozen(review.request.messages));
});

test('freshness fingerprints each relevant input, request parameter, history authorization and source bytes', () => {
  const { createRequestSnapshot, isSnapshotCurrent } = api();
  const input = reviewInputs(), review = createRequestSnapshot(input);
  assert.equal(isSnapshotCurrent(review, { ...input, revision: 999, entries: [{ text: 'stream delta' }] }), true);
  const changes = [value => value.submission.text = 'New', value => value.submission.inputRevision++, value => value.submission.context.restricted = true,
    value => value.sources[0].version++, value => value.sources[0].text = 'changed bytes', value => value.sources[0].contentSha256 = sha('other'),
    value => value.submission.context.revision++, value => value.runSequence++, value => value.dependencies.knowledgeLineage = 'pack-v2',
    value => value.generation++, value => value.request.model = 'different', value => value.request.thinking.type = 'enabled',
    value => value.history.pairs.push({ id: 'p', learnerText: 'Q', assistantText: 'A', dependencies: { fileUris: ['file:///revoked.kf'], knowledgeLineage: null } }),
    value => value.dependencies.fileUris = []];
  for (const change of changes) { const current = structuredClone(input); change(current); assert.equal(isSnapshotCurrent(review, current), false); }
});

test('reviews reject credentials, generated tool envelopes and dishonest source hashes', () => {
  const { createRequestSnapshot } = api();
  const input = reviewInputs();
  assert.throws(() => createRequestSnapshot({ ...input, request: { ...input.request, headers: { Authorization: 'secret' } } }), /request/i);
  assert.throws(() => createRequestSnapshot({ ...input, request: { ...input.request, messages: [{ role: 'tool', content: 'generated' }] } }), /initial/i);
  assert.throws(() => createRequestSnapshot({ ...input, sources: [{ ...input.sources[0], contentSha256: sha('wrong') }] }), /snapshot/i);
});

test('review rejects run snapshot bytes above the existing output limit', () => {
  const { createRequestSnapshot } = api();
  const text = JSON.stringify({ stdout: 'x'.repeat(1024 * 1024 + 1), stderr: '' });
  const input = reviewInputs();
  assert.throws(() => createRequestSnapshot({ ...input, sources: [{ id: 'run-result', category: 'run-result', uri: null, version: null, text, contentSha256: sha(text), provenance: { sourceUri: 'file:///work/main.kf', runSequence: 4 } }] }), /size/i);
});
