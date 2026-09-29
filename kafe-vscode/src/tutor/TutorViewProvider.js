const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const MESSAGE_TYPES = new Set([
  'startSession', 'confirmMilestones', 'sendMessage', 'setContextSourceIncluded',
  'acceptProposal', 'rejectProposal', 'clearProgress', 'retryMessage', 'recordReviewedCheck',
]);

function isTutorMessage(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.hasOwn(value, 'type') && MESSAGE_TYPES.has(value.type);
}

function dispatchTutorMessage(message, onMessage) {
  if (!isTutorMessage(message)) return false;
  onMessage(message);
  return true;
}

class TutorViewProvider {
  constructor({ vscode, extensionUri, onMessage = () => {}, getState }) {
    this.vscode = vscode;
    this.extensionUri = extensionUri;
    this.onMessage = onMessage;
    this.getState = getState;
    this.view = undefined;
  }

  resolveWebviewView(view) {
    this.view = view;
    const { webview } = view;
    const resourceRoot = this.vscode.Uri.joinPath(this.extensionUri, 'src', 'tutor');
    webview.options = { enableScripts: true, localResourceRoots: [resourceRoot] };
    const scriptUri = webview.asWebviewUri(this.vscode.Uri.joinPath(resourceRoot, 'tutorView.js'));
    const styleUri = webview.asWebviewUri(this.vscode.Uri.joinPath(resourceRoot, 'tutorView.css'));
    const nonce = randomBytes(16).toString('base64');
    const template = readFileSync(path.join(__dirname, 'tutorView.html'), 'utf8');
    webview.html = template
      .replaceAll('{{CSP_SOURCE}}', webview.cspSource)
      .replaceAll('{{NONCE}}', nonce)
      .replaceAll('{{STYLE_URI}}', styleUri.toString())
      .replaceAll('{{SCRIPT_URI}}', scriptUri.toString());
    webview.onDidReceiveMessage(message => dispatchTutorMessage(message, this.onMessage));
    if (this.getState) this.render(this.getState());
  }

  render(state) {
    return this.view?.webview.postMessage({ type: 'render', state });
  }
}

module.exports = { TutorViewProvider, isTutorMessage, dispatchTutorMessage };
