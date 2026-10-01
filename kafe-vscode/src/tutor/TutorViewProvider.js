const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTutorMessage(value, session) {
  if (!isRecord(value) || !Object.hasOwn(value, 'type')) return false;
  if (!session) return false;
  const snapshot = typeof session.snapshot === 'function' ? session.snapshot() : session;
  if (!isRecord(snapshot) || typeof snapshot.sessionId !== 'string' || !snapshot.sessionId.trim() ||
    !Number.isSafeInteger(snapshot.generation) || snapshot.generation < 0) return false;
  if (value.sessionId !== snapshot.sessionId || value.generation !== snapshot.generation) return false;
  const exact = fields => {
    const keys = ['type', 'sessionId', 'generation', ...fields];
    return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  };
  switch (value.type) {
    case 'setDraft': return exact(['text']) && typeof value.text === 'string';
    case 'submitMessage': return exact(['submissionId', 'text', 'contextRevision']) &&
      typeof value.submissionId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.submissionId) &&
      typeof value.text === 'string' && Boolean(value.text.trim()) && Number.isSafeInteger(value.contextRevision) && value.contextRevision >= 0;
    case 'setSourceIncluded': return exact(['sourceId', 'included', 'contextRevision']) &&
      typeof value.sourceId === 'string' && Boolean(value.sourceId.trim()) && typeof value.included === 'boolean' && Number.isSafeInteger(value.contextRevision) && value.contextRevision >= 0;
    case 'invokeAction': return typeof session.resolveAction === 'function' && Boolean(session.resolveAction(value));
    case 'openLink': return exact(['url']) && isExternalLink(value.url);
    case 'stopTurn': return exact(['turnId', 'turnGeneration']) && snapshot.turn !== null &&
      ['preparing', 'responding', 'processing-tools'].includes(snapshot.turn?.status) && value.turnId === snapshot.turn.id &&
      value.turnGeneration === snapshot.turn.turnGeneration;
    default: return false;
  }
}

function isExternalLink(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function dispatchTutorMessage(message, onMessage, session) {
  if (!isTutorMessage(message, session)) return false;
  // TutorHostActions resolves again and atomically consumes before its side effect.
  onMessage(message);
  return true;
}

class TutorViewProvider {
  constructor({ vscode, extensionUri, onMessage = () => {}, conversationSession }) {
    this.vscode = vscode;
    this.extensionUri = extensionUri;
    this.onMessage = onMessage;
    this.conversationSession = conversationSession;
    this.view = undefined;
    this.releaseView = undefined;
  }

  resolveWebviewView(view) {
    this.releaseView?.();
    this.view = view;
    const { webview } = view;
    const resourceRoot = this.vscode.Uri.joinPath(this.extensionUri, 'src', 'tutor');
    webview.options = { enableScripts: true, localResourceRoots: [resourceRoot] };
    const scriptUri = webview.asWebviewUri(this.vscode.Uri.joinPath(resourceRoot, 'tutorView.js'));
    const timelineUri = webview.asWebviewUri(this.vscode.Uri.joinPath(resourceRoot, 'tutorTimeline.js'));
    const styleUri = webview.asWebviewUri(this.vscode.Uri.joinPath(resourceRoot, 'tutorView.css'));
    const nonce = randomBytes(16).toString('base64');
    const template = readFileSync(path.join(__dirname, 'tutorView.html'), 'utf8');
    // In-memory boot projection avoids depending on delivery of the first
    // postMessage before the webview has installed its message listener.
    const initialState = JSON.stringify(this.conversationSession?.snapshot() || null)
      .replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026')
      .replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
    webview.html = template
      .replaceAll('{{CSP_SOURCE}}', webview.cspSource)
      .replaceAll('{{NONCE}}', nonce)
      .replaceAll('{{STYLE_URI}}', styleUri.toString())
      .replaceAll('{{TIMELINE_URI}}', timelineUri.toString())
      .replaceAll('{{SCRIPT_URI}}', scriptUri.toString())
      .replace('{{INITIAL_STATE}}', () => initialState);
    let disposalSubscription, released = false;
    const messageSubscription = webview.onDidReceiveMessage(message => {
      if (released || this.view !== view) return false;
      if (!isTutorMessage(message, this.conversationSession)) return false;
      if (message.type === 'openLink') {
        // Explicit external navigation is the only model-link effect. Internal native
        // diff/source/terminal actions still require host-issued capabilities.
        try { return Promise.resolve(this.vscode.env?.openExternal(this.vscode.Uri.parse(message.url))).catch(() => false); }
        catch { return false; }
      }
      return dispatchTutorMessage(message, this.onMessage, this.conversationSession);
    });
    const unsubscribe = this.conversationSession?.subscribe(state => this.render(state));
    this.releaseView = () => {
      if (released) return;
      released = true;
      unsubscribe?.();
      messageSubscription?.dispose();
      disposalSubscription?.dispose();
      if (this.view === view) this.view = undefined;
    };
    disposalSubscription = view.onDidDispose?.(this.releaseView);
    if (this.conversationSession) this.render(this.conversationSession.snapshot());
  }

  dispose() { this.releaseView?.(); this.releaseView = undefined; }

  render(state) {
    return this.view?.webview.postMessage({ type: 'render', state });
  }
}

module.exports = { TutorViewProvider, isTutorMessage, dispatchTutorMessage };
