const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { ToolRouter, selectedSourceId } = require('../../src/tutor/ToolRouter');
const { TutorHostActions } = require('../../src/tutor/TutorHostActions');
const { ProviderError } = require('../../src/tutor/providers/ProviderError');
const uri = path => ({ scheme: 'file', toString: () => `file://${path}` });
const done = (calls = [], text = 'Explanation') => ({ type: 'complete', text, toolCalls: calls, finishReason: calls.length ? 'tool_calls' : 'stop' });
const checkpoint = (kind = 'implementation', patch = {}) => ({ id: 'checkpoint', name: 'proposeLearningCheckpoint', arguments: { kind, name: 'Print items', learnerProposalSummary: 'Learner proposal', tutorProposedAdditions: [], scopeSummary: 'Replace the print statement with a loop', tradeoffs: [], unresolvedChoices: [], sourceIds: kind === 'implementation' ? ['active-file'] : [], ...patch } });
const proposal = (sourceId, id = 'proposal') => ({ id, name: 'proposeCodeChange', arguments: { newText: 'show(2)', ...(sourceId ? { sourceId } : {}) } });
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
function fixture(options = {}) {
  let document = { uri: uri('/a.kf'), text: 'show(1)', version: 1 }, revision = 0, calls = 0, stages = 0;
  let context = { activeDocument: document, candidateUris: [], restricted: false };
  const session = new ConversationSession();
  const retriever = { getKnowledgeLineage: async () => null, search: async () => [] };
  const composer = new ContextComposer({ documentReader: { validateUri: async () => true, readDocument: async u => options.read?.(u) || { ...document, uri: u } }, knowledgeRetriever: retriever });
  const sent = [];
  const provider = { async *stream(input) { sent.push(input.request); calls++; yield* options.events?.(calls, input) || [done(calls === 1 ? [checkpoint(options.kind)] : [proposal()])]; } };
  const proposalProvider = { pending: null, stage(p, guard = {}) { if (options.stageFailure) throw Error('failed'); assert.equal(guard.isCurrent?.() ?? true, true); stages++; this.pending = { ...p, sourceId: p.uri, id: `native-${stages}` }; return { id: this.pending.id }; }, clear(id) { if (!id || this.pending?.id === id) this.pending = null; }, async open() { this.pending.reviewed = true; return { status: 'opened' }; } };
  const coordinator = new SessionCoordinator({ session, provider, contextComposer: composer, toolRouter: new ToolRouter({ knowledgeRetriever: retriever }), proposalProvider, getContext: () => context, getSourceRevision: () => revision });
  const actions = new TutorHostActions({ session, controller: coordinator.controller, coordinator, proposalProvider, authorizeRunTarget: () => true, configureProvider: async () => ({ status: 'completed' }) });
  const submit = (text = 'Help') => actions.submitMessage({ submissionId: randomUUID(), text, contextRevision: session.snapshot().context.revision });
  const envelope = type => { const state = session.snapshot(); const entry = state.entries.findLast(e => e.actions.some(a => a.type === type && a.enabled)); assert.ok(entry, `Missing ${type}`); const a = entry.actions.find(a => a.type === type && a.enabled); return { type: 'invokeAction', sessionId: state.sessionId, generation: state.generation, entryId: entry.id, actionId: a.id, args: a.args }; };
  return { session, coordinator, actions, proposalProvider, sent, submit, envelope, get calls() { return calls; }, get stages() { return stages; }, change() { document = { ...document, text: 'show(3)', version: 2 }; context.activeDocument = document; revision++; }, context(value) { context = value; revision++; }, async start() { await coordinator.refreshContext(); return submit(); } };
}
test('adoption host disposition survives preparation and later source invalidation in rendered history', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const f = fixture(); await f.start(); await f.actions.dispatch(f.envelope('implementCheckpoint'));
  const adopted = f.session.snapshot().entries.find(e => e.kind === 'checkpoint');
  assert.equal(adopted.data.disposition, 'confirmed'); assert.equal(adopted.data.summaryAttribution, 'tutor-unconfirmed');
  assert.equal(f.session.snapshot().entries.find(e => e.kind === 'proposal').data.scopeSummary, 'Replace the print statement with a loop');
  f.change(); await f.coordinator.refreshContext();
  const view = loadView(); view.render(f.coordinator.snapshot());
  assert.match(view.byId('timeline').textContent, /Adopted\. Stale/);
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'confirmed');
});
test('queued native preferences project without changing admitted teaching revision and relabel checkpoint after settlement', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const entered = deferred(), release = deferred();
  const f = fixture({ events: async function* (n) { if (n === 1) yield done([checkpoint()]); else { entered.resolve(); await release.promise; yield done(); } } });
  await f.start(); const view = loadView(); view.render(f.coordinator.snapshot());
  const original = f.envelope('implementCheckpoint');
  const sending = f.submit('Direct concept'); await entered.promise;
  const admitted = f.coordinator.controller.current.snapshot.learning.revision;
  const before = f.coordinator.snapshot();
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } });
  const queued = f.coordinator.snapshot(); view.render(queued);
  assert.equal(queued.learning.preferenceChangeQueued, true);
  assert.equal(queued.learning.revision, admitted); assert.equal(queued.revision, before.revision);
  assert.match(view.byId('learning-state').textContent, /queued/);
  release.resolve(); await sending; const settled = f.coordinator.snapshot(); view.render(settled);
  assert.equal(settled.learning.preferenceChangeQueued, false); assert.equal(settled.learning.preferences.mode, 'paused');
  assert.equal(settled.entries.find(e => e.kind === 'checkpoint').actions.find(a => a.enabled && a.type === 'implementCheckpoint').label, 'Prepare change');
  assert.ok(f.session.resolveAction(original), 'preference presentation never reissues or consumes authority');
  assert.equal(f.stages, 0); assert.equal(f.calls, 2);
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'guided' } });
  assert.equal(f.coordinator.snapshot().entries.find(e => e.kind === 'checkpoint').actions.find(a => a.enabled && a.type === 'implementCheckpoint').label, 'Implement this step');
  assert.ok(f.session.resolveAction(original));
});

