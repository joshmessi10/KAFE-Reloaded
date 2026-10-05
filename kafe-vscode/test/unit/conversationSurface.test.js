const assert = require('node:assert/strict');
const test = require('node:test');
const { loadView, snapshot, entry, action } = require('../helpers/tutorViewHarness');
const source = (id, path, included = true, category = 'selected-file') => ({ id, label: path, uri: `file:///workspace/${path}`, included, category });
const turn = status => ({ id: 'turn', turnGeneration: 1, submissionId: 'submission', status });
const envelope = (type, fields = {}) => ({ type, sessionId: 'session', generation: 1, ...fields });

test('included whole-file indicators distinguish duplicate names and remove only canonical optional identity', () => {
  const v = loadView(), files = [source('one', 'first/main.kf'), source('two', 'second/main.kf')];
  v.render(snapshot({ context: { revision: 4, restricted: false, activeSource: null, sources: files } }));
  const indicators = v.byId('included-context').querySelectorAll('[data-source-id]');
  assert.equal(indicators.length, 2);
  assert.match(indicators[0].textContent, /first\/main.kf/);
  const remove = indicators[1].querySelector('[data-context-command="remove"]');
  assert.match(remove.getAttribute('aria-label'), /second\/main.kf.*file:\/\/\/workspace\/second\/main.kf/);
  remove.dispatch('click');
  assert.deepEqual(v.sent.at(-1), envelope('setSourceIncluded', { sourceId: 'two', included: false, contextRevision: 4 }));
  assert.equal(indicators.length, 2); // Host projection, never optimistic authority.
});

test('many long whole-file indicators retain reachable reveal/remove controls and full accessible identity', () => {
  const v = loadView(), files = Array.from({ length: 22 }, (_, i) => source(`id:${i}`, `${'long-directory/'.repeat(12)}${i}/main.kf`));
  v.render(snapshot({ context: { revision: 5, restricted: false, activeSource: source('active-file', 'main.kf', true, 'active-file'), sources: files } }));
  const indicators = v.byId('included-context').children;
  assert.equal(indicators.length, 23);
  for (const [i, file] of files.entries()) {
    const node = indicators[i + 1], reveal = node.querySelector('[data-context-command="reveal"]'), remove = node.querySelector('[data-context-command="remove"]');
    assert.equal(reveal.hidden, false); assert.equal(remove.hidden, false);
    assert.match(reveal.getAttribute('aria-label'), new RegExp(`${i}/main.kf`));
    assert.ok(reveal.getAttribute('aria-label').includes(file.uri));
  }
  indicators[22].querySelector('[data-context-command="reveal"]').dispatch('click');
  assert.deepEqual(v.sent.at(-1), envelope('revealSource', { sourceId: 'id:21', contextRevision: 5 }));
});

test('Add context opens metadata choices without posting a read or inclusion until explicit selection', () => {
  const v = loadView(); v.render(snapshot({ context: { revision: 8, restricted: false, activeSource: null, sources: [source('optional', 'extra.kf', false)] } }));
  v.byId('add-context').dispatch('click');
  assert.equal(v.byId('context-selector').open, true); assert.deepEqual(v.sent, []);
  const choice = v.byId('context-sources').querySelector('input'); choice.checked = true; choice.dispatch('change');
  assert.deepEqual(v.sent.at(-1), envelope('setSourceIncluded', { sourceId: 'optional', included: true, contextRevision: 8 }));
});

test('restricted mode exposes no file indicators or Add context and retains message submission', () => {
  const v = loadView(); v.render(snapshot({ context: { revision: 1, restricted: true, activeSource: source('active-file', 'private.kf', true, 'active-file'), sources: [source('other', 'secret.kf')] } }));
  assert.equal(v.byId('included-context').children.length, 0); assert.equal(v.byId('add-context').hidden, true);
  assert.doesNotMatch(v.root.textContent, /private|secret/);
  const c = v.byId('composer'); c.value = 'Concept'; c.dispatch('input'); c.dispatch('keydown', { key: 'Enter' });
  assert.equal(v.sent.at(-1).type, 'submitMessage');
});

test('composer autoheight uses browser content metrics, bounds growth and preserves caret across stream and resize', () => {
  const v = loadView(); v.render(snapshot()); const c = v.byId('composer');
  c.focus(); c.value = 'one\ntwo\nthree'; c.scrollHeight = 92; c.setSelectionRange(4, 7); c.dispatch('input');
  assert.equal(c.style.height, '92px'); c.scrollHeight = 900; c.dispatch('input'); assert.equal(c.style.height, '200px');
  v.window.innerHeight = 300; v.window.dispatch('resize'); assert.equal(c.style.height, '75px');
  v.render(snapshot({ revision: 2, entries: [entry('a', 'assistant', 'Stream')] }));
  assert.equal(c.value, 'one\ntwo\nthree'); assert.equal(c.selectionStart, 4); assert.equal(c.selectionEnd, 7); assert.equal(v.document.activeElement, c);
});

