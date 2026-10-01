// Explicit clean-GitHub-CI prerequisite. Local host verification never invokes this download path.
const fs = require('node:fs');
const path = require('node:path');
const cachePath = path.resolve(__dirname, '../.vscode-test');
const executable = path.join(cachePath, 'vscode-win32-x64-archive-1.96.0/Code.exe');

async function provision({ env = process.env, exists = fs.existsSync,
  download = options => require('@vscode/test-electron').downloadAndUnzipVSCode(options) } = {}) {
  if (env.CI !== 'true' || env.GITHUB_ACTIONS !== 'true') throw Error('VS Code provisioning is restricted to explicit GitHub CI. Local tests require a cached host.');
  if (exists(executable)) return executable;
  const installed = await download({ version: '1.96.0', platform: 'win32-x64-archive', cachePath });
  if (path.resolve(installed) !== executable || !exists(executable)) throw Error('Pinned VS Code 1.96.0 cache was not provisioned.');
  return executable;
}
module.exports = { provision };
if (require.main === module) provision().catch(error => { console.error(error); process.exitCode = 1; });
