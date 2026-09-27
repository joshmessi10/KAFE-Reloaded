const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');

const tutorRoot = path.resolve(__dirname, '../../src/tutor');

function loadView() {
  const nodes = new Map();
  const sent = [];
  let onMessage;
  const document = { activeElement: null };

  class Node {
    constructor(tagName, value = '') {
      this.tagName = tagName;
      this._text = value;
      this.children = [];
      this.listeners = new Map();
      this.dataset = {};
      this.value = '';
    }
    set textContent(value) { this._text = value; this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    contains(target) { return this === target || this.children.some(child => child.contains(target)); }
    replaceChildren(...children) {
      if (document.activeElement && this.contains(document.activeElement)) document.activeElement = null;
      this._text = '';
      this.children = children;
    }
    querySelector(tagName) { return this.querySelectorAll(tagName)[0] ?? null; }
    insertBefore(child, reference) {
      child.remove();
      child.parent = this;
      const index = reference ? this.children.indexOf(reference) : this.children.length;
      this.children.splice(index, 0, child);
    }
    remove() {
      if (!this.parent) return;
      const index = this.parent.children.indexOf(this);
      if (index >= 0) this.parent.children.splice(index, 1);
      this.parent = null;
    }
    querySelectorAll(tagName) {
      return this.children.flatMap(child => [
        ...(child.tagName === tagName ? [child] : []), ...child.querySelectorAll(tagName),
      ]);
    }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    dispatch(type) { this.listeners.get(type)?.({ preventDefault() {} }); }
    focus() { document.activeElement = this; }
    setAttribute(name, value) { this[name] = value; }
  }

  const html = readFileSync(path.join(tutorRoot, 'tutorView.html'), 'utf8');
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(id, new Node('static'));
  document.getElementById = id => nodes.get(id);
  document.createElement = tagName => new Node(tagName);
  document.createTextNode = value => new Node('#text', value);
  const window = { addEventListener(type, listener) { if (type === 'message') onMessage = listener; } };
  const script = readFileSync(path.join(tutorRoot, 'tutorView.js'), 'utf8');
  vm.runInNewContext(script, { acquireVsCodeApi: () => ({ postMessage: message => sent.push(message) }), document, window });
  return {
    byId: id => nodes.get(id), document, sent,
    render: state => onMessage({ data: { type: 'render', state } }),
  };
}

test('state refresh preserves unconfirmed goal and milestone drafts plus keyboard focus', () => {
  const view = loadView();
  const state = { goal: 'Learn loops', milestones: [{ id: 'first', text: 'Write a loop' }] };
  view.render(state);
  view.byId('goal-input').value = 'Learn loops and lists';
  const draftInput = view.byId('milestone-list').querySelectorAll('input')[0];
  draftInput.value = 'Write a loop over a list';
  draftInput.focus();

  view.render({ ...state, providerStatus: 'Ready' });

  assert.equal(view.byId('goal-input').value, 'Learn loops and lists');
  assert.equal(view.byId('milestone-list').querySelectorAll('input')[0], draftInput);
  assert.equal(draftInput.value, 'Write a loop over a list');
  assert.equal(view.document.activeElement, draftInput);
  view.byId('confirm-milestones').dispatch('click');
  assert.equal(view.sent.at(-1).milestones[0].text, 'Write a loop over a list');
});

test('Tutor view shows milestone confirmation and inline preview feedback', () => {
  const view = loadView();
  view.render({ confirmed: true, milestones: [{ id: 'first', text: 'Index a list' }],
    milestoneStatus: 'Milestones confirmed. Tell me where you would like a hint.',
    interactionStatus: 'A managed KAFE knowledge pack is required for tutor context.' });

  assert.equal(view.byId('confirm-milestones').textContent, 'Update confirmed milestones');
  assert.equal(view.byId('milestone-status').hidden, false);
  assert.match(view.byId('milestone-status').textContent, /milestones confirmed/i);
  assert.equal(view.byId('interaction-status').hidden, false);
  assert.match(view.byId('interaction-status').textContent, /managed KAFE knowledge pack/i);
});

test('Tutor header reflects an active learning goal', () => {
  const view = loadView();
  view.render({ goal: 'Build a supervised model' });
  assert.match(view.byId('provider-status').textContent, /learning goal active/i);
  assert.doesNotMatch(view.byId('provider-status').textContent, /set a learning goal/i);

  view.render({ goal: '' });
  assert.match(view.byId('provider-status').textContent, /set a learning goal/i);
});

test('tutor messages render basic Markdown as safe formatted DOM nodes', () => {
  const view = loadView();
  const rawMarkup = '<script>alert("x")</script>';
  view.render({ messages: [{ role: 'tutor', text: `**Hint:** Check \`SalePrice\`.\n${rawMarkup}` }] });

  const paragraph = view.byId('message-list').children[0];
  assert.equal(paragraph.children[0].tagName, 'strong');
  assert.equal(paragraph.children[0].textContent, 'Tutor: ');
  assert.equal(paragraph.children[1].tagName, 'strong');
  assert.equal(paragraph.children[1].textContent, 'Hint:');
  assert.equal(paragraph.children[2].textContent, ' Check ');
  assert.equal(paragraph.children[3].tagName, 'code');
  assert.equal(paragraph.children[3].textContent, 'SalePrice');
  assert.equal(paragraph.children[4].textContent, '.');
  assert.equal(paragraph.children[5].tagName, 'br');
  assert.equal(paragraph.children[6].tagName, '#text');
  assert.equal(paragraph.children[6].textContent, rawMarkup);
  assert.equal(paragraph.querySelectorAll('script').length, 0);
});

test('tutor messages render single-asterisk emphasis instead of showing Markdown markers', () => {
  const view = loadView();
  view.render({ messages: [{ role: 'tutor', text: '*Concrete next step:* Open the Data tab.' }] });

  const paragraph = view.byId('message-list').children[0];
  assert.equal(paragraph.children[1].tagName, 'em');
  assert.equal(paragraph.children[1].textContent, 'Concrete next step:');
  assert.equal(paragraph.children[2].textContent, ' Open the Data tab.');
});

test('context preview identifies included and excluded sources', () => {
  const view = loadView();
  view.render({ contextSources: [
    { id: 'a', category: 'selected-file', label: 'examples/a.kf', included: true },
    { id: 'b', category: 'selected-file', label: 'examples/b.kf', included: false },
  ] });
  const rows = view.byId('context-list').children;
  assert.match(rows[0].textContent, /Included/);
  assert.match(rows[1].textContent, /Excluded/);
  assert.equal(rows[0].querySelectorAll('button').length, 1);
  assert.equal(rows[1].querySelectorAll('button').length, 0);
});

test('run evidence renders contributor provenance without invented version numbers', () => {
  const view = loadView();
  view.render({ evidence: { stdout: '2\n', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeMode: 'contributor', runtimeVersion: null, knowledgePackVersion: null } });
  assert.match(view.byId('evidence-summary').textContent, /contributor/i);
  assert.doesNotMatch(view.byId('evidence-summary').textContent, /0\.1\.0/);
});

test('run evidence visibly names its source file', () => {
  const view = loadView();
  view.render({ evidence: { stdout: 'ok', stderr: '', exitCode: 0, outputTruncated: false,
    runtimeMode: 'managed', runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0',
    sourceUri: 'file:///workspace/main.kf', runSequence: 2 } });
  assert.match(view.byId('evidence-summary').textContent, /main\.kf/);
});

test('view-generated milestone objects are accepted by the session coordinator', async () => {
  const view = loadView();
  const coordinator = new SessionCoordinator({ provider: {}, contextComposer: {} });
  await coordinator.handleLearnerMessage({ type: 'startSession', goal: 'Lists' });
  view.render(coordinator.state);
  const inputs = view.byId('milestone-list').querySelectorAll('input');
  assert.ok(inputs.length >= 2);
  assert.ok(inputs.every(input => input.value));
  inputs[0].value = 'Build a KAFE list';
  view.byId('confirm-milestones').dispatch('click');
  const confirmed = await coordinator.handleLearnerMessage(view.sent.at(-1));
  assert.equal(confirmed.kind, 'coaching');
  assert.equal(coordinator.state.confirmed, true);
  assert.equal(coordinator.state.milestones[0].text, 'Build a KAFE list');
});

test('view displays exact preview payload and sends its token with one Send action', () => {
  const view = loadView();
  view.byId('message-input').value = 'Help with lists';
  view.byId('message-input').dispatch('input');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'sendMessage', phase: 'preview', text: 'Help with lists' }));
  const payload = { messages: [{ role: 'user', content: '[Source selected:0]\nEXACT_OPTIONAL_CONTENT' }], tools: [] };
  view.render({
    contextSources: [{ id: 'selected:0', category: 'selected-file', label: 'extra.kf', included: true }],
    preview: { token: 'preview-1', draft: 'Help with lists', payload },
  });
  assert.deepEqual(JSON.parse(view.byId('context-payload').textContent), payload);
  view.byId('message-form').dispatch('submit');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'sendMessage', text: 'Help with lists', previewToken: 'preview-1' }));
});

