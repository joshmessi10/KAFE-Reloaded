const { createHash } = require('node:crypto');
const defaultFileSystem = require('node:fs/promises');
const nativeFileSystem = require('node:fs');
const path = require('node:path');

const MAX_FILES = 512;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_CONTEXT_ITEMS = 21;
const MAX_CONTEXT_ITEM_CHARS = 2000;
const MAX_QUERY_TERMS = 100;
const KAFE_SYNTAX_KEYWORDS = new Set(['for', 'if', 'in', 'while']);
const SYNTAX_INTENT_WORDS = new Set(['code', 'condition', 'conditional', 'expression', 'grammar', 'keyword', 'loop', 'loops', 'operator', 'statement', 'syntax']);
const ALLOWED_EXTENSIONS = new Set(['.md', '.kf', '.g4', '.txt']);
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const AVAILABILITY_CODES = new Set(['knowledge_missing', 'knowledge_integrity_failed', 'knowledge_unavailable', 'trust_unavailable']);
const STOP_WORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before',
  'being', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few',
  'for', 'from', 'further', 'get', 'getting', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'let', 'lets', 'me', 'more', 'most', 'my', 'no', 'nor', 'not',
  'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'please', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'start', 'started',
  'begin', 'beginning', 'first', 'next', 'step', 'steps', 'help', 'please',
]);

function searchTokens(value) {
  return value.replace(/https?:\/\/[^\s/]+/gi, ' ').toLowerCase().match(/[a-z0-9_]+/g) || [];
}

function validateSegment(name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' ||
    name.includes('/') || name.includes('\\') || name.endsWith('.') || name.endsWith(' ') ||
    /[<>:"|?*\u0000-\u001f]/.test(name) || WINDOWS_RESERVED_NAME.test(name)) {
    throw new Error(`Unsafe KAFE development knowledge-pack path segment: ${String(name)}`);
  }
  if (name.normalize('NFC') !== name) throw new Error(`Non-canonical KAFE development knowledge-pack path segment: ${name}`);
  return name.toLowerCase();
}

// Canonical knowledge-tree identity shared by verified archive members and retrieval.
function knowledgeContentDigest(files) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_FILES) throw new Error('KAFE knowledge-pack file count is invalid.');
  const hash = createHash('sha256');
  let totalBytes = 0;
  const seen = new Set();
  const ordered = [...files].sort((a, b) => a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0);
  for (const file of ordered) {
    if (typeof file.relative !== 'string' || !file.relative || !Buffer.isBuffer(file.bytes)) throw new Error('KAFE knowledge member is invalid.');
    const segments = file.relative.split('/');
    const folded = segments.map(validateSegment).join('/');
    if (seen.has(folded) || !ALLOWED_EXTENSIONS.has(path.extname(file.relative).toLowerCase()) ||
      file.bytes.length > MAX_FILE_BYTES) throw new Error('KAFE knowledge member is invalid.');
    seen.add(folded);
    totalBytes += file.bytes.length;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('KAFE knowledge-pack total size exceeds the limit.');
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(file.bytes.length));
    hash.update(Buffer.from(file.relative, 'utf8'));
    hash.update(Buffer.from([0]));
    hash.update(length);
    hash.update(file.bytes);
  }
  return { contentSha256: hash.digest('hex'), fileCount: ordered.length };
}

/** Owner-issued native boundary proof, re-reading current bytes synchronously, never a cached epoch.
 * Trees retain the retrieval limits (512 files, 256 KiB/file, 8 MiB total) and cap all nodes at 4096.
 * Integrity artifacts are streamed in 64 KiB chunks up to their owner's explicit bound.
 */
