const { createHash } = require('node:crypto');

/**
 * @typedef {{messages:object[], tools:object[], model:string, thinking:object, stream:true}} ProviderRequest
 * @typedef {{id:string, category:string, label:string, included:boolean, provenance:object}} SourceDescriptor
 * @typedef {{id:string, uri:string|null, version:number|null, contentSha256:string, text:string, category:string, provenance:object}} SourceSnapshot
 * @typedef {{submission:import('./ConversationSession').Submission, sessionId:string, generation:number, runSequence:number, sources:SourceSnapshot[], history:object, dependencies:object, request:ProviderRequest, fingerprint:string}} RequestSnapshot
 * @typedef {Omit<RequestSnapshot,'fingerprint'>} SnapshotInputs
 */
const FIELDS = ['submission', 'sessionId', 'generation', 'runSequence', 'sources', 'history', 'dependencies', 'request'];
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

function deepFreeze(value) {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) deepFreeze(item); Object.freeze(value); }
  return value;
}

function snapshotData(input) {
  return Object.fromEntries(FIELDS.map(field => [field, input[field]]));
}

function validateSnapshot(source) {
  if (!source || typeof source.id !== 'string' || typeof source.category !== 'string' || typeof source.text !== 'string' ||
    source.contentSha256 !== sha256(source.text) || !source.provenance || typeof source.provenance !== 'object' ||
    !(source.uri === null || (typeof source.uri === 'string' && /^file:\/\/.+/.test(source.uri))) ||
    !(source.version === null || (Number.isSafeInteger(source.version) && source.version >= 0)) ||
    (source.category !== 'run-result' && Buffer.byteLength(source.text, 'utf8') > 64 * 1024)) {
    throw new Error('Captured source snapshot shape or size is invalid.');
  }
  if (source.category === 'run-result') {
    let run;
    try { run = JSON.parse(source.text); } catch { throw new Error('Captured run snapshot shape is invalid.'); }
    if (typeof run.stdout !== 'string' || typeof run.stderr !== 'string' ||
      Buffer.byteLength(run.stdout, 'utf8') + Buffer.byteLength(run.stderr, 'utf8') > 1024 * 1024) throw new Error('Captured run snapshot shape or size is invalid.');
  }
  return source;
}

function validateRequest(request) {
  if (!request || Object.keys(request).some(key => !['messages', 'tools', 'model', 'thinking', 'stream'].includes(key)) ||
    typeof request.model !== 'string' || !request.model.trim() || request.stream !== true ||
    !request.thinking || !['enabled', 'disabled'].includes(request.thinking.type) ||
    Object.keys(request.thinking).some(key => key !== 'type') || !Array.isArray(request.messages) || !Array.isArray(request.tools)) {
    throw new Error('Captured provider request parameters are invalid.');
  }
  if (request.messages.some(message => !message || !['system', 'user', 'assistant'].includes(message.role) ||
    typeof message.content !== 'string' || Object.keys(message).some(key => !['role', 'content'].includes(key)))) {
    throw new Error('Captured initial request cannot contain generated tool envelopes.');
  }
}

function fingerprint(input) {
  const data = snapshotData(input);
  // Display revisions/entries/optional descriptors never authorize a transmission.
  data.dependencies = { ...data.dependencies, fileUris: [...new Set(data.dependencies.fileUris)].sort() };
  return sha256(JSON.stringify(canonical(data)));
}

/** @param {SnapshotInputs} input @returns {RequestSnapshot} */
function createRequestSnapshot(input) {
  const submission = input?.submission;
  if (!input || typeof input.sessionId !== 'string' || !input.sessionId ||
    !submission || typeof submission.submissionId !== 'string' || !submission.submissionId || typeof submission.text !== 'string' || !submission.text.trim() ||
    !Number.isSafeInteger(submission.inputRevision) || submission.inputRevision < 0 ||
    !submission.context || !Number.isSafeInteger(submission.context.revision) || submission.context.revision < 0 ||
    typeof submission.context.restricted !== 'boolean' || !Array.isArray(submission.context.sources) ||
    ['generation', 'runSequence'].some(field => !Number.isSafeInteger(input[field]) || input[field] < 0) ||
    !Array.isArray(input.sources) || !input.history || !input.dependencies || !Array.isArray(input.dependencies.fileUris)) throw new Error('Snapshot inputs are invalid.');
  input.sources.forEach(validateSnapshot);
  validateRequest(input.request);
  const data = structuredClone(snapshotData(input));
  return deepFreeze({ ...data, fingerprint: fingerprint(data) });
}

/** Pure comparison; the composer/host obtains current authorized bytes before calling. */
function isSnapshotCurrent(snapshot, current) {
  try { return Boolean(snapshot?.fingerprint) && snapshot.fingerprint === fingerprint(current); }
  catch { return false; }
}

module.exports = { createRequestSnapshot, isSnapshotCurrent, validateSnapshot, sha256 };
