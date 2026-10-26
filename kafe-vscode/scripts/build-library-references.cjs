const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { sourceFingerprint, runtimeSourceFingerprint } = require('./build-tutor-references.cjs');
const { formatEntry: entryText } = require('../src/tutor/LibraryReferences');
const { collectKnowledgeCorpusSync } = require('../src/tutor/KnowledgeCorpus');
const { extractAtomicUnits } = require('../src/tutor/ReferenceSearch');
const { validateLearningTopics, LEARNING_TOPIC_IDS } = require('../src/tutor/LearningTopics');

const repositoryRoot = path.resolve(__dirname, '../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const relativePath = value => typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
  !/[:\\\x00-\x1f\x7f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
const read = filename => fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
const identifier = /^[a-zA-Z][a-zA-Z0-9_.]*$/;
const KINDS = new Set(['function', 'method', 'property', 'alias']);
const STATUSES = new Set(['supported', 'limited', 'experimental', 'deprecated', 'unsupported']);

function pythonExecutable(root) {
  if (process.env.KAFE_PYTHON) return process.env.KAFE_PYTHON;
  for (const candidate of ['.venv/Scripts/python.exe', '.venv/bin/python']) {
    if (fs.existsSync(path.join(root, candidate))) return path.join(root, candidate);
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function apiInventory(root) {
  return JSON.parse(execFileSync(pythonExecutable(root), [path.join(__dirname, 'inventory-library-api.py'), root],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, windowsHide: true }));
}

function text(value, label, limit = 16000) {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value, 'utf8') > limit) throw Error(`Invalid library ${label}`);
  return value;
}
function strings(value, label, { empty = true } = {}) {
  if (!Array.isArray(value) || (!empty && !value.length) || value.length > 200) throw Error(`Invalid library ${label}`);
  value.forEach(item => text(item, label));
  return value;
}
function paths(value, root, label, { empty = true } = {}) {
  strings(value, label, { empty });
  for (const item of value) {
    if (!relativePath(item)) throw Error(`Unsafe library ${label} path: ${item}`);
    let parent = root;
    for (const segment of item.split('/')) {
      if (!fs.readdirSync(parent).includes(segment)) throw Error(`Missing or non-canonical library ${label}: ${item}`);
      parent = path.join(parent, segment);
      if (fs.lstatSync(parent).isSymbolicLink()) throw Error(`Unsafe library ${label} link: ${item}`);
    }
    const resolved = path.join(root, item), stat = fs.lstatSync(resolved);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Missing or unsafe library ${label}: ${item}`);
  }
  return value;
}
function validateContracts(document, library, inventory, root, receiverPolicy) {
  if (document.schemaVersion !== 1 || document.library !== library || !Array.isArray(document.entries)) throw Error(`Invalid ${library} contracts`);
  const entries = document.entries, seen = new Set();
  for (const entry of entries) {
    if (!identifier.test(entry.id || '') || !entry.id.startsWith(`${library}.`) || seen.has(entry.id) ||
      !KINDS.has(entry.kind) || !STATUSES.has(entry.status)) throw Error(`Invalid or duplicate ${library} API id/status: ${entry.id}`);
    seen.add(entry.id);
    text(entry.summary, 'summary'); text(entry.returns, 'return contract');
    for (const field of ['signatures', 'parameters', 'constraints', 'aliases', 'examples', 'evidence', 'related']) strings(entry[field], field, { empty: field !== 'signatures' });
    paths(entry.sources, root, 'source', { empty: false }); paths(entry.examples, root, 'example'); paths(entry.evidence, root, 'test evidence');
    if (entry.examples.some(item => !/^tests\/.+\.kf$/.test(item))) throw Error(`API evidence must be repository KAFE fixtures: ${entry.id}`);
    if (entry.kind === 'function' && entry.status !== 'unsupported' && !entry.examples.length) throw Error(`Supported API lacks KAFE evidence: ${entry.id}`);
    for (const example of entry.examples) if (!fs.existsSync(path.join(root, example.slice(0, -3) + '.expec'))) throw Error(`Missing expected output for ${example}`);
    if (Buffer.byteLength(entryText(entry), 'utf8') > 6 * 1024) throw Error(`API reference exceeds atomic-unit budget: ${entry.id}`);
  }
  for (const name of inventory.functions) if (!entries.some(entry => entry.id === `${library}.${name}` && entry.kind === 'function')) throw Error(`Uncovered public API: ${library}.${name}`);
  for (const name of Object.keys(inventory.aliases)) if (!entries.some(entry => entry.id === `${library}.${name}` && entry.kind === 'alias')) throw Error(`Uncovered public alias: ${library}.${name}`);
  const intended = new Set([...inventory.functions, ...Object.keys(inventory.aliases)].map(name => `${library}.${name}`));
  for (const entry of entries.filter(entry => ['function', 'alias'].includes(entry.kind))) {
    if (!intended.has(entry.id)) throw Error(`Contract names a nonexistent public API: ${entry.id}`);
  }
  // Every public member of an explicitly documented receiver must be accounted for,
  // including unsupported hooks/stubs, so later additions cannot silently disappear.
  const symbols = new Set(entries.flatMap(entry => entry.sourceSymbols || []));
  const owners = new Set([...symbols].map(symbol => symbol.split('.')[0]));
  for (const owner of owners) {
    for (const definition of inventory.owners[owner] || []) {
      if (!entries.some(entry => entry.sources.includes(definition.source))) continue;
      for (const member of definition.members) {
        if (!symbols.has(member.symbol)) throw Error(`Uncovered public object member: ${library}.${member.symbol} (${definition.source})`);
      }
    }
  }
  if (receiverPolicy) {
    for (const receiver of receiverPolicy) {
      const definition = (inventory.owners[receiver.name] || []).find(value => value.source === receiver.source);
      if (!definition) throw Error(`Receiver policy does not match pinned source: ${library}.${receiver.name}`);
      const expected = [...definition.members.map(member => member.symbol), ...receiver.properties.map(name => `${receiver.name}.${name}`), ...(receiver.extraSymbols || [])];
      for (const symbol of expected) {
        if (!entries.some(entry => entry.sources.includes(receiver.source) && (entry.sourceSymbols || []).includes(symbol))) {
          throw Error(`Uncovered intended receiver member: ${library}.${symbol}`);
        }
      }
      for (const name of receiver.properties) {
        if (!definition.fields.includes(name) && !definition.members.some(member => member.kind === 'property' && member.symbol === `${receiver.name}.${name}`)) {
          throw Error(`Receiver policy names an absent property: ${library}.${receiver.name}.${name}`);
        }
      }
    }
  }
  return entries;
}

function buildLibraryReferences(root = repositoryRoot) {
  const extension = path.join(root, 'kafe-vscode'), runtime = JSON.parse(read(path.join(extension, 'src/runtimeManifest.json'))).runtime;
  const inventory = apiInventory(root), entries = [], contracts = [], isolatedFixtures = [];
  const currentFingerprint = sourceFingerprint(path.join(root, 'src'));
  const pinnedFingerprint = runtimeSourceFingerprint(root, runtime.sourceRevision);
  if (currentFingerprint !== pinnedFingerprint) throw Error('Library contracts must target the actual pinned runtime source; resolve source/version drift before bundling.');
  const surfacePath = 'kafe-vscode/reference/library-surface.json';
  const surface = JSON.parse(read(path.join(root, surfacePath)));
  if (surface.schemaVersion !== 1 || surface.reviewedSourceFingerprint !== pinnedFingerprint || surface.runtimeSourceRevision !== runtime.sourceRevision) throw Error('The intended receiver policy needs review for this pinned runtime.');
  contracts.push([surfacePath, digest(read(path.join(root, surfacePath)))]);
  for (const library of ['machine', 'gesha']) {
    const filename = `kafe-vscode/reference/${library}-api.json`;
    const document = JSON.parse(read(path.join(root, filename)));
    if (document.reviewedSourceFingerprint !== pinnedFingerprint || document.runtimeSourceRevision !== runtime.sourceRevision) {
      throw Error(`The ${library} contracts need explicit review for this pinned source revision; regeneration cannot renew that attestation.`);
    }
    entries.push(...validateContracts(document, library, inventory[library], root, surface.receivers[library]));
    contracts.push([filename, digest(read(path.join(root, filename)))]);
    for (const item of document.isolatedFixtures || []) {
      paths([item.path, ...(item.assets || [])], root, 'isolated fixture');
      if (!item.path.startsWith('tests/') || !item.path.endsWith('.kf') || typeof item.writes !== 'boolean') throw Error('Invalid isolated fixture classification');
      isolatedFixtures.push(item);
    }
  }
  const ids = new Set(entries.map(entry => entry.id));
  for (const entry of entries) for (const related of entry.related) if (!ids.has(related)) throw Error(`Unknown related API: ${related}`);
  const topicsPath = 'kafe-vscode/reference/learning-topics.json';
  const topics = validateLearningTopics(JSON.parse(read(path.join(root, topicsPath))));
  if (topics.length !== LEARNING_TOPIC_IDS.length || LEARNING_TOPIC_IDS.some(id => !topics.some(topic => topic.id === id))) throw Error('Uncovered learning objective in bundled topics');
  for (const topic of topics) for (const id of topic.apiIds) if (!ids.has(id)) throw Error(`Unknown learning topic API: ${id}`);
  contracts.push([topicsPath, digest(read(path.join(root, topicsPath)))]);
  const corpus = collectKnowledgeCorpusSync({ sourceRoot: root });
  const corpusInputs = corpus.map(file => [file.relative, digest(file.bytes.toString('utf8').replace(/\r\n/g, '\n'))]);
  const docs = corpus.filter(file => /^(?:libraries\/(?:machine|gesha)(?:\/|\.md)|examples\/tutorials\/)/.test(file.relative));
  const units = [], omittedUnits = [];
  for (const file of docs) {
    const raw = file.bytes.toString('utf8').replace(/\r\n/g, '\n').replace(/--8<--\s+"([^"\r\n]+)"/g, (_match, include) => {
      if (!relativePath(include) || !corpus.some(item => path.resolve(item.sourcePath) === path.resolve(root, include))) throw Error(`Unreviewed documentation include: ${include}`);
      return read(path.join(root, include));
    });
    // The exact runnable .kf sources stay intact and are never partially presented.
    const content = file.relative.endsWith('.kf') ? `\`\`\`kafe\n${raw}\n\`\`\`` : raw;
    for (const unit of extractAtomicUnits(content, { path: file.relative, maxChars: 4000,
      onOmitted: omission => omittedUnits.push({ path: file.relative, ...omission }) })) {
      units.push({ id: `doc:${file.relative}#${unit.index}`, path: file.relative, text: unit.text });
    }
  }
  const sidecars = entries.flatMap(entry => entry.examples.flatMap(example => ['.expec', '.stdout.expec', '.stderr.expec', '.in']
    .map(suffix => example.slice(0, -3) + suffix).filter(filename => fs.existsSync(path.join(root, filename)))));
  const inputPaths = [...new Set([...entries.flatMap(entry => [...entry.sources, ...entry.examples, ...entry.evidence]), ...sidecars,
    ...isolatedFixtures.flatMap(item => [item.path, ...(item.assets || [])])])].sort();
  const evidenceInputs = inputPaths.map(filename => [filename, digest(read(path.join(root, filename)))]);
  const body = { schemaVersion: 1, referenceVersion: 1, runtimeVersion: runtime.version,
    runtimeSourceRevision: runtime.sourceRevision, sourceFingerprint: currentFingerprint, runtimeSourceFingerprint: pinnedFingerprint,
    corpusFingerprint: digest(JSON.stringify(corpusInputs)), contractFingerprint: digest(JSON.stringify(contracts)),
    evidenceFingerprint: digest(JSON.stringify(evidenceInputs)), entries, topics, units, omittedUnits, isolatedFixtures,
    inventory: Object.fromEntries(Object.entries(inventory).map(([library, value]) => [library, { functions: value.functions, aliases: value.aliases }])) };
  return { ...body, contentSha256: digest(JSON.stringify(body)) };
}

function main() {
  const target = path.join(repositoryRoot, 'kafe-vscode/src/tutor/libraryReferences.json');
  const built = buildLibraryReferences(), encoded = JSON.stringify(built, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || read(target) !== encoded) throw Error('Bundled library references are stale. Run references:build and verify the pinned-runtime evidence.');
  } else fs.writeFileSync(target, encoded);
  console.log(`MACHINE/GESHA coverage: ${built.inventory.machine.functions.length} MACHINE calls, ${built.inventory.gesha.functions.length} GESHA calls, ${Object.keys(built.inventory.gesha.aliases).length} aliases; ${built.entries.length} contracts and ${built.units.length} documentation units.`);
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { buildLibraryReferences, validateContracts, entryText, apiInventory };
