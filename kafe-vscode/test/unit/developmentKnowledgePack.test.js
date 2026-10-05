const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { DevelopmentKnowledgePack, MAX_FILE_BYTES } = require('../../src/tutor/DevelopmentKnowledgePack');
const { KnowledgeRetriever } = require('../../src/tutor/KnowledgeRetriever');

function fixture() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-development-pack-'));
  const extensionPath = path.join(temporary, 'kafe-vscode');
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-development-storage-'));
  fs.mkdirSync(extensionPath);
  fs.mkdirSync(path.join(temporary, 'src'), { recursive: true });
  fs.mkdirSync(path.join(temporary, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(temporary, 'pyproject.toml'), 'requires-python = ">=3.10"\n');
  fs.writeFileSync(path.join(temporary, 'uv.lock'), 'version = 1\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe.py'), '# KAFE\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe_Grammar.g4'), 'grammar Kafe;\n');
  fs.writeFileSync(path.join(temporary, 'src', 'Kafe_Lexer.g4'), 'lexer grammar Kafe_Lexer;\n');
  for (const section of ['getting-started', 'language', 'libraries', 'specification', 'errors']) {
    const directory = path.join(temporary, 'docs', section);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'lesson.md'), `${section} KAFE lesson.\n`);
  }
  const examples = path.join(temporary, 'docs', 'examples');
  fs.mkdirSync(examples, { recursive: true });
  fs.writeFileSync(path.join(examples, 'lesson.kf'), 'show("KAFE example")\n');
  fs.writeFileSync(path.join(examples, 'guide.md'), 'KAFE example guide.\n');
  fs.mkdirSync(path.join(temporary, 'docs', 'extension'), { recursive: true });
  fs.writeFileSync(path.join(temporary, 'docs', 'extension', 'private.md'), 'PRIVATE_EXTENSION_CONTENT\n');

  const options = { extensionPath, storageRoot, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceRevision: '857a07dfaecda2583c3f0460d5756ea6893f19d7' };
  return { temporary, extensionPath, storageRoot, options,
    createPack: overrides => new DevelopmentKnowledgePack({ ...options, ...overrides }) };
}

function removeFixture(value) {
  fs.rmSync(value.temporary, { recursive: true, force: true });
  fs.rmSync(value.storageRoot, { recursive: true, force: true });
}

for (const mutation of ['source-bytes', 'cache-bytes', 'extra-file', 'metadata', 'deleted']) test(`synchronous development knowledge authority rejects ${mutation} after asynchronous readiness`, async () => {
  const f = fixture();
  try {
    const pack = await f.createPack().getReadyPack();
    assert.equal(pack.authority?.isCurrent(), true);
    if (mutation === 'source-bytes') fs.writeFileSync(path.join(f.temporary, 'docs/language/lesson.md'), 'changed source lesson');
    if (mutation === 'cache-bytes') fs.writeFileSync(path.join(pack.knowledgeRoot, 'language/lesson.md'), 'changed cached lesson');
    if (mutation === 'extra-file') fs.writeFileSync(path.join(pack.knowledgeRoot, 'extra.md'), 'extra file');
    if (mutation === 'metadata') fs.writeFileSync(path.join(path.dirname(pack.knowledgeRoot), 'pack-metadata.json'), '{}');
    if (mutation === 'deleted') fs.unlinkSync(path.join(pack.knowledgeRoot, 'language/lesson.md'));
    assert.equal(pack.authority.isCurrent(), false);
  } finally { removeFixture(f); }
});

test('development knowledge readiness and receipt retain empty directory compatibility', async () => {
  const f = fixture();
  try {
    const owner = f.createPack(), captured = await owner.getReadyPack();
    fs.mkdirSync(path.join(captured.knowledgeRoot, 'language/extra/empty'), { recursive: true });
    fs.mkdirSync(path.join(f.temporary, 'docs/language/extra/empty'), { recursive: true });
    assert.equal(captured.authority.isCurrent(), true);
    const fresh = await owner.getReadyPack();
    assert.equal(fresh.status, 'ready'); assert.equal(fresh.authority.isCurrent(), true);
  } finally { removeFixture(f); }
});

