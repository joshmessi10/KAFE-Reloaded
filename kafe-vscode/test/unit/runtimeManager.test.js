const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const path = require('node:path');
const test = require('node:test');

const manifestTemplate = require('../../src/runtimeManifest.json');
const { createRuntimeManager, getRuntimeTarget, validateAssetUrl } = require('../../src/runtimeManager');

const STORAGE = 'C:/extension-storage';
const runtimeEntries = {
  'pyproject.toml': '[project]\nrequires-python = ">=3.10"\ndependencies = ["antlr4-python3-runtime==4.13.2"]\n',
  'uv.lock': 'version = 1\n',
  'src/Kafe.py': 'print("KAFE")\n',
  'src/Kafe_GrammarLexer.py': '# generated\n',
  'src/Kafe_GrammarParser.py': '# generated\n',
  'src/Kafe_GrammarVisitor.py': '# generated\n',
  'knowledge-pack/grammar/Kafe_Grammar.g4': 'grammar Kafe;\n',
  'knowledge-pack/grammar/Kafe_Lexer.g4': 'lexer grammar Kafe_Lexer;\n',
  'knowledge-pack/getting-started/index.md': 'Start here.\n',
  'knowledge-pack/language/index.md': 'Language.\n',
  'knowledge-pack/libraries/index.md': 'Libraries.\n',
  'knowledge-pack/specification/index.md': 'Specification.\n',
  'knowledge-pack/errors/index.md': 'Errors.\n',
  'knowledge-pack/examples/index.md': 'Examples.\n',
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const members = Array.isArray(entries) ? entries : Object.entries(entries).map(([name, contents]) => ({ name, contents }));
  for (const member of members) {
    const name = Buffer.from(member.name, 'utf8');
    const contents = Buffer.from(member.contents ?? '');
    const checksum = crc32(contents);
    const external = member.symlink ? (0o120777 << 16) : (member.directory ? (0o040755 << 16) : (0o100644 << 16));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(contents.length, 18);
    local.writeUInt32LE(contents.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, contents);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(contents.length, 20);
    central.writeUInt32LE(contents.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(external >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + contents.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(members.length, 8);
  end.writeUInt16LE(members.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function makeTarGz(entries) {
  const blocks = [];
  for (const member of entries) {
    const contents = Buffer.from(member.contents ?? '');
    const header = Buffer.alloc(512);
    const writeText = (value, start, length) => header.write(value, start, Math.min(Buffer.byteLength(value), length), 'utf8');
    const writeOctal = (value, start, length) => header.write(value.toString(8).padStart(length - 1, '0') + '\0', start, length, 'ascii');
    writeText(member.name, 0, 100);
    writeOctal(0o644, 100, 8);
    writeOctal(0, 108, 8);
    writeOctal(0, 116, 8);
    writeOctal(contents.length, 124, 12);
    writeOctal(0, 136, 12);
    header.fill(0x20, 148, 156);
    header[156] = member.directory ? 0x35 : (member.typeFlag?.charCodeAt(0) ?? 0x30);
    writeText('ustar\0', 257, 6);
    writeText('00', 263, 2);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    writeOctal(checksum, 148, 8);
    blocks.push(header);
    if (contents.length) {
      const padded = Buffer.alloc(Math.ceil(contents.length / 512) * 512);
      contents.copy(padded);
      blocks.push(padded);
    }
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

class MemoryFileSystem {
  constructor() {
    this.directories = new Set([this.key(STORAGE), this.key(path.parse(STORAGE).root)]);
    this.files = new Map();
    this.displayPaths = new Map([
      [this.key(STORAGE), path.resolve(STORAGE)],
      [this.key(path.parse(STORAGE).root), path.resolve(path.parse(STORAGE).root)],
    ]);
  }

  key(value) { return path.resolve(value).toLowerCase(); }
  async mkdir(value, options = {}) {
    const target = this.key(value);
    if (this.directories.has(target)) return;
    const parent = this.key(path.dirname(value));
    if (!this.directories.has(parent)) {
      if (!options.recursive) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      await this.mkdir(path.dirname(value), options);
    }
    this.directories.add(target);
    this.displayPaths.set(target, path.resolve(value));
  }
  async writeFile(value, contents) {
    const target = this.key(value);
    if (!this.directories.has(this.key(path.dirname(value)))) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    this.files.set(target, Buffer.isBuffer(contents) ? Buffer.from(contents) : Buffer.from(contents));
    if (!this.displayPaths.has(target)) this.displayPaths.set(target, path.resolve(value));
  }
  async readFile(value, encoding) {
    const contents = this.files.get(this.key(value));
    if (!contents) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    return encoding ? contents.toString(encoding) : Buffer.from(contents);
  }
  async access(value) {
    const target = this.key(value);
    if (!this.directories.has(target) && !this.files.has(target)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  }
  async stat(value) {
    const target = this.key(value);
    if (this.directories.has(target)) return { isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false };
    if (this.files.has(target)) return { isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: this.files.get(target).length };
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  }
  async lstat(value) { return this.stat(value); }
  async readdir(value) {
    const parent = this.key(value);
    if (!this.directories.has(parent)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    const parentPath = this.displayPaths.get(parent) ?? path.resolve(value);
    const children = new Set();
    for (const candidate of [...this.directories, ...this.files.keys()]) {
      const candidatePath = this.displayPaths.get(candidate) ?? candidate;
      const relative = path.relative(parentPath, candidatePath);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) continue;
      children.add(relative.split(path.sep)[0]);
    }
    return [...children];
  }
  async rename(from, to) {
    const source = this.key(from);
    const target = this.key(to);
    if (this.directories.has(target) || this.files.has(target)) throw Object.assign(new Error('EEXIST'), { code: 'EEXIST' });
    await this.mkdir(path.dirname(to), { recursive: true });
    const startsWith = candidate => candidate === source || candidate.startsWith(`${source}${path.sep}`);
    const sourceDisplay = this.displayPaths.get(source) ?? path.resolve(from);
    const targetDisplay = path.resolve(to);
    for (const item of [...this.directories]) if (startsWith(item)) {
      const oldDisplay = this.displayPaths.get(item) ?? item;
      const relative = path.relative(sourceDisplay, oldDisplay);
      this.directories.delete(item);
      const renamed = `${target}${item.slice(source.length)}`;
      this.directories.add(renamed);
      this.displayPaths.delete(item);
      this.displayPaths.set(renamed, relative ? path.join(targetDisplay, relative) : targetDisplay);
    }
    for (const [item, contents] of [...this.files]) if (startsWith(item)) {
      const oldDisplay = this.displayPaths.get(item) ?? item;
      const relative = path.relative(sourceDisplay, oldDisplay);
      this.files.delete(item);
      const renamed = `${target}${item.slice(source.length)}`;
      this.files.set(renamed, contents);
      this.displayPaths.delete(item);
      this.displayPaths.set(renamed, path.join(targetDisplay, relative));
    }
  }
  async rm(value, options = {}) {
    const target = this.key(value);
    const startsWith = candidate => candidate === target || candidate.startsWith(`${target}${path.sep}`);
    const children = [...this.directories, ...this.files.keys()].filter(startsWith);
    if (!children.length && !options.force) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    if (!options.recursive && children.length > 1) throw Object.assign(new Error('ENOTEMPTY'), { code: 'ENOTEMPTY' });
    for (const item of children) { this.directories.delete(item); this.files.delete(item); this.displayPaths.delete(item); }
  }
  has(value) { return this.directories.has(this.key(value)) || this.files.has(this.key(value)); }
}

function digest(buffer) { return createHash('sha256').update(buffer).digest('hex'); }

function makeFixture({ runtimeBytes = makeZip(runtimeEntries), uvBytes = makeZip({
  'uv-x86_64-pc-windows-msvc/uv.exe': 'uv 0.11.3 test binary',
}), published = true, runtimeOverrides = {}, transport = undefined, processRunner = undefined, confirmDownload = undefined } = {}) {
  const manifest = structuredClone(manifestTemplate);
  manifest.runtime.releasePublished = published;
  manifest.runtime.archiveSha256 = digest(runtimeBytes);
  manifest.uv.targets['win32-x64'].sha256 = digest(uvBytes);
  Object.assign(manifest.runtime, runtimeOverrides);
  const remoteManifest = {
    runtime_version: manifest.runtime.version,
    knowledge_pack_version: manifest.runtime.knowledgePackVersion,
    python_requirement: manifest.runtime.pythonRequirement,
    antlr_runtime_version: manifest.runtime.antlrRuntimeVersion,
    source_revision: manifest.runtime.sourceRevision,
    archive_sha256: manifest.runtime.archiveSha256,
  };
  const fs = new MemoryFileSystem();
  const requests = [];
  const processCalls = [];
  const request = transport ?? (async (url) => {
    requests.push(url);
    if (url === manifest.runtime.manifestUrl) return { statusCode: 200, body: Buffer.from(JSON.stringify(remoteManifest)) };
    if (url === manifest.runtime.archiveUrl) return { statusCode: 200, body: runtimeBytes };
    if (url.includes('/uv/releases/download/')) return { statusCode: 200, body: uvBytes };
    throw new Error(`Unexpected test transport URL: ${url}`);
  });
  const run = processRunner ?? (async (executable, args, options) => {
    processCalls.push({ executable, args, options });
    if (args[0] === '--version') return { exitCode: 0, stdout: 'uv 0.11.3\n', stderr: '' };
    return { exitCode: 0, stdout: '', stderr: '' };
  });
  const manager = createRuntimeManager({
    storageRoot: STORAGE, fileSystem: fs, manifest, platform: 'win32', arch: 'x64', transport: request,
    processRunner: run, confirmDownload: confirmDownload ?? (async () => true),
  });
  return { manager, fs, manifest, requests, processCalls, runtimeBytes, uvBytes, remoteManifest };
}

test('maps only the four pinned uv platforms and rejects unsupported targets', () => {
  assert.equal(getRuntimeTarget('win32', 'x64').asset, 'uv-x86_64-pc-windows-msvc.zip');
  assert.equal(getRuntimeTarget('darwin', 'x64').asset, 'uv-x86_64-apple-darwin.tar.gz');
  assert.equal(getRuntimeTarget('darwin', 'arm64').asset, 'uv-aarch64-apple-darwin.tar.gz');
  assert.equal(getRuntimeTarget('linux', 'x64').asset, 'uv-x86_64-unknown-linux-gnu.tar.gz');
  assert.throws(() => getRuntimeTarget('win32', 'arm64'), /does not support/i);
  assert.throws(() => getRuntimeTarget('linux', 'arm64'), /does not support/i);
  assert.throws(() => getRuntimeTarget('freebsd', 'x64'), /does not support/i);
});

test('runtime manifest pins the unpublished KAFE assets and official uv 0.11.3 checksums', () => {
  assert.equal(manifestTemplate.runtime.releasePublished, false);
  assert.equal(manifestTemplate.runtime.archiveUrl, 'https://github.com/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v0.1.0/kafe-runtime-0.1.0.zip');
  assert.equal(manifestTemplate.runtime.manifestUrl, 'https://github.com/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v0.1.0/kafe-runtime-0.1.0.manifest.json');
  assert.deepEqual(Object.fromEntries(Object.entries(manifestTemplate.uv.targets).map(([key, value]) => [key, value.sha256])), {
    'win32-x64': 'ae681c0aaec7cc96af184648cb88d73f8393ed60fa5880abdd6bdb910f9b227c',
    'darwin-x64': 'b0e05e0b43a000fdc2132ee3f3400ba5dee427bc2337d3ec4eb8cf4f3d5722af',
    'darwin-arm64': '2bc3d0c7bf2bd08325b1e170abac6f7e5b3346e1d4eab3370d17cefec934996f',
    'linux-x64': 'c0f3236f146e55472663cfbcc9be3042a9f1092275bbe3fe2a56a6cbfd3da5ce',
  });
  for (const target of Object.values(manifestTemplate.uv.targets)) {
    assert.ok(target.url.startsWith('https://releases.astral.sh/github/uv/releases/download/0.11.3/'));
    assert.ok(target.checksumUrl.endsWith(`${target.asset}.sha256`));
  }
});

test('accepts only HTTPS pinned release URLs and documented GitHub asset redirects', () => {
  assert.equal(validateAssetUrl('https://github.com/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v0.1.0/kafe-runtime-0.1.0.zip'), true);
  assert.equal(validateAssetUrl('https://release-assets.githubusercontent.com/asset?sig=test', { redirect: true }), true);
  assert.throws(() => validateAssetUrl('http://github.com/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v0.1.0/kafe-runtime-0.1.0.zip'), /HTTPS/i);
  assert.throws(() => validateAssetUrl('https://evil.example/runtime.zip', { redirect: true }), /not allowed/i);
  assert.throws(() => validateAssetUrl('https://github.com.evil.example/runtime.zip', { redirect: true }), /not allowed/i);
});

test('unpublished pinned release reports unavailable without prompting or downloading uv', async () => {
  let prompts = 0;
  const fixture = makeFixture({ published: false, confirmDownload: async () => { prompts++; return true; } });
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'unavailable');
  assert.match(result.message, /not published/i);
  assert.equal(prompts, 0);
  assert.deepEqual(fixture.requests, []);
  assert.deepEqual(fixture.processCalls, []);
});

test('unsupported managed target returns actionable guidance without consent or transport', async () => {
  const fixture = makeFixture({ published: true });
  fixture.manager.platform = 'freebsd';
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'unsupported');
  assert.match(result.message, /Windows x64.*macOS.*Linux x64/i);
  assert.deepEqual(fixture.requests, []);
});

test('absent and cancelled first-download consent leave storage and transport untouched', async () => {
  for (const confirmDownload of [undefined, async () => false]) {
    const fixture = makeFixture({ confirmDownload });
    if (!confirmDownload) fixture.manager.confirmDownload = undefined;
    const result = await fixture.manager.installRuntime();
    assert.equal(result.status, 'cancelled');
    assert.deepEqual(fixture.requests, []);
    assert.equal(fixture.fs.files.size, 0);
  }
});

test('valid runtime and uv checksums stage, sync with isolated paths, and atomically promote', async () => {
  const fixture = makeFixture();
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'ready', result.message);
  assert.equal(result.runtimeVersion, '0.1.0');
  assert.equal(fixture.requests.length, 3);
  const sync = fixture.processCalls.find(call => call.args[0] === 'sync');
  assert.ok(sync);
  assert.deepEqual(sync.args, ['sync', '--locked', '--no-dev', '--project', fixture.manager.paths.stagingRoot]);
  assert.equal(sync.options.cwd, fixture.manager.paths.stagingRoot);
  assert.equal(sync.options.shell, false);
  assert.equal(sync.options.env.UV_PROJECT_ENVIRONMENT, result.pythonEnvironment);
  assert.equal(sync.options.env.UV_PYTHON_INSTALL_DIR, result.pythonInstallDir);
  assert.equal(sync.options.env.UV_CACHE_DIR, result.uvCacheDir);
  assert.ok(fixture.fs.has(result.runtimeRoot));
  assert.ok(!fixture.fs.has(fixture.manager.paths.stagingRoot));
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'ready');
});

test('cache reuse validates metadata and avoids downloads and sync', async () => {
  const fixture = makeFixture();
  const first = await fixture.manager.installRuntime();
  fixture.requests.length = 0;
  fixture.processCalls.length = 0;
  const cached = await fixture.manager.getReadyRuntime();
  assert.equal(cached.status, 'ready');
  assert.equal(cached.runtimeRoot, first.runtimeRoot);
  assert.deepEqual(fixture.requests, []);
  assert.deepEqual(fixture.processCalls, []);
});

test('cache reuse rejects an edited extracted KAFE entry against the pinned archive', async () => {
  const fixture = makeFixture();
  const installed = await fixture.manager.installRuntime();
  await fixture.fs.writeFile(path.join(installed.runtimeRoot, 'src', 'Kafe.py'), 'print("edited")\n');

  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
});

test('cache reuse rejects an edited extracted uv executable against the pinned archive', async () => {
  const fixture = makeFixture();
  await fixture.manager.installRuntime();
  await fixture.fs.writeFile(fixture.manager.paths.uvPath, 'edited uv executable');

  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
});

test('oversized cached runtime archive is rejected from lstat size before readFile', async () => {
  const fixture = makeFixture();
  await fixture.manager.installRuntime();
  const archivePath = fixture.manager.paths.runtimeArchive;
  const archiveKey = fixture.fs.key(archivePath);
  const originalStat = fixture.fs.stat.bind(fixture.fs);
  const originalReadFile = fixture.fs.readFile.bind(fixture.fs);
  let archiveReads = 0;
  fixture.fs.lstat = async filePath => {
    const info = await originalStat(filePath);
    if (fixture.fs.key(filePath) === archiveKey) return { ...info, size: 64 * 1024 * 1024 + 1 };
    return info;
  };
  fixture.fs.readFile = async (filePath, encoding) => {
    if (fixture.fs.key(filePath) === archiveKey) archiveReads++;
    return originalReadFile(filePath, encoding);
  };

  const result = await fixture.manager.getReadyRuntime();

  assert.equal(archiveReads, 0, 'oversized cache must be rejected before allocating archive bytes');
  assert.equal(result.status, 'missing');
});

test('aborting during runtime sync removes setup artifacts and never marks the runtime ready', async () => {
  const controller = new AbortController();
  let fixture;
  fixture = makeFixture({ processRunner: async (_executable, args, options) => {
    if (args[0] === '--version') return { exitCode: 0, stdout: 'uv 0.11.3\n', stderr: '' };
    const paths = fixture.manager.paths;
    assert.equal(options.signal, controller.signal);
    assert.ok(fixture.fs.has(paths.runtimeArchive));
    assert.ok(fixture.fs.has(paths.uvArchive));
    assert.ok(fixture.fs.has(paths.stagingRoot));
    assert.ok(fixture.fs.has(paths.uvPath));
    controller.abort();
    return { exitCode: 0, stdout: '', stderr: '' };
  } });
  const paths = fixture.manager.paths;

  const result = await fixture.manager.installRuntime({ signal: controller.signal });

  assert.equal(result.status, 'cancelled');
  for (const temporary of [paths.runtimeArchive, paths.runtimeManifest, paths.uvArchive,
    paths.stagingRoot, paths.uvStageRoot, paths.runtimeRoot, paths.uvRoot,
    paths.pythonInstallDir, paths.uvCacheDir]) {
    assert.equal(fixture.fs.has(temporary), false, `${temporary} should be removed`);
  }
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
});

test('cache metadata tampering prevents reuse', async () => {
  const fixture = makeFixture();
  const installed = await fixture.manager.installRuntime();
  const markerPath = fixture.manager.paths.readyFile;
  const marker = JSON.parse(await fixture.fs.readFile(markerPath, 'utf8'));
  marker.runtimeVersion = '0.2.0';
  await fixture.fs.writeFile(markerPath, JSON.stringify(marker));
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  assert.notEqual(installed.runtimeRoot, undefined);
});

test('rejects mismatched runtime hash before extraction and removes partial artifacts', async () => {
  const fixture = makeFixture({ runtimeOverrides: { archiveSha256: '0'.repeat(64) } });
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'error');
  assert.match(result.message, /SHA-256/i);
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  assert.equal(fixture.fs.has(fixture.manager.paths.stagingRoot), false);
  assert.equal(fixture.fs.files.size, 0);
});

test('rejects mismatched pinned uv hash and removes runtime downloads', async () => {
  const fixture = makeFixture();
  fixture.manifest.uv.targets['win32-x64'].sha256 = '0'.repeat(64);
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'error');
  assert.match(result.message, /uv .*SHA-256/i);
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  assert.equal(fixture.fs.files.size, 0);
});

test('rejects wrong runtime and knowledge-pack versions before extraction', async () => {
  for (const override of [{ runtime_version: '0.2.0' }, { knowledge_pack_version: '0.2.0' }]) {
    const fixture = makeFixture({ transport: async url => {
      if (url === fixture.manifest.runtime.manifestUrl) return { statusCode: 200, body: Buffer.from(JSON.stringify({ ...fixture.remoteManifest, ...override })) };
      return { statusCode: 200, body: url === fixture.manifest.runtime.archiveUrl ? fixture.runtimeBytes : fixture.uvBytes };
    } });
    const result = await fixture.manager.installRuntime();
    assert.equal(result.status, 'error');
    assert.match(result.message, /version/i);
    assert.equal(fixture.fs.files.size, 0);
  }
});

test('follows only documented HTTPS GitHub release-asset redirects', async () => {
  const fixture = makeFixture();
  const redirectUrl = 'https://release-assets.githubusercontent.com/kafe/asset?token=signed';
  const originalTransport = async url => {
    if (url === fixture.manifest.runtime.manifestUrl) return { statusCode: 200, body: Buffer.from(JSON.stringify(fixture.remoteManifest)) };
    if (url === fixture.manifest.runtime.archiveUrl) return { statusCode: 302, headers: { location: redirectUrl } };
    if (url === redirectUrl) return { statusCode: 200, body: fixture.runtimeBytes };
    if (url === fixture.manifest.uv.targets['win32-x64'].url) return { statusCode: 200, body: fixture.uvBytes };
    throw new Error('Unexpected URL');
  };
  fixture.manager.transport = originalTransport;
  const accepted = await fixture.manager.installRuntime();
  assert.equal(accepted.status, 'ready', accepted.message);

  const foreign = makeFixture({ transport: async url => {
    if (url === foreign.manifest.runtime.manifestUrl) return { statusCode: 200, body: Buffer.from(JSON.stringify(foreign.remoteManifest)) };
    if (url === foreign.manifest.runtime.archiveUrl) return { statusCode: 302, headers: { location: 'https://evil.example/payload' } };
    throw new Error('foreign redirect must be rejected before next request');
  } });
  const rejected = await foreign.manager.installRuntime();
  assert.equal(rejected.status, 'error');
  assert.match(rejected.message, /redirect|allowed/i);
});

test('rejects HTTP redirects and interrupted downloads with full cleanup', async () => {
  for (const failure of [
    async (url, fixture) => url === fixture.manifest.runtime.archiveUrl ? { statusCode: 302, headers: { location: 'http://release-assets.githubusercontent.com/file' } } : undefined,
    async (url, fixture) => url === fixture.manifest.runtime.archiveUrl ? Promise.reject(new Error('connection interrupted')) : undefined,
  ]) {
    const fixture = makeFixture({ transport: async url => {
      const value = await failure(url, fixture);
      if (value) return value;
      if (url === fixture.manifest.runtime.manifestUrl) return { statusCode: 200, body: Buffer.from(JSON.stringify(fixture.remoteManifest)) };
      if (url === fixture.manifest.uv.targets['win32-x64'].url) return { statusCode: 200, body: fixture.uvBytes };
      return { statusCode: 200, body: fixture.runtimeBytes };
    } });
    const result = await fixture.manager.installRuntime();
    assert.equal(result.status, 'error');
    assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
    assert.equal(fixture.fs.has(fixture.manager.paths.stagingRoot), false);
    assert.equal(fixture.fs.files.size, 0);
  }
});

test('rejects traversal, absolute, symlink, duplicate, colliding, and malformed ZIP members before writing', async () => {
  const malicious = [
    [{ name: '../escape', contents: 'bad' }],
    [{ name: '/absolute', contents: 'bad' }],
    [{ name: 'link', contents: 'target', symlink: true }],
    [{ name: 'src/Kafe.py', contents: 'one' }, { name: 'src/Kafe.py', contents: 'two' }],
    [{ name: 'Data/File.txt', contents: 'one' }, { name: 'data/file.TXT', contents: 'two' }],
  ];
  for (const entries of malicious) {
    const runtimeBytes = makeZip(entries);
    const fixture = makeFixture({ runtimeBytes });
    const result = await fixture.manager.installRuntime();
    assert.equal(result.status, 'error');
    assert.equal(fixture.fs.files.size, 0);
    assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  }
  const malformed = makeFixture({ runtimeBytes: Buffer.from('not a ZIP archive') });
  const malformedResult = await malformed.manager.installRuntime();
  assert.equal(malformedResult.status, 'error');
  assert.equal(malformed.fs.files.size, 0);
});

test('rejects traversal, backslash, symlink, hardlink, and special members in tar.gz uv archives', async () => {
  for (const member of [
    { name: '../escape', contents: 'bad' },
    { name: 'uv-x86_64\\escape', contents: 'bad' },
    { name: 'uv-x86_64-unknown-linux-gnu/uv', contents: 'bad', typeFlag: '2' },
    { name: 'uv-x86_64-unknown-linux-gnu/uv', contents: 'bad', typeFlag: '1' },
    { name: 'uv-x86_64-unknown-linux-gnu/uv', contents: 'bad', typeFlag: 'x' },
  ]) {
    const uvBytes = makeTarGz([member]);
    const fixture = makeFixture({ uvBytes });
    fixture.manager.platform = 'linux';
    fixture.manifest.uv.targets['linux-x64'].sha256 = digest(uvBytes);
    fixture.manifest.uv.targets['linux-x64'].url = 'https://releases.astral.sh/github/uv/releases/download/0.11.3/uv-x86_64-unknown-linux-gnu.tar.gz';
    const result = await fixture.manager.installRuntime();
    assert.equal(result.status, 'error');
    assert.match(result.message, /link|special|member|unsafe/i);
    assert.equal(fixture.fs.files.size, 0);
  }
});

test('removes partial staging, environment, and downloaded artifacts after uv sync failure', async () => {
  const fixture = makeFixture({ processRunner: async (executable, args, options) => {
    fixture.processCalls.push({ executable, args, options });
    if (args[0] === '--version') return { exitCode: 0, stdout: 'uv 0.11.3\n', stderr: '' };
    return { exitCode: 1, stdout: '', stderr: 'sync failed' };
  } });
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'error');
  assert.match(result.message, /sync failed/i);
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  assert.equal(fixture.fs.has(fixture.manager.paths.stagingRoot), false);
  assert.equal(fixture.fs.files.size, 0);
});

test('removes partially extracted files after an interrupted extraction', async () => {
  const fixture = makeFixture();
  const writeFile = fixture.fs.writeFile.bind(fixture.fs);
  let wroteProjectFile = false;
  fixture.fs.writeFile = async (filePath, contents, options) => {
    if (filePath.endsWith(path.join('src', 'Kafe.py'))) throw new Error('disk full during extraction');
    await writeFile(filePath, contents, options);
    if (filePath.endsWith('pyproject.toml')) wroteProjectFile = true;
  };
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'error');
  assert.match(result.message, /disk full/i);
  assert.equal(wroteProjectFile, true);
  assert.equal((await fixture.manager.getReadyRuntime()).status, 'missing');
  assert.equal(fixture.fs.has(fixture.manager.paths.stagingRoot), false);
  assert.equal(fixture.fs.files.size, 0);
});

