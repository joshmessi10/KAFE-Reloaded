const assert = require('node:assert/strict');
const test = require('node:test');

const { isTutorMessage, dispatchTutorMessage, TutorViewProvider } = require('../../src/tutor/TutorViewProvider');

test('Tutor host accepts only the eight learner message types', () => {
  for (const type of [
    'startSession', 'confirmMilestones', 'sendMessage', 'removeContextSource',
    'acceptProposal', 'rejectProposal', 'clearProgress', 'retryMessage',
  ]) {
    assert.equal(isTutorMessage({ type }), true, `${type} should be accepted`);
  }
  for (const value of [null, [], 'sendMessage', {}, { type: 'runKafe' },
    { type: 'readFile' }, { type: 'sendMessage' + ' ' }, { type: 1 }]) {
    assert.equal(isTutorMessage(value), false);
  }
});

test('unknown webview messages cause no host action', () => {
  const received = [];
  assert.equal(dispatchTutorMessage({ type: 'runKafe' }, message => received.push(message)), false);
  assert.deepEqual(received, []);
  const message = { type: 'sendMessage', text: 'Help with lists' };
  assert.equal(dispatchTutorMessage(message, value => received.push(value)), true);
  assert.deepEqual(received, [message]);
});

test('Tutor view binds local resources and routes validated messages only', () => {
  let receive;
  const received = [];
  const extensionUri = { path: '/extension' };
  const vscode = {
    Uri: { joinPath: (...parts) => ({ path: parts.map(part => part.path || part).join('/') }) },
  };
  const webview = {
    cspSource: 'vscode-webview-resource:',
    asWebviewUri: uri => `vscode-resource:${uri.path}`,
    onDidReceiveMessage: listener => { receive = listener; return { dispose() {} }; },
  };
  const provider = new TutorViewProvider({ vscode, extensionUri, onMessage: message => received.push(message) });
  provider.resolveWebviewView({ webview });
  assert.deepEqual(webview.options.localResourceRoots, [{ path: '/extension/src/tutor' }]);
  assert.equal(webview.options.enableScripts, true);
  assert.match(webview.html, /Content-Security-Policy/);
  assert.match(webview.html, /script-src 'nonce-[^']+';/);
  assert.match(webview.html, /vscode-resource:.*tutorView\.js/);
  receive({ type: 'runKafe' });
  assert.deepEqual(received, []);
  receive({ type: 'clearProgress' });
  assert.deepEqual(received, [{ type: 'clearProgress' }]);
});

test('Tutor view renders restored coordinator state when its Webview resolves', () => {
  const state = { goal: 'Restored goal', milestones: [{ id: 'm1', text: 'Learn lists' }], confirmed: true };
  const posted = [];
  const vscode = { Uri: { joinPath: (...parts) => ({ path: parts.map(part => part.path || part).join('/') }) } };
  const webview = { cspSource: 'vscode-webview-resource:', asWebviewUri: uri => `vscode-resource:${uri.path}`,
    onDidReceiveMessage: () => ({ dispose() {} }), postMessage: message => posted.push(message) };
  const provider = new TutorViewProvider({ vscode, extensionUri: { path: '/extension' }, getState: () => state });
  provider.resolveWebviewView({ webview });
  assert.deepEqual(posted, [{ type: 'render', state }]);
});
