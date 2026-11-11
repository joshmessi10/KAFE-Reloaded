const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { buildLibraryReferences, validateContracts, apiInventory } = require('../../scripts/build-library-references.cjs');
const { sourceFingerprint } = require('../../scripts/build-tutor-references.cjs');
const { LEARNING_TOPIC_IDS } = require('../../src/tutor/LearningTopics');

const repositoryRoot = path.resolve(__dirname, '../../..');
const machineSource = 'src/lib/KafeMACHINE/functions.py';
const receiverSource = 'src/lib/KafeMACHINE/model.py';
const examplePath = 'tests/library.kf';

function libraryRepository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-library-contracts-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  const json = (name, value) => write(name, JSON.stringify(value));
  const git = (...args) => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  };
  // The inventory is parsed from real Python source, without importing libraries.
  write(machineSource, 'from metrics import accuracy_score\nimport math\ndef build_model():\n    pass\ndef _private_helper():\n    pass\n');
  write('src/lib/KafeMACHINE/metrics.py', 'def accuracy_score(actual, predicted):\n    pass\n');
  write(receiverSource, 'class Model:\n    def __init__(self):\n        self.weights_ = []\n    def fit(self, X, y):\n        return self\n    def predict(self, X):\n        return X\n    @property\n    def n_features_in_(self):\n        return 2\n');
  write('src/lib/KafeGESHA/functions_v2.py', 'def create_model():\n    pass\nmake_model = create_model\n');
  write('src/Kafe_Grammar.g4', 'grammar Kafe_Grammar;\n');
  write('src/Kafe_Lexer.g4', 'lexer grammar Kafe_Lexer;\n');
  write(examplePath, 'function main() { show(1); }\n');
  write('tests/library.expec', '1\n');
  write('tests/library.in', 'old input\n');
  write('tests/library.stdout.expec', '1\n');
  write('tests/library.stderr.expec', '');
  write('tests/library_evidence.py', '# Python evidence\n');
  write('tests/isolated.kf', 'function main() { show(2); }\n');
  write('tests/isolated.expec', '2\n');
  write('tests/isolated-data.csv', 'value\n2\n');
  for (const section of ['getting-started', 'language', 'specification', 'errors', 'examples']) {
    write(`docs/${section}/index.md`, `# ${section}\n\nReviewed learner guidance.\n`);
  }
  write('docs/libraries/machine.md', '# MACHINE\n\nReviewed MACHINE overview.\n');
  write('docs/libraries/machine/models.md', '# Models\n\nUse machine.build_model() before fitting.\n');
  write('docs/libraries/gesha.md', '# GESHA\n\nReviewed GESHA overview.\n');
  git('init', '--quiet');
  const commitSource = () => {
    git('-c', 'core.autocrlf=false', 'add', 'src');
    git('-c', 'user.name=Library builder test', '-c', 'user.email=library-builder@example.invalid',
      '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Pinned test source');
    return git('rev-parse', 'HEAD');
  };
  const revision = commitSource();
  const fingerprint = sourceFingerprint(path.join(root, 'src'));
  const entry = (id, kind, sources, extra = {}) => ({
    id, kind, status: 'supported', signatures: [kind === 'property' ? id : `${id}()`],
    summary: `Reviewed contract for ${id}.`, parameters: [], returns: 'MACHINE value.',
    constraints: [], aliases: [], sources, examples: [examplePath],
    evidence: ['tests/library_evidence.py'], related: [], ...extra,
  });
  const reviewed = { reviewedSourceFingerprint: fingerprint, runtimeSourceRevision: revision };
  const machine = { schemaVersion: 1, library: 'machine', ...reviewed, entries: [
    entry('machine.build_model', 'function', [machineSource]),
    entry('machine.accuracy_score', 'function', ['src/lib/KafeMACHINE/metrics.py']),
    ...['fit', 'predict'].map(name => entry(`machine.Model.${name}`, 'method', [receiverSource], { sourceSymbols: [`Model.${name}`] })),
    ...['weights_', 'n_features_in_'].map(name => entry(`machine.Model.${name}`, 'property', [receiverSource], { sourceSymbols: [`Model.${name}`] })),
  ], isolatedFixtures: [{ path: 'tests/isolated.kf', assets: ['tests/isolated-data.csv'], writes: true }] };
  const gesha = { schemaVersion: 1, library: 'gesha', ...reviewed, entries: [
    entry('gesha.create_model', 'function', ['src/lib/KafeGESHA/functions_v2.py']),
    entry('gesha.make_model', 'alias', ['src/lib/KafeGESHA/functions_v2.py']),
  ] };
  const surface = { schemaVersion: 1, ...reviewed, receivers: {
    machine: [{ name: 'Model', source: receiverSource, properties: ['weights_', 'n_features_in_'] }], gesha: [],
  } };
  const manifest = { runtime: { version: 'test-runtime', sourceRevision: revision } };
  json('kafe-vscode/src/runtimeManifest.json', manifest);
  json('kafe-vscode/reference/machine-api.json', machine);
  json('kafe-vscode/reference/gesha-api.json', gesha);
  json('kafe-vscode/reference/library-surface.json', surface);
  json('kafe-vscode/reference/learning-topics.json', { schemaVersion: 1, topics: LEARNING_TOPIC_IDS.map(id => ({ id,
    aliases: [`Reviewed ${id}`], text: `Reviewed conceptual guidance for ${id}.`, apiIds: ['machine.build_model'] })) });
  // A local developer environment may keep Python outside PATH. Keep the override
  // local to these synchronous calls; CI can use its normal Python executable.
  const python = process.env.KAFE_PYTHON || ['.venv/Scripts/python.exe', '.venv/bin/python']
    .map(candidate => path.join(repositoryRoot, candidate)).find(candidate => fs.existsSync(candidate));
  const withPython = action => {
    const previous = process.env.KAFE_PYTHON;
    if (python) process.env.KAFE_PYTHON = python;
    try { return action(); }
    finally {
      if (previous === undefined) delete process.env.KAFE_PYTHON;
      else process.env.KAFE_PYTHON = previous;
    }
  };
  const inventory = withPython(() => apiInventory(root));
  return { root, write, json, machine, gesha, surface, manifest, inventory, revision, fingerprint, commitSource,
    build: () => withPython(() => buildLibraryReferences(root)),
    validate: (document = machine, library = 'machine', policy = surface.receivers[library]) =>
      validateContracts(document, library, inventory[library], root, policy) };
}

