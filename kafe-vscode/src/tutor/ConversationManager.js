const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { ConversationStore, normalizeContent, exportConversation, conversationFilename } = require('./ConversationStore');
const { DEFAULT_PREFERENCES } = require('./TeachingPolicy');

const UNTITLED = 'New conversation';

class ConversationManager {
  constructor({ coordinator, workspaceState, store = new ConversationStore({ workspaceState }),
    onError = () => {}, onChanged = () => {}, debounceMs = 250, now = () => new Date().toISOString() }) {
    Object.assign(this, { coordinator, store, onError, onChanged, debounceMs, now });
    this.queue = Promise.resolve(); this.revision = 0; this.transitioning = false;
    this.disposed = false; this.blocked = false; this.errorReported = false;
    try {
      const archive = store.load();
      this.records = archive.conversations; this.activeId = archive.activeId;
    } catch {
      this.blocked = true; this.records = []; this.activeId = null;
      queueMicrotask(() => this.report('Saved Tutor conversations could not be read. Existing saved data was preserved; this chat is temporary.'));
    }
    if (!this.records.length) {
      const record = this.createRecord(); this.records.push(record); this.activeId = record.id;
    } else {
      const result = coordinator.restoreConversation(this.record().content);
      if (result.status !== 'completed') throw new Error('Could not restore the selected Tutor conversation.');
    }
    this.observedContentRevision = coordinator.conversationRevision();
    this.unsubscribe = coordinator.subscribe(snapshot => this.changed(snapshot));
    this.notify();
  }

