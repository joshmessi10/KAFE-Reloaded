const { randomUUID } = require('node:crypto');
const { validateRunResult, selectedSourceId } = require('./ToolRouter');
const { ProviderError } = require('./providers/DeepSeekProvider');

function mergeKnowledgeIntoPreview(preview, passages) {
  const messages = preview.payload.messages.map(message => ({ ...message }));
  const sources = preview.sources.map(source => ({ ...source }));
  let changed = false;
  for (const passage of passages) {
    const id = `knowledge:${passage.id}`;
    const prefix = `[Source ${id}]\n`;
    const content = `${prefix}${passage.text}`;
    const sourceIndex = sources.findIndex(source => source.id === id);
    const sourceIncluded = sourceIndex >= 0 && sources[sourceIndex].included;
    const hasExactPayload = messages.some(message => message.content === content);
    if (sourceIncluded && hasExactPayload) continue;

    const label = passage.runtimeVersion && passage.knowledgePackVersion ?
      `${passage.sourceMode === 'development' ? 'Development' : 'Managed'} KAFE runtime ${passage.runtimeVersion} · knowledge pack ${passage.knowledgePackVersion}: ${passage.category}: ${passage.path}` :
      `${passage.category}: ${passage.path}`;
    const source = { id, category: 'knowledge', label, included: true };
    if (sourceIndex >= 0) sources[sourceIndex] = source;
    else sources.push(source);

    const messageIndex = messages.findIndex(message => typeof message.content === 'string' && message.content.startsWith(prefix));
    if (messageIndex >= 0) messages[messageIndex] = { role: 'user', content };
    else {
      let requestIndex = messages.length;
      for (let index = messages.length - 1; index >= 0; index--) {
        if (messages[index].role === 'user' && messages[index].content === preview.draft) {
          requestIndex = index;
          break;
        }
      }
      messages.splice(requestIndex, 0, { role: 'user', content });
    }
    changed = true;
  }
  return changed ? { payload: { ...preview.payload, messages }, sources } : undefined;
}

function coachingText(text) {
  // A run or explanation is evidence, not a certification of the learner's understanding.
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
      if (u.index < p.index && p.index < e.index) {
        return !/\bto\s*$/i.test(preceding);
      }
      return false;
    })));
  });
  if (directCertification.test(text) || claimsUnderstanding) {
    return 'The run and your explanation are useful evidence, but they do not establish mastery. Try another example and explain what changes.';
  }
  return text;
}

class SessionCoordinator {
  constructor({ provider, contextComposer, toolRouter, progressStore, proposalProvider,
    getContext = () => ({}), getWorkspaceRelativeSourcePath = () => null }) {
    this.provider = provider;
    this.contextComposer = contextComposer;
    this.toolRouter = toolRouter;
    this.getContext = getContext;
    this.progressStore = progressStore;
    this.getWorkspaceRelativeSourcePath = getWorkspaceRelativeSourcePath;
    this.proposalProvider = proposalProvider;
    this.state = this.emptyState();
    this.pendingPreview = null;
    this.previewRevision = 0;
    this.sending = false;
    this.acceptingProposalId = null;
    this.lastRunSequence = 0;
    this.progressMutation = Promise.resolve();
    this.includedSourceUris = new Map();
  }

  emptyState() {
    return { goal: '', milestones: [], confirmed: false, messages: [], observations: [], completedChecks: [],
      legacyCompletedCheckIds: [], contextSources: [], preview: null, providerStatus: '', milestoneStatus: '',
      interactionStatus: '', retryAvailable: false, evidence: null, proposal: null };
  }

  restoreProgress() {
    if (!this.progressStore) return;
    const saved = this.progressStore.load();
    this.state = { ...this.emptyState(), goal: saved.goal, milestones: saved.milestones,
      completedChecks: saved.completedChecks, legacyCompletedCheckIds: saved.legacyCompletedCheckIds,
      confirmed: saved.confirmed };
    this.includedSourceUris.clear();
  }

