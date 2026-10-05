const assert = require('node:assert/strict');
const test = require('node:test');
const streamModule = require('../../src/tutor/providers/CompletionStream');
const { decodeCompletionStream, parseToolCalls } = streamModule;
const { TOOL_DEFINITIONS: tools } = require('../../src/tutor/ToolRouter');

const collect = async iterator => { const events = []; for await (const event of iterator) events.push(event); return events; };
const bytes = async function* (...parts) { for (const part of parts) yield typeof part === 'string' ? Buffer.from(part) : part; };
const event = (delta = {}, finish_reason = null) => `data: ${JSON.stringify({ choices: [{ index: 0, delta, finish_reason }] })}\r\n\r\n`;
const done = 'data: [DONE]\r\n\r\n';
const tool = (index, name, args, id = `call-${index}`) => ({ index, id, type: 'function', function: { name, arguments: args } });
const malformed = error => error.code === 'malformed_response';

test('checkpoint arrays and nested limits validate in fragmented completion and reject malformed authority', async () => {
  const args = { kind: 'design', name: 'Choice', learnerProposalSummary: '', tutorProposedAdditions: ['Use a loop'], scopeSummary: '', tradeoffs: [], unresolvedChoices: [], sourceIds: [] };
  const serialized = JSON.stringify(args), middle = Math.floor(serialized.length / 2);
  const wire = event({ tool_calls: [tool(0, 'proposeLearningCheckpoint', serialized.slice(0, middle))] }) +
    event({ tool_calls: [{ index: 0, function: { arguments: serialized.slice(middle) } }] }) + event({}, 'tool_calls') + done;
  assert.deepEqual((await collect(decodeCompletionStream(bytes(wire), { tools })))[0].toolCalls[0].arguments, args);
  for (const bad of [{ ...args, confirmed: true }, { ...args, kind: 'run' }, { ...args, name: 'x'.repeat(121) }, { ...args, tradeoffs: [42] }, { ...args, sourceIds: Array(9).fill('x') }, { ...args, priorDecisionIds: null }]) {
    assert.throws(() => parseToolCalls([{ id: 'c', type: 'function', function: { name: 'proposeLearningCheckpoint', arguments: JSON.stringify(bad) } }], tools), malformed);
  }
});

test('UTF-8 characters and CRLF delimiters survive arbitrary byte boundaries', async () => {
  const wire = Buffer.from(': heartbeat\r\n\r\n' + event({ role: 'assistant', content: 'Español ☕' }) +
    'data: {"choices":[],"usage":{"total_tokens":2}}\r\n\r\n' + event({}, 'stop') + done);
  const chunks = Array.from(wire, byte => Buffer.from([byte]));
  assert.deepEqual(await collect(decodeCompletionStream(bytes(...chunks), { tools })), [
    { type: 'text', text: 'Español ☕' },
    { type: 'complete', text: 'Español ☕', toolCalls: [], finishReason: 'stop' },
  ]);
});

test('multiple SSE events in one chunk and multiline data produce only text deltas', async () => {
  const wire = 'event: message\ndata: {"choices":\ndata: [{"index":0,"delta":{"content":"A"},"finish_reason":null}]}\n\n' +
    event({ content: 'B' }) + event({}, 'stop') + done;
  assert.deepEqual(await collect(decodeCompletionStream(bytes(wire), { tools })), [
    { type: 'text', text: 'A' }, { type: 'text', text: 'B' },
    { type: 'complete', text: 'AB', toolCalls: [], finishReason: 'stop' },
  ]);
});

test('fragmented indexed tool names and arguments settle only after validation', async () => {
  const first = event({ tool_calls: [tool(1, 'readActive', '', 'read-id'), tool(0, 'searchKafe', '{"query":"', 'search-id')] });
  const second = event({ tool_calls: [
    { index: 0, function: { name: 'Knowledge', arguments: 'loops"}' } },
    { index: 1, function: { name: 'Document', arguments: '{}' } },
  ] });
  const iterator = decodeCompletionStream(bytes(first, second, event({}, 'tool_calls'), done), { tools });
  const events = await collect(iterator);
  assert.deepEqual(events, [{ type: 'complete', text: '', finishReason: 'tool_calls', toolCalls: [
    { id: 'search-id', name: 'searchKafeKnowledge', arguments: { query: 'loops' } },
    { id: 'read-id', name: 'readActiveDocument', arguments: {} },
  ] }]);
});

test('text is available before completion and tool fragments never become events', async () => {
  let allowEnd;
  const gate = new Promise(resolve => { allowEnd = resolve; });
  async function* source() {
    yield Buffer.from(event({ content: 'Visible' }));
    await gate;
    yield Buffer.from(event({ tool_calls: [tool(0, 'readActiveDocument', '{}')] }) + event({}, 'tool_calls') + done);
  }
  const iterator = decodeCompletionStream(source(), { tools });
  assert.deepEqual(await iterator.next(), { value: { type: 'text', text: 'Visible' }, done: false });
  allowEnd();
  assert.equal((await iterator.next()).value.type, 'complete');
  assert.equal((await iterator.next()).done, true);
});

test('dropped streams and missing completion metadata never produce completion', async () => {
  for (const wire of [event({ content: 'partial' }), event({}, 'stop'), done,
    event({ content: 'partial' }) + done, event({}, 'stop') + 'data: [DONE]']) {
    const seen = [];
    await assert.rejects((async () => { for await (const value of decodeCompletionStream(bytes(wire), { tools })) seen.push(value); })(), malformed);
    assert.equal(seen.filter(value => value.type === 'complete').length, 0);
  }
});

