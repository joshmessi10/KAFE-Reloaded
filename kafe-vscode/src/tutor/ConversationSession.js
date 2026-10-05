const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

/**
 * @typedef {{id:string,uri:string,label:string,category:'active-file'|'selected-file',included:boolean}} SourceChoice
 * @typedef {{revision:number,activeSource:SourceChoice|null,sources:SourceChoice[],restricted:boolean}} ContextSelection
 * sources owns explicit optional inclusion, including an included URI temporarily active.
 * UI projection and request capture omit that active duplicate; URI caches grant no selection authority.
 * @typedef {{submissionId:string,text:string,inputRevision:number,context:ContextSelection}} Submission
 * @typedef {{id:string, kind:'learner'|'assistant'|'host'|'proposal'|'run'|'error', status:string, text:string, actions:Action[], data:object|null}} Entry
 * @typedef {{id:string, type:string, label:string, enabled:boolean, args:object}} Action
 * @typedef {{type:'invokeAction', sessionId:string, generation:number, entryId:string, actionId:string, args:object}} ActionEnvelope
 * @typedef {{entryId:string,actions:Action[]}} ContextActions Host-issued non-transcript Run capabilities; use the existing ActionEnvelope.
 * @typedef {{sessionId:string, generation:number, revision:number, draft:string, inputRevision:number, context:ContextSelection, contextActions:ContextActions, entries:Entry[], turn:Turn|null}} Snapshot
 * @typedef {{fileUris:string[], knowledgeLineage:string|null}} Dependencies
 * @typedef {{id:string, learnerText:string, assistantText:string, dependencies:Dependencies}} HistoryPair
 * @typedef {'preparing'|'responding'|'processing-tools'|'completed'|'cancelled'|'failed'} TurnState
 * @typedef {{id:string, turnGeneration:number, status:TurnState, learnerEntryId:string, assistantEntryId:string|null, submissionId:string}} Turn
 */

