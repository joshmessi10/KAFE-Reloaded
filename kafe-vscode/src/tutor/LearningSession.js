const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { POLICY_VERSION, DEFAULT_PREFERENCES, validatePreferences } = require('./TeachingPolicy');

const LIMITS = Object.freeze({ decisions: 32, observations: 32, recordBytes: 16 * 1024, stateBytes: 64 * 1024 });
const bytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length ||
    keys.some(key => !Object.hasOwn(value, key))) throw new TypeError(`Invalid ${label} fields.`);
}
function text(value, max, label, nonblank = false) {
  if (typeof value !== 'string' || Array.from(value).length > max || (nonblank && !value.trim())) throw new TypeError(`Invalid ${label} limit.`);
}
function list(value, maxItems, maxChars, label) {
  if (!Array.isArray(value) || value.length > maxItems) throw new TypeError(`Invalid ${label} limit.`);
  value.forEach(item => text(item, maxChars, label, true));
}
function checkpoint(value) {
  exact(value, ['kind', 'name', 'learnerProposalSummary', 'tutorProposedAdditions', 'scopeSummary', 'tradeoffs', 'unresolvedChoices', 'sourceIds', 'priorDecisionIds'], 'checkpoint');
  if (!['design', 'implementation'].includes(value.kind)) throw new TypeError('Invalid checkpoint kind.');
  text(value.name, 120, 'checkpoint name', true);
  for (const key of ['learnerProposalSummary', 'scopeSummary']) text(value[key], 2000, 'checkpoint summary');
  for (const key of ['tutorProposedAdditions', 'tradeoffs', 'unresolvedChoices']) list(value[key], 8, 500, 'checkpoint list');
  for (const key of ['sourceIds', 'priorDecisionIds']) list(value[key], 8, 500, 'checkpoint IDs');
  if (bytes(value) > LIMITS.recordBytes) throw new RangeError('Checkpoint byte size limit reached.');
  return structuredClone(value);
}
function observation(value) {
  exact(value, ['kind', 'text', 'attribution', 'uncertainty', 'status', 'priorDecisionIds'], 'observation');
  if (!['concept', 'reasoning', 'relationship'].includes(value.kind) || !['learner', 'tutor', 'host'].includes(value.attribution) ||
    !(value.kind === 'relationship' ? ['verified', 'proposed', 'confirmed'] : ['observed']).includes(value.status)) throw new TypeError('Invalid observation.');
  text(value.text, 8000, 'observation text', true); text(value.uncertainty, 2000, 'observation uncertainty');
  list(value.priorDecisionIds, 8, 500, 'observation decision IDs');
  return structuredClone(value);
}
function validateDependencies(value) {
  exact(value, ['files', 'knowledgeLineage'], 'learning dependency');
  if (!Array.isArray(value.files) || value.files.length > 64 || !(value.knowledgeLineage === null ||
    (typeof value.knowledgeLineage === 'string' && value.knowledgeLineage.length > 0 && value.knowledgeLineage.length <= 2000))) throw new TypeError('Invalid learning dependencies.');
  for (const file of value.files) {
    exact(file, ['uri', 'version', 'contentSha256'], 'source identity');
    if (typeof file.uri !== 'string' || !/^file:\/\/.+/.test(file.uri) || file.uri.length > 4000 ||
      !Number.isSafeInteger(file.version) || file.version < 0 || !/^[a-f0-9]{64}$/.test(file.contentSha256)) throw new TypeError('Unknown or invalid learning source identity.');
  }
  return structuredClone(value);
}
function mergeIdentities(items) {
  const files = new Map(), lineages = new Set();
  for (const item of items) {
    const validated = validateDependencies(item);
    if (validated.knowledgeLineage !== null) lineages.add(validated.knowledgeLineage);
    for (const file of validated.files) {
      if (files.has(file.uri) && !isDeepStrictEqual(files.get(file.uri), file)) throw new TypeError('Conflicting learning source identity.');
      files.set(file.uri, file);
    }
  }
  if (lineages.size > 1) throw new TypeError('Conflicting learning knowledge lineage.');
  return { files: [...files.values()].sort((a, b) => a.uri.localeCompare(b.uri)), knowledgeLineage: [...lineages][0] ?? null };
}

