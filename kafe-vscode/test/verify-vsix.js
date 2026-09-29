const path = require('node:path');
const yauzl = require('yauzl');

const REQUIRED_ENTRIES = [
  'extension/package.json',
  'extension/extension.js',
  'extension/LICENSE.txt',
  'extension/src/tutor/TutorViewProvider.js',
  'extension/src/runtimeManifest.json',
  'extension/media/tutor.svg',
  'extension/node_modules/yauzl/index.js',
  'extension/node_modules/yauzl/crc32.js',
  'extension/node_modules/yauzl/fd-slicer.js',
  'extension/node_modules/yauzl/package.json',
  'extension/node_modules/pend/index.js',
  'extension/node_modules/pend/package.json',
];

function verifyEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('VSIX entries must be an array of ZIP entry names');
  }

  const presentEntries = new Set();
  const errors = [];

  for (const entry of entries) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push('ZIP entry names must be non-empty strings');
      continue;
    }

    const archivePath = entry.replace(/\\/g, '/');
    const isDirectory = archivePath.endsWith('/');
    if (archivePath.startsWith('/') || /^[a-z]:\//i.test(archivePath)) {
      errors.push(`absolute ZIP entry is not allowed: ${entry}`);
      continue;
    }

    const segments = archivePath.split('/');
    if (isDirectory) segments.pop();
    if (segments.some((segment) => segment === '')) {
      errors.push(`empty path segments are not allowed: ${entry}`);
      continue;
    }
    if (segments.includes('.')) {
      errors.push(`dot path segments are not allowed: ${entry}`);
      continue;
    }
    if (segments.includes('..')) {
      errors.push(`path traversal is not allowed: ${entry}`);
      continue;
    }

    const normalizedPath = segments.join('/');
    const lowerSegments = segments.map((segment) => segment.toLowerCase());
    const secretSegment = lowerSegments.find((segment) =>
      segment.startsWith('.env') || segment.includes('credentials') ||
      /\.(?:key|pem|p12|pfx)$/.test(segment) ||
      /(?:^|[._-])id_(?:rsa|dsa|ecdsa|ed25519)(?:$|[._-])/.test(segment),
    );
    if (secretSegment) {
      errors.push(`secret or key material is not allowed: ${entry}`);
      continue;
    }

    const developmentSegment = lowerSegments.find((segment) =>
      segment === 'test' || segment === 'diagram' || segment === '.vscode-test' || segment === '.vscode',
    );
    if (developmentSegment) {
      errors.push(`development content is not allowed: ${entry}`);
      continue;
    }

    if (!isDirectory && normalizedPath.startsWith('extension/')) {
      presentEntries.add(normalizedPath);
    }
  }

  for (const requiredEntry of REQUIRED_ENTRIES) {
    if (!presentEntries.has(requiredEntry)) {
      errors.push(`required VSIX entry is missing: ${requiredEntry}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid VSIX content:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  return true;
}

async function readZipEntries(vsixPath) {
  const zipFile = await yauzl.openPromise(vsixPath, { lazyEntries: true });

  try {
    return await new Promise((resolve, reject) => {
      const entries = [];
      zipFile.once('error', reject);
      zipFile.once('end', () => resolve(entries));
      zipFile.on('entry', (entry) => {
        entries.push(entry.fileName);
        zipFile.readEntry();
      });
      zipFile.readEntry();
    });
  } catch (error) {
    zipFile.close();
    throw error;
  }
}

async function main() {
  const vsixPath = process.argv[2];
  if (!vsixPath) {
    throw new Error('Usage: node test/verify-vsix.js <path-to-vsix>');
  }

  const entries = await readZipEntries(path.resolve(vsixPath));
  verifyEntries(entries);
  process.stdout.write(`VSIX content verified: ${vsixPath}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { verifyEntries };