test('decision exhaustion retains every decision and pending action, shows recoverable limit without automatic retry', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const f = fixture({ events: async function* () { yield done([checkpoint('design')]); } }); await f.start();
  const pending = f.envelope('confirmCheckpoint');
  const stored = f.coordinator.learningSession.snapshot().decisions[0].checkpoint;
  for (let index = 0; index < 31; index++) f.coordinator.learningSession.addDecision({ ...stored, name: `Retained ${index}` }, { files: [], knowledgeLineage: null });
  const before = f.coordinator.learningSession.snapshot().decisions;
  f.session.setDraft('Unsent reasoning'); await f.submit('Another checkpoint');
  assert.deepEqual(f.coordinator.learningSession.snapshot().decisions, before);
  assert.ok(f.session.resolveAction(pending)); assert.equal(f.calls, 2); assert.equal(f.stages, 0);
  const view = loadView(); view.render(f.coordinator.snapshot());
  assert.match(view.byId('timeline').textContent, /learning-state limit.*checkpoint was not added/);
  assert.match(view.byId('timeline').textContent, /New conversation.*clears/);
  assert.equal(view.byId('composer').value, 'Unsent reasoning'); assert.equal(view.byId('stop').hidden, true);
});

test('stopped partial learner response and independent next draft survive recreation without late checkpoint authority', async () => {
  const { loadView } = require('../helpers/tutorViewHarness'); const entered = deferred(), release = deferred();
  const f = fixture({ events: async function* () { yield { type: 'text', text: 'Partial explanation' }; entered.resolve(); await release.promise; yield done([checkpoint()], 'Late completion'); } });
  await f.coordinator.refreshContext(); const sending = f.submit('Explain'); await entered.promise;
  f.session.setDraft('My next reasoning'); const view = loadView(); view.render(f.coordinator.snapshot()); view.byId('stop').dispatch('click');
  const stop = view.sent.at(-1); assert.equal(f.coordinator.controller.stop(stop), true); release.resolve(); await sending;
  view.render(f.coordinator.snapshot()); assert.match(view.byId('timeline').textContent, /Partial explanation/);
  assert.doesNotMatch(view.byId('timeline').textContent, /Late completion/); assert.equal(view.byId('composer').value, 'My next reasoning');
  assert.equal(view.byId('response-dock').getAttribute('data-state'), 'stopped'); assert.equal(view.byId('stop').hidden, true);
  assert.equal(f.coordinator.learningSession.snapshot().decisions.length, 0); assert.equal(f.stages, 0);
  const recreated = loadView(); recreated.render(f.coordinator.snapshot()); assert.match(recreated.byId('timeline').textContent, /Partial explanation/);
  assert.equal(recreated.byId('composer').value, 'My next reasoning'); assert.deepEqual(recreated.persisted, []);
});

