const assert = require('node:assert/strict');
const identity = item => item && `${item.sessionId || 'page'}:${item.context.id}:${item.context.uniqueId || ''}`;
class ContextRegistry {
  constructor() { this.items = []; this.selected = null; this.parents = new Map(); }
  event(message) {
    if (message.method === 'Target.attachedToTarget') this.parents.set(message.params.sessionId, message.sessionId);
    if (message.method === 'Runtime.executionContextCreated') this.items.push({ sessionId: message.sessionId, context: message.params.context });
    if (message.method === 'Runtime.executionContextDestroyed') this.items = this.items.filter(item => item.sessionId !== message.sessionId || item.context.id !== message.params.executionContextId);
    if (message.method === 'Runtime.executionContextsCleared') this.items = this.items.filter(item => item.sessionId !== message.sessionId);
    if (message.method === 'Target.detachedFromTarget') {
      const detached = new Set([message.params.sessionId]);
      let size;
      do { size = detached.size; for (const [child,parent] of this.parents) if (detached.has(parent)) detached.add(child); } while (detached.size !== size);
      this.items = this.items.filter(item => !detached.has(item.sessionId));
      for (const session of detached) this.parents.delete(session);
    }
    if (this.selected && !this.items.some(item => identity(item) === identity(this.selected))) this.selected = null;
  }
  candidates(excludedIdentity) { return [...this.items].reverse().filter(item => identity(item) !== excludedIdentity); }
  select(item) { assert.ok(this.items.some(live => identity(live) === identity(item)), 'Context must still be live'); this.selected = item; }
}
function assertReachableGeometry(webview, native, expected) {
  assert.equal(native.outerWidth, expected.physicalWidth);
  assert.equal(native.outerHeight, expected.physicalHeight);
  if (expected.width !== undefined) assert.equal(webview.width, expected.width);
  assert.ok(Math.abs(webview.ratio - expected.ratio) < 0.02, 'Actual DPR must match requested zoom');
  assert.ok(webview.scrollWidth <= webview.width, 'No horizontal overflow');
  assert.ok(webview.timeline.height > 0, 'Transcript remains visible');
  assert.ok(webview.composer.bottom <= webview.height, 'Composer stays in viewport');
  assert.ok(webview.primary.height > 0 && webview.primary.bottom <= webview.height, 'Primary action stays reachable');
}
function isRenderedSettlement(host, rendered) {
  const turn = host.turn, ack = rendered?.ack;
  return Boolean(['completed', 'failed', 'cancelled'].includes(turn?.status) &&
    ack?.sessionId === host.sessionId && ack.generation === host.generation && ack.revision >= host.revision &&
    rendered.entryIds.includes(turn.learnerEntryId) && (!turn.assistantEntryId ||
      (rendered.entryIds.includes(turn.assistantEntryId) && rendered.lastAssistantEntryId === turn.assistantEntryId)));
}
function projectedEntryIds(snapshot) {
  return snapshot.entries.filter(entry => ['learner', 'assistant', 'checkpoint', 'proposal', 'run', 'error'].includes(entry.kind) ||
    (entry.kind === 'host' && Boolean(entry.data?.scopeSummary))).map(entry => entry.id);
}
module.exports = { ContextRegistry, identity, assertReachableGeometry, isRenderedSettlement, projectedEntryIds };
