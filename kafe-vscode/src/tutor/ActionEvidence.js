const { createHash } = require('node:crypto');
const MAX_ACTION_RECORDS = 32;
const MAX_ACTION_BYTES = 64 * 1024;
const MAX_ACTION_RECORD_BYTES = 8 * 1024;
const digest = value => createHash('sha256').update(value).digest('hex');
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const identity = file => file && typeof file.uri === 'string' && validHash(file.contentSha256) && Number.isSafeInteger(file.version) ?
  { uri: file.uri, version: file.version, contentSha256: file.contentSha256 } : null;
const size = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

function runObservation(result, savedIdentity = null, currentDocumentHash = null, othersChanged = false) {
  const launch = validHash(result.sourceIdentity?.launch) ? result.sourceIdentity.launch : null;
  const completion = validHash(result.sourceIdentity?.completion) ? result.sourceIdentity.completion : null;
  const saved = validHash(savedIdentity) ? savedIdentity : null;
  const changed = launch && ((completion && launch !== completion) || (saved && launch !== saved));
  return { sourceIdentity: { launch, completion, currentSaved: saved },
    sourceRelationship: changed || othersChanged ? 'changed' : launch && completion && saved ? 'unchanged-at-observed-boundaries' : 'unknown',
    currentDocumentRelationship: launch && validHash(currentDocumentHash) ? launch === currentDocumentHash ? 'same-content' : 'changed' : 'unknown',
    exitOutcome: result.exitCode === null || result.exitCode === undefined ? 'unknown' : 'observed-exit-code',
    runtimeProvenance: result.runtimeVersion ? 'version-attributed' : 'unknown',
    knowledgeLineage: result.dependencies?.knowledgeLineage ?? null,
    correctness: 'not-established', exactExecutedBytes: 'unknown' };
}

