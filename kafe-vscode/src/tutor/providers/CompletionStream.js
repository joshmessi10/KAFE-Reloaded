const { ProviderError } = require('./ProviderError');

const MAX_BUFFER_BYTES = 2 * 1024 * 1024;
const malformed = () => new ProviderError('malformed_response');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Validate raw calls for both completion APIs; arguments leave the provider as parsed objects. */
function parseToolCalls(calls, tools) {
  if (calls == null) return [];
  if (!Array.isArray(calls) || calls.length > 4) throw malformed();
  const permitted = new Map((tools || []).map(tool => [tool.function?.name, tool.function?.parameters]));
  const ids = new Set();
  return calls.map(call => {
    const name = call?.function?.name;
    if (call?.type !== 'function' || typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id) ||
      !permitted.has(name) || typeof call.function.arguments !== 'string' ||
      Buffer.byteLength(call.function.arguments, 'utf8') > MAX_BUFFER_BYTES) throw malformed();
    ids.add(call.id);
    let args;
    try { args = JSON.parse(call.function.arguments); }
    catch { throw malformed(); }
    const schema = permitted.get(name) || {};
    const properties = schema.properties || {};
    if (!object(args) || Object.keys(args).some(key => !Object.hasOwn(properties, key) ||
        (properties[key]?.type && typeof args[key] !== properties[key].type)) ||
      (schema.required || []).some(key => !Object.hasOwn(args, key))) throw malformed();
    return { id: call.id, name, arguments: args };
  });
}

/**
 * @typedef {{type:'text', text:string} | {type:'complete', text:string,
 *   toolCalls:{id:string,name:string,arguments:object}[],finishReason:string}} StreamEvent
 */

