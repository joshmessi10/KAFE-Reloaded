const { createHash } = require('node:crypto');
const defaultFileSystem = require('node:fs/promises');
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
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink?.()) throw new Error('KAFE knowledge-pack root is unavailable.');
    const verifyIntegrity = this.expectedContentSha256 !== undefined || this.expectedFileCount !== undefined;
    const files = [];
    const seenPaths = new Map();
    const reservePath = relative => {
      let prefix = '';
      let foldedPrefix = '';
      for (const segment of relative.split('/')) {
        const foldedSegment = validateSegment(segment);
        prefix = prefix ? `${prefix}/${segment}` : segment;
        foldedPrefix = foldedPrefix ? `${foldedPrefix}/${foldedSegment}` : foldedSegment;
        const existing = seenPaths.get(foldedPrefix);
        if (existing && existing !== prefix) throw new Error(`KAFE development knowledge-pack has duplicate paths: ${prefix}`);
        seenPaths.set(foldedPrefix, prefix);
      }
    };
    const visit = async (directory, prefix = '') => {
      for (const entry of await this.fileSystem.readdir(directory, { withFileTypes: true })) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (verifyIntegrity) reservePath(relative);
        else if (!entry.name || entry.name === '.' || entry.name === '..' || entry.name.includes('/') || entry.name.includes('\\')) continue;
        if (entry.isSymbolicLink?.()) {
          if (verifyIntegrity) throw new Error(`KAFE development knowledge pack contains a symbolic link: ${relative}`);
          continue;
        }
        const absolute = path.join(directory, entry.name);
        const info = await this.fileSystem.lstat(absolute);
        if (info.isSymbolicLink?.()) {
          if (verifyIntegrity) throw new Error(`KAFE development knowledge pack contains a symbolic link: ${relative}`);
          continue;
        }
        if (info.isDirectory()) await visit(absolute, relative);
        else if (info.isFile()) {
          const extension = path.extname(entry.name).toLowerCase();
          if (!ALLOWED_EXTENSIONS.has(extension)) {
            if (verifyIntegrity) throw new Error(`KAFE development knowledge pack contains an unexpected file: ${relative}`);
            continue;
          }
          if (!Number.isSafeInteger(info.size) || info.size < 0 || info.size > MAX_FILE_BYTES) {
            if (verifyIntegrity) throw new Error(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${relative}`);
            continue;
          }
          files.push({ absolute, relative, size: info.size });
        } else if (verifyIntegrity) {
          throw new Error(`KAFE development knowledge pack contains an unsupported special file: ${relative}`);
        }
        if (files.length > MAX_FILES) throw new Error('KAFE knowledge-pack file limit exceeded.');
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
    const hash = createHash('sha256');
    const hydratedFiles = [];
    let totalBytes = 0;
    for (const file of files) {
      const read = await this.fileSystem.readFile(file.absolute);
      const bytes = Buffer.isBuffer(read) ? read : Buffer.from(read, 'utf8');
      if (bytes.length > MAX_FILE_BYTES) {
        if (verifyIntegrity) throw new Error(`KAFE development knowledge file exceeds the ${MAX_FILE_BYTES} byte size limit: ${file.relative}`);
        continue;
      }
      if (verifyIntegrity && bytes.length !== file.size) {
        throw new Error(`KAFE development knowledge file changed while being read: ${file.relative}`);
      }
      totalBytes += bytes.length;
      if (totalBytes > MAX_TOTAL_BYTES) throw new Error(`KAFE knowledge-pack total size exceeds the ${MAX_TOTAL_BYTES} byte limit.`);
      const name = Buffer.from(file.relative, 'utf8');
      const length = Buffer.alloc(8);
      length.writeBigUInt64BE(BigInt(bytes.length));
      hash.update(name);
      hash.update(Buffer.from([0]));
      hash.update(length);
      hash.update(bytes);
      hydratedFiles.push({ relative: file.relative, text: bytes.toString('utf8') });
    }
    if (verifyIntegrity) {
      if (!/^[a-f0-9]{64}$/.test(this.expectedContentSha256 || '') ||
        !Number.isSafeInteger(this.expectedFileCount) || this.expectedFileCount < 1 ||
        hydratedFiles.length !== this.expectedFileCount || hash.digest('hex') !== this.expectedContentSha256) {
        throw new Error('KAFE development knowledge-pack integrity or digest mismatch.');
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

module.exports = { KnowledgeRetriever };
