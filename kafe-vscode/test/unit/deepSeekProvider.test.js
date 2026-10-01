const assert = require('node:assert/strict');
const test = require('node:test');
const { DeepSeekProvider, ProviderError } = require('../../src/tutor/providers/DeepSeekProvider');

const key = 'fake-test-key-NOT-REAL';
const tools = [{ type: 'function', function: { name: 'readActiveDocument', parameters: { type: 'object', properties: {}, additionalProperties: false } } }];
const messages = [{ role: 'user', content: 'Help with lists' }];
const result = (message, finish_reason = 'stop') => ({ ok: true, json: async () => ({ choices: [{ finish_reason, message }] }) });
const setup = (transport, options = {}) => new DeepSeekProvider({
  secretStorage: { get: async () => key }, transport, timeoutMs: 50, ...options,
});

test('non-thinking Chat Completions request uses stored key and exact reviewed messages/tools', async () => {
  let sent;
  const provider = setup(async (url, init) => { sent = { url, init }; return result({ content: 'Try indexing the first item.' }); });
  assert.deepEqual(await provider.complete({ messages, tools }), { text: 'Try indexing the first item.', toolCalls: [] });
  assert.equal(sent.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(sent.init.method, 'POST');
  assert.equal(sent.init.headers.Authorization, `Bearer ${key}`);
  assert.deepEqual(JSON.parse(sent.init.body), { model: 'deepseek-flash', messages, tools, stream: false, thinking: { type: 'disabled' } });
  assert.ok(!JSON.stringify(JSON.parse(sent.init.body)).includes(key));
});

test('normalizes valid function calls and rejects unknown or malformed arguments', async () => {
  const call = (name, args) => result({ content: null, tool_calls: [{ id: 'call-1', type: 'function', function: { name, arguments: args } }] }, 'tool_calls');
  const valid = setup(async () => call('readActiveDocument', '{}'));
  assert.deepEqual(await valid.complete({ messages, tools }), { text: '', toolCalls: [{ id: 'call-1', name: 'readActiveDocument', arguments: {} }] });
  for (const response of [call('unknownTool', '{}'), call('readActiveDocument', '{'), call('readActiveDocument', '[]'), call('readActiveDocument', '{"extra":1}')]) {
    const provider = setup(async () => response);
    await assert.rejects(provider.complete({ messages, tools }), e => e instanceof ProviderError && e.code === 'malformed_response' && !e.message.includes(key));
  }
});

test('missing key, malformed and truncated responses are typed and sanitized', async () => {
  await assert.rejects(new DeepSeekProvider({ secretStorage: { get: async () => undefined }, transport: async () => { throw new Error('must not call'); } }).complete({ messages, tools }), e => e.code === 'missing_key');
  for (const response of [{ ok: true, json: async () => ({ choices: [] }) }, result({ content: 'partial' }, 'length'), { ok: true, json: async () => { throw new Error(key); } }]) {
    await assert.rejects(setup(async () => response).complete({ messages, tools }), e => e.code === 'malformed_response' && !e.message.includes(key));
  }
});

test('HTTP authentication, rate limit, other failures and transport errors do not reveal raw bodies', async () => {
  for (const [status, code] of [[401, 'auth'], [429, 'rate_limit'], [503, 'http']]) {
    await assert.rejects(setup(async () => ({ ok: false, status, text: async () => key })).complete({ messages, tools }), e => e.code === code && !e.message.includes(key));
  }
  await assert.rejects(setup(async () => { throw new Error(key); }).complete({ messages, tools }), e => e.code === 'transport' && !e.message.includes(key));
});

test('timeout and caller abort are distinct typed failures without retries', async () => {
  let calls = 0;
  const hanging = setup((url, init) => { calls++; return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error(key), { name: 'AbortError' })))); }, { timeoutMs: 5 });
  await assert.rejects(hanging.complete({ messages, tools }), e => e.code === 'timeout' && !e.message.includes(key));
  assert.equal(calls, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(setup(async () => { throw new Error(key); }).complete({ messages, tools, signal: controller.signal }), e => e.code === 'aborted' && !e.message.includes(key));
  const delayedAbort = new AbortController();
  let transportCalls = 0;
  const delayed = new DeepSeekProvider({ secretStorage: { get: async () => { delayedAbort.abort(); return key; } },
    transport: async () => { transportCalls++; return result({ content: 'unexpected' }); } });
  await assert.rejects(delayed.complete({ messages, tools, signal: delayedAbort.signal }), e => e.code === 'aborted');
  assert.equal(transportCalls, 0);
});