test('missing-key preparation keeps exact retry scope and draft after configuration with no automatic resend', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const f = fixture({ events: async function* (n) { if (n === 1) yield done([checkpoint()]); else throw new ProviderError('missing_key'); } });
  await f.start(); f.session.setDraft('Next draft'); await f.actions.dispatch(f.envelope('implementCheckpoint'));
  const scope = f.envelope('prepareChange'), view = loadView(); view.render(f.coordinator.snapshot());
  assert.match(view.byId('timeline').textContent, /Configuration does not resend/);
  assert.ok(view.byId('timeline').textContent.includes(scope.args.scopeSummary)); assert.ok(view.byId('timeline').textContent.includes(scope.args.targetUri));
  await f.actions.dispatch(f.envelope('configureProviderKey')); assert.equal(f.calls, 2); assert.equal(f.stages, 0); assert.ok(f.session.resolveAction(scope));
  view.render(f.coordinator.snapshot()); assert.equal(view.byId('composer').value, 'Next draft'); assert.equal(view.byId('stop').hidden, true);
});
test('learning confirmation limit retains pending decision and draft with recoverable settled presentation', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const f = fixture({ kind: 'design' }); await f.start(); f.session.setDraft('Next reasoning');
  f.coordinator.learningSession.confirmDecision = () => { throw new RangeError('limit'); };
  assert.equal((await f.actions.dispatch(f.envelope('confirmCheckpoint'))).code, 'learning_limit');
  const view = loadView(); view.render(f.coordinator.snapshot());
  assert.match(view.byId('timeline').textContent, /New conversation.*clears/);
  assert.equal(view.byId('composer').value, 'Next reasoning'); assert.equal(view.byId('stop').hidden, true);
  assert.equal(f.coordinator.learningSession.snapshot().decisions.length, 1);
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'proposed');
  assert.equal(f.calls, 1); assert.equal(f.stages, 0);
});
test('implementation click confirms displayed adoption and prepares once while retaining draft and separate native authority', async () => {
  const f = fixture(); await f.start(); f.session.setDraft('Unsent reasoning');
  const click = f.envelope('implementCheckpoint');
  assert.equal((await f.actions.dispatch(click)).status, 'completed');
  assert.equal((await f.actions.dispatch(click)).status, 'stale');
  assert.equal(f.stages, 1); assert.equal(f.calls, 2); assert.equal(f.session.snapshot().draft, 'Unsent reasoning');
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'confirmed');
  assert.ok(f.sent[1].messages.some(m => m.content?.includes('confirmed')));
  const native = f.session.snapshot().entries.find(e => e.kind === 'proposal');
  assert.deepEqual(native.actions.filter(a => a.enabled).map(a => a.type).sort(), ['rejectProposal', 'reviewProposal']);
  assert.equal(f.proposalProvider.pending.reviewed, undefined);
});
test('busy checkpoint click remains usable and cannot mutate admitted learning revision', async () => {
  const entered = deferred(), release = deferred();
  const f = fixture({ kind: 'design', events: async function* (n) { if (n === 1) yield done([checkpoint('design')]); else { entered.resolve(); await release.promise; yield done(); } } });
  await f.start(); const click = f.envelope('confirmCheckpoint'), learning = f.coordinator.learningSession.snapshot();
  const sending = f.submit('Ordinary dialogue'); await entered.promise;
  assert.equal((await f.actions.dispatch(click)).status, 'busy');
  assert.deepEqual(f.coordinator.learningSession.snapshot(), learning); assert.ok(f.session.resolveAction(click));
  release.resolve(); await sending; assert.equal((await f.actions.dispatch(click)).status, 'completed'); assert.equal(f.stages, 0);
});
for (const type of ['confirmCheckpoint', 'discussCheckpoint', 'skipCheckpoint']) test(`${type} grants no code preparation`, async () => {
  const f = fixture({ kind: 'design', events: async function* (n) { yield n === 1 ? done([checkpoint('design')]) : done(); } });
  await f.start(); const before = f.coordinator.learningSession.snapshot(); await f.actions.dispatch(f.envelope(type));
  assert.equal(f.stages, 0); assert.equal(f.calls, 2);
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, type === 'confirmCheckpoint' ? 'confirmed' : 'proposed');
  if (type !== 'confirmCheckpoint') assert.deepEqual(f.coordinator.learningSession.snapshot(), before);
});
test('stale target rejects retained capability before consumption or adoption', async () => {
  const f = fixture(); await f.start(); const click = f.envelope('implementCheckpoint'); f.change();
  assert.equal((await f.actions.dispatch(click)).status, 'stale'); assert.equal(f.stages, 0); assert.equal(f.calls, 1);
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'proposed');
});
test('concurrent checkpoint clicks reserve before awaited source revalidation', async () => {
  const f = fixture(); await f.start(); const click = f.envelope('implementCheckpoint');
  const first = f.actions.dispatch(click), second = await f.actions.dispatch(click);
  assert.equal(second.status, 'busy'); assert.equal((await first).status, 'completed'); assert.equal(f.stages, 1);
});
test('ordinary prose cannot prepare code; direct request exposes visible bounded fresh scope', async () => {
  const f = fixture({ events: async function* () { yield done([proposal()]); } }); await f.start();
  assert.equal(f.stages, 0); assert.equal(f.session.snapshot().entries.find(e => e.kind === 'error').data.code, 'preparation_required');
  const click = f.envelope('prepareChange'); const entry = f.session.snapshot().entries.find(e => e.id === click.entryId);
  assert.match(entry.data.scopeSummary, /one code change/); assert.equal(entry.data.targetUri, 'file:///a.kf');
  assert.match(entry.data.scopeSummary, /Help/);
  assert.equal((await f.actions.dispatch(click)).status, 'completed'); assert.equal(f.stages, 1);
});
for (const failure of ['missing_key', 'timeout', 'stage']) test(`${failure} preparation retry requires new visible scope authorization`, async () => {
  const f = fixture({ stageFailure: failure === 'stage', events: async function* (n) { if (n === 1) yield done([checkpoint()]); else if (failure !== 'stage') throw new ProviderError(failure); else yield done([proposal()]); } });
  await f.start(); await f.actions.dispatch(f.envelope('implementCheckpoint'));
  assert.equal(f.stages, 0); assert.equal(f.calls, 2);
  const scope = f.envelope('prepareChange'); assert.equal(scope.args.scopeSummary, 'Replace the print statement with a loop');
  assert.equal((await f.coordinator.controller.retry(f.session.snapshot().turn.id)).code, 'preparation_required');
  if (failure === 'missing_key') { await f.actions.dispatch(f.envelope('configureProviderKey')); assert.equal(f.calls, 2); assert.ok(f.session.resolveAction(scope)); }
});
test('two proposals in one granted response stage nothing', async () => {
  const f = fixture({ events: async function* (n) { yield n === 1 ? done([checkpoint()]) : done([proposal(undefined, 'a'), proposal(undefined, 'b')]); } });
  await f.start(); await f.actions.dispatch(f.envelope('implementCheckpoint')); assert.equal(f.stages, 0); assert.equal(f.proposalProvider.pending, null);
});
test('paused mode projects Prepare change and restricted/fileless context never projects preparation', async () => {
  const f = fixture(); f.coordinator.learningSession.setPreferences({ mode: 'paused' }); await f.start();
  const entry = f.session.snapshot().entries.find(e => e.kind === 'checkpoint'); assert.equal(entry.actions.find(a => a.type === 'implementCheckpoint').label, 'Prepare change');
  const r = fixture({ kind: 'design' }); r.context({ restricted: true }); await r.start();
  assert.equal(r.session.snapshot().entries.some(e => e.actions.some(a => ['implementCheckpoint', 'prepareChange'].includes(a.type) && a.enabled)), false);
});
test('checkpoint scope is rendered with real action envelopes and composer draft remains intact', async () => {
  const { loadView } = require('../helpers/tutorViewHarness');
  const f = fixture(); await f.start(); f.session.setDraft('Typed reasoning'); const view = loadView();
  view.render(f.session.snapshot()); const timeline = view.byId('timeline');
  assert.match(timeline.textContent, /Replace the print statement with a loop/);
  const button = timeline.querySelector('[data-action-type="implementCheckpoint"]'); assert.ok(button); button.dispatch('click');
  const sent = view.sent.find(message => message.type === 'invokeAction'); assert.ok(sent); assert.ok(f.session.resolveAction(sent));
  await f.actions.dispatch(sent); assert.equal(f.session.snapshot().draft, 'Typed reasoning');
});
test('Stop revokes preparation and retries only with fresh scope confirmation', async () => {
  const entered = deferred(), release = deferred();
  const f = fixture({ events: async function* (n) { if (n === 1) yield done([checkpoint()]); else { entered.resolve(); await release.promise; yield done([proposal()]); } } });
  await f.start(); const preparing = f.actions.dispatch(f.envelope('implementCheckpoint')); await entered.promise;
  assert.equal((await f.actions.dispatch(f.envelope('stopTurn'))).status, 'cancelled');
  await preparing; release.resolve(); assert.equal(f.stages, 0); assert.equal(f.coordinator.controller.current.grant, null);
  assert.ok(f.envelope('prepareChange')); assert.equal((await f.coordinator.controller.retry(f.session.snapshot().turn.id)).code, 'preparation_required');
});
test('wrong target cannot consume a grant for another included document', async () => {
  const other = uri('/b.kf');
  const f = fixture({ events: async function* (n) { yield n === 1 ? done([checkpoint()]) : done([proposal(selectedSourceId(other))]); } });
  f.context({ activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 1 }, candidateUris: [other] });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(other), included: true, contextRevision: f.session.snapshot().context.revision });
  await f.submit(); await f.actions.dispatch(f.envelope('implementCheckpoint')); assert.equal(f.stages, 0); assert.equal(f.coordinator.controller.current.grant, null);
});
test('source change during granted provider response prevents staging and revokes grant', async () => {
  const entered = deferred(), release = deferred();
  const f = fixture({ events: async function* (n) { if (n === 1) yield done([checkpoint()]); else { entered.resolve(); await release.promise; yield done([proposal()]); } } });
  await f.start(); const preparing = f.actions.dispatch(f.envelope('implementCheckpoint')); await entered.promise; f.change(); release.resolve();
  assert.equal((await preparing).status, 'stale'); assert.equal(f.stages, 0); assert.equal(f.coordinator.controller.current.grant, null);
});
test('reset during action consumption prevents adoption and leaves new session inert', async () => {
  const f = fixture(); await f.start(); const click = f.envelope('implementCheckpoint'); let reset = false;
  f.session.subscribe(() => { if (!reset && !f.session.resolveAction(click)) { reset = true; f.coordinator.newConversation(); } });
  assert.equal((await f.actions.dispatch(click)).status, 'cancelled'); assert.equal(f.stages, 0); assert.equal(f.calls, 1);
  assert.deepEqual(f.coordinator.learningSession.snapshot().decisions, []); assert.equal(f.coordinator.controller.current, null); assert.equal(f.session.snapshot().turn, null);
});
test('queued preferences do not mutate revision during reserved asynchronous action validation', async () => {
  const f = fixture(); await f.start(); const click = f.envelope('implementCheckpoint');
  const before = f.coordinator.learningSession.snapshot().revision; const preparing = f.actions.dispatch(click);
  assert.equal((await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } })).status, 'queued');
  assert.equal(f.coordinator.learningSession.snapshot().revision, before); await preparing;
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'paused');
});
test('rejected action reservation settles queued preferences without a provider resend', async () => {
  const f = fixture(); await f.start(); const preparing = f.actions.dispatch(f.envelope('implementCheckpoint'));
  await f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { mode: 'paused' } }); f.change();
  assert.equal((await preparing).status, 'stale'); assert.equal(f.calls, 1);
  assert.equal(f.coordinator.learningSession.snapshot().preferences.mode, 'paused');
});
test('implementation with no displayed scope or unresolved choices offers dialogue only', async () => {
  for (const patch of [{ scopeSummary: '' }, { unresolvedChoices: ['Choose bounds'] }]) {
    const f = fixture({ events: async function* () { yield done([checkpoint('implementation', patch)]); } }); await f.start();
    const entry = f.session.snapshot().entries.find(e => e.kind === 'checkpoint');
    assert.equal(entry.actions.some(a => a.type === 'implementCheckpoint' && a.enabled), false);
    assert.ok(entry.actions.some(a => a.type === 'discussCheckpoint' && a.enabled));
  }
});
test('fresh action checks closed retained non-target bytes even without a source event', async () => {
  const other = uri('/b.kf'); let bytes = 'original', version = 1;
  const f = fixture({ read: u => ({ uri: u, text: bytes, version }) });
  f.context({ activeDocument: { uri: uri('/a.kf'), text: 'show(1)', version: 1 }, candidateUris: [other] });
  await f.coordinator.refreshContext(); await f.coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: selectedSourceId(other), included: true, contextRevision: f.session.snapshot().context.revision });
  await f.submit(); const click = f.envelope('implementCheckpoint'); bytes = 'changed'; version++;
  assert.equal((await f.actions.dispatch(click)).status, 'stale'); assert.equal(f.stages, 0); assert.equal(f.calls, 1);
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'proposed');
});
test('restricted or removed target cannot be authorized by a retained preparation scope', async () => {
  for (const context of [{ restricted: true }, { restricted: false }]) {
    const f = fixture({ events: async function* () { yield done([proposal()]); } }); await f.start(); const click = f.envelope('prepareChange'); f.context(context);
    assert.equal((await f.actions.dispatch(click)).status, 'stale'); assert.equal(f.calls, 1); assert.equal(f.stages, 0);
  }
});
test('reentrant learner-entry publication cannot consume checkpoint authority during turn admission', async () => {
  const f = fixture({ kind: 'design', events: async function* (n) { yield n === 1 ? done([checkpoint('design')]) : done(); } });
  await f.start(); const click = f.envelope('confirmCheckpoint'); let clicking;
  f.session.subscribe(state => { if (!clicking && state.entries.some(e => e.kind === 'learner' && e.text === 'Next')) clicking = f.actions.dispatch(click); });
  await f.submit('Next'); assert.equal((await clicking).status, 'busy'); assert.ok(f.session.resolveAction(click));
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'proposed');
});
test('staged native proposal retains host preparation provenance distinct from Apply', async () => {
  const f = fixture(); await f.start(); const decision = f.coordinator.learningSession.snapshot().decisions[0];
  await f.actions.dispatch(f.envelope('implementCheckpoint'));
  const provenance = f.proposalProvider.pending.preparation;
  assert.ok(provenance.grantId); assert.equal(provenance.decisionId, decision.id);
  assert.equal(provenance.targetUri, 'file:///a.kf'); assert.equal(provenance.scopeSummary, 'Replace the print statement with a loop');
  assert.equal(provenance.teachingRevision, f.coordinator.controller.current.snapshot.learning.revision);
  assert.equal(f.coordinator.controller.current.grant, null); assert.equal(f.proposalProvider.pending.reviewed, undefined);
});
function fillLearningState(learning, maximum = 65536) {
  const observation = text => ({ kind: 'concept', text, attribution: 'tutor', uncertainty: '', status: 'observed', priorDecisionIds: [] });
  const dependencies = { files: [], knowledgeLineage: null };
  for (let index = 0; index < 7; index++) learning.addObservation(observation('x'.repeat(8000)), dependencies);
  const record = { id: 'x'.repeat(36), revision: learning.snapshot().revision + 1, ...observation(''), dependencies };
  const remaining = maximum - learning.snapshot().byteLength - 1 - Buffer.byteLength(JSON.stringify(record));
  learning.addObservation(observation('x'.repeat(remaining)), dependencies);
  assert.equal(learning.snapshot().byteLength, maximum);
}
for (const [kind, type] of [['design', 'confirmCheckpoint'], ['implementation', 'implementCheckpoint']]) test(`${type} real confirmation budget failure retains original pending authority without mutation`, async () => {
  const f = fixture({ kind }); await f.start(); const learning = f.coordinator.learningSession;
  fillLearningState(learning); const original = f.envelope(type), before = learning.snapshot();
  assert.equal((await f.actions.dispatch(original)).code, 'learning_limit');
  assert.deepEqual(learning.snapshot(), before); assert.equal(f.calls, 1); assert.equal(f.stages, 0);
  assert.ok(f.session.resolveAction(original), 'budget rejection must preserve the original capability');
  assert.equal(f.coordinator.controller.isBusy(), false); assert.equal(f.coordinator.controller.current.grant, null);
  assert.equal(f.session.snapshot().entries.at(-1).data.code, 'learning_limit');
});