  createRecord() {
    const timestamp = this.now();
    return { id: randomUUID(), title: UNTITLED, createdAt: timestamp, updatedAt: timestamp,
      content: normalizeContent({ draft: '', entries: [], historyPairs: [], preferences: { ...DEFAULT_PREFERENCES } }) };
  }
  record(id = this.activeId) { return this.records.find(record => record.id === id); }
  notify() { try { this.onChanged(structuredClone({ id: this.activeId, title: this.record().title })); } catch {} }
  report(message = 'Tutor conversations could not be saved. Your current chat is still open; try again or export it before closing VS Code.') {
    if (this.errorReported) return;
    this.errorReported = true;
    try { void Promise.resolve(this.onError(message)).catch(() => {}); } catch {}
  }
  capture() {
    const record = this.record(), content = this.coordinator.captureConversation();
    this.observedContentRevision = this.coordinator.conversationRevision();
    const notified = this.contentChanged; this.contentChanged = false;
    if (isDeepStrictEqual(record.content, content)) return false;
    record.content = content;
    if (!notified) record.updatedAt = this.now();
    this.updateTitle(content.entries);
    this.revision++; return true;
  }
  updateTitle(entries) {
    const record = this.record();
    if (record.title !== UNTITLED) return;
    const firstMessage = entries.find(entry => entry.kind === 'learner' && entry.text.trim());
    if (firstMessage) {
      record.title = Array.from(firstMessage.text.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 80).join('') || UNTITLED;
      this.notify();
    }
  }
  changed(snapshot) {
    if (this.disposed || this.restoring) return;
    try {
      const contentRevision = this.coordinator.conversationRevision();
      if (contentRevision !== this.observedContentRevision) {
        this.observedContentRevision = contentRevision;
        this.contentChanged = true; this.record().updatedAt = this.now(); this.revision++;
        this.updateTitle((snapshot || this.coordinator.snapshot()).entries);
      }
      if (!this.contentChanged || this.transitioning || this.blocked) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { void this.flush().catch(() => {}); }, this.debounceMs);
      this.timer.unref?.();
    } catch { this.report(); }
  }
  list() {
    this.capture();
    return this.records.map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  flush() {
    // Shutdown and explicit saves must observe the committed destination, not
    // enqueue a departing-chat snapshot behind a transition's destination write.
    return this.queue.then(() => this.flushCurrent());
  }
  flushCurrent() {
    clearTimeout(this.timer);
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      if (this.blocked) throw new Error('Saved conversation storage is unavailable.');
      do {
        this.capture();
        const revision = this.revision;
        await this.store.save({ activeId: this.activeId, conversations: this.records });
        this.capture();
        if (this.revision === revision) break;
      } while (true);
      clearTimeout(this.timer);
      this.errorReported = false;
    })().catch(error => { this.report(); throw error; }).finally(() => { this.flushing = null; });
    return this.flushing;
  }

  transition(operation, { stopResponse = true, discardActive = false } = {}) {
    const run = async () => {
      if (this.disposed) return { status: 'cancelled' };
      if (this.blocked) { this.report(); return { status: 'failed', code: 'conversation_storage_unavailable' }; }
      const change = operation();
      if (!change) return { status: 'cancelled' };
      if (stopResponse && !this.coordinator.canTransitionConversation()) return { status: 'busy' };
      this.transitioning = true; clearTimeout(this.timer);
      try {
        if (stopResponse && this.coordinator.stopConversationResponse().status === 'busy') return { status: 'busy' };
        if (discardActive) {
          if (this.flushing) { try { await this.flushing; } catch {} }
        } else await this.flushCurrent();
        // Persist the destination before resetting live authority. If a write fails,
        // the departing conversation and its draft are still owned by the live session.
        do {
          if (!discardActive) this.capture();
          const revision = this.revision;
          const records = change.records.map(record => record.id === this.activeId ? { ...record,
            content: this.record().content, updatedAt: record.updatedAt > this.record().updatedAt ? record.updatedAt : this.record().updatedAt } : record);
          change.records = records;
          await this.store.save({ activeId: change.activeId, conversations: records });
          if (!discardActive) this.capture();
          if (revision === this.revision) break;
        } while (true);
        this.restoring = true;
        try {
          if (change.activeId !== this.activeId) {
            const destination = change.records.find(record => record.id === change.activeId);
            const result = this.coordinator.restoreConversation(destination.content);
            if (result.status !== 'completed') {
              await this.store.save({ activeId: this.activeId, conversations: this.records });
              return result;
            }
          }
          this.records = change.records; this.activeId = change.activeId;
          this.observedContentRevision = this.coordinator.conversationRevision();
        } finally { this.restoring = false; }
        this.errorReported = false; this.notify();
        return { status: 'completed', id: this.activeId };
      } catch {
        this.report(); return { status: 'failed', code: 'conversation_save_failed' };
      } finally { this.transitioning = false; this.changed(); }
    };
    const result = this.queue.then(run, run);
    this.queue = result.then(() => {}, () => {});
    return result;
  }
  newConversation() {
    return this.transition(() => {
      const record = this.createRecord();
      return { activeId: record.id, records: [...this.records, record] };
    });
  }
  switchConversation(id) {
    return this.transition(() => id !== this.activeId && this.record(id) ? { activeId: id, records: [...this.records] } : null);
  }
  renameConversation(id, title) {
    if (typeof title !== 'string' || !title.trim() || Array.from(title.trim()).length > 120 || /[\x00-\x1f\x7f]/.test(title)) {
      return Promise.resolve({ status: 'unavailable', code: 'invalid_conversation_title' });
    }
    return this.transition(() => this.record(id) ? { activeId: this.activeId,
      records: this.records.map(record => record.id === id ? { ...record, title: title.trim(), updatedAt: this.now() } : record) } : null, { stopResponse: false });
  }
  deleteConversation(id) {
    return this.transition(() => {
      if (!this.record(id)) return null;
      const records = this.records.filter(record => record.id !== id);
      if (!records.length) records.push(this.createRecord());
      return { records, activeId: id === this.activeId ? records.at(-1).id : this.activeId };
    }, { discardActive: id === this.activeId });
  }
  selectedExport() {
    const record = { ...this.record(), content: { entries: this.coordinator.snapshot().entries } };
    return { id: record.id, title: record.title, filename: conversationFilename(record), json: exportConversation(record) };
  }
  async dispose() {
    if (this.disposed) return;
    clearTimeout(this.timer); this.unsubscribe?.();
    await this.queue;
    try { await this.flush(); } catch { /* The saved archive is preserved; the host already reported the failure. */ }
    this.disposed = true;
  }
}

module.exports = { ConversationManager };
