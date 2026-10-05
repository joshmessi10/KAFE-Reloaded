const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
function session() {
  const filename = path.join(__dirname, '../../src/tutor/LearningSession.js');
  assert.ok(fs.existsSync(filename), 'bounded learning-state owner exists');
  return new (require(filename).LearningSession)();
}
const file = { uri: 'file:///work/main.kf', version: 1, contentSha256: 'a'.repeat(64) };
const deps = { files: [file], knowledgeLineage: 'pack-1' };
const empty = { files: [], knowledgeLineage: null };
const checkpoint = (overrides = {}) => ({ kind: 'design', name: 'Storage', learnerProposalSummary: 'Use a list',
  tutorProposedAdditions: [], scopeSummary: 'Represent entries', tradeoffs: [], unresolvedChoices: [], sourceIds: [], priorDecisionIds: [], ...overrides });

test('confirmation budget tokens are inert, privately owned and cleared by reset', () => {
  const s = session(), decision = s.addDecision(checkpoint(), empty), before = s.snapshot();
  assert.equal(s.releaseConfirmation(undefined), false);
  const token = s.reserveConfirmation(decision.id); assert.deepEqual(s.snapshot(), before);
  assert.equal(s.releaseConfirmation({}), false); assert.throws(() => s.reserveConfirmation(decision.id), /reserved/);
  assert.equal(s.releaseConfirmation(token), true); assert.equal(s.releaseConfirmation(token), false);
  const prior = s.reserveConfirmation(decision.id); s.reset();
  const next = s.addDecision(checkpoint(), empty), current = s.reserveConfirmation(next.id);
  assert.equal(s.releaseConfirmation(prior), false); assert.throws(() => s.reserveConfirmation(next.id), /reserved/);
  assert.equal(s.releaseConfirmation(current), true); assert.equal(s.confirmDecision(next.id).disposition, 'confirmed');
  const adopted = s.snapshot(), adoptedToken = s.reserveConfirmation(next.id);
  assert.deepEqual(s.snapshot(), adopted); assert.deepEqual(s.confirmDecision(next.id), adopted.decisions[0]);
  assert.equal(s.releaseConfirmation(adoptedToken), true);
});

const concept = text => ({ kind: 'concept', text, attribution: 'tutor', uncertainty: '', status: 'observed', priorDecisionIds: [] });
const utf8Fill = count => '界'.repeat(Math.floor(count / 3)) + 'x'.repeat(count % 3);
for (const mutation of ['observation', 'decision', 'preferences']) test(`reserved confirmation includes the prospective revision after ${mutation} admission`, () => {
  const s = session(), decision = s.addDecision(checkpoint(), empty);
  for (let i = 0; i < 6; i++) s.addObservation(concept('x'.repeat(8000)), empty);
  if (mutation === 'preferences') {
    const overhead = 1 + Buffer.byteLength(JSON.stringify({ id: 'x'.repeat(36), revision: 8, ...concept(''), dependencies: empty }));
    s.addObservation(concept(utf8Fill(65535 - s.snapshot().byteLength - overhead)), empty);
  } else s.addObservation(concept('small'), empty);
  assert.equal(s.snapshot().revision, 8);
  const token = s.reserveConfirmation(decision.id), before = s.snapshot();
  if (mutation === 'preferences') {
    assert.throws(() => s.setPreferences({ mode: 'paused' }), /reserved.*limit/i);
    assert.deepEqual(s.snapshot(), before);
    assert.equal(s.setPreferences({ mode: 'paused' }, { busy: true }).status, 'queued', 'queued preferences do not advance the adoption revision');
  } else {
    const candidate = mutation === 'observation' ? { id: 'x'.repeat(36), revision: 9, ...concept(''), dependencies: empty } :
      { id: 'x'.repeat(36), revision: 9, disposition: 'proposed', summaryAttribution: 'tutor-unconfirmed', checkpoint: checkpoint({ learnerProposalSummary: '界'.repeat(2000), scopeSummary: '界'.repeat(2000), tutorProposedAdditions: ['a', 'a', 'a'] }), dependencies: empty };
    const room = 65535 - before.byteLength - 1 - Buffer.byteLength(JSON.stringify(candidate));
    const admit = count => {
      if (mutation === 'observation') return s.addObservation(concept(utf8Fill(count)), empty);
      const value = structuredClone(candidate.checkpoint);
      let remaining = count;
      value.tutorProposedAdditions = value.tutorProposedAdditions.map(() => { const added = Math.min(1499, remaining); remaining -= added; return utf8Fill(1 + added); });
      assert.equal(remaining, 0, 'all filler fits bounded fields');
      return s.addDecision(value, empty);
    };
    assert.throws(() => admit(room), /reserved.*limit/i);
    assert.deepEqual(s.snapshot(), before);
    admit(room - 1);
    assert.equal(s.snapshot().revision, 9);
    assert.equal(s.snapshot().byteLength, 65534);
  }
  assert.equal(s.confirmDecision(decision.id).disposition, 'confirmed');
  assert.equal(s.snapshot().byteLength, 65536);
  assert.equal(s.releaseConfirmation(token), true);
});

