const assert = require('node:assert/strict');
const test = require('node:test');
const { ProgressStore } = require('../../src/tutor/ProgressStore');

const V1_KEY = 'kafeTutor.progress.v1';
const V2_KEY = 'kafeTutor.progress.v2';
const CHECK = { id: '123e4567-e89b-42d3-a456-426614174000', runSequence: 1,
  label: 'Reviewed the result', outcome: 'failed', recordedAt: '2026-09-28T12:00:00.000Z', runExitCode: 1 };
const EMPTY = { goal: '', milestones: [], completedChecks: [], legacyCompletedCheckIds: [], confirmed: false };

function fixture(saved = {}) {
  const values = new Map(Object.entries(saved));
  const writes = [];
  const workspaceState = {
    get: key => values.get(key),
    update: async (key, value) => { writes.push([key, value]); if (value === undefined) values.delete(key); else values.set(key, value); },
  };
  return { store: new ProgressStore({ workspaceState }), values, writes };
}

function v2(overrides = {}) {
  return { schemaVersion: 2, goal: '', milestones: [], completedChecks: [{ ...CHECK }], legacyCompletedCheckIds: [], ...overrides };
}

test('load migrates v1 milestone IDs into the separate legacy field', () => {
  const old = { schemaVersion: 1, goal: 'Lists', milestones: [{ id: 'm1', text: 'Index a list' }], completedChecks: ['m1'] };
  assert.deepEqual(fixture({ [V1_KEY]: old }).store.load(), { goal: 'Lists', milestones: old.milestones,
    completedChecks: [], legacyCompletedCheckIds: ['m1'], confirmed: true });
});

test('load prefers valid v2 and falls back to v1 when v2 is invalid', () => {
  const old = { schemaVersion: 1, goal: 'Lists', milestones: [{ id: 'm1', text: 'Index a list' }], completedChecks: ['m1'] };
  assert.deepEqual(fixture({ [V2_KEY]: v2(), [V1_KEY]: old }).store.load(),
    { goal: '', milestones: [], completedChecks: [CHECK], legacyCompletedCheckIds: [], confirmed: false });
  assert.deepEqual(fixture({ [V2_KEY]: { ...v2(), messages: ['private'] }, [V1_KEY]: old }).store.load(),
    { goal: 'Lists', milestones: old.milestones, completedChecks: [], legacyCompletedCheckIds: ['m1'], confirmed: true });
});

test('v2 rejects unbounded, duplicate, malformed, and path-traversing records', async () => {
  const bad = [
    v2({ completedChecks: Array.from({ length: 21 }, (_, i) => ({ ...CHECK, id: `123e4567-e89b-42d3-a456-${String(i).padStart(12, '0')}` })) }),
    v2({ completedChecks: [CHECK, { ...CHECK }] }),
    v2({ completedChecks: [{ ...CHECK, id: 'not-a-uuid' }] }),
    v2({ completedChecks: [{ ...CHECK, runSequence: 0 }] }),
    v2({ completedChecks: [{ ...CHECK, runSequence: Number.MAX_SAFE_INTEGER + 1 }] }),
    v2({ completedChecks: [{ ...CHECK, label: 'x'.repeat(121) }] }),
    v2({ completedChecks: [{ ...CHECK, label: ' untrimmed ' }] }),
    v2({ completedChecks: [{ ...CHECK, outcome: 'mastered' }] }),
    v2({ completedChecks: [{ ...CHECK, recordedAt: '2026-09-28' }] }),
    v2({ completedChecks: [{ ...CHECK, runExitCode: 1.5 }] }),
    v2({ completedChecks: [{ ...CHECK, sourcePath: '../private.kf' }] }),
    v2({ completedChecks: [{ ...CHECK, sourcePath: '/absolute.kf' }] }),
    v2({ completedChecks: [{ ...CHECK, sourcePath: 'dir\\private.kf' }] }),
    v2({ completedChecks: [{ ...CHECK, sourcePath: 'x'.repeat(501) }] }),
    v2({ completedChecks: [{ ...CHECK, runtimeVersion: 'x'.repeat(65) }] }),
    v2({ legacyCompletedCheckIds: ['old', 'old'] }),
    v2({ legacyCompletedCheckIds: ['x'.repeat(101)] }),
    v2({ legacyCompletedCheckIds: Array.from({ length: 21 }, (_, i) => `old-${i}`) }),
  ];
  for (const summary of bad) {
    assert.deepEqual(fixture({ [V2_KEY]: summary }).store.load(), EMPTY);
  }
  for (const summary of [v2({ completedChecks: [{ ...CHECK, stdout: 'private output' }] }),
    v2({ milestones: [{ id: 'm1', text: 'Unexpected goal' }] })]) {
    assert.deepEqual(fixture({ [V2_KEY]: summary }).store.load(), EMPTY);
  }
});

test('clear keeps canonical v2 loadable when its deletion fails', async () => {
  const { store, values } = fixture({ [V1_KEY]: { schemaVersion: 1, goal: 'Old',
    milestones: [{ id: 'm1', text: 'Old step' }], completedChecks: ['m1'] }, [V2_KEY]: v2() });
  const update = store.workspaceState.update;
  store.workspaceState.update = async (key, value) => {
    if (key === V2_KEY && value === undefined) throw new Error('v2 delete failed');
    return update(key, value);
  };
  await assert.rejects(store.clear(), /v2 delete failed/);
  assert.deepEqual(store.load().completedChecks, [CHECK]);
  assert.equal(values.has(V2_KEY), true);
});

test('clear keeps valid v1-only progress loadable when v2 deletion fails', async () => {
  const old = { schemaVersion: 1, goal: 'Lists',
    milestones: [{ id: 'm1', text: 'Index a list' }], completedChecks: ['m1'] };
  const { store, values } = fixture({ [V1_KEY]: old });
  const update = store.workspaceState.update;
  store.workspaceState.update = async (key, value) => {
    if (key === V2_KEY && value === undefined) throw new Error('v2 delete failed');
    return update(key, value);
  };
  await assert.rejects(store.clear(), /v2 delete failed/);
  assert.deepEqual(store.load(), { goal: 'Lists', milestones: old.milestones,
    completedChecks: [], legacyCompletedCheckIds: ['m1'], confirmed: true });
  assert.equal(values.has(V1_KEY), true);
});

test('clear removes both workspace summaries', async () => {
  const { store, values } = fixture({ [V1_KEY]: { old: true }, [V2_KEY]: v2() });
  await store.clear();
  assert.equal(values.has(V1_KEY), false);
  assert.equal(values.has(V2_KEY), false);
  assert.deepEqual(store.load(), EMPTY);
});

test('load rejects malformed or unsupported summaries', () => {
  for (const value of [undefined, null, 'text', { ...v2(), schemaVersion: 3 },
    { ...v2(), messages: ['leak'] }, { ...v2(), completedChecks: [], legacyCompletedCheckIds: [] },
    v2({ goal: 'Lists', milestones: [] }), v2({ goal: 'Lists', milestones: [{ id: 'm1', text: 'One' }, { id: 'm1', text: 'Duplicate' }] })]) {
    assert.deepEqual(fixture({ [V2_KEY]: value }).store.load(), EMPTY);
  }
});

test('legacy store cannot save or mutate a new learning session', () => { const f = fixture({ [V2_KEY]: v2() }); assert.equal(typeof f.store.save, 'undefined'); assert.equal(typeof f.store.clearSession, 'undefined'); assert.deepEqual(f.writes, []); });