test('routes contributor workspaces through available uv without learner downloads', async () => {
  const fixture = makeFixture({ published: false });
  const contributorRoot = 'C:/KAFE';
  await fixture.fs.mkdir(contributorRoot, { recursive: true });
  await fixture.fs.mkdir(path.join(contributorRoot, 'src'), { recursive: true });
  for (const file of ['pyproject.toml', 'uv.lock', 'src/Kafe.py']) await fixture.fs.writeFile(path.join(contributorRoot, file), 'present');
  const resolved = await fixture.manager.resolveWorkspace(contributorRoot);
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.runtimeMode, 'contributor');
  assert.equal(resolved.runtimeRoot, contributorRoot);
  assert.equal(resolved.uvPath, 'uv');
  assert.deepEqual(fixture.requests, []);
  assert.equal(fixture.processCalls[0].args[0], '--version');
});

test('accepts an available contributor uv independently from the pinned learner uv version', async () => {
  const fixture = makeFixture({ published: false, processRunner: async () => ({ exitCode: 0, stdout: 'uv 0.9.8 (system install)\n', stderr: '' }) });
  const contributorRoot = 'C:/KAFE';
  await fixture.fs.mkdir(contributorRoot, { recursive: true });
  await fixture.fs.mkdir(path.join(contributorRoot, 'src'), { recursive: true });
  for (const file of ['pyproject.toml', 'uv.lock', 'src/Kafe.py']) await fixture.fs.writeFile(path.join(contributorRoot, file), 'present');
  const resolved = await fixture.manager.resolveWorkspace(contributorRoot);
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.runtimeMode, 'contributor');
  assert.deepEqual(fixture.requests, []);
});

