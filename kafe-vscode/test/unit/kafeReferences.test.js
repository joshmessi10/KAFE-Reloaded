const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { createKafeReferences } = require('../../src/tutor/KafeReferences');
const bundle = require('../../src/tutor/kafeReferences.json');
const runtime = require('../../src/runtimeManifest.json').runtime;

test('optional fixture path restriction filters before ranking without changing the unrestricted default', () => {
  const refs = createKafeReferences(), query = 'train test split';
  const original = refs.select(query);
  assert.ok(original.length > 1);
  const allowedPaths = [original[0].provenance.path];
  const selected = refs.select(query, { allowedPaths, preferredPaths: [original[1].provenance.path] });
  assert.deepEqual(selected, [original[0]]);
  assert.deepEqual(refs.select(query, { allowedPaths: [] }), []);
  assert.deepEqual(refs.select(query), original);
  assert.deepEqual(allowedPaths, [original[0].provenance.path]);
  assert.deepEqual(refs.select(query, { allowedPaths: ['tests/absent.kf'] }), []);
  assert.deepEqual(refs.select(query, { allowedPaths, maxBytes: Buffer.byteLength(selected[0].text) - 1 }), []);
  for (const allowedPaths of [null, 'tests/example.kf', [1], ['../private.kf'], ['tests/../private.kf'],
    ['tests/example.kf', 'tests/example.kf'], Array.from({ length: 2001 }, (_, i) => `tests/${i}.kf`)]) {
    assert.throws(() => refs.select(query, { allowedPaths }), /Invalid fixture/);
  }
});

test('runtime mismatch and changed bundled bytes cannot be transmitted as language guidance', () => {
  assert.throws(() => createKafeReferences(bundle, { ...runtime, version: '99.0.0' }), /mismatch/);
  assert.throws(() => createKafeReferences(bundle, { ...runtime, sourceRevision: '0'.repeat(40) }), /mismatch/);
  const changed = structuredClone(bundle); changed.essentials += '\nInvented instruction';
  assert.throws(() => createKafeReferences(changed), /integrity/);
});

test('full fixture selection is bounded and returned records cannot mutate the bundled reference', () => {
  const references = createKafeReferences();
  const result = references.select('BMI IMC function show main output return variable math loops files import');
  assert.ok(result.length > 0 && result.length <= 3);
  assert.ok(result.reduce((sum, item) => sum + Buffer.byteLength(item.text), 0) <= 12 * 1024);
  for (const source of result) {
    const fixture = JSON.parse(source.text.slice(source.text.indexOf('\n') + 1));
    const original = bundle.fixtures.find(item => item.path === fixture.path);
    assert.equal(fixture.code, original.code);
    assert.equal(fixture.expectedOutput, original.expectedOutput);
    assert.ok(source.provenance.sourceFingerprint);
  }
  result[0].text = 'CORRUPTED'; result[0].provenance.path = 'CORRUPTED';
  assert.doesNotMatch(JSON.stringify(references.select('BMI IMC')), /CORRUPTED/);
});

test('malformed fixture outcomes and oversized output cannot masquerade as validated references', () => {
  for (const mutate of [value => { value.fixtures[0].expectedExitCode = 9; },
    value => { value.fixtures[0].expectedOutput = 'x'.repeat(70 * 1024); },
    value => { value.fixtures[0].path = 'tests/../private.kf'; }]) {
    const changed = structuredClone(bundle); mutate(changed);
    const { contentSha256, ...body } = changed;
    changed.contentSha256 = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    assert.throws(() => createKafeReferences(changed), /fixture/);
  }
});
