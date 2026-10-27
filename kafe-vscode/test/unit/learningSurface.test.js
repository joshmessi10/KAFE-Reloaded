const test = require('node:test');
const assert = require('node:assert/strict');
const { loadView, snapshot, entry, action } = require('../helpers/tutorViewHarness');
const checkpoint = (patch = {}) => ({ kind: 'implementation', name: 'Loop items', learnerProposalSummary: 'I would iterate once', tutorProposedAdditions: ['Use one counter'], scopeSummary: 'Replace only the output statement', tradeoffs: ['Counter state'], unresolvedChoices: [], sourceIds: ['active-file'], priorDecisionIds: ['prior'], ...patch });
const decision = (patch = {}, data = {}) => entry('decision', 'checkpoint', 'Loop items', { status: 'ready', data: { checkpoint: checkpoint(patch), summaryAttribution: 'tutor-unconfirmed', grounding: 'source-linked-proposal', targetUri: 'file:///first/main.kf', ...data }, actions: [action('help', 'discussCheckpoint'), action('skip', 'skipCheckpoint')] });

// The fake DOM exposes collapsed text too; inspect its actual disclosure ancestry.
function visibleText(node) {
  if (node.tagName === 'details' && !node.open) return node.children[0].textContent;
  return node.nodeType === 3 ? node.data : node.childNodes.map(visibleText).join(' ');
}

test('short design leads with decision and essential choices while secondary detail is collapsed', () => {
  const v = loadView(); v.render(snapshot({ entries: [decision({ kind: 'design', scopeSummary: '', unresolvedChoices: ['Choose ordering'] }, { targetUri: undefined })] }));
  const timeline = v.byId('timeline'), visible = visibleText(timeline);
  for (const value of ['Loop items', 'Tutor summary, unconfirmed', 'Counter state', 'Choose ordering', 'adopts the displayed approach']) assert.ok(visible.includes(value), value);
  for (const value of ['Preparation scope', 'Preparation target', 'No preparation', 'Use one counter', 'active-file', 'prior', 'independent authorship']) assert.equal(visible.includes(value), false, value);
  const disclosure = timeline.querySelector('details');
  assert.equal(Boolean(disclosure.open), false);
  assert.match(disclosure.textContent, /Use one counter.*independent authorship.*active-file.*prior/);
});

test('preparation and proposal keep unique target, scope and consequence visible with canonical identity in details', () => {
  for (const kind of ['checkpoint', 'host', 'proposal']) {
    const v = loadView(), targetUri = 'file:///workspace/first/main.kf';
    const data = { targetUri, targetLabel: 'first/main.kf', scopeSummary: 'Replace only the output statement', ...(kind === 'checkpoint' ? { checkpoint: checkpoint() } : {}) };
    v.render(snapshot({ entries: [entry('d', kind, 'Loop items', { status: 'ready', data })] }));
    const t = v.byId('timeline'), visible = visibleText(t);
    assert.ok(visible.includes('first/main.kf'));
    assert.ok(visible.includes(data.scopeSummary));
    assert.match(visible, /Review.*Apply.*Run/);
    assert.equal(visible.includes(targetUri), false);
    assert.ok(t.querySelector('details').textContent.includes(targetUri));
  }
});

test('target label and proposal provenance remain literal and supporting identifiers stay collapsed', () => {
  const v = loadView(), targetLabel = 'lessons/<img src=x onerror=claim()>/main.kf';
  v.render(snapshot({ entries: [entry('p', 'proposal', 'Review the loop', { status: 'ready', data: {
    targetUri: 'file:///a/main.kf', targetLabel, proposalId: '<script>claim()</script>', documentVersion: 7,
    scopeSummary: 'Change only the loop',
  } })] }));
  const t = v.byId('timeline'), visible = visibleText(t), detail = t.querySelector('details');
  assert.ok(visible.includes(targetLabel)); assert.equal(visible.includes('claim()</script>'), false);
  assert.match(detail.textContent, /file:\/\/\/a\/main.kf.*Proposal ID.*<script>claim\(\)<\/script>.*Document version at preparation.*7/);
  assert.equal(t.querySelectorAll('img').length, 0); assert.equal(t.querySelectorAll('script').length, 0);
});

test('maximal design retains all additions and references safely inside stable collapsed details', () => {
  const additions = Array.from({ length: 8 }, (_, i) => `${i}: ${'<img src=x onerror=claim()>'.repeat(12)}`);
  const v = loadView(); const e = decision({ kind: 'design', tutorProposedAdditions: additions, unresolvedChoices: ['Ordering?'] }, { targetUri: undefined });
  v.render(snapshot({ entries: [e] }));
  const t = v.byId('timeline'), detail = t.querySelector('details');
  assert.equal(visibleText(t).includes(additions[7]), false);
  assert.ok(detail.textContent.includes(additions[7])); assert.equal(t.querySelectorAll('img').length, 0);
  detail.open = true;
  v.render(snapshot({ revision: 2, entries: [{ ...e, status: 'discussed' }] }));
  assert.equal(t.querySelector('details'), detail); assert.equal(detail.open, true);
});

