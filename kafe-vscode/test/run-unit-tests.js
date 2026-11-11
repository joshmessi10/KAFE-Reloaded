const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function findTestFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
    .flatMap(entry => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findTestFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.test.js') ? [entryPath] : [];
    });
}

const extensionRoot = path.resolve(__dirname, '..');
const testFiles = findTestFiles(path.join(__dirname, 'unit'));
if (testFiles.length === 0) throw new Error('No KAFE unit test files were found.');

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: extensionRoot,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
