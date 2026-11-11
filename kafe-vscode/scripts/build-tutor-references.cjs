const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

const extensionRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(extensionRoot, '..');
const digest = value => createHash('sha256').update(value).digest('hex');
const read = filename => fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const generatedSources = new Set(['Kafe_GrammarLexer.py', 'Kafe_GrammarParser.py', 'Kafe_GrammarVisitor.py']);
const isSource = name => /\.(?:py|g4)$/.test(name) && !generatedSources.has(name) &&
  !name.split('/').includes('__pycache__');
function filesUnder(root, relative = '') {
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => compare(a.name, b.name))
    .flatMap(entry => {
      if (entry.name === '__pycache__') return [];
      if (entry.isSymbolicLink()) throw Error('Tutor reference inputs must not contain symbolic links');
      const name = [relative, entry.name].filter(Boolean).join('/');
      return entry.isDirectory() ? filesUnder(root, name) : entry.isFile() ? [name] : [];
    });
}
function sourceFingerprint(sourceRoot) {
  const names = filesUnder(sourceRoot).filter(isSource).sort(compare);
  return digest(JSON.stringify(names.map(name => [name, digest(read(path.join(sourceRoot, name)))])));
}
function runtimeSourceFingerprint(repoRoot, revision) {
  if (!/^[a-f0-9]{40}$/i.test(revision || '')) throw Error('Pinned runtime source revision must be a full Git commit SHA');
  const git = (...args) => {
    try {
      return execFileSync('git', ['-C', repoRoot, ...args], {
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      throw Error(`Cannot fingerprint pinned runtime source revision ${revision}: ${String(error.stderr || error.message).trim()}`);
    }
  };
  const sources = git('ls-tree', '-r', '-z', '--full-tree', revision, '--', 'src').split('\0')
    .filter(Boolean).map(entry => {
      const separator = entry.indexOf('\t');
      const [mode, type] = entry.slice(0, separator).split(' ');
      return { mode, type, name: entry.slice(separator + 1).slice('src/'.length) };
    }).filter(entry => isSource(entry.name)).sort((a, b) => compare(a.name, b.name));
  if (sources.length === 0) throw Error(`Pinned runtime source revision ${revision} contains no interpreter sources`);
  const hashes = sources.map(({ mode, type, name }) => {
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) {
      throw Error('Pinned runtime source inputs must be regular files');
    }
    return [name, digest(git('show', `${revision}:src/${name}`).replace(/\r\n/g, '\n'))];
  });
  return digest(JSON.stringify(hashes));
}
function buildReferences(repoRoot = repositoryRoot, extRoot = extensionRoot) {
  const runtime = JSON.parse(read(path.join(extRoot, 'src/runtimeManifest.json'))).runtime;
  const testsRoot = path.join(repoRoot, 'tests');
  const inputs = filesUnder(testsRoot).filter(name => /\.(?:kf|expec|in)$/.test(name)).sort(compare);
  const inventory = new Set(inputs);
  const catalogue = JSON.parse(read(path.join(extRoot, 'reference/catalogue.json')));
  if (!Array.isArray(catalogue.fixtures) || catalogue.fixtures.length > 2000) throw Error('Invalid reviewed fixture catalogue');
  const selected = new Set();
  for (const fixturePath of catalogue.fixtures) {
    if (typeof fixturePath !== 'string' || !/^tests\/.+\.kf$/.test(fixturePath) || /[\u0000-\u001f\\]/.test(fixturePath) ||
      fixturePath.split('/').some(part => !part || part === '.' || part === '..') || selected.has(fixturePath)) {
      throw Error('Invalid or duplicate reviewed fixture catalogue path');
    }
    if (!inventory.has(fixturePath.slice('tests/'.length))) throw Error(`Reviewed fixture ${fixturePath} is missing from the fixture inventory`);
    selected.add(fixturePath);
  }
  const fixtures = [];
  for (const fixturePath of [...selected].sort(compare)) {
    const name = fixturePath.slice('tests/'.length);
    const base = name.slice(0, -3), expected = `${base}.expec`;
    if (!inventory.has(expected)) throw Error(`Reviewed fixture ${fixturePath} requires tests/${expected}`);
    const field = filename => {
      const value = read(path.join(testsRoot, filename));
      if (Buffer.byteLength(value, 'utf8') > 64 * 1024) throw Error(`Reviewed fixture ${fixturePath} field ${filename} exceeds 64 KiB`);
      return value;
    };
    const invalid = name.endsWith('.error.kf');
    fixtures.push({ path: fixturePath, code: field(name),
      input: inventory.has(`${base}.in`) ? field(`${base}.in`) : '',
      expectedOutput: field(expected), expectedStream: invalid ? 'stderr' : 'stdout',
      expectedStdout: inventory.has(`${base}.stdout.expec`) ? field(`${base}.stdout.expec`) : invalid ? '' : field(expected),
      expectedStderr: inventory.has(`${base}.stderr.expec`) ? field(`${base}.stderr.expec`) : invalid ? field(expected) : '',
      expectedExitCode: invalid ? 1 : 0, kind: invalid ? 'expected-error' : 'valid' });
  }
  const omittedFixtures = inputs.filter(name => name.endsWith('.kf') && !selected.has(`tests/${name}`)).map(name => `tests/${name}`);
  const body = { schemaVersion: 1, referenceVersion: 1, runtimeVersion: runtime.version,
    runtimeSourceRevision: runtime.sourceRevision, sourceFingerprint: sourceFingerprint(path.join(repoRoot, 'src')),
    runtimeSourceFingerprint: runtimeSourceFingerprint(repoRoot, runtime.sourceRevision),
    fixtureFingerprint: digest(JSON.stringify(inputs.map(name => [name, digest(read(path.join(testsRoot, name)))]))),
    essentials: read(path.join(extRoot, 'reference/essentials.md')), fixtures, omittedFixtures };
  return { ...body, contentSha256: digest(JSON.stringify(body)) };
}
function main() {
  const target = path.join(extensionRoot, 'src/tutor/kafeReferences.json');
  const serialized = JSON.stringify(buildReferences(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || read(target) !== serialized) {
      throw Error('Bundled KAFE references are stale. Run npm run references:build, then references:verify against the target interpreter.');
    }
    console.log('Bundled KAFE references match language source and fixture inputs.');
  } else { fs.writeFileSync(target, serialized); console.log(`Generated ${path.relative(extensionRoot, target)}`); }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { buildReferences, sourceFingerprint, runtimeSourceFingerprint };
