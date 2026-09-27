const assert = require('node:assert/strict');
const test = require('node:test');
const { ProgressStore, PROGRESS_KEY } = require('../../src/tutor/ProgressStore');

function fixture(saved) {
  const values = new Map(saved === undefined ? [] : [[PROGRESS_KEY, saved]]);
  const writes = [];
  const workspaceState = {
    get: key => values.get(key),
    update: async (key, value) => { writes.push([key, value]); if (value === undefined) values.delete(key); else values.set(key, value); },
  };
  return { store: new ProgressStore({ workspaceState }), values, writes };
}

test('save persists only a JSON-safe progress whitelist in workspaceState', async () => {
  const { store, values, writes } = fixture();
  await store.save({ goal: 'Lists', confirmed: true, milestones: [{ id: 'm1', text: 'Index a list', secret: 'omit' }],
    completedChecks: ['m1'], messages: [{ text: 'private transcript' }], providerRequest: 'private payload',
    apiKey: 'fake-secret', evidence: { stdout: 'private output' }, contextSources: [{ uri: 'file:///private.kf' }],
    proposal: { newText: 'private proposal' }, preview: { payload: 'private context' }, providerStatus: 'private status' });
  assert.deepEqual(writes, [[PROGRESS_KEY, { schemaVersion: 1, goal: 'Lists',
    milestones: [{ id: 'm1', text: 'Index a list' }], completedChecks: ['m1'] }]]);
  const serialized = JSON.stringify(values.get(PROGRESS_KEY));
  for (const privateText of ['private transcript', 'private payload', 'fake-secret', 'private output',
    'file:///private.kf', 'private proposal', 'private context', 'private status']) assert.ok(!serialized.includes(privateText));
});

test('load restores confirmed progress only for valid schema and rejects malformed or unsupported summaries', () => {
  const valid = { schemaVersion: 1, goal: 'Lists', milestones: [{ id: 'm1', text: 'Index a list' }], completedChecks: ['m1'] };
  assert.deepEqual(fixture(valid).store.load(), { goal: 'Lists', milestones: valid.milestones,
    completedChecks: ['m1'], confirmed: true });
  for (const value of [undefined, null, 'text', { ...valid, schemaVersion: 2 }, { ...valid, messages: ['leak'] },
    { ...valid, milestones: [] }, { ...valid, completedChecks: [{ text: 'bad' }] },
    { ...valid, milestones: [{ id: 'm1', text: 'One' }, { id: 'm1', text: 'Duplicate' }] }]) {
    assert.deepEqual(fixture(value).store.load(), { goal: '', milestones: [], completedChecks: [], confirmed: false });
  }
});

test('clear removes workspace summary', async () => {
  const { store, values, writes } = fixture({ schemaVersion: 1, goal: 'Lists', milestones: [{ id: 'm1', text: 'One' }], completedChecks: [] });
  await store.clear();
  assert.equal(values.has(PROGRESS_KEY), false);
  assert.deepEqual(writes, [[PROGRESS_KEY, undefined]]);
});