function verifiedRetriever(pack, overrides = {}) {
  return new KnowledgeRetriever({ ...pack, expectedRuntimeVersion: '0.1.0',
    expectedKnowledgePackVersion: '0.1.0', expectedContentSha256: pack.contentSha256,
    expectedFileCount: pack.fileCount, ...overrides });
}

function addSyntheticEntry(fileSystem, directory, entry, filePath, info) {
  return new Proxy(fileSystem, {
    get(target, key) {
      if (key === 'readdir') return async (current, options) => {
        const entries = await target.readdir(current, options);
        return path.resolve(current) === path.resolve(directory) ? [...entries, entry] : entries;
      };
      if (key === 'lstat' && filePath && info) return async current =>
        path.resolve(current) === path.resolve(filePath) ? info : target.lstat(current);
      const member = target[key];
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
}

test('development knowledge pack contains only curated lessons, KAFE examples, and canonical grammar', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    assert.equal(pack.status, 'ready');
    assert.equal(pack.sourceMode, 'development');
    assert.equal(pack.runtimeVersion, '0.1.0');
    assert.equal(pack.knowledgePackVersion, '0.1.0');
    assert.equal(pack.sourceRevision, value.options.sourceRevision);
    assert.match(pack.contentSha256, /^[a-f0-9]{64}$/);
    assert.ok(pack.knowledgeRoot.startsWith(value.storageRoot));
    assert.equal(fs.existsSync(path.join(pack.knowledgeRoot, 'examples', 'lesson.kf')), true);
    assert.equal(fs.existsSync(path.join(pack.knowledgeRoot, 'grammar', 'Kafe_Grammar.g4')), true);
    assert.equal(fs.existsSync(path.join(pack.knowledgeRoot, 'grammar', 'Kafe_Lexer.g4')), true);
    assert.equal(fs.existsSync(path.join(pack.knowledgeRoot, 'extension')), false);

    const passages = await new KnowledgeRetriever({ ...pack, expectedRuntimeVersion: '0.1.0',
      expectedKnowledgePackVersion: '0.1.0', expectedContentSha256: pack.contentSha256,
      expectedFileCount: pack.fileCount }).search('KAFE example');
    assert.ok(passages.some(passage => passage.path === 'examples/lesson.kf'));
  } finally { removeFixture(value); }
});

test('development retrieval checks the exact bytes used after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    fs.writeFileSync(path.join(pack.knowledgeRoot, 'language', 'lesson.md'), 'CHANGED_AFTER_CACHE_VERIFICATION');
    const retriever = new KnowledgeRetriever({ ...pack, expectedRuntimeVersion: '0.1.0',
      expectedKnowledgePackVersion: '0.1.0', expectedContentSha256: pack.contentSha256,
      expectedFileCount: pack.fileCount });
    await assert.rejects(retriever.search('changed after cache verification'), /integrity|digest/i);
  } finally { removeFixture(value); }
});

test('knowledge search uses the learning topic and avoids generic path matches and repeated chunks', async () => {
  const value = fixture();
  try {
    fs.writeFileSync(path.join(value.temporary, 'docs', 'getting-started', 'lesson.md'),
      'Getting started with the general KAFE setup guide.');
    fs.writeFileSync(path.join(value.temporary, 'docs', 'libraries', 'lesson.md'), [
      'A supervised house-price model predicts SalePrice using regression.',
      'A baseline regression model can use machine.linear_regression and fit(X, y).',
      'Validate a regression model on held-out data before using it for prediction.',
    ].join('\n\n'));
    const pack = await value.createPack().getReadyPack();
    const passages = await new KnowledgeRetriever({ ...pack, expectedRuntimeVersion: '0.1.0',
      expectedKnowledgePackVersion: '0.1.0', expectedContentSha256: pack.contentSha256,
      expectedFileCount: pack.fileCount }).search('Let us get started', [
      'Create a supervised model for https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques and predict SalePrice.',
      'Identify the target and choose a baseline regression model.',
    ]);
    assert.ok(passages.some(passage => passage.path === 'libraries/lesson.md'));
    assert.ok(passages.every(passage => !passage.path.startsWith('getting-started/')));
    assert.ok(passages.filter(passage => passage.path === 'libraries/lesson.md').length <= 2);
  } finally { removeFixture(value); }
});

