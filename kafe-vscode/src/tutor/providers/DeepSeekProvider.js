const { ProviderError } = require('./ProviderError');
const { decodeCompletionStream, parseToolCalls } = require('./CompletionStream');

const SECRET_KEY = 'kafe.deepseekApiKey';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';

class DeepSeekProvider {
  constructor({ secretStorage, transport = globalThis.fetch, model = 'deepseek-flash', timeoutMs = 30000 }) {
    this.secretStorage = secretStorage;
    this.transport = transport;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  getRequestParameters() {
    return { model: this.model, thinking: { type: 'disabled' }, stream: true };
  }

  /** @param {{request:{messages:object[],tools:object[],model:string,thinking:object,stream:true},signal?:AbortSignal}} input */
  async *stream({ request, signal } = {}) {
    if (signal?.aborted) throw new ProviderError('aborted');
    if (request?.stream !== true) throw new ProviderError('malformed_response');
    let key;
    try { key = await this.secretStorage.get(SECRET_KEY); }
    catch { throw new ProviderError('missing_key'); }
    if (signal?.aborted) throw new ProviderError('aborted');
    if (!key) throw new ProviderError('missing_key');
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    let rejectAbort;
    const aborted = new Promise((resolve, reject) => { rejectAbort = reject; });
    const onInternalAbort = () => rejectAbort(new ProviderError(timedOut ? 'timeout' : 'aborted'));
    controller.signal.addEventListener('abort', onInternalAbort, { once: true });
    let reader, bodyEnded = false, released = false;
    const ensureActive = () => {
      if (signal?.aborted) throw new ProviderError('aborted');
      if (timedOut) throw new ProviderError('timeout');
    };
    const release = () => {
      if (released) return;
      released = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      controller.signal.removeEventListener('abort', onInternalAbort);
      controller.abort();
      if (reader) {
        if (!bodyEnded) {
          try { void reader.cancel().catch(() => {}); } catch { /* Cleanup cannot expose transport errors. */ }
        }
        reader.releaseLock();
        reader = undefined;
      }
    };
    try {
      const response = await Promise.race([this.transport(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: request.messages, tools: request.tools, model: request.model,
          thinking: request.thinking, stream: request.stream }),
        signal: controller.signal,
      }), aborted]);
      ensureActive();
      if (!response?.ok) {
        if (response?.status === 401 || response?.status === 403) throw new ProviderError('auth');
        if (response?.status === 429) throw new ProviderError('rate_limit');
        throw new ProviderError('http');
      }
      if (!response.body || typeof response.body.getReader !== 'function') throw new ProviderError('malformed_response');
      reader = response.body.getReader();
      async function* chunks() {
        while (true) {
          ensureActive();
          const next = await Promise.race([reader.read(), aborted]);
          ensureActive();
          if (next.done) { bodyEnded = true; return; }
          yield next.value;
        }
      }
      for await (const event of decodeCompletionStream(chunks(), { tools: request.tools })) {
        ensureActive();
        if (event.type === 'complete') release();
        yield event;
      }
    } catch (error) {
      ensureActive();
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('transport');
    } finally {
      release();
    }
  }

  async complete({ messages, tools, signal } = {}) {
    if (signal?.aborted) throw new ProviderError('aborted');
    let key;
    try { key = await this.secretStorage.get(SECRET_KEY); }
    catch { throw new ProviderError('missing_key'); }
    if (signal?.aborted) throw new ProviderError('aborted');
    if (!key) throw new ProviderError('missing_key');
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    try {
      const response = await this.transport(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, messages, tools, stream: false, thinking: { type: 'disabled' } }),
        signal: controller.signal,
      });
      if (!response?.ok) {
        if (response?.status === 401 || response?.status === 403) throw new ProviderError('auth');
        if (response?.status === 429) throw new ProviderError('rate_limit');
        throw new ProviderError('http');
      }
      let data;
      try { data = await response.json(); }
      catch {
        if (timedOut) throw new ProviderError('timeout');
        if (signal?.aborted) throw new ProviderError('aborted');
        throw new ProviderError('malformed_response');
      }
      const choice = data?.choices?.[0];
      if (!choice || !['stop', 'tool_calls'].includes(choice.finish_reason) ||
        !(choice.message?.content === null || typeof choice.message?.content === 'string')) {
        throw new ProviderError('malformed_response');
      }
      const toolCalls = parseToolCalls(choice.message.tool_calls, tools);
      if ((choice.finish_reason === 'tool_calls') !== (toolCalls.length > 0)) throw new ProviderError('malformed_response');
      return { text: choice.message.content || '', toolCalls };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (timedOut) throw new ProviderError('timeout');
      if (signal?.aborted) throw new ProviderError('aborted');
      throw new ProviderError('transport');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

module.exports = { DeepSeekProvider, ProviderError, SECRET_KEY };