function createKnowledgeAuthority({ knowledgeRoot, expectedContentSha256, expectedFileCount,
  expectedKnowledgeTree, sourceTrees = [], sourceFiles = [], requiredPaths = [], integrityFiles = [], configurationCurrent = () => true,
  fileSystem = nativeFileSystem }) {
  // Managed readiness owns exact archive membership, including declared empty directories.
  const knowledgeTree = expectedKnowledgeTree && new Map([...expectedKnowledgeTree].map(([relative, entry]) => [relative, entry.type]));
  const readFile = (filename, maximum, consume) => {
    const info = fileSystem.lstatSync(filename);
    if (!info.isFile() || info.isSymbolicLink() || !Number.isSafeInteger(info.size) || info.size < 0 || info.size > maximum) throw new Error('Unavailable knowledge authority file.');
    const fd = fileSystem.openSync(filename, fileSystem.constants.O_RDONLY | (fileSystem.constants.O_NOFOLLOW || 0));
    try {
      const opened = fileSystem.fstatSync(fd);
      if (!opened.isFile() || opened.size !== info.size) throw new Error('Knowledge authority file changed.');
      const chunk = Buffer.alloc(Math.min(64 * 1024, Math.max(1, info.size)));
      let bytes = 0;
      for (;;) {
        const count = fileSystem.readSync(fd, chunk, 0, chunk.length, null);
        if (!count) break;
        bytes += count;
        if (bytes > maximum || bytes > info.size) throw new Error('Knowledge authority read exceeded its bound.');
        consume(chunk.subarray(0, count));
      }
      if (bytes !== info.size || fileSystem.fstatSync(fd).size !== info.size) throw new Error('Knowledge authority file changed.');
    } finally { fileSystem.closeSync(fd); }
  };
  const readTree = (trees, fixedFiles = [], expectedTree) => {
    const files = [], seen = new Set(); let nodes = 0, total = 0;
    const add = (filename, relative) => {
      if (files.length >= MAX_FILES) throw new Error('Knowledge authority file limit.');
      const chunks = []; readFile(filename, MAX_FILE_BYTES, chunk => { total += chunk.length; if (total > MAX_TOTAL_BYTES) throw new Error('Knowledge authority byte limit.'); chunks.push(Buffer.from(chunk)); });
      files.push({ relative, bytes: Buffer.concat(chunks) });
    };
    const visit = (root, prefix, extensions) => {
      const info = fileSystem.lstatSync(root);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Unavailable knowledge authority tree.');
      for (const item of fileSystem.readdirSync(root, { withFileTypes: true })) {
        if (++nodes > 4096) throw new Error('Knowledge authority node limit.');
        const relative = prefix ? `${prefix}/${item.name}` : item.name;
        const folded = relative.split('/').map(validateSegment).join('/');
        if (seen.has(folded)) throw new Error('Duplicate knowledge authority path.');
        seen.add(folded);
        const filename = path.join(root, item.name), stat = fileSystem.lstatSync(filename);
        if (stat.isSymbolicLink() || item.isSymbolicLink()) throw new Error('Linked knowledge authority input.');
        if (expectedTree && expectedTree.get(relative) !== (stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : undefined)) throw new Error('Knowledge authority inventory changed.');
        if (stat.isDirectory()) visit(filename, relative, extensions);
        else if (stat.isFile() && (!extensions || extensions.includes(path.extname(item.name).toLowerCase()))) add(filename, relative);
        else throw new Error('Unsupported knowledge authority input.');
      }
    };
    for (const tree of trees) visit(tree.root, tree.prefix || '', tree.extensions);
    for (const file of fixedFiles) add(file.path, file.relative);
    if (expectedTree && seen.size !== expectedTree.size) throw new Error('Knowledge authority inventory changed.');
    return knowledgeContentDigest(files);
  };
  const matches = digest => digest.fileCount === expectedFileCount && digest.contentSha256 === expectedContentSha256;
  return Object.freeze({ isCurrent() {
    try {
      if (configurationCurrent() !== true) return false;
      for (const required of requiredPaths) {
        const info = fileSystem.lstatSync(required.path);
        if (info.isSymbolicLink() || (required.directory ? !info.isDirectory() : !info.isFile())) return false;
      }
      if (!matches(readTree([{ root: knowledgeRoot }], [], knowledgeTree))) return false;
      if (sourceTrees.length && !matches(readTree(sourceTrees, sourceFiles))) return false;
      for (const input of integrityFiles) {
        const hash = createHash('sha256'), chunks = [];
        readFile(input.path, input.maxBytes, chunk => { hash.update(chunk); if (input.validate) chunks.push(Buffer.from(chunk)); });
        if (input.sha256 && hash.digest('hex') !== input.sha256) return false;
        if (input.validate && input.validate(Buffer.concat(chunks)) !== true) return false;
      }
      return configurationCurrent() === true;
    } catch { return false; }
  } });
}

class KnowledgeUnavailable extends Error {
  constructor(code) {
    super('KAFE knowledge is unavailable.');
    this.name = 'KnowledgeUnavailable';
    this.code = AVAILABILITY_CODES.has(code) ? code : 'knowledge_unavailable';
  }
}

class KnowledgeIntegrityError extends Error {}

