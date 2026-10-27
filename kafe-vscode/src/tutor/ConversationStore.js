const { isDeepStrictEqual } = require('node:util');
const { validatePreferences } = require('./TeachingPolicy');

const CONVERSATIONS_KEY = 'kafeTutor.conversations.v1';
const LIMITS = Object.freeze({ conversations: 200, entries: 10000, historyPairs: 5000,
  contentBytes: 4 * 1024 * 1024, archiveBytes: 16 * 1024 * 1024,
  exportBytes: 16 * 1024 * 1024, textBytes: 2 * 1024 * 1024 });
const KINDS = new Set(['learner', 'assistant', 'host', 'proposal', 'checkpoint', 'run', 'error']);
const EMPTY = () => ({ activeId: null, conversations: [] });

function invalid(message) { return new TypeError(`Invalid conversation archive: ${message}`); }
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid(label);
  return value;
}
function text(value, label, max = LIMITS.textBytes, nonblank = false) {
  if (typeof value !== 'string' || (nonblank && !value.trim())) throw invalid(label);
  if (Buffer.byteLength(value, 'utf8') > max) throw new RangeError(`Conversation ${label} size limit reached.`);
  return value;
}
function identity(value, label) {
  text(value, label, 128, true);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)) throw invalid(label);
  return value;
}
function boundedArray(value, label, max) {
  if (!Array.isArray(value)) throw invalid(label);
  if (value.length > max) throw new RangeError(`Conversation ${label} count limit reached.`);
  for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) throw invalid(`${label} contains a missing item`);
  return value;
}
function unique(values, label) {
  if (new Set(values).size !== values.length) throw invalid(`Duplicate ${label}.`);
}
function byteLimit(value, limit, label) {
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > limit) throw new RangeError(`Conversation ${label} size limit reached.`);
}
function projectWithinLimit(values, project, limit, label) {
  let bytes = 2;
  return values.map((value, index) => {
    const item = project(value);
    bytes += Buffer.byteLength(JSON.stringify(item), 'utf8') + (index ? 1 : 0);
    if (bytes > limit) throw new RangeError(`Conversation ${label} size limit reached.`);
    return item;
  });
}
function timestamp(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
    !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw invalid(label);
  return value;
}

// Display summaries are data, never source snapshots, execution evidence or permissions.
function displayData(entry) {
  if (entry.data === null || entry.data === undefined) return null;
  const source = object(entry.data, 'entry display data'), result = {};
  if (entry.kind === 'run' || entry.kind === 'learner' || entry.kind === 'assistant') return null;
  if (Object.hasOwn(source, 'scopeSummary')) result.scopeSummary = text(source.scopeSummary, 'scope summary', 8192);
  if (entry.kind === 'checkpoint' && Object.hasOwn(source, 'checkpoint')) {
    const checkpoint = object(source.checkpoint, 'checkpoint summary'), summary = {};
    if (Object.hasOwn(checkpoint, 'kind')) {
      if (!['design', 'implementation'].includes(checkpoint.kind)) throw invalid('checkpoint kind');
      summary.kind = checkpoint.kind;
    }
    for (const [key, limit] of [['name', 480], ['learnerProposalSummary', 8192], ['scopeSummary', 8192]]) {
      if (Object.hasOwn(checkpoint, key)) summary[key] = text(checkpoint[key], `checkpoint ${key}`, limit);
    }
    for (const key of ['tutorProposedAdditions', 'tradeoffs', 'unresolvedChoices']) {
      if (Object.hasOwn(checkpoint, key)) summary[key] = boundedArray(checkpoint[key], `checkpoint ${key}`, 8)
        .map(item => text(item, `checkpoint ${key}`, 2048, true));
    }
    result.checkpoint = summary;
    for (const key of ['disposition', 'grounding']) {
      if (Object.hasOwn(source, key)) result[key] = text(source[key], `checkpoint ${key}`, 128, true);
    }
  }
  if (entry.kind === 'error' && Object.hasOwn(source, 'code')) {
    if (typeof source.code !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(source.code)) throw invalid('error code');
    result.code = source.code;
  }
  return Object.keys(result).length ? result : null;
}

function normalizeEntry(value) {
  object(value, 'entry');
  if (!KINDS.has(value.kind)) throw invalid('entry kind');
  return { id: identity(value.id, 'entry id'), kind: value.kind,
    status: text(value.status, 'entry status', 128, true), text: text(value.text, 'entry text'),
    data: displayData(value), actions: [] };
}

function normalizePair(value) {
  object(value, 'history pair'); const dependencies = object(value.dependencies, 'history dependencies');
  const fileUris = boundedArray(dependencies.fileUris, 'history source references', 64).map(uri => {
    text(uri, 'history source reference', 16384, true);
    if (!/^file:\/\/.+/.test(uri) || /[\x00-\x1f\x7f]/.test(uri)) throw invalid('history source reference');
    return uri;
  });
  unique(fileUris, 'history source reference');
  return { id: identity(value.id, 'history pair id'), learnerText: text(value.learnerText, 'learner history text'),
    assistantText: text(value.assistantText, 'assistant history text'), dependencies: { fileUris,
      knowledgeLineage: dependencies.knowledgeLineage === null ? null : text(dependencies.knowledgeLineage, 'knowledge lineage', 1024, true) } };
}

/** Detached, inert archive projection shared by capture, persistence and restoration. */
function normalizeContent(value) { return archiveContent(value, 2); }