  recordRunResult(result) {
    if (!result) throw new Error('Invalid learner-started KAFE run result.');
    validateRunResult(result);
    if (result.runSequence <= this.lastRunSequence) return false;
    this.lastRunSequence = result.runSequence;
    this.invalidatePreview();
    this.state.evidence = { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode,
      outputTruncated: result.outputTruncated, runtimeVersion: result.runtimeVersion,
      knowledgePackVersion: result.knowledgePackVersion, sourceUri: result.sourceUri,
      runSequence: result.runSequence,
      ...(result.runtimeMode ? { runtimeMode: result.runtimeMode } : {}) };
    const sourcePath = this.getWorkspaceRelativeSourcePath(result.sourceUri);
    if (typeof sourcePath === 'string' && sourcePath.length <= 500 && sourcePath.trim() === sourcePath &&
      !sourcePath.startsWith('/') && !sourcePath.includes('\\') && !sourcePath.includes(':') &&
      !/[\x00-\x1f\x7f]/.test(sourcePath) &&
      sourcePath.split('/').every(segment => segment && segment !== '.' && segment !== '..')) {
      this.state.evidence.sourcePath = sourcePath;
    }
    return true;
  }

  invalidatePreview() {
    this.previewRevision++;
    this.pendingPreview = null;
    this.state.preview = null;
    this.state.retryAvailable = false;
  }

  enqueueProgressMutation(action) {
    const operation = this.progressMutation.then(action);
    this.progressMutation = operation.then(() => {}, () => {});
    return operation;
  }

  contextWithSelections(context) {
    const candidateUris = [...(context.candidateUris || [])];
    const seen = new Set(candidateUris.map(uri => uri.toString()));
    for (const uri of this.includedSourceUris.values()) {
      if (!seen.has(uri.toString())) candidateUris.push(uri);
    }
    return { ...context, candidateUris, includedSourceIds: [...this.includedSourceUris.keys()] };
  }

  async preparePreview(request) {
    const revision = ++this.previewRevision;
    this.pendingPreview = null;
    this.state.preview = null;
    this.state.retryAvailable = false;
    this.state.contextSources = [];
    const context = this.contextWithSelections(await this.getContext());
    context.runResult = this.state.evidence?.sourceUri === context.activeDocument?.uri?.toString() ? this.state.evidence : null;
    const { payload, sources } = await this.contextComposer.compose({
      request, session: this.state, activeDocument: context.activeDocument,
      runResult: context.runResult, candidateUris: context.candidateUris,
      includedSourceIds: context.includedSourceIds,
    });
    if (revision !== this.previewRevision) return this.turn('coaching', 'A newer draft preview is being prepared.');
    const token = randomUUID();
    this.pendingPreview = { token, draft: request, payload, sources, context };
    this.state.contextSources = sources;
    this.state.preview = { token, draft: request, payload };
    return this.turn('coaching', 'Review the request context, then send your message.');
  }

  previewKnowledgeResults(preview, passages) {
    const updated = mergeKnowledgeIntoPreview(preview, passages);
    if (!updated) return undefined;
    const token = randomUUID();
    this.previewRevision++;
    this.pendingPreview = { token, draft: preview.draft, payload: updated.payload,
      sources: updated.sources, context: preview.context, attempted: false };
    this.state.contextSources = updated.sources;
    this.state.preview = { token, draft: preview.draft, payload: updated.payload };
    this.state.retryAvailable = false;
    this.state.providerStatus = 'Additional KAFE knowledge is ready for review.';
    return this.turn('coaching', 'Additional KAFE knowledge was found. Review the updated context preview before sending your message.');
  }

