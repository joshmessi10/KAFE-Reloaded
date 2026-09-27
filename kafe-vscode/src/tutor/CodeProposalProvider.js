const { createHash, randomUUID } = require('node:crypto');
const { MAX_FILE_BYTES } = require('./ToolRouter');

function validSourceUri(uri) {
  return uri?.scheme === 'file' && typeof uri.toString === 'function' &&
    uri.toString().toLowerCase().endsWith('.kf');
}

class CodeProposalProvider {
  constructor({ vscode }) {
    this.vscode = vscode;
    this.pending = null;
  }

  stage(proposal) {
    if (this.pending?.phase === 'applying') throw new Error('A KAFE proposal edit is in progress.');
    if (!validSourceUri(proposal?.uri) || !Number.isSafeInteger(proposal.documentVersion) ||
      proposal.documentVersion < 0 || !/^[a-f0-9]{64}$/i.test(proposal.contentSha256) ||
      typeof proposal.newText !== 'string' || Buffer.byteLength(proposal.newText, 'utf8') > MAX_FILE_BYTES) {
      throw new Error('Invalid KAFE code proposal.');
    }
    const id = randomUUID();
    this.pending = { id, ...proposal, sourceId: proposal.uri.toString(), reviewed: false, phase: 'ready' };
    return { id, description: 'Review proposed KAFE change' };
  }

  proposalUri(id) { return this.vscode.Uri.parse(`kafe-proposal:/${id}`); }

  provideTextDocumentContent(uri) {
    if (uri?.scheme !== 'kafe-proposal' || !this.pending || uri.toString() !== this.proposalUri(this.pending.id).toString()) {
      throw new Error('KAFE proposal is unavailable.');
    }
    return this.pending.newText;
  }

  async open(id) {
    if (!this.pending || id !== this.pending.id) return { status: 'invalid' };
    try {
      await this.vscode.commands.executeCommand('vscode.diff', this.pending.uri, this.proposalUri(id), 'KAFE Tutor Proposal');
      if (!this.pending || this.pending.id !== id) return { status: 'invalid' };
      this.pending.reviewed = true;
      return { status: 'opened' };
    } catch {
      this.clear(id);
      return { status: 'failed' };
    }
  }

  reject(id) {
    if (!this.pending || id !== this.pending.id) return { status: 'invalid' };
    if (this.pending.phase === 'applying') return { status: 'busy' };
    this.clear(id);
    return { status: 'rejected' };
  }

  clear(id) {
    if (id !== undefined && this.pending?.id !== id) return { status: 'invalid' };
    if (this.pending?.phase === 'applying') return { status: 'busy' };
    this.pending = null;
    return { status: 'cleared' };
  }

  async accept(id) {
    if (!this.pending || id !== this.pending.id || !this.pending.reviewed || this.pending.phase !== 'ready') return { status: 'invalid' };
    const proposal = this.pending;
    proposal.phase = 'reading';
    const discard = () => { if (this.pending === proposal) this.clear(); };
    try {
      const document = await this.vscode.workspace.openTextDocument(proposal.uri);
      if (this.pending !== proposal || proposal.phase !== 'reading') return { status: 'cancelled' };
      const text = document.getText();
      const hash = createHash('sha256').update(text, 'utf8').digest('hex');
      if (!validSourceUri(document.uri) || document.uri.toString() !== proposal.sourceId ||
        document.languageId !== 'kafe' || document.version !== proposal.documentVersion ||
        hash !== proposal.contentSha256 || Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES ||
        Buffer.byteLength(proposal.newText, 'utf8') > MAX_FILE_BYTES) {
        discard();
        return { status: 'stale' };
      }
      const edit = new this.vscode.WorkspaceEdit();
      edit.replace(document.uri, new this.vscode.Range(document.positionAt(0), document.positionAt(text.length)), proposal.newText);
      if (this.pending !== proposal || proposal.phase !== 'reading') return { status: 'cancelled' };
      proposal.phase = 'applying';
      const applied = await this.vscode.workspace.applyEdit(edit);
      proposal.phase = 'done';
      discard();
      return { status: applied ? 'applied' : 'failed' };
    } catch {
      if (this.pending !== proposal) return { status: 'cancelled' };
      proposal.phase = 'done';
      discard();
      return { status: 'failed' };
    }
  }
}

module.exports = { CodeProposalProvider };