function archivePreferences(value, version) {
  const preferences = object(value, 'learning preferences');
  const keys = version === 1 ? ['mode', 'level'] : ['mode'];
  if (Object.keys(preferences).length !== keys.length || keys.some(key => !Object.hasOwn(preferences, key)) ||
    !['guided', 'paused'].includes(preferences.mode) ||
    (version === 1 && !['beginner', 'intermediate', 'expert'].includes(preferences.level))) throw invalid('learning preferences');
  return version === 1 ? { mode: preferences.mode, level: preferences.level } : validatePreferences(preferences);
}

function archiveContent(value, version) {
  object(value, 'content');
  const entries = projectWithinLimit(boundedArray(value.entries, 'entries', LIMITS.entries), normalizeEntry, LIMITS.contentBytes, 'content');
  const historyPairs = projectWithinLimit(boundedArray(value.historyPairs, 'history pairs', LIMITS.historyPairs), normalizePair, LIMITS.contentBytes, 'content');
  unique(entries.map(entry => entry.id), 'entry id'); unique(historyPairs.map(pair => pair.id), 'history pair id');
  const result = { draft: text(value.draft, 'draft'), entries, historyPairs, preferences: archivePreferences(value.preferences, version) };
  byteLimit(result, LIMITS.contentBytes, 'content');
  return result;
}

function recordMetadata(value) {
  object(value, 'record');
  const title = text(value.title, 'title', 800, true);
  if (Array.from(title).length > 200 || /[\x00-\x1f\x7f]/.test(title)) throw invalid('title');
  return { id: identity(value.id, 'record id'), title, createdAt: timestamp(value.createdAt, 'creation timestamp'),
    updatedAt: timestamp(value.updatedAt, 'update timestamp') };
}

function normalizeRecord(value, version) {
  return { ...recordMetadata(value), content: archiveContent(value.content, version) };
}

function normalizeArchive(value, version = 2) {
  object(value, 'root');
  const conversations = projectWithinLimit(boundedArray(value.conversations, 'conversations', LIMITS.conversations), record => normalizeRecord(record, version), LIMITS.archiveBytes, 'archive');
  unique(conversations.map(record => record.id), 'conversation id');
  const activeId = value.activeId === null ? null : identity(value.activeId, 'active id');
  if ((conversations.length > 0 && !conversations.some(record => record.id === activeId)) ||
    (conversations.length === 0 && activeId !== null)) throw invalid('active conversation');
  const archive = { schemaVersion: version, activeId, conversations };
  byteLimit(archive, LIMITS.archiveBytes, 'archive');
  return archive;
}

class ConversationStore {
  constructor({ workspaceState } = {}) {
    this.workspaceState = typeof workspaceState?.get === 'function' && typeof workspaceState?.update === 'function' ? workspaceState : null;
    this.memory = undefined; this.pending = Promise.resolve();
  }

  load() {
    const stored = this.workspaceState ? this.workspaceState.get(CONVERSATIONS_KEY) : this.memory;
    if (stored === undefined) return EMPTY();
    object(stored, 'root');
    if (![1, 2].includes(stored.schemaVersion)) throw invalid('schema version');
    byteLimit(stored, LIMITS.archiveBytes, 'archive');
    let normalized = normalizeArchive(stored, stored.schemaVersion);
    // Reject rather than overwrite malformed or unexpectedly extended existing storage.
    if (!isDeepStrictEqual(stored, normalized)) throw invalid('stored fields');
    // Validate original v1 data before removing its level. Loading never writes;
    // the normal serialized save upgrades the single key only on success.
    if (stored.schemaVersion === 1) {
      for (const record of normalized.conversations) record.content.preferences = { mode: record.content.preferences.mode };
      normalized = normalizeArchive(normalized);
    }
    return { activeId: normalized.activeId, conversations: normalized.conversations };
  }

  async save(value) {
    const archive = normalizeArchive(value);
    const operation = this.pending.then(async () => {
      if (this.workspaceState) await this.workspaceState.update(CONVERSATIONS_KEY, archive);
      else this.memory = archive;
    });
    // The caller receives this failure; it must not poison the queue for a retry.
    this.pending = operation.catch(() => {});
    return operation;
  }
}

/** Shareable transcript only; private drafting/provider/authority state stays local. */
function exportConversation(record) {
  const metadata = recordMetadata(record), content = object(record.content, 'export content');
  const visible = boundedArray(content.entries, 'export entries', LIMITS.entries).filter(entry => {
    object(entry, 'export entry');
    return entry.kind !== 'host' || Boolean(entry.data?.scopeSummary);
  });
  const normalized = projectWithinLimit(visible, normalizeEntry, LIMITS.exportBytes, 'export');
  unique(normalized.map(entry => entry.id), 'export entry id');
  const entries = normalized.map(entry => {
    const { id, kind, status, text: message } = entry;
    const data = entry.data ? { ...entry.data } : null;
    if (data) delete data.code;
    return { id, kind, status, text: message, data: data && Object.keys(data).length ? data : null };
  });
  const encoded = JSON.stringify({ format: 'kafe-tutor-conversation', schemaVersion: 1,
    conversation: { ...metadata, entries } }, null, 2) + '\n';
  if (Buffer.byteLength(encoded, 'utf8') > LIMITS.exportBytes) throw new RangeError('Conversation export size limit reached.');
  return encoded;
}

function conversationFilename(record) {
  const value = recordMetadata(record);
  const safe = text => text.replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '-').replace(/^[ .]+|[ .]+$/g, '');
  const title = safe(Array.from(value.title).slice(0, 80).join('')) || 'conversation';
  return `${title}-${safe(value.id).slice(0, 36)}.json`;
}

module.exports = { ConversationStore, CONVERSATIONS_KEY, LIMITS, normalizeContent, exportConversation, conversationFilename };