test('synchronous preference queue cannot consume reserved confirmation bytes after action consumption', async () => {
  let providerReservationReleased = false;
  const f = fixture({ kind: 'design', events: async function* (n) {
    if (n === 1) yield done([checkpoint('design')]);
    else {
      const id = f.coordinator.learningSession.snapshot().decisions[0].id;
      const token = f.coordinator.learningSession.reserveConfirmation(id);
      providerReservationReleased = f.coordinator.learningSession.releaseConfirmation(token);
      yield done();
    }
  } });
  await f.start(); const learning = f.coordinator.learningSession; fillLearningState(learning, 65534);
  const original = f.envelope('confirmCheckpoint'); let changing;
  f.session.subscribe(() => { if (!changing && !f.session.resolveAction(original)) changing = f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { familiarity: 'beginner' } }); });
  assert.equal((await f.actions.dispatch(original)).status, 'completed');
  assert.equal((await changing).status, 'unavailable');
  assert.equal(learning.snapshot().decisions[0].disposition, 'confirmed'); assert.equal(learning.snapshot().byteLength, 65536);
  assert.equal(f.session.resolveAction(original), null); assert.equal(f.calls, 2); assert.equal(f.stages, 0);
  assert.equal(providerReservationReleased, true);
});

test('source event during consumption denies adoption and releases its private budget reservation', async () => {
  const f = fixture(); await f.start(); const original = f.envelope('implementCheckpoint'); let changed = false;
  const decision = f.coordinator.learningSession.snapshot().decisions[0];
  f.session.subscribe(() => { if (!changed && !f.session.resolveAction(original)) { changed = true; f.change(); } });
  assert.equal((await f.actions.dispatch(original)).status, 'stale');
  assert.equal(f.coordinator.learningSession.snapshot().decisions[0].disposition, 'proposed');
  assert.equal(f.stages, 0); assert.equal(f.calls, 1); assert.equal(f.coordinator.controller.current.grant, null);
  const token = f.coordinator.learningSession.reserveConfirmation(decision.id);
  assert.equal(f.coordinator.learningSession.releaseConfirmation(token), true);
});

