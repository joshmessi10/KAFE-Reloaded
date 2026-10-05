const assert = require('node:assert/strict');
const test = require('node:test');
const { isTutorMessage, dispatchTutorMessage, TutorViewProvider } = require('../../src/tutor/TutorViewProvider');
const { loadView } = require('../helpers/tutorViewHarness');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const command = (session, type, fields = {}) => ({ type, sessionId: session.snapshot().sessionId, generation: session.snapshot().generation, ...fields });
test('native source reveal resolves only included host identity and exact current metadata revision', () => {
  const s = new ConversationSession();
  s.setContext({ restricted: false, activeSource: { id: 'active-file', uri: 'file:///main.kf', label: 'main.kf', included: true, category: 'active-file' }, sources: [{ id: 'optional', uri: 'file:///extra.kf', label: 'extra.kf', included: false, category: 'selected-file' }] });
  const issued = command(s, 'revealSource', { sourceId: 'active-file', contextRevision: s.snapshot().context.revision });
  assert.equal(isTutorMessage(issued, s), true);
  for (const forged of [{ ...issued, uri: 'file:///private.kf' }, { ...issued, sourceId: 'optional' }, { ...issued, sourceId: 'unknown' }, { ...issued, contextRevision: 0 }]) assert.equal(isTutorMessage(forged, s), false);
  s.setContext({ restricted: true, activeSource: null, sources: [] }); assert.equal(isTutorMessage(issued, s), false);
});
test('native preferences route has no webview preference mutation fields', () => {
  const s = new ConversationSession(); assert.equal(isTutorMessage(command(s, 'openLearningPreferences'), s), true);
  for (const extra of [{ preferences: { mode: 'paused' } }, { command: 'kafe.runFile' }, { actionId: 'fake' }]) assert.equal(isTutorMessage(command(s, 'openLearningPreferences', extra), s), false);
});
test('source reveal fails closed for malformed context projections without throwing', () => {
  for (const context of [{ restricted: false, activeSource: null, sources: null, revision: 1 }, { restricted: false, activeSource: { id: 'active-file', included: true }, sources: [] }]) {
    const state = { sessionId: 'session', generation: 1, context };
    assert.equal(isTutorMessage({ type: 'revealSource', sessionId: 'session', generation: 1, sourceId: 'active-file', contextRevision: context.revision }, state), false);
  }
});
test('old prepare and learning messages with a live generation are rejected', () => {
  const session = new ConversationSession(), received = [];
  for (const type of ['prepareRequest', 'sendReviewed', 'reviewContext', 'useLearningGoal', 'newSession', 'reviseMilestones', 'confirmMilestones', 'recordReviewedCheck', 'showProgress', 'clearProgress', 'cancelPendingInput']) {
    assert.equal(dispatchTutorMessage(command(session, type), m => received.push(m), session), false);
  }
  assert.deepEqual(received, []);
});