test('knowledge search lets confirmed milestone context disambiguate broad coaching wording', async () => {
  const value = fixture();
  try {
    fs.writeFileSync(path.join(value.temporary, 'docs', 'libraries', 'lesson.md'), [
      'The definition of recursive feature elimination is a supervised model method for removing weak features.',
      'For a supervised house-price regression problem, inspect the training data and separate SalePrice as target y from house features X.',
    ].join('\n\n'));
    const pack = await value.createPack().getReadyPack();
    const passages = await verifiedRetriever(pack).search('Definition of the first supervised model step', [
      'Create a supervised model for house prices.',
      'Inspect competition data, identify SalePrice as the prediction target, and explain why this is supervised regression.',
    ]);

    assert.equal(passages[0].id, 'libraries/lesson.md#2');
  } finally { removeFixture(value); }
});

test('explicit KAFE syntax questions retain short language keywords alongside the learning goal', async () => {
  const value = fixture();
  try {
    fs.writeFileSync(path.join(value.temporary, 'docs', 'language', 'conditionals.md'),
      'The if keyword begins a conditional expression and selects a branch when its condition is true.');
    fs.writeFileSync(path.join(value.temporary, 'docs', 'libraries', 'lesson.md'),
      'If model output is confusing, review the supervised regression prediction of SalePrice for house prices.');
    const pack = await value.createPack().getReadyPack();
    const passages = await verifiedRetriever(pack).search('Help with if', [
      'Create a supervised model for house prices and predict SalePrice using regression.',
    ]);

    assert.ok(passages.some(passage => passage.path === 'language/conditionals.md'));
    assert.ok(passages.findIndex(passage => passage.path === 'language/conditionals.md') <
      passages.findIndex(passage => passage.path === 'libraries/lesson.md'));

    const contextualFallback = await verifiedRetriever(pack).search('Give me a hint', [
      'Create a supervised model for house prices and predict SalePrice using regression.',
    ]);
    assert.ok(contextualFallback.some(passage => passage.path === 'libraries/lesson.md'));
  } finally { removeFixture(value); }
});

test('development retrieval rejects an unsupported file added after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    fs.writeFileSync(path.join(pack.knowledgeRoot, 'unexpected.json'), '{"extra":true}');
    await assert.rejects(verifiedRetriever(pack).search('KAFE example'), /unexpected|unsupported/i);
  } finally { removeFixture(value); }
});

test('development retrieval rejects an oversized file added after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    fs.writeFileSync(path.join(pack.knowledgeRoot, 'language', 'too-large.md'), 'x'.repeat(MAX_FILE_BYTES + 1));
    await assert.rejects(verifiedRetriever(pack).search('KAFE example'), /size limit|too large|exceeds/i);
  } finally { removeFixture(value); }
});

test('development retrieval rejects a symbolic link added after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    const directory = path.join(pack.knowledgeRoot, 'language');
    const entry = { name: 'linked.md', isDirectory: () => false, isFile: () => false, isSymbolicLink: () => true };
    const fileSystem = addSyntheticEntry(fsPromises, directory, entry);
    await assert.rejects(verifiedRetriever(pack, { fileSystem }).search('KAFE example'), /symbolic link|symlink/i);
  } finally { removeFixture(value); }
});