test('valid synchronous queued preference patch preserves admitted policy and cannot replay consumed preparation', async () => {
  const f = fixture(); await f.start(); const original = f.envelope('implementCheckpoint'); let queued;
  f.session.subscribe(() => { if (!queued && !f.session.resolveAction(original)) queued = f.coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { frequency: 'light' } }); });
  assert.equal((await f.actions.dispatch(original)).status, 'completed'); assert.equal((await queued).status, 'queued');
  assert.equal(f.coordinator.controller.current.snapshot.learning.preferences.frequency, 'normal');
  assert.equal(f.coordinator.learningSession.snapshot().preferences.frequency, 'light');
  assert.equal(f.stages, 1); assert.equal((await f.actions.dispatch(original)).status, 'stale'); assert.equal(f.stages, 1);
});
test('fresh preparation authorization after a failed confirmed checkpoint can stage exactly one proposal', async () => {
  const f = fixture({ events: async function* (n) { if (n === 1) yield done([checkpoint()]); else if (n === 2) throw new ProviderError('timeout'); else yield done([proposal()]); } });
  await f.start(); await f.actions.dispatch(f.envelope('implementCheckpoint')); const retryScope = f.envelope('prepareChange');
  assert.equal((await f.actions.dispatch(retryScope)).status, 'completed'); assert.equal(f.stages, 1); assert.equal(f.calls, 3);
  assert.equal((await f.actions.dispatch(retryScope)).status, 'stale'); assert.equal(f.stages, 1);
});