test('library builder derives exports and receiver members from source and produces a deterministic pinned bundle', t => {
  const repo = libraryRepository(t);
  assert.deepEqual(repo.inventory.machine.functions, ['accuracy_score', 'build_model']);
  assert.deepEqual(repo.inventory.gesha.aliases, { make_model: 'create_model' });
  assert.deepEqual(repo.inventory.machine.owners.Model[0].members.map(member => [member.symbol, member.kind]), [
    ['Model.fit', 'method'], ['Model.predict', 'method'], ['Model.n_features_in_', 'property'],
  ]);
  assert.deepEqual(repo.inventory.machine.owners.Model[0].fields, ['weights_']);
  const built = repo.build();
  assert.deepEqual(repo.build(), built);
  assert.equal(built.entries.length, 8);
  assert.equal(built.runtimeSourceRevision, repo.revision);
  assert.equal(built.sourceFingerprint, repo.fingerprint);
  assert.equal(built.runtimeSourceFingerprint, repo.fingerprint);
  assert.equal(built.runtimeVersion, 'test-runtime');
  assert.deepEqual(built.inventory.machine.functions, ['accuracy_score', 'build_model']);
  assert.deepEqual(built.isolatedFixtures, repo.machine.isolatedFixtures);
  assert.ok(built.units.some(unit => unit.path === 'libraries/machine/models.md' && unit.text.includes('machine.build_model()')));
  assert.equal(built.topics.length, 8);
});

test('learning objectives cannot disappear and concept changes invalidate the reviewed bundle', t => {
  const repo = libraryRepository(t);
  const original = repo.build();
  const filename = 'kafe-vscode/reference/learning-topics.json';
  repo.json(filename, { schemaVersion: 1, topics: original.topics.slice(1) });
  assert.throws(repo.build, /Uncovered learning objective/);
  const changed = structuredClone(original.topics); changed[0].apiIds = ['machine.nonexistent'];
  repo.json(filename, { schemaVersion: 1, topics: changed });
  assert.throws(repo.build, /Unknown learning topic API/);
  changed[0] = { ...original.topics[0], text: 'Revised reviewed conceptual guidance.' };
  repo.json(filename, { schemaVersion: 1, topics: changed });
  const revised = repo.build();
  assert.notEqual(revised.contractFingerprint, original.contractFingerprint);
  assert.notEqual(revised.contentSha256, original.contentSha256);
});