const ENTRY_KINDS = new Set(['learner', 'assistant', 'host', 'proposal', 'checkpoint', 'run', 'error']);
const ACTION_TYPES = new Set(['configureProviderKey', 'installRuntime', 'stopTurn', 'retryTurn', 'reviewProposal', 'acceptProposal', 'rejectProposal', 'runFile', 'openTerminal', 'confirmCheckpoint', 'implementCheckpoint', 'discussCheckpoint', 'skipCheckpoint', 'prepareChange']);
const TURN_STATES = new Set(['preparing', 'responding', 'processing-tools', 'completed', 'cancelled', 'failed']);
const ENVELOPE_KEYS = ['type', 'sessionId', 'generation', 'entryId', 'actionId', 'args'];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasExactKeys(value, keys) {
  return isRecord(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function requireText(value, name, nonblank = false) {
  if (typeof value !== 'string' || (nonblank && !value.trim())) throw new TypeError(`Invalid ${name}`);
}

function isJsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if ((!Array.isArray(value) && !isRecord(value)) || ancestors.has(value)) return false;
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const valid = Object.getOwnPropertySymbols(value).length === 0 && Object.values(descriptors)
    .every(descriptor => Object.hasOwn(descriptor, 'value') && isJsonValue(descriptor.value, ancestors));
  ancestors.delete(value);
  return valid;
}

// Host-created display data is deliberately distinct from private request source snapshots.
// The host action/controller owners supply safe display projections, never credentials or transport errors.
function entryFields(entry) {
  if (!isRecord(entry) || !ENTRY_KINDS.has(entry.kind)) throw new TypeError('Invalid entry kind');
  requireText(entry.status, 'entry status', true);
  requireText(entry.text, 'entry text');
  const data = entry.data ?? null;
  if ((data !== null && !isRecord(data)) || !isJsonValue(data)) throw new TypeError('Invalid entry display data');
  return { kind: entry.kind, status: entry.status, text: entry.text, data: structuredClone(data) };
}

class ConversationSession {
  #sessionId = randomUUID();
  #generation = 1;
  #revision = 0;
  #inputRevision = 0;
  #draft = '';
  #context = { revision: 0, activeSource: null, sources: [], restricted: false };
  #contextActions = { entryId: randomUUID(), actions: [] };
  #entries = [];
  #turn = null;
  #actions = new Map();
  #pairs = [];
  #listeners = new Set();

  /** @returns {Snapshot} Detached display projection; registry and history stay host-only. */
  snapshot() {
    return structuredClone({ sessionId: this.#sessionId, generation: this.#generation,
      revision: this.#revision, draft: this.#draft, inputRevision: this.#inputRevision,
      context: this.#context, contextActions: this.#contextActions, entries: this.#entries, turn: this.#turn });
  }

  /** @param {(snapshot:Snapshot)=>void} listener @returns {()=>void} */
  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Invalid session listener');
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #publish() {
    this.#revision += 1;
    // Display observers cannot change an owned host settlement or leave partial authority.
    for (const listener of [...this.#listeners]) { try { listener(this.snapshot()); } catch {} }
  }

  setDraft(text) {
    requireText(text, 'draft');
    if (text === this.#draft) return;
    this.#draft = text;
    this.#inputRevision += 1;
    this.#publish();
  }

  /** Publish metadata only. Context revision is owned here, independent of draft/token updates. */
  setContext(selection) {
    if (!isRecord(selection) || typeof selection.restricted !== 'boolean' || !Array.isArray(selection.sources)) throw new TypeError('Invalid context');
    const choice = (source, category) => {
      if (!isRecord(source) || source.category !== category || typeof source.included !== 'boolean' ||
        typeof source.id !== 'string' || !source.id || typeof source.label !== 'string' ||
        typeof source.uri !== 'string' || !/^file:\/\//.test(source.uri)) throw new TypeError('Invalid context source');
      return { id: source.id, uri: source.uri, label: source.label, category, included: source.included };
    };
    const next = { revision: this.#context.revision, restricted: selection.restricted,
      activeSource: selection.restricted || !selection.activeSource ? null : choice(selection.activeSource, 'active-file'),
      sources: selection.restricted ? [] : selection.sources.map(s => choice(s, 'selected-file')) };
    if (new Set(next.sources.map(s => s.id)).size !== next.sources.length) throw new TypeError('Duplicate context source');
    if (isDeepStrictEqual(next, this.#context)) return;
    next.revision++; this.#context = next; this.#publish();
  }

  setSelectedSources(ids) {
    if (!Array.isArray(ids) || ids.some(id => !this.#context.sources.some(s => s.id === id))) throw new TypeError('Invalid source IDs');
    this.setContext({ ...this.#context, sources: this.#context.sources.map(s => ({ ...s, included: ids.includes(s.id) })) });
  }

  /** Host projection only. Capabilities remain bound to named files when focus changes. */
  setContextRunAction(source, renew = false) {
    if (!source) {
      if (this.#contextActions.actions.length) { this.#contextActions.actions = []; this.#publish(); }
      return;
    }
    if (source.category !== 'active-file' || source.included !== true || typeof source.label !== 'string' ||
      typeof source.uri !== 'string' || !/^file:\/\/.+\.kf$/i.test(source.uri)) throw new TypeError('Invalid contextual Run source');
    const visible = this.#contextActions.actions[0];
    if (visible?.args.targetUri === source.uri && (visible.enabled || !renew)) return;
    const retained = [...this.#actions.values()].find(r => r.contextual && r.action.enabled && r.action.args.targetUri === source.uri);
    if (retained) { this.#contextActions.actions = [retained.action]; this.#publish(); return; }
    this.#contextActions.actions = [];
    this.registerAction(this.#contextActions.entryId, { type: 'runFile', label: `Run ${source.label || source.uri}`,
      enabled: true, args: { targetUri: source.uri } });
  }

  /** @param {Turn|null} turn */
  setTurn(turn) {
    if (turn !== null) {
      if (!isRecord(turn) || !TURN_STATES.has(turn.status) || !Number.isSafeInteger(turn.turnGeneration) || turn.turnGeneration < 0) {
        throw new TypeError('Invalid turn');
      }
      requireText(turn.id, 'turn ID', true);
      requireText(turn.submissionId, 'submission ID', true);
      requireText(turn.learnerEntryId, 'learner entry ID', true);
      for (const field of ['assistantEntryId']) {
        if (turn[field] !== null) requireText(turn[field], field, true);
      }
    }
    const next = turn === null ? null : { id: turn.id, turnGeneration: turn.turnGeneration,
      status: turn.status, learnerEntryId: turn.learnerEntryId, assistantEntryId: turn.assistantEntryId, submissionId: turn.submissionId };
    if (isDeepStrictEqual(next, this.#turn)) return;
    this.#turn = next;
    this.#publish();
  }

  /** @param {Omit<Entry,'id'>} entry @returns {string} */
  appendEntry(entry) {
    const fields = entryFields(entry);
    const id = randomUUID();
    // Only registerAction can issue capabilities; even host display updates cannot inject them.
    this.#entries.push({ id, ...fields, actions: [] });
    this.#publish();
    return id;
  }

  /** @param {string} id @param {Partial<Entry>} patch @returns {boolean} */
  updateEntry(id, patch) {
    const entry = this.#entries.find(value => value.id === id);
    if (!entry) return false;
    if (!isRecord(patch)) throw new TypeError('Invalid entry patch');
    const next = entryFields({ ...entry, ...patch });
    if (isDeepStrictEqual(next, entryFields(entry))) return true;
    Object.assign(entry, next);
    this.#publish();
    return true;
  }

  /** @param {string} entryId @param {Omit<Action,'id'>} action @returns {Action} */
  registerAction(entryId, action) {
    const contextual = entryId === this.#contextActions.entryId;
    const entry = contextual ? { id: entryId, actions: this.#contextActions.actions } : this.#entries.find(value => value.id === entryId);
    if (!entry) throw new TypeError('Unknown action entry');
    if (!isRecord(action) || typeof action.enabled !== 'boolean' || !isRecord(action.args)) throw new TypeError('Invalid action');
    if (!ACTION_TYPES.has(action.type)) throw new TypeError('Invalid action type');
    if (contextual && (action.type !== 'runFile' || Object.keys(action.args).length !== 1 ||
      typeof action.args.targetUri !== 'string' || !/^file:\/\/.+\.kf$/i.test(action.args.targetUri))) throw new TypeError('Invalid contextual action');
    requireText(action.label, 'action label', true);
    if (!isJsonValue(action.args)) throw new TypeError('Invalid action arguments');
    const registered = { id: randomUUID(), type: action.type, label: action.label,
      enabled: action.enabled, args: structuredClone(action.args) };
    entry.actions.push(registered);
    this.#actions.set(registered.id, { action: registered, entryId, generation: this.#generation, contextual });
    this.#publish();
    return structuredClone(registered);
  }

  /** Host presentation only: preserve identity, arguments, generation and enabled state. */
  updateActionLabel(actionId, label) {
    requireText(label, 'action label', true);
    const registered = this.#actions.get(actionId);
    if (!registered || registered.generation !== this.#generation || !registered.action.enabled || registered.action.label === label) return false;
    registered.action.label = label; this.#publish(); return true;
  }

  /** @param {ActionEnvelope} envelope @returns {Action|null} */
  resolveAction(envelope) {
    if (!hasExactKeys(envelope, ENVELOPE_KEYS) || envelope.type !== 'invokeAction' ||
      envelope.sessionId !== this.#sessionId || envelope.generation !== this.#generation || !isRecord(envelope.args)) return null;
    const registered = this.#actions.get(envelope.actionId);
    if (!registered || registered.entryId !== envelope.entryId || registered.generation !== this.#generation ||
      !registered.action.enabled || !isDeepStrictEqual(registered.action.args, envelope.args)) return null;
    return structuredClone(registered.action);
  }

  /** Must be called by the host action owner before awaiting any side effect. */
  consumeAction(actionId) {
    const registered = this.#actions.get(actionId);
    if (!registered || registered.generation !== this.#generation || !registered.action.enabled) return false;
    registered.action.enabled = false;
    this.#publish();
    return true;
  }

  /** @param {(action:Action,entry:Entry)=>boolean} predicate */
  invalidateActions(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('Invalid action predicate');
    let changed = false;
    for (const record of this.#actions.values()) {
      const entry = record.contextual ? { id: record.entryId, kind: 'host', status: 'ready', text: record.action.label,
        data: { contextual: true }, actions: [record.action] } : this.#entries.find(e => e.id === record.entryId);
      if (record.action.enabled && entry && predicate(structuredClone(record.action), structuredClone(entry))) {
        record.action.enabled = false;
        changed = true;
      }
    }
    if (changed) this.#publish();
  }

  /** @param {HistoryPair} pair Dependency eligibility and history bounds belong to ContextComposer. */
  recordCompletedPair(pair) {
    if (!isRecord(pair) || !isRecord(pair.dependencies) || !Array.isArray(pair.dependencies.fileUris) ||
      pair.dependencies.fileUris.some(uri => typeof uri !== 'string') ||
      (pair.dependencies.knowledgeLineage !== null && typeof pair.dependencies.knowledgeLineage !== 'string')) {
      throw new TypeError('Invalid completed history pair');
    }
    requireText(pair.id, 'history pair ID', true);
    requireText(pair.learnerText, 'learner history text');
    requireText(pair.assistantText, 'assistant history text');
    if (this.#pairs.some(existing => existing.id === pair.id)) return;
    this.#pairs.push(structuredClone({ id: pair.id, learnerText: pair.learnerText, assistantText: pair.assistantText,
      dependencies: { fileUris: pair.dependencies.fileUris, knowledgeLineage: pair.dependencies.knowledgeLineage } }));
  }

  /** @returns {HistoryPair[]} */
  historyPairs() { return structuredClone(this.#pairs); }

  reset() {
    this.#generation += 1;
    this.#inputRevision += 1;
    this.#draft = '';
    this.#context = { revision: this.#context.revision + 1, activeSource: null, sources: [], restricted: false };
    this.#contextActions = { entryId: randomUUID(), actions: [] };
    this.#entries = [];
    this.#turn = null;
    this.#actions.clear();
    this.#pairs = [];
    this.#publish();
  }
}

module.exports = { ConversationSession };