test('prepared decision is inert, owned, revision-bound and committed only once', () => {
  const s = session(), before = s.snapshot();
  assert.equal(typeof s.prepareDecision, 'function');
  const prepared = s.prepareDecision(checkpoint(), deps);
  assert.deepEqual(s.snapshot(), before);
  assert.throws(() => s.commitDecision(structuredClone(prepared)), /prepared/i);
  const record = s.commitDecision(prepared); assert.equal(record.id, prepared.id);
  assert.throws(() => s.commitDecision(prepared), /prepared/i);
  const late = s.prepareDecision(checkpoint(), empty); s.setPreferences({ mode: 'paused' });
  assert.throws(() => s.commitDecision(late), /prepared/i);
  assert.equal(s.snapshot().decisions.length, 1);
});

test('defaults preserve unknown familiarity and queue validated preferences until settlement', () => {
  const s = session();
  assert.deepEqual(s.snapshot().preferences, { mode: 'guided', frequency: 'normal', reasoningStyle: 'open-ended', codingPreference: 'ai', familiarity: 'unknown' });
  const before = s.snapshot();
  assert.equal(s.setPreferences({ mode: 'paused' }, { busy: true }).status, 'queued');
  s.setPreferences({ frequency: 'light' }, { busy: true });
  assert.deepEqual(s.snapshot(), before);
  assert.throws(() => s.setPreferences({ familiarity: 'mastered' }, { busy: true }), /preference/i);
  assert.equal(s.settlePreferences().status, 'updated');
  assert.equal(s.snapshot().preferences.mode, 'paused');
  assert.equal(s.snapshot().preferences.frequency, 'light');
  assert.equal(s.snapshot().revision, before.revision + 1);
});

test('decisions retain dependency closure after history omission and cannot revive revoked or changed grounding', () => {
  const s = session();
  const parent = s.addDecision(checkpoint(), deps);
  s.confirmDecision(parent.id);
  const child = s.addDecision(checkpoint({ name: 'Consumer', priorDecisionIds: [parent.id] }), empty);
  s.confirmDecision(child.id);
  assert.deepEqual(s.snapshot().decisions[1].dependencies, deps);
  const options = { authorizedFiles: [file], knowledgeLineage: 'pack-1' };
  assert.equal(s.selectContext(options).decisions.length, 2);
  assert.equal(s.selectContext({ ...options, authorizedFiles: [] }).decisions.length, 0);
  assert.equal(s.selectContext({ ...options, authorizedFiles: [{ ...file, version: 2 }] }).decisions.length, 0);
  assert.equal(s.selectContext({ ...options, knowledgeLineage: 'pack-2' }).decisions.length, 0);
  assert.equal(s.snapshot().decisions[0].disposition, 'confirmed');
  assert.throws(() => s.addDecision(checkpoint({ priorDecisionIds: ['forged'] }), empty), /decision/i);
  assert.throws(() => s.addDecision(checkpoint({ priorDecisionIds: [parent.id] }), { ...empty, knowledgeLineage: 'other' }), /lineage/i);
});