test('source coverage rejects removed callable, imported metric, alias and invented API contracts', t => {
  const repo = libraryRepository(t);
  for (const id of ['machine.build_model', 'machine.accuracy_score']) {
    const document = structuredClone(repo.machine);
    document.entries = document.entries.filter(entry => entry.id !== id);
    assert.throws(() => repo.validate(document), error => error.message === `Uncovered public API: ${id}`, id);
  }
  const gesha = structuredClone(repo.gesha);
  gesha.entries = gesha.entries.filter(entry => entry.kind !== 'alias');
  assert.throws(() => repo.validate(gesha, 'gesha'), /Uncovered public alias: gesha\.make_model/);
  const invented = structuredClone(repo.machine);
  invented.entries.push({ ...structuredClone(invented.entries[0]), id: 'machine.nonexistent' });
  assert.throws(() => repo.validate(invented), /nonexistent public API: machine\.nonexistent/);
  for (const [original, library, id, kind, expected] of [
    [repo.machine, 'machine', 'machine.build_model', 'property', 'Uncovered public API: machine.build_model'],
    [repo.gesha, 'gesha', 'gesha.make_model', 'function', 'Uncovered public alias: gesha.make_model'],
  ]) {
    const document = structuredClone(original);
    document.entries.find(entry => entry.id === id).kind = kind;
    assert.throws(() => repo.validate(document, library), error => error.message === expected, `${id}: ${kind}`);
  }
});

test('receiver policy prevents a missing method, property or entire object family from escaping completeness', t => {
  const repo = libraryRepository(t);
  for (const [id, message] of [
    ['machine.Model.predict', /Uncovered public object member: machine\.Model\.predict/],
    ['machine.Model.n_features_in_', /Uncovered public object member: machine\.Model\.n_features_in_/],
    ['machine.Model.weights_', /Uncovered intended receiver member: machine\.Model\.weights_/],
  ]) {
    const document = structuredClone(repo.machine);
    document.entries = document.entries.filter(entry => entry.id !== id);
    assert.throws(() => repo.validate(document), message, id);
  }
  const document = structuredClone(repo.machine);
  document.entries = document.entries.filter(entry => !entry.id.startsWith('machine.Model.'));
  assert.throws(() => repo.validate(document), /Uncovered intended receiver member: machine\.Model\.fit/);
  const wrongAnchor = structuredClone(repo.machine);
  wrongAnchor.entries.find(entry => entry.id === 'machine.Model.weights_').sources = [machineSource];
  assert.throws(() => repo.validate(wrongAnchor), /Uncovered intended receiver member: machine\.Model\.weights_/);
  const policy = structuredClone(repo.surface.receivers.machine);
  policy[0].source = machineSource;
  assert.throws(() => repo.validate(repo.machine, 'machine', policy), /Receiver policy does not match pinned source/);
  policy[0].source = receiverSource;
  policy[0].properties.push('nonexistent_');
  const phantom = structuredClone(repo.machine);
  phantom.entries.push({ ...structuredClone(phantom.entries.at(-1)), id: 'machine.Model.nonexistent_', sourceSymbols: ['Model.nonexistent_'] });
  assert.throws(() => repo.validate(phantom, 'machine', policy), /Receiver policy names an absent property/);
});

test('both contracts and receiver policy require the manually reviewed source fingerprint and revision', t => {
  const repo = libraryRepository(t);
  for (const [filename, original, expected] of [
    ['machine-api.json', repo.machine, /machine contracts need explicit review/],
    ['gesha-api.json', repo.gesha, /gesha contracts need explicit review/],
    ['library-surface.json', repo.surface, /intended receiver policy needs review/],
  ]) {
    for (const field of ['reviewedSourceFingerprint', 'runtimeSourceRevision']) {
      const document = structuredClone(original);
      document[field] = '0'.repeat(field === 'runtimeSourceRevision' ? 40 : 64);
      repo.json(`kafe-vscode/reference/${filename}`, document);
      assert.throws(repo.build, expected, `${filename}: ${field}`);
      repo.json(`kafe-vscode/reference/${filename}`, original);
    }
  }
});

