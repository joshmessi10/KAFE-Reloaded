const { isDeepStrictEqual } = require('node:util');
const { validateRunResult, validateDocument, selectedSourceId, metadataLineage, TOOL_DEFINITIONS } = require('./ToolRouter');
const { selectHistory } = require('./ConversationHistory');
const { ConversationSession } = require('./ConversationSession');
const { TurnController } = require('./TurnController');
const { createRequestSnapshot, isSnapshotCurrent, sha256 } = require('./RequestSnapshot');

/** Single host context owner. No learning state or reviewed-request capabilities. */
class SessionCoordinator {
  constructor({ provider, contextComposer, toolRouter, proposalProvider,
    session = new ConversationSession(), getContext = () => ({}),
    getKnowledgeAvailability = async () => ({ status: 'unavailable', code: 'knowledge_unavailable' }),
    getSourceRevision = () => null,
    getWorkspaceRelativeSourcePath = () => null } = {}) {
    Object.assign(this, { provider, contextComposer, toolRouter, proposalProvider, session,
      getContext, getKnowledgeAvailability, getSourceRevision, getWorkspaceRelativeSourcePath });
    this.sourceRevisions = new WeakMap();
    this.evidence = null; this.lastRunSequence = 0; this.includedSourceUris = new Map();
    this.acceptingProposalId = null; this.disposed = false; this.contextRefresh = 0;
    this.controller = new TurnController({ session, provider, contextComposer, toolRouter, proposalProvider,
      captureSubmission: submission => this.captureSubmission(submission),
      validateSubmission: snapshot => this.validateSubmission(snapshot),
      isSubmissionAuthorized: snapshot => this.isSubmissionAuthorized(snapshot), refreshContext: () => this.refreshContext() });
  }
  snapshot() { return this.session.snapshot(); }
  subscribe(listener) { return this.session.subscribe(listener); }
  dispose() { this.controller.dispose(); this.disposed = true; this.contextRefresh++; }

  /** Reset conversation memory; independent native processes and legacy storage remain owned elsewhere. */
  newConversation() {
    if (this.disposed) return;
    this.contextRefresh++;
    this.includedSourceUris.clear(); this.evidence = null;
    this.session.reset();
    this.proposalProvider?.clear(); this.proposal = null;
    void this.refreshContext().catch(() => {});
  }

  /** Read host metadata and keep still-authorized selected files when their editors close. */
  async refreshContext() {
    const ticket = ++this.contextRefresh, generation = this.snapshot().generation;
    let context = await this.getContext();
    if (this.disposed || ticket !== this.contextRefresh || generation !== this.snapshot().generation) return null;
    const previous = this.snapshot().context;
    const retained = []; let awaitedAuthorization = false;
    for (const source of previous.sources.filter(s => s.included)) {
      const uri = this.includedSourceUris.get(source.id);
      if (!uri || context.restricted === true || (context.candidateUris || []).some(u => u.toString() === uri.toString())) continue;
      awaitedAuthorization = true;
      try { await this.contextComposer.authorizeUri(uri); retained.push(uri); } catch { /* Revoked sources disappear. */ }
    }
    // A closed-file authorization can await editor work. Publish only a fresh active/trust sample,
    // and never overwrite a selection made while that authorization was outstanding.
    if (awaitedAuthorization) context = await this.getContext();
    if (this.disposed || ticket !== this.contextRefresh || generation !== this.snapshot().generation ||
      previous.revision !== this.snapshot().context.revision) return null;
    const restricted = context.restricted === true;
    const candidateUris = restricted ? [] : [...(context.candidateUris || []), ...retained];
    const choice = (uri, category, included) => ({ id: category === 'active-file' ? 'active-file' : selectedSourceId(uri),
      uri: uri.toString(), label: this.contextComposer?.documentReader.displayLabel?.(uri) || uri.toString(), category, included });
    const activeDocument = restricted ? undefined : context.activeDocument;
    const sources = [...new Map(candidateUris.map(uri => [uri.toString(), uri])).values()]
      // Keep explicit inclusion in its single owner while active; projection/capture deduplicate it.
      .filter(uri => uri.toString() !== activeDocument?.uri.toString() || previous.sources.some(s => s.uri === uri.toString() && s.included))
      .map(uri => choice(uri, 'selected-file', previous.sources.some(s => s.id === selectedSourceId(uri) && s.included)));
    this.session.setContext({ revision: previous.revision, restricted,
      activeSource: activeDocument ? choice(activeDocument.uri, 'active-file', true) : null, sources });
    this.includedSourceUris = new Map(candidateUris.filter(uri => sources.some(s => s.id === selectedSourceId(uri) && s.included)).map(uri => [selectedSourceId(uri), uri]));
    return { activeDocument, candidateUris, restricted,
      runResult: !restricted && this.evidence?.sourceUri === activeDocument?.uri.toString() ? this.evidence : null };
  }