/** In-memory host records only. No transcripts, credentials, storage, mastery or action grants. */
class LearningSession {
  #preferences = { ...DEFAULT_PREFERENCES };
  #pending = null;
  #revision = 0;
  #decisions = [];
  #observations = [];
  #prepared = new WeakMap();
  #confirmationBudget = null;
  #state(preferences = this.#preferences, decisions = this.#decisions, observations = this.#observations) {
    return { preferences, decisions, observations };
  }
  #check(state, record, prospectiveRevision = this.#revision) {
    if (record && bytes(record) > LIMITS.recordBytes) throw new RangeError('Learning record byte size limit reached.');
    if (bytes(state) > LIMITS.stateBytes || (this.#pending && bytes({ ...state, preferences: this.#pending }) > LIMITS.stateBytes)) {
      throw new RangeError('Total learning-state byte size limit reached.');
    }
    // During synchronous action-consumption notifications, queued preferences
    // cannot spend bytes already required by the pending host adoption.
    if (this.#confirmationBudget) {
      const decision = state.decisions.find(d => d.id === this.#confirmationBudget.id);
      if (decision) {
        const adopted = decision.disposition === 'confirmed' ? decision : { ...decision, disposition: 'confirmed', revision: prospectiveRevision + 1 };
        const reserved = { ...state, decisions: state.decisions.map(d => d.id === adopted.id ? adopted : d) };
        if (bytes(adopted) > LIMITS.recordBytes || bytes(reserved) > LIMITS.stateBytes ||
          (this.#pending && bytes({ ...reserved, preferences: this.#pending }) > LIMITS.stateBytes)) throw new RangeError('Reserved learning confirmation byte size limit reached.');
      }
    }
  }
  snapshot() {
    return structuredClone({ policyVersion: POLICY_VERSION, revision: this.#revision, ...this.#state(), byteLength: bytes(this.#state()) });
  }
  setPreferences(patch, { busy = false } = {}) {
    const preferences = validatePreferences(patch, this.#pending ?? this.#preferences);
    const prospectiveRevision = !busy && !isDeepStrictEqual(preferences, this.#preferences) ? this.#revision + 1 : this.#revision;
    this.#check(this.#state(preferences), null, prospectiveRevision);
    if (busy) { this.#pending = preferences; return { status: 'queued' }; }
    this.#pending = null;
    if (isDeepStrictEqual(preferences, this.#preferences)) return { status: 'unchanged' };
    this.#preferences = preferences; this.#revision++; return { status: 'updated' };
  }
  settlePreferences() {
    return this.#pending ? this.setPreferences(this.#pending) : { status: 'unchanged' };
  }
  #closure(dependencies, ids) {
    // The record bound applies after transitive union, before any state mutation.
    // Context selection can aggregate more identities across independently valid records.
    return validateDependencies(mergeIdentities([dependencies, ...ids.map(id => {
      const decision = this.#decisions.find(d => d.id === id);
      if (!decision) throw new TypeError('Unknown prior learning decision.');
      return decision.dependencies;
    })]));
  }
  prepareDecision(value, dependencies) {
    const content = checkpoint(value);
    if (this.#decisions.length >= LIMITS.decisions) throw new RangeError('Learning decision limit reached.');
    const record = { id: randomUUID(), revision: this.#revision + 1, disposition: 'proposed', summaryAttribution: 'tutor-unconfirmed',
      checkpoint: content, dependencies: this.#closure(dependencies, content.priorDecisionIds) };
    this.#check(this.#state(this.#preferences, [...this.#decisions, record]), record, this.#revision + 1);
    const prepared = freeze(structuredClone(record));
    this.#prepared.set(prepared, this.#revision);
    return prepared;
  }
  /** Prepared host records are inert until the owning response can settle synchronously. */
  commitDecision(prepared) {
    if (!this.#prepared.has(prepared) || this.#prepared.get(prepared) !== this.#revision) throw new TypeError('Invalid or stale prepared learning decision.');
    this.#check(this.#state(this.#preferences, [...this.#decisions, prepared]), prepared, this.#revision + 1);
    this.#prepared.delete(prepared);
    this.#decisions.push(structuredClone(prepared)); this.#revision++;
    return freeze(structuredClone(prepared));
  }
  addDecision(value, dependencies) {
    return this.commitDecision(this.prepareDecision(value, dependencies));
  }
  /** Inert host-only budget token; no learning revision, disposition or preparation grant. */
  reserveConfirmation(id) {
    if (this.#confirmationBudget) throw new TypeError('A learning confirmation is already reserved.');
    const decision = this.#decisions.find(d => d.id === id);
    if (!decision) throw new TypeError('Unknown learning decision.');
    const adopted = decision.disposition === 'confirmed' ? decision : { ...decision, disposition: 'confirmed', revision: this.#revision + 1 };
    this.#check(this.#state(this.#preferences, this.#decisions.map(d => d.id === id ? adopted : d)), adopted);
    const token = Object.freeze({});
    this.#confirmationBudget = { token, id };
    return token;
  }
  releaseConfirmation(token) {
    if (!this.#confirmationBudget || this.#confirmationBudget.token !== token) return false;
    this.#confirmationBudget = null; return true;
  }
  /** Host-confirmed adoption only; never establishes independent authorship or understanding. */
  confirmDecision(id) {
    const decision = this.#decisions.find(d => d.id === id);
    if (!decision) throw new TypeError('Unknown learning decision.');
    if (decision.disposition === 'confirmed') return freeze(structuredClone(decision));
    const next = { ...decision, disposition: 'confirmed', revision: this.#revision + 1 };
    const decisions = this.#decisions.map(d => d.id === id ? next : d);
    this.#check(this.#state(this.#preferences, decisions), next);
    this.#decisions = decisions; this.#revision++; return freeze(structuredClone(next));
  }
  addObservation(value, dependencies) {
    const content = observation(value);
    if (this.#observations.length >= LIMITS.observations) throw new RangeError('Learning observation limit reached.');
    const closure = this.#closure(dependencies, content.priorDecisionIds);
    if (content.kind === 'relationship' && content.status === 'verified' &&
      (content.attribution !== 'host' || (!closure.files.length && closure.knowledgeLineage === null))) throw new TypeError('Verified relationship requires host grounding.');
    if (content.status === 'confirmed' && !content.priorDecisionIds.some(id => this.#decisions.find(d => d.id === id)?.disposition === 'confirmed')) throw new TypeError('Confirmed relationship requires a confirmed decision.');
    const record = { id: randomUUID(), revision: this.#revision + 1, ...content, dependencies: closure };
    this.#check(this.#state(this.#preferences, this.#decisions, [...this.#observations, record]), record, this.#revision + 1);
    this.#observations.push(record); this.#revision++; return freeze(structuredClone(record));
  }
  /** Retain historical records internally; only exact, currently admitted grounding reaches the provider. */
  selectContext({ authorizedFiles = [], knowledgeLineage = null } = {}) {
    const identities = new Map(authorizedFiles.map(file => [file.uri, file]));
    const omissions = [];
    const eligible = record => {
      const reason = record.dependencies.files.some(file => !isDeepStrictEqual(identities.get(file.uri), file)) ? 'source-unavailable-or-changed' :
        record.dependencies.knowledgeLineage !== null && record.dependencies.knowledgeLineage !== knowledgeLineage ? 'knowledge-lineage-changed' : null;
      if (reason) omissions.push({ id: record.id, reason });
      return !reason;
    };
    const decisions = this.#decisions.filter(eligible), observations = this.#observations.filter(eligible);
    const dependencies = mergeIdentities([...decisions, ...observations].map(record => record.dependencies));
    return freeze(structuredClone({ policyVersion: POLICY_VERSION, revision: this.#revision, preferences: this.#preferences, decisions, observations, omissions,
      sourceDependencies: dependencies, dependencies: { fileUris: dependencies.files.map(file => file.uri), knowledgeLineage: dependencies.knowledgeLineage } }));
  }
  reset() {
    this.#preferences = { ...DEFAULT_PREFERENCES }; this.#pending = null; this.#confirmationBudget = null; this.#decisions = []; this.#observations = []; this.#revision++;
  }
}

module.exports = { LearningSession, LIMITS, validateDependencies };