class KnowledgeRetriever {
  constructor({ knowledgeRoot, runtimeVersion, knowledgePackVersion, expectedRuntimeVersion,
    expectedKnowledgePackVersion, expectedContentSha256, expectedFileCount, fileSystem = defaultFileSystem }) {
    this.knowledgeRoot = knowledgeRoot;
    this.runtimeVersion = runtimeVersion;
    this.knowledgePackVersion = knowledgePackVersion;
    this.expectedRuntimeVersion = expectedRuntimeVersion;
    this.expectedKnowledgePackVersion = expectedKnowledgePackVersion;
    this.expectedContentSha256 = expectedContentSha256;
    this.expectedFileCount = expectedFileCount;
    this.fileSystem = fileSystem;
  }

  async search(query, relatedContext = []) {
    if (typeof this.knowledgeRoot !== 'string' || path.basename(this.knowledgeRoot) !== 'knowledge-pack') {
      throw new Error('A managed knowledge-pack root is required.');
    }
    if (!this.runtimeVersion || !this.knowledgePackVersion || !this.expectedRuntimeVersion ||
      !this.expectedKnowledgePackVersion || this.runtimeVersion !== this.expectedRuntimeVersion ||
      this.knowledgePackVersion !== this.expectedKnowledgePackVersion || this.runtimeVersion !== this.knowledgePackVersion) {
      throw new Error('KAFE runtime and knowledge-pack versions are missing or mismatched.');
    }
    if (typeof query !== 'string' || !query.trim() || query.length > 300) throw new Error('Invalid KAFE knowledge query.');
    if (!Array.isArray(relatedContext) || relatedContext.length > MAX_CONTEXT_ITEMS ||
      relatedContext.some(item => typeof item !== 'string' || item.length > MAX_CONTEXT_ITEM_CHARS)) {
      throw new Error('Invalid KAFE knowledge search context.');
    }
    const rootInfo = await this.fileSystem.lstat(this.knowledgeRoot);
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink?.()) throw new KnowledgeIntegrityError('KAFE knowledge-pack root is unavailable.');
    const verifyIntegrity = this.expectedContentSha256 !== undefined || this.expectedFileCount !== undefined;
    const files = [];
    const seenPaths = new Map();
    const reservePath = relative => {
      let prefix = '';
      let foldedPrefix = '';
      for (const segment of relative.split('/')) {
        let foldedSegment;
        try { foldedSegment = validateSegment(segment); }
        catch (error) { throw new KnowledgeIntegrityError(error.message); }
        prefix = prefix ? `${prefix}/${segment}` : segment;
        foldedPrefix = foldedPrefix ? `${foldedPrefix}/${foldedSegment}` : foldedSegment;
        const existing = seenPaths.get(foldedPrefix);
        if (existing && existing !== prefix) throw new KnowledgeIntegrityError(`KAFE development knowledge-pack has duplicate paths: ${prefix}`);
        seenPaths.set(foldedPrefix, prefix);
      }
    };
    const visit = async (directory, prefix = '') => {
      for (const entry of await this.fileSystem.readdir(directory, { withFileTypes: true })) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (verifyIntegrity) reservePath(relative);
        else if (!entry.name || entry.name === '.' || entry.name === '..' || entry.name.includes('/') || entry.name.includes('\\')) continue;
        if (entry.isSymbolicLink?.()) {
          if (verifyIntegrity) throw new KnowledgeIntegrityError(`KAFE development knowledge pack contains a symbolic link: ${relative}`);
          continue;
        }
        const absolute = path.join(directory, entry.name);
        const info = await this.fileSystem.lstat(absolute);
        if (info.isSymbolicLink?.()) {
          if (verifyIntegrity) throw new KnowledgeIntegrityError(`KAFE development knowledge pack contains a symbolic link: ${relative}`);
          continue;
        }
        if (info.isDirectory()) await visit(absolute, relative);
        else if (info.isFile()) {
          const extension = path.extname(entry.name).toLowerCase();
          if (!ALLOWED_EXTENSIONS.has(extension)) {
            if (verifyIntegrity) throw new KnowledgeIntegrityError(`KAFE development knowledge pack contains an unexpected file: ${relative}`);
            continue;
          }
          if (!Number.isSafeInteger(info.size) || info.size < 0 || info.size > MAX_FILE_BYTES) {
            if (verifyIntegrity) throw new KnowledgeIntegrityError(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${relative}`);
            continue;
          }
          files.push({ absolute, relative, size: info.size });
        } else if (verifyIntegrity) {
          throw new KnowledgeIntegrityError(`KAFE development knowledge pack contains an unsupported special file: ${relative}`);
        }
        if (files.length > MAX_FILES) throw new KnowledgeIntegrityError('KAFE knowledge-pack file limit exceeded.');
      }
    };
    await visit(this.knowledgeRoot);
    const queryWords = [...new Set(searchTokens(query).filter(word =>
      (word.length > 2 && !STOP_WORDS.has(word)) || KAFE_SYNTAX_KEYWORDS.has(word)))].slice(0, MAX_QUERY_TERMS);
    const queryIsSyntax = queryWords.includes('if') ||
      (queryWords.some(word => KAFE_SYNTAX_KEYWORDS.has(word)) &&
        (queryWords.length === 1 || queryWords.some(word => SYNTAX_INTENT_WORDS.has(word))));
    const relatedWords = [...new Set(relatedContext.flatMap(value => searchTokens(value))
      .filter(word => word.length > 2 && !STOP_WORDS.has(word) && !queryWords.includes(word)))].slice(0,
      MAX_QUERY_TERMS - queryWords.length);
    const minimumContextScore = relatedWords.length >= 6 ? 2 : 1;
    files.sort((left, right) => left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0);
    const hydratedFiles = [];
    let totalBytes = 0;
    for (const file of files) {
      const read = await this.fileSystem.readFile(file.absolute);
      const bytes = Buffer.isBuffer(read) ? read : Buffer.from(read, 'utf8');
      if (bytes.length > MAX_FILE_BYTES) {
        if (verifyIntegrity) throw new KnowledgeIntegrityError(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${file.relative}`);
        continue;
      }
      if (verifyIntegrity && bytes.length !== file.size) {
        throw new KnowledgeIntegrityError(`KAFE development knowledge file changed while being read: ${file.relative}`);
      }
      totalBytes += bytes.length;
      if (totalBytes > MAX_TOTAL_BYTES) throw new KnowledgeIntegrityError(`KAFE knowledge-pack total size exceeds the ${MAX_TOTAL_BYTES} byte limit.`);
      hydratedFiles.push({ relative: file.relative, text: bytes.toString('utf8'), bytes });
    }
    if (verifyIntegrity) {
      if (!/^[a-f0-9]{64}$/.test(this.expectedContentSha256 || '') ||
        !Number.isSafeInteger(this.expectedFileCount) || this.expectedFileCount < 1 ||
        hydratedFiles.length !== this.expectedFileCount || knowledgeContentDigest(hydratedFiles).contentSha256 !== this.expectedContentSha256) {
        throw new KnowledgeIntegrityError('KAFE development knowledge-pack integrity or digest mismatch.');
      }
    }
    const queryRanked = [];
    const contextualRanked = [];
    for (const file of hydratedFiles) {
      const chunks = file.text.split(/\n\s*\n/);
      for (let index = 0; index < chunks.length; index++) {
        const text = chunks[index].trim().slice(0, 2000);
        const haystack = new Set(searchTokens(text));
        const queryScore = queryWords.reduce((total, word) => total + (haystack.has(word) ? 1 : 0), 0);
        const contextScore = relatedWords.reduce((total, word) => total + (haystack.has(word) ? 1 : 0), 0);
        const category = file.relative.split('/')[0];
        const syntaxPriority = queryIsSyntax ? ({ language: 3, specification: 2, grammar: 2, examples: 1 }[category] || 0) : 0;
        const passage = { queryScore, contextScore, syntaxPriority, score: queryScore + contextScore,
          id: `${file.relative}#${index + 1}`, path: file.relative, category, text };
        if (queryScore > 0) queryRanked.push(passage);
        else if (contextScore >= minimumContextScore) contextualRanked.push(passage);
      }
    }
    const ranked = [...queryRanked, ...contextualRanked];
    ranked.sort((a, b) => (queryIsSyntax ? b.syntaxPriority - a.syntaxPriority : 0) || b.score - a.score ||
      b.queryScore - a.queryScore || b.contextScore - a.contextScore || a.path.localeCompare(b.path) || a.id.localeCompare(b.id));
    const selected = [];
    const sourceCounts = new Map();
    for (const passage of ranked) {
      const count = sourceCounts.get(passage.path) || 0;
      if (count >= 2) continue;
      sourceCounts.set(passage.path, count + 1);
      selected.push(passage);
      if (selected.length === 5) break;
    }
    return selected.map(({ queryScore, contextScore, syntaxPriority, score, ...passage }) => passage);
  }
}

module.exports = { KnowledgeRetriever, KnowledgeUnavailable, KnowledgeIntegrityError, knowledgeContentDigest, createKnowledgeAuthority };
