const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');

function createSession() {
  // Loading inside the test makes the absent API an explicit test failure in RED.
  const { ConversationSession } = require('../../src/tutor/ConversationSession');
  return new ConversationSession();
}

test('removed learning and review capabilities cannot be registered', () => {
  const session = createSession();
  const id = session.appendEntry({ kind: 'host', status: 'completed', text: 'Legacy' });
  for (const type of ['sendReviewed', 'reviewContext', 'useLearningGoal', 'newSession', 'reviseMilestones', 'confirmMilestones', 'recordReviewedCheck', 'showProgress', 'clearProgress', 'confirmClearProgress', 'cancelPendingInput']) {
    assert.throws(() => session.registerAction(id, { type, label: type, enabled: true, args: {} }), /action/i);
  }
  assert.deepEqual(session.snapshot().entries[0].actions, []);
});

test('contextual Run projection uses the registry without transcript entries or context/draft revision changes', () => {
  const s = createSession(), before = s.snapshot();
  const source = uri => ({ id: 'active-file', uri, label: uri.split('/').at(-1), category: 'active-file', included: true });
  s.setContextRunAction(source('file:///workspace/a.kf'));
  const first = s.snapshot(), action = first.contextActions.actions[0];
  const envelope = { type: 'invokeAction', sessionId: first.sessionId, generation: first.generation,
    entryId: first.contextActions.entryId, actionId: action.id, args: { targetUri: 'file:///workspace/a.kf' } };
  assert.equal(first.context.revision, before.context.revision); assert.equal(first.inputRevision, before.inputRevision);
  assert.deepEqual(first.entries, []); assert.ok(s.resolveAction(envelope));
  first.contextActions.actions[0].args.targetUri = 'file:///forged.kf'; assert.ok(s.resolveAction(envelope));
  s.setContextRunAction(source('file:///workspace/b.kf'));
  assert.ok(s.resolveAction(envelope), 'focus does not silently replace an issued target');
  assert.equal(s.snapshot().contextActions.actions[0].args.targetUri, 'file:///workspace/b.kf');
  s.invalidateActions(a => a.type === 'runFile' && a.args.targetUri === 'file:///workspace/a.kf');
  assert.equal(s.resolveAction(envelope), null, 'revocation includes previously displayed anchors');
  const current = s.snapshot(); s.reset();
  assert.notEqual(s.snapshot().contextActions.entryId, current.contextActions.entryId);
  assert.deepEqual(s.snapshot().contextActions.actions, []);
});

function registeredEnvelope(session, type = 'retryTurn', args = { turnId: 'turn-1' }) {
  const entryId = session.appendEntry({ kind: 'host', status: 'ready', text: 'Retry', data: {} });
  const action = session.registerAction(entryId, { type, label: 'Send', enabled: true, args });
  const { sessionId, generation } = session.snapshot();
  return { type: 'invokeAction', sessionId, generation, entryId, actionId: action.id, args: structuredClone(args) };
}

test('live draft, selections and entry IDs survive detached snapshots and independent revisions', () => {
  const session = createSession();
  const initial = session.snapshot();
  session.setDraft('First line\nUnsent second line');
  session.setContext({ restricted: false, activeSource: null, sources: [{ id: 'optional:a', uri: 'file:///a.kf', category: 'selected-file', label: 'a.kf', included: true }] });
  const data = { target: { label: 'lesson.kf' } };
  const id = session.appendEntry({ kind: 'host', status: 'ready', text: 'Ready', data, actions: [{ id: 'forged' }] });
  data.target.label = 'changed by caller';
  const snapshot = session.snapshot();
  assert.equal(snapshot.sessionId, initial.sessionId);
  assert.equal(snapshot.generation, initial.generation);
  assert.equal(snapshot.inputRevision, initial.inputRevision + 1);
  assert.equal(snapshot.entries[0].id, id);
  assert.equal(snapshot.entries[0].data.target.label, 'lesson.kf');
  assert.deepEqual(snapshot.entries[0].actions, []);
  snapshot.entries[0].data.target.label = 'changed by renderer';
  snapshot.context.sources[0].included = false;
  snapshot.draft = '';
  assert.equal(session.snapshot().draft, 'First line\nUnsent second line');
  assert.deepEqual(session.snapshot().context.sources.filter(s => s.included).map(s => s.id), ['optional:a']);
  assert.equal(session.snapshot().entries[0].data.target.label, 'lesson.kf');
  session.updateEntry(id, { text: 'Updated', id: 'forged', actions: [{ id: 'forged' }] });
  assert.equal(session.snapshot().entries[0].id, id);
  assert.deepEqual(session.snapshot().entries[0].actions, []);
  assert.equal(session.snapshot().inputRevision, snapshot.inputRevision);
  assert.ok(session.snapshot().revision > snapshot.revision);
  assert.equal(session.updateEntry('missing', { text: 'ignored' }), false);
  const unchanged = session.snapshot().revision;
  session.setDraft('First line\nUnsent second line');
  session.setSelectedSources(['optional:a', 'optional:a']);
  assert.equal(session.snapshot().revision, unchanged);
});