test('inline checkpoint exposes full bounded fields, exact target, attribution and distinct authorities', () => {
  const v = loadView(); v.render(snapshot({ draft: 'Independent reasoning', entries: [decision()] }));
  const t = v.byId('timeline').textContent;
  for (const value of ['Implementation checkpoint', 'Learner proposal — Tutor summary, unconfirmed', 'I would iterate once', 'Tutor additions', 'Use one counter', 'Preparation scope', 'Replace only the output statement', 'file:///first/main.kf', 'Tradeoffs', 'Counter state', 'active-file', 'prior']) assert.ok(t.includes(value), value);
  assert.match(t, /adoption.*independent authorship.*understanding/i);
  assert.match(t, /Review.*Apply.*Run/);
  assert.equal(v.byId('composer').value, 'Independent reasoning');
  assert.equal(v.byId('stop').hidden, true);
  assert.equal(v.byId('response-dock').getAttribute('aria-busy'), 'false');
  assert.deepEqual(v.persisted, []);
});

test('message-only design, unresolved choices and stale adopted decisions retain honest labels', () => {
  const v = loadView(); v.render(snapshot({ entries: [decision({ kind: 'design', unresolvedChoices: ['Choose ordering'] }, { grounding: 'message-only-proposal', targetUri: undefined })] }));
  assert.match(v.byId('timeline').textContent, /Design checkpoint/);
  assert.match(v.byId('timeline').textContent, /Message-only proposal.*not verified KAFE guidance/);
  assert.match(v.byId('timeline').textContent, /Choose ordering/);
  assert.match(v.byId('timeline').textContent, /Unresolved choices/);
  assert.doesNotMatch(v.byId('timeline').textContent, /preparation is unavailable/);
  v.render(snapshot({ revision: 2, entries: [{ ...decision({}, { disposition: 'confirmed' }), status: 'stale', actions: [] }] }));
  assert.match(v.byId('timeline').textContent, /Adopted.*Stale/);
  assert.match(v.byId('timeline').textContent, /Tutor summary, unconfirmed/);
  assert.equal(v.byId('timeline').querySelectorAll('button').length, 0);
});

test('all checkpoint list limits remain fully reachable and literal provider HTML is inert', () => {
  const v = loadView(), list = Array.from({ length: 8 }, (_, i) => `${i}: ${'A'.repeat(490)}`);
  v.render(snapshot({ entries: [decision({ learnerProposalSummary: '<script>claim()</script>', tutorProposedAdditions: list, tradeoffs: list, unresolvedChoices: list })] }));
  const t = v.byId('timeline');
  assert.equal(t.querySelectorAll('li').length, 26);
  assert.ok(t.textContent.includes(list.at(-1)));
  assert.equal(t.querySelectorAll('script').length, 0);
  const disclosure = t.querySelector('details'); disclosure.open = true;
  v.render(snapshot({ revision: 2, entries: [decision({ learnerProposalSummary: '<script>claim()</script>', tutorProposedAdditions: list, tradeoffs: list, unresolvedChoices: list }, { disposition: 'confirmed' })] }));
  assert.equal(t.querySelector('details'), disclosure); assert.equal(disclosure.open, true);
});

test('queued pause retains the admitted mode and announces settlement once', () => {
  const v = loadView(), turn = { id: 'turn', turnGeneration: 1, submissionId: 'submission', status: 'responding' };
  const admitted = { revision: 1, displayRevision: 1, preferences: { mode: 'guided' }, preferenceChangeQueued: false };
  v.render(snapshot({ turn, learning: admitted, entries: [entry('answer', 'assistant', 'First text')] }));
  const composer = v.byId('composer');
  composer.focus();
  const queued = { ...admitted, displayRevision: 2, preferenceChangeQueued: true };
  v.render(snapshot({ turn, learning: queued, entries: [entry('answer', 'assistant', 'First text')] }));
  assert.match(v.byId('conversation-status').textContent, /queued.*response settles/);
  const queuedAnnouncement = v.byId('conversation-status').firstChild;
  v.render(snapshot({ revision: 2, turn, learning: queued, entries: [entry('answer', 'assistant', 'First text with a delta')] }));
  assert.equal(v.byId('conversation-status').firstChild, queuedAnnouncement);
  const settled = { revision: 2, displayRevision: 3, preferences: { mode: 'paused' }, preferenceChangeQueued: false };
  v.render(snapshot({ revision: 3, turn: { ...turn, status: 'completed' }, learning: settled, entries: [entry('answer', 'assistant', 'Final answer')] }));
  assert.match(v.byId('conversation-status').textContent, /Response complete.*Guided learning paused/);
  assert.equal(v.document.activeElement, composer);
  const settledAnnouncement = v.byId('conversation-status').firstChild;
  v.render(snapshot({ revision: 4, turn: { ...turn, status: 'completed' }, learning: settled, entries: [entry('answer', 'assistant', 'Final answer')] }));
  assert.equal(v.byId('conversation-status').firstChild, settledAnnouncement);
  assert.deepEqual(v.sent, []); assert.deepEqual(v.persisted, []);
});

