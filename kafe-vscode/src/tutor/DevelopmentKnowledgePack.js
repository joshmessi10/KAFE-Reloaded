const { createHash } = require('node:crypto');
const defaultFileSystem = require('node:fs/promises');
const path = require('node:path');

const KNOWLEDGE_SECTIONS = ['getting-started', 'language', 'libraries', 'specification', 'errors', 'examples'];
const REQUIRED_MARKERS = ['pyproject.toml', 'uv.lock', 'src/Kafe.py'];
const GRAMMAR_FILES = ['Kafe_Grammar.g4', 'Kafe_Lexer.g4'];
const MAX_FILES = 512;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function safeSegment(name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' ||
    name.includes('/') || name.includes('\\') || name.endsWith('.') || name.endsWith(' ') ||
    /[<>:"|?*\u0000-\u001f]/.test(name) || WINDOWS_RESERVED_NAME.test(name)) {
    throw new Error(`Unsafe KAFE knowledge-pack path segment: ${String(name)}`);
  }
  if (name.normalize('NFC') !== name) throw new Error(`Non-canonical KAFE knowledge-pack path segment: ${name}`);
  return name.toLowerCase();
}

function digestEntries(entries) {
  const hash = createHash('sha256');
  for (const entry of [...entries].sort((left, right) => comparePaths(left.relative, right.relative))) {
    const name = Buffer.from(entry.relative, 'utf8');
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(entry.bytes.length));
    hash.update(name);
    hash.update(Buffer.from([0]));
    hash.update(length);
    hash.update(entry.bytes);
  }
  return hash.digest('hex');
}

function withinDirectory(pathApi, root, candidate) {
  const relative = pathApi.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${pathApi.sep}`) && relative !== '..' && !pathApi.isAbsolute(relative));
}

async function pathInfo(fileSystem, filePath, expectedType, description) {
  let info;
  try { info = await fileSystem.lstat(filePath); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Missing KAFE development knowledge input: ${description}`);
    throw error;
  }
  if (info.isSymbolicLink?.()) throw new Error(`KAFE development knowledge input must not be a symbolic link: ${description}`);
  const matches = expectedType === 'directory' ? info.isDirectory() : info.isFile();
  if (!matches) throw new Error(`KAFE development knowledge input is not a regular ${expectedType}: ${description}`);
  return info;
}

