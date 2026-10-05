const { createHash, randomUUID } = require('node:crypto');
const { MAX_FILE_BYTES } = require('./ToolRouter');

function validSourceUri(uri) {
  return uri?.scheme === 'file' && typeof uri.toString === 'function' &&
    uri.toString().toLowerCase().endsWith('.kf');
}

class CodeProposalProvider {
  constructor({ vscode, authorizeUri = () => true, onEvidence = () => {} }) {
    this.vscode = vscode;
    this.authorizeUri = authorizeUri;
    this.onEvidence = onEvidence;
    this.pending = null;
    this.resetGate = null;
    // Preparation-bearing proposals fail closed unless their host supplies fresh closure authority.
    this.validateAuthority = async proposal => proposal.preparation ? null : () => true;
    this.onAuthorityRevoked = () => {};
  }

  evidence(proposal, outcome, document) {
    let observedFile = null;
    try { if (document?.uri?.toString() === proposal.sourceId) observedFile = { uri: proposal.sourceId, version: document.version,
      contentSha256: createHash('sha256').update(document.getText(), 'utf8').digest('hex') }; } catch { /* Unknown identity preserves native outcome. */ }
    try { this.onEvidence({ proposal, outcome, observedFile }); } catch { /* Evidence cannot overwrite a native action. */ }
  }

  stage(proposal, { isCurrent = () => true } = {}) {
    if (!isCurrent()) throw new Error('KAFE proposal is no longer current.');
    if (typeof proposal?.uri === 'string') {
      const uri = this.vscode.Uri.parse(proposal.uri);
      if (uri.toString() !== proposal.uri) throw new Error('Non-canonical KAFE proposal URI.');
      proposal = { ...proposal, uri };
    }
    if (this.resetGate) throw new Error('A KAFE proposal reset is in progress.');
    if (this.pending?.phase === 'applying') throw new Error('A KAFE proposal edit is in progress.');
    if (!validSourceUri(proposal?.uri) || !this.authorizeUri(proposal.uri) || !Number.isSafeInteger(proposal.documentVersion) ||
      proposal.documentVersion < 0 || !/^[a-f0-9]{64}$/i.test(proposal.contentSha256) ||
      typeof proposal.newText !== 'string' || Buffer.byteLength(proposal.newText, 'utf8') > MAX_FILE_BYTES) {
      throw new Error('Invalid KAFE code proposal.');
    }
    if (!isCurrent()) throw new Error('KAFE proposal is no longer current.');
    const id = randomUUID();
    if (this.pending) this.evidence(this.pending, 'cleared');
    this.pending = { id, ...proposal, sourceId: proposal.uri.toString(), reviewed: false, phase: 'ready' };
    this.evidence(this.pending, 'staged');
    return { id, description: 'Review proposed KAFE change' };
  }

  proposalUri(id) { return this.vscode.Uri.parse(`kafe-proposal:/${id}`); }

  provideTextDocumentContent(uri) {
    if (uri?.scheme !== 'kafe-proposal' || !this.pending || uri.toString() !== this.proposalUri(this.pending.id).toString()) {
      throw new Error('KAFE proposal is unavailable.');
    }
    return this.pending.newText;
  }

  async open(id, { isCurrent = () => true } = {}) {
    if (!isCurrent()) return { status: 'cancelled' };
    if (!this.pending || id !== this.pending.id) return { status: 'invalid' };
    const proposal = this.pending;
    if (!this.authorizeUri(proposal.uri)) { this.discardStale(proposal); return { status: 'stale' }; }
    try {
      const before = await this.validateAuthority(proposal);
      if (!isCurrent() || this.pending !== proposal || this.resetGate) return { status: 'cancelled' };
      if (!before?.()) { this.discardStale(proposal); return { status: 'stale' }; }
      await this.vscode.commands.executeCommand('vscode.diff', proposal.uri, this.proposalUri(id), 'KAFE Tutor Proposal');
      if (!isCurrent()) { this.clear(id); return { status: 'cancelled' }; }
      if (!this.pending || this.pending.id !== id) return { status: 'invalid' };
      const after = await this.validateAuthority(proposal);
      if (!isCurrent() || this.pending !== proposal || this.resetGate) return { status: 'cancelled' };
      if (!this.authorizeUri(proposal.uri) || !after?.()) { this.discardStale(proposal); return { status: 'stale' }; }
      proposal.reviewed = true;
      return { status: 'opened' };
    } catch {
      this.clear(id);
      return { status: 'failed' };
    }
  }