/** @param {AsyncIterable<Uint8Array>} chunks @returns {AsyncGenerator<StreamEvent>} */
async function* decodeCompletionStream(chunks, { tools } = {}) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let line = '', eventBytes = 0, dataLines = [], skipLF = false, priorCRBytes = 0, priorCRContinuesEvent = false;
  let text = '', finishReason = null, terminal = false;
  const calls = new Map();

  function processEvent(data) {
    if (terminal) throw malformed();
    if (data === '[DONE]') {
      if (!finishReason) throw malformed();
      terminal = true;
      return null;
    }
    let payload;
    try { payload = JSON.parse(data); }
    catch { throw malformed(); }
    if (!object(payload) || !Array.isArray(payload.choices)) throw malformed();
    if (!payload.choices.length && object(payload.usage)) return null;
    if (payload.choices.length !== 1) throw malformed();
    const choice = payload.choices[0];
    if (!object(choice) || choice.index !== 0 || !object(choice.delta) || finishReason) throw malformed();
    const delta = choice.delta;
    if (delta.role != null && delta.role !== 'assistant') throw malformed();
    if (delta.content != null && typeof delta.content !== 'string') throw malformed();
    if (delta.tool_calls != null) {
      if (!Array.isArray(delta.tool_calls) || delta.tool_calls.length > 4) throw malformed();
      for (const fragment of delta.tool_calls) {
        if (!object(fragment) || !Number.isSafeInteger(fragment.index) || fragment.index < 0 || fragment.index > 3) throw malformed();
        let call = calls.get(fragment.index);
        if (!call) {
          if (calls.size === 4) throw malformed();
          call = { id: undefined, type: undefined, function: { name: '', arguments: '' }, argumentBytes: 0 };
          calls.set(fragment.index, call);
        }
        for (const field of ['id', 'type']) {
          if (fragment[field] === undefined) continue;
          if (typeof fragment[field] !== 'string' || (call[field] !== undefined && call[field] !== fragment[field])) throw malformed();
          call[field] = fragment[field];
        }
        if (fragment.function !== undefined) {
          if (!object(fragment.function)) throw malformed();
          for (const field of ['name', 'arguments']) {
            const value = fragment.function[field];
            if (value === undefined) continue;
            if (typeof value !== 'string') throw malformed();
            if (field === 'arguments') {
              call.argumentBytes += Buffer.byteLength(value, 'utf8');
              const previous = call.function.arguments.charCodeAt(call.function.arguments.length - 1);
              const next = value.charCodeAt(0);
              // JSON string fragments can split one UTF-16 surrogate pair.
              // Together it occupies four UTF-8 bytes, not two replacement characters.
              if (previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) call.argumentBytes -= 2;
              if (call.argumentBytes > MAX_BUFFER_BYTES) throw malformed();
            } else if (Buffer.byteLength(call.function.name, 'utf8') + Buffer.byteLength(value, 'utf8') > MAX_BUFFER_BYTES) {
              throw malformed();
            }
            call.function[field] += value;
          }
        }
      }
    }
    if (choice.finish_reason != null) {
      if (!['stop', 'tool_calls'].includes(choice.finish_reason)) throw malformed();
      finishReason = choice.finish_reason;
    }
    if (delta.content) {
      text += delta.content;
      return { type: 'text', text: delta.content };
    }
    return null;
  }

  function processLine() {
    const current = line;
    line = '';
    if (!current) {
      const data = dataLines.length ? dataLines.join('\n') : null;
      dataLines = [];
      eventBytes = 0;
      return data === null ? null : processEvent(data);
    }
    if (current.startsWith(':')) return null;
    const colon = current.indexOf(':');
    const field = colon < 0 ? current : current.slice(0, colon);
    let value = colon < 0 ? '' : current.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') dataLines.push(value);
    return null;
  }

  function* consume(decoded) {
    let start = 0;
    if (skipLF) {
      if (decoded.startsWith('\n')) {
        if (priorCRBytes + 1 > MAX_BUFFER_BYTES) throw malformed();
        if (priorCRContinuesEvent) eventBytes++;
        start = 1;
      }
      skipLF = false;
    }
    const endings = /[\r\n]/g;
    endings.lastIndex = start;
    let match;
    while ((match = endings.exec(decoded))) {
      const part = decoded.slice(start, match.index);
      const hasLF = match[0] === '\r' && decoded[match.index + 1] === '\n';
      eventBytes += Buffer.byteLength(part, 'utf8') + (hasLF ? 2 : 1);
      if (eventBytes > MAX_BUFFER_BYTES) throw malformed();
      line += part;
      priorCRBytes = eventBytes;
      priorCRContinuesEvent = Boolean(line);
      const value = processLine();
      if (value) yield value;
      start = match.index + 1;
      if (match[0] === '\r') {
        if (decoded[start] === '\n') { start++; endings.lastIndex = start; }
        else if (start === decoded.length) skipLF = true;
      }
    }
    const remainder = decoded.slice(start);
    eventBytes += Buffer.byteLength(remainder, 'utf8');
    if (eventBytes > MAX_BUFFER_BYTES) throw malformed();
    line += remainder;
  }

  for await (const chunk of chunks) {
    if (!(chunk instanceof Uint8Array)) throw malformed();
    let decoded;
    try { decoded = decoder.decode(chunk, { stream: true }); }
    catch { throw malformed(); }
    if (decoded) yield* consume(decoded);
    if (terminal) {
      // DONE is the protocol boundary. Validate this chunk's trailing bytes,
      // then close the source instead of waiting for the HTTP body to close.
      try { decoded = decoder.decode(); }
      catch { throw malformed(); }
      if (decoded) yield* consume(decoded);
      if (line || dataLines.length) throw malformed();
      break;
    }
  }
  let tail;
  try { tail = decoder.decode(); }
  catch { throw malformed(); }
  if (tail) yield* consume(tail);
  if (!terminal || line || dataLines.length) throw malformed();
  const toolCalls = parseToolCalls([...calls.entries()].sort(([left], [right]) => left - right).map(([, call]) => call), tools);
  if ((finishReason === 'tool_calls') !== (toolCalls.length > 0)) throw malformed();
  yield { type: 'complete', text, toolCalls, finishReason };
}

module.exports = { decodeCompletionStream, parseToolCalls };