test('observations distinguish tutor summaries, learner reasoning and verified or proposed relationships', () => {
  const s = session();
  s.addObservation({ kind: 'concept', text: 'Explained iteration', attribution: 'tutor', uncertainty: 'Understanding unknown', status: 'observed', priorDecisionIds: [] }, empty);
  s.addObservation({ kind: 'reasoning', text: 'Learner used pseudocode', attribution: 'learner', uncertainty: 'Self report', status: 'observed', priorDecisionIds: [] }, empty);
  s.addObservation({ kind: 'relationship', text: 'A calls B', attribution: 'host', uncertainty: '', status: 'verified', priorDecisionIds: [] }, deps);
  s.addObservation({ kind: 'relationship', text: 'Possible A to C link', attribution: 'tutor', uncertainty: 'Proposal', status: 'proposed', priorDecisionIds: [] }, empty);
  const context = s.selectContext({ authorizedFiles: [], knowledgeLineage: null });
  assert.deepEqual(context.observations.map(o => o.status), ['observed', 'observed', 'proposed']);
  assert.throws(() => s.addObservation({ kind: 'relationship', text: 'Invented', attribution: 'host', uncertainty: '', status: 'verified', priorDecisionIds: [] }, empty), /verified/i);
  assert.throws(() => s.addObservation({ kind: 'concept', text: 'Understood', attribution: 'tutor', uncertainty: '', status: 'mastered', priorDecisionIds: [] }, empty), /observation/i);
});

test('checkpoint exact fields, character limits, list limits and aggregate UTF-8 budgets reject atomically', () => {
  const s = session();
  const invalid = [ { name: 'a'.repeat(121) }, { scopeSummary: 'a'.repeat(2001) }, { tutorProposedAdditions: Array(9).fill('x') },
    { tradeoffs: ['x'.repeat(501)] }, { sourceIds: Array(9).fill('id') }, { grant: true },
    { learnerProposalSummary: '界'.repeat(2000), scopeSummary: '界'.repeat(2000), tutorProposedAdditions: Array(8).fill('界'.repeat(500)) } ];
  for (const value of invalid) assert.throws(() => s.addDecision(checkpoint(value), empty), /checkpoint|limit|size/i);
  assert.equal(s.snapshot().decisions.length, 0);
  for (let i = 0; i < 32; i++) s.addDecision(checkpoint({ name: `Decision ${i}` }), empty);
  assert.throws(() => s.addDecision(checkpoint(), empty), /limit/i);
  assert.equal(s.snapshot().decisions.length, 32);
});

test('observation count and total state bytes reject without eviction; reset clears queues and records', () => {
  const s = session();
  const observation = text => ({ kind: 'concept', text, attribution: 'tutor', uncertainty: 'Unknown', status: 'observed', priorDecisionIds: [] });
  for (let i = 0; i < 32; i++) s.addObservation(observation('Concept'), empty);
  assert.throws(() => s.addObservation(observation('Extra'), empty), /limit/i);
  s.reset();
  let accepted = 0;
  while (true) {
    try { s.addObservation(observation('界'.repeat(1800)), empty); accepted++; }
    catch (error) { assert.match(error.message, /limit|size/i); break; }
  }
  assert.ok(accepted > 0 && accepted < 32);
  assert.ok(s.snapshot().byteLength <= 65536);
  const before = s.snapshot();
  assert.throws(() => s.addObservation(observation('界'.repeat(1800)), empty), /limit|size/i);
  assert.deepEqual(s.snapshot(), before);
  s.setPreferences({ mode: 'paused' }, { busy: true }); s.reset(); s.settlePreferences();
  assert.equal(s.snapshot().preferences.mode, 'guided');
  assert.deepEqual(s.snapshot().decisions, []);
  assert.deepEqual(s.snapshot().observations, []);
});

test('non-ASCII observation byte boundary includes UTF-8 bytes and returns detached frozen context', () => {
  const s = session();
  assert.throws(() => s.addObservation({ kind: 'concept', text: '界'.repeat(6000), attribution: 'tutor', uncertainty: '', status: 'observed', priorDecisionIds: [] }, empty), /size|limit/i);
  s.addDecision(checkpoint(), empty);
  const context = s.selectContext({ authorizedFiles: [], knowledgeLineage: null });
  assert.ok(Object.isFrozen(context.preferences));
  assert.ok(Object.isFrozen(context.decisions[0]));
  const projection = s.snapshot(); projection.decisions[0].checkpoint.name = 'Changed';
  assert.equal(s.snapshot().decisions[0].checkpoint.name, 'Storage');
});

