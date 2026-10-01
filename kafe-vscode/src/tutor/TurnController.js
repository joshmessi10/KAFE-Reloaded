const { randomUUID } = require('node:crypto');
const { mergeDependencies } = require('./ConversationHistory');
const { validatePassages, assertKnowledgeCoherence } = require('./ToolRouter');
const { TOOL_NAMES } = require('./ToolRouter');
const { ProviderError } = require('./providers/ProviderError');

const CANCELLED = Symbol('cancelled turn');
const SAFE_ERRORS = Object.freeze({
  knowledge_unavailable: 'KAFE knowledge is unavailable. Local language guidance could not be verified.',
  trust_unavailable: 'Trusted workspace context is unavailable.',
  tool_failed: 'The tutor tool could not complete. Try sending again.',
  stale_proposal: 'The proposal is no longer current. Send a new request.',
  tool_limit: 'The tutor tool-call limit was reached. Send a new request.',
  context_unavailable: 'The request context is unavailable. Send again with current context.',
});

// Conversational model content never creates entries, actions, progress, or evidence.
function coachingText(text) {
  const directCertification = /\b(?:you|(?:the\s+)?learner|(?:the\s+)?student)\s+(?:(?:have|has|had|are|is|were|was|now|already|fully|completely|an?)\s+)*(?:mastered|master|proficient|expert|certified)\b|\b(?:you|learner|student)\s+(?:fully|completely)\s+understand\b|\b(?:mastery|proficiency|expertise|certification)\s+(?:(?:is|was|has been)\s+)?(?:proved|confirmed|demonstrated|established)\b/i;
  const evidence = /\b(?:passing|successful|passed)\s+(?:run|result|program|execution|output)\b|\b(?:your|the|learner'?s?)\s+(?:explanation|answer|response)\b|\b(?:a|the|your)\s+(?:run|result|program|output)\s+(?:passed|succeeded)\b/gi;
  const understanding = /\b(?:understand|understands|understood|understanding|comprehend|comprehends|comprehension|grasp|grasps|know|knows|knowledge|learned|learnt|learns|mastery|proficiency|expertise|certification)\b/gi;
  const proofClaim = /\b(?:proof|prove|proves|proved|proven|demonstrate|demonstrates|demonstrated|show|shows|shown|confirm|confirms|confirmed|establish|establishes|established|certify|certifies|certified|verify|verifies|verified|validate|validates|validated|guarantee|guarantees|guaranteed|mean|means|indicate|indicates|indicated|sign)\b/gi;
  const claimsUnderstanding = text.split(/(?<=[.!?])\s+|\n+/).some(sentence => {
    const matches = pattern => [...sentence.matchAll(pattern)];
    return matches(evidence).some(e => matches(proofClaim).some(p => matches(understanding).some(u => {
      const preceding = sentence.slice(Math.max(0, u.index - 30), u.index);
      const isAttainment = /^(?:understanding|comprehension|knowledge|grasp|mastery|proficiency|expertise|certification)$/i.test(u[0]) ||
        /\b(?:you|your|learner|student)\s+(?:(?:really|truly|clearly|fully)\s+)?$/i.test(preceding);
      if (!isAttainment) return false;
      if (e.index < p.index && p.index < u.index) {
        const bridge = sentence.slice(p.index + p[0].length, u.index);
        return !/\b(?:how|where|why|when)\s+to\b|\b(?:so|to|help(?:s|ed)?)\s+(?:you\s+)?$/i.test(bridge);
      }
      if (u.index < p.index && p.index < e.index) return !/\bto\s*$/i.test(preceding);
      return false;
    })));
  });
  return directCertification.test(text) || claimsUnderstanding ?
    'The run and your explanation are useful evidence, but they do not establish mastery. Try another example and explain what changes.' : text;
}

/** One immutable submission per owned attempt. Session holds only display state. */
class TurnController {
  constructor({ session, provider, contextComposer, toolRouter, proposalProvider, captureSubmission, validateSubmission, isSubmissionAuthorized = snapshot => !snapshot.sources.some(s => s.uri !== null), refreshContext = async () => {},
    onCompletedPair = pair => session.recordCompletedPair(pair) }) {
    Object.assign(this, { session, provider, contextComposer, toolRouter, proposalProvider, captureSubmission, validateSubmission, isSubmissionAuthorized, refreshContext, onCompletedPair });
    this.current = null; this.pendingProposal = null; this.disposed = false;
    this.consumed = new Set(); this.generation = session.snapshot().generation;
    this.unsubscribe = session.subscribe(snapshot => {
      if (snapshot.generation !== this.generation) {
        this.generation = snapshot.generation; this.consumed.clear(); this.invalidate('session-reset'); this.current = null;
      }
    });
  }
  live(owner, generation = owner.turn.turnGeneration) {
    return !this.disposed && this.current === owner && this.session.snapshot().generation === owner.generation &&
      owner.turn.turnGeneration === generation && owner.turn.status !== 'cancelled';
  }

  async wait(owner, promise, generation = owner.turn.turnGeneration) {
    const value = await Promise.race([Promise.resolve(promise), owner.cancelled]);
    if (value === CANCELLED || !this.live(owner, generation)) throw CANCELLED;
    return value;
  }

  status(owner, status) {
    owner.turn.status = status;
    this.session.setTurn(owner.turn);
  }

  actionsOff(owner) {
    this.session.invalidateActions(action => !['acceptProposal', 'rejectProposal'].includes(action.type) &&
      (action.args.turnId === owner.turn.id));
  }

  /** Admission, deduplication, captured draft/context and clearing happen before the first await. */
  async submit({ submissionId, text, contextRevision, learnerEntryId } = {}) {
    const state = this.session.snapshot();
    if (this.disposed || this.current?.busy || typeof submissionId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId) ||
      this.consumed.has(submissionId) || typeof text !== 'string' || !text.trim() || contextRevision !== state.context.revision) return { status: 'stale' };
    const prior = learnerEntryId ? this.current : null;
    if (learnerEntryId && (!prior || prior.generation !== state.generation || prior.turn.learnerEntryId !== learnerEntryId ||
      prior.submission.text !== text || !['failed', 'cancelled'].includes(prior.turn.status))) return { status: 'stale' };
    this.consumed.add(submissionId);
    if (this.current) this.actionsOff(this.current);
    const submission = structuredClone({ submissionId, text, inputRevision: state.inputRevision, context: state.context });
    let cancel;
    const owner = { generation: state.generation, snapshot: null, submission, busy: true,
      cancelled: new Promise(resolve => { cancel = resolve; }), cancel: value => cancel(value),
      turn: { id: prior?.turn.id || randomUUID(), submissionId, turnGeneration: (prior?.turn.turnGeneration ?? 0) + 1,
        status: 'preparing', learnerEntryId: learnerEntryId || this.session.appendEntry({ kind: 'learner', status: 'submitted', text }), assistantEntryId: null } };
    this.current = owner;
    if (!prior && state.draft === text && this.session.snapshot().inputRevision === state.inputRevision) this.session.setDraft('');
    this.status(owner, 'preparing'); this.addStop(owner);
    try {
      owner.snapshot = await this.wait(owner, this.captureSubmission(submission));
      if (owner.snapshot.sessionId !== state.sessionId || owner.snapshot.generation !== state.generation ||
        !await this.wait(owner, this.validateSubmission(owner.snapshot))) {
        this.stop({ turnId: owner.turn.id, turnGeneration: owner.turn.turnGeneration }); return { status: 'stale' };
      }
      owner.dependencies = structuredClone(owner.snapshot.dependencies);
      owner.abort = new AbortController();
      owner.turn.assistantEntryId = this.session.appendEntry({ kind: 'assistant', status: 'responding', text: '' });
      const request = owner.snapshot.request;
      const messages = structuredClone(request.messages);
      let toolRounds = 0;
      while (true) {
        if (toolRounds && !await this.wait(owner, this.validateSubmission(owner.snapshot))) throw Object.assign(new Error(), { code: 'stale_context' });
        this.status(owner, 'responding');
        if (!this.isSubmissionAuthorized(owner.snapshot)) throw Object.assign(new Error(), { code: 'stale_context' });
        let terminal, text = '';
        const iterator = this.provider.stream({ request: { ...request, messages: structuredClone(messages) }, signal: owner.abort.signal })[Symbol.asyncIterator]();
        try {
          while (true) {
            const next = await this.wait(owner, iterator.next());
            if (next.done) break;
            const event = next.value;
            if (terminal || !event || !['text', 'complete'].includes(event.type) || typeof event.text !== 'string') throw new ProviderError('malformed_response');
            if (event.type === 'text') {
              text += event.text;
              this.session.updateEntry(owner.turn.assistantEntryId, { text: coachingText(text) });
            } else terminal = event;
          }
        } finally {
          // A stalled provider cannot delay local cancellation settlement.
          if (iterator.return) void Promise.resolve(iterator.return()).catch(() => {});
        }
        if (!terminal || !Array.isArray(terminal.toolCalls) || terminal.toolCalls.length > 4 ||
          !['stop', 'tool_calls'].includes(terminal.finishReason) ||
          (terminal.finishReason === 'tool_calls') !== (terminal.toolCalls.length > 0) ||
          (text && terminal.text !== text)) throw new ProviderError('malformed_response');
        const calls = terminal.toolCalls;
        const ids = new Set();
        for (const call of calls) {
          if (!call || typeof call.id !== 'string' || !call.id || ids.has(call.id) || !TOOL_NAMES.includes(call.name) ||
            !call.arguments || typeof call.arguments !== 'object' || Array.isArray(call.arguments)) throw new ProviderError('malformed_response');
          ids.add(call.id);
        }
        if (!calls.length) { this.complete(owner, coachingText(terminal.text)); break; }
        if (++toolRounds > 4) throw Object.assign(new Error(), { code: 'tool_limit' });
        this.status(owner, 'processing-tools');
        messages.push({ role: 'assistant', content: terminal.text || null, tool_calls: calls.map(call => ({ id: call.id,
          type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments) } })) });
        let proposal;
        for (const call of calls) {
          let result;
          try { result = await this.wait(owner, this.toolRouter.route(call, { snapshot: owner.snapshot })); }
          catch (error) {
            if (error === CANCELLED || ['KNOWLEDGE_LINEAGE_CHANGED'].includes(error?.code)) throw error;
            throw Object.assign(new Error(), { code: Object.hasOwn(SAFE_ERRORS, error?.code) ? error.code : 'tool_failed' });
          }
          if (!await this.wait(owner, this.validateSubmission(owner.snapshot))) throw Object.assign(new Error(), { code: 'stale_context' });
          if (!this.isSubmissionAuthorized(owner.snapshot)) throw Object.assign(new Error(), { code: 'stale_context' });
          if (call.name === 'proposeCodeChange') proposal = result;
          if (call.name === 'searchKafeKnowledge' && result?.status !== 'unavailable') {
            validatePassages(result); assertKnowledgeCoherence(result, owner.snapshot.dependencies.knowledgeLineage);
            owner.dependencies = mergeDependencies([owner.dependencies, { fileUris: [], knowledgeLineage: owner.snapshot.dependencies.knowledgeLineage }]);
          }
          const content = call.name === 'proposeCodeChange' ? 'Proposal prepared for learner review.' :
            result?.status === 'unavailable' ? JSON.stringify({ status: 'unavailable', code: result.code }) :
            call.name === 'searchKafeKnowledge' ? JSON.stringify(result) :
            result === null ? 'No learner-started KAFE run result is available.' : `Source already included: ${call.name === 'getLatestRunResult' ? 'run-result' : call.arguments.sourceId || 'active-file'}`;
          messages.push({ role: 'tool', tool_call_id: call.id, content });
        }
        if (proposal) {
          if (!this.live(owner)) throw CANCELLED;
          if (!this.isSubmissionAuthorized(owner.snapshot)) throw Object.assign(new Error(), { code: 'stale_context' });
          // Stage a target-bound proposal. Only an explicit Review action opens the native diff.
          owner.proposalId = this.proposalProvider?.stage(proposal)?.id;
          if (!owner.proposalId) throw Object.assign(new Error(), { code: 'stale_proposal' });
          this.session.invalidateActions(a => ['acceptProposal', 'rejectProposal'].includes(a.type));
          for (const entry of this.session.snapshot().entries.filter(e => e.kind === 'proposal' && e.status === 'ready')) {
            this.session.updateEntry(entry.id, { status: 'superseded' });
          }
          // Native proposal lifetime can outlive its completed provider turn. Keep only its
          // operation identity/dependencies; ConversationSession remains its display owner.
          this.pendingProposal = { id: owner.proposalId, fileUris: [...new Set([...owner.snapshot.dependencies.fileUris, proposal.uri])] };
          const entryId = this.session.appendEntry({ kind: 'proposal', status: 'ready', text: 'Review the proposed KAFE change in the native diff.', data: { proposalId: owner.proposalId, turnId: owner.turn.id } });
          this.session.registerAction(entryId, { type: 'rejectProposal', label: 'Dismiss', enabled: true,
            args: { id: owner.proposalId, turnId: owner.turn.id } });
          this.complete(owner, 'A proposed KAFE change is ready. Review the change before applying it.'); break;
        }
      }
      return { status: 'completed' };
    } catch (error) {
      if (error === CANCELLED || !this.live(owner)) return { status: 'cancelled' };
      this.clearProposal(owner);
      if (error?.code === 'stale_context' || error?.code === 'KNOWLEDGE_LINEAGE_CHANGED') {
        this.stop({ turnId: owner.turn.id, turnGeneration: owner.turn.turnGeneration }); return { status: 'stale' };
      }
      this.fail(owner, error, owner.snapshot ? 'tool_failed' : 'context_unavailable');
      return { status: 'failed' };
    } finally { owner.busy = false; }
  }

  addStop(owner) {
    this.session.registerAction(owner.turn.learnerEntryId, { type: 'stopTurn', label: 'Stop', enabled: true,
      args: { turnId: owner.turn.id, turnGeneration: owner.turn.turnGeneration } });
  }

  complete(owner, text) {
    this.session.updateEntry(owner.turn.assistantEntryId, { text, status: 'completed' });
    this.session.invalidateActions(a => a.args.turnId === owner.turn.id && !['acceptProposal', 'rejectProposal'].includes(a.type));
    this.status(owner, 'completed');
    this.onCompletedPair({ id: owner.turn.id, learnerText: owner.submission.text, assistantText: text, dependencies: owner.dependencies });
  }

  fail(owner, error, fallback) {
    const code = error instanceof ProviderError ? error.code : Object.hasOwn(SAFE_ERRORS, error?.code) ? error.code : fallback;
    const text = error instanceof ProviderError ? new ProviderError(code).message : SAFE_ERRORS[code];
    this.actionsOff(owner);
    if (owner.turn.assistantEntryId) this.session.updateEntry(owner.turn.assistantEntryId, { status: 'failed' });
    const entryId = this.session.appendEntry({ kind: 'error', status: 'failed', text, data: { code } });
    const type = ['missing_key', 'auth'].includes(code) ? 'configureProviderKey' : 'retryTurn';
    this.session.registerAction(entryId, { type, label: type === 'configureProviderKey' ? 'Configure key' : 'Retry', enabled: true,
      args: { turnId: owner.turn.id } });
    this.status(owner, 'failed');
  }

  async retry(turnId) {
    const owner = this.current;
    if (this.disposed || !owner || owner.generation !== this.session.snapshot().generation || owner.busy ||
      owner.turn.id !== turnId || !['failed', 'cancelled'].includes(owner.turn.status)) return { status: 'stale' };
    try { await this.refreshContext(); } catch { return { status: 'unavailable', code: 'context_unavailable' }; }
    if (this.disposed || this.current !== owner || owner.generation !== this.session.snapshot().generation || owner.busy) return { status: 'stale' };
    return this.submit({ submissionId: randomUUID(), text: owner.submission.text,
      contextRevision: this.session.snapshot().context.revision, learnerEntryId: owner.turn.learnerEntryId });
  }

  clearProposalId(id) {
    if (!id) return;
    if (this.pendingProposal?.id === id) this.pendingProposal = null;
    try { this.proposalProvider?.clear(id); } catch { /* Safe cleanup only. */ }
    this.session.invalidateActions(a => ['acceptProposal', 'rejectProposal'].includes(a.type) && a.args.id === id);
    for (const entry of this.session.snapshot().entries.filter(e => e.kind === 'proposal' && e.status === 'ready' && e.data.proposalId === id)) {
      this.session.updateEntry(entry.id, { status: 'cancelled' });
    }
  }

  clearProposal(owner) {
    const id = owner.proposalId;
    owner.proposalId = null;
    this.clearProposalId(id);
  }

  stop({ turnId, turnGeneration }) {
    const owner = this.current;
    if (!owner || owner.turn.id !== turnId || owner.turn.turnGeneration !== turnGeneration ||
      !['preparing', 'responding', 'processing-tools'].includes(owner.turn.status)) return false;
    owner.turn.turnGeneration++; owner.turn.status = 'cancelled'; this.actionsOff(owner);
    if (this.session.snapshot().generation === owner.generation) {
      if (owner.turn.assistantEntryId) this.session.updateEntry(owner.turn.assistantEntryId, { status: 'cancelled' });
      this.session.setTurn(owner.turn);
      {
        this.session.registerAction(owner.turn.assistantEntryId || owner.turn.learnerEntryId, { type: 'retryTurn', label: 'Retry', enabled: true, args: { turnId: owner.turn.id } });
      }
    }
    owner.cancel(CANCELLED); this.clearProposal(owner); owner.abort?.abort();
    return true;
  }

  invalidate(reason) {
    const owner = this.current;
    if (!owner) return;
    this.stop({ turnId: owner.turn.id, turnGeneration: owner.turn.turnGeneration });
    this.actionsOff(owner);
    // Focus changes still stop an in-flight request. Settled proposals have their own
    // source-bound lifetime; authorizationEvent separately revokes unauthorized sources.
    if (reason !== 'context-changed') this.clearProposal(owner);
    if (!['source-revoked', 'context-changed'].includes(reason)) this.clearProposalId(this.pendingProposal?.id);
  }

  revokeSource(uri) {
    if (this.pendingProposal?.fileUris.includes(uri)) this.clearProposalId(this.pendingProposal.id);
    if (this.current?.turn.status === 'preparing' || this.current?.snapshot?.dependencies.fileUris.includes(uri)) this.invalidate('source-revoked');
  }
  dispose() { this.invalidate('disposed'); this.disposed = true; this.unsubscribe(); }
}

module.exports = { TurnController, coachingText };