/** Memory-only host facts. No provider/webview ingestion API; output remains in its separate 1 MiB owner. */
class ActionEvidence {
  #records = [];
  #omissions = new Map();
  #sequence = 0;
  #revision = 0;
  get revision() { return this.#revision; }
  reset() { this.#records = []; this.#omissions.clear(); this.#sequence = 0; this.#revision++; }
  #omit(reason) { this.#omissions.set(reason, (this.#omissions.get(reason) || 0) + 1); }
  #append(record) {
    record.id = `host-evidence:${++this.#sequence}`;
    if (size(record) > MAX_ACTION_RECORD_BYTES) { this.#omit('record-byte-limit'); this.#revision++; return; }
    this.#records.push(structuredClone(record));
    while (this.#records.length > MAX_ACTION_RECORDS || size(this.#records) > MAX_ACTION_BYTES) {
      this.#omit(this.#records.length > MAX_ACTION_RECORDS ? 'record-limit' : 'byte-limit'); this.#records.shift();
    }
    this.#revision++;
  }
  #proposal(proposal) {
    const grant = proposal?.preparation;
    if (!grant || typeof grant.grantId !== 'string' || !Array.isArray(grant.dependencies?.files) ||
      grant.dependencies.files.some(file => !identity(file)) ||
      !(grant.dependencies.knowledgeLineage === null || typeof grant.dependencies.knowledgeLineage === 'string') ||
      !grant.dependencies.files.some(file => file.uri === proposal.sourceId)) return null;
    return { kind: 'proposal', proposalId: proposal.id, sourceUri: proposal.sourceId,
      scopeSummary: typeof grant.scopeSummary === 'string' ? grant.scopeSummary : '',
      dependencies: structuredClone(grant.dependencies), tested: false, correctness: 'not-established' };
  }
  recordStage(proposal) {
    const record = this.#proposal(proposal); if (record) this.#append({ ...record, outcome: 'staged', observedFile: null });
  }
  recordApply(proposal, outcome, observedFile = null) {
    if (!['applied', 'failed', 'stale', 'cancelled', 'rejected', 'cleared'].includes(outcome)) return;
    const record = this.#proposal(proposal); if (!record) return;
    const observed = identity(observedFile);
    if (outcome === 'applied' && observed?.uri === record.sourceUri) {
      record.dependencies.files = record.dependencies.files.map(file => file.uri === record.sourceUri ? observed : file);
    }
    this.#append({ ...record, outcome, observedFile: observed });
  }
  recordRun(result) {
    if (!result || typeof result.sourceUri !== 'string' || !Number.isSafeInteger(result.runSequence)) return;
    const launch = validHash(result.sourceIdentity?.launch) ? result.sourceIdentity.launch : null;
    const completion = validHash(result.sourceIdentity?.completion) ? result.sourceIdentity.completion : null;
    // Preserve dependencies used to prepare matching applied bytes, even after conversation history ages out.
    const applied = this.#records.findLast(r => r.kind === 'proposal' && r.outcome === 'applied' && r.sourceUri === result.sourceUri && launch && r.observedFile?.contentSha256 === launch);
    this.#append({ kind: 'run', outcome: 'completed', sourceUri: result.sourceUri, runSequence: result.runSequence,
      exitCode: Number.isSafeInteger(result.exitCode) ? result.exitCode : null, outputTruncated: result.outputTruncated === true,
      runtimeVersion: typeof result.runtimeVersion === 'string' ? result.runtimeVersion : null,
      knowledgePackVersion: typeof result.knowledgePackVersion === 'string' ? result.knowledgePackVersion : null,
      sourceIdentity: { launch, completion }, dependencies: applied ? applied.dependencies : { files: [{ uri: result.sourceUri, version: null, contentSha256: launch }], knowledgeLineage: typeof result.knowledgeLineage === 'string' && result.knowledgeLineage ? result.knowledgeLineage : null },
      correctness: 'not-established', exactExecutedBytes: 'unknown' });
  }
  recordRunState(event) {
    if (!['failed', 'cancelled', 'unavailable'].includes(event?.status) || typeof event.sourceUri !== 'string') return;
    this.#append({ kind: 'run-attempt', outcome: event.status, sourceUri: event.sourceUri,
      runSequence: Number.isSafeInteger(event.runSequence) ? event.runSequence : null,
      dependencies: { files: [{ uri: event.sourceUri, version: null, contentSha256: null }], knowledgeLineage: null },
      sourceRelationship: 'unknown', exactExecutedBytes: 'unknown', correctness: 'not-established' });
  }
  selectContext({ authorizedFiles = [], savedIdentities = {}, knowledgeLineage = null } = {}) {
    const files = new Map(authorizedFiles.map(file => [file.uri, file]));
    const records = [], omissions = [...this.#omissions].map(([reason, count]) => ({ reason, count }));
    for (const retained of this.#records) {
      let reason = retained.dependencies.files.some(file => !files.has(file.uri)) ? 'source-revoked' :
        retained.dependencies.knowledgeLineage !== null && retained.dependencies.knowledgeLineage !== knowledgeLineage ? 'knowledge-lineage-changed' : null;
      if (reason) { omissions.push({ id: retained.id, reason }); continue; }
      const record = structuredClone(retained), current = files.get(record.sourceUri);
      if (record.kind === 'run') {
        const othersChanged = record.dependencies.files.some(file => file.uri !== record.sourceUri &&
          (file.version !== files.get(file.uri).version || file.contentSha256 !== files.get(file.uri).contentSha256));
        Object.assign(record, runObservation(record, savedIdentities[record.sourceUri], current?.contentSha256, othersChanged));
      } else if (record.kind === 'proposal') {
        record.sourceRelationship = record.outcome === 'applied' && !record.observedFile ? 'unknown' : record.dependencies.files.every(file =>
          file.version === files.get(file.uri).version && file.contentSha256 === files.get(file.uri).contentSha256) ? 'current' : 'historical-changed';
      }
      records.push(record);
    }
    // Projection labels add bytes. Bound the transmitted records independently of storage.
    while (size({ records, omissions }) > MAX_ACTION_BYTES && records.length) { omissions.push({ id: records.shift().id, reason: 'projection-byte-limit' }); }
    return { records, omissions, byteLength: size({ records, omissions }), dependencies: { fileUris: [...new Set(records.flatMap(r => r.dependencies.files.map(file => file.uri)))].sort(),
      knowledgeLineage: records.find(r => r.dependencies.knowledgeLineage !== null)?.dependencies.knowledgeLineage ?? null } };
  }
}

/** Hash saved bytes without changing the execution path. Read failures are evidence unknowns. */
function savedSourceHash(fileSystem, filePath) {
  try { return digest(fileSystem.readFileSync(filePath)); } catch { return null; }
}
module.exports = { ActionEvidence, savedSourceHash, runObservation, MAX_ACTION_RECORDS, MAX_ACTION_BYTES, MAX_ACTION_RECORD_BYTES };