test('queued preferences reserve total byte budget before later records can consume it', () => {
  const s = session();
  const value = text => ({ kind: 'concept', text, attribution: 'tutor', uncertainty: '', status: 'observed', priorDecisionIds: [] });
  for (let i = 0; i < 7; i++) s.addObservation(value('x'.repeat(8000)), empty);
  s.setPreferences({ familiarity: 'intermediate' }, { busy: true });
  const used = s.snapshot().byteLength;
  // One observation has 1 byte comma + 36-byte UUID + the JSON field overhead (revision=8).
  const record = { id: 'x'.repeat(36), revision: 8, ...value(''), dependencies: empty };
  const overhead = 1 + Buffer.byteLength(JSON.stringify(record));
  const fill = 'x'.repeat(65536 - used - overhead);
  assert.throws(() => s.addObservation(value(fill), empty), /limit|size/i);
  assert.equal(s.settlePreferences().status, 'updated');
  assert.equal(s.snapshot().preferences.familiarity, 'intermediate');
});

for (const kind of ['decision', 'observation']) test(`${kind} rejects more than 64 inherited files atomically and existing context remains composable`, async () => {
  const { ContextComposer } = require('../../src/tutor/ContextComposer');
  const { sha256 } = require('../../src/tutor/RequestSnapshot');
  const s = session();
  const files = Array.from({ length: 80 }, (_, index) => ({ uri: `file:///work/source-${index}.kf`, version: 1, contentSha256: sha256('source') }));
  const first = s.addDecision(checkpoint({ name: 'First parent' }), { files: files.slice(0, 40), knowledgeLineage: null });
  const second = s.addDecision(checkpoint({ name: 'Second parent' }), { files: files.slice(40), knowledgeLineage: null });
  const priorDecisionIds = [first.id, second.id], before = s.snapshot();
  assert.throws(() => kind === 'decision' ? s.addDecision(checkpoint({ priorDecisionIds }), empty) :
    s.addObservation({ kind: 'reasoning', text: 'Joined parent reasoning', attribution: 'learner', uncertainty: 'Unknown', status: 'observed', priorDecisionIds }, empty), /dependencies/i);
  assert.deepEqual(s.snapshot(), before, 'failed admission preserves all records, byte count and teaching revision');
  const context = s.selectContext({ authorizedFiles: files, knowledgeLineage: null });
  assert.deepEqual(context.decisions.map(record => record.id), [first.id, second.id]);
  assert.equal(context.sourceDependencies.files.length, 80, 'aggregate context preserves every parent dependency without truncation');
  const candidateUris = files.map(file => ({ scheme: 'file', path: file.uri.slice(7), toString() { return file.uri; } }));
  const { selectedSourceId } = require('../../src/tutor/ToolRouter');
  const composer = new ContextComposer({ documentReader: { validateUri: async () => true, readDocument: async uri => ({ uri, version: 1, text: 'source' }) }, knowledgeRetriever: {} });
  const composition = await composer.compose({ request: 'Explain the parents', candidateUris, includedSourceIds: candidateUris.map(selectedSourceId), learningSession: s });
  assert.equal(composition.learning.decisions.length, 2);
  assert.equal(composition.dependencies.fileUris.length, 80);
  const { createRequestSnapshot } = require('../../src/tutor/RequestSnapshot');
  const captured = createRequestSnapshot({ sessionId: 'session', generation: 1, runSequence: 0,
    submission: { submissionId: 'submission', text: 'Explain the parents', inputRevision: 0,
      context: { revision: 0, restricted: false, activeSource: null, sources: [] } },
    sources: composition.snapshots, history: composition.history, learning: composition.learning,
    dependencies: composition.dependencies, request: composition.payload });
  assert.equal(captured.learning.sourceDependencies.files.length, 80);
  assert.ok(Object.isFrozen(captured.learning.sourceDependencies.files));
});
