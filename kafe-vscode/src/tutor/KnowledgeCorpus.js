const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const KNOWLEDGE_MANIFEST = require('../../reference/knowledge-corpus.json');

const KNOWLEDGE_CORPUS_PATH = require.resolve('../../reference/knowledge-corpus.json');
const MAX_FILES = 512;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_NODES = 4096;
const TEXT_EXTENSIONS = new Set(['.md', '.kf', '.g4', '.txt']);
const RESERVED = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const comparePaths = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function safeSegment(name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' ||
    /[\\/<>:"|?*\u0000-\u001f]/.test(name) || /[. ]$/.test(name) || RESERVED.test(name) || name.normalize('NFC') !== name) {
    throw Error(`Unsafe KAFE knowledge-pack path segment: ${String(name)}`);
  }
  return name.toLowerCase();
}

function safeRelative(relative) {
  if (typeof relative !== 'string' || !relative) throw Error('Invalid KAFE knowledge corpus path.');
  return relative.split('/').map(safeSegment).join('/');
}

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.sections) || !Array.isArray(manifest.files)) {
    throw Error('Invalid KAFE knowledge corpus manifest.');
  }
  const targets = new Set();
  for (const entry of [...manifest.sections, ...manifest.files]) {
    safeRelative(entry.source);
    const target = safeRelative(entry.target);
    if (targets.has(target)) throw Error('Duplicate KAFE knowledge corpus target.');
    targets.add(target);
  }
  for (const section of manifest.sections) {
    if (typeof section.required !== 'boolean' || !Array.isArray(section.extensions) || !section.extensions.length ||
      section.extensions.some(extension => !TEXT_EXTENSIONS.has(extension)) ||
      !Array.isArray(section.excludedExtensions || []) ||
      (section.excludedExtensions || []).some(extension => extension !== '.svg' || section.extensions.includes(extension))) {
      throw Error('Invalid KAFE knowledge corpus extension policy.');
    }
  }
  for (const entry of manifest.files) {
    if (!TEXT_EXTENSIONS.has(path.extname(entry.source)) || !TEXT_EXTENSIONS.has(path.extname(entry.target))) {
      throw Error('Unsupported fixed KAFE knowledge corpus file.');
    }
  }
  return manifest;
}

const REQUIRED_SECTIONS = Object.freeze(validateManifest(KNOWLEDGE_MANIFEST).sections.filter(section => section.required).map(section => section.target));

function collector({ sourceRoot, pathApi = path, manifest = KNOWLEDGE_MANIFEST }) {
  validateManifest(manifest);
  const entries = [], seen = new Map(); let bytes = 0, nodes = 0;
  const reserve = relative => {
    let prefix = '';
    for (const segment of relative.split('/')) {
      safeSegment(segment);
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const folded = prefix.toLowerCase(), previous = seen.get(folded);
      if (previous && previous !== prefix) throw Error(`Duplicate case-insensitive KAFE knowledge-pack path: ${prefix}`);
      seen.set(folded, prefix);
    }
  };
  return {
    entries, manifest,
    absolute: relative => pathApi.join(sourceRoot, ...relative.split('/')),
    node(name, info) {
      if (++nodes > MAX_NODES) throw Error('KAFE knowledge corpus node limit exceeded.');
      if (info.isSymbolicLink?.()) throw Error(`KAFE knowledge input must not be a symbolic link: ${name}`);
    },
    add(sourcePath, relative, value, size) {
      reserve(relative);
      if (entries.some(entry => entry.relative.toLowerCase() === relative.toLowerCase())) throw Error('Duplicate KAFE knowledge corpus file.');
      if (!Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES || value.length !== size) throw Error(`KAFE knowledge file exceeds its size limit or changed: ${relative}`);
      bytes += value.length;
      if (bytes > MAX_TOTAL_BYTES || entries.length >= MAX_FILES) throw Error('KAFE knowledge corpus file or total byte limit exceeded.');
      entries.push({ relative, sourcePath, bytes: Buffer.from(value) });
    },
    reserve,
    finish: () => entries.sort((a, b) => comparePaths(a.relative, b.relative)),
  };
}

function selectedExtension(section, filename) {
  const extension = path.extname(filename).toLowerCase();
  if (section.extensions.includes(extension)) return true;
  if ((section.excludedExtensions || []).includes(extension)) return false;
  throw Error(`Unsupported file in KAFE learner documentation: ${filename}`);
}

