// Local, bounded, dependency-free native acceptance. No installed profile is used.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const net = require('node:net');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { ContextRegistry, identity, assertReachableGeometry, isRenderedSettlement, projectedEntryIds } = require('./harness.cjs');

const extensionRoot = path.resolve(__dirname, '../..');
const productionManifest = require(path.join(extensionRoot, 'package.json'));
assert.equal(productionManifest.capabilities?.untrustedWorkspaces?.supported, 'limited');
if (!process.argv[2]) throw Error('Usage: node test/native/acceptance.cjs <evidence-directory>');
const exe = path.join(extensionRoot, '.vscode-test/vscode-win32-x64-archive-1.96.0/Code.exe');
if (!fs.existsSync(exe)) throw Error('Cached VS Code required; no download permitted.');
const out = path.resolve(process.argv[2]);
fs.mkdirSync(out, { recursive: true });
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-native-owned-'));
const token = crypto.randomUUID();
const fixture = path.join(root, 'fixture'), user = path.join(root, 'user-data'), workspace = path.join(root, 'workspace'), runtime = path.join(root, 'runtime');
for (const p of [fixture, user, workspace, runtime, path.join(root, 'extensions'), path.join(user, 'User'), path.join(runtime, 'knowledge-pack')]) fs.mkdirSync(p, { recursive: true });
fs.writeFileSync(path.join(workspace, 'main.kf'), 'MAIN_SENTINEL <- [1, 2]\n');
for (const name of ['optional-one-with-a-long-workspace-file-name.kf', 'optional-two-with-another-long-workspace-file-name.kf']) fs.writeFileSync(path.join(workspace, name), name.includes('one-') ? 'OPTIONAL_ONE_SENTINEL <- 1\n' : 'OPTIONAL_TWO_SENTINEL <- 2\n');
fs.writeFileSync(path.join(runtime, 'knowledge-pack', 'lists.md'), 'KAFE lists use zero-based indexes.');
fs.writeFileSync(path.join(user, 'User', 'settings.json'), JSON.stringify({ 'telemetry.telemetryLevel': 'off', 'update.mode': 'none', 'extensions.autoUpdate': false,
  'extensions.autoCheckUpdates': false, 'workbench.startupEditor': 'none', 'security.workspace.trust.enabled': false, 'workbench.colorTheme': 'Default Dark Modern',
  'window.dialogStyle': 'custom', 'window.zoomLevel': 0, 'window.restoreWindows': 'none', 'workbench.sideBar.location': 'left' }));
fs.copyFileSync(path.join(__dirname, 'fixture.cjs'), path.join(fixture, 'extension.cjs'));
fs.copyFileSync(path.join(extensionRoot, 'media/tutor.svg'), path.join(fixture, 'tutor.svg'));
fs.writeFileSync(path.join(fixture, 'fixture-config.json'), JSON.stringify({ root, workspace, runtime, extensionRoot, token }));
fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ name: 'kafe-native-acceptance', publisher: 'local-test', version: '0.0.1', engines: { vscode: '^1.96.0' },
  main: './extension.cjs', capabilities: structuredClone(productionManifest.capabilities), activationEvents: ['*'], contributes: { languages: [{ id: 'kafe', extensions: ['.kf'] }],
    commands: [{ command: 'kafe.runFile', title: 'KAFE: Run File' }], keybindings: [{ command: 'kafe.runFile', key: 'ctrl+f5', when: 'editorLangId == kafe && isWorkspaceTrusted' }],
    viewsContainers: { activitybar: [{ id: 'kafeNativeTutor', title: 'KAFE native acceptance', icon: 'tutor.svg' }] },
    views: { kafeNativeTutor: [{ id: 'kafeNativeTutorView', name: 'KAFE Tutor', type: 'webview' }] } } }));

