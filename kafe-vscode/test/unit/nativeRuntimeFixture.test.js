const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const test = require('node:test');
const { pinUnpublishedRuntime } = require('../helpers/nativeRuntimeFixture');
const { createRuntimeManager } = require('../../src/runtimeManager');

for (const published of [true, false]) test(`native runtime fixture restores the original published flag: ${published}`, () => {
  const manifest = { runtime: { releasePublished: published, sourceRevision: 'pinned-source', version: 'fixture-version' } };
  const original = structuredClone(manifest), runtime = manifest.runtime;
  const restore = pinUnpublishedRuntime(manifest);
  assert.equal(manifest.runtime, runtime, 'the default runtime manager holds this same object');
  assert.equal(manifest.runtime.releasePublished, false);
  assert.equal(manifest.runtime.sourceRevision, 'pinned-source');
  restore();
  assert.deepEqual(manifest, original);
  restore();
  assert.deepEqual(manifest, original, 'cleanup remains safe if invoked twice');
});

test('invalid fixture input is rejected without altering its fields', () => {
  for (const manifest of [undefined, {}, { runtime: {} }, { runtime: { releasePublished: 'true' } }]) {
    const original = structuredClone(manifest);
    assert.throws(() => pinUnpublishedRuntime(manifest), /published-release flag/);
    assert.deepEqual(manifest, original);
  }
});

test('the native pin reaches real unpublished Setup without download confirmation, transport or process launch', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-native-runtime-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('kafe-native-runtime-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const manifest = require('../../src/runtimeManifest.json'), published = manifest.runtime.releasePublished;
  const restore = pinUnpublishedRuntime(manifest), calls = [];
  try {
    const manager = createRuntimeManager({ storageRoot: root,
      confirmDownload: async () => { calls.push('confirm'); throw Error('Download confirmation is forbidden in this fixture'); },
      transport: async () => { calls.push('download'); throw Error('Network is forbidden in this fixture'); },
      processRunner: async () => { calls.push('process'); throw Error('Runtime execution is forbidden in this fixture'); } });
    const result = await manager.installRuntime();
    assert.equal(result.status, 'unavailable');
    assert.match(result.message, /not published/i);
    assert.deepEqual(calls, []);
  } finally { restore(); }
  assert.equal(manifest.runtime.releasePublished, published);
});

for (const fails of [false, true]) test(`host suite pins the shared default manifest and restores it after ${fails ? 'failure' : 'success'}`, () => {
  const suitePath = path.resolve(__dirname, '../suite/extension.test.js');
  const manifestPath = require.resolve('../../src/runtimeManifest.json');
  const manifest = require(manifestPath), original = structuredClone(manifest);
  const originalBytes = fs.readFileSync(manifestPath), originalMtime = fs.statSync(manifestPath).mtimeMs;
  const requireSuite = createRequire(suitePath), setups = [], teardowns = [], cases = [];
  // Register the real suite's hooks without starting VS Code or running its cases.
  vm.runInNewContext(fs.readFileSync(suitePath, 'utf8'), {
    require: name => name === 'vscode' ? {} : requireSuite(name),
    __dirname: path.dirname(suitePath), suite: (_name, register) => register(),
    suiteSetup: callback => setups.push(callback), suiteTeardown: callback => teardowns.push(callback),
    test: (name, callback) => cases.push({ name, callback }),
  }, { filename: suitePath });
  assert.equal(setups.length, 1, 'the native suite must install its offline pin before activation cases');
  assert.equal(teardowns.length, 1, 'the native suite must register cleanup for failed cases too');
  assert.ok(cases.some(value => value.name === 'registers the Tutor Activity Bar view'));
  assert.ok(cases.some(value => value.name === 'Run and Setup follow the actual Extension Development Host trust state'));
  const failure = new Error('Synthetic native test failure');
  const run = () => {
    try {
      setups[0]();
      const manager = createRuntimeManager({ storageRoot: path.join(__dirname, 'unused-native-storage') });
      assert.equal(manager.manifest, manifest, 'real activation must see the same cached manifest that the suite pins');
      assert.equal(manager.manifest.runtime.releasePublished, false);
      assert.deepEqual(fs.readFileSync(manifestPath), originalBytes, 'the fixture changes memory only');
      assert.equal(fs.statSync(manifestPath).mtimeMs, originalMtime);
      if (fails) throw failure;
    } finally { teardowns[0](); }
  };
  if (fails) assert.throws(run, error => error === failure);
  else run();
  assert.deepEqual(manifest, original);
  assert.deepEqual(fs.readFileSync(manifestPath), originalBytes);
  assert.equal(fs.statSync(manifestPath).mtimeMs, originalMtime);
});
