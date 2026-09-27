const { randomUUID } = require('node:crypto');
const { validateRunResult } = require('./ToolRouter');
const { ProviderError } = require('./providers/DeepSeekProvider');

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
  constructor({ provider, contextComposer, toolRouter, progressStore, proposalProvider, getContext = () => ({}) }) {
    this.provider = provider;
    this.contextComposer = contextComposer;
    this.toolRouter = toolRouter;
    this.getContext = getContext;
    this.progressStore = progressStore;
    this.proposalProvider = proposalProvider;
    this.state = this.emptyState();
    this.pendingPreview = null;
    this.previewRevision = 0;
    this.sending = false;
    this.acceptingProposalId = null;
    this.lastRunSequence = 0;
  }

  emptyState() {
    return { goal: '', milestones: [], confirmed: false, messages: [], observations: [], completedChecks: [], contextSources: [], preview: null, providerStatus: '', milestoneStatus: '', interactionStatus: '', retryAvailable: false, evidence: null, proposal: null, excludedSourceIds: [] };
  }

  restoreProgress() {
    if (!this.progressStore) return;
    const saved = this.progressStore.load();
    this.state = { ...this.emptyState(), goal: saved.goal, milestones: saved.milestones,
      completedChecks: saved.completedChecks, confirmed: saved.confirmed };
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
    return true;
  }

  invalidatePreview() {
    this.previewRevision++;
    this.pendingPreview = null;
    this.state.preview = null;
    this.state.retryAvailable = false;
  }

  async preparePreview(request) {
    const revision = ++this.previewRevision;
    this.pendingPreview = null;
    this.state.preview = null;
    this.state.retryAvailable = false;
    this.state.contextSources = [];
    const context = await this.getContext();
    context.runResult = this.state.evidence?.sourceUri === context.activeDocument?.uri?.toString() ? this.state.evidence : null;
    const { payload, sources } = await this.contextComposer.compose({
      request, session: this.state, activeDocument: context.activeDocument,
      runResult: context.runResult, selectedUris: context.selectedUris || [],
      excludedSourceIds: this.state.excludedSourceIds,
    });
    if (revision !== this.previewRevision) return this.turn('coaching', 'A newer draft preview is being prepared.');
    const token = randomUUID();
    this.pendingPreview = { token, draft: request, payload, sources, context };
    this.state.contextSources = sources;
    this.state.preview = { token, draft: request, payload };
    return this.turn('coaching', 'Review the request context, then send your message.');
  }

  async handleLearnerMessage(message) {
    if (!message || typeof message.type !== 'string') return this.turn('error', 'Invalid tutor message.');
    if (message.type === 'startSession') {
      if (typeof message.goal !== 'string' || !message.goal.trim()) return this.turn('error', 'Enter a learning goal.');
      if (this.proposalProvider?.clear()?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before starting a new session.');
      try { await this.progressStore?.clear(); }
      catch { return this.turn('error', 'Tutor progress could not be cleared from this workspace.'); }
      this.state = this.emptyState();
      this.invalidatePreview();
      this.state.goal = message.goal.trim();
      this.state.milestones = [
        { id: 'explore', text: `Explore ${this.state.goal} with a small KAFE example` },
        { id: 'explain', text: 'Explain the expected result' },
        { id: 'run-review', text: 'Run and review the KAFE result yourself' },
      ];
      return this.turn('coaching', 'Review and confirm these milestones before we begin.');
    }
    if (message.type === 'confirmMilestones') {
      if (!this.state.goal || !Array.isArray(message.milestones) || !message.milestones.length ||
        message.milestones.some(item => !item || typeof item.id !== 'string' || !item.id.trim() ||
          typeof item.text !== 'string' || !item.text.trim()) ||
        new Set(message.milestones.map(item => item.id.trim())).size !== message.milestones.length) {
        return this.turn('error', 'Confirm at least one learning milestone.');
      }
      this.invalidatePreview();
      this.state.milestones = message.milestones.map(item => ({ id: item.id.trim(), text: item.text.trim() }));
      this.state.confirmed = true;
      try { await this.progressStore?.save(this.state); }
      catch { return this.turn('error', 'Tutor progress could not be saved in this workspace.'); }
      return this.turn('coaching', 'Milestones confirmed. Tell me where you would like a hint.');
    }
    if (message.type === 'removeContextSource') {
      if (typeof message.id !== 'string' || !message.id.startsWith('selected:')) return this.turn('error', 'Only optional selected-file sources can be removed.');
      if (!this.state.excludedSourceIds.includes(message.id)) this.state.excludedSourceIds.push(message.id);
      this.state.contextSources = this.state.contextSources.map(source => source.id === message.id ? { ...source, included: false } : source);
      const draft = this.pendingPreview?.draft;
      this.invalidatePreview();
      if (draft) {
        try { return await this.preparePreview(draft); }
        catch (error) { return this.turn('error', error.message); }
      }
      return this.turn('coaching', 'Optional context source removed.');
    }
    if (message.type === 'clearProgress') {
      if (this.proposalProvider?.clear()?.status === 'busy') return this.turn('error', 'A proposal edit is in progress. Wait before clearing progress.');
      this.state = this.emptyState();
      this.invalidatePreview();
      try { await this.progressStore?.clear(); }
      catch { return this.turn('error', 'Tutor progress could not be cleared from this workspace.'); }
      return this.turn('coaching', 'Tutor progress cleared.');
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
    this.sending = true;
    this.pendingPreview.attempted = true;
    let proposal;
    let stagedProposalId;
    try {
      const { payload, sources, context } = this.pendingPreview;
      const request = this.pendingPreview.draft;
      this.state.retryAvailable = false;
      this.state.providerStatus = 'Contacting DeepSeek…';
      const messages = [...payload.messages];
      let response;
      for (let round = 0; round < 4; round++) {
        response = await this.provider.complete({ messages: [...messages], tools: payload.tools, signal: context.signal });
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
          const result = await this.toolRouter.route(call, {
            ...context, excludedSourceIds: this.state.excludedSourceIds,
          });
          if (call.name === 'proposeCodeChange') {
            proposal = result;
            messages.push({ role: 'tool', tool_call_id: call.id, content: 'Proposal prepared for learner review.' });
          } else if (call.name === 'searchKafeKnowledge') {
            const passages = result;
            const content = passages.map(passage => {
              const id = `knowledge:${passage.id}`;
              if (!sources.some(source => source.id === id && source.included) ||
                !payload.messages.some(message => message.content === `[Source ${id}]\n${passage.text}`)) {
                throw new Error('Knowledge search requires a new visible preview before further provider calls.');
              }
              return `Source already included: ${id}`;
            }).join('\n\n');
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
      this.state.observations.push(request);
      const safeText = proposal ? 'A proposed KAFE change is ready in the native diff. Review it before accepting or rejecting.' : coachingText(response.text);
      this.state.messages.push({ role: 'learner', text: request }, { role: 'tutor', text: safeText });
      if (proposal) {
        if (!this.proposalProvider) throw new Error('Proposal review is unavailable.');
        const summary = this.proposalProvider.stage(proposal);
        stagedProposalId = summary.id;
        this.state.proposal = null;
        const opened = await this.proposalProvider.open(summary.id);
        if (opened.status !== 'opened') throw new Error('Proposal review could not be opened.');
        this.state.proposal = summary;
      }
      this.pendingPreview = null;
      this.state.preview = null;
      this.state.providerStatus = 'DeepSeek is ready.';
      return this.turn(proposal ? 'proposal' : 'coaching', safeText);
    } catch (error) {
      if (error instanceof ProviderError) {
        this.state.providerStatus = error.message;
        this.state.retryAvailable = true;
        return this.turn('error', error.message);
      }
      this.state.providerStatus = 'The tutor could not complete the request. A new context preview is required before trying again.';
      if (stagedProposalId) this.proposalProvider?.clear(stagedProposalId);
      this.state.retryAvailable = false;
      this.pendingPreview = null;
      this.state.preview = null;
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