  async handleLearnerMessage(message) {
    if (!message || typeof message.type !== 'string') return this.turn('error', 'Invalid tutor message.');
    if (message.type === 'startSession') {
      if (typeof message.goal !== 'string' || !message.goal.trim()) return this.turn('error', 'Enter a learning goal.');
      const goal = message.goal.trim();
      return this.enqueueProgressMutation(async () => {
        const reset = this.proposalProvider?.prepareClear?.();
        if (reset?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before starting a new session.');
        let savedHistory;
        try { savedHistory = await this.progressStore?.clearSession(); }
        catch {
          reset?.rollback();
          return this.turn('error', 'Tutor progress could not be cleared from this workspace.');
        }
        reset?.commit();
        this.state = this.emptyState();
        this.state.completedChecks = savedHistory?.completedChecks || [];
        this.state.legacyCompletedCheckIds = savedHistory?.legacyCompletedCheckIds || [];
        this.includedSourceUris.clear();
        this.invalidatePreview();
        this.state.goal = goal;
        this.state.milestones = [
          { id: 'explore', text: `Explore ${goal} with a small KAFE example` },
          { id: 'explain', text: 'Explain the expected result' },
          { id: 'run-review', text: 'Run and review the KAFE result yourself' },
        ];
        return this.turn('coaching', 'Review and confirm these milestones before we begin.');
      });
    }
    if (message.type === 'confirmMilestones') {
      if (!Array.isArray(message.milestones) || !message.milestones.length ||
        message.milestones.some(item => !item || typeof item.id !== 'string' || !item.id.trim() ||
          typeof item.text !== 'string' || !item.text.trim()) ||
        new Set(message.milestones.map(item => item.id.trim())).size !== message.milestones.length) {
        return this.turn('error', 'Confirm at least one learning milestone.');
      }
      const state = this.state;
      const milestones = message.milestones.map(item => ({ id: item.id.trim(), text: item.text.trim() }));
      return this.enqueueProgressMutation(async () => {
        if (this.state !== state || !this.state.goal) return this.turn('error', 'Start a learning goal before confirming milestones.');
        const proposed = { ...this.state, milestones, confirmed: true };
        try { await this.progressStore?.save(proposed); }
        catch { return this.turn('error', 'Tutor progress could not be saved in this workspace.'); }
        this.invalidatePreview();
        this.state.milestones = milestones;
        this.state.confirmed = true;
        return this.turn('coaching', 'Milestones confirmed. Tell me where you would like a hint.');
      });
    }
    if (message.type === 'recordReviewedCheck') {
      const evidence = this.state.evidence;
      const state = this.state;
      if (!Number.isSafeInteger(message.runSequence) || message.runSequence < 1 ||
        typeof message.label !== 'string' || !message.label.trim() || message.label.trim().length > 120 ||
        !['passed', 'failed', 'unknown'].includes(message.outcome)) {
        return this.turn('error', 'Enter a short label and select a valid review outcome.');
      }
      if (!this.progressStore) return this.turn('error', 'Tutor progress storage is unavailable.');
      return this.enqueueProgressMutation(async () => {
        if (!evidence || this.state !== state || this.state.evidence !== evidence ||
          evidence.runSequence !== message.runSequence || evidence.reviewedCheckId) {
          return this.turn('error', 'The current run evidence is unavailable or already reviewed.');
        }
        const record = { id: randomUUID(), runSequence: evidence.runSequence, label: message.label.trim(),
          outcome: message.outcome, recordedAt: new Date().toISOString(), runExitCode: evidence.exitCode };
        if (evidence.sourcePath) record.sourcePath = evidence.sourcePath;
        for (const key of ['runtimeVersion', 'knowledgePackVersion']) {
          if (typeof evidence[key] === 'string' && evidence[key].trim() && evidence[key].length <= 64) {
            record[key] = evidence[key];
          }
        }
        const proposed = { ...this.state, completedChecks: [...this.state.completedChecks, record] };
        try { await this.progressStore.save(proposed); }
        catch { return this.turn('error', 'Tutor progress could not be saved in this workspace.'); }
        this.state.completedChecks = proposed.completedChecks;
        evidence.reviewedCheckId = record.id;
        return this.turn('coaching', 'Reviewed check recorded.');
      });
    }
    if (message.type === 'setContextSourceIncluded') {
      if (typeof message.id !== 'string' || !/^selected:[a-f0-9]{64}$/.test(message.id) ||
        typeof message.included !== 'boolean') return this.turn('error', 'Invalid optional context source selection.');
      const current = await this.getContext();
      const candidate = (current.candidateUris || []).find(uri => selectedSourceId(uri) === message.id) ||
        this.includedSourceUris.get(message.id);
      if (!candidate) return this.turn('error', 'Selected source ID is not available.');
      if (message.included === this.includedSourceUris.has(message.id)) return this.turn('coaching', 'Optional context selection is unchanged.');
      if (message.included) this.includedSourceUris.set(message.id, candidate);
      else this.includedSourceUris.delete(message.id);
      this.state.contextSources = this.state.contextSources.map(source => source.id === message.id ? { ...source, included: message.included } : source);
      const draft = this.pendingPreview?.draft;
      this.invalidatePreview();
      if (draft) {
        try { return await this.preparePreview(draft); }
        catch (error) { return this.turn('error', error.message); }
      }
      return this.turn('coaching', 'Optional context selection updated.');
    }
    if (message.type === 'clearProgress') {
      return this.enqueueProgressMutation(async () => {
        const reset = this.proposalProvider?.prepareClear?.();
        if (reset?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before clearing progress.');
        try { await this.progressStore?.clear(); }
        catch {
          reset?.rollback();
          return this.turn('error', 'Tutor progress could not be cleared from this workspace.');
        }
        reset?.commit();
        this.state = this.emptyState();
        this.includedSourceUris.clear();
        this.invalidatePreview();
        return this.turn('coaching', 'Tutor progress cleared.');
      });
    }
    if (message.type === 'rejectProposal') {
      if (!this.state.proposal || message.id !== this.state.proposal.id) return this.turn('error', 'No matching proposal is available.');
      let result;
      try { result = this.proposalProvider?.reject(message.id); }
      catch {
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.');
        if (this.state.proposal?.id === message.id) this.state.proposal = null;
        return this.turn('error', 'The proposal could not be rejected and was discarded.');
      }
      if (result?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.');
      if (result?.status === 'invalid') {
        if (this.state.proposal?.id === message.id) this.state.proposal = null;
        return this.turn('error', 'This proposal is no longer available; another review may be opening.');
      }
      if (result?.status !== 'rejected') {
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before rejecting it.');
        if (this.state.proposal?.id === message.id) this.state.proposal = null;
        return this.turn('error', 'The proposal could not be rejected and was discarded.');
      }
      this.state.proposal = null;
      return this.turn('coaching', 'Proposal rejected.');
    }
    if (message.type === 'acceptProposal') {
      if (!this.state.proposal || message.id !== this.state.proposal.id) return this.turn('error', 'No matching proposal is available.');
      if (this.proposalProvider?.isResetPending?.()) return this.turn('error', 'A progress reset is in progress. Wait before accepting the proposal.');
      if (this.acceptingProposalId === message.id) return this.turn('error', 'Proposal acceptance is in progress.');
      this.acceptingProposalId = message.id;
      let result;
      try { result = await this.proposalProvider?.accept(message.id); }
      catch {
        if (this.proposalProvider?.clear(message.id)?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait for its result.');
        if (this.state.proposal?.id === message.id) this.state.proposal = null;
        return this.turn('error', 'The proposal could not be applied and was discarded.');
      } finally {
        if (this.acceptingProposalId === message.id) this.acceptingProposalId = null;
      }
      if (this.state.proposal?.id === message.id) this.state.proposal = null;
      if (result?.status === 'applied') return this.turn('coaching', 'The reviewed KAFE proposal was applied.');
      if (result?.status === 'cancelled') return this.turn('coaching', 'The proposal was cancelled before any edit.');
      return this.turn('error', result?.status === 'stale' ?
        'The KAFE document changed. The proposal was discarded.' : 'The proposal could not be applied and was discarded.');
    }
    if (message.type === 'retryMessage') {
      if (!this.state.retryAvailable || !this.pendingPreview || message.previewToken !== this.pendingPreview.token) {
        return this.turn('error', 'No reviewed tutor request is available to retry.');
      }
      return this.sendPendingPreview();
    }
    if (message.type !== 'sendMessage' || typeof message.text !== 'string' || !message.text.trim()) return this.turn('error', 'Enter a tutor message.');
    if (!this.state.confirmed) return this.turn('error', 'Confirm your learning milestones first.');
    const request = message.text.trim();
    if (message.phase === 'preview') {
      try { return await this.preparePreview(request); }
      catch (error) { return this.turn('error', error.message); }
    }
    if (message.phase !== undefined || !this.pendingPreview || this.pendingPreview.attempted || message.previewToken !== this.pendingPreview.token ||
      request !== this.pendingPreview.draft) return this.turn('error', 'Review the exact request preview before sending.');
    return this.sendPendingPreview();
  }

  async sendPendingPreview() {
    if (this.sending || !this.pendingPreview) return this.turn('error', 'A tutor request is already in progress or unavailable.');
    const preview = this.pendingPreview;
    const revision = this.previewRevision;
    const isCurrent = () => this.pendingPreview === preview && this.previewRevision === revision;
    const staleTurn = () => this.turn('error', 'This request was superseded by a newer context preview.');
    this.sending = true;
    preview.attempted = true;
    let proposal;
    let stagedProposalId;
    try {
      const { payload, sources, context } = preview;
      const request = preview.draft;
      this.state.retryAvailable = false;
      this.state.providerStatus = 'Contacting DeepSeek…';
      const messages = [...payload.messages];
      let response;
      for (let round = 0; round < 4; round++) {
        response = await this.provider.complete({ messages: [...messages], tools: payload.tools, signal: context.signal });
        if (!isCurrent()) return staleTurn();
        if (!response || typeof response.text !== 'string' || !Array.isArray(response.toolCalls) || response.toolCalls.length > 4) {
          throw new Error('Provider response is invalid.');
        }
        if (!response.toolCalls.length) break;
        if (!this.toolRouter) throw new Error('Tutor tool router is unavailable.');
        const ids = new Set();
        for (const call of response.toolCalls) {
          if (!call || typeof call.id !== 'string' || !call.id || ids.has(call.id)) throw new Error('Provider tool call ID is invalid.');
          ids.add(call.id);
        }
        messages.push({ role: 'assistant', content: response.text || null, tool_calls: response.toolCalls.map(call => ({
          id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })) });
        for (const call of response.toolCalls) {
          const result = await this.toolRouter.route(call, context);
          if (!isCurrent()) return staleTurn();
          if (call.name === 'proposeCodeChange') {
            proposal = result;
            messages.push({ role: 'tool', tool_call_id: call.id, content: 'Proposal prepared for learner review.' });
          } else if (call.name === 'searchKafeKnowledge') {
            const passages = result;
            const unreviewed = passages.filter(passage => {
              const id = `knowledge:${passage.id}`;
              return !sources.some(source => source.id === id && source.included) ||
                !payload.messages.some(message => message.content === `[Source ${id}]\n${passage.text}`);
            });
            if (unreviewed.length) return this.previewKnowledgeResults(preview, unreviewed);
            const content = passages.map(passage => `Source already included: knowledge:${passage.id}`).join('\n\n');
            messages.push({ role: 'tool', tool_call_id: call.id, content: content || 'No matching KAFE knowledge passage.' });
          } else {
            const sourceId = call.name === 'getLatestRunResult' ? 'run-result' :
              (call.arguments?.sourceId || 'active-file');
            messages.push({ role: 'tool', tool_call_id: call.id,
              content: result === null ? 'No learner-started KAFE run result is available.' : `Source already included: ${sourceId}` });
          }
        }
        if (proposal) break;
        if (round === 3) throw new Error('Tutor tool-call limit reached.');
      }
      if (!isCurrent()) return staleTurn();
      const safeText = proposal ? 'A proposed KAFE change is ready in the native diff. Review it before accepting or rejecting.' : coachingText(response.text);
      if (proposal) {
        if (!this.proposalProvider) throw new Error('Proposal review is unavailable.');
        const summary = this.proposalProvider.stage(proposal);
        stagedProposalId = summary.id;
        this.state.proposal = null;
        const opened = await this.proposalProvider.open(summary.id);
        if (!isCurrent()) {
          this.proposalProvider.clear(summary.id);
          return staleTurn();
        }
        if (opened.status !== 'opened') throw new Error('Proposal review could not be opened.');
        this.state.proposal = summary;
      }
      this.state.observations.push(request);
      this.state.messages.push({ role: 'learner', text: request }, { role: 'tutor', text: safeText });
      this.pendingPreview = null;
      this.state.preview = null;
      this.state.providerStatus = 'DeepSeek is ready.';
      return this.turn(proposal ? 'proposal' : 'coaching', safeText);
    } catch (error) {
      if (!isCurrent()) {
        if (stagedProposalId) this.proposalProvider?.clear(stagedProposalId);
        return staleTurn();
      }
      if (error instanceof ProviderError) {
        this.state.providerStatus = error.message;
        this.state.retryAvailable = true;
        return this.turn('error', error.message);
      }
      if (stagedProposalId) this.proposalProvider?.clear(stagedProposalId);
      this.state.retryAvailable = false;
      try { await this.preparePreview(preview.draft); }
      catch {
        this.pendingPreview = null;
        this.state.preview = null;
      }
      this.state.providerStatus = 'The tutor could not complete the request. Review the refreshed context preview before trying again.';
      return this.turn('error', this.state.providerStatus);
    } finally {
      this.sending = false;
    }
  }

  turn(kind, text) {
    return { kind, text, contextSources: this.state.contextSources, ...(this.state.evidence ? { evidence: this.state.evidence } : {}) };
  }
}

module.exports = { SessionCoordinator };
