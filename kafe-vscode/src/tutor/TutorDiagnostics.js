// Fixed metadata only. Never serialize arguments, snapshots, errors or provider text.
const EVENTS = new Set(['turn-start', 'snapshot-ready', 'provider-start', 'provider-complete',
  'tool-start', 'tool-result', 'tool-failed', 'turn-failed', 'turn-settled', 'view-posted', 'trace-reset']);
const TOOLS = new Set(['readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange', 'proposeLearningCheckpoint']);
const REASONS = new Set(['invalid-arguments', 'invalid-query', 'invalid-source-id', 'source-unavailable',
  'invalid-snapshot', 'restricted-tool', 'unknown-tool', 'invalid-proposal', 'invalid-target', 'invalid-checkpoint', 'unclassified']);
const CODES = new Set(['knowledge_missing', 'knowledge_integrity_failed', 'knowledge_unavailable', 'trust_unavailable',
  'KNOWLEDGE_LINEAGE_CHANGED', 'missing_key', 'auth', 'timeout', 'rate_limit', 'http', 'transport',
  'malformed_response', 'aborted', 'stale_context', 'tool_failed', 'stale_proposal', 'tool_limit',
  'context_unavailable', 'preparation_required', 'invalid_checkpoint', 'learning_limit', 'ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP', 'ESTALE', 'EIO']);
const CATEGORIES = new Set(['validation', 'knowledge-integrity', 'knowledge-availability', 'knowledge-lineage',
  'provider', 'type', 'range', 'internal', 'non-error']);
const STATUSES = new Set(['preparing', 'responding', 'processing-tools', 'completed', 'failed', 'cancelled']);
const PHASES = new Set(['capture', 'validation', 'provider', 'tool', 'tool-validation', 'proposal', 'checkpoint']);

function errorMetadata(error) {
  try {
    const category = REASONS.has(error?.diagnosticReason) ? 'validation' :
      ({ KnowledgeIntegrityError: 'knowledge-integrity', KnowledgeUnavailable: 'knowledge-availability',
        KnowledgeLineageChanged: 'knowledge-lineage', ProviderError: 'provider', TypeError: 'type', RangeError: 'range' })[error?.constructor?.name] ||
      (error instanceof Error ? 'internal' : 'non-error');
    return { errorCategory: category, reason: REASONS.has(error?.diagnosticReason) ? error.diagnosticReason : 'unclassified',
      ...(CODES.has(error?.code) ? { code: error.code } : {}) };
  } catch { return { errorCategory: 'non-error', reason: 'unclassified' }; }
}

function sanitize(record) {
  if (!record || !EVENTS.has(record.event)) return null;
  const safe = { event: record.event };
  for (const key of ['attempt', 'round', 'toolCount', 'sourceCount', 'revision']) {
    if (Number.isSafeInteger(record[key]) && record[key] >= 0) safe[key] = record[key];
  }
  for (const [key, values] of [['tool', TOOLS], ['reason', REASONS], ['errorCategory', CATEGORIES],
    ['code', CODES], ['status', STATUSES], ['phase', PHASES]]) {
    if (values.has(record[key])) safe[key] = record[key];
  }
  for (const key of ['busy', 'current', 'restricted', 'knowledgeReady', 'unavailable', 'delivered']) {
    if (typeof record[key] === 'boolean') safe[key] = record[key];
  }
  return safe;
}

function createTutorDiagnostics(window) {
  let channel, disposed = false, sequence = 0, buffered = 0;
  return {
    record(record) {
      if (disposed) return;
      try {
        const safe = sanitize(record);
        if (!safe || !window?.createOutputChannel) return;
        channel ||= window.createOutputChannel('KAFE Tutor Diagnostics');
        if (buffered >= 256) {
          channel.clear(); buffered = 0;
          channel.appendLine(JSON.stringify({ sequence: ++sequence, event: 'trace-reset' })); buffered++;
        }
        channel.appendLine(JSON.stringify({ sequence: ++sequence, ...safe })); buffered++;
      } catch { /* Observability never changes admission, actions or settlement. */ }
    },
    dispose() { disposed = true; try { channel?.dispose(); } catch {} },
  };
}

module.exports = { createTutorDiagnostics, errorMetadata, sanitize };
