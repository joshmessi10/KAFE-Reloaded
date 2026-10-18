const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { createKafeReferences } = require('../../src/tutor/KafeReferences');
const bundle = require('../../src/tutor/kafeReferences.json');
const runtime = require('../../src/runtimeManifest.json').runtime;

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