test('contributor routing remains available when the managed runtime target is unsupported', async () => {
  const fixture = makeFixture({ published: false });
  fixture.manager.platform = 'freebsd';
  const contributorRoot = 'C:/KAFE';
  await fixture.fs.mkdir(contributorRoot, { recursive: true });
  await fixture.fs.mkdir(path.join(contributorRoot, 'src'), { recursive: true });
  for (const file of ['pyproject.toml', 'uv.lock', 'src/Kafe.py']) await fixture.fs.writeFile(path.join(contributorRoot, file), 'present');
  const resolved = await fixture.manager.resolveWorkspace(contributorRoot);
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.runtimeMode, 'contributor');
  assert.deepEqual(fixture.requests, []);
});

test('missing contributor uv gives guidance and leaves the learner runtime untouched', async () => {
  const fixture = makeFixture({ published: false, processRunner: async () => ({ exitCode: 1, stdout: '', stderr: 'uv not found' }) });
  const contributorRoot = 'C:/KAFE';
  await fixture.fs.mkdir(contributorRoot, { recursive: true });
  await fixture.fs.mkdir(path.join(contributorRoot, 'src'), { recursive: true });
  for (const file of ['pyproject.toml', 'uv.lock', 'src/Kafe.py']) await fixture.fs.writeFile(path.join(contributorRoot, file), 'present');
  const resolved = await fixture.manager.resolveWorkspace(contributorRoot);
  assert.equal(resolved.status, 'unavailable');
  assert.match(resolved.message, /install uv/i);
  assert.deepEqual(fixture.requests, []);
});