test('development retrieval rejects a malformed path added after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    const directory = path.join(pack.knowledgeRoot, 'language');
    const entry = { name: '../escape.md', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false };
    const fileSystem = addSyntheticEntry(fsPromises, directory, entry);
    await assert.rejects(verifiedRetriever(pack, { fileSystem }).search('KAFE example'), /unsafe|malformed|invalid.*path/i);
  } finally { removeFixture(value); }
});

test('development retrieval rejects a special file added after cache verification', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    const directory = path.join(pack.knowledgeRoot, 'language');
    const specialPath = path.join(directory, 'socket');
    const entry = { name: 'socket', isDirectory: () => false, isFile: () => false, isSymbolicLink: () => false };
    const info = { size: 0, isDirectory: () => false, isFile: () => false, isSymbolicLink: () => false, isFIFO: () => true };
    const fileSystem = addSyntheticEntry(fsPromises, directory, entry, specialPath, info);
    await assert.rejects(verifiedRetriever(pack, { fileSystem }).search('KAFE example'), /special|unsupported file/i);
  } finally { removeFixture(value); }
});

test('development pack rejects runtime and knowledge-pack version mismatch', async () => {
  const value = fixture();
  try {
    await assert.rejects(value.createPack({ knowledgePackVersion: '0.2.0' }).getReadyPack(), /version.*match|mismatch/i);
  } finally { removeFixture(value); }
});

test('development pack rejects cached content changed after creation', async () => {
  const value = fixture();
  try {
    const pack = await value.createPack().getReadyPack();
    const lesson = path.join(pack.knowledgeRoot, 'language', 'lesson.md');
    fs.writeFileSync(lesson, 'TAMPERED_CACHE_CONTENT');
    await assert.rejects(value.createPack().getReadyPack(), /integrity|tamper|digest/i);
  } finally { removeFixture(value); }
});

test('development pack rejects an empty required documentation section', async () => {
  const value = fixture();
  try {
    fs.rmSync(path.join(value.temporary, 'docs', 'libraries'), { recursive: true, force: true });
    fs.mkdirSync(path.join(value.temporary, 'docs', 'libraries'));
    await assert.rejects(value.createPack().getReadyPack(), /empty|required|missing/i);
  } finally { removeFixture(value); }
});

test('development pack rejects files above its per-file size bound', async () => {
  const value = fixture();
  try {
    fs.writeFileSync(path.join(value.temporary, 'docs', 'language', 'too-large.md'), 'x'.repeat(MAX_FILE_BYTES + 1));
    await assert.rejects(value.createPack().getReadyPack(), /size limit|too large|exceeds/i);
  } finally { removeFixture(value); }
});

test('development pack rejects symlinks in curated source sections when the platform supports them', async t => {
  const value = fixture();
  const outside = path.join(value.temporary, 'outside.md');
  const link = path.join(value.temporary, 'docs', 'language', 'linked.md');
  fs.writeFileSync(outside, 'outside KAFE source');
  try {
    try { fs.symlinkSync(outside, link, 'file'); }
    catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return t.skip('Symlink creation is unavailable on this host.');
      throw error;
    }
    await assert.rejects(value.createPack().getReadyPack(), /symbolic link|symlink/i);
  } finally { removeFixture(value); }
});

test('development pack rejects traversal segments returned by a directory scan', async () => {
  const value = fixture();
  const languageDirectory = path.join(value.temporary, 'docs', 'language');
  const fileSystem = new Proxy(fsPromises, {
    get(target, key) {
      if (key === 'readdir') return async (directory, options) => {
        const entries = await target.readdir(directory, options);
        if (path.resolve(directory) !== path.resolve(languageDirectory)) return entries;
        const traversal = { name: '../escape.md', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false };
        return [...entries, traversal];
      };
      const member = target[key];
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  try {
    await assert.rejects(value.createPack({ fileSystem }).getReadyPack(), /unsafe.*path segment/i);
  } finally { removeFixture(value); }
});