const evidence = { root, started: new Date().toISOString(), gates: [], diagnostics: [], screenshots: [], versions: {}, limitations: [
  'A temporary fixture extension contributes the native sidebar; the ordinary host suite verifies production activation/contributions.',
  'Provider, runtime and child process are deterministic fixtures; no real provider/runtime release acceptance.',
  'Synthetic keyboard/composition and AX evidence do not prove physical Windows IME candidate UI or screen-reader speech.' ] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label, timeout = 10000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) { try { const value = await check(); if (value) return value; } catch (error) { last = error; } await pause(100); }
  throw Error(`Timed out: ${label}${last ? ': ' + last.message : ''}`);
}
let launchLog, capturePrefix = '', child, socket, controlPort, call, registry = new ContextRegistry(), currentStage, scenarioBlocked = false;
async function control(type, fields = {}) {
  const response = await fetch(`http://127.0.0.1:${controlPort}`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ type, ...fields }), signal: AbortSignal.timeout(10000) });
  const value = await response.json(); if (!response.ok) throw Error(value.error); return value;
}
function stage(name, detail = {}) { currentStage = name; evidence.stages ||= []; evidence.stages.push({ name, context: identity(registry.selected), ...detail }); }
async function evaluate(expression, native = false) {
  if (!native && !registry.selected) throw Error('No live selected webview context');
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true,
    ...(!native ? { contextId: registry.selected.context.id } : {}) }, native ? undefined : registry.selected.sessionId);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
  return result.result?.value;
}
async function discover({ previousIdentity, previousNonce } = {}) {
  stage('discover-start', { previousIdentity });
  const candidate = await waitFor(async () => {
    for (const item of registry.candidates(previousIdentity)) {
      try { const result = await call('Runtime.evaluate', { contextId: item.context.id, expression: '(()=>{const e=document.getElementById("initial-state");return document.readyState==="complete" && window.KafeTutorTimeline && document.getElementById("composer-form") && document.getElementById("context-row") && e?.nonce;})()', returnByValue: true }, item.sessionId);
        if (result.result?.value && result.result.value !== previousNonce) return item; } catch {}
    }
    return null;
  }, 'different live production webview with completed scripts', 20000);
  registry.select(candidate); stage('discover-live');
  // Passive test observer: production still owns every render/message handler.
  await evaluate('(()=>{if(!window.__nativeSnapshotObserver){window.__nativeSnapshotObserver=true;window.addEventListener("message",event=>{if(event.data?.type==="render"){const s=event.data.state;window.__nativeSnapshotAck={sessionId:s.sessionId,generation:s.generation,revision:s.revision};}});}window.__nativeSnapshotAck=null;})()');
  let expected = (await control('renderSnapshot')).snapshot;
  await waitFor(async () => {
    const rendered = await evaluate('({ack:window.__nativeSnapshotAck,draft:document.getElementById("composer").value,entries:[...document.querySelectorAll("#timeline article")].map(e=>e.dataset.entryId),context:document.getElementById("context-row").textContent})');
    expected = (await control('state')).snapshot;
    evidence.lastDiscovery = {expected:{sessionId:expected.sessionId,generation:expected.generation,revision:expected.revision,draft:expected.draft,entries:expected.entries.map(e=>e.id)},rendered};
    return rendered.ack?.sessionId === expected.sessionId && rendered.ack.generation === expected.generation && rendered.ack.revision >= expected.revision && rendered.draft === expected.draft && JSON.stringify(rendered.entries) === JSON.stringify(projectedEntryIds(expected)) && rendered.context && rendered;
  }, 'fresh host snapshot received and projected');
  stage('snapshot-ack', { sessionId: expected.sessionId, generation: expected.generation, revision: expected.revision });
  return evaluate('({width:innerWidth,height:innerHeight,ratio:devicePixelRatio,theme:document.body.className,entries:document.querySelectorAll("#timeline article").length,draft:document.getElementById("composer").value,nonce:document.getElementById("initial-state").nonce})');
}
async function recreateView() {
  const previousIdentity = identity(registry.selected), previousNonce = await evaluate('document.getElementById("initial-state").nonce');
  stage('recreation-request', { previousIdentity }); await control('recreate'); registry.selected = null;
  await discover({ previousIdentity, previousNonce }); stage('recreation-ready');
}
async function key(key, native = false, modifiers = 0) {
  const keyCode = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, a: 65, s: 83, F5: 116, Backspace: 8 }[key];
  // Keyboard dispatch belongs to the top-level focused native page, not OOPIF.
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    modifiers, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key, modifiers, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}
async function click(selector, native = false) {
  const found = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'nearest'});e.focus();return document.activeElement===e;})()`, native);
  assert.ok(found, `Enabled ${selector}`); await key('Enter', native);
}
async function typeComposer(text) {
  stage('composer-input-start');
  const local = await evaluate('(()=>{const e=document.getElementById("composer");e.scrollIntoView({block:"nearest"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
  const frame = await evaluate('(()=>{const r=document.querySelector("iframe.webview.ready").getBoundingClientRect();return {x:r.x,y:r.y};})()', true);
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: frame.x + local.x, y: frame.y + local.y, button: 'left', clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: frame.x + local.x, y: frame.y + local.y, button: 'left', clickCount: 1 });
  await evaluate('document.getElementById("composer").focus();document.getElementById("composer").select()');
  await call('Input.insertText', { text }, registry.selected.sessionId);
  await waitFor(async () => (await control('state')).snapshot.draft === text, 'host draft acknowledgement');
  stage('composer-input-ack');
}
async function activeControl() {
  return evaluate(`(()=>{const e=document.activeElement,r=e.getBoundingClientRect();let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};for(let p=e.parentElement;p;p=p.parentElement){if(/auto|scroll|hidden/.test(getComputedStyle(p).overflow)){const b=p.getBoundingClientRect();clip={left:Math.max(clip.left,b.left),top:Math.max(clip.top,b.top),right:Math.min(clip.right,b.right),bottom:Math.min(clip.bottom,b.bottom)};}}return {id:e.id,region:e.closest('#timeline,#context-row,#composer-form')?.id,tag:e.tagName,type:e.getAttribute('data-action-type')||e.type,name:e.getAttribute('aria-label')||e.textContent||e.id,action:e.getAttribute('data-action-id'),source:e.getAttribute('data-source-id'),chip:e.getAttribute('data-chip-operation'),focusVisible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineWidth,visible:Math.min(r.right,clip.right)>Math.max(r.left,clip.left)&&Math.min(r.bottom,clip.bottom)>Math.max(r.top,clip.top),rect:r.toJSON()};})()`);
}
async function sequentialTraversal(label, { busy = false, requiredActions = [] } = {}) {
  await typeComposer('Keyboard next draft');
  await evaluate('document.getElementById("timeline").focus()');
  const first = await activeControl(), forward = [], reverse = [];
  for (let i = 0; i < 100; i++) { await key('Tab'); const item = await activeControl(); forward.push(item);
    assert.ok(item.visible && item.focusVisible && item.outline !== '0px', `${label} visible focus ${item.name}`);
    if (item.id === (busy ? 'stop' : 'send')) break;
  }
  assert.equal(forward.at(-1).id, busy ? 'stop' : 'send'); assert.ok(forward.some(x => x.id === 'composer'));
  for (const type of requiredActions) assert.ok(forward.some(x => x.type === type), `Sequential traversal visits ${type}`);
  for (let i = 0; i < 100; i++) { await key('Tab', false, 8); const item = await activeControl(); reverse.push(item);
    assert.ok(item.visible && item.focusVisible, `${label} reverse visible focus ${item.name}`); if (item.id === first.id) break;
  }
  assert.equal(reverse.at(-1).id, first.id); await screenshot(`sequential-${label}`); return { first, forward, reverse };
}
async function keyboardActivate(type, { byId = false } = {}) {
  await evaluate('document.getElementById("timeline").focus()');
  const forward = []; let reached;
  for (let i=0;i<100;i++) { await key('Tab'); const item=await activeControl(); forward.push(item);
    assert.ok(item.visible && item.focusVisible, `Sequential action focus ${item.name}`);
    if ((byId ? item.id : item.type) === type) { reached=item; break; }
  }
  assert.ok(reached,`Sequential keys reach ${type}`);
  await key('Tab',false,8); const previous=await activeControl(); assert.ok(previous.visible && previous.focusVisible);
  await key('Tab'); const returned=await activeControl(); assert.equal(returned.action || returned.id,reached.action || reached.id);
  await key('Enter'); evidence.keyboardActions ||= []; evidence.keyboardActions.push({type,forward,previous,returned}); return reached;
}
async function oneSend(text, scenario, useButton = false) {
  await control('scenario', { scenario }); await typeComposer(text); const before = await control('state');
  if (useButton) await click('#send'); else await key('Enter');
  await waitFor(async () => (await control('state')).counters.provider === before.counters.provider + 1, 'one provider admission');
  const after = await control('state');
  assert.equal(after.snapshot.entries.filter(e => e.kind === 'learner').length, before.snapshot.entries.filter(e => e.kind === 'learner').length + 1);
  assert.equal(after.snapshot.entries.filter(e => e.kind === 'assistant').length, before.snapshot.entries.filter(e => e.kind === 'assistant').length + 1);
  assert.ok(!after.snapshot.entries.some(e => ['review', 'progress', 'readiness', 'learning'].includes(e.kind)));
  if (scenario.proposal) {
    await settledTurn(); const ungranted = await control('state');
    assert.equal(ungranted.pendingProposal, null, 'ordinary prose does not grant preparation');
    assert.equal(ungranted.counters.nativeEdits, before.counters.nativeEdits);
    assert.equal(ungranted.counters.launches.length, before.counters.launches.length);
    const action = await evaluate('[...document.querySelectorAll("button[data-action-type=prepareChange]:not(:disabled)")].at(-1)?.getAttribute("data-action-id")');
    assert.ok(action, 'fresh exact preparation scope is rendered');
    await click(`button[data-action-id="${action}"]`);
    await waitFor(async () => (await control('state')).counters.provider === before.counters.provider + 2, 'explicit fresh scope admits preparation');
    evidence.freshScopeAdmissions ||= []; evidence.freshScopeAdmissions.push({action, providerBefore:before.counters.provider, providerAfter:(await control('state')).counters.provider});
  }
  return after;
}
const settledTurn = () => waitFor(async () => {
  const host = (await control('state')).snapshot;
  const rendered = await evaluate('({ack:window.__nativeSnapshotAck,entryIds:[...document.querySelectorAll("#timeline article")].map(e=>e.dataset.entryId),lastAssistantEntryId:[...document.querySelectorAll("article[data-kind=assistant]")].at(-1)?.dataset.entryId})');
  if (!isRenderedSettlement(host, rendered)) return false;
  const sample = {host:{sessionId:host.sessionId,generation:host.generation,revision:host.revision,turn:host.turn},rendered};
  evidence.settlements ||= []; evidence.settlements.push(sample); return sample;
}, 'settled host turn acknowledged and rendered by identity');
const nativeMetrics = () => evaluate('({width:innerWidth,height:innerHeight,outerWidth,outerHeight,ratio:devicePixelRatio})', true);
async function screenshot(name) {
  await settledLayout();
  const before = { webview: await layoutMetrics(), native: await nativeMetrics() };
  const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const bytes = Buffer.from(shot.data, 'base64'), file = path.join(out, `${capturePrefix}${name}.png`);
  fs.writeFileSync(file, bytes); evidence.screenshots.push(file);
  const after = { webview: await layoutMetrics(), native: await nativeMetrics() };
  const result = { name, file, screenshotPixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }, before, after };
  evidence.captureMeasurements ||= []; evidence.captureMeasurements.push(result);
  assert.deepEqual(after, before, 'Geometry must remain settled across screenshot capture');
  return result;
}
async function settledLayout(predicate = () => true) {
  let previous, repeats = 0;
  return waitFor(async () => {
    const metrics = await layoutMetrics(), signature = JSON.stringify({ metrics, native: await nativeMetrics() });
    repeats = predicate(metrics) && signature === previous ? repeats + 1 : 0; previous = signature;
    return repeats >= 3 && metrics;
  }, 'stable native webview geometry');
}
async function resizeSidebar(width) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await evaluate('innerWidth'); if (current === width) return;
    const rect = await evaluate('(()=>{const r=document.querySelector(".monaco-workbench .part.sidebar").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()', true);
    const sash = await evaluate(`(()=>{const rects=[...document.querySelectorAll('.monaco-sash.vertical:not(.disabled)')].map(e=>e.getBoundingClientRect()).filter(r=>r.height>100&&r.width>0);const r=rects.sort((a,b)=>Math.abs(a.x+a.width/2-${rect.x + rect.width})-Math.abs(b.x+b.width/2-${rect.x + rect.width}))[0];return {x:r.x+r.width/2,y:r.y+r.height/2};})()`, true);
    // The native sidebar includes a one-pixel separator excluded from the webview.
    const target = sash.x + width + 1 - rect.width;
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sash.x, y: sash.y });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: sash.x, y: sash.y, button: 'left', clickCount: 1 }); await pause(100);
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target, y: sash.y, button: 'left', buttons: 1 }); await pause(100);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target, y: sash.y, button: 'left', clickCount: 1 }); await pause(200);
    evidence.sidebarDrags ||= []; evidence.sidebarDrags.push({ attempt, current, targetWidth: width, sash, after: await evaluate('innerWidth') });
  }
  return await evaluate('innerWidth');
}
const layoutMetrics = () => evaluate('({ratio:devicePixelRatio,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,timeline:document.getElementById("timeline").getBoundingClientRect().toJSON(),composer:document.getElementById("composer").getBoundingClientRect().toJSON(),send:document.getElementById("send").getBoundingClientRect().toJSON(),stop:document.getElementById("stop").getBoundingClientRect().toJSON(),context:document.getElementById("context-row").getBoundingClientRect().toJSON(),primary:document.getElementById(document.getElementById("stop").hidden?"send":"stop").getBoundingClientRect().toJSON(),timelineScroll:document.getElementById("timeline").scrollTop})');
async function gate(name, run) {
  if (scenarioBlocked && !name.includes('physical-')) { evidence.gates.push({name,pass:false,blocked:true,error:'Not attempted: prior owned-state recovery failed'}); return; }
  stage(`gate:${name}`);
  try { const details = await run(); evidence.gates.push({ name, pass: true, details }); console.log(`PASS ${name}`); }
  catch (error) {
    const result = { name, pass: false, error: error.message, stage: currentStage, context: identity(registry.selected) }; evidence.gates.push(result); console.log(`FAIL ${name}: ${error.message}`);
    try { const state = await control('state'); result.host = { turnStatus: state.snapshot.turn?.status, pendingProposal: state.pendingProposal,
      reviewed: state.pendingProposalReviewed, diffOpens: state.counters.diffOpens, proposalEvents: state.counters.proposalEvents,
      provider: state.counters.provider, observations: state.counters.observations, watcher: state.counters.watcher }; } catch {}
    try { if (registry.selected) await screenshot(`failed-${name.replace(/[^a-z0-9-]/gi, '_')}`); } catch (captureError) { result.captureError = captureError.message; }
    if (!name.includes('physical-')) {
      try { stage('failed-scenario-cleanup'); await control('recover'); await key('Escape', true); await control('show'); await discover(); result.recovery = 'owned-stream-and-barrier-released-context-reacquired'; }
      catch (recoveryError) { scenarioBlocked = true; result.recovery = recoveryError.message; }
    }
  }
  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2));
}
function resizeOwnedWindow(width, height) {
  const result = JSON.parse(cp.execFileSync('powershell', ['-NoProfile', '-File', path.join(__dirname, 'owned-window.ps1'), '-OwnedRootPid', String(child.pid), '-OwnedRootPath', root, '-Width', String(width), '-Height', String(height)], { encoding: 'utf8', windowsHide: true }));
  assert.equal(result.width,width); assert.equal(result.height,height); evidence.windowResizes ||= []; evidence.windowResizes.push(result); return result;
}

async function launch() {
  scenarioBlocked = false;
  if (fs.existsSync(path.join(root, 'ready.json'))) fs.unlinkSync(path.join(root, 'ready.json'));
  const server = net.createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port; await new Promise(resolve => server.close(resolve)); evidence.port = port;
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  child = cp.spawn(exe, ['--new-window', `--user-data-dir=${user}`, `--extensions-dir=${path.join(root, 'extensions')}`, `--extensionDevelopmentPath=${fixture}`,
    `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1', '--disable-updates', '--skip-welcome', '--skip-release-notes', workspace], { env, windowsHide: false, stdio: ['ignore', 'pipe', 'pipe'] });
  evidence.pid = child.pid; evidence.launches ||= []; evidence.launches.push({ pid: child.pid, port });
  child.on('error', error => { evidence.spawnError = error.message; });
  launchLog = fs.createWriteStream(path.join(out, `${capturePrefix}launch.log`)); child.stdout.pipe(launchLog, { end: false }); child.stderr.pipe(launchLog, { end: false });
  const targets = await waitFor(async () => { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); return targets.some(t => t.type === 'page') && targets; }, 'CDP target', 90000);
  const listeners = JSON.parse(cp.execFileSync('powershell', ['-NoProfile', '-Command', `Get-NetTCPConnection -State Listen -LocalPort ${port} | Select-Object LocalAddress,LocalPort,OwningProcess | ConvertTo-Json`], { encoding: 'utf8', windowsHide: true }));
  assert.ok([listeners].flat().every(l => ['127.0.0.1', '::1'].includes(l.LocalAddress))); evidence.listeners = listeners;
  evidence.versions = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map();
  call = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const n = ++id; const timer = setTimeout(() => { pending.delete(n); reject(Error(`CDP timeout ${method}`)); }, 7000);
    pending.set(n, { resolve, reject, timer }); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
  socket.addEventListener('message', event => { const m = JSON.parse(event.data); if (m.id) { const p = pending.get(m.id); if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); } return; }
    registry.event(m);
    if (['Runtime.executionContextDestroyed','Runtime.executionContextsCleared','Target.detachedFromTarget'].includes(m.method)) stage('context-lifecycle', { event: m.method, session: m.sessionId, params: m.params });
    if (m.method === 'Target.attachedToTarget') { const s = m.params.sessionId; call('Runtime.enable', {}, s).catch(() => {}); call('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, s).catch(() => {}); }
    if (['Runtime.exceptionThrown', 'Log.entryAdded'].includes(m.method)) evidence.diagnostics.push(m);
  });
  await call('Runtime.enable'); await call('Page.enable'); await call('Page.bringToFront'); await call('Log.enable'); await call('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  const ready = await waitFor(() => fs.existsSync(path.join(root, 'ready.json')) && JSON.parse(fs.readFileSync(path.join(root, 'ready.json'), 'utf8')), 'host handshake', 30000);
  assert.equal(ready.token, token); controlPort = ready.port; evidence.hostVersion = ready.version;
  evidence.launches.at(-1).controlPort = controlPort;
  await gate(`${capturePrefix}physical-1024x768-owned-window`, async () => {
  try {
  evidence.launches.at(-1).physicalWindow = resizeOwnedWindow(1024,768);
  } catch (error) { try { evidence.launches.at(-1).windowDiscovery = JSON.parse(error.stdout); } catch {} throw error; }
  assert.equal(evidence.launches.at(-1).physicalWindow.width, 1024); assert.equal(evidence.launches.at(-1).physicalWindow.height, 768);
    return evidence.launches.at(-1).physicalWindow;
  });
  await control('show'); await discover(); await settledLayout();
}
async function shutdown() {
  try { if (controlPort) await control('dispose'); } catch {}
  socket?.close();
  if (child?.pid) { try { cp.execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { encoding: 'utf8', windowsHide: true }); } catch {} }
  await pause(800); await new Promise(resolve => launchLog ? launchLog.end(resolve) : resolve());
  registry = new ContextRegistry(); controlPort = undefined; child = undefined;
}
async function main() {
  await launch();
  await gate('empty-boot-unavailable-runtime-knowledge-and-legacy', async () => {
    const state = await control('state'); assert.equal(state.trusted, true); assert.equal(state.snapshot.entries.length, 0);
    assert.equal(state.counters.provider, 0); assert.equal(state.counters.knowledge, 0); assert.equal(state.counters.resolves, 0); assert.equal(state.counters.installs, 0); assert.equal(state.summary.goal, 'LEGACY_PRIVATE_GOAL');
    assert.match(await evaluate('document.getElementById("included-context").textContent'), /main.kf/);
    const info = await evaluate('({csp:document.querySelector("meta[http-equiv=Content-Security-Policy]").content,scripts:[...document.scripts].filter(e=>e.src).map(e=>({src:e.src,nonce:!!e.nonce})),forms:document.forms.length})');
    assert.equal(info.forms, 1); assert.ok(info.scripts.every(x => x.nonce && x.src.includes('vscode'))); assert.match(info.csp, /default-src 'none'/); await screenshot('empty-boot'); return info;
  });
  await gate('one-Send-Hello-followup-unavailable-knowledge', async () => {
    await oneSend('Hello', { text: 'Hello native answer' }); await settledTurn(); await oneSend('Follow up', { text: 'Follow-up native answer' }, true); await settledTurn();
    const state = await control('state'); assert.equal(state.counters.provider, 2); assert.equal(state.counters.resolves, 0); assert.equal(state.counters.installs, 0);
    assert.equal(state.counters.observations[1].helloHistory, true); assert.ok(state.counters.observations.every(o => o.knowledgeUnavailable && !o.legacy && !o.optionalOne && !o.optionalTwo));
    assert.equal(state.counters.envelopes.filter(e => e.type === 'submitMessage').length, 2); await screenshot('hello-followup'); return state.counters.observations;
  });
  for (const [theme, css] of [['Default Light Modern', 'vscode-light'], ['Default Dark Modern', 'vscode-dark'], ['Default High Contrast', 'vscode-high-contrast'], ['Default High Contrast Light', 'vscode-high-contrast-light']]) await gate(`theme-${css}`, async () => {
    await control('theme', { theme }); await waitFor(() => evaluate(`document.body.classList.contains(${JSON.stringify(css)})`), theme); assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false); return screenshot(css);
  });
  await control('theme', { theme: 'Default Dark Modern' });
  await gate('metadata-selector-real-inclusion-and-exclusion', async () => {
    await control('traversalSources'); await waitFor(() => evaluate('!document.getElementById("context-selector").hidden'), 'optional context');
    await click('#context-selector > summary'); await waitFor(() => evaluate('document.getElementById("context-selector").open'), 'selector open');
    const selector = '#context-sources input[data-source-id]'; await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`); await key(' ');
    await waitFor(async () => (await control('state')).snapshot.context.sources.some(s => s.included), 'source selected');
    await oneSend('Selected source', { text: 'Selected source answer' }); await settledTurn();
    const included = (await control('state')).counters.observations.at(-1); assert.equal(included.optionalOne, true); assert.equal(included.optionalTwo, false);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`); await key(' '); await waitFor(async () => !(await control('state')).snapshot.context.sources.some(s => s.included), 'source removed');
    await oneSend('Excluded source', { text: 'Excluded source answer' }); await settledTurn(); const excluded = (await control('state')).counters.observations.at(-1); assert.equal(excluded.optionalOne, false);
    await sequentialTraversal('context-selector'); return { included, excluded };
  });
  await control('singleEditor');
  await gate('actual-280-css-width', async () => { await resizeSidebar(280); const m = await settledLayout(); assert.equal(m.width, 280); assert.ok(m.scrollWidth <= m.width); await sequentialTraversal('280'); return screenshot('280-css'); });
  for (const width of [360, 600]) await gate(`actual-${width}-css-width`, async () => {
    resizeOwnedWindow(1440,900); await settledLayout(); await resizeSidebar(width); const m=await settledLayout();
    assertReachableGeometry(m,await nativeMetrics(),{physicalWidth:1440,physicalHeight:900,width,ratio:1});
    return screenshot(`${width}-css`);
  });
  await gate('short-panel-enlarged-text-reduced-motion', async () => {
    resizeOwnedWindow(1024,520); await settledLayout(); await resizeSidebar(360);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},registry.selected.sessionId);
    await evaluate('document.body.style.setProperty("--vscode-font-size","20px")');
    try {
      const m=await settledLayout(); assertReachableGeometry(m,await nativeMetrics(),{physicalWidth:1024,physicalHeight:520,width:360,ratio:1});
      const options=await evaluate('({reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,font:getComputedStyle(document.getElementById("composer")).fontSize})');
      assert.equal(options.reduced,true); assert.equal(options.font,'20px'); await screenshot('short-enlarged-reduced');
      return {metrics:m,options,enlargement:'test-owned CSS variable; no installed preference claim'};
    } finally {
      await evaluate('document.body.style.removeProperty("--vscode-font-size")');
      await call('Emulation.setEmulatedMedia',{features:[]},registry.selected.sessionId);
    }
  });
  resizeOwnedWindow(1024,768); await settledLayout(); await resizeSidebar(280);
  await gate('same-small-window-200-percent', async () => {
    const before = await nativeMetrics(); await control('zoom', { level: Math.log(2) / Math.log(1.2) }); const m = await settledLayout(m => m.ratio >= 1.98);
    const after = await nativeMetrics(); assert.equal(after.outerWidth, before.outerWidth); assert.equal(after.outerHeight, before.outerHeight); assert.ok(m.scrollWidth <= m.width); assert.ok(m.timeline.height > 0); return screenshot('same-small-200');
  });
  await gate('same-small-window-actual-clamp-reachability-and-keyboard-at-200-percent', async () => {
    await resizeSidebar(280); const m = await settledLayout(); const native = await nativeMetrics();
    evidence.combinedGeometry = { requestedCssWidth: 280, actual: m, native };
    if (m.width !== 280) evidence.limitations.push(`Same 1024x768 physical window clamps requested 280 CSS to actual ${m.width} at 200%; historical exact-width failure retained in prior evidence.`);
    assertReachableGeometry(m,native,{physicalWidth:1024,physicalHeight:768,ratio:2}); await sequentialTraversal('actual-small-200'); await screenshot('small-actual-200'); return evidence.combinedGeometry;
  });
  await gate('separate-enlarged-ordinary-window-280-css-at-200-percent', async () => {
    const physical = resizeOwnedWindow(1440,900); await settledLayout(); await resizeSidebar(280); const m=await settledLayout();
    assertReachableGeometry(m,await nativeMetrics(),{physicalWidth:1440,physicalHeight:900,width:280,ratio:2}); await sequentialTraversal('enlarged-280-200'); await screenshot('enlarged-280-200'); return {physical,webview:m};
  });
  resizeOwnedWindow(1024,768);
  await control('zoom', { level: 0 }); await settledLayout(m => m.ratio === 1); await resizeSidebar(360);
  await gate('Stop-retry-live-draft-and-recreation', async () => {
    await oneSend('Original stopped question', { text: 'Partial original answer.', hold: true }); await typeComposer('Keep next draft');
    await screenshot('responding');
    const before = await control('state'); await recreateView(); await waitFor(() => evaluate('document.getElementById("composer").value === "Keep next draft"'), 'recreated draft');
    assert.equal((await control('state')).snapshot.entries.length, before.snapshot.entries.length); await sequentialTraversal('streaming-Stop', { busy: true });
    await typeComposer('Keep next draft'); await click('#stop'); await settledTurn(); assert.equal((await control('state')).snapshot.turn.status, 'cancelled');
    await screenshot('stopped');
    await control('chunk', { text: 'LATE_FORBIDDEN' }); await control('finish'); assert.ok(!(await control('state')).snapshot.entries.some(e => e.text.includes('LATE_FORBIDDEN')));
    await control('scenario', { scenario: { text: 'Recovered answer.' } }); await click('button[data-action-type=retryTurn]:not(:disabled)'); await waitFor(async()=>(await control('state')).counters.provider===before.counters.provider+1,'explicit Retry provider admission'); await settledTurn();
    const after = await control('state'); assert.equal(after.counters.provider, before.counters.provider + 1); assert.equal(after.snapshot.draft, 'Keep next draft');
    assert.equal(after.snapshot.entries.filter(e => e.kind === 'learner').length, before.snapshot.entries.filter(e => e.kind === 'learner').length); await screenshot('stop-retry'); return { providerAttempts: after.counters.provider - before.counters.provider, draftPreserved: true };
  });
  await gate('keyboard-ShiftEnter-synthetic-IME-and-AX', async () => {
    await typeComposer('first line'); await key('Enter', false, 8); await call('Input.insertText', { text: 'second line' });
    await waitFor(async () => (await control('state')).snapshot.draft.includes('\nsecond line'), 'newline'); const before = (await control('state')).counters.provider;
    await call('Input.imeSetComposition', { text: '日本', selectionStart: 2, selectionEnd: 2 }, registry.selected.sessionId); await key('Enter'); assert.equal((await control('state')).counters.provider, before);
    await call('Input.insertText', { text: '日本' }, registry.selected.sessionId);
    const ax = await call('Accessibility.getFullAXTree', { frameId: registry.selected.context.auxData.frameId }, registry.selected.sessionId); const nodes = ax.nodes.filter(n => ['textbox', 'button', 'log', 'status'].includes(n.role?.value)).map(n => ({ role: n.role.value, name: n.name?.value })); assert.ok(nodes.some(n => n.name === 'Message to KAFE Tutor')); return nodes;
  });
  for (const delimiter of ['`', '*', '**']) for (const backward of [false, true]) {
    await gate(`selection-${delimiter}-${backward ? 'backward' : 'forward'}`, async () => {
      await oneSend(`Selection ${delimiter} ${backward}`, { text: `prefix ${delimiter}stable`, hold: true });
      await waitFor(() => evaluate('document.querySelector("article[data-kind=assistant][data-status=responding] .entry-text")?.textContent.includes("stable")'), 'streamed text');
      await typeComposer('Next draft remains');
      await evaluate(`(()=>{const body=document.querySelector('article[data-kind=assistant][data-status=responding] .entry-text');const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const start=node.textContent.indexOf('stable');if(start>=0){getSelection().setBaseAndExtent(node,start+${backward ? 6 : 0},node,start+${backward ? 0 : 6});break;}}document.getElementById('composer').focus();})()`);
      assert.equal(await evaluate('getSelection().toString()'), 'stable'); await control('chunk', { text: `${delimiter} suffix` });
      await waitFor(() => evaluate('document.querySelector("article[data-kind=assistant][data-status=responding] .entry-text")?.textContent.includes("suffix")'), 'closing delimiter render');
      const result = await evaluate('({text:getSelection().toString(),anchor:getSelection().anchorOffset,focus:getSelection().focusOffset,active:document.activeElement.id,draft:document.getElementById("composer").value,sendDisabled:document.getElementById("send").disabled})');
      assert.equal(result.text, 'stable'); assert.equal(result.anchor > result.focus, backward); assert.equal(result.active, 'composer'); assert.equal(result.draft, 'Next draft remains'); assert.equal(result.sendDisabled, true);
      if (delimiter === '**' && backward) await screenshot('native-selection-strong-backward');
      await control('finish'); await waitFor(async () => (await control('state')).snapshot.turn.status === 'completed', 'selection turn settle'); return result;
    });
    await control('finish');
  }
  await gate('scroll-preserved-new-content-and-expansion', async () => {
    await oneSend('Long streaming answer', { text: 'Readable line.\n\n'.repeat(60), hold: true });
    await waitFor(() => evaluate('document.getElementById("timeline").scrollHeight > document.getElementById("timeline").clientHeight+300'), 'overflow timeline');
    await evaluate('document.getElementById("timeline").scrollTop=50'); const before = await evaluate('document.getElementById("timeline").scrollTop');
    await control('chunk', { text: '\n\nAPPENDED_NATIVE_CONTENT' }); await waitFor(() => evaluate('document.getElementById("timeline").textContent.includes("APPENDED_NATIVE_CONTENT")'), 'appended content');
    assert.equal(await evaluate('document.getElementById("timeline").scrollTop'), before); assert.equal(await evaluate('document.getElementById("new-content").hidden'), false);
    await click('#new-content'); assert.ok(await evaluate('(()=>{const e=document.getElementById("timeline");return e.scrollHeight-e.clientHeight-e.scrollTop<2;})()'));
    await control('finish'); await waitFor(async () => (await control('state')).snapshot.turn.status === 'completed', 'long turn settle');
 await screenshot('streaming-expanded'); return { preservedScrollTop: before };
  });
  await gate('cancelled-masked-key-preserves-live-draft-no-success-entry', async () => {
    await oneSend('Missing credential', { missingKey: true }); await settledTurn(); await typeComposer('Live credential draft'); const before = await control('state');
    await screenshot('failed');
    await click('button[data-action-type=configureProviderKey]:not(:disabled)'); await waitFor(() => evaluate('Boolean(document.querySelector(".quick-input-widget input[type=password]"))', true), 'masked input');
    await call('Input.insertText', { text: 'fixture-only-dummy-credential' }); await screenshot('masked-input'); await key('Escape', true);
    await waitFor(() => evaluate('!document.querySelector(".quick-input-widget input[type=password]") || document.querySelector(".quick-input-widget").style.display === "none"', true), 'input closed'); const after = await control('state');
    assert.equal(after.counters.secrets, 0); assert.equal(after.counters.provider, before.counters.provider); assert.equal(after.snapshot.draft, 'Live credential draft'); assert.equal(await evaluate('document.getElementById("composer").value'),'Live credential draft'); assert.deepEqual(after.snapshot.entries.map(e => ({id:e.id,kind:e.kind,text:e.text,status:e.status})), before.snapshot.entries.map(e => ({id:e.id,kind:e.kind,text:e.text,status:e.status}))); await screenshot('masked-cancelled'); return { draftPreserved: true, successEntryAdded: false };
  });
  await gate('hostile-Markdown', async () => {
    await oneSend('Render fixture prose', { text: '<img src=x onerror="alert(1)"><script>alert(1)</script> [unsafe](command:workbench.action.closeWindow) [safe](https://example.com)' }); const settlement = await settledTurn();
    const result = await evaluate(`(()=>{const entry=document.querySelector('article[data-entry-id="${settlement.host.turn.assistantEntryId}"]');const e=entry.querySelector('.entry-text');return {entryId:entry.dataset.entryId,ack:window.__nativeSnapshotAck,text:e.textContent,executable:e.querySelectorAll("script,img,button").length,links:[...e.querySelectorAll("a")].map(a=>a.href)};})()`);
    evidence.hostileMarkdownSamples ||= []; evidence.hostileMarkdownSamples.push({settlement,result});
    assert.equal(result.executable, 0); assert.deepEqual(result.links, ['https://example.com/']); return {settlement,result};
  });
  await gate('native-guided-learning-confirm-prepare-review-Apply-separate-Run', async () => {
    await control('newConversation'); await control('editor'); await resizeSidebar(600);
    await control('theme',{theme:'Default Light Modern'}); await waitFor(()=>evaluate('document.body.classList.contains("vscode-light")'),'light learning');
    await oneSend('What is an ordered list?',{text:'A list keeps values in insertion order. Which tradeoff matters for your design?'}); await settledTurn();
    assert.equal((await control('state')).learning.decisions.length,0); await screenshot('learning-question');
    await oneSend('I would keep one ordered list. Compare my options.',{checkpoint:'design'}); await settledTurn();
    assert.equal(await evaluate('document.getElementById("response-dock").dataset.state'),'waiting-learner');
    assert.equal(await evaluate('document.getElementById("stop").hidden'),true);
    await control('theme',{theme:'Default High Contrast'}); await waitFor(()=>evaluate('document.body.classList.contains("vscode-high-contrast")'),'HC checkpoint');
    await resizeSidebar(280); await screenshot('learning-checkpoint'); await typeComposer('Independent next reasoning');
    await control('scenario',{scenario:{checkpoint:'implementation',withPrior:true}}); await keyboardActivate('confirmCheckpoint'); await settledTurn();
    const confirmed=await control('state'); assert.equal(confirmed.learning.decisions[0].disposition,'confirmed'); assert.equal(confirmed.pendingProposal,null);
    assert.equal(confirmed.counters.nativeEdits,0); assert.equal(confirmed.counters.launches.length,0);
    await control('scenario',{scenario:{proposal:true}}); await keyboardActivate('implementCheckpoint'); await settledTurn();
    const staged=await control('state'); assert.ok(staged.pendingProposal); assert.equal(staged.pendingProposalReviewed,false);
    assert.equal(staged.snapshot.draft,'Independent next reasoning'); assert.equal(staged.counters.nativeEdits,0); assert.equal(staged.counters.launches.length,0);
    await resizeSidebar(360); await control('theme',{theme:'Default High Contrast Light'}); await waitFor(()=>evaluate('document.body.classList.contains("vscode-high-contrast-light")'),'HC light proposal');
    await screenshot('learning-proposal'); await keyboardActivate('reviewProposal'); await waitFor(async()=>(await control('state')).pendingProposalReviewed,'learning native diff');
    await keyboardActivate('acceptProposal'); await waitFor(async()=>(await control('state')).documentText==='items <- [42]\n','learning Apply');
    const applied=await control('state'); assert.equal(applied.counters.nativeEdits,1); assert.equal(applied.counters.launches.length,0);
    await control('runtimeReady'); await control('editor'); await key('s',true,2);
    await waitFor(async()=>(await control('state')).documentDirty===false,'owned applied file saved');
    await keyboardActivate('context-run',{byId:true});
    await waitFor(async()=>(await control('state')).counters.launches.length===1,'separate explicit learning Run'); await control('finishRun');
    await waitFor(async()=>(await control('state')).counters.closed===1,'learning Run closed'); await control('hideTerminal'); await control('show');
    await waitFor(()=>evaluate('document.querySelector("article[data-kind=run]")?.textContent.includes("Exact executed bytes: unknown")'),'learning Run unknowns');
    await control('theme',{theme:'Default Dark Modern'}); await waitFor(()=>evaluate('document.body.classList.contains("vscode-dark")'),'dark Run');
    await click('article[data-kind=run] details > summary'); await screenshot('learning-run');
    const retained=(await control('state')).learning; await recreateView(); assert.deepEqual((await control('state')).learning,retained);
    await control('newConversation'); assert.equal((await control('state')).learning.decisions.length,0);
    return {designAdopted:true,scopeClicked:true,nativeReviewed:true,ApplyDidNotRun:true,separateRun:true,viewRetainsLearning:true,newConversationClearsLearning:true};
  });
  await gate('native-preferences-queued-pause-and-resume', async () => {
    async function chooseMode(value) {
      await click('#guided-learning');
      await waitFor(()=>evaluate('document.querySelector(".quick-input-widget .quick-input-title")?.textContent.includes("KAFE learning preferences")',true),'native preference fields');
      await call('Input.insertText',{text:'Guided learning'}); await key('Enter',true);
      await waitFor(()=>evaluate('document.querySelector(".quick-input-widget .quick-input-title")?.textContent==="Guided learning"',true),'native mode values');
      await call('Input.insertText',{text:value}); await key('Enter',true);
    }
    await oneSend('Hold response while preferences change',{text:'Partial preference answer.',hold:true});
    await chooseMode('Pause teaching');
    await waitFor(async()=>(await control('state')).snapshot.learning.preferenceChangeQueued,'native busy preference queue');
    assert.equal((await control('state')).learning.preferences.mode,'guided'); await control('finish'); await settledTurn();
    assert.equal((await control('state')).learning.preferences.mode,'paused'); await screenshot('native-paused-preferences');
    await chooseMode('Guided learning'); await waitFor(async()=>(await control('state')).learning.preferences.mode==='guided','native resumed');
    const state=await control('state'); assert.equal(state.learning.decisions.length,0); assert.equal(state.pendingProposal,null);
    await control('newConversation'); return {queuedWhileBusy:true,pausedAfterSettlement:true,resumedNatively:true,noPreparationGrant:true};
  });
  await gate('native-diff-stale-rejection-and-reviewed-Apply', async () => {
    await control('closeProposalEditors'); const initial = await control('state'); await oneSend('Propose native diff', { proposal: true }); await settledTurn();
    const staged = await control('state'); assert.ok(staged.pendingProposal); assert.equal(staged.pendingProposalReviewed, false); assert.equal(staged.counters.diffOpens, initial.counters.diffOpens);
    assert.equal(await evaluate('Boolean(document.querySelector("button[data-action-type=acceptProposal]:not(:disabled)"))'), false);
    await sequentialTraversal('proposal-before-review',{requiredActions:['reviewProposal','rejectProposal']});
    await keyboardActivate('reviewProposal'); await waitFor(() => evaluate('Boolean(document.querySelector(".monaco-diff-editor"))', true), 'native diff'); await screenshot('native-diff');
    await waitFor(async () => (await control('state')).pendingProposalReviewed, 'review completed');
    await sequentialTraversal('proposal-actions',{requiredActions:['reviewProposal','acceptProposal','rejectProposal']}); await control('changeDocument'); const before = (await control('state')).documentText;
    await waitFor(async () => !(await control('state')).pendingProposal, 'changed source revokes proposal');
    // A source event may proactively revoke Apply before a click; both paths must deny the stale edit.
    if (await evaluate('Boolean(document.querySelector("button[data-action-type=acceptProposal]:not(:disabled)"))')) await keyboardActivate('acceptProposal');
    assert.equal((await control('state')).documentText, before); await control('closeProposalEditors'); await oneSend('Fresh native proposal', { proposal: true }); await settledTurn();
    await keyboardActivate('reviewProposal'); await waitFor(async () => (await control('state')).pendingProposalReviewed, 'fresh reviewed'); await keyboardActivate('acceptProposal');
    await waitFor(async () => (await control('state')).documentText === 'items <- [42]\n', 'edit applied'); assert.equal((await control('state')).counters.launches.length, initial.counters.launches.length); await screenshot('native-Apply');
    await control('closeProposalEditors'); await oneSend('Dismiss native proposal', { proposal: true }); await settledTurn(); const beforeDismiss = await control('state');
    await keyboardActivate('rejectProposal'); await waitFor(async () => !(await control('state')).pendingProposal, 'explicit Dismiss');
    const dismissed = await control('state'); assert.equal(dismissed.documentText, beforeDismiss.documentText); assert.equal(dismissed.counters.diffOpens, beforeDismiss.counters.diffOpens);
    return { staleDenied: true, reviewedApply: true, explicitDismiss: true, implicitRun: false, diffOpens: dismissed.counters.diffOpens-initial.counters.diffOpens, proposalEvents: dismissed.counters.proposalEvents };
  });
  await gate('native-Run-PTY-two-renewed-openings-and-reset-cleanup', async () => {
    await control('resetRunCounters');
    await control('runtimeReady'); await control('editor'); await key('s', true, 2); await pause(200); await keyboardActivate('context-run',{byId:true});
    await waitFor(async () => (await control('state')).counters.launches.length === 1, 'PTY launched');
    const ids = []; const baseline = await control('state');
    for (let n = 0; n < 2; n++) { await control('hideTerminal'); await waitFor(() => evaluate('Boolean(document.querySelector("button[data-action-type=openTerminal]:not(:disabled)"))'), 'open action');
      ids.push(await evaluate('document.querySelector("button[data-action-type=openTerminal]:not(:disabled)").dataset.actionId'));
      await keyboardActivate('openTerminal'); await waitFor(() => evaluate('Boolean(document.querySelector(".terminal-wrapper .xterm-helper-textarea"))', true), 'terminal visible'); }
    assert.notEqual(ids[0], ids[1]); const opened = await control('state'); assert.equal(opened.counters.terminalShows, baseline.counters.terminalShows + 2); assert.equal(opened.counters.provider, baseline.counters.provider); assert.equal(opened.counters.launches.length, 1);
    await evaluate('document.querySelector(".terminal-wrapper .xterm-helper-textarea").focus()', true); await call('Input.insertText', { text: 'native42' }); await key('Enter', true); await waitFor(async () => (await control('state')).counters.inputs.join('').includes('native42'), 'PTY input'); await screenshot('native-terminal');
    await control('newConversation'); assert.equal((await control('state')).snapshot.entries.length, 0); await control('finishRun'); await waitFor(async () => (await control('state')).counters.closed === 1, 'owned PTY closed'); assert.equal((await control('state')).snapshot.entries.length, 0);
    await control('editor'); await key('F5', true, 2); await waitFor(async () => (await control('state')).counters.launches.length === 2, 'Ctrl F5'); await control('finishRun'); await waitFor(async () => (await control('state')).counters.closed === 2, 'second close');
    await control('show');
    await waitFor(() => evaluate('(()=>{const entry=document.querySelector("article[data-kind=run]");const summary=entry?.querySelector("details > summary");if(!summary||!entry.textContent.includes("Exit code: 0"))return false;summary.focus();return document.activeElement===summary;})()'), 'numeric Run result rendered and Output focusable');
    await click('article[data-kind=run] details > summary'); await screenshot('run-output'); return { ids, terminalOpenDispatches: 2, closed: 2, resetDidNotRestoreRun: true };
  });
  await gate('native-null-exit-output-and-no-automatic-relaunch', async () => {
    await control('hideTerminal'); await control('editor'); const before = await control('state');
    await keyboardActivate('context-run',{byId:true});
    await waitFor(async () => (await control('state')).counters.launches.length === before.counters.launches.length + 1, 'explicit null-exit Run');
    await control('finishRunUnknown');
    await waitFor(async () => (await control('state')).counters.closed === before.counters.closed + 1, 'null exit settled');
    await control('hideTerminal');
    await waitFor(() => evaluate('[...document.querySelectorAll("article[data-kind=run]")].at(-1)?.textContent.includes("Exit code: unknown")'), 'unknown exit rendered');
    await evaluate('[...document.querySelectorAll("article[data-kind=run] details > summary")].at(-1).click()');
    const text = await evaluate('[...document.querySelectorAll("article[data-kind=run]")].at(-1).textContent');
    assert.match(text,/PARTIAL_NATIVE_OUTPUT/); assert.match(text,/Native child launch failed/); assert.match(text,/Output truncated/);
    const after = await control('state'); assert.equal(after.counters.launches.length,before.counters.launches.length+1); assert.equal(after.counters.provider,before.counters.provider);
    await screenshot('null-exit-output'); return {unknownExit:true,partialOutput:true,errors:true,truncated:true,automaticRun:false,automaticProvider:false};
  });
  await gate('native-explicit-inclusion-survives-active-closed-return', async () => {
    await control('newConversation'); await control('traversalSources'); await control('editor');
    await waitFor(() => evaluate('!document.getElementById("context-selector").hidden'),'optional selector');
    if (!await evaluate('document.getElementById("context-selector").open')) await click('#context-selector > summary');
    const optional = (await control('state')).snapshot.context.sources.find(s=>s.label==='optional-one-with-a-long-workspace-file-name.kf'); assert.ok(optional);
    await evaluate(`document.querySelector('input[data-source-id="${optional.id}"]').focus()`); await key(' ');
    await waitFor(async () => (await control('state')).snapshot.context.sources.some(s=>s.id===optional.id&&s.included),'explicit included B');
    await oneSend('NATIVE_SOURCE_LINEAGE_QUESTION',{text:'NATIVE_SOURCE_LINEAGE_ANSWER'}); await settledTurn();
    await control('target',{target:'optional'});
    await waitFor(async () => (await control('state')).snapshot.context.activeSource?.uri===optional.uri,'B active');
    await oneSend('Visit selected B',{text:'B remains selected'}); await settledTurn();
    assert.equal((await control('state')).counters.observations.at(-1).optionalOneSources,1);
    assert.equal(await evaluate(`Boolean(document.querySelector('input[data-source-id="${optional.id}"]'))`),false);
    await control('closeOptionalEditor');
    await waitFor(async () => (await control('state')).snapshot.context.activeSource?.label==='main.kf','return A');
    assert.equal((await control('state')).optionalEditorVisible,false);
    assert.ok((await control('state')).snapshot.context.sources.some(s=>s.id===optional.id&&s.included));
    await oneSend('Return after closing B',{text:'Selected closed B retained'}); await settledTurn();
    const observation = (await control('state')).counters.observations.at(-1);
    assert.equal(observation.optionalOneSources,1); assert.equal(observation.sourceHistoryLearner,true); assert.equal(observation.sourceHistoryAnswer,true);
    await screenshot('selected-closed-after-active'); await control('newConversation'); await control('traversalSources'); await control('editor');
    return {activeTransmittedOnce:true,retainedAfterClosing:true,historyRetained:true,observation};
  });
  await gate('real-source-watcher-revocation-and-awaited-capture-fence', async () => {
    await control('newConversation');
    await control('hideTerminal'); await control('traversalSources'); await control('editor'); await waitFor(() => evaluate('!document.getElementById("context-selector").hidden'), 'selector');
    if (!await evaluate('document.getElementById("context-selector").open')) await click('#context-selector > summary');
    await evaluate('document.querySelector("#context-sources input[data-source-id]").focus()'); await key(' '); await waitFor(async () => (await control('state')).snapshot.context.sources.some(s => s.included), 'included');
    await oneSend('NATIVE_SOURCE_LINEAGE_QUESTION', { text: 'NATIVE_SOURCE_LINEAGE_ANSWER' }); await settledTurn();
    await oneSend('Confirm eligible history', { text: 'Eligible history confirmed' }); await settledTurn(); const before = await control('state');
    assert.equal(before.counters.observations.at(-1).sourceHistoryLearner, true); assert.equal(before.counters.observations.at(-1).sourceHistoryAnswer, true);
    await control('barrier'); await typeComposer('Capture race'); await key('Enter'); await waitFor(async () => (await control('state')).barrierEntered, 'actual awaited source read');
    await control('disk', { optional: true, operation: 'delete' }); await waitFor(async () => (await control('state')).counters.watcher.delete > before.counters.watcher.delete, 'real watcher deletion'); await control('releaseBarrier'); await settledTurn();
    const after = await control('state'); assert.equal(after.counters.provider, before.counters.provider); assert.equal(after.historyCount, before.historyCount);
    await waitFor(async () => !(await control('state')).snapshot.context.sources.some(s => s.included), 'revoked context excluded');
    await oneSend('Fresh request after source revocation', { text: 'Fresh authorized answer' }); await settledTurn(); const fresh = await control('state'), observation = fresh.counters.observations.at(-1);
    assert.equal(observation.optionalOne, false); assert.equal(observation.sourceHistoryLearner, false); assert.equal(observation.sourceHistoryAnswer, false);
    assert.ok(fresh.snapshot.entries.some(e => e.text === 'NATIVE_SOURCE_LINEAGE_ANSWER')); assert.equal(fresh.historyCount, before.historyCount + 1);
    await control('disk', { optional: true, operation: 'write' }); await waitFor(async () => (await control('state')).counters.watcher.create > before.counters.watcher.create, 'real watcher creation');
    const created = await control('state'); await control('disk', { optional: true, operation: 'write' }); await waitFor(async () => (await control('state')).counters.watcher.change > created.counters.watcher.change, 'real watcher change');
    return { before: before.counters.watcher, after: (await control('state')).counters.watcher, zeroProviderDuringRace: true, storedHistoryRetained: true, freshObservation: observation };
  });
  await gate('native-non-target-proposal-dependency-revocation-after-focus', async () => {
    const cases = [];
    for (const mutation of ['change', 'delete']) {
      await control('traversalSources'); await control('editor');
      await waitFor(async () => (await control('state')).snapshot.context.activeSource?.label === 'main.kf', 'dependency A active');
      const target = (await control('state')).snapshot.context.sources.find(s => s.label === 'optional-one-with-a-long-workspace-file-name.kf'); assert.ok(target);
      if (!target.included) {
        if (!await evaluate('document.getElementById("context-selector").open')) await click('#context-selector > summary');
        await evaluate(`document.querySelector('#context-sources input[data-source-id=${JSON.stringify(target.id)}]').focus()`); await key(' ');
        await waitFor(async () => (await control('state')).snapshot.context.sources.some(s => s.id === target.id && s.included), 'target B explicitly included');
      }
      await oneSend(`Propose selected B before dependency ${mutation}`, { proposal: true, sourceId: target.id }); await settledTurn();
      const staged = await control('state'); assert.equal(staged.pendingProposalInfo.target, target.label); assert.ok(staged.pendingProposalInfo.dependencies.includes('main.kf'));
      assert.ok(staged.pendingProposalInfo.dependencies.includes(target.label));
      await keyboardActivate('reviewProposal'); await waitFor(async () => (await control('state')).pendingProposalReviewed, 'selected B real diff reviewed');
      await control('target', { target: 'third' }); const focused = await control('state');
      assert.equal(focused.snapshot.context.activeSource.label, 'optional-two-with-another-long-workspace-file-name.kf');
      assert.ok(!focused.snapshot.context.sources.some(s => s.label === 'main.kf' && s.included)); assert.equal(focused.pendingProposal, staged.pendingProposal);
      const mutationBaseline = focused.counters.watcher.delete;
      if (mutation === 'change') await control('changeDocument');
      else { await control('disk', { operation: 'delete' }); await waitFor(async () => (await control('state')).counters.watcher.delete > mutationBaseline, 'actual former dependency watcher deletion'); }
      await waitFor(async () => !(await control('state')).pendingProposal, 'non-target dependency revokes reviewed proposal');
      await waitFor(() => evaluate('!document.querySelector("button[data-action-type=acceptProposal]:not(:disabled)")'), 'old Apply unavailable');
      const after = await control('state'); assert.equal(after.optionalTargetText, focused.optionalTargetText); assert.equal(after.counters.nativeEdits, focused.counters.nativeEdits);
      cases.push({ mutation, proposal: staged.pendingProposalInfo, focused: focused.snapshot.context.activeSource.label, formerActiveIncluded: false, pendingRevoked: true, targetUnchanged: true, nativeEditsAdded: 0 });
      await screenshot(`non-target-dependency-${mutation}`);
      if (mutation === 'delete') { const creates = after.counters.watcher.create; await control('disk', { operation: 'write' }); await waitFor(async () => (await control('state')).counters.watcher.create > creates, 'owned dependency restored for restart'); }
    }
    return cases;
  });
  await gate('obsolete-envelope-and-legacy-preservation', async () => { const before = await control('state'); const after = await control('obsolete'); assert.equal(after.counters.obsoleteResult.status, 'stale'); assert.deepEqual(after.snapshot, before.snapshot); assert.equal(after.summary.goal, 'LEGACY_PRIVATE_GOAL'); return { rejected: true, legacyPreserved: true }; });
  await shutdown(); capturePrefix = 'restarted-'; await launch();
  await gate('real-host-restart-empty-chat-preserved-legacy', async () => { const state = await control('state'); assert.equal(state.snapshot.entries.length, 0); assert.equal(state.snapshot.draft, ''); assert.equal(state.summary.goal, 'LEGACY_PRIVATE_GOAL'); assert.equal(state.counters.provider, 0); return screenshot('empty'); });
  await gate('independent-confirmed-legacy-clear', async () => {
    await oneSend('Preserve live chat', { text: 'Live answer' }); await settledTurn(); await typeComposer('Keep live draft');
    const beforeKey=await control('state'); await control('configure'); await waitFor(()=>evaluate('Boolean(document.querySelector(".quick-input-widget input[type=password]"))',true),'real masked dummy-key input'); await call('Input.insertText',{text:'fixture-only-dummy-credential'}); await key('Enter',true); await waitFor(async()=>(await control('state')).counters.secrets===1,'dummy key stored'); await control('dismissNotifications');
    const before = await control('state'); assert.equal(before.dialogStyle,'custom'); assert.equal(before.keyState.count,1); assert.equal(before.counters.provider,beforeKey.counters.provider); assert.deepEqual(before.snapshot,beforeKey.snapshot); await control('clearLegacy');
    await waitFor(() => evaluate('[...document.querySelectorAll(".monaco-dialog-box .monaco-button")].some(e=>e.textContent.includes("Clear legacy progress"))', true), 'clear confirmation');
    await evaluate('[...document.querySelectorAll(".monaco-dialog-box .monaco-button")].find(e=>e.textContent.includes("Clear legacy progress")).focus()', true); await key('Enter', true); await waitFor(async () => {const state=await control('state');return state.clearOperation?.status==='settled' && !state.summary;}, 'production clear completed and legacy removed');
    const after = await control('state'); assert.deepEqual(after.snapshot, before.snapshot); assert.deepEqual(after.keyState,before.keyState); assert.equal(after.clearOperation.result.status,'completed'); assert.equal(await evaluate('document.getElementById("composer").value'),'Keep live draft'); return { liveConversationPreserved: true, keyState:after.keyState, commandResult:after.clearOperation };
  });
  await shutdown();
  const settingsPath = path.join(user, 'User', 'settings.json'); const settings = JSON.parse(fs.readFileSync(settingsPath)); settings['security.workspace.trust.enabled'] = true; settings['security.workspace.trust.startupPrompt'] = 'never'; settings['window.zoomLevel'] = 0; fs.writeFileSync(settingsPath, JSON.stringify(settings));
  capturePrefix = 'restricted-'; await launch();
  await gate('genuine-native-Restricted-Mode-text-chat', async () => {
    const before = await control('state'); assert.equal(before.trusted, false); assert.equal(before.snapshot.context.restricted, true); assert.equal(before.snapshot.contextActions.actions.length, 0);
    assert.match(await evaluate('document.getElementById("context-row").textContent'), /restricted|excluded/i); await oneSend('Restricted Hello', { text: 'Restricted answer' }); await settledTurn();
    const after = await control('state'), observation = after.counters.observations.at(-1); assert.equal(observation.main, false); assert.equal(observation.optionalOne, false); assert.ok(!observation.tools.includes('proposeCodeChange')); assert.equal(after.counters.launches.length, 0); await screenshot('chat'); return { actualTrust: after.trusted, observation };
  });
}
main().catch(error => { evidence.fatal = { message: error.message, stack: error.stack }; console.error(error.message); }).finally(async () => {
  try { const state = controlPort && await control('dispose'); evidence.watcherDisposal = state?.counters.watcher; } catch {}
  await shutdown();
  try {
    const safeRoot = root.replaceAll("'", "''"); const ports = evidence.launches?.flatMap(l => [l.port, l.controlPort]).filter(Boolean) || [];
    evidence.cleanupVerification = JSON.parse(cp.execFileSync('powershell', ['-NoProfile', '-Command',
      `$ports=@(${ports.join(',')}); $listeners=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }); $owned=@(Get-CimInstance Win32_Process -Filter "Name='Code.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${safeRoot}') }); @{listeners=$listeners.Count;ownedCodeProcesses=$owned.Count} | ConvertTo-Json`], { encoding: 'utf8', windowsHide: true }));
    if (evidence.cleanupVerification.listeners === 0 && evidence.cleanupVerification.ownedCodeProcesses === 0) {
      assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('kafe-native-owned-'));
      cp.execFileSync('powershell', ['-NoProfile', '-Command', `Remove-Item -LiteralPath '${safeRoot}' -Recurse -Force`], { windowsHide: true }); evidence.cleanupVerification.profileRemoved = !fs.existsSync(root);
    }
  } catch (error) { evidence.cleanupVerification = { error: error.message }; }
  evidence.finished = new Date().toISOString(); evidence.pass = !evidence.fatal && evidence.gates.every(g => g.pass) && evidence.cleanupVerification.listeners === 0 && evidence.cleanupVerification.ownedCodeProcesses === 0 && evidence.cleanupVerification.profileRemoved === true;
  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify({ pass: evidence.pass, gates: evidence.gates.length, failures: evidence.gates.filter(g => !g.pass).map(g => g.name), out })); process.exitCode = evidence.pass ? 0 : 1;
});
