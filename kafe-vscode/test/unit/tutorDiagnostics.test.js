const test = require('node:test');
const assert = require('node:assert/strict');

test('diagnostic output accepts only explicit metadata and never raw exceptions or payloads', () => {
  const { createTutorDiagnostics } = require('../../src/tutor/TutorDiagnostics');
  const lines = [], names = []; let disposed = 0;
  const trace = createTutorDiagnostics({ createOutputChannel(name) { names.push(name); return { appendLine: line => lines.push(line), dispose() { disposed++; }, clear() {} }; } });
  trace.record({ event: 'tool-failed', attempt: 1, round: 2, tool: 'searchKafeKnowledge', reason: 'invalid-query',
    errorCategory: 'validation', code: 'PRIVATE_CODE', text: 'PRIVATE_USER', arguments: { query: 'PRIVATE_QUERY' },
    stack: 'PRIVATE_STACK', uri: 'file:///PRIVATE_FILE', key: 'PRIVATE_KEY', message: 'PRIVATE_EXCEPTION' });
  trace.record({ event: 'PRIVATE_EVENT', tool: 'PRIVATE_TOOL', status: 'PRIVATE_STATUS' });
  assert.deepEqual(names, ['KAFE Tutor Diagnostics']);
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]), { sequence: 1, event: 'tool-failed', attempt: 1, round: 2,
    tool: 'searchKafeKnowledge', reason: 'invalid-query', errorCategory: 'validation' });
  assert.doesNotMatch(lines.join(''), /PRIVATE|file:\/\//);
  trace.dispose(); trace.record({ event: 'turn-settled', status: 'completed' });
  assert.equal(disposed, 1); assert.equal(lines.length, 1);
});

test('diagnostic buffer is bounded and unavailable or throwing host sinks are harmless', () => {
  const { createTutorDiagnostics } = require('../../src/tutor/TutorDiagnostics');
  let count = 0, clears = 0;
  const trace = createTutorDiagnostics({ createOutputChannel() { return { appendLine() { count++; }, clear() { clears++; }, dispose() {} }; } });
  for (let n = 0; n < 300; n++) trace.record({ event: 'provider-start', attempt: 1, round: 0 });
  assert.equal(clears, 1); assert.equal(count, 301);
  assert.doesNotThrow(() => createTutorDiagnostics({}).record({ event: 'provider-start' }));
  const broken = createTutorDiagnostics({ createOutputChannel() { throw Error('PRIVATE'); } });
  assert.doesNotThrow(() => broken.record({ event: 'provider-start' }));
});

test('unknown exception properties are never read into output or allowed to disrupt classification', () => {
  const { errorMetadata } = require('../../src/tutor/TutorDiagnostics');
  const hostile = { get code() { throw Error('PRIVATE'); } };
  assert.doesNotThrow(() => errorMetadata(hostile));
  assert.deepEqual(errorMetadata(hostile), { errorCategory: 'non-error', reason: 'unclassified' });
});

test('view diagnostics distinguish failed posting from host settlement without claiming rendered content', async () => {
  const { TutorViewProvider } = require('../../src/tutor/TutorViewProvider');
  const records = [], view = new TutorViewProvider({ diagnostic: record => records.push(record) });
  const state = { revision: 7, turn: { status: 'failed' }, entries: [{ text: 'PRIVATE_TEXT' }] };
  view.view = { webview: { postMessage: () => Promise.resolve(false) } };
  assert.equal(await view.render(state), false);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(records, [{ event: 'view-posted', revision: 7, status: 'failed', delivered: false }]);
  view.view.webview.postMessage = () => Promise.resolve(true);
  assert.equal(await view.render(state), true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(records.at(-1).delivered, true);
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE|entries/);
});