test('a timeout while reading the response body remains a timeout', async () => {
  let calls = 0;
  const provider = setup(async (url, init) => {
    calls++;
    return { ok: true, json: () => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error(key)), { once: true });
    }) };
  }, { timeoutMs: 5 });
  await assert.rejects(provider.complete({ messages, tools }), error => error.code === 'timeout' && !error.message.includes(key));
  assert.equal(calls, 1);
});

test('caller cancellation while reading the response body remains aborted', async () => {
  const controller = new AbortController();
  let calls = 0;
  const provider = setup(async (url, init) => {
    calls++;
    return { ok: true, json: () => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error(key)), { once: true });
      controller.abort();
    }) };
  });
  await assert.rejects(provider.complete({ messages, tools, signal: controller.signal }), error => error.code === 'aborted' && !error.message.includes(key));
  assert.equal(calls, 1);
});

const collect = async iterator => { const events = []; for await (const event of iterator) events.push(event); return events; };
const streamWire = 'data: {"choices":[{"index":0,"delta":{"content":"Answer"},"finish_reason":null}]}\n\n' +
  'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n' + 'data: [DONE]\n\n';
const request = { messages, tools, model: 'reviewed-model', thinking: { type: 'disabled' }, stream: true };
const streamed = wire => ({ ok: true, body: new ReadableStream({ start(controller) { controller.enqueue(Buffer.from(wire)); controller.close(); } }) });
const safeError = code => error => {
  const diagnostic = JSON.stringify({ ...error, message: error.message, stack: error.stack });
  assert.ok(!diagnostic.includes(key));
  assert.ok(!diagnostic.includes('SOURCE-RAW-SENTINEL'));
  assert.equal(error.message, new ProviderError(code).message);
  return error instanceof ProviderError && error.code === code;
};