async function readBoundedFile(fileSystem, filePath, relative, totals) {
  const info = await pathInfo(fileSystem, filePath, 'file', relative);
  if (!Number.isSafeInteger(info.size) || info.size < 0 || info.size > MAX_FILE_BYTES) {
    throw new Error(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${relative}`);
  }
  const bytes = await fileSystem.readFile(filePath);
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (value.length !== info.size) throw new Error(`KAFE development knowledge file changed while being read: ${relative}`);
  if (value.length > MAX_FILE_BYTES) throw new Error(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${relative}`);
  totals.bytes += value.length;
  if (totals.bytes > MAX_TOTAL_BYTES) {
    throw new Error(`KAFE development knowledge pack exceeds the ${MAX_TOTAL_BYTES} byte total size limit.`);
  }
  return value;
}

async function collectSourceEntries({ fileSystem, pathApi, sourceRoot }) {
  await pathInfo(fileSystem, sourceRoot, 'directory', 'KAFE checkout root');
  await pathInfo(fileSystem, pathApi.join(sourceRoot, 'kafe-vscode'), 'directory', 'KAFE extension directory');
  for (const marker of REQUIRED_MARKERS) {
    await pathInfo(fileSystem, pathApi.join(sourceRoot, marker), 'file', marker);
  }

  const entries = [];
  const pathSpellings = new Map();
  const totals = { bytes: 0 };
  const reservePath = relative => {
    let prefix = '';
    for (const segment of relative.split('/')) {
      safeSegment(segment);
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const folded = prefix.toLowerCase();
      const existing = pathSpellings.get(folded);
      if (existing && existing !== prefix) throw new Error(`Duplicate case-insensitive KAFE knowledge-pack path: ${prefix}`);
      pathSpellings.set(folded, prefix);
    }
  };
  const collectSection = async (section, directory, prefix = '') => {
    await pathInfo(fileSystem, directory, 'directory', `docs/${section}${prefix ? `/${prefix}` : ''}`);
    let sectionCount = 0;
    const walk = async (current, relativeDirectory) => {
      const items = await fileSystem.readdir(current, { withFileTypes: true });
      for (const item of items) {
        safeSegment(item.name);
        const relative = relativeDirectory ? `${relativeDirectory}/${item.name}` : item.name;
        const sourcePath = pathApi.join(current, item.name);
        const info = await fileSystem.lstat(sourcePath);
        if (info.isSymbolicLink?.() || item.isSymbolicLink?.()) {
          throw new Error(`KAFE learner documentation must not contain symbolic links: docs/${section}/${relative}`);
        }
        if (info.isDirectory()) {
          reservePath(`${section}/${relative}`);
          await walk(sourcePath, relative);
          continue;
        }
        if (!info.isFile()) throw new Error(`Unsupported special file in KAFE learner documentation: docs/${section}/${relative}`);
        const extension = pathApi.extname(item.name).toLowerCase();
        const allowed = extension === '.md' || (section === 'examples' && extension === '.kf');
        if (!allowed) throw new Error(`Unsupported file in KAFE learner documentation: docs/${section}/${relative}`);
        const targetRelative = `${section}/${relative}`;
        reservePath(targetRelative);
        const bytes = await readBoundedFile(fileSystem, sourcePath, `docs/${section}/${relative}`, totals);
        entries.push({ relative: targetRelative, bytes });
        sectionCount++;
        if (entries.length > MAX_FILES - GRAMMAR_FILES.length) {
          throw new Error(`KAFE development knowledge pack exceeds the ${MAX_FILES} file limit.`);
        }
      }
    };
    await walk(directory, prefix);
    if (sectionCount === 0) throw new Error(`Empty required KAFE learner documentation section: docs/${section}`);
  };

  const docsRoot = pathApi.join(sourceRoot, 'docs');
  await pathInfo(fileSystem, docsRoot, 'directory', 'docs');
  for (const section of KNOWLEDGE_SECTIONS) {
    await collectSection(section, pathApi.join(docsRoot, section));
  }
  const sourceGrammarRoot = pathApi.join(sourceRoot, 'src');
  await pathInfo(fileSystem, sourceGrammarRoot, 'directory', 'src');
  for (const filename of GRAMMAR_FILES) {
    const relative = `grammar/${filename}`;
    reservePath(relative);
    const bytes = await readBoundedFile(fileSystem, pathApi.join(sourceGrammarRoot, filename), `src/${filename}`, totals);
    entries.push({ relative, bytes });
  }
  if (entries.length > MAX_FILES) throw new Error(`KAFE development knowledge pack exceeds the ${MAX_FILES} file limit.`);
  return entries.sort((left, right) => comparePaths(left.relative, right.relative));
}

async function collectCachedEntries({ fileSystem, pathApi, knowledgeRoot }) {
  await pathInfo(fileSystem, knowledgeRoot, 'directory', 'cached knowledge-pack root');
  const entries = [];
  const foldedPaths = new Set();
  const totals = { bytes: 0 };
  const walk = async (current, prefix = '') => {
    const items = await fileSystem.readdir(current, { withFileTypes: true });
    for (const item of items) {
      const segment = safeSegment(item.name);
      const relative = prefix ? `${prefix}/${item.name}` : item.name;
      const foldedPath = prefix ? `${prefix.toLowerCase()}/${segment}` : segment;
      if (foldedPaths.has(foldedPath)) throw new Error(`Cached KAFE knowledge pack has duplicate paths: ${relative}`);
      foldedPaths.add(foldedPath);
      const filePath = pathApi.join(current, item.name);
      const info = await fileSystem.lstat(filePath);
      if (info.isSymbolicLink?.() || item.isSymbolicLink?.()) {
        throw new Error(`Cached KAFE knowledge pack contains a symbolic link: ${relative}`);
      }
      if (info.isDirectory()) {
        await walk(filePath, relative);
        continue;
      }
      if (!info.isFile()) throw new Error(`Cached KAFE knowledge pack contains an unsupported file: ${relative}`);
      if (entries.length >= MAX_FILES) throw new Error(`Cached KAFE knowledge pack exceeds the ${MAX_FILES} file limit.`);
      const bytes = await readBoundedFile(fileSystem, filePath, relative, totals);
      entries.push({ relative, bytes });
    }
  };
  await walk(knowledgeRoot);
  return entries.sort((left, right) => comparePaths(left.relative, right.relative));
}

class DevelopmentKnowledgePack {
  constructor({ extensionPath, storageRoot, runtimeVersion, knowledgePackVersion, sourceRevision,
    fileSystem = defaultFileSystem, pathApi = path }) {
    this.extensionPath = extensionPath;
    this.storageRoot = storageRoot;
    this.runtimeVersion = runtimeVersion;
    this.knowledgePackVersion = knowledgePackVersion;
    this.sourceRevision = sourceRevision;
    this.fileSystem = fileSystem;
    this.pathApi = pathApi;
  }

  validateConfiguration() {
    if (!this.extensionPath || !this.storageRoot) throw new Error('KAFE development knowledge-pack paths are unavailable.');
    if (!/^\d+\.\d+\.\d+$/.test(this.runtimeVersion || '') ||
      !/^\d+\.\d+\.\d+$/.test(this.knowledgePackVersion || '') ||
      this.runtimeVersion !== this.knowledgePackVersion) {
      throw new Error('KAFE runtime and knowledge-pack versions must match.');
    }
    if (!/^[a-f0-9]{7,40}$/i.test(this.sourceRevision || '')) {
      throw new Error('KAFE development knowledge-pack source revision is invalid.');
    }
    const sourceRoot = this.pathApi.resolve(this.pathApi.dirname(this.extensionPath));
    const storageRoot = this.pathApi.resolve(this.storageRoot);
    if (withinDirectory(this.pathApi, sourceRoot, storageRoot)) {
      throw new Error('KAFE development knowledge pack must be stored outside the KAFE checkout.');
    }
    return { sourceRoot, storageRoot };
  }

  async verifyCache({ targetRoot, metadataPath, expectedMetadata }) {
    await pathInfo(this.fileSystem, targetRoot, 'directory', 'cached pack directory');
    const actualMetadataInfo = await pathInfo(this.fileSystem, metadataPath, 'file', 'cached pack metadata');
    if (actualMetadataInfo.size > 16 * 1024) throw new Error('KAFE development knowledge-pack metadata exceeds its size limit.');
    let actualMetadata;
    try { actualMetadata = JSON.parse(await this.fileSystem.readFile(metadataPath, 'utf8')); }
    catch { throw new Error('KAFE development knowledge-pack metadata is invalid.'); }
    if (!actualMetadata || typeof actualMetadata !== 'object' || Array.isArray(actualMetadata)) {
      throw new Error('KAFE development knowledge-pack metadata is invalid.');
    }
    if (Object.keys(actualMetadata).length !== Object.keys(expectedMetadata).length) {
      throw new Error('KAFE development knowledge-pack metadata has unexpected fields.');
    }
    for (const [key, value] of Object.entries(expectedMetadata)) {
      if (actualMetadata[key] !== value) throw new Error(`KAFE development knowledge-pack metadata mismatch: ${key}.`);
    }
    const actualEntries = await collectCachedEntries({ fileSystem: this.fileSystem, pathApi: this.pathApi,
      knowledgeRoot: this.pathApi.join(targetRoot, 'knowledge-pack') });
    if (actualEntries.length !== expectedMetadata.fileCount || digestEntries(actualEntries) !== expectedMetadata.contentSha256) {
      throw new Error('KAFE development knowledge-pack cache integrity or digest mismatch.');
    }
    return { status: 'ready', knowledgeRoot: this.pathApi.join(targetRoot, 'knowledge-pack'),
      ...expectedMetadata, sourceMode: 'development' };
  }

  async getReadyPack() {
    const { sourceRoot, storageRoot } = this.validateConfiguration();
    const entries = await collectSourceEntries({ fileSystem: this.fileSystem, pathApi: this.pathApi, sourceRoot });
    const contentSha256 = digestEntries(entries);
    const expectedMetadata = { schemaVersion: 1, runtimeVersion: this.runtimeVersion,
      knowledgePackVersion: this.knowledgePackVersion, sourceRevision: this.sourceRevision,
      contentSha256, fileCount: entries.length };
    const baseRoot = this.pathApi.join(storageRoot, 'kafe-tutor-development');
    const cacheName = `${this.runtimeVersion}-${this.knowledgePackVersion}-${this.sourceRevision}-${contentSha256}`;
    const targetRoot = this.pathApi.join(baseRoot, cacheName);
    const metadataPath = this.pathApi.join(targetRoot, 'pack-metadata.json');

    await this.fileSystem.mkdir(baseRoot, { recursive: true });
    await pathInfo(this.fileSystem, storageRoot, 'directory', 'VS Code global storage root');
    await pathInfo(this.fileSystem, baseRoot, 'directory', 'development knowledge-pack storage');
    try {
      await this.fileSystem.lstat(targetRoot);
      return await this.verifyCache({ targetRoot, metadataPath, expectedMetadata });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const stageRoot = await this.fileSystem.mkdtemp(this.pathApi.join(baseRoot, '.stage-'));
    let promoted = false;
    try {
      const knowledgeRoot = this.pathApi.join(stageRoot, 'knowledge-pack');
      await this.fileSystem.mkdir(knowledgeRoot, { recursive: true });
      for (const entry of entries) {
        const destination = this.pathApi.join(knowledgeRoot, ...entry.relative.split('/'));
        await this.fileSystem.mkdir(this.pathApi.dirname(destination), { recursive: true });
        await this.fileSystem.writeFile(destination, entry.bytes, { flag: 'wx' });
      }
      await this.fileSystem.writeFile(this.pathApi.join(stageRoot, 'pack-metadata.json'),
        `${JSON.stringify(expectedMetadata, null, 2)}\n`, { flag: 'wx' });
      try {
        await this.fileSystem.rename(stageRoot, targetRoot);
        promoted = true;
      } catch (error) {
        try {
          await this.fileSystem.lstat(targetRoot);
          return await this.verifyCache({ targetRoot, metadataPath, expectedMetadata });
        } catch (targetError) {
          if (targetError.code === 'ENOENT') throw error;
          throw targetError;
        }
      }
      return await this.verifyCache({ targetRoot, metadataPath, expectedMetadata });
    } finally {
      if (!promoted) await this.fileSystem.rm(stageRoot, { recursive: true, force: true });
    }
  }
}

module.exports = { DevelopmentKnowledgePack, KNOWLEDGE_SECTIONS, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES };
