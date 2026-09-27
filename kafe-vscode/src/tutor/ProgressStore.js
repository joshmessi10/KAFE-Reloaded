const PROGRESS_KEY = 'kafeTutor.progress.v1';
const EMPTY_PROGRESS = () => ({ goal: '', milestones: [], completedChecks: [], confirmed: false });

function normalizedSummary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).some(key => !['schemaVersion', 'goal', 'milestones', 'completedChecks'].includes(key)) ||
    value.schemaVersion !== 1 || typeof value.goal !== 'string' || !value.goal.trim() || value.goal.length > 2000 ||
    !Array.isArray(value.milestones) || !value.milestones.length || value.milestones.length > 20 ||
    !Array.isArray(value.completedChecks) || value.completedChecks.length > 20) return null;
  const milestones = [];
  const ids = new Set();
  for (const item of value.milestones) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
      Object.keys(item).some(key => !['id', 'text'].includes(key)) ||
      typeof item.id !== 'string' || !item.id.trim() || item.id.length > 100 ||
      typeof item.text !== 'string' || !item.text.trim() || item.text.length > 2000 || ids.has(item.id)) return null;
    ids.add(item.id);
    milestones.push({ id: item.id, text: item.text });
  }
  if (value.completedChecks.some(check => typeof check !== 'string' || !ids.has(check)) ||
    new Set(value.completedChecks).size !== value.completedChecks.length) return null;
  return { schemaVersion: 1, goal: value.goal, milestones, completedChecks: [...value.completedChecks] };
}

class ProgressStore {
  constructor({ workspaceState }) { this.workspaceState = workspaceState; }

  load() {
    try {
      const summary = normalizedSummary(this.workspaceState.get(PROGRESS_KEY));
      return summary ? { goal: summary.goal, milestones: summary.milestones,
        completedChecks: summary.completedChecks, confirmed: true } : EMPTY_PROGRESS();
    } catch { return EMPTY_PROGRESS(); }
  }

  async save(state) {
    if (!state?.confirmed) throw new Error('Only confirmed tutor progress can be saved.');
    const summary = normalizedSummary({ schemaVersion: 1, goal: state.goal,
      milestones: state.milestones?.map(item => ({ id: item.id, text: item.text })),
      completedChecks: state.completedChecks });
    if (!summary) throw new Error('Tutor progress summary is invalid.');
    await this.workspaceState.update(PROGRESS_KEY, summary);
  }

  async clear() { await this.workspaceState.update(PROGRESS_KEY, undefined); }
}

module.exports = { ProgressStore, PROGRESS_KEY };
