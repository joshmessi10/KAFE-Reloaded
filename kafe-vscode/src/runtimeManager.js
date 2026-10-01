const { createHash } = require('node:crypto');
const defaultFileSystem = require('node:fs/promises');
const https = require('node:https');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { gunzipSync } = require('node:zlib');
const yauzl = require('yauzl');
const { knowledgeContentDigest } = require('./tutor/KnowledgeRetriever');

const PINNED_MANIFEST = require('./runtimeManifest.json');
const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024;
const MAX_METADATA_BYTES = 64 * 1024;
const MAX_EXPANDED_BYTES = 128 * 1024 * 1024;
const MAX_MEMBER_BYTES = 32 * 1024 * 1024;
const MAX_ARCHIVE_MEMBERS = 4096;
const MAX_REDIRECTS = 4;
const REQUIRED_RUNTIME_MEMBERS = [
  'pyproject.toml',
  'uv.lock',
  'src/Kafe.py',
  'src/Kafe_GrammarLexer.py',
  'src/Kafe_GrammarParser.py',
  'src/Kafe_GrammarVisitor.py',
  'knowledge-pack/grammar/Kafe_Grammar.g4',
  'knowledge-pack/grammar/Kafe_Lexer.g4',
];
const KNOWLEDGE_SECTIONS = ['getting-started', 'language', 'libraries', 'specification', 'errors', 'examples'];
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const REDIRECT_HOSTS = new Set(['release-assets.githubusercontent.com']);
const RELEASE_HOSTS = new Set(['github.com', 'releases.astral.sh']);

function getRuntimeTarget(platform, arch, manifest = PINNED_MANIFEST) {
  const key = `${platform}-${arch}`;
  const target = manifest.uv.targets[key];
  if (!target) {
    throw new Error(`KAFE's managed runtime does not support ${platform}/${arch}. Use Windows x64, macOS x64 or arm64, or Linux x64, or run KAFE from a contributor checkout.`);
  }
  return { ...target, key };
}

function validateAssetUrl(value, { redirect = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('KAFE runtime asset URL is invalid.');
  }
  if (url.protocol !== 'https:') throw new Error('KAFE runtime downloads require HTTPS.');
  if (url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('KAFE runtime asset URL contains a disallowed authority.');
  }
  if (redirect) {
    if (!REDIRECT_HOSTS.has(url.hostname.toLowerCase())) {
      throw new Error(`KAFE runtime redirect host is not allowed: ${url.hostname}`);
    }
    return true;
  }
  if (!RELEASE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`KAFE runtime asset host is not allowed: ${url.hostname}`);
  }
  return true;
}

function expectedUrl(value, host, pathname) {
  const url = new URL(value);
  validateAssetUrl(value);
  if (url.hostname !== host || url.pathname !== pathname || url.search || url.hash) {
    throw new Error('KAFE runtime manifest contains a URL outside the pinned release asset.');
  }
}

function validatePinnedManifest(manifest) {
  const runtime = manifest.runtime;
  const uv = manifest.uv;
  if (!runtime || !uv || runtime.version !== '0.1.0' || runtime.knowledgePackVersion !== '0.1.0' ||
    runtime.pythonRequirement !== '>=3.10' || runtime.antlrRuntimeVersion !== '4.13.2' ||
    runtime.sourceRevision !== '857a07dfaecda2583c3f0460d5756ea6893f19d7' ||
    !/^[a-f0-9]{64}$/.test(runtime.archiveSha256) || uv.version !== '0.11.3') {
    throw new Error('KAFE runtime manifest does not match the pinned runtime versions.');
  }
  const base = `https://github.com/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v${runtime.version}`;
  expectedUrl(runtime.archiveUrl, 'github.com', `/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v${runtime.version}/kafe-runtime-${runtime.version}.zip`);
  expectedUrl(runtime.manifestUrl, 'github.com', `/joshmessi10/KAFE-Reloaded/releases/download/kafe-runtime-v${runtime.version}/kafe-runtime-${runtime.version}.manifest.json`);
  if (runtime.archiveUrl !== `${base}/kafe-runtime-${runtime.version}.zip` ||
    runtime.manifestUrl !== `${base}/kafe-runtime-${runtime.version}.manifest.json`) {
    throw new Error('KAFE runtime release asset names do not match the pinned release workflow.');
  }
  for (const [key, target] of Object.entries(uv.targets)) {
    if (!/^[a-f0-9]{64}$/.test(target.sha256)) throw new Error(`uv ${key} has no verified SHA-256 checksum.`);
    const assetUrl = `https://releases.astral.sh/github/uv/releases/download/${uv.version}/${target.asset}`;
    const checksumUrl = `https://releases.astral.sh/github/uv/releases/download/${uv.version}/${target.asset}.sha256`;
    expectedUrl(target.url, 'releases.astral.sh', `/github/uv/releases/download/${uv.version}/${target.asset}`);
    expectedUrl(target.checksumUrl, 'releases.astral.sh', `/github/uv/releases/download/${uv.version}/${target.asset}.sha256`);
    if (target.url !== assetUrl || target.checksumUrl !== checksumUrl) {
      throw new Error(`uv ${key} release asset URL is not pinned to ${uv.version}.`);
    }
  }
}