test('malformed payloads, metadata and bytes after terminal answer are rejected', async () => {
  const invalid = [
    'data: {SOURCE-RAW-SENTINEL}\n\n', event({}, 'length'), event({}, 'content_filter'),
    event({ content: 12 }), event({ tool_calls: [] }, 'tool_calls'),
    event({ tool_calls: [tool(0, 'readActiveDocument', '{}')] }, 'stop'),
    event({}, 'stop') + event({ content: 'late' }),
    event({}, 'stop') + done + event({ content: 'another answer' }),
    'data: {"choices":[{"index":1,"delta":{},"finish_reason":"stop"}]}\n\n',
    'data: {"choices":[]}\n\n', event({}, 'stop') + event({}, 'stop'),
  ];
  for (const wire of invalid) await assert.rejects(collect(decodeCompletionStream(bytes(wire + done), { tools })), malformed);
  await assert.rejects(collect(decodeCompletionStream(bytes(Buffer.from([0xff])), { tools })), malformed);
});

test('tool identity, count, complete JSON and schema validation remain strict', async () => {
  const invalid = [
    [{ index: 0, type: 'function', function: { name: 'readActiveDocument', arguments: '{}' } }],
    [tool(0, 'unknownTool', '{}')], [tool(0, 'searchKafeKnowledge', '{"query":')],
    [tool(0, 'searchKafeKnowledge', '{}')], [tool(0, 'searchKafeKnowledge', '{"query":12}')],
    [tool(0, 'readActiveDocument', '[]')], [tool(0, 'readActiveDocument', '{"extra":true}')],
    [tool(0, 'readActiveDocument', {})], [tool(-1, 'readActiveDocument', '{}')],
    Array.from({ length: 5 }, (_, index) => tool(index, 'readActiveDocument', '{}')),
    [tool(0, 'readActiveDocument', '{}', 'duplicate'), tool(1, 'readActiveDocument', '{}', 'duplicate')],
  ];
  for (const calls of invalid) await assert.rejects(collect(decodeCompletionStream(bytes(event({ tool_calls: calls }, 'tool_calls') + done), { tools })), malformed);
});

test('single oversized unparsed SSE event is rejected but separate events are bounded separately', async () => {
  const limit = 2 * 1024 * 1024;
  await assert.rejects(collect(decodeCompletionStream(bytes('data: ' + 'x'.repeat(limit + 1)), { tools })), malformed);
  const large = 'é'.repeat(300000);
  const events = await collect(decodeCompletionStream(bytes(event({ content: large }).repeat(4) + event({}, 'stop') + done), { tools }));
  assert.equal(events.filter(value => value.type === 'text').length, 4);
  assert.equal(events.at(-1).text.length, large.length * 4);
});

test('assembled per-call UTF-8 arguments are capped across individually valid events', async () => {
  const part = 'é'.repeat(350000);
  const wire = event({ tool_calls: [tool(0, 'proposeCodeChange', '{"newText":"' + part)] }) +
    event({ tool_calls: [{ index: 0, function: { arguments: part } }] }).repeat(2) +
    event({ tool_calls: [{ index: 0, function: { arguments: '"}' } }] }, 'tool_calls') + done;
  await assert.rejects(collect(decodeCompletionStream(bytes(wire), { tools })), malformed);
});

test('shared parser retains parsed-object API and sanitizes argument failures', () => {
  assert.deepEqual(parseToolCalls([{ id: 'query-id', type: 'function', function: { name: 'searchKafeKnowledge', arguments: '{"query":"loops"}' } }], tools), [
    { id: 'query-id', name: 'searchKafeKnowledge', arguments: { query: 'loops' } },
  ]);
  assert.throws(() => parseToolCalls([{ id: 'x', type: 'function', function: { name: 'searchKafeKnowledge', arguments: 'SOURCE-RAW-SENTINEL' } }], tools), error => {
    assert.ok(!JSON.stringify({ ...error, message: error.message, stack: error.stack }).includes('SOURCE-RAW-SENTINEL'));
    return malformed(error);
  });
});

test('protocol DONE settles without waiting for source closure or later chunks', async () => {
  let reads = 0, closed = false;
  async function* source() {
    try {
      reads++;
      yield Buffer.from(event({}, 'stop') + done);
      reads++;
      yield Buffer.from(event({ content: 'future bytes must never produce another event' }));
    } finally { closed = true; }
  }
  assert.deepEqual(await collect(decodeCompletionStream(source(), { tools })), [
    { type: 'complete', text: '', toolCalls: [], finishReason: 'stop' },
  ]);
  assert.equal(reads, 1);
  assert.equal(closed, true);
});

test('CRLF framing bytes count toward the unparsed event byte guard', async () => {
  const wire = ':'.repeat(2 * 1024 * 1024 - 2) + '\r\n\r\n';
  await assert.rejects(collect(decodeCompletionStream(bytes(wire, event({}, 'stop') + done), { tools })), malformed);
});

test('argument byte bounds measure assembled UTF-8 including split surrogate pairs', async () => {
  const prefix = '{"newText":"', suffix = '"}';
  const padding = 'a'.repeat(2 * 1024 * 1024 - prefix.length - suffix.length - 4);
  const first = prefix + padding.slice(0, 700000);
  const middle = padding.slice(700000, 1400000);
  const last = padding.slice(1400000) + '\ud83d';
  const wire = event({ tool_calls: [tool(0, 'proposeCodeChange', first)] }) +
    event({ tool_calls: [{ index: 0, function: { arguments: middle } }] }) +
    event({ tool_calls: [{ index: 0, function: { arguments: last } }] }) +
    event({ tool_calls: [{ index: 0, function: { arguments: '\ude80' + suffix } }] }, 'tool_calls') + done;
  const events = await collect(decodeCompletionStream(bytes(wire), { tools }));
  assert.equal(events.at(-1).toolCalls[0].arguments.newText, padding + '🚀');
});