test('editing runtime source fails bundling and advancing its pin alone cannot renew semantic review', t => {
  const repo = libraryRepository(t);
  repo.write(receiverSource, fs.readFileSync(path.join(repo.root, receiverSource), 'utf8') + '\n# New runtime revision\n');
  assert.throws(repo.build, /actual pinned runtime source.*source\/version drift/);
  repo.manifest.runtime.sourceRevision = repo.commitSource();
  repo.json('kafe-vscode/src/runtimeManifest.json', repo.manifest);
  assert.throws(repo.build, /intended receiver policy needs review/);
  const reviewed = {
    reviewedSourceFingerprint: sourceFingerprint(path.join(repo.root, 'src')),
    runtimeSourceRevision: repo.manifest.runtime.sourceRevision,
  };
  repo.json('kafe-vscode/reference/library-surface.json', { ...repo.surface, ...reviewed });
  assert.throws(repo.build, /machine contracts need explicit review/);
});

test('new and edited corpus documents invalidate freshness even outside selected library units', t => {
  const repo = libraryRepository(t);
  let previous = repo.build();
  for (const [filename, content, selected] of [
    ['docs/libraries/machine/models.md', '# Models\n\nUpdated fitting prerequisites.\n', true],
    ['docs/libraries/machine/new-topic.md', '# New topic\n\nComplete reviewed guidance.\n', true],
    ['docs/errors/index.md', '# Errors\n\nUpdated error guidance.\n', false],
  ]) {
    repo.write(filename, content);
    const changed = repo.build();
    assert.notEqual(changed.corpusFingerprint, previous.corpusFingerprint, filename);
    assert.notEqual(changed.contentSha256, previous.contentSha256, filename);
    assert.equal(changed.evidenceFingerprint, previous.evidenceFingerprint);
    assert.equal(changed.contractFingerprint, previous.contractFingerprint);
    assert.deepEqual(changed.entries, previous.entries);
    if (!selected) assert.deepEqual(changed.units, previous.units);
    previous = changed;
  }
});

test('fixture code, every expected stream, input, Python evidence and isolated assets invalidate evidence freshness', t => {
  const repo = libraryRepository(t);
  let previous = repo.build();
  for (const [filename, content] of [
    [examplePath, 'function main() { show(3); }\n'],
    ['tests/library.expec', '3\n'],
    ['tests/library.stdout.expec', '3\n'],
    ['tests/library.stderr.expec', 'Checked diagnostic\n'],
    ['tests/library.in', 'new input\n'],
    ['tests/library_evidence.py', '# Revised Python evidence\n'],
    ['tests/isolated.kf', 'function main() { show(4); }\n'],
    ['tests/isolated-data.csv', 'value\n4\n'],
  ]) {
    repo.write(filename, content);
    const changed = repo.build();
    assert.notEqual(changed.evidenceFingerprint, previous.evidenceFingerprint, filename);
    assert.notEqual(changed.contentSha256, previous.contentSha256, filename);
    assert.equal(changed.corpusFingerprint, previous.corpusFingerprint);
    assert.equal(changed.contractFingerprint, previous.contractFingerprint);
    assert.deepEqual(changed.entries, previous.entries);
    assert.deepEqual(changed.units, previous.units);
    previous = changed;
  }
  fs.unlinkSync(path.join(repo.root, 'tests/library.in'));
  const withoutInput = repo.build();
  assert.notEqual(withoutInput.evidenceFingerprint, previous.evidenceFingerprint, 'removing an optional input must invalidate freshness');
  fs.unlinkSync(path.join(repo.root, 'tests/library.expec'));
  assert.throws(repo.build, /Missing expected output for tests\/library\.kf/);
});

test('contract text and reviewed receiver policy participate in bundle freshness', t => {
  const repo = libraryRepository(t);
  let previous = repo.build();
  repo.machine.entries[0].summary = 'Updated reviewed factory prerequisites.';
  repo.json('kafe-vscode/reference/machine-api.json', repo.machine);
  let changed = repo.build();
  assert.notEqual(changed.contractFingerprint, previous.contractFingerprint);
  assert.notEqual(changed.contentSha256, previous.contentSha256);
  assert.equal(changed.evidenceFingerprint, previous.evidenceFingerprint);
  previous = changed;
  repo.surface.reviewNotes = 'Explicitly rechecked intended returned-object fields.';
  repo.json('kafe-vscode/reference/library-surface.json', repo.surface);
  changed = repo.build();
  assert.notEqual(changed.contractFingerprint, previous.contractFingerprint);
  assert.notEqual(changed.contentSha256, previous.contentSha256);
  assert.equal(changed.evidenceFingerprint, previous.evidenceFingerprint);
  assert.deepEqual(changed.entries, previous.entries);
});