  parameters() { return this.provider?.getRequestParameters?.() || { model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true }; }

  /** @param {import('./ConversationSession').Submission} submission @returns {Promise<import('./RequestSnapshot').RequestSnapshot>} */
  async captureSubmission(submission) {
    const identity = this.snapshot(), runSequence = this.lastRunSequence, sourceRevision = this.getSourceRevision();
    const context = await this.refreshContext();
    if (!context || !isDeepStrictEqual(submission.context, this.snapshot().context)) throw Object.assign(new Error(), { code: 'stale_context' });
    const availability = await this.getKnowledgeAvailability();
    const composed = await this.contextComposer.compose({ request: submission.text,
      activeDocument: context.activeDocument ? { ...context.activeDocument } : undefined, runResult: context.runResult ? structuredClone(context.runResult) : null,
      candidateUris: context.candidateUris.filter(uri => uri.toString() !== context.activeDocument?.uri.toString() && submission.context.sources.some(s => s.id === selectedSourceId(uri) && s.included)),
      includedSourceIds: submission.context.sources.filter(s => s.included).map(s => s.id), history: this.session.historyPairs(),
      providerParameters: this.parameters(), knowledgeAvailability: availability });
    const request = context.restricted ? { ...composed.payload, tools: TOOL_DEFINITIONS.filter(t => t.function.name === 'searchKafeKnowledge') } : composed.payload;
    const snapshot = createRequestSnapshot({ submission, sessionId: identity.sessionId, generation: identity.generation,
      runSequence, sources: composed.snapshots, history: composed.history, dependencies: composed.dependencies, request });
    this.sourceRevisions.set(snapshot, sourceRevision);
    return snapshot;
  }

  /**
   * Synchronous final authority fence; never await between this check and provider admission.
   * Host getSourceRevision must be a monotonic nonnegative safe integer advancing on source
   * bytes/version/availability or workspace source authorization/trust/active changes. It must
   * cover closed-but-included documents too. Draft/token changes must not advance it.
   * Missing/invalid host fences fail closed for file-bearing snapshots.
   */
  isSubmissionAuthorized(snapshot) {
    try {
      if (this.disposed) return false;
      const live = this.snapshot();
      if (live.sessionId !== snapshot.sessionId || live.generation !== snapshot.generation ||
        !isDeepStrictEqual(live.context, snapshot.submission.context) || this.lastRunSequence !== snapshot.runSequence ||
        !isDeepStrictEqual(this.parameters(), { model: snapshot.request.model, thinking: snapshot.request.thinking, stream: snapshot.request.stream })) return false;
      if (!snapshot.sources.some(source => source.uri !== null)) return true;
      const captured = this.sourceRevisions.get(snapshot), current = this.getSourceRevision();
      return Number.isSafeInteger(captured) && captured >= 0 && Number.isSafeInteger(current) && current === captured;
    } catch { return false; }
  }