test('learner workspaces use only verified managed runtimes and unavailable routes do not launch KAFE', async () => {
  const unavailable = makeFixture({ published: false });
  const blocked = await unavailable.manager.resolveWorkspace('C:/learner');
  assert.equal(blocked.status, 'unavailable');
  assert.deepEqual(unavailable.requests, []);
  assert.deepEqual(unavailable.processCalls, []);

  const ready = makeFixture();
  const installed = await ready.manager.installRuntime();
  const resolved = await ready.manager.resolveWorkspace('C:/learner');
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.runtimeMode, 'managed');
  assert.equal(resolved.runtimeRoot, installed.runtimeRoot);
});

test('extracts pinned tar.gz targets after checksum verification and rejects malformed tar data', async () => {
  const tar = makeTarGz([{ name: 'uv-x86_64-unknown-linux-gnu/uv', contents: 'test executable' }]);
  const fixture = makeFixture({ uvBytes: tar });
  fixture.manager.platform = 'linux';
  fixture.manager.arch = 'x64';
  fixture.manifest.uv.targets['linux-x64'].sha256 = digest(tar);
  fixture.manifest.uv.targets['linux-x64'].url = 'https://releases.astral.sh/github/uv/releases/download/0.11.3/uv-x86_64-unknown-linux-gnu.tar.gz';
  const result = await fixture.manager.installRuntime();
  assert.equal(result.status, 'ready', result.message);

  const malformed = makeFixture({ uvBytes: Buffer.from('not a tar.gz') });
  malformed.manager.platform = 'linux';
  malformed.manager.arch = 'x64';
  malformed.manifest.uv.targets['linux-x64'].sha256 = digest(malformed.uvBytes);
  malformed.manifest.uv.targets['linux-x64'].url = 'https://releases.astral.sh/github/uv/releases/download/0.11.3/uv-x86_64-unknown-linux-gnu.tar.gz';
  const rejected = await malformed.manager.installRuntime();
  assert.equal(rejected.status, 'error');
  assert.equal(malformed.fs.files.size, 0);
});