test('subscriptions receive isolated snapshots and unsubscribe stops delivery', () => {
  const session = createSession();
  const observed = [];
  const unsubscribe = session.subscribe(snapshot => { observed.push(snapshot); snapshot.draft = 'listener mutation'; });
  const second = [];
  session.subscribe(snapshot => second.push(snapshot.draft));
  session.setDraft('One');
  unsubscribe();
  unsubscribe();
  session.setDraft('Two');
  assert.equal(observed.length, 1);
  assert.deepEqual(second, ['One', 'Two']);
  assert.equal(session.snapshot().draft, 'Two');
});

test('actions reject forged IDs, wrong identity, altered arguments and consumed replay', () => {
  const session = createSession();
  const envelope = registeredEnvelope(session);
  const action = session.resolveAction(envelope);
  assert.equal(action.type, 'retryTurn');
  action.args.turnId = 'caller mutation';
  for (const patch of [
    { sessionId: 'other' }, { generation: envelope.generation + 1 }, { entryId: 'other' },
    { actionId: 'forged' }, { args: { turnId: 'other' } }, { args: { turnId: 'review-1', uri: 'forged' } },
    { args: [] }, { extra: true }, { type: 'acceptProposal' },
  ]) assert.equal(session.resolveAction({ ...envelope, ...patch }), null);
  assert.ok(session.resolveAction(envelope));
  assert.equal(session.consumeAction(envelope.actionId), true);
  assert.equal(session.consumeAction(envelope.actionId), false);
  assert.equal(session.resolveAction(envelope), null);
  assert.equal(session.snapshot().entries[0].actions[0].enabled, false);
});

test('reset and replay cannot resolve old capabilities or old completed history', () => {
  const session = createSession();
  const old = registeredEnvelope(session);
  session.setDraft('unsent');
  session.setContext({ restricted: false, activeSource: null, sources: [{ id: 'optional:a', uri: 'file:///a.kf', category: 'selected-file', label: 'a.kf', included: true }] });
  session.recordCompletedPair({ id: 'pair-1', learnerText: 'Question', assistantText: 'Answer',
    dependencies: { fileUris: ['file:///lesson.kf'], knowledgeLineage: 'pack-1' } });
  assert.ok(session.resolveAction(old));
  session.consumeAction(old.actionId);
  assert.equal(session.resolveAction(old), null);
  session.reset();
  const snapshot = session.snapshot();
  assert.equal(snapshot.sessionId, old.sessionId);
  assert.equal(snapshot.generation, old.generation + 1);
  assert.equal(snapshot.draft, '');
  assert.deepEqual(snapshot.context.sources.filter(s => s.included).map(s => s.id), []);
  assert.deepEqual(snapshot.entries, []);
  assert.equal(snapshot.turn, null);
  assert.deepEqual(session.historyPairs(), []);
  assert.equal(session.resolveAction(old), null);
  assert.notEqual(registeredEnvelope(session).actionId, old.actionId);
});