  /** Validate after awaited optional reads; never replace an admitted URI with editor focus. */
  async validateSubmission(snapshot) {
    try {
      let context = await this.refreshContext();
      if (!context) return false;
      let availability = await this.getKnowledgeAvailability();
      if (!await this.contextComposer.revalidateSnapshot({ snapshot, current: snapshot, ...context, knowledgeAvailability: availability })) return false;
      // The preceding reads can allow editor/trust/selection/parameter/pack changes. Sample again.
      const selectedSnapshots = new Map();
      for (const source of snapshot.sources.filter(s => s.category === 'selected-file')) {
        const selected = this.snapshot().context.sources.find(s => s.id === source.id && s.included && s.uri === source.uri);
        const uri = context.candidateUris.find(u => u.toString() === source.uri && selectedSourceId(u) === source.id);
        if (!selected || !uri) return false;
        await this.contextComposer.authorizeUri(uri);
        const document = validateDocument(await this.contextComposer.documentReader.readDocument(uri));
        await this.contextComposer.authorizeUri(uri);
        if (document.uri.toString() !== source.uri) return false;
        selectedSnapshots.set(source.id, { ...source, uri: document.uri.toString(), version: document.version,
          text: document.text, contentSha256: sha256(document.text) });
      }
      availability = await this.getKnowledgeAvailability();
      context = await this.refreshContext();
      if (!context) return false;
      const live = this.snapshot();
      const sources = snapshot.sources.map(source => {
        if (source.category === 'selected-file') return selectedSnapshots.get(source.id);
        if (source.category !== 'active-file') return source;
        const document = context.activeDocument;
        return document ? { ...source, uri: document.uri.toString(), version: document.version, text: document.text, contentSha256: sha256(document.text) } : { ...source, version: null };
      });
      const lineage = availability.status === 'ready' ? metadataLineage(availability.metadata) : null;
      const fileUris = [live.context.activeSource?.uri, ...live.context.sources.filter(s => s.included).map(s => s.uri)].filter(Boolean);
      const history = selectHistory({ pairs: this.session.historyPairs(), authorizedFileUris: fileUris, knowledgeLineage: lineage });
      return this.isSubmissionAuthorized(snapshot) && isSnapshotCurrent(snapshot, { ...snapshot, sessionId: live.sessionId, generation: live.generation,
        submission: { ...snapshot.submission, context: live.context }, runSequence: this.lastRunSequence,
        sources, history, dependencies: { ...snapshot.dependencies, knowledgeLineage: lineage },
        request: { ...snapshot.request, ...this.parameters() } });
    } catch { return false; }
  }

  // Derived from the session, never a second proposal/transcript store.
  get proposal() {
    const entry = this.snapshot().entries.findLast(e => e.kind === 'proposal' && e.status === 'ready');
    return entry ? { id: entry.data.proposalId, description: entry.text } : null;
  }
  set proposal(value) {
    if (value !== null) throw new TypeError('Proposals are issued by TurnController.');
    for (const entry of this.snapshot().entries.filter(e => e.kind === 'proposal' && e.status === 'ready')) {
      this.session.updateEntry(entry.id, { status: 'settled' });
      this.session.invalidateActions((a, e) => e.id === entry.id);
    }
  }

  recordRunResult(result, { entryId } = {}) {
    if (this.disposed) return false;
    if (!result) throw new Error('Invalid learner-started KAFE run result.');
    validateRunResult(result);
    if (result.runSequence <= this.lastRunSequence) return false;
    this.lastRunSequence = result.runSequence;
    this.evidence = { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode,
      outputTruncated: result.outputTruncated, runtimeVersion: result.runtimeVersion,
      knowledgePackVersion: result.knowledgePackVersion, sourceUri: result.sourceUri,
      runSequence: result.runSequence,
      ...(result.runtimeMode ? { runtimeMode: result.runtimeMode } : {}) };
    const sourcePath = this.getWorkspaceRelativeSourcePath(result.sourceUri);
    if (typeof sourcePath === 'string' && sourcePath.length <= 500 && sourcePath.trim() === sourcePath &&
      !sourcePath.startsWith('/') && !sourcePath.includes('\\') && !sourcePath.includes(':') &&
      !/[\x00-\x1f\x7f]/.test(sourcePath) &&
      sourcePath.split('/').every(segment => segment && segment !== '.' && segment !== '..')) {
      this.evidence.sourcePath = sourcePath;
    }
    const data = { runSequence: result.runSequence, exitCode: result.exitCode, sourceUri: result.sourceUri, outputTruncated: result.outputTruncated };
    if (entryId && this.snapshot().entries.some(e => e.id === entryId && e.kind === 'run')) this.session.updateEntry(entryId, { status: 'completed', text: 'Learner-started KAFE run completed.', data });
    else this.session.appendEntry({ kind: 'run', status: 'completed', text: 'Learner-started KAFE run completed.', data });
    return true;
  }


