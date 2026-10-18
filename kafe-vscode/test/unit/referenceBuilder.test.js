const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { buildReferences } = require('../../scripts/build-tutor-references.cjs');

function referenceRepository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-reviewed-references-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const extension = path.join(root, 'kafe-vscode');
  const write = (name, value) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  const git = (...args) => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  };
  write('src/Kafe.py', '# pinned implementation\n');
  write('src/Kafe_Grammar.g4', 'grammar Kafe_Grammar;\n');
  write('src/nested/Kafe_GrammarLexer.py', '# ordinary nested source\n');
  write('src/z.py', '# last source\n');
  write('src/z/first.py', '# nested source\n');
  write('src/.hidden.py', '# source included despite hidden name\n');
  write('src/Kafe_GrammarLexer.py', '# generated lexer\n');
  write('src/Kafe_GrammarParser.py', '# generated parser\n');
  write('src/Kafe_GrammarVisitor.py', '# generated visitor\n');
  write('src/__pycache__/cached.py', '# cache\n');
  write('tests/z_valid.kf', 'function main() {\r\n  show(37);\r\n}\r\n');
  write('tests/z_valid.in', '37\r\n');
  write('tests/z_valid.expec', '37\r\n');
  write('tests/a_error.error.kf', 'invalid();\n');
  write('tests/a_error.error.expec', 'Unknown function\n');
  write('tests/unreviewed.kf', 'malformed API;\n');
  write('tests/unreviewed.expec', 'untrusted expectation\n');
  write('tests/unreviewed.in', 'old input\n');
  write('kafe-vscode/reference/catalogue.json', JSON.stringify({
    fixtures: ['tests/z_valid.kf', 'tests/a_error.error.kf'],
  }));
  write('kafe-vscode/reference/essentials.md', 'Reviewed guidance\n');
  git('init', '--quiet');
  git('-c', 'core.autocrlf=false', 'add', '--all');
  git('-c', 'user.name=Reference builder test', '-c', 'user.email=reference-builder@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Pinned test source');
  const revision = git('rev-parse', 'HEAD');
  write('kafe-vscode/src/runtimeManifest.json', JSON.stringify({ runtime: {
    version: 'test-runtime', sourceRevision: revision,
  } }));
  return { root, extension, write, revision, build: () => buildReferences(root, extension) };
}

test('only reviewed fixtures are admitted with complete normalized code, input and outcomes', t => {
  const repo = referenceRepository(t);
  const result = repo.build();
  assert.deepEqual(result.fixtures, [
    { path: 'tests/a_error.error.kf', code: 'invalid();\n', input: '',
      expectedOutput: 'Unknown function\n', expectedStream: 'stderr', expectedExitCode: 1,
      kind: 'expected-error' },
    { path: 'tests/z_valid.kf', code: 'function main() {\n  show(37);\n}\n', input: '37\n',
      expectedOutput: '37\n', expectedStream: 'stdout', expectedExitCode: 0, kind: 'valid' },
  ]);
  assert.deepEqual(result.omittedFixtures, ['tests/unreviewed.kf']);
});

test('pinned runtime source and current checkout have independent complete source fingerprints', t => {
  const repo = referenceRepository(t);
  const pinned = repo.build();
  assert.equal(pinned.runtimeSourceFingerprint, 'a3a5d7b87ff789c50cea1b2104dec863e921c88b52c5b7488744fb40db26f247');
  assert.equal(pinned.runtimeSourceFingerprint, pinned.sourceFingerprint);
  repo.write('src/Kafe.py', '# edited checkout implementation\n');
  const edited = repo.build();
  assert.notEqual(edited.sourceFingerprint, pinned.sourceFingerprint);
  assert.equal(edited.runtimeSourceFingerprint, pinned.runtimeSourceFingerprint);
  assert.equal(edited.runtimeSourceRevision, repo.revision);
  repo.write('src/Kafe_GrammarLexer.py', '# rebuilt generated lexer\n');
  repo.write('src/Kafe_GrammarParser.py', '# rebuilt generated parser\n');
  repo.write('src/Kafe_GrammarVisitor.py', '# rebuilt generated visitor\n');
  repo.write('src/__pycache__/cached.py', '# new cache bytes\n');
  assert.equal(repo.build().sourceFingerprint, edited.sourceFingerprint);
  let previousFingerprint = edited.sourceFingerprint;
  for (const source of ['src/.hidden.py', 'src/nested/Kafe_GrammarLexer.py', 'src/z/first.py']) {
    repo.write(source, '# changed ordinary source\n');
    const changed = repo.build();
    assert.notEqual(changed.sourceFingerprint, previousFingerprint, `${source} must be fingerprinted`);
    assert.equal(changed.runtimeSourceFingerprint, pinned.runtimeSourceFingerprint);
    previousFingerprint = changed.sourceFingerprint;
  }
});

test('changes to unselected fixture input and expected output still require a reference refresh', t => {
  const repo = referenceRepository(t);
  let previous = repo.build();
  for (const [name, value] of [
    ['tests/unreviewed.in', 'new input\n'],
    ['tests/unreviewed.expec', 'new expectation\n'],
    ['tests/unreviewed.kf', 'changed malformed API;\n'],
    ['tests/new_unreviewed.kf', 'newly discovered fixture;\n'],
    ['tests/.hidden/orphan.in', 'new hidden input\n'],
    ['tests/orphan.expec', 'orphaned expectation\n'],
  ]) {
    repo.write(name, value);
    const changed = repo.build();
    assert.notEqual(changed.fixtureFingerprint, previous.fixtureFingerprint, `${name} must invalidate freshness`);
    assert.notEqual(changed.contentSha256, previous.contentSha256);
    assert.deepEqual(changed.fixtures, previous.fixtures);
    previous = changed;
  }
});

test('reviewed fixtures must have checked expected outcomes', t => {
  const repo = referenceRepository(t);
  fs.unlinkSync(path.join(repo.root, 'tests/z_valid.expec'));
  assert.throws(repo.build, /reviewed fixture.*tests\/z_valid\.kf.*\.expec/i);
});

test('catalogue paths cannot select outside the fixture inventory or repeat a fixture', t => {
  const repo = referenceRepository(t);
  for (const fixtures of [
    ['tests/../src/Kafe.py'], ['tests/missing.kf'], ['tests\\z_valid.kf'],
    ['tests/z_valid.kf', 'tests/z_valid.kf'],
  ]) {
    repo.write('kafe-vscode/reference/catalogue.json', JSON.stringify({ fixtures }));
    assert.throws(repo.build, /catalogue|reviewed fixture/i);
  }
});

test('reviewed fixture fields must fit the loader bounds without truncation', t => {
  const repo = referenceRepository(t);
  for (const extension of ['kf', 'in', 'expec']) {
    const filename = `tests/z_valid.${extension}`;
    const original = fs.readFileSync(path.join(repo.root, filename), 'utf8');
    repo.write(filename, 'é'.repeat(32 * 1024 + 1));
    assert.throws(repo.build, /reviewed fixture.*64.*KiB/i);
    repo.write(filename, original);
  }
});
