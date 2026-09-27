const SECRET_KEY = 'kafe.deepseekApiKey';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';

const ERROR_MESSAGES = Object.freeze({
  missing_key: 'Configure a DeepSeek API key with KAFE: Configure Provider Key, then retry.',
  aborted: 'The tutor request was cancelled. Retry when ready.',
  timeout: 'The DeepSeek request timed out. Retry when ready.',
  auth: 'DeepSeek rejected the API key. Update it with KAFE: Configure Provider Key, then retry.',
  rate_limit: 'DeepSeek is rate limited. Retry when ready.',
  http: 'DeepSeek could not complete the request. Retry when ready.',
  transport: 'The tutor could not reach DeepSeek. Check your connection and retry.',
  malformed_response: 'DeepSeek returned an unusable response. Retry when ready.',
});

class ProviderError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] || ERROR_MESSAGES.http);
    this.name = 'ProviderError';
    this.code = code in ERROR_MESSAGES ? code : 'http';
  }
}

function parseToolCalls(calls, tools) {
  if (calls == null) return [];
  if (!Array.isArray(calls) || calls.length > 4) throw new ProviderError('malformed_response');
  const permitted = new Map((tools || []).map(tool => [tool.function?.name, tool.function?.parameters]));
  return calls.map(call => {
    const name = call?.function?.name;
    if (call?.type !== 'function' || typeof call.id !== 'string' || !call.id || !permitted.has(name) ||
      typeof call.function.arguments !== 'string') throw new ProviderError('malformed_response');
    let args;
    try { args = JSON.parse(call.function.arguments); }
    catch { throw new ProviderError('malformed_response'); }
    const schema = permitted.get(name) || {};
    const properties = schema.properties || {};
    if (!args || typeof args !== 'object' || Array.isArray(args) ||
      Object.keys(args).some(key => !Object.hasOwn(properties, key) ||
        (properties[key]?.type && typeof args[key] !== properties[key].type)) ||
      (schema.required || []).some(key => !Object.hasOwn(args, key))) throw new ProviderError('malformed_response');
    return { id: call.id, name, arguments: args };
  });
}

class DeepSeekProvider {
  constructor({ secretStorage, transport = globalThis.fetch, model = 'deepseek-flash', timeoutMs = 30000 }) {
    this.secretStorage = secretStorage;
    this.transport = transport;
    this.model = model;
    this.timeoutMs = timeoutMs;
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
