const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defineConfig } = require('@vscode/test-cli');

const workspacePrefix = 'kafe-vscode-trust-fixtures-';
const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
const untrustedUserDataDir = path.join(workspaceRoot, 'user-data-untrusted');
fs.mkdirSync(untrustedUserDataDir);
process.once('exit', () => {
  const resolvedRoot = path.resolve(workspaceRoot);
  if (path.dirname(resolvedRoot) === path.resolve(os.tmpdir()) &&
    path.basename(resolvedRoot).startsWith(workspacePrefix)) {
    fs.rmSync(resolvedRoot, { recursive: true, force: true });
  }
});
function prepareWorkspace(name) {
  const folder = path.join(workspaceRoot, name);
  fs.mkdirSync(folder, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, 'test', 'fixtures', name, 'trust-check.kf'),
    path.join(folder, 'trust-check.kf'),
  );
  return folder;
}

const common = {
  files: 'test/suite/**/*.test.js',
  version: '1.96.0',
  extensionDevelopmentPath: __dirname,
  mocha: {
    timeout: 30000,
  },
};

module.exports = defineConfig([
  {
    ...common,
    label: 'trustedWorkspaceTests',
    workspaceFolder: prepareWorkspace('trusted-workspace'),
    launchArgs: [
      '--disable-workspace-trust',
      '--user-data-dir',
      path.join(__dirname, '.vscode-test', 'user-data-trusted'),
    ],
  },
  {
    ...common,
    label: 'untrustedWorkspaceTests',
    workspaceFolder: prepareWorkspace('untrusted-workspace'),
    // test-electron 3.1.0 always disables Workspace Trust, so the aggregate runner launches this config directly.
    launchArgs: [
      '--user-data-dir',
      untrustedUserDataDir,
    ],
  },
]);
