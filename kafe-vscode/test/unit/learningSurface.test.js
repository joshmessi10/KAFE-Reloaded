const test = require('node:test');
const assert = require('node:assert/strict');
const { loadView, snapshot, entry, action } = require('../helpers/tutorViewHarness');
const checkpoint = (patch = {}) => ({ kind: 'implementation', name: 'Loop items', learnerProposalSummary: 'I would iterate once', tutorProposedAdditions: ['Use one counter'], scopeSummary: 'Replace only the output statement', tradeoffs: ['Counter state'], unresolvedChoices: [], sourceIds: ['active-file'], priorDecisionIds: ['prior'], ...patch });
const decision = (patch = {}, data = {}) => entry('decision', 'checkpoint', 'Loop items', { status: 'ready', data: { checkpoint: checkpoint(patch), summaryAttribution: 'tutor-unconfirmed', grounding: 'source-linked-proposal', targetUri: 'file:///first/main.kf', ...data }, actions: [action('help', 'discussCheckpoint'), action('skip', 'skipCheckpoint')] });

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
  assert.match(v.byId('timeline').textContent, /Unresolved choices.*preparation is unavailable/);
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

for (const [code, expected] of [['learning_limit', /New conversation.*clears.*learning state/], ['invalid_checkpoint', /new request.*current context/], ['trust_unavailable', /message-only/i], ['runtime_unavailable', /message-only/i], ['missing_key', /Configure.*send.*explicitly/], ['stale_context', /current context/]]) test(`safe ${code} recovery uses host error code without granting or resending`, () => {
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
