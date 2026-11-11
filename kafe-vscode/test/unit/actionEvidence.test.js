const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
let api = {}; try { api = require('../../src/tutor/ActionEvidence'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
const hash = text => createHash('sha256').update(text).digest('hex');
const uri = 'file:///workspace/main.kf', other = 'file:///workspace/helper.kf';
const file = (text = 'old', version = 1, source = uri) => ({ uri: source, version, contentSha256: hash(text) });
const proposal = () => ({ id: 'native', sourceId: uri, documentVersion: 1, contentSha256: hash('old'), newText: 'new',
  preparation: { grantId: 'private-host-grant', scopeSummary: 'PRIVATE_SCOPE', dependencies: { files: [file(), file('helper', 1, other)], knowledgeLineage: 'pack' } } });
const run = (extra = {}) => ({ sourceUri: uri, runSequence: 1, stdout: 'PRIVATE_OUTPUT', stderr: '', exitCode: 0, outputTruncated: false,
  runtimeVersion: '1', knowledgePackVersion: '1', knowledgeLineage: 'pack', sourceIdentity: { launch: hash('old'), completion: hash('old') }, ...extra });
const selected = (ledger, files = [file(), file('helper', 1, other)], lineage = 'pack') => ledger.selectContext({ authorizedFiles: files, knowledgeLineage: lineage });

test('native staging and Apply facts remain distinct; failed Apply cannot certify proposed bytes', () => {
  assert.equal(typeof api.ActionEvidence, 'function');
  const ledger = new api.ActionEvidence(); const p = proposal();
  ledger.recordStage(p); ledger.recordApply(p, 'failed', file());
  const facts = selected(ledger).records;
  assert.deepEqual(facts.map(r => r.outcome), ['staged', 'failed']);
  assert.ok(facts.every(r => r.tested === false));
  assert.ok(facts.every(r => r.sourceRelationship === 'current'));
  assert.ok(!JSON.stringify(facts).includes('newText'));
});
test('Apply records actual resulting document identity and retains full non-target closure', () => {
  const ledger = new api.ActionEvidence(), p = proposal(); ledger.recordStage(p); ledger.recordApply(p, 'applied', file('different', 3));
  const result = selected(ledger, [file('different', 3), file('helper', 1, other)]);
  assert.equal(result.records.at(-1).sourceRelationship, 'current');
  assert.equal(result.records.at(-1).observedFile.contentSha256, hash('different'));
  assert.equal(selected(ledger, [file('different', 3)]).records.length, 0);
  assert.equal(selected(ledger, [file('different', 3), file('helper', 2, other)]).records.at(-1).sourceRelationship, 'historical-changed');
  assert.equal(selected(ledger, [file('different', 3), file('helper', 1, other)], 'new-pack').records.length, 0);
});
test('Run relationship uses launch, completion and current saved bytes; dirty document is separate', () => {
  const ledger = new api.ActionEvidence(); ledger.recordRun(run());
  let r = selected(ledger).records[0]; assert.equal(r.sourceRelationship, 'unknown');
  r = ledger.selectContext({ authorizedFiles: [file()], savedIdentities: { [uri]: hash('old') }, knowledgeLineage: 'pack' }).records[0];
  assert.equal(r.sourceRelationship, 'unchanged-at-observed-boundaries');
  r = ledger.selectContext({ authorizedFiles: [file('dirty', 2)], savedIdentities: { [uri]: hash('old') }, knowledgeLineage: 'pack' }).records[0];
  assert.equal(r.sourceRelationship, 'unchanged-at-observed-boundaries'); assert.equal(r.currentDocumentRelationship, 'changed');
  r = ledger.selectContext({ authorizedFiles: [file('new', 2)], savedIdentities: { [uri]: hash('new') }, knowledgeLineage: 'pack' }).records[0];
  assert.equal(r.sourceRelationship, 'changed'); assert.equal(r.correctness, 'not-established');
});
test('source comparison is independent of unknown exit and environment provenance', () => {
  for (const extra of [{ sourceIdentity: { launch: hash('old'), completion: hash('new') } }, { sourceIdentity: null }, { exitCode: null }, { knowledgeLineage: null }, { runtimeVersion: null, knowledgePackVersion: null, runtimeMode: 'contributor' }]) {
    const ledger = new api.ActionEvidence(); ledger.recordRun(run(extra));
    const r = ledger.selectContext({ authorizedFiles: [file()], savedIdentities: { [uri]: hash('old') }, knowledgeLineage: 'pack' }).records[0];
    assert.equal(r.sourceRelationship, extra.sourceIdentity?.completion === hash('new') ? 'changed' : extra.sourceIdentity === null ? 'unknown' : 'unchanged-at-observed-boundaries');
    assert.equal(r.exitOutcome, extra.exitCode === null ? 'unknown' : 'observed-exit-code');
    assert.equal(r.knowledgeLineage, extra.knowledgeLineage === null ? null : 'pack');
  }
});

test('complete evidence projection including omissions obeys its text-byte limit', () => {
  const ledger = new api.ActionEvidence();
  for (let n = 0; n < 60; n++) { const p = proposal(); p.preparation.scopeSummary = '界'.repeat(2000); ledger.recordStage(p); }
  const projection = selected(ledger);
  assert.ok(Buffer.byteLength(JSON.stringify({ records: projection.records, omissions: projection.omissions })) <= api.MAX_ACTION_BYTES);
  assert.equal(projection.byteLength, Buffer.byteLength(JSON.stringify({ records: projection.records, omissions: projection.omissions })));
});

test('evidence never silently shortens an authorized scope and omits oversized facts whole', () => {
  const ledger = new api.ActionEvidence(), p = proposal(); p.preparation.scopeSummary = 'long-authorized-scope'.repeat(500);
  ledger.recordStage(p);
  const result = selected(ledger); assert.equal(result.records.length, 0);
  assert.ok(result.omissions.some(o => o.reason === 'record-byte-limit'));
});
test('host evidence is private, bounded, detached and cleared only by conversation reset', () => {
  const ledger = new api.ActionEvidence();
  for (let n = 1; n <= 60; n++) ledger.recordRun(run({ runSequence: n }));
  let selection = selected(ledger); assert.ok(selection.records.length <= api.MAX_ACTION_RECORDS);
  assert.ok(selection.byteLength <= api.MAX_ACTION_BYTES); assert.ok(selection.omissions.some(o => o.reason === 'record-limit'));
  selection.records[0].outcome = 'forged'; assert.equal(selected(ledger).records[0].outcome, 'completed');
  assert.equal(ledger.record, undefined); assert.equal(selected(ledger, []).records.length, 0);
  ledger.reset(); assert.equal(selected(ledger).records.length, 0);
});

test('oversized dependency closure is omitted whole and matching Run retains transitive Apply dependencies', () => {
  const ledger = new api.ActionEvidence(), p = proposal(); ledger.recordApply(p, 'applied', file('new', 2));
  ledger.recordRun(run({ sourceIdentity: { launch: hash('new'), completion: hash('new') } }));
  assert.equal(selected(ledger, [file('new', 2)]).records.length, 0);
  const huge = proposal(); huge.preparation.dependencies.files.push(...Array.from({ length: 150 }, (_, n) => file('x', 1, `file:///workspace/helper${n}.kf`)));
  ledger.recordStage(huge);
  assert.ok(selected(ledger).omissions.some(o => o.reason === 'record-byte-limit'));
});

test('failed native Run attempt records unknown execution and never becomes testing evidence', () => {
  const ledger = new api.ActionEvidence();
  ledger.recordRunState({ sourceUri: uri, status: 'failed', runSequence: 2 });
  const r = selected(ledger).records[0]; assert.equal(r.outcome, 'failed');
  assert.equal(r.sourceRelationship, 'unknown'); assert.equal(r.exactExecutedBytes, 'unknown');
});