test('a changed mode is announced without repeating during content updates', () => {
  const v = loadView();
  v.render(snapshot({ learning: { revision: 1, preferences: { mode: 'guided' } } }));
  const learning = { revision: 2, preferences: { mode: 'paused' } };
  v.render(snapshot({ revision: 2, learning }));
  assert.equal(v.byId('conversation-status').textContent, 'Guided learning paused.');
  const announcement = v.byId('conversation-status').firstChild;
  v.render(snapshot({ revision: 3, learning, entries: [entry('answer', 'assistant', 'New content')] }));
  assert.equal(v.byId('conversation-status').firstChild, announcement);
});

for (const [status, expected] of [['ready', /Staged.*not applied.*Run/], ['applied', /Applied.*Run.*correctness/], ['stale', /Stale.*fresh preparation scope/], ['failed', /not confirmed as applied/]]) test(`proposal outcome ${status} does not manufacture execution evidence`, () => {
  const v = loadView(); v.render(snapshot({ entries: [entry('p', 'proposal', 'Provider prose', { status, data: { targetUri: 'file:///a/main.kf' } })] }));
  assert.match(v.byId('timeline').textContent, expected);
  assert.ok(v.byId('timeline').textContent.includes('file:///a/main.kf'));
});

for (const [code, expected] of [['learning_limit', /New conversation.*preserves.*saved conversation.*fresh active learning state/], ['invalid_checkpoint', /new request.*current context/], ['trust_unavailable', /message-only/i], ['runtime_unavailable', /message-only/i], ['missing_key', /Configure.*send.*explicitly/], ['stale_context', /current context/]]) test(`safe ${code} recovery uses host error code without granting or resending`, () => {
  const v = loadView(); v.render(snapshot({ draft: 'Next draft', entries: [entry('e', 'error', 'Safe host failure', { status: 'failed', data: { code } })] }));
  assert.match(v.byId('timeline').textContent, expected);
  assert.equal(v.byId('composer').value, 'Next draft'); assert.deepEqual(v.sent, []);
  assert.equal(v.byId('timeline').querySelectorAll('button').length, 0);
});

test('unavailable Run retains distinct source and environment unknowns with actionable message-only recovery', () => {
  const v = loadView(); v.render(snapshot({ entries: [entry('run', 'run', 'Run unavailable', { status: 'unavailable', data: { sourceUri: 'file:///a.kf', code: 'runtime_unavailable' } })] }));
  assert.match(v.byId('timeline').textContent, /Run has no completed exit result/);
  assert.match(v.byId('timeline').textContent, /Saved source: unknown\. Current editor: unknown/);
  assert.match(v.byId('timeline').textContent, /Runtime: unknown/);
  assert.match(v.byId('timeline').textContent, /Message-only learning remains available/);
});

test('settled checkpoint and queued preference change announce once without response activity', () => {
  const v = loadView(); const learning = { revision: 1, displayRevision: 0, preferences: { mode: 'guided' }, preferenceChangeQueued: false };
  v.render(snapshot({ learning }));
  v.render(snapshot({ revision: 2, learning, entries: [decision()] }));
  assert.match(v.byId('conversation-status').textContent, /Waiting for your reasoning on Loop items/);
  const writes = v.byId('conversation-status').firstChild;
  v.render(snapshot({ revision: 3, learning, entries: [decision()] })); assert.equal(v.byId('conversation-status').firstChild, writes);
  v.render(snapshot({ revision: 3, learning: { ...learning, displayRevision: 1, preferenceChangeQueued: true }, entries: [decision()] }));
  assert.match(v.byId('conversation-status').textContent, /queued.*settles/);
  assert.equal(v.byId('stop').hidden, true); assert.equal(v.byId('response-dock').getAttribute('aria-busy'), 'false');
  v.render(snapshot({ revision: 3, learning: { ...learning, displayRevision: 2, preferenceChangeQueued: false }, entries: [decision()] }));
  assert.equal(v.byId('conversation-status').textContent, 'Guided learning active.');
});


test('file context disclosure cannot collapse the checkpoint preparation target or scope', () => {
  const v = loadView(); v.render(snapshot({ entries: [decision({}, { targetLabel: 'first/main.kf' })] }));
  for (const open of [false, true]) {
    v.byId('context-selector').open = open;
    const visible = visibleText(v.byId('timeline'));
    assert.match(visible, /first\/main.kf/); assert.match(visible, /Replace only the output statement/);
    assert.match(visible, /Review.*Apply.*Run/);
  }
});