function defaultHttpsRequest(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { signal }, response => {
      const statusCode = response.statusCode ?? 0;
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        response.resume();
        resolve({ statusCode, headers: response.headers, location, body: Buffer.alloc(0) });
        return;
      }
      const chunks = [];
      let received = 0;
      response.on('data', chunk => {
        received += chunk.length;
        if (received > MAX_DOWNLOAD_BYTES) {
          request.destroy(new Error('KAFE release asset exceeds the 64 MiB download limit.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function downloadPinnedAsset(startUrl, { transport = defaultHttpsRequest, signal, maxBytes = MAX_DOWNLOAD_BYTES } = {}) {
  validateAssetUrl(startUrl);
  let currentUrl = startUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    if (signal?.aborted) throw abortError();
    const response = await transport(currentUrl, { signal });
    const statusCode = response.statusCode ?? response.status;
    const location = response.location ?? response.headers?.location;
    if ([301, 302, 303, 307, 308].includes(statusCode)) {
      if (!location || redirects === MAX_REDIRECTS) throw new Error('KAFE release asset exceeded the redirect limit.');
      const redirected = new URL(location, currentUrl).href;
      validateAssetUrl(redirected, { redirect: true });
      currentUrl = redirected;
      continue;
    }
    if (statusCode !== 200) throw new Error(`KAFE release asset request failed with HTTP ${statusCode}.`);
    const body = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body ?? []);
    if (body.length > maxBytes) throw new Error(`KAFE release asset exceeds the ${maxBytes} byte download limit.`);
    return { bytes: body, finalUrl: currentUrl };
  }
  throw new Error('KAFE release asset exceeded the redirect limit.');
}

function abortError() {
  const error = new Error('KAFE runtime setup was cancelled.');
  error.name = 'AbortError';
  return error;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function readBoundedRegularFile(fileSystem, filePath, maxBytes) {
  const lstat = fileSystem.lstat;
  if (typeof lstat !== 'function') throw new Error(`Cannot lstat cached file before reading: ${filePath}`);
  const info = await lstat.call(fileSystem, filePath);
  if (!info.isFile() || info.isSymbolicLink?.()) throw new Error(`Cached path is not a regular file: ${filePath}`);
  if (!Number.isSafeInteger(info.size) || info.size < 0 || info.size > maxBytes) {
    throw new Error(`Cached file exceeds the ${maxBytes} byte size limit: ${filePath}`);
  }
  const value = await fileSystem.readFile(filePath);
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (bytes.length > maxBytes || bytes.length !== info.size) {
    throw new Error(`Cached file changed size while being read: ${filePath}`);
  }
  return bytes;
}

function canonicalMemberPath(name, isDirectory = false) {
  if (typeof name !== 'string' || !name || name.includes('\0') || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name)) {
    throw new Error(`Unsafe archive member path: ${String(name)}`);
  }
  const withoutSlash = isDirectory && name.endsWith('/') ? name.slice(0, -1) : name;
  const parts = withoutSlash.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error(`Unsafe archive member path: ${name}`);
  for (const part of parts) {
    if (part.endsWith('.') || part.endsWith(' ') || /[<>:"|?*\x00-\x1f]/.test(part) || WINDOWS_RESERVED.test(part)) {
      throw new Error(`Unsafe archive member path: ${name}`);
    }
  }
  return { name: withoutSlash, parts, key: parts.map(part => part.normalize('NFC').toLocaleLowerCase('en-US')).join('/') };
}

function validateMemberSet(entries) {
  if (entries.length > MAX_ARCHIVE_MEMBERS) throw new Error('Archive contains too many members.');
  const memberMap = new Map();
  let expandedBytes = 0;
  for (const entry of entries) {
    const safe = canonicalMemberPath(entry.fileName, entry.isDirectory);
    if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0 || entry.uncompressedSize > MAX_MEMBER_BYTES) {
      throw new Error(`Archive member exceeds the ${MAX_MEMBER_BYTES} byte per-file limit: ${entry.fileName}`);
    }
    expandedBytes += entry.uncompressedSize;
    if (expandedBytes > MAX_EXPANDED_BYTES) throw new Error('Archive exceeds the 128 MiB expanded-size limit.');
    const type = entry.isDirectory ? 'directory' : 'file';
    if (memberMap.has(safe.key)) throw new Error(`Duplicate or colliding archive member: ${entry.fileName}`);
    const parts = safe.key.split('/');
    for (let index = 1; index < parts.length; index++) {
      const ancestor = parts.slice(0, index).join('/');
      if (memberMap.get(ancestor) === 'file') throw new Error(`Archive member collides with a file path: ${entry.fileName}`);
    }
    if (type === 'file') {
      const prefix = `${safe.key}/`;
      for (const existing of memberMap.keys()) if (existing.startsWith(prefix)) {
        throw new Error(`Archive file collides with a directory path: ${entry.fileName}`);
      }
    }
    memberMap.set(safe.key, type);
    entry.safeName = safe.name;
    entry.pathParts = safe.parts;
  }
  return { memberMap, expandedBytes };
}

function zipIsDirectory(entry) {
  const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
  const kind = mode & 0o170000;
  if (kind && kind !== 0o100000 && kind !== 0o040000) {
    throw new Error(`Archive contains a symlink or special ZIP member: ${entry.fileName}`);
  }
  const directoryByName = entry.fileName.endsWith('/');
  if (kind === 0o040000 && !directoryByName) throw new Error(`Malformed directory archive member: ${entry.fileName}`);
  if (kind === 0o100000 && directoryByName) throw new Error(`Malformed file archive member: ${entry.fileName}`);
  return directoryByName || kind === 0o040000;
}

function openZip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, {
      lazyEntries: true,
      decodeStrings: true,
      validateEntrySizes: true,
      strictFileNames: true,
    }, (error, zipfile) => error ? reject(error) : resolve(zipfile));
  });
}