test('provider failure exposes a learner-triggered retry using the retained preview token', () => {
  const view = loadView();
  view.render({ providerStatus: 'DeepSeek is rate limited. Retry when ready.', retryAvailable: true,
    preview: { token: 'same-token', draft: 'Help', payload: { messages: [], tools: [] } } });
  assert.match(view.byId('provider-status').textContent, /rate limited/);
  assert.equal(view.byId('retry-message').hidden, false);
  assert.deepEqual(JSON.parse(view.byId('context-payload').textContent), { messages: [], tools: [] });
  view.byId('retry-message').dispatch('click');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'retryMessage', previewToken: 'same-token' }));
});

test('proposal controls send only the opaque rendered proposal ID', () => {
  const view = loadView();
  view.render({ proposal: { id: 'opaque-1', description: 'Review proposed KAFE change' } });
  view.byId('accept-proposal').dispatch('click');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'acceptProposal', id: 'opaque-1' }));
  view.byId('reject-proposal').dispatch('click');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'rejectProposal', id: 'opaque-1' }));
});

test('Tutor clear button sends the shared clearProgress action', () => {
  const view = loadView();
  view.byId('clear-progress').dispatch('click');
  assert.equal(JSON.stringify(view.sent.at(-1)), JSON.stringify({ type: 'clearProgress' }));
});
