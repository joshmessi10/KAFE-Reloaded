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