async function inspectZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_DOWNLOAD_BYTES) throw new Error('ZIP archive is missing or exceeds the download limit.');
  const zipfile = await openZip(buffer);
  const entries = await new Promise((resolve, reject) => {
    const output = [];
    let settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    zipfile.on('error', fail);
    zipfile.on('entry', entry => {
      if (settled) return;
      try {
        if (output.length >= MAX_ARCHIVE_MEMBERS) throw new Error('Archive contains too many members.');
        const isDirectory = zipIsDirectory(entry);
        const type = (entry.externalFileAttributes >>> 16) & 0xffff & 0o170000;
        if (type !== 0 && type !== 0o100000 && type !== 0o040000) throw new Error(`Archive contains an unsupported member type: ${entry.fileName}`);
        if (entry.generalPurposeBitFlag & 0x1) throw new Error(`Encrypted ZIP members are not supported: ${entry.fileName}`);
        if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) throw new Error(`Unsupported ZIP compression method: ${entry.fileName}`);
        output.push({
          fileName: entry.fileName,
          uncompressedSize: entry.uncompressedSize,
          compressedSize: entry.compressedSize,
          isDirectory,
          mode: ((entry.externalFileAttributes >>> 16) & 0o777) || (isDirectory ? 0o755 : 0o644),
          externalFileAttributes: entry.externalFileAttributes,
        });
        zipfile.readEntry();
      } catch (error) {
        fail(error);
      }
    });
    zipfile.on('end', () => {
      if (settled) return;
      try {
        validateMemberSet(output);
        resolve(output);
      } catch (error) {
        fail(error);
      }
    });
    zipfile.readEntry();
  });
  return entries;
}

async function inspectZipWithHashes(buffer, { captureKnowledgeBytes = false } = {}) {
  const entries = await inspectZip(buffer);
  const filesByName = new Map(entries.filter(entry => !entry.isDirectory).map(entry => [entry.safeName, entry]));
  const zipfile = await openZip(buffer);
  await new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (error) {
        try { zipfile.close(); } catch { /* best effort */ }
        reject(error);
      } else resolve();
    };
    const next = () => { if (!settled) zipfile.readEntry(); };
    zipfile.on('error', finish);
    zipfile.on('entry', entry => {
      if (settled) return;
      try {
        const isDirectory = zipIsDirectory(entry);
        if (isDirectory) {
          next();
          return;
        }
        const safe = canonicalMemberPath(entry.fileName, false);
        const expected = filesByName.get(safe.name);
        if (!expected) throw new Error(`ZIP member changed during archive verification: ${entry.fileName}`);
        readZipEntry(zipfile, entry).then(contents => {
          expected.sha256 = sha256(contents);
          expected.archiveSize = contents.length;
          if (captureKnowledgeBytes && safe.name.startsWith('knowledge-pack/')) expected.data = contents;
          next();
        }, finish);
      } catch (error) {
        finish(error);
      }
    });
    zipfile.on('end', () => {
      if (entries.some(entry => !entry.isDirectory && !entry.sha256)) {
        finish(new Error('ZIP archive did not provide every file member for integrity verification.'));
      } else finish();
    });
    zipfile.readEntry();
  });
  return entries;
}

function streamToBuffer(stream, expectedSize) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    stream.on('data', chunk => {
      total += chunk.length;
      if (total > expectedSize || total > MAX_MEMBER_BYTES) {
        stream.destroy(new Error('ZIP member expanded beyond its validated size.'));
        return;
      }
      chunks.push(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => {
      if (total !== expectedSize) reject(new Error('ZIP member size does not match the validated directory.'));
      else resolve(Buffer.concat(chunks));
    });
  });
}

function readZipEntry(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (error, stream) => {
      if (error) reject(error);
      else streamToBuffer(stream, entry.uncompressedSize).then(resolve, reject);
    });
  });
}

async function extractZip(buffer, destinationRoot, fileSystem, pathApi, { required = [], requireKnowledgePack = false } = {}) {
  const inspected = await inspectZip(buffer);
  const names = new Set(inspected.filter(entry => !entry.isDirectory).map(entry => entry.safeName));
  const missing = required.filter(name => !names.has(name));
  if (requireKnowledgePack) {
    for (const section of KNOWLEDGE_SECTIONS) {
      if (!inspected.some(entry => !entry.isDirectory && entry.safeName.startsWith(`knowledge-pack/${section}/`))) {
        missing.push(`knowledge-pack/${section}/`);
      }
    }
  }
  if (missing.length) throw new Error(`Archive is missing required members: ${missing.join(', ')}.`);
  const zipfile = await openZip(buffer);
  await new Promise((resolve, reject) => {
    let settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    zipfile.on('error', fail);
    zipfile.on('entry', entry => {
      if (settled) return;
      const isDirectory = zipIsDirectory(entry);
      const safe = canonicalMemberPath(entry.fileName, isDirectory);
      const destination = pathApi.join(destinationRoot, ...safe.parts);
      const next = () => {
        if (!settled) zipfile.readEntry();
      };
      if (isDirectory) {
        fileSystem.mkdir(destination, { recursive: true }).then(next, fail);
        return;
      }
      fileSystem.mkdir(pathApi.dirname(destination), { recursive: true }).then(() =>
        readZipEntry(zipfile, entry).then(contents => fileSystem.writeFile(destination, contents, {
          mode: ((entry.externalFileAttributes >>> 16) & 0o777) || 0o644,
        }))
      ).then(next, fail);
    });
    zipfile.on('end', () => {
      if (settled) return;
      settled = true;
      resolve();
    });
    zipfile.readEntry();
  });
}

function tarString(block, start, length) {
  const end = block.indexOf(0, start);
  const stop = end < 0 || end >= start + length ? start + length : end;
  return block.toString('utf8', start, stop);
}

