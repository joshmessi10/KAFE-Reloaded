const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { Session } = require('node:inspector');
const { performance } = require('node:perf_hooks');
const { SessionCoordinator } = require('../src/tutor/SessionCoordinator');
const { ConversationManager } = require('../src/tutor/ConversationManager');
const { ConversationStore, CONVERSATIONS_KEY } = require('../src/tutor/ConversationStore');

const args = process.argv.slice(2), phase = args[args.indexOf('--phase') + 1], output = args[args.indexOf('--output') + 1];
if (!['before', 'after'].includes(phase) || !args.includes('--output') || !path.isAbsolute(output)) {
  throw Error('Usage: node scripts/profile-conversation.cjs --phase before|after --output <absolute-json-path>');
}
const date = '2026-10-25T12:00:00.000Z';
function fixture(size) {
  const entries = [], historyPairs = [];
  for (let i = 0; i < size / 2; i++) {
    const learnerText = `Question ${String(i).padStart(4, '0')} `.padEnd(128, 'q');
    const assistantText = `Answer ${String(i).padStart(4, '0')} `.padEnd(256, 'a');
    entries.push({ id: `learner-${i}`, kind: 'learner', status: 'completed', text: learnerText, data: null, actions: [] },
      { id: `assistant-${i}`, kind: 'assistant', status: 'completed', text: assistantText, data: null, actions: [] });
    historyPairs.push({ id: `pair-${i}`, learnerText, assistantText, dependencies: { fileUris: [], knowledgeLineage: null } });
  }
  return { schemaVersion: 2, activeId: 'profile-chat', conversations: [{ id: 'profile-chat', title: 'Profile conversation', createdAt: date, updatedAt: date,
    content: { draft: '', entries, historyPairs, preferences: { mode: 'guided' } } }] };
}
const counterTargets = [
  ['sessionSnapshot', 'ConversationSession.js', 'snapshot'], ['coordinatorSnapshot', 'SessionCoordinator.js', 'snapshot'],
  ['captureConversation', 'SessionCoordinator.js', 'captureConversation'], ['managerCapture', 'ConversationManager.js', 'capture'],
  ['normalizeContent', 'ConversationStore.js', 'normalizeContent'], ['archiveContent', 'ConversationStore.js', 'archiveContent'],
  ['normalizeArchive', 'ConversationStore.js', 'normalizeArchive'],
];
async function workload(size, listeners, counter = false) {
  const archive = fixture(size), writes = [];
  const workspaceState = { get: key => key === CONVERSATIONS_KEY ? structuredClone(archive) : undefined,
    async update(key, value) { assert.equal(key, CONVERSATIONS_KEY); writes.push(structuredClone(value)); } };
  // Loading validates each deterministic fixture before the measured operation window.
  new ConversationStore({ workspaceState }).load();
  const coordinator = new SessionCoordinator();
  const manager = new ConversationManager({ coordinator, workspaceState, debounceMs: 60000, now: () => date });
  const unsubscribers = Array.from({ length: listeners }, () => coordinator.subscribe(snapshot => {
    assert.equal(snapshot.entries.length, size); assert.equal(snapshot.context.sources.length, 0);
  }));
  let inspector;
  const post = (method, params = {}) => new Promise((resolve, reject) => inspector.post(method, params, (error, result) => error ? reject(error) : resolve(result)));
  if (counter) {
    inspector = new Session(); inspector.connect(); await post('Profiler.enable');
    await post('Profiler.startPreciseCoverage', { callCount: true, detailed: false });
  }
  const start = performance.now(), draftTimes = [], chunkTimes = [];
  for (let i = 0; i < 100; i++) {
    const begin = performance.now(); coordinator.session.setDraft(`Draft ${String(i).padStart(3, '0')} `.padEnd(128, 'd'));
    draftTimes.push(performance.now() - begin);
  }
  let response = archive.conversations[0].content.entries.at(-1).text;
  for (let i = 0; i < 100; i++) {
    response += 'r'.repeat(64);
    const begin = performance.now(); coordinator.session.updateEntry(`assistant-${size / 2 - 1}`, { text: response, status: 'responding' });
    chunkTimes.push(performance.now() - begin);
  }
  const flushStart = performance.now(); await manager.flush();
  const flushMs = performance.now() - flushStart, totalMs = performance.now() - start;
  let counts;
  if (counter) {
    const coverage = await post('Profiler.takePreciseCoverage');
    counts = Object.fromEntries(counterTargets.map(([label, file, name]) => {
      const script = coverage.result.find(item => item.url.replaceAll('\\', '/').endsWith(`/src/tutor/${file}`));
      const functions = script?.functions.filter(item => item.functionName === name);
      return [label, functions?.length ? functions.reduce((sum, item) => sum + item.ranges[0].count, 0) : null];
    }));
    counts.missingCoverage = counterTargets.filter(([label]) => counts[label] === null).map(([label]) => label);
    await post('Profiler.stopPreciseCoverage'); inspector.disconnect();
  }
  const saved = writes.at(-1).conversations[0].content;
  assert.equal(saved.draft, 'Draft 099 '.padEnd(128, 'd')); assert.equal(saved.entries.at(-1).text, response);
  assert.equal(saved.entries.length, size); assert.equal(saved.historyPairs.length, size / 2);
  const measuredWrites = writes.length;
  unsubscribers.forEach(unsubscribe => unsubscribe()); await manager.dispose(); coordinator.dispose();
  return { draftTimes, chunkTimes, flushMs, totalMs, writes: measuredWrites, counts };
}
function distribution(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { medianMs: (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2,
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] };
}
(async () => {
  const results = [];
  for (const size of [10, 100, 1000]) for (const listeners of [1, 2]) {
    for (let i = 0; i < 3; i++) await workload(size, listeners);
    const runs = [];
    for (let i = 0; i < 10; i++) runs.push(await workload(size, listeners));
    const counted = await workload(size, listeners, true);
    results.push({ entries: size, completedPairs: size / 2, listeners,
      fixtureBytes: Buffer.byteLength(JSON.stringify(fixture(size))),
      draftOperation: distribution(runs.flatMap(run => run.draftTimes)), chunkOperation: distribution(runs.flatMap(run => run.chunkTimes)),
      flush: distribution(runs.map(run => run.flushMs)), total: distribution(runs.map(run => run.totalMs)),
      writes: runs.map(run => run.writes), counterPass: { counts: counted.counts, writes: counted.writes }, runs });
    process.stdout.write(`${phase}: ${size} entries, ${listeners} listeners, median ${results.at(-1).total.medianMs.toFixed(2)} ms\n`);
  }
  const report = { phase, node: process.version, platform: process.platform, arch: process.arch, release: os.release(), cpu: os.cpus()[0]?.model,
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: __dirname, encoding: 'utf8' }).trim(),
    warmups: 3, repetitions: 10, draftChanges: 100, responseChunks: 100, chunkBytes: 64,
    sources: [], timingInstrumentation: 'none; precise coverage runs separately after timings', results };
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