async function collectKnowledgeCorpus({ sourceRoot, fileSystem = fsPromises, pathApi = path, manifest = KNOWLEDGE_MANIFEST }) {
  const state = collector({ sourceRoot, pathApi, manifest });
  const info = async (filename, directory) => {
    const stat = await fileSystem.lstat(filename); state.node(filename, stat);
    if (directory ? !stat.isDirectory() : !stat.isFile()) throw Error(`KAFE knowledge input is not a regular ${directory ? 'directory' : 'file'}: ${filename}`);
    return stat;
  };
  await info(sourceRoot, true);
  const sourcePath = async (relative, directory) => {
    const parts = relative.split('/');
    for (let count = 1; count <= parts.length; count++) await info(state.absolute(parts.slice(0, count).join('/')), count < parts.length || directory);
  };
  const add = async (source, relative) => {
    const stat = await info(source, false);
    if (stat.size > MAX_FILE_BYTES) throw Error(`KAFE knowledge file exceeds its size limit: ${relative}`);
    const value = await fileSystem.readFile(source); state.add(source, relative, Buffer.from(value), stat.size);
  };
  const walk = async (directory, prefix, section) => {
    for (const item of await fileSystem.readdir(directory, { withFileTypes: true })) {
      safeSegment(item.name);
      const source = pathApi.join(directory, item.name), relative = `${prefix}/${item.name}`;
      const stat = await fileSystem.lstat(source); state.node(source, stat);
      if (item.isSymbolicLink?.()) throw Error(`KAFE knowledge input must not be a symbolic link: ${source}`);
      state.reserve(relative);
      if (stat.isDirectory()) await walk(source, relative, section);
      else if (!stat.isFile()) throw Error(`Unsupported special file in KAFE knowledge corpus: ${source}`);
      else if (selectedExtension(section, item.name)) await add(source, relative);
    }
  };
  for (const section of state.manifest.sections) {
    try { await sourcePath(section.source, true); }
    catch (error) { if (!section.required && error.code === 'ENOENT') continue; throw error; }
    const before = state.entries.length;
    await walk(state.absolute(section.source), section.target, section);
    if (section.required && before === state.entries.length) throw Error(`Empty required KAFE learner documentation section: ${section.source}`);
  }
  for (const entry of state.manifest.files) {
    await sourcePath(entry.source, false); await add(state.absolute(entry.source), entry.target);
  }
  return state.finish();
}

function collectKnowledgeCorpusSync({ sourceRoot, fileSystem = fs, pathApi = path, manifest = KNOWLEDGE_MANIFEST }) {
  const state = collector({ sourceRoot, pathApi, manifest });
  const info = (filename, directory) => {
    const stat = fileSystem.lstatSync(filename); state.node(filename, stat);
    if (directory ? !stat.isDirectory() : !stat.isFile()) throw Error(`KAFE knowledge input is not a regular ${directory ? 'directory' : 'file'}: ${filename}`);
    return stat;
  };
  info(sourceRoot, true);
  const sourcePath = (relative, directory) => {
    const parts = relative.split('/');
    for (let count = 1; count <= parts.length; count++) info(state.absolute(parts.slice(0, count).join('/')), count < parts.length || directory);
  };
  const add = (source, relative) => {
    const stat = info(source, false);
    if (stat.size > MAX_FILE_BYTES) throw Error(`KAFE knowledge file exceeds its size limit: ${relative}`);
    state.add(source, relative, fileSystem.readFileSync(source), stat.size);
  };
  const walk = (directory, prefix, section) => {
    for (const item of fileSystem.readdirSync(directory, { withFileTypes: true })) {
      safeSegment(item.name);
      const source = pathApi.join(directory, item.name), relative = `${prefix}/${item.name}`;
      const stat = fileSystem.lstatSync(source); state.node(source, stat);
      if (item.isSymbolicLink?.()) throw Error(`KAFE knowledge input must not be a symbolic link: ${source}`);
      state.reserve(relative);
      if (stat.isDirectory()) walk(source, relative, section);
      else if (!stat.isFile()) throw Error(`Unsupported special file in KAFE knowledge corpus: ${source}`);
      else if (selectedExtension(section, item.name)) add(source, relative);
    }
  };
  for (const section of state.manifest.sections) {
    try { sourcePath(section.source, true); }
    catch (error) { if (!section.required && error.code === 'ENOENT') continue; throw error; }
    const before = state.entries.length;
    walk(state.absolute(section.source), section.target, section);
    if (section.required && before === state.entries.length) throw Error(`Empty required KAFE learner documentation section: ${section.source}`);
  }
  for (const entry of state.manifest.files) { sourcePath(entry.source, false); add(state.absolute(entry.source), entry.target); }
  return state.finish();
}

module.exports = { KNOWLEDGE_MANIFEST, KNOWLEDGE_CORPUS_PATH, REQUIRED_SECTIONS, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
  safeSegment, safeRelative, validateManifest, collectKnowledgeCorpus, collectKnowledgeCorpusSync };