function tarOctal(block, start, length) {
  const field = block.subarray(start, start + length);
  if (field[0] & 0x80) throw new Error('Base-256 TAR numeric fields are not supported.');
  const value = field.toString('ascii').replace(/\0.*$/, '').trim();
  if (!value) return 0;
  if (!/^[0-7]+$/.test(value)) throw new Error('TAR archive contains a malformed octal field.');
  const number = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(number)) throw new Error('TAR archive contains an unsafe member size.');
  return number;
}

function inspectTarGz(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_DOWNLOAD_BYTES) throw new Error('TAR archive is missing or exceeds the download limit.');
  let tar;
  try {
    tar = gunzipSync(buffer, { maxOutputLength: MAX_EXPANDED_BYTES + 1024 * 1024 });
  } catch (error) {
    throw new Error(`Malformed or oversized TAR gzip archive: ${error.message}`);
  }
  const entries = [];
  let offset = 0;
  let expandedBytes = 0;
  let ended = false;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) {
      if (offset + 1024 > tar.length || tar.subarray(offset, offset + 1024).some(byte => byte !== 0)) {
        throw new Error('Malformed TAR end-of-archive marker.');
      }
      if (tar.subarray(offset + 1024).some(byte => byte !== 0)) throw new Error('Unexpected data after TAR end-of-archive marker.');
      ended = true;
      break;
    }
    if (entries.length >= MAX_ARCHIVE_MEMBERS) throw new Error('Archive contains too many members.');
    const expectedChecksum = tarOctal(header, 148, 8);
    let actualChecksum = 0;
    for (let index = 0; index < 512; index++) actualChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    if (expectedChecksum !== actualChecksum) throw new Error('TAR header checksum is invalid.');
    const name = tarString(header, 0, 100);
    const prefix = tarString(header, 345, 155);
    const fileName = prefix ? `${prefix}/${name}` : name;
    const typeFlag = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    const isDirectory = typeFlag === '5';
    if (typeFlag !== '0' && typeFlag !== '5') {
      throw new Error(`TAR archive contains a link or unsupported member type: ${fileName}`);
    }
    const safe = canonicalMemberPath(fileName, isDirectory);
    const size = tarOctal(header, 124, 12);
    const mode = tarOctal(header, 100, 8) & 0o777;
    if (isDirectory && size !== 0) throw new Error(`TAR directory member has data: ${fileName}`);
    if (size > MAX_MEMBER_BYTES) throw new Error(`Archive member exceeds the ${MAX_MEMBER_BYTES} byte per-file limit: ${fileName}`);
    expandedBytes += size;
    if (expandedBytes > MAX_EXPANDED_BYTES) throw new Error('Archive exceeds the 128 MiB expanded-size limit.');
    const dataOffset = offset + 512;
    if (dataOffset + size > tar.length) throw new Error(`TAR member data is truncated: ${fileName}`);
    entries.push({ fileName: safe.name, isDirectory, uncompressedSize: size, mode, data: tar.subarray(dataOffset, dataOffset + size) });
    offset = dataOffset + Math.ceil(size / 512) * 512;
  }
  if (!ended || offset > tar.length) throw new Error('TAR archive is missing a valid end-of-archive marker.');
  validateMemberSet(entries);
  return entries;
}

async function extractTarGz(buffer, destinationRoot, fileSystem, pathApi, { required = [] } = {}) {
  const entries = inspectTarGz(buffer);
  const names = new Set(entries.filter(entry => !entry.isDirectory).map(entry => entry.safeName));
  const missing = required.filter(name => !names.has(name));
  if (missing.length) throw new Error(`Archive is missing required members: ${missing.join(', ')}.`);
  for (const entry of entries) {
    const destination = pathApi.join(destinationRoot, ...entry.pathParts);
    if (entry.isDirectory) await fileSystem.mkdir(destination, { recursive: true });
    else {
      await fileSystem.mkdir(pathApi.dirname(destination), { recursive: true });
      await fileSystem.writeFile(destination, entry.data, { mode: entry.mode || 0o644 });
    }
  }
}

async function extractPinnedArchive(buffer, format, destinationRoot, fileSystem, pathApi, options) {
  if (format === 'zip') return extractZip(buffer, destinationRoot, fileSystem, pathApi, options);
  if (format === 'tar.gz') return extractTarGz(buffer, destinationRoot, fileSystem, pathApi, options);
  throw new Error(`Unsupported pinned archive format: ${format}`);
}

function hasRequiredRuntimeMembers(entries) {
  const files = new Set(entries.filter(entry => !entry.isDirectory).map(entry => entry.safeName));
  if (REQUIRED_RUNTIME_MEMBERS.some(member => !files.has(member))) return false;
  return KNOWLEDGE_SECTIONS.every(section => entries.some(entry => !entry.isDirectory &&
    entry.safeName.startsWith(`knowledge-pack/${section}/`)));
}

function archiveTree(entries, extraFiles = []) {
  const expected = new Map();
  for (const entry of entries) {
    const safeName = entry.safeName ?? canonicalMemberPath(entry.fileName, entry.isDirectory).name;
    const parts = entry.pathParts ?? safeName.split('/');
    for (let index = 1; index < parts.length; index++) {
      const ancestor = parts.slice(0, index).join('/');
      if (expected.get(ancestor)?.type === 'file') throw new Error(`Archive member collides with a file path: ${safeName}`);
      expected.set(ancestor, { type: 'directory' });
    }
    if (entry.isDirectory) {
      expected.set(safeName, { type: 'directory' });
    } else {
      const fileHash = entry.sha256 ?? (Buffer.isBuffer(entry.data) ? sha256(entry.data) : undefined);
      if (!fileHash) throw new Error(`Archive file has no verified content hash: ${safeName}`);
      expected.set(safeName, {
        type: 'file',
        sha256: fileHash,
        size: entry.archiveSize ?? entry.uncompressedSize,
      });
    }
  }
  for (const name of extraFiles) {
    const safe = canonicalMemberPath(name, false);
    if (expected.has(safe.name)) throw new Error(`Runtime metadata collides with an archive member: ${name}`);
    expected.set(safe.name, { type: 'file' });
  }
  return expected;
}

