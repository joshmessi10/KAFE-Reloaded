const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');

test('production declares limited untrusted conversation with the workspace restrictions stated', () => {
  const manifest = require('../../package.json');
  assert.equal(manifest.capabilities?.untrustedWorkspaces?.supported, 'limited');
  assert.match(manifest.capabilities.untrustedWorkspaces.description, /conversation/i);
  assert.match(manifest.capabilities.untrustedWorkspaces.description, /files.*edits.*Run.*trust/i);
});

test('clean CI provisions the pinned host before cached-only configuration, while local cannot download', async () => {
  const provision = require('../provision-vscode'); let calls = 0, cached = false;
  const executable = path.join(root,'.vscode-test/vscode-win32-x64-archive-1.96.0/Code.exe');
  const deps = { exists:() => cached, download:async options => {
    calls++; assert.equal(options.version,'1.96.0'); assert.equal(options.platform,'win32-x64-archive'); assert.equal(options.cachePath,path.join(root,'.vscode-test')); cached = true; return executable;
  } };
  await assert.rejects(() => provision.provision({...deps,env:{}}), /CI/); assert.equal(calls,0);
  await provision.provision({...deps,env:{CI:'true',GITHUB_ACTIONS:'true'}}); assert.equal(calls,1);
  const fakeFs = {...fs,existsSync:p => p === executable && cached,mkdtempSync:()=>'owned-profile',mkdirSync(){},copyFileSync(){}};
  const load = () => { const context = {module:{exports:{}},__dirname:root,process:{once(){}},require:name => name === 'node:fs' ? fakeFs : name === '@vscode/test-cli' ? {defineConfig:value=>value} : require(name)};
    vm.runInNewContext(fs.readFileSync(path.join(root,'.vscode-test.js'),'utf8'),context); return context.module.exports; };
  for (const config of load()) { assert.equal(config.version,'1.96.0'); assert.equal(config.useInstallation.fromPath,executable); }
  cached = false; assert.throws(load,/Cached VS Code/); assert.equal(calls,1);
  const workflow = fs.readFileSync(path.join(root,'../.github/workflows/vscode-extension.yml'),'utf8').split('  windows-extension:')[1];
  assert.ok(workflow.indexOf('node test/provision-vscode.js') >= 0);
  assert.ok(workflow.indexOf('node test/provision-vscode.js') < workflow.indexOf('npm run test:extension'));
});

test('host runner launch arguments omit ineffective cache option and keep genuinely restricted host', async () => {
  const source = fs.readFileSync(path.join(root,'test/run-extension-host-tests.js'),'utf8');
  const calls = [], configs = ['trustedWorkspaceTests','untrustedWorkspaceTests'].map(label=>({label,version:'1.96.0',mocha:{},useInstallation:{fromPath:'cached.exe'},workspaceFolder:'workspace',launchArgs:['--user-data-dir',`profile/${label}`]}));
  const fakeFs = {readdirSync: p => p.endsWith('logs') ? [{name:'latest',isDirectory:()=>true}] : [],readFileSync:()=>'%d passing ) 12 tests'};
  const fakeRequire = name => name === 'node:child_process' ? {spawnSync:(exe,args)=>{calls.push({exe,args});return{status:0};}} : name === 'node:fs' ? fakeFs : name === '../.vscode-test.js' ? configs : require(name);
  fakeRequire.resolve = require.resolve;
  const context = {require:fakeRequire,__dirname:path.join(root,'test'),process:{env:{},stdout:{write(){}}},console};
  vm.runInNewContext(source,context); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,2);
  assert.ok(calls.every(call=>!call.args.includes('--no-cached-data')));
  assert.ok(calls[0].args.includes('--disable-workspace-trust')); assert.ok(!calls[1].args.includes('--disable-workspace-trust'));
});
