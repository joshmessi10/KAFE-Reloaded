const { randomUUID } = require('node:crypto');
/** Host authority for ActionEnvelope capabilities. Services never receive webview action types. */
class TutorHostActions {
  constructor({ session, controller, coordinator, proposalProvider, runtimeManager,
    configureProvider, runFile, getReadiness, authorizeRunTarget = () => false }) {
    Object.assign(this, { session, controller, coordinator, proposalProvider, runtimeManager,
      configureProvider, runFile, getReadiness, authorizeRunTarget });
    this.terminals = new Map();
    this.runEntries = new Map();
    this.runGenerations = new Map();
    this.runRequests = new Map();
    this.disposed = false;
    this.projecting = false;
    this.unsubscribe = session.subscribe(() => this.projectDisplay());
  }
  live(generation) { return !this.disposed && this.session.snapshot().generation === generation; }
  entry(kind, text, data = {}, status = 'ready') { if (!this.disposed) return this.session.appendEntry({ kind, text, data, status }); }
  action(entry, type, label, args = {}) { if (!this.disposed) return this.session.registerAction(entry, { type, label, args, enabled: true }); }
  projectDisplay() {
    if (this.disposed || this.projecting) return;
    this.projecting = true;
    try {
      const snapshot = this.session.snapshot();
      this.session.invalidateActions(a => a.type === 'runFile' && !this.authorizeRunTarget(a.args.targetUri));
      const source = snapshot.context.activeSource;
      this.session.setContextRunAction(!snapshot.context.restricted && source && this.authorizeRunTarget(source.uri) ? source : null);
      for (const e of this.session.snapshot().entries) {
        if (e.kind === 'proposal' && e.status !== 'ready') this.session.invalidateActions((a, entry) => entry.id === e.id && ['reviewProposal', 'acceptProposal', 'rejectProposal'].includes(a.type));
        if (e.kind === 'proposal' && e.status === 'ready' && !e.actions.some(a => a.type === 'reviewProposal')) {
          const pending = this.proposalProvider?.pending;
          if (pending?.id === e.data.proposalId) this.session.updateEntry(e.id, { data: { ...e.data, targetUri: pending.sourceId, documentVersion: pending.documentVersion } });
          this.action(e.id, 'reviewProposal', 'Review change', { id: e.data.proposalId });
        }
      }
    } finally { this.projecting = false; }
  }
  async refreshContext() {
    if (!this.disposed) { await this.coordinator.refreshContext(); this.projectDisplay(); }
  }
  async submitMessage({ submissionId, text, contextRevision }) {
    if (this.disposed) return { status: 'stale' };
    return this.controller.submit({ submissionId, text, contextRevision });
  }
  async dispatch(envelope) {
    if (this.disposed) return { status: 'stale' };
    const capability = this.session.resolveAction(envelope);
    if (!capability || !this.session.consumeAction(envelope.actionId)) return { status: 'stale' };
    const { type, args } = capability;
    const generation = envelope.generation;
    const current = () => this.live(generation);
    try {
      let result = { status: 'completed' };
      switch (type) {
        case 'configureProviderKey':
          result = await this.configureProvider?.() || { status: 'unavailable' };
          if (current() && result.status === 'completed') {
            await this.refreshContext();
            if (current() && args.turnId && this.session.snapshot().turn?.id === args.turnId) this.action(envelope.entryId, 'retryTurn', 'Retry', { turnId: args.turnId });
          }
          break;
        case 'installRuntime': {
          const ready = await this.getReadiness?.();
          if (!current()) return { status: 'cancelled' };
          if (!ready?.trusted) { result = { status: 'unavailable', code: 'trust_unavailable' }; break; }
          if (args.targetUri && !this.authorizeRunTarget(args.targetUri)) { result = { status: 'unavailable', code: 'target_unavailable' }; break; }
          this.session.updateEntry(envelope.entryId, { status: 'running', text: 'Checking KAFE runtime setup.' });
          const installed = await this.runtimeManager?.installRuntime({ onProgress: event => {
            if (current() && ['checking', 'confirming', 'downloading', 'validating', 'extracting', 'syncing', 'ready'].includes(event.stage)) this.session.updateEntry(envelope.entryId, { text: `KAFE setup: ${event.stage}.` });
          } });
          result = { status: installed?.status === 'ready' ? 'completed' : installed?.status === 'cancelled' ? 'cancelled' : installed?.status === 'unavailable' ? 'unavailable' : 'failed' };
          if (current()) this.session.updateEntry(envelope.entryId, { status: result.status, text: `KAFE runtime setup ${result.status}.` });
          break;
        }
        case 'retryTurn': result = await this.controller.retry(args.turnId); break;
        case 'stopTurn': return { status: this.controller.stop(args) ? 'cancelled' : 'stale' };
        case 'runFile': {
          if (!this.authorizeRunTarget(args.targetUri)) return { status: 'unavailable', code: 'target_unavailable' };
          const runOwner = this.captureRunOwner(args.targetUri);
          result = await this.runFile?.({ targetUri: args.targetUri, runOwner }) || { status: 'unavailable' };
          if (current() && result.status !== 'completed') this.recordRunState({ owner: runOwner, sourceUri: args.targetUri, status: result.status });
          if (current() && result.status === 'unavailable' && result.code === 'runtime_unavailable' && this.authorizeRunTarget(args.targetUri)) {
            const entryId = this.runRequests.get(runOwner.requestId)?.entryId;
            if (entryId) this.action(entryId, 'installRuntime', 'Install KAFE runtime', { targetUri: args.targetUri });
          }
          break;
        }
        case 'openTerminal':
          if (!this.terminals.has(args.runSequence)) return { status: 'stale' };
          this.terminals.get(args.runSequence).show(); break;
        case 'reviewProposal': {
          const reviewed = await this.proposalProvider.open(args.id, { isCurrent: () => current() && this.session.snapshot().entries.some(e => e.id === envelope.entryId && e.status === 'ready' && e.data.proposalId === args.id) });
          result = { status: reviewed.status === 'opened' ? 'completed' : reviewed.status === 'cancelled' ? 'cancelled' : reviewed.status === 'stale' || reviewed.status === 'invalid' ? 'stale' : 'failed' };
          const entry = this.session.snapshot().entries.find(e => e.id === envelope.entryId && e.status === 'ready' && e.data.proposalId === args.id);
          if (current() && result.status === 'completed' && entry && this.proposalProvider.pending?.id === args.id &&
            this.proposalProvider.pending.reviewed && !entry.actions.some(a => a.type === 'acceptProposal' && a.enabled)) {
            this.action(entry.id, 'acceptProposal', 'Apply', { id: args.id, turnId: entry.data.turnId });
          }
          if (current() && result.status !== 'completed' && this.proposalProvider.pending?.id !== args.id && this.session.snapshot().entries.some(e => e.id === envelope.entryId && e.status === 'ready')) this.session.updateEntry(envelope.entryId, { status: result.status, text: `Native proposal review ${result.status}; this proposal is no longer available.` });
          break;
        }
        case 'acceptProposal': case 'rejectProposal': {
          result = await this.coordinator.handleLearnerMessage({ type, ...args });
          if (current() && result.code === 'proposal_busy') this.action(envelope.entryId, type, capability.label, args);
          else if (current()) this.session.updateEntry(envelope.entryId, { status: result.status === 'completed' ? (type === 'acceptProposal' ? 'applied' : 'rejected') : result.status, text: this.session.snapshot().entries.at(-1).text });
          break;
        }
        default: return { status: 'stale' };
      }
      if (!current()) return { status: 'cancelled' };
      const recoverable = !['acceptProposal', 'rejectProposal', 'reviewProposal'].includes(type) && ['failed', 'cancelled', 'unavailable'].includes(result.status);
      const repeatable = result.status === 'completed' && ['openTerminal', 'runFile', 'reviewProposal'].includes(type);
      if ((recoverable || repeatable) && this.session.snapshot().entries.some(e => e.id === envelope.entryId)) this.action(envelope.entryId, type, capability.label, args);
      if (type === 'runFile') this.session.setContextRunAction(this.session.snapshot().context.restricted ? null : this.session.snapshot().context.activeSource, true);
      this.projectDisplay();
      return result;
    } catch {
      if (current()) {
        if (type === 'installRuntime') this.session.updateEntry(envelope.entryId, { status: 'failed', text: 'KAFE runtime setup failed.' });
        this.entry('error', 'The host action could not complete.', { code: 'host_action_failed' }, 'failed');
        if (envelope.entryId === this.session.snapshot().contextActions.entryId) {
          const source = this.session.snapshot().context.activeSource;
          this.session.setContextRunAction(source && this.authorizeRunTarget(source.uri) ? source : null, true);
        } else this.action(envelope.entryId, type, capability.label, args);
      }
      return { status: current() ? 'failed' : 'cancelled', code: 'host_action_failed' };
    }
  }
  /** Private native service token: capture before document/save/runtime awaits, independent of turnGeneration. */
  captureRunOwner(sourceUri) {
    const { sessionId, generation } = this.session.snapshot();
    const requestId = randomUUID();
    const entryId = this.entry('run', 'Preparing learner-started KAFE run.', typeof sourceUri === 'string' ? { sourceUri } : {}, 'preparing');
    this.runRequests.set(requestId, { sessionId, generation, entryId });
    return { sessionId, generation, requestId, isCurrent: () => this.live(generation) && this.session.snapshot().sessionId === sessionId };
  }
  recordRunState(event) {
    if (this.disposed) return;
    if (event.owner) {
      const request = this.runRequests.get(event.owner.requestId);
      if (!request || request.sessionId !== event.owner.sessionId || request.generation !== event.owner.generation || !this.live(request.generation)) return;
      const entry = this.session.snapshot().entries.find(e => e.id === request.entryId);
      if (!entry) return;
      const data = { ...entry.data, ...(typeof event.sourceUri === 'string' ? { sourceUri: event.sourceUri } : {}),
        ...(Number.isSafeInteger(event.documentVersion) ? { documentVersion: event.documentVersion } : {}),
        ...(Number.isSafeInteger(event.runSequence) ? { runSequence: event.runSequence } : {}) };
      this.session.updateEntry(entry.id, { status: event.status, text: `Learner-started KAFE run ${event.status}.`, data });
      if (Number.isSafeInteger(event.runSequence)) {
        this.runGenerations.set(event.runSequence, request.generation);
        this.runEntries.set(event.runSequence, entry.id);
        if (event.terminal && !this.terminals.has(event.runSequence)) { this.terminals.set(event.runSequence, event.terminal); this.action(entry.id, 'openTerminal', 'Open terminal', { runSequence: event.runSequence }); }
      }
      return;
    }
    if (!Number.isSafeInteger(event.runSequence)) return;
    if (this.runGenerations.has(event.runSequence) && !this.live(this.runGenerations.get(event.runSequence))) return;
    this.runGenerations.set(event.runSequence, this.session.snapshot().generation);
    const prior = this.runEntries.get(event.runSequence);
    if (prior) { this.session.updateEntry(prior, { status: event.status, text: `Learner-started KAFE run ${event.status}.` }); return; }
    const id = this.entry('run', 'Learner-started KAFE run running.', { runSequence: event.runSequence, sourceUri: event.sourceUri, ...(Number.isSafeInteger(event.documentVersion) ? { documentVersion: event.documentVersion } : {}) }, 'running');
    this.runEntries.set(event.runSequence, id);
    if (event.terminal) { this.terminals.set(event.runSequence, event.terminal); this.action(id, 'openTerminal', 'Open terminal', { runSequence: event.runSequence }); }
  }
  recordRunResult(result) {
    if (this.disposed) return false;
    if (result.owner) {
      const request = this.runRequests.get(result.owner.requestId);
      if (!request || request.sessionId !== result.owner.sessionId || request.generation !== result.owner.generation || !this.live(request.generation)) return false;
    }
    if (this.runGenerations.has(result.runSequence) && !this.live(this.runGenerations.get(result.runSequence))) return false;
    const id = this.runEntries.get(result.runSequence);
    const previous = id && this.session.snapshot().entries.find(e => e.id === id);
    if (previous?.status === 'completed') return false;
    const recorded = this.coordinator.recordRunResult(result, { entryId: id });
    const entry = id ? this.session.snapshot().entries.find(e => e.id === id) : recorded ? this.session.snapshot().entries.at(-1) : null;
    if (!entry) return false;
    this.session.updateEntry(entry.id, { status: 'completed', text: 'Learner-started KAFE run completed.', data: { ...entry.data, ...(previous?.data || {}),
      runSequence: result.runSequence, sourceUri: result.sourceUri, exitCode: result.exitCode, outputTruncated: result.outputTruncated,
      stdout: result.stdout, stderr: result.stderr, runtimeMode: result.runtimeMode || null, runtimeVersion: result.runtimeVersion, knowledgePackVersion: result.knowledgePackVersion } });
    return recorded;
  }
  dispose() { this.disposed = true; this.unsubscribe?.(); this.terminals.clear(); this.runEntries.clear(); this.runGenerations.clear(); this.runRequests.clear(); }
}
module.exports = { TutorHostActions };