test('contextual Run envelopes use only the issued anchor and immutable target through the strict bridge', () => {
  const s = new ConversationSession(), received = [];
  s.setContextRunAction({ id: 'active-file', uri: 'file:///workspace/main.kf', label: 'main.kf', category: 'active-file', included: true });
  const slot = s.snapshot().contextActions, action = slot.actions[0];
  const issued = command(s, 'invokeAction', { entryId: slot.entryId, actionId: action.id, args: action.args });
  for (const forged of [{ ...issued, entryId: 'invented' }, { ...issued, args: { targetUri: 'file:///workspace/other.kf' } },
    { ...issued, contextActions: slot }, command(s, 'runFile', { targetUri: action.args.targetUri })]) {
    assert.equal(dispatchTutorMessage(forged, m => received.push(m), s), false);
  }
  assert.equal(dispatchTutorMessage(issued, m => { s.consumeAction(m.actionId); received.push(m); }, s), true);
  assert.equal(dispatchTutorMessage(issued, m => received.push(m), s), false); assert.deepEqual(received, [issued]);
  assert.deepEqual(s.snapshot().entries, []);
});
function capability(session) {
  const entryId = session.appendEntry({ kind: 'host', status: 'ready', text: 'Review', data: {} });
  const action = session.registerAction(entryId, { type: 'retryTurn', label: 'Send', enabled: true, args: { turnId: 't1' } });
  return command(session, 'invokeAction', { entryId, actionId: action.id, args: { turnId: 't1' } });
}
function nativeFixture(session) {
  const received = [], opened = [], posted = []; let receive, disposed; let messageDisposals = 0;
  const vscode = { Uri: { joinPath: (...parts) => ({ path: parts.map(p => p.path || p).join('/') }), parse: text => ({ toString: () => text }) }, env: { openExternal: async uri => { opened.push(uri.toString()); return true; } } };
  const makeView = output => ({ webview: { cspSource: 'vscode-webview-resource:', asWebviewUri: uri => `vscode-resource:${uri.path}`, onDidReceiveMessage: listener => { receive = listener; return { dispose() { messageDisposals++; } }; }, postMessage: message => output.push(message) }, onDidDispose: listener => { disposed = listener; return { dispose() {} }; } });
  const provider = new TutorViewProvider({ vscode, extensionUri: { path: '/extension' }, conversationSession: session, onMessage: message => received.push(message) });
  const view = makeView(posted); provider.resolveWebviewView(view);
  return { provider, view, vscode, received, opened, posted, makeView, takeReceiver: () => receive, receive: message => receive(message), close: () => disposed(), messageDisposals: () => messageDisposals };
}
test('learning projection owner retains session capability authority through actual native view callback', () => {
  const s = new ConversationSession(), issued = capability(s);
  const owner = { session: s, snapshot: () => ({ ...s.snapshot(), learning: { revision: 0, preferences: { mode: 'guided' } } }), subscribe: listener => s.subscribe(() => listener(owner.snapshot())) };
  const f = nativeFixture(owner);
  assert.equal(f.receive(issued), true); assert.deepEqual(f.received, [issued]);
  assert.equal(f.posted[0].state.learning.preferences.mode, 'guided');
  f.provider.dispose();
});
test('legacy and no-session messages fail closed and cause no action', () => {
  const received = [];
  for (const type of ['startSession', 'confirmMilestones', 'sendMessage', 'setContextSourceIncluded', 'acceptProposal', 'rejectProposal', 'clearProgress', 'retryMessage', 'recordReviewedCheck', 'prepareRequest']) {
    assert.equal(isTutorMessage({ type }), false); assert.equal(dispatchTutorMessage({ type }, m => received.push(m)), false);
  }
  assert.deepEqual(received, []);
});
test('direct commands require the live session and exact argument shapes', () => {
  const s = new ConversationSession(); s.setTurn({ id: 't1', turnGeneration: 2, status: 'responding', learnerEntryId: 'l1', assistantEntryId: 'a1', submissionId: 'r1' });
  const valid = [command(s, 'setDraft', { text: 'Unsent\nmultiline' }), command(s, 'submitMessage', { submissionId: '123e4567-e89b-42d3-a456-426614174000', text: 'Question', contextRevision: 0 }), command(s, 'setSourceIncluded', { sourceId: 'optional:1', included: true, contextRevision: 0 }), command(s, 'stopTurn', { turnId: 't1', turnGeneration: 2 })];
  for (const m of valid) { assert.equal(isTutorMessage(m, s), true); for (const bad of [{ ...m, generation: m.generation + 1 }, { ...m, sessionId: 'other' }, { ...m, injected: true }]) assert.equal(isTutorMessage(bad, s), false); }
  for (const m of [null, [], {}, command(s, 'sendMessage', { text: 'bypass' }), command(s, 'setDraft', { text: 1 }), command(s, 'prepareRequest', { text: 'unreviewed' }), command(s, 'setSourceIncluded', { sourceId: '', included: true }), command(s, 'setSourceIncluded', { sourceId: 'x', included: 'true' }), command(s, 'stopTurn', { turnId: 'other', turnGeneration: 2 }), command(s, 'stopTurn', { turnId: 't1', turnGeneration: 1 }), command(s, 'newSession'), command(s, 'showProgress')]) assert.equal(isTutorMessage(m, s), false);
  s.setTurn({ ...s.snapshot().turn, status: 'cancelled', turnGeneration: 3 }); assert.equal(isTutorMessage(command(s, 'stopTurn', { turnId: 't1', turnGeneration: 3 }), s), false);
});
test('malformed session snapshots cannot authorize commands', () => {
  for (const state of [{}, { sessionId: '', generation: 1 }, { sessionId: 'live', generation: -1 }, { sessionId: 'live', generation: 1.5 }, { sessionId: 'live', generation: '1' }]) assert.equal(isTutorMessage({ type: 'setDraft', text: 'Draft', sessionId: state.sessionId, generation: state.generation }, state), false);
});
test('bridge rejects forged replayed capabilities and leaves consumption to host owner', () => {
  const s = new ConversationSession(), e = capability(s), received = [];
  for (const bad of [{ ...e, actionId: 'forged' }, { ...e, args: { turnId: 'other' } }, { ...e, args: { turnId: 't1', actionType: 'runKafe' } }, { ...e, action: { type: 'runKafe' } }]) assert.equal(dispatchTutorMessage(bad, m => received.push(m), s), false);
  assert.equal(dispatchTutorMessage(e, m => { assert.equal(s.resolveAction(m).type, 'retryTurn'); assert.equal(s.consumeAction(m.actionId), true); received.push(m); }, s), true);
  assert.deepEqual(received, [e]); assert.equal(dispatchTutorMessage(e, m => received.push(m), s), false);
});
test('only explicit validated http and https link messages can reach native external navigation', async () => {
  const s = new ConversationSession(), f = nativeFixture(s);
  for (const url of ['https://example.com/docs?a=1#x', 'http://example.com/']) { const m = command(s, 'openLink', { url }); assert.equal(isTutorMessage(m, s), true); await f.receive(m); }
  assert.deepEqual(f.opened, ['https://example.com/docs?a=1#x', 'http://example.com/']); assert.deepEqual(f.received, []);
  for (const url of ['javascript:alert(1)', 'command:kafe.runFile', 'file:///workspace/main.kf', 'data:text/html,x', '/relative', 'https://name:password@example.com', 'https://example.com\n', ' https://example.com', 'https://example.com/\u0000', 'https:\\example.com', 'https://']) { assert.equal(isTutorMessage(command(s, 'openLink', { url }), s), false, url); await f.receive(command(s, 'openLink', { url })); }
  await f.receive({ ...command(s, 'openLink', { url: 'https://example.com' }), generation: 99 }); await f.receive(command(s, 'openLink', { url: 'https://example.com', injected: true })); assert.equal(f.opened.length, 2);
});
test('both scripts are local nonce resources under the existing restrictive CSP', () => {
  const f = nativeFixture(new ConversationSession()); assert.deepEqual(f.view.webview.options.localResourceRoots, [{ path: '/extension/src/tutor' }]);
  assert.match(f.view.webview.html, /default-src 'none'/); assert.match(f.view.webview.html, /script-src 'nonce-[^']+';/);
  assert.match(f.view.webview.html, /vscode-resource:.*tutorTimeline\.js/); assert.match(f.view.webview.html, /vscode-resource:.*tutorView\.js/);
  assert.doesNotMatch(f.view.webview.html, /\{\{TIMELINE_URI\}\}|unsafe-inline|unsafe-eval/);
});
test('view recreation restores same live session draft and subscribes once without old view updates', () => {
  const s = new ConversationSession(); s.setDraft('Unsent\nsecond line'); s.setContext({ restricted: false, activeSource: null, sources: [{ id: 'optional:lesson', uri: 'file:///lesson.kf', label: 'lesson.kf', category: 'selected-file', included: true }] }); const f = nativeFixture(s);
  assert.equal(f.posted[0].state.draft, 'Unsent\nsecond line'); assert.deepEqual(f.posted[0].state.context.sources.filter(s => s.included).map(s => s.id), ['optional:lesson']);
  const id = f.posted[0].state.sessionId; f.receive(command(s, 'setDraft', { text: 'Next' })); f.receive({ type: 'clearProgress' }); assert.deepEqual(f.received, [command(s, 'setDraft', { text: 'Next' })]);
  f.close(); const count = f.posted.length; s.setDraft('Hidden\ndraft'); assert.equal(f.posted.length, count);
  const next = []; f.provider.resolveWebviewView(f.makeView(next)); assert.equal(next[0].state.sessionId, id); assert.equal(next[0].state.draft, 'Hidden\ndraft');
  const before = next.length; s.appendEntry({ kind: 'assistant', status: 'completed', text: 'Answer', data: {} }); assert.equal(next.length, before + 1); assert.equal(f.posted.length, count);
  f.provider.dispose(); s.setDraft('Disposed'); assert.equal(next.length, before + 1); assert.equal(f.messageDisposals(), 2);
});
test('nonce-safe boot projection includes the complete live display without executing embedded content', () => {
  const s = new ConversationSession(); s.setDraft('Restored draft');
  s.appendEntry({ kind: 'assistant', status: 'completed', text: '</script><script>attack()</script>', data: {} });
  const f = nativeFixture(s);
  const encoded = f.view.webview.html.match(/<script id="initial-state"[^>]*>([\s\S]*?)<\/script>/)[1];
  const v = loadView({ html: f.view.webview.html });
  assert.equal(v.byId('composer').value, 'Restored draft');
  assert.match(v.byId('timeline').textContent, /<script>attack/);
  assert.equal(v.byId('timeline').querySelector('script'), null);
  v.render({ ...s.snapshot(), revision: s.snapshot().revision - 1, draft: 'Older', entries: [] });
  assert.equal(v.byId('composer').value, 'Restored draft');
  assert.match(v.byId('timeline').textContent, /<script>attack/);
  assert.deepEqual(JSON.parse(encoded), s.snapshot());
  assert.doesNotMatch(encoded, /[<>&]/);
  assert.equal(f.view.webview.html.match(/<script>/g)?.length || 0, 0);
});

