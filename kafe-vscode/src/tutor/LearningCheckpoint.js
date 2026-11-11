const { validateDependencies } = require('./LearningSession');
const { sourceIdentities } = require('./RequestSnapshot');

const FIELDS = ['kind', 'name', 'learnerProposalSummary', 'tutorProposedAdditions', 'scopeSummary', 'tradeoffs', 'unresolvedChoices', 'sourceIds', 'priorDecisionIds'];
const string = maxLength => ({ type: 'string', maxLength });
const list = maxLength => ({ type: 'array', maxItems: 8, items: { ...string(maxLength), minLength: 1 } });
const CHECKPOINT_SCHEMA = Object.freeze({ type: 'object', additionalProperties: false,
  properties: { kind: { type: 'string', enum: ['design', 'implementation'] }, name: { ...string(120), minLength: 1 },
    learnerProposalSummary: string(2000), tutorProposedAdditions: list(500), scopeSummary: string(2000),
    tradeoffs: list(500), unresolvedChoices: list(500), sourceIds: list(500), priorDecisionIds: list(500) },
  required: FIELDS.filter(key => key !== 'priorDecisionIds') });

function invalid(message) { return Object.assign(new TypeError(message), { diagnosticReason: 'invalid-checkpoint', code: 'invalid_checkpoint' }); }
function validateCheckpoint(input, { snapshot, retrievedSourceIds = [] } = {}) {
  let value;
  try { value = typeof input === 'string' ? JSON.parse(input) : input; } catch { throw invalid('Malformed checkpoint JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !FIELDS.includes(key)) ||
    CHECKPOINT_SCHEMA.required.some(key => !Object.hasOwn(value, key))) throw invalid('Invalid checkpoint fields.');
  value = structuredClone({ ...value, priorDecisionIds: Object.hasOwn(value, 'priorDecisionIds') ? value.priorDecisionIds : [] });
  if (!['design', 'implementation'].includes(value.kind)) throw invalid('Invalid checkpoint kind.');
  for (const [key, max] of [['name', 120], ['learnerProposalSummary', 2000], ['scopeSummary', 2000]]) {
    if (typeof value[key] !== 'string' || Array.from(value[key]).length > max || (key === 'name' && !value[key].trim())) throw invalid('Invalid checkpoint text limit.');
  }
  for (const key of ['tutorProposedAdditions', 'tradeoffs', 'unresolvedChoices', 'sourceIds', 'priorDecisionIds']) {
    if (!Array.isArray(value[key]) || value[key].length > 8 || value[key].some(item => typeof item !== 'string' || !item.trim() || Array.from(item).length > 500)) throw invalid('Invalid checkpoint list limit.');
  }
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 16 * 1024) throw invalid('Checkpoint byte limit reached.');
  if (!snapshot || !Array.isArray(snapshot.sources)) throw invalid('Checkpoint requires an owned snapshot.');
  const sources = new Set([...snapshot.sources.map(s => s.id), ...retrievedSourceIds]);
  const decisions = new Set((snapshot.learning?.decisions || []).map(d => d.id));
  if (value.sourceIds.some(id => !sources.has(id)) || value.priorDecisionIds.some(id => !decisions.has(id))) throw invalid('Checkpoint reference is unavailable.');
  const restricted = snapshot.submission?.context.restricted === true;
  const targets = snapshot.sources.filter(s => ['active-file', 'selected-file'].includes(s.category) && typeof s.uri === 'string' && s.uri.toLowerCase().endsWith('.kf'));
  if ((restricted || !targets.length) && value.kind === 'implementation') throw invalid('Implementation checkpoint requires an authorized KAFE target.');
  if (restricted && value.sourceIds.some(id => {
    const captured = snapshot.sources.find(s => s.id === id);
    return captured ? captured.uri !== null : !(id.startsWith('knowledge:') && retrievedSourceIds.includes(id));
  })) throw invalid('Restricted checkpoint cannot reference files.');
  return Object.freeze(value);
}

/** Complete owned union. IDs label citations; they never choose the dependency closure. */
function checkpointDependencies(snapshot, dependencies = snapshot.dependencies) {
  const files = new Map(), lineages = new Set();
  const add = item => {
    if (item.knowledgeLineage !== null) lineages.add(item.knowledgeLineage);
    for (const file of item.files) {
      const old = files.get(file.uri);
      if (old && (old.version !== file.version || old.contentSha256 !== file.contentSha256)) throw invalid('Conflicting checkpoint identity.');
      files.set(file.uri, structuredClone(file));
    }
  };
  add({ files: sourceIdentities(snapshot), knowledgeLineage: dependencies.knowledgeLineage });
  for (const record of [...(snapshot.learning?.decisions || []), ...(snapshot.learning?.observations || [])]) add(record.dependencies);
  // History owns URI references. Bind them only to admitted current identities; its prose remains historical.
  if (dependencies.fileUris.some(uri => !files.has(uri))) throw invalid('Unknown history source identity.');
  if (lineages.size > 1) throw invalid('Conflicting checkpoint knowledge lineage.');
  return validateDependencies({ files: [...files.values()].sort((a, b) => a.uri.localeCompare(b.uri)), knowledgeLineage: [...lineages][0] ?? null });
}

module.exports = { CHECKPOINT_SCHEMA, validateCheckpoint, checkpointDependencies };
