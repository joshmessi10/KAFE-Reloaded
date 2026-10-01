const PROGRESS_KEY = 'kafeTutor.progress.v2';
const V1_KEY = 'kafeTutor.progress.v1';
const EMPTY_PROGRESS = () => ({ goal: '', milestones: [], completedChecks: [], legacyCompletedCheckIds: [], confirmed: false });
const ROOT_KEYS = ['schemaVersion', 'goal', 'milestones', 'completedChecks', 'legacyCompletedCheckIds'];
const RECORD_KEYS = ['id', 'runSequence', 'label', 'outcome', 'recordedAt', 'runExitCode',
  'sourcePath', 'runtimeVersion', 'knowledgePackVersion'];
const REQUIRED_RECORD_KEYS = RECORD_KEYS.slice(0, 6);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function hasOnlyKeys(value, keys) { return Object.keys(value).every(key => keys.includes(key)); }
function isShortString(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }

function normalizeMilestones(value) {
  if (!Array.isArray(value) || value.length > 20) return null;
  const ids = new Set();
  const milestones = [];
  for (const item of value) {
    if (!isObject(item) || !hasOnlyKeys(item, ['id', 'text']) ||
      !isShortString(item.id, 100) || !isShortString(item.text, 2000) || ids.has(item.id)) return null;
    ids.add(item.id);
    milestones.push({ id: item.id, text: item.text });
  }
  return milestones;
}

function normalizedV1(value) {
  if (!isObject(value) || !hasOnlyKeys(value, ['schemaVersion', 'goal', 'milestones', 'completedChecks']) ||
    value.schemaVersion !== 1 || !isShortString(value.goal, 2000) ||
    !Array.isArray(value.milestones) || !value.milestones.length ||
    !Array.isArray(value.completedChecks) || value.completedChecks.length > 20) return null;
  const milestones = normalizeMilestones(value.milestones);
  if (!milestones || !milestones.length) return null;
  const ids = new Set(milestones.map(item => item.id));
  if (value.completedChecks.some(id => typeof id !== 'string' || !ids.has(id)) ||
    new Set(value.completedChecks).size !== value.completedChecks.length) return null;
  return { goal: value.goal, milestones, completedChecks: [],
    legacyCompletedCheckIds: [...value.completedChecks], confirmed: true };
}

function validSourcePath(path) {
  return isShortString(path, 500) && path === path.trim() &&
    !path.startsWith('/') && !path.includes('\\') && !path.includes(':') &&
    !/[\x00-\x1f\x7f]/.test(path) &&
    path.split('/').every(segment => segment && segment !== '.' && segment !== '..');
}

function normalizedRecord(value) {
  if (!isObject(value) || !hasOnlyKeys(value, RECORD_KEYS) ||
    REQUIRED_RECORD_KEYS.some(key => !Object.hasOwn(value, key)) ||
    typeof value.id !== 'string' || value.id.length > 64 || !UUID.test(value.id) ||
    !Number.isSafeInteger(value.runSequence) || value.runSequence < 1 ||
    !isShortString(value.label, 120) || value.label !== value.label.trim() ||
    !['passed', 'failed', 'unknown'].includes(value.outcome) ||
    typeof value.recordedAt !== 'string' || !ISO_TIMESTAMP.test(value.recordedAt) ||
    Number.isNaN(Date.parse(value.recordedAt)) || new Date(value.recordedAt).toISOString() !== value.recordedAt ||
    !(value.runExitCode === null || Number.isSafeInteger(value.runExitCode)) ||
    (Object.hasOwn(value, 'sourcePath') && !validSourcePath(value.sourcePath)) ||
    (Object.hasOwn(value, 'runtimeVersion') && !isShortString(value.runtimeVersion, 64)) ||
    (Object.hasOwn(value, 'knowledgePackVersion') && !isShortString(value.knowledgePackVersion, 64))) return null;
  const record = {};
  for (const key of RECORD_KEYS) if (Object.hasOwn(value, key)) record[key] = value[key];
  return record;
}

function normalizedV2(value) {
  if (!isObject(value) || Object.keys(value).length !== ROOT_KEYS.length ||
    !ROOT_KEYS.every(key => Object.hasOwn(value, key)) || !hasOnlyKeys(value, ROOT_KEYS) ||
    value.schemaVersion !== 2 || typeof value.goal !== 'string' || value.goal.length > 2000 ||
    !Array.isArray(value.completedChecks) || value.completedChecks.length > 20 ||
    !Array.isArray(value.legacyCompletedCheckIds) || value.legacyCompletedCheckIds.length > 20) return null;
  const milestones = normalizeMilestones(value.milestones);
  if (!milestones) return null;
  const confirmed = value.goal.trim().length > 0;
  if ((confirmed && !milestones.length) || (!confirmed && (value.goal !== '' || milestones.length))) return null;
  const checks = [];
  const ids = new Set();
  for (const item of value.completedChecks) {
    const record = normalizedRecord(item);
    if (!record || ids.has(record.id)) return null;
    ids.add(record.id);
    checks.push(record);
  }
  const legacyIds = value.legacyCompletedCheckIds;
  if (legacyIds.some(id => !isShortString(id, 100)) || new Set(legacyIds).size !== legacyIds.length ||
    (!confirmed && !checks.length && !legacyIds.length)) return null;
  return { schemaVersion: 2, goal: value.goal, milestones,
    completedChecks: checks, legacyCompletedCheckIds: [...legacyIds] };
}

class ProgressStore {
  constructor({ workspaceState }) { this.workspaceState = workspaceState; }

  load() {
    try {
      const v2 = normalizedV2(this.workspaceState.get(PROGRESS_KEY));
      if (v2) return { goal: v2.goal, milestones: v2.milestones, completedChecks: v2.completedChecks,
        legacyCompletedCheckIds: v2.legacyCompletedCheckIds, confirmed: !!v2.goal };
      return normalizedV1(this.workspaceState.get(V1_KEY)) || EMPTY_PROGRESS();
    } catch { return EMPTY_PROGRESS(); }
  }

  async clear() {
    if (normalizedV2(this.workspaceState.get(PROGRESS_KEY))) {
      await this.workspaceState.update(V1_KEY, undefined);
      await this.workspaceState.update(PROGRESS_KEY, undefined);
    } else {
      await this.workspaceState.update(PROGRESS_KEY, undefined);
      await this.workspaceState.update(V1_KEY, undefined);
    }
  }
}

module.exports = { ProgressStore, PROGRESS_KEY };