test('host applicability changes disable matching capabilities and require fresh registration', () => {
  const session = createSession();
  const review = registeredEnvelope(session);
  const run = registeredEnvelope(session, 'openTerminal', { runSequence: 4 });
  session.invalidateActions((action, entry) => {
    entry.text = 'predicate cannot edit session';
    return action.type === 'retryTurn';
  });
  assert.equal(session.resolveAction(review), null);
  assert.ok(session.resolveAction(run));
  assert.equal(session.snapshot().entries[0].text, 'Retry');
  const replacement = session.registerAction(review.entryId,
    { type: 'retryTurn', label: 'Send updated review', enabled: true, args: { turnId: 'review-2' } });
  assert.notEqual(replacement.id, review.actionId);
  replacement.args.turnId = 'mutated';
  assert.equal(session.snapshot().entries[0].actions[1].args.turnId, 'review-2');
  assert.throws(() => session.registerAction('missing', { type: 'run', label: 'Run', enabled: true, args: {} }));
});

test('turn cancellation fences turn state without invalidating unrelated run capabilities', () => {
  const session = createSession();
  const run = registeredEnvelope(session, 'openTerminal', { runSequence: 4 });
  const turn = { id: 'turn-1', turnGeneration: 1, status: 'responding', learnerEntryId: 'learner-1',
    assistantEntryId: 'assistant-1', submissionId: 'submission-1' };
  session.setTurn(turn);
  turn.status = 'failed';
  assert.equal(session.snapshot().turn.status, 'responding');
  session.setTurn({ ...turn, status: 'cancelled', turnGeneration: 2 });
  assert.equal(session.snapshot().generation, run.generation);
  assert.ok(session.resolveAction(run));
  session.setTurn(null);
  assert.equal(session.snapshot().turn, null);
});

test('completed history remains separate from display snapshots and caller mutations', () => {
  const session = createSession();
  const pair = { id: 'pair-1', learnerText: 'Question', assistantText: 'Answer',
    dependencies: { fileUris: ['file:///private.kf'], knowledgeLineage: 'private-pack' } };
  session.recordCompletedPair(pair);
  pair.dependencies.fileUris.push('file:///forged.kf');
  const pairs = session.historyPairs();
  pairs[0].learnerText = 'changed';
  assert.equal(session.historyPairs()[0].learnerText, 'Question');
  assert.deepEqual(session.historyPairs()[0].dependencies.fileUris, ['file:///private.kf']);
  assert.deepEqual(Object.keys(session.snapshot()).sort(),
    ['sessionId', 'generation', 'revision', 'draft', 'inputRevision', 'context', 'contextActions', 'entries', 'turn'].sort());
  assert.equal(JSON.stringify(session.snapshot()).includes('private'), false);
});

test('display data and capability arguments reject raw exceptions and non-JSON objects safely', () => {
  const session = createSession();
  const cycle = {}; cycle.self = cycle;
  for (const data of [{ error: new Error('Private transport payload') }, { nested: cycle },
    { callback() {} }, { missing: undefined }, { raw: 1n }, { bytes: Buffer.from('private') },
    { timestamp: new Date() }, { number: Infinity }]) {
    assert.throws(() => session.appendEntry({ kind: 'error', status: 'failed', text: 'Safe message', data }),
      error => error instanceof TypeError && error.message === 'Invalid entry display data');
    assert.deepEqual(session.snapshot().entries, []);
  }
  const id = session.appendEntry({ kind: 'host', status: 'ready', text: 'Safe', data: { descriptor: ['label', null, 4, true] } });
  assert.throws(() => session.updateEntry(id, { text: 'Changed', data: { exception: new Error('Private') } }));
  assert.equal(session.snapshot().entries[0].text, 'Safe');
  assert.throws(() => session.registerAction(id, { type: 'runFile', label: 'Run', enabled: true, args: { cycle } }),
    error => error instanceof TypeError && error.message === 'Invalid action arguments');
  assert.deepEqual(session.snapshot().entries[0].actions, []);
});

test('live session operations do not write files or persistent state', t => {
  for (const name of ['writeFileSync', 'writeFile', 'appendFileSync', 'appendFile']) {
    t.mock.method(fs, name, () => { throw new Error('Disk write prohibited'); });
  }
  t.mock.method(fs.promises, 'writeFile', () => { throw new Error('Disk write prohibited'); });
  const session = createSession();
  session.setDraft('Private multiline\ndraft');
  session.setContext({ restricted: false, activeSource: null, sources: [{ id: 'optional:a', uri: 'file:///a.kf', category: 'selected-file', label: 'a.kf', included: true }] });
  const envelope = registeredEnvelope(session);
  session.consumeAction(envelope.actionId);
  session.reset();
  assert.equal(session.snapshot().draft, '');
});