test('stream sends the exact reviewed request with host-only credentials', async () => {
  let sent;
  const provider = setup(async (url, init) => { sent = { url, init }; return streamed(streamWire); });
  assert.deepEqual(provider.getRequestParameters(), { model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true });
  assert.deepEqual(await collect(provider.stream({ request })), [
    { type: 'text', text: 'Answer' }, { type: 'complete', text: 'Answer', toolCalls: [], finishReason: 'stop' },
  ]);
  assert.equal(sent.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(sent.init.headers.Authorization, `Bearer ${key}`);
  assert.deepEqual(JSON.parse(sent.init.body), request);
  assert.ok(!sent.init.body.includes(key));
});

test('stream missing credentials or pre-send abort makes zero transport calls', async () => {
  let calls = 0;
  const transport = async () => { calls++; return streamed(streamWire); };
  for (const secretStorage of [{ get: async () => undefined }, { get: async () => { throw new Error(key); } }]) {
    await assert.rejects(collect(setup(transport, { secretStorage }).stream({ request })), safeError('missing_key'));
  }
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(collect(setup(transport).stream({ request, signal: controller.signal })), safeError('aborted'));
  const delayed = new AbortController();
  await assert.rejects(collect(setup(transport, { secretStorage: { get: async () => { delayed.abort(); return key; } } })
    .stream({ request, signal: delayed.signal })), safeError('aborted'));
  assert.equal(calls, 0);
});

test('stream HTTP, transport, body and protocol failures use sanitized public errors without retry', async () => {
  for (const [response, code] of [
    [{ ok: false, status: 401 }, 'auth'], [{ ok: false, status: 403 }, 'auth'],
    [{ ok: false, status: 429 }, 'rate_limit'], [{ ok: false, status: 503 }, 'http'],
    [{ ok: true, body: null }, 'malformed_response'], [streamed('data: SOURCE-RAW-SENTINEL\n\n'), 'malformed_response'],
    [{ ok: true, body: new ReadableStream({ pull() { throw new Error(key + 'SOURCE-RAW-SENTINEL'); } }) }, 'transport'],
  ]) {
    let calls = 0;
    await assert.rejects(collect(setup(async () => { calls++; return response; }).stream({ request })), safeError(code));
    assert.equal(calls, 1);
    if (response.body) assert.equal(response.body.locked, false);
  }
  await assert.rejects(collect(setup(async () => { throw new Error(key + 'SOURCE-RAW-SENTINEL'); }).stream({ request })), safeError('transport'));
});

test('stream timeout remains active during stalled body consumption and releases reader', async () => {
  let cancelled = 0;
  const body = new ReadableStream({ cancel() { cancelled++; } });
  let calls = 0;
  const provider = setup(async () => { calls++; return { ok: true, body }; }, { timeoutMs: 5 });
  await assert.rejects(collect(provider.stream({ request })), safeError('timeout'));
  assert.equal(calls, 1);
  assert.equal(cancelled, 1);
  assert.equal(body.locked, false);
});

test('stream caller abort during stalled body consumption remains aborted and releases listener', async () => {
  const controller = new AbortController();
  let added = 0, removed = 0, cancelled = 0;
  const signal = {
    get aborted() { return controller.signal.aborted; },
    addEventListener(...args) { added++; controller.signal.addEventListener(...args); },
    removeEventListener(...args) { removed++; controller.signal.removeEventListener(...args); },
  };
  const body = new ReadableStream({ pull() { controller.abort(); }, cancel() { cancelled++; } }, { highWaterMark: 0 });
  await assert.rejects(collect(setup(async () => ({ ok: true, body })).stream({ request, signal })), safeError('aborted'));
  assert.equal(cancelled, 1);
  assert.equal(body.locked, false);
  assert.equal(added, removed);
});

test('aborting after a visible delta cannot leak a complete event from buffered bytes', async () => {
  const controller = new AbortController();
  const body = streamed(streamWire).body;
  const iterator = setup(async () => ({ ok: true, body })).stream({ request, signal: controller.signal });
  assert.equal((await iterator.next()).value.type, 'text');
  controller.abort();
  await assert.rejects(iterator.next(), safeError('aborted'));
  assert.equal(body.locked, false);
});

test('early iterator return cancels the body and removes external abort listener', async () => {
  const controller = new AbortController();
  let removed = 0, cancelled = 0;
  const signal = {
    get aborted() { return controller.signal.aborted; },
    addEventListener(...args) { controller.signal.addEventListener(...args); },
    removeEventListener(...args) { removed++; controller.signal.removeEventListener(...args); },
  };
  const body = new ReadableStream({ start(target) { target.enqueue(Buffer.from(streamWire.split('\n\n')[0] + '\n\n')); }, cancel() { cancelled++; } });
  const iterator = setup(async () => ({ ok: true, body })).stream({ request, signal });
  assert.equal((await iterator.next()).value.type, 'text');
  await iterator.return();
  assert.equal(cancelled, 1);
  assert.equal(removed, 1);
  assert.equal(body.locked, false);
});

test('protocol DONE cancels and releases a keep-open response before yielding complete', async () => {
  let cancelled = 0;
  const body = new ReadableStream({ start(target) { target.enqueue(Buffer.from(streamWire)); }, cancel() { cancelled++; } });
  const iterator = setup(async () => ({ ok: true, body }), { timeoutMs: 100 }).stream({ request });
  assert.equal((await iterator.next()).value.type, 'text');
  assert.equal((await iterator.next()).value.type, 'complete');
  assert.equal(cancelled, 1);
  assert.equal(body.locked, false);
  assert.equal((await iterator.next()).done, true);
});

test('stream refuses a request that would disable the reviewed streaming protocol', async () => {
  let calls = 0;
  await assert.rejects(collect(setup(async () => { calls++; return streamed(streamWire); })
    .stream({ request: { ...request, stream: false } })), safeError('malformed_response'));
  assert.equal(calls, 0);
});

test('successful streaming completion releases each external listener once', async () => {
  const controller = new AbortController();
  let added = 0, removed = 0;
  const signal = {
    get aborted() { return controller.signal.aborted; },
    addEventListener(...args) { added++; controller.signal.addEventListener(...args); },
    removeEventListener(...args) { removed++; controller.signal.removeEventListener(...args); },
  };
  await collect(setup(async () => streamed(streamWire)).stream({ request, signal }));
  assert.equal(added, 1);
  assert.equal(removed, 1);
});

test('unknown error codes including inherited property names keep fixed public messages', () => {
  const { ProviderError: SharedError } = require('../../src/tutor/providers/ProviderError');
  assert.equal(SharedError, ProviderError);
  for (const code of ['unknown', '__proto__', 'constructor']) {
    const error = new SharedError(code);
    assert.equal(error.code, 'http');
    assert.equal(error.message, new SharedError('http').message);
  }
});