async function matchesExtractedTree(root, entries, fileSystem, pathApi, { extraFiles = [] } = {}) {
  const expected = archiveTree(entries, extraFiles);
  const actual = new Map();
  const foldedPaths = new Set();
  const statPath = async filePath => {
    const lstat = fileSystem.lstat ?? fileSystem.stat;
    const info = await lstat.call(fileSystem, filePath);
    if (info.isSymbolicLink?.()) return undefined;
    if (info.isDirectory()) return { type: 'directory', info };
    if (info.isFile()) return { type: 'file', info };
    return undefined;
  };
  const rootInfo = await statPath(root);
  if (!rootInfo || rootInfo.type !== 'directory') return false;

  async function walk(directory, prefix = '') {
    const children = await fileSystem.readdir(directory);
    for (const name of children) {
      if (actual.size >= expected.size) return false;
      if (typeof name !== 'string' || !name || name === '.' || name === '..' ||
        name.includes('/') || name.includes('\\') || pathApi.basename(name) !== name) return false;
      const filePath = pathApi.join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      const kind = await statPath(filePath);
      if (!kind) return false;
      let safe;
      try { safe = canonicalMemberPath(relative, kind.type === 'directory'); }
      catch { return false; }
      if (safe.name !== relative || actual.has(relative) || foldedPaths.has(safe.key)) return false;
      foldedPaths.add(safe.key);
      actual.set(relative, { ...kind, filePath });
      if (kind.type === 'directory' && !await walk(filePath, relative)) return false;
    }
    return true;
  }

  if (!await walk(root) || actual.size !== expected.size) return false;
  for (const [relative, expectation] of expected) {
    const extracted = actual.get(relative);
    if (!extracted || extracted.type !== expectation.type) return false;
    if (expectation.type === 'file' && expectation.sha256) {
      if (Number.isSafeInteger(extracted.info.size) && extracted.info.size !== expectation.size) return false;
      if (sha256(await fileSystem.readFile(extracted.filePath)) !== expectation.sha256) return false;
    }
  }
  return true;
}

function defaultProcessRunner(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) return reject(abortError());
    let child;
    try {
      child = spawn(executable, args, {
        cwd: options.cwd,
        env: options.env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      reject(error);
      return;
    }
    const output = { stdout: [], stderr: [], bytes: 0, outputTruncated: false };
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve(result);
    };
    const abort = () => child.kill('SIGTERM');
    options.signal?.addEventListener('abort', abort, { once: true });
    const collect = channel => chunk => {
      const room = 1024 * 1024 - output.bytes;
      if (room > 0) {
        const kept = chunk.subarray(0, room);
        output[channel].push(kept);
        output.bytes += kept.length;
      }
      if (chunk.length > room) output.outputTruncated = true;
    };
    child.stdout.on('data', collect('stdout'));
    child.stderr.on('data', collect('stderr'));
    child.once('error', error => finish(error));
    child.once('close', exitCode => {
      if (options.signal?.aborted) return finish(abortError());
      finish(null, {
        exitCode: Number.isInteger(exitCode) ? exitCode : null,
        stdout: Buffer.concat(output.stdout).toString('utf8'),
        stderr: Buffer.concat(output.stderr).toString('utf8'),
        outputTruncated: output.outputTruncated,
      });
    });
  });
}

