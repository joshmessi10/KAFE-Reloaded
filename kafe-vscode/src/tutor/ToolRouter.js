const { createHash } = require('node:crypto');

const MAX_FILE_BYTES = 64 * 1024;
const MAX_RUN_BYTES = 1024 * 1024;
const TOOL_NAMES = Object.freeze([
  'readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange',
]);
const TOOL_DEFINITIONS = Object.freeze([
  { type: 'function', function: { name: 'readActiveDocument', description: 'Read the active KAFE document or a learner-selected source ID.', parameters: { type: 'object', properties: { sourceId: { type: 'string' } }, additionalProperties: false } } },
  { type: 'function', function: { name: 'searchKafeKnowledge', description: 'Search the local version-matched KAFE knowledge pack.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } } },
  { type: 'function', function: { name: 'getLatestRunResult', description: 'Read the latest learner-started KAFE run result.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'proposeCodeChange', description: 'Prepare a code change for learner review without applying it.', parameters: { type: 'object', properties: { newText: { type: 'string' }, sourceId: { type: 'string' } }, required: ['newText'], additionalProperties: false } } },
]);

function parseArguments(value, allowed, required = []) {
  let args;
  try { args = typeof value === 'string' ? JSON.parse(value) : value; }
  catch { throw new Error('Tool arguments are malformed JSON.'); }
  if (!args || typeof args !== 'object' || Array.isArray(args) ||
    Object.keys(args).some(key => !allowed.includes(key)) || required.some(key => !Object.hasOwn(args, key))) {
    throw new Error('Tool arguments are invalid.');
  }
  return args;
}

function validateUri(uri) {
  if (!uri || uri.scheme !== 'file' || typeof uri.toString !== 'function') {
    throw new Error('Unsupported document URI scheme.');
  }
}

function selectedSourceId(uri) {
  validateUri(uri);
  return `selected:${createHash('sha256').update(uri.toString(), 'utf8').digest('hex')}`;
}

function validateDocument(document) {
  validateUri(document?.uri);
  if (typeof document.text !== 'string' || Buffer.byteLength(document.text, 'utf8') > MAX_FILE_BYTES ||
    !Number.isSafeInteger(document.version) || document.version < 0) {
    throw new Error('Document result shape or size is invalid.');
  }
  return document;
}

function validateRunResult(result) {
  if (result === null || result === undefined) return null;
  const contributor = result?.runtimeMode === 'contributor';
  const versionsValid = contributor ? result.runtimeVersion === null && result.knowledgePackVersion === null :
    (result.runtimeMode === undefined || result.runtimeMode === 'managed') &&
    typeof result.runtimeVersion === 'string' && Boolean(result.runtimeVersion) &&
    typeof result.knowledgePackVersion === 'string' && Boolean(result.knowledgePackVersion);
  if (typeof result !== 'object' || typeof result.stdout !== 'string' || typeof result.stderr !== 'string' ||
    !(result.exitCode === null || Number.isSafeInteger(result.exitCode)) ||
    typeof result.outputTruncated !== 'boolean' || !versionsValid ||
    typeof result.sourceUri !== 'string' || !/^file:\/\/.+\.kf$/i.test(result.sourceUri) ||
    !Number.isSafeInteger(result.runSequence) || result.runSequence < 1) {
    throw new Error('KAFE run result shape is invalid.');
  }
  if (Buffer.byteLength(result.stdout, 'utf8') + Buffer.byteLength(result.stderr, 'utf8') > MAX_RUN_BYTES) {
    throw new Error('KAFE run result size is invalid.');
  }
  return result;
}

function providerRunResult(result) {
  const valid = validateRunResult(result);
  if (!valid) return null;
  return { stdout: valid.stdout, stderr: valid.stderr, exitCode: valid.exitCode,
    outputTruncated: valid.outputTruncated, runtimeVersion: valid.runtimeVersion,
    knowledgePackVersion: valid.knowledgePackVersion,
    ...(valid.runtimeMode ? { runtimeMode: valid.runtimeMode } : {}) };
}

class ToolRouter {
  constructor({ documentReader, knowledgeRetriever }) {
    this.documentReader = documentReader;
    this.knowledgeRetriever = knowledgeRetriever;
  }

  async documentFor(sourceId, context) {
    if (sourceId === undefined) return validateDocument(context.activeDocument);
    if (!/^selected:[a-f0-9]{64}$/.test(sourceId) || context.excludedSourceIds?.includes(sourceId)) {
      throw new Error('Selected source ID is not allowed.');
    }
    const selected = context.selectedUris?.find(uri => selectedSourceId(uri) === sourceId);
    if (!selected) throw new Error('Selected source ID is not allowed.');
    validateUri(selected);
    const document = validateDocument(await this.documentReader.readDocument(selected));
    if (document.uri.toString() !== selected.toString()) throw new Error('Selected document URI changed.');
    return document;
  }

  async route(call, context = {}) {
    if (!call || !TOOL_NAMES.includes(call.name)) throw new Error('Unknown tutor tool.');
    if (call.name === 'readActiveDocument') {
      const args = parseArguments(call.arguments, ['sourceId']);
      if (args.sourceId !== undefined && typeof args.sourceId !== 'string') throw new Error('Invalid source ID argument.');
      const document = await this.documentFor(args.sourceId, context);
      return { uri: document.uri.toString(), text: document.text, version: document.version };
    }
    if (call.name === 'searchKafeKnowledge') {
      const args = parseArguments(call.arguments, ['query'], ['query']);
      if (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 300) throw new Error('Invalid knowledge query argument.');
      const passages = await this.knowledgeRetriever.search(args.query);
      if (!Array.isArray(passages) || passages.some(item => !item || typeof item.id !== 'string' || typeof item.path !== 'string' || typeof item.text !== 'string' || typeof item.category !== 'string')) {
        throw new Error('Knowledge result shape is invalid.');
      }
      return passages;
    }
    if (call.name === 'getLatestRunResult') {
      parseArguments(call.arguments, []);
      const result = validateRunResult(context.runResult);
      return result?.sourceUri === context.activeDocument?.uri?.toString() ? providerRunResult(result) : null;
    }
    const args = parseArguments(call.arguments, ['newText', 'sourceId'], ['newText']);
    if (typeof args.newText !== 'string' || Buffer.byteLength(args.newText, 'utf8') > MAX_FILE_BYTES) throw new Error('Invalid proposal text size.');
    if (args.sourceId !== undefined && typeof args.sourceId !== 'string') throw new Error('Invalid source ID argument.');
    const document = await this.documentFor(args.sourceId, context);
    if (!document.uri.toString().toLowerCase().endsWith('.kf')) throw new Error('Code proposal target must be a KAFE document.');
    return {
      uri: document.uri, documentVersion: document.version,
      contentSha256: createHash('sha256').update(document.text, 'utf8').digest('hex'),
      newText: args.newText,
    };
  }
}

module.exports = { ToolRouter, TOOL_DEFINITIONS, TOOL_NAMES, MAX_FILE_BYTES, validateRunResult, providerRunResult, selectedSourceId };