  discardStale(proposal) {
    if (this.pending !== proposal) return;
    try { this.onAuthorityRevoked(proposal); } catch { /* Revocation cannot restore a proposal. */ }
    this.clear(proposal.id);
  }

  reject(id) {
    if (!this.pending || id !== this.pending.id) return { status: 'invalid' };
    if (this.pending.phase === 'applying' || this.resetGate) return { status: 'busy' };
    const proposal = this.pending; this.pending = null; this.evidence(proposal, 'rejected');
    return { status: 'rejected' };
  }

  clear(id) {
    if (id !== undefined && this.pending?.id !== id) return { status: 'invalid' };
    if (this.pending?.phase === 'applying' || this.resetGate) return { status: 'busy' };
    const proposal = this.pending; this.pending = null;
    if (proposal && proposal.phase !== 'done') this.evidence(proposal, 'cleared');
    return { status: 'cleared' };
  }

  isResetPending() { return this.resetGate !== null; }

  prepareClear() {
    if (this.resetGate || this.pending?.phase === 'applying') return { status: 'busy' };
    let release;
    const gate = { promise: new Promise(resolve => { release = resolve; }) };
    this.resetGate = gate;
    const finish = clear => {
      if (this.resetGate !== gate) return;
      if (clear) this.pending = null;
      this.resetGate = null;
      release();
    };
    return { status: 'ready', commit: () => finish(true), rollback: () => finish(false) };
  }

  async accept(id) {
    if (this.resetGate || !this.pending || id !== this.pending.id || !this.pending.reviewed ||
      this.pending.phase !== 'ready') return { status: 'invalid' };
    const proposal = this.pending;
    proposal.phase = 'reading';
    const discard = () => { if (this.pending === proposal) this.clear(); };
    try {
      const document = await this.vscode.workspace.openTextDocument(proposal.uri);
      if (this.resetGate) await this.resetGate.promise;
      if (this.pending !== proposal || proposal.phase !== 'reading') return { status: 'cancelled' };
      const authority = await this.validateAuthority(proposal);
      if (this.pending !== proposal || proposal.phase !== 'reading' || this.resetGate) return { status: 'cancelled' };
      if (typeof authority !== 'function') { this.discardStale(proposal); return { status: 'stale' }; }
      const text = document.getText();
      const hash = createHash('sha256').update(text, 'utf8').digest('hex');
      if (!validSourceUri(document.uri) || !this.authorizeUri(document.uri) || document.uri.toString() !== proposal.sourceId ||
        document.languageId !== 'kafe' || document.version !== proposal.documentVersion ||
        hash !== proposal.contentSha256 || Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES ||
        Buffer.byteLength(proposal.newText, 'utf8') > MAX_FILE_BYTES) {
        discard();
        this.evidence(proposal, 'stale', document);
        return { status: 'stale' };
      }
      const edit = new this.vscode.WorkspaceEdit();
      edit.replace(document.uri, new this.vscode.Range(document.positionAt(0), document.positionAt(text.length)), proposal.newText);
      if (this.pending !== proposal || proposal.phase !== 'reading' || this.resetGate) return { status: 'cancelled' };
      // replace() and authorization hooks may reenter host code. No await between this fence and applyEdit.
      if (!this.authorizeUri(document.uri) || document.version !== proposal.documentVersion ||
        createHash('sha256').update(document.getText(), 'utf8').digest('hex') !== proposal.contentSha256 || !authority() ||
        this.pending !== proposal || proposal.phase !== 'reading' || this.resetGate) {
        this.discardStale(proposal); return { status: 'stale' };
      }
      proposal.phase = 'applying';
      const applied = await this.vscode.workspace.applyEdit(edit);
      proposal.phase = 'done';
      discard();
      this.evidence(proposal, applied ? 'applied' : 'failed', document);
      return { status: applied ? 'applied' : 'failed' };
    } catch {
      if (this.pending !== proposal) return { status: 'cancelled' };
      proposal.phase = 'done';
      discard();
      this.evidence(proposal, 'failed');
      return { status: 'failed' };
    }
  }
}

module.exports = { CodeProposalProvider };