test('late messages from disposed views cause no host effect', async () => {
  const s = new ConversationSession(), f = nativeFixture(s), oldReceive = f.takeReceiver(); f.close();
  oldReceive(command(s, 'prepareRequest')); await oldReceive(command(s, 'openLink', { url: 'https://example.com' }));
  assert.deepEqual(f.received, []); assert.deepEqual(f.opened, []);
});
test('native external link errors settle without leaking or rejecting the bridge callback', async () => {
  const s = new ConversationSession(), f = nativeFixture(s);
  f.vscode.env.openExternal = () => { throw new Error('Native failure'); };
  assert.equal(await f.receive(command(s, 'openLink', { url: 'https://example.com' })), false);
});

for (const settlement of ['cancelled', 'completed']) test(`settled boot recovers after unseen actual Retry busy rejection and ${settlement}-only projection`, { timeout: 1500 }, async () => {
  const { randomUUID } = require('node:crypto');
  const { TurnController } = require('../../src/tutor/TurnController');
  const { TutorHostActions } = require('../../src/tutor/TutorHostActions');
  const { ContextComposer } = require('../../src/tutor/ContextComposer');
  const { createRequestSnapshot } = require('../../src/tutor/RequestSnapshot');
  const { ProviderError } = require('../../src/tutor/providers/ProviderError');
  const deferred = () => { let resolve; const promise = new Promise(r=>resolve=r); return { promise, resolve }; };
  const refreshed=deferred(), refreshing=deferred(), responding=deferred(), finish=deferred();
  const session=new ConversationSession(), composer=new ContextComposer({ documentReader:{}, knowledgeRetriever:{ knowledgeLineage:null, search:async()=>[] } });
  let calls=0;
  const controller=new TurnController({ session, contextComposer:composer,
    provider:{ async *stream() { if (++calls===1) throw new ProviderError('timeout'); responding.resolve(); await finish.promise; yield {type:'complete',text:'Done',toolCalls:[],finishReason:'stop'}; } },
    captureSubmission:async submission=>{ const s=session.snapshot(), c=await composer.compose({request:submission.text,history:[]}); return createRequestSnapshot({sessionId:s.sessionId,generation:s.generation,submission,runSequence:0,sources:c.snapshots,history:c.history,dependencies:c.dependencies,request:c.payload}); },
    validateSubmission:async()=>true, refreshContext:async()=>{ refreshing.resolve(); await refreshed.promise; }
  });
  const host=new TutorHostActions({session,controller}), fixture=nativeFixture(session);
  try {
    await controller.submit({submissionId:randomUUID(),text:'Original',contextRevision:0});
    assert.equal(session.snapshot().turn.status,'failed');
    const error=session.snapshot().entries.find(e=>e.kind==='error'), retry=error.actions.find(a=>a.type==='retryTurn');
    let retrying; assert.equal(dispatchTutorMessage(command(session,'invokeAction',{entryId:error.id,actionId:retry.id,args:retry.args}),m=>retrying=host.dispatch(m),session),true);
    await refreshing.promise;
    const posted=[]; fixture.provider.resolveWebviewView(fixture.makeView(posted));
    const bootHtml=fixture.provider.view.webview.html, bootTurn=session.snapshot().turn;
    refreshed.resolve(); await responding.promise;
    assert.equal(session.snapshot().turn.id,bootTurn.id); assert.ok(session.snapshot().turn.turnGeneration>bootTurn.turnGeneration);
    // Every active Retry projection was posted before the recreated scripts load.
    const v=loadView({html:bootHtml}), input=v.byId('composer'); input.value='Next'; input.dispatch('input'); input.dispatch('keydown',{key:'Enter'});
    const emitted=v.sent.find(m=>m.type==='submitMessage'); assert.notEqual(emitted.submissionId,session.snapshot().turn.submissionId);
    let rejection;
    for(const message of v.sent) assert.equal(dispatchTutorMessage(message,m=>{ if(m.type==='setDraft') session.setDraft(m.text); else rejection=controller.submit(m); },session),true);
    assert.equal((await rejection).status,'stale');
    input.value='Different'; input.dispatch('input'); input.value='Next'; input.dispatch('input');
    const count=v.sent.filter(m=>m.type==='submitMessage').length;
    if(settlement==='cancelled') { const owner=session.snapshot().turn; controller.stop({turnId:owner.id,turnGeneration:owner.turnGeneration}); }
    finish.resolve(); await retrying;
    assert.equal(session.snapshot().turn.status,settlement);
    v.render(session.snapshot()); // Only settlement reaches the new listener.
    assert.equal(input.value,'Next'); assert.equal(v.byId('send').disabled,false);
    assert.equal(v.sent.filter(m=>m.type==='submitMessage').length,count); assert.equal(calls,2);
    input.dispatch('keydown',{key:'Enter'}); const newSubmit=v.sent.at(-1); assert.equal(newSubmit.type,'submitMessage'); assert.notEqual(newSubmit.submissionId,emitted.submissionId);
  } finally { finish.resolve(); refreshed.resolve(); fixture.provider.dispose(); host.dispose(); controller.dispose(); }
});
