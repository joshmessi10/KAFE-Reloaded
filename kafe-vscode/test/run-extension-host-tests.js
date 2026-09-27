const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { downloadAndUnzipVSCode } = require('@vscode/test-electron');

const extensionRoot = path.resolve(__dirname, '..');
const testCliRoot = path.dirname(require.resolve('@vscode/test-cli'));
const testConfigurations = require('../.vscode-test.js');

function runTrustedHost() {
  const cliPath = path.join(testCliRoot, 'bin.mjs');
  const result = childProcess.spawnSync(process.execPath, [cliPath, '--label', 'trustedWorkspaceTests'], {
    cwd: extensionRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findTestFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTestFiles(file);
    return entry.isFile() && entry.name.endsWith('.test.js') ? [file] : [];
  }).sort();
}

async function runUntrustedHost() {
  const config = testConfigurations.find(item => item.label === 'untrustedWorkspaceTests');
  if (!config) throw new Error('Missing untrustedWorkspaceTests configuration.');
  const userDataIndex = config.launchArgs.indexOf('--user-data-dir');
  if (userDataIndex < 0 || !config.launchArgs[userDataIndex + 1]) {
    throw new Error('The untrusted configuration must specify a dedicated --user-data-dir.');
  }
  const userDataDir = config.launchArgs[userDataIndex + 1];

  const vscodeExecutablePath = await downloadAndUnzipVSCode(config.version);
  const extensionTestsPath = path.join(testCliRoot, 'runner.cjs');
  const testOptions = JSON.stringify({
    mochaOpts: { ...config.mocha },
    colorDefault: Boolean(process.stdout.isTTY),
    preload: [],
    files: findTestFiles(path.join(extensionRoot, 'test', 'suite')),
  });
  const env = { ...process.env, VSCODE_TEST_OPTIONS: testOptions };
  delete env.ELECTRON_RUN_AS_NODE;

  const args = [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--no-cached-data',
    `--extensionDevelopmentPath=${extensionRoot}`,
    `--extensionTestsPath=${extensionTestsPath}`,
    `--user-data-dir=${userDataDir}`,
    `--extensions-dir=${path.join(extensionRoot, '.vscode-test', 'extensions-untrusted')}`,
    config.workspaceFolder,
  ];

  const result = childProcess.spawnSync(vscodeExecutablePath, args, {
    cwd: extensionRoot,
    env,
    shell: false,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  const logRoot = path.join(userDataDir, 'logs');
  const latestLog = fs.readdirSync(logRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .at(-1);
  if (!latestLog) throw new Error('Untrusted host exited without creating an Extension Development Host log.');
  const rendererLogPath = path.join(logRoot, latestLog, 'window1', 'renderer.log');
  let rendererLog = '';
  let passCount;
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    rendererLog = fs.readFileSync(rendererLogPath, 'utf8');
    const summary = rendererLog.split(/\r?\n/).find(line => line.includes('passing'));
    passCount = summary?.match(/passing.*\)\s+(\d+)\s+\S+/)?.[1];
    if (rendererLog.includes('%d failing')) {
      throw new Error(`Untrusted host reported a failing Mocha run. See ${rendererLogPath}`);
    }
    if (passCount) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!passCount) {
    throw new Error(`Untrusted host did not report a clean Mocha run. See ${rendererLogPath}`);
  }
  process.stdout.write(`Untrusted VS Code ${config.version} Extension Development Host: ${passCount} passing.\n`);
}

async function main() {
  runTrustedHost();
  await runUntrustedHost();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
