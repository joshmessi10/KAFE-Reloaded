const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('pinned 1.96 policy enables production limited support without development bypass', () => {
  const root = path.resolve(__dirname,'../..'), manifest = require('../../package.json');
  const source = fs.readFileSync(path.join(root,'.vscode-test/vscode-win32-x64-archive-1.96.0/resources/app/out/vs/workbench/workbench.desktop.main.js'),'utf8');
  const method = source.match(/getExtensionUntrustedWorkspaceSupportType\(e\)\{([^{}]+)\}/);
  assert.ok(method,'Read the actual pinned host policy');
  const policy = new Function('e',method[1]);
  const service = {s:{isWorkspaceTrustEnabled:()=>true},F:()=>undefined,G:()=>undefined};
  assert.equal(policy.call(service,{...manifest,capabilities:undefined}),false);
  assert.equal(policy.call(service,manifest),'limited');
});