  async handleLearnerMessage(message) {
    if (this.disposed) return { status: 'cancelled' };
    if (!message || typeof message.type !== 'string') return { status: 'unavailable' };
    if (message.type === 'rejectProposal') {
      if (!this.proposal || message.id !== this.proposal.id) return this.turn('error', 'No matching proposal is available.');
      let result;
      try { result = this.proposalProvider?.reject(message.id); }
      catch {
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.');
        if (this.proposal?.id === message.id) this.proposal = null;
        return this.turn('error', 'The proposal could not be rejected and was discarded.');
      }
      if (result?.status === 'busy') return { ...this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.'), code: 'proposal_busy' };
      if (result?.status === 'invalid') {
        if (this.proposal?.id === message.id) this.proposal = null;
        return this.turn('error', 'This proposal is no longer available; another review may be opening.');
      }
      if (result?.status !== 'rejected') {
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.');
        if (this.proposal?.id === message.id) this.proposal = null;
        return this.turn('error', 'The proposal could not be rejected and was discarded.');
      }
      this.proposal = null;
      return this.turn('coaching', 'Proposal rejected.');
    }
    if (message.type === 'acceptProposal') {
      if (!this.proposal || message.id !== this.proposal.id) return this.turn('error', 'No matching proposal is available.');
      if (this.proposalProvider?.isResetPending?.()) return { ...this.turn('error', 'A progress reset is in progress. Wait before accepting the proposal.'), code: 'proposal_busy' };
      if (this.acceptingProposalId === message.id) return { ...this.turn('error', 'Proposal acceptance is in progress.'), code: 'proposal_busy' };
      this.acceptingProposalId = message.id;
      const generation = this.snapshot().generation;
      let result;
      try { result = await this.proposalProvider?.accept(message.id); }
      catch {
        if (generation !== this.snapshot().generation) return { status: 'cancelled' };
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait for its result.');
        if (this.proposal?.id === message.id) this.proposal = null;
        return this.turn('error', 'The proposal could not be applied and was discarded.');
      } finally {
        if (this.acceptingProposalId === message.id) this.acceptingProposalId = null;
      }
      if (generation !== this.snapshot().generation) return { status: 'cancelled' };
      if (this.proposal?.id === message.id) this.proposal = null;
      if (result?.status === 'applied') return this.turn('coaching', 'The reviewed KAFE proposal was applied.');
      if (result?.status === 'cancelled') { this.turn('coaching', 'The proposal was cancelled before any edit.'); return { status: 'cancelled' }; }
      return this.turn('error', result?.status === 'stale' ?
        'The KAFE document changed. The proposal was discarded.' : 'The proposal could not be applied and was discarded.');
    }
    if (message.type === 'setDraft') {
      if (typeof message.text !== 'string') return { status: 'unavailable' };
      this.session.setDraft(message.text); return { status: 'completed' };
    }
    if (message.type === 'setSourceIncluded') {
      const before = this.snapshot();
      if (typeof message.sourceId !== 'string' || typeof message.included !== 'boolean' || message.contextRevision !== before.context.revision) return { status: 'stale' };
      const context = await this.refreshContext();
      if (!context || before.generation !== this.snapshot().generation || message.contextRevision !== this.snapshot().context.revision || context.restricted) return { status: 'stale' };
      const candidate = context.candidateUris.find(uri => selectedSourceId(uri) === message.sourceId);
      if (!candidate) return { status: 'stale' };
      if (message.included) this.includedSourceUris.set(message.sourceId, candidate);
      else { this.includedSourceUris.delete(message.sourceId); this.controller.revokeSource(candidate.toString()); }
      const selected = this.snapshot().context.sources.filter(s => s.included && s.id !== message.sourceId).map(s => s.id);
      if (message.included) selected.push(message.sourceId);
      this.session.setSelectedSources(selected); return { status: 'completed' };
    }
    if (message.type === 'submitMessage') return this.controller.submit(message);
    if (message.type === 'stopTurn') return { status: this.controller.stop(message) ? 'cancelled' : 'stale' };
    if (message.type === 'retryTurn') return this.controller.retry(message.turnId);
    return { status: 'unavailable' };
  }

  turn(kind, text) {
    if (this.disposed) return { status: 'cancelled' };
    this.session.appendEntry({ kind: kind === 'error' ? 'error' : 'host', status: kind === 'error' ? 'failed' : 'completed', text });
    return { status: kind === 'error' ? 'failed' : 'completed' };
  }
}
module.exports = { SessionCoordinator };