function createRuntimeManager({
  storageRoot,
  fileSystem = defaultFileSystem,
  pathApi = path,
  platform = process.platform,
  arch = process.arch,
  manifest = PINNED_MANIFEST,
  transport = defaultHttpsRequest,
  processRunner = defaultProcessRunner,
  confirmDownload,
} = {}) {
  if (!storageRoot) throw new Error('Extension global storage root is required for the KAFE runtime.');
  validatePinnedManifest(manifest);
  const manager = { storageRoot, fileSystem, pathApi, platform, arch, manifest, transport, processRunner, confirmDownload };

  function getPaths() {
    const target = getRuntimeTarget(manager.platform, manager.arch, manager.manifest);
    const root = pathApi.join(storageRoot, 'kafe-runtime');
    const uvRoot = pathApi.join(root, 'uv', manager.manifest.uv.version, target.key);
    const uvStageRoot = `${uvRoot}.staging`;
    const runtimeRoot = pathApi.join(root, `runtime-${manager.manifest.runtime.version}`);
    const stagingRoot = pathApi.join(root, `runtime-${manager.manifest.runtime.version}.staging`);
    const artifactRoot = pathApi.join(root, 'artifacts', manager.manifest.runtime.version);
    const pythonInstallDir = pathApi.join(root, 'python', manager.manifest.uv.version, target.key);
    const uvCacheDir = pathApi.join(root, 'uv-cache', manager.manifest.uv.version, target.key);
    return {
      root,
      target,
      uvRoot,
      uvStageRoot,
      uvArchive: pathApi.join(root, 'artifacts', manager.manifest.uv.version, target.asset),
      uvPath: pathApi.join(uvRoot, ...target.executable.split('/')),
      uvStagePath: pathApi.join(uvStageRoot, ...target.executable.split('/')),
      runtimeRoot,
      stagingRoot,
      runtimeArchive: pathApi.join(artifactRoot, `kafe-runtime-${manager.manifest.runtime.version}.zip`),
      runtimeManifest: pathApi.join(artifactRoot, `kafe-runtime-${manager.manifest.runtime.version}.manifest.json`),
      readyFile: pathApi.join(runtimeRoot, '.kafe-ready.json'),
      stagingReadyFile: pathApi.join(stagingRoot, '.kafe-ready.json'),
      pythonInstallDir,
      pythonEnvironment: pathApi.join(pythonInstallDir, 'environment'),
      uvCacheDir,
    };
  }
  Object.defineProperty(manager, 'paths', { get: getPaths });

  async function exists(filePath, type) {
    try {
      const lstat = fileSystem.lstat ?? fileSystem.stat;
      const info = await lstat.call(fileSystem, filePath);
      if (type === 'file') return info.isFile() && !info.isSymbolicLink?.();
      if (type === 'directory') return info.isDirectory() && !info.isSymbolicLink?.();
      return true;
    } catch {
      return false;
    }
  }

  async function readReadyRuntime() {
    let paths;
    try {
      paths = getPaths();
    } catch (error) {
      return { status: 'unsupported', message: error.message };
    }
    try {
      const markerBytes = await readBoundedRegularFile(fileSystem, paths.readyFile, MAX_METADATA_BYTES);
      const marker = JSON.parse(markerBytes.toString('utf8'));
      const runtime = manifest.runtime;
      const uvTarget = paths.target;
      if (marker.runtimeVersion !== runtime.version || marker.knowledgePackVersion !== runtime.knowledgePackVersion ||
        marker.runtimeArchiveSha256 !== runtime.archiveSha256 || marker.uvVersion !== manifest.uv.version ||
        marker.uvSha256 !== uvTarget.sha256 || marker.target !== uvTarget.key ||
        !await exists(paths.runtimeRoot, 'directory') || !await exists(paths.uvPath, 'file') ||
        !await exists(pathApi.join(paths.runtimeRoot, 'pyproject.toml'), 'file') ||
        !await exists(pathApi.join(paths.runtimeRoot, 'uv.lock'), 'file') ||
        !await exists(pathApi.join(paths.runtimeRoot, 'src', 'Kafe.py'), 'file')) {
        return { status: 'missing' };
      }
      const remoteManifestBytes = await readBoundedRegularFile(fileSystem, paths.runtimeManifest, MAX_METADATA_BYTES);
      const remoteManifest = JSON.parse(remoteManifestBytes.toString('utf8'));
      validateRuntimeSidecar(remoteManifest, manifest.runtime);
      const runtimeArchive = await readBoundedRegularFile(fileSystem, paths.runtimeArchive, MAX_DOWNLOAD_BYTES);
      const uvArchive = await readBoundedRegularFile(fileSystem, paths.uvArchive, MAX_DOWNLOAD_BYTES);
      if (sha256(runtimeArchive) !== runtime.archiveSha256 || sha256(uvArchive) !== uvTarget.sha256) {
        return { status: 'missing' };
      }
      const runtimeEntries = await inspectZipWithHashes(runtimeArchive);
      if (!hasRequiredRuntimeMembers(runtimeEntries)) return { status: 'missing' };
      const uvEntries = uvTarget.format === 'zip'
        ? await inspectZipWithHashes(uvArchive)
        : inspectTarGz(uvArchive);
      if (!uvEntries.some(entry => !entry.isDirectory && entry.safeName === uvTarget.executable)) {
        return { status: 'missing' };
      }
      if (!await matchesExtractedTree(paths.runtimeRoot, runtimeEntries, fileSystem, pathApi, {
        extraFiles: ['.kafe-ready.json'],
      }) || !await matchesExtractedTree(paths.uvRoot, uvEntries, fileSystem, pathApi)) {
        return { status: 'missing' };
      }
      return runtimeResult(paths, 'managed');
    } catch {
      return { status: 'missing' };
    }
  }

  /** @returns {Promise<{status:'ready',knowledgeRoot:string,runtimeVersion:string,knowledgePackVersion:string,packIdentity:string,expectedContentSha256:string,expectedFileCount:number}|{status:'unavailable',code:string}>} */
  async function readReadyKnowledgePack() {
    const runtime = manifest.runtime;
    const root = pathApi.join(storageRoot, 'kafe-runtime');
    const runtimeRoot = pathApi.join(root, `runtime-${runtime.version}`);
    const artifactRoot = pathApi.join(root, 'artifacts', runtime.version);
    const knowledgeRoot = pathApi.join(runtimeRoot, 'knowledge-pack');
    const archivePath = pathApi.join(artifactRoot, `kafe-runtime-${runtime.version}.zip`);
    const sidecarPath = pathApi.join(artifactRoot, `kafe-runtime-${runtime.version}.manifest.json`);
    const unavailable = code => ({ status: 'unavailable', code });
    if (!await exists(runtimeRoot, 'directory') || !await exists(knowledgeRoot, 'directory') ||
      !await exists(archivePath, 'file') || !await exists(sidecarPath, 'file')) return unavailable('knowledge_missing');
    try {
      const sidecar = JSON.parse((await readBoundedRegularFile(fileSystem, sidecarPath, MAX_METADATA_BYTES)).toString('utf8'));
      validateRuntimeSidecar(sidecar, runtime);
      const archive = await readBoundedRegularFile(fileSystem, archivePath, MAX_DOWNLOAD_BYTES);
      if (sha256(archive) !== runtime.archiveSha256) return unavailable('knowledge_integrity_failed');
      const entries = await inspectZipWithHashes(archive, { captureKnowledgeBytes: true });
      if (!hasRequiredRuntimeMembers(entries)) return unavailable('knowledge_integrity_failed');
      const knowledgeEntries = entries.filter(entry => entry.safeName.startsWith('knowledge-pack/') && entry.safeName !== 'knowledge-pack/');
      const relativeEntries = knowledgeEntries.map(entry => ({ ...entry,
        safeName: entry.safeName.slice('knowledge-pack/'.length),
        pathParts: entry.pathParts.slice(1) }));
      const files = relativeEntries.filter(entry => !entry.isDirectory).map(entry => ({ relative: entry.safeName, bytes: entry.data }));
      const digest = knowledgeContentDigest(files);
      if (!await matchesExtractedTree(knowledgeRoot, relativeEntries, fileSystem, pathApi)) return unavailable('knowledge_integrity_failed');
      return { status: 'ready', knowledgeRoot, runtimeVersion: runtime.version,
        knowledgePackVersion: runtime.knowledgePackVersion, packIdentity: knowledgeRoot,
        expectedContentSha256: digest.contentSha256, expectedFileCount: digest.fileCount };
    } catch {
      return unavailable('knowledge_integrity_failed');
    }
  }

  async function isContributorRoot(workspaceRoot) {
    const required = ['pyproject.toml', 'uv.lock', pathApi.join('src', 'Kafe.py')];
    for (const name of required) if (!await exists(pathApi.join(workspaceRoot, name), 'file')) return false;
    return true;
  }

  function runtimeResult(paths, runtimeMode) {
    return {
      status: 'ready',
      runtimeMode,
      runtimeRoot: paths.runtimeRoot,
      uvPath: paths.uvPath,
      uvEnvironment: {
        UV_PROJECT_ENVIRONMENT: paths.pythonEnvironment,
        UV_PYTHON_INSTALL_DIR: paths.pythonInstallDir,
        UV_CACHE_DIR: paths.uvCacheDir,
      },
      pythonEnvironment: paths.pythonEnvironment,
      pythonInstallDir: paths.pythonInstallDir,
      uvCacheDir: paths.uvCacheDir,
      runtimeVersion: manifest.runtime.version,
      knowledgePackVersion: manifest.runtime.knowledgePackVersion,
      target: paths.target.key,
    };
  }

  async function resolveWorkspace(workspaceRoot) {
    if (await isContributorRoot(workspaceRoot)) {
      let result;
      try {
        result = await processRunner('uv', ['--version'], { cwd: workspaceRoot, shell: false });
      } catch (error) {
        return { status: 'unavailable', runtimeMode: 'contributor', message: `Install uv from https://docs.astral.sh/uv/getting-started/installation/ to run KAFE in this contributor checkout. ${error.message}` };
      }
      if (result.exitCode !== 0 || !/^uv \d+\.\d+\.\d+(?:\s|$)/.test(result.stdout.trim())) {
        return {
          status: 'unavailable', runtimeMode: 'contributor',
          message: `Install uv ${manifest.uv.version} or a compatible uv release from https://docs.astral.sh/uv/getting-started/installation/ to run KAFE in this contributor checkout. Editing remains available.`,
        };
      }
      return { status: 'ready', runtimeMode: 'contributor', runtimeRoot: workspaceRoot, uvPath: 'uv', uvEnvironment: {} };
    }
    const cached = await readReadyRuntime();
    if (cached.status === 'ready') return cached;
    if (cached.status === 'unsupported') return cached;
    return {
      status: 'unavailable', runtimeMode: 'managed',
      message: `The pinned KAFE runtime ${manifest.runtime.version} is not available in this extension package yet. Use KAFE: Install Runtime after the release is published.`,
    };
  }

  async function checkUvVersion(uvPath, paths, signal) {
    const result = await processRunner(uvPath, ['--version'], {
      cwd: paths.root,
      env: makeUvEnvironment(paths),
      shell: false,
      signal,
    });
    const expected = new RegExp(`^uv ${escapeRegExp(manifest.uv.version)}(?:\\s|$)`);
    if (result.exitCode !== 0 || !expected.test(result.stdout.trim())) {
      throw new Error(`Pinned uv version verification failed; expected uv ${manifest.uv.version}.`);
    }
  }

  function makeUvEnvironment(paths) {
    return {
      ...process.env,
      UV_PROJECT_ENVIRONMENT: paths.pythonEnvironment,
      UV_PYTHON_INSTALL_DIR: paths.pythonInstallDir,
      UV_CACHE_DIR: paths.uvCacheDir,
    };
  }

  async function cleanup(paths, { preserveReady = false } = {}) {
    const candidates = [paths.stagingRoot, paths.uvStageRoot, paths.runtimeArchive, paths.runtimeManifest,
      paths.uvArchive, paths.uvRoot, paths.pythonInstallDir, paths.uvCacheDir];
    if (!preserveReady) candidates.push(paths.runtimeRoot);
    for (const candidate of candidates) {
      try { await fileSystem.rm(candidate, { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
    }
  }

  async function installRuntime({ signal, onProgress = () => {} } = {}) {
    const progress = stage => { try { onProgress({ stage }); } catch { /* presentation must not change runtime validation */ } };
    progress('checking');
    let paths;
    try {
      paths = getPaths();
    } catch (error) {
      return { status: 'unsupported', message: error.message };
    }
    const cached = await readReadyRuntime();
    if (cached.status === 'ready') return cached;
    if (!manifest.runtime.releasePublished) {
      return {
        status: 'unavailable',
        message: `KAFE runtime ${manifest.runtime.version} is not published yet. Setup will be available after the pinned GitHub release is published.`,
      };
    }
    if (typeof manager.confirmDownload !== 'function') {
      return { status: 'cancelled', message: 'Confirm the first KAFE runtime download before setup can continue.' };
    }
    let confirmed = false;
    try {
      progress('confirming');
      confirmed = await manager.confirmDownload({ runtimeVersion: manifest.runtime.version, uvVersion: manifest.uv.version });
    } catch (error) {
      return { status: 'cancelled', message: error.message };
    }
    if (!confirmed || signal?.aborted) return { status: 'cancelled', message: 'KAFE runtime setup was cancelled.' };

    await cleanup(paths);
    try {
      await fileSystem.mkdir(paths.root, { recursive: true });
      await fileSystem.mkdir(pathApi.dirname(paths.runtimeArchive), { recursive: true });
      await fileSystem.mkdir(pathApi.dirname(paths.uvArchive), { recursive: true });
      await fileSystem.mkdir(paths.pythonInstallDir, { recursive: true });
      await fileSystem.mkdir(paths.uvCacheDir, { recursive: true });

      progress('downloading');
      const manifestDownload = await downloadPinnedAsset(manifest.runtime.manifestUrl, { transport: manager.transport, signal, maxBytes: 64 * 1024 });
      const remoteManifest = parseJson(manifestDownload.bytes, 'KAFE runtime release manifest');
      validateRuntimeSidecar(remoteManifest, manifest.runtime);

      const runtimeDownload = await downloadPinnedAsset(manifest.runtime.archiveUrl, { transport: manager.transport, signal });
      if (sha256(runtimeDownload.bytes) !== manifest.runtime.archiveSha256 || sha256(runtimeDownload.bytes) !== remoteManifest.archive_sha256) {
        throw new Error('KAFE runtime archive SHA-256 mismatch.');
      }
      await fileSystem.writeFile(paths.runtimeManifest, JSON.stringify(remoteManifest));
      await fileSystem.writeFile(paths.runtimeArchive, runtimeDownload.bytes);

      const uvTarget = paths.target;
      const uvDownload = await downloadPinnedAsset(uvTarget.url, { transport: manager.transport, signal });
      if (sha256(uvDownload.bytes) !== uvTarget.sha256) throw new Error(`uv ${manifest.uv.version} archive SHA-256 mismatch.`);
      await fileSystem.writeFile(paths.uvArchive, uvDownload.bytes);

      progress('validating');
      progress('extracting');
      await fileSystem.mkdir(paths.stagingRoot, { recursive: true });
      await extractZip(runtimeDownload.bytes, paths.stagingRoot, fileSystem, pathApi, {
        required: REQUIRED_RUNTIME_MEMBERS,
        requireKnowledgePack: true,
      });

      await fileSystem.mkdir(paths.uvStageRoot, { recursive: true });
      await extractPinnedArchive(uvDownload.bytes, uvTarget.format, paths.uvStageRoot, fileSystem, pathApi, { required: [uvTarget.executable] });
      await checkUvVersion(paths.uvStagePath, paths, signal);
      await fileSystem.rename(paths.uvStageRoot, paths.uvRoot);

      progress('syncing');
      const sync = await processRunner(paths.uvPath, ['sync', '--locked', '--no-dev', '--project', paths.stagingRoot], {
        cwd: paths.stagingRoot,
        env: makeUvEnvironment(paths),
        shell: false,
        signal,
      });
      if (signal?.aborted) throw abortError();
      if (sync.exitCode !== 0) {
        const detail = [sync.stderr, sync.stdout].filter(Boolean).join('\n').trim();
        throw new Error(`uv sync --locked --no-dev failed${detail ? `: ${detail}` : '.'}`);
      }
      const marker = {
        runtimeVersion: manifest.runtime.version,
        knowledgePackVersion: manifest.runtime.knowledgePackVersion,
        runtimeArchiveSha256: manifest.runtime.archiveSha256,
        uvVersion: manifest.uv.version,
        uvSha256: uvTarget.sha256,
        target: uvTarget.key,
      };
      await fileSystem.writeFile(paths.stagingReadyFile, JSON.stringify(marker));
      await fileSystem.rm(paths.runtimeRoot, { recursive: true, force: true });
      await fileSystem.rename(paths.stagingRoot, paths.runtimeRoot);
      const ready = await readReadyRuntime();
      if (ready.status !== 'ready') throw new Error('KAFE runtime setup completed without valid ready metadata.');
      progress('ready');
      return ready;
    } catch (error) {
      await cleanup(paths);
      const status = signal?.aborted || error.name === 'AbortError' ? 'cancelled' : 'error';
      return { status, message: error.message };
    }
  }

  manager.getReadyRuntime = readReadyRuntime;
  manager.getReadyKnowledgePack = readReadyKnowledgePack;
  manager.resolveWorkspace = resolveWorkspace;
  manager.installRuntime = installRuntime;
  return manager;
}

function parseJson(buffer, label) {
  try { return JSON.parse(buffer.toString('utf8')); }
  catch { throw new Error(`${label} is not valid JSON.`); }
}

function validateRuntimeSidecar(sidecar, runtime) {
  if (!sidecar || sidecar.runtime_version !== runtime.version ||
    sidecar.knowledge_pack_version !== runtime.knowledgePackVersion ||
    sidecar.python_requirement !== runtime.pythonRequirement ||
    sidecar.antlr_runtime_version !== runtime.antlrRuntimeVersion ||
    sidecar.source_revision !== runtime.sourceRevision ||
    sidecar.archive_sha256 !== runtime.archiveSha256) {
    throw new Error('KAFE runtime release manifest version or integrity metadata does not match the pinned package.');
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  createRuntimeManager,
  downloadPinnedAsset,
  extractPinnedArchive,
  getRuntimeTarget,
  inspectTarGz,
  validateAssetUrl,
  validateMemberSet,
  validateRuntimeSidecar,
};