test('status dock distinguishes response, local stop pending, stopped, failed and settled learner checkpoint', () => {
  const v = loadView(); v.render(snapshot({ turn: turn('responding') }));
  assert.equal(v.byId('response-dock').getAttribute('data-state'), 'responding');
  v.byId('stop').dispatch('click');
  assert.equal(v.byId('response-dock').getAttribute('data-state'), 'stopping'); assert.equal(v.byId('stop').disabled, true);
  v.render(snapshot({ revision: 2, turn: turn('cancelled') })); assert.equal(v.byId('response-dock').getAttribute('data-state'), 'stopped');
  v.render(snapshot({ revision: 3, turn: turn('failed') })); assert.equal(v.byId('response-dock').getAttribute('data-state'), 'failed');
  v.render(snapshot({ revision: 4, turn: turn('completed'), entries: [entry('decision', 'checkpoint', 'Choose', { status: 'ready', actions: [action('discuss', 'discussCheckpoint', { decisionId: 'd', teachingRevision: 1 })] })] }));
  assert.equal(v.byId('response-dock').getAttribute('data-state'), 'waiting-learner');
  assert.equal(v.byId('response-dock').getAttribute('aria-busy'), 'false'); assert.equal(v.byId('stop').hidden, true);
});

test('included context controls and disclosure remain keyed and focused during streaming', () => {
  const v = loadView(), context = { revision: 2, restricted: false, activeSource: null, sources: [source('one', 'main.kf')] };
  v.render(snapshot({ context })); const node = v.byId('included-context').children[0], remove = node.querySelector('[data-context-command="remove"]');
  remove.focus(); v.byId('context-selector').open = true;
  v.render(snapshot({ revision: 2, context, entries: [entry('stream', 'assistant', 'New')] }));
  assert.equal(v.byId('included-context').children[0], node); assert.equal(v.document.activeElement, remove); assert.equal(v.byId('context-selector').open, true);
});

test('guided learning footer delegates native preferences and paused projection never grants implementation', () => {
  const v = loadView(); v.render(snapshot({ learning: { revision: 1, preferences: { mode: 'guided' } } }));
  v.byId('guided-learning').dispatch('click'); assert.deepEqual(v.sent.at(-1), envelope('openLearningPreferences'));
  v.render(snapshot({ learning: { revision: 2, preferences: { mode: 'paused' } } }));
  assert.equal(v.byId('guided-learning').textContent, 'Learning paused'); assert.equal(v.byId('guided-learning').getAttribute('aria-pressed'), null);
  assert.equal(v.sent.length, 1);
});

test('Run surface keeps source comparisons unknown independent of zero exit and current editor changes', () => {
  const v = loadView(); v.render(snapshot({ entries: [entry('run', 'run', 'Run completed.', { data: { sourceUri: 'file:///workspace/main.kf', exitCode: 0, sourceRelationship: 'unchanged-at-observed-boundaries', currentDocumentRelationship: 'changed', exactExecutedBytes: 'unknown', correctness: 'not-established', sourceIdentity: { launch: 'a', completion: 'a', currentSaved: null }, runtimeVersion: null, knowledgePackVersion: null } })] }));
  const text = v.byId('timeline').textContent;
  assert.match(text, /Saved source: unchanged at observed boundaries/); assert.match(text, /Current editor: changed/);
  assert.match(text, /Exact executed bytes: unknown/); assert.match(text, /Correctness: not established/);
  assert.match(text, /Runtime: unknown/); assert.match(text, /Knowledge: unknown/);
});
test('revoked context metadata never returns from duplicate canonical source IDs and removed focus returns to composer', () => {
  const v = loadView(), context = { revision: 2, restricted: false, activeSource: null, sources: [source('one', 'main.kf')] };
  v.render(snapshot({ context })); const input = v.byId('context-sources').querySelector('input'); input.focus();
  v.render(snapshot({ revision: 2, context: { ...context, revision: 3, sources: [] } }));
  assert.equal(v.document.activeElement, v.byId('composer'));
  v.render(snapshot({ revision: 3, context: { ...context, revision: 4, sources: [source('duplicate', 'first.kf'), source('duplicate', 'second.kf')] } }));
  assert.equal(v.byId('included-context').children.length, 0); assert.deepEqual(v.sent, []);
});
