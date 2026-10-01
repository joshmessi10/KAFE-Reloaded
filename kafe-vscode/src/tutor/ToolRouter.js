const { createHash } = require('node:crypto');
const { validateSnapshot } = require('./RequestSnapshot');
const { KnowledgeUnavailable } = require('./KnowledgeRetriever');

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
  if (!uri || uri.scheme !== 'file' || typeof uri.toString !== 'function' || !/^file:\/\/.+/.test(uri.toString())) {
    throw new Error('Unsupported document URI scheme.');
  }
}

function validatePassages(passages) {
  if (!Array.isArray(passages) || passages.length > 5 || passages.some(item => !item || typeof item.id !== 'string' || !item.id ||
    typeof item.path !== 'string' || !item.path || item.path.startsWith('/') || item.path.includes('\\') || item.path.split('/').includes('..') ||
    typeof item.text !== 'string' || Buffer.byteLength(item.text, 'utf8') > MAX_FILE_BYTES || typeof item.category !== 'string')) {
    throw new Error('Knowledge passage shape or size is invalid.');
  }
  return passages;
}

// Shared identity for the live ready-pack hook and validated passage provenance.
function metadataLineage(metadata) {
  if (!metadata || !['managed', 'development'].includes(metadata.sourceMode) || typeof metadata.runtimeVersion !== 'string' ||
    typeof metadata.knowledgePackVersion !== 'string') return null;
  return JSON.stringify({ sourceMode: metadata.sourceMode, runtimeVersion: metadata.runtimeVersion, knowledgePackVersion: metadata.knowledgePackVersion,
    packIdentity: metadata.packIdentity ?? metadata.knowledgeRoot ?? null, contentSha256: metadata.expectedContentSha256 ?? metadata.contentSha256 ?? null });
}

class KnowledgeLineageChanged extends Error {
  constructor() {
    super('Knowledge pack changed; prepare a new request snapshot.');
    this.code = 'KNOWLEDGE_LINEAGE_CHANGED';
  }
}

async function readKnowledgeLineage(retriever, explicit) {
  let lineage;
  if (typeof retriever.getKnowledgeLineage === 'function') {
    lineage = await retriever.getKnowledgeLineage();
    if (explicit !== undefined && explicit !== lineage) throw new KnowledgeLineageChanged();
  } else lineage = explicit !== undefined ? explicit : retriever.knowledgeLineage ?? metadataLineage(retriever);
  if (lineage !== null && (typeof lineage !== 'string' || !lineage)) throw new Error('Knowledge lineage is invalid.');
  return lineage;
}

function assertKnowledgeCoherence(passages, lineage) {
  for (const passage of passages) {
    const fromMetadata = metadataLineage(passage);
    if ((fromMetadata !== null && fromMetadata !== lineage) ||
      (passage.knowledgeLineage !== undefined && passage.knowledgeLineage !== lineage)) throw new KnowledgeLineageChanged();
  }
}

// Fence the exact search, then check provenance to catch stale/ABA results as well.
async function retrieveKnowledge(retriever, query, relatedContext, explicit) {
  const before = await readKnowledgeLineage(retriever, explicit);
  const passages = validatePassages(await retriever.search(query, relatedContext));
  const after = await readKnowledgeLineage(retriever, explicit);
  if (before !== after) throw new KnowledgeLineageChanged();
  const identities = [...new Set(passages.flatMap(passage => [metadataLineage(passage), passage.knowledgeLineage ?? null]).filter(value => value !== null))];
  if (identities.length > 1) throw new KnowledgeLineageChanged();
  const lineage = before ?? identities[0] ?? null;
  assertKnowledgeCoherence(passages, lineage);
  return { passages, lineage };
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
    const id = sourceId ?? 'active-file';
    if (sourceId !== undefined && !/^selected:[a-f0-9]{64}$/.test(sourceId)) {
      throw new Error('Selected source ID is not allowed.');
    }
    const source = context.snapshot.sources.find(item => item.id === id && ['active-file', 'selected-file'].includes(item.category));
    if (!source) throw new Error(sourceId === undefined ? 'Captured active document is unavailable.' : 'Selected source ID is not allowed.');
    validateSnapshot(source);
    if (typeof source.uri !== 'string' || !Number.isSafeInteger(source.version)) throw new Error('Captured document snapshot is invalid.');
    return source;
  }

  /** @param {object} call @param {{snapshot:import('./RequestSnapshot').RequestSnapshot}} context */
  async route(call, context = {}) {
    if (!call || !TOOL_NAMES.includes(call.name)) throw new Error('Unknown tutor tool.');
    if (!context.snapshot || !Array.isArray(context.snapshot.sources)) throw new Error('An immutable request snapshot is required for tutor tools.');
    if (context.snapshot.submission?.context.restricted && call.name !== 'searchKafeKnowledge') throw new Error('Restricted workspace tools are unavailable.');
    if (call.name === 'readActiveDocument') {
      const args = parseArguments(call.arguments, ['sourceId']);
      if (args.sourceId !== undefined && typeof args.sourceId !== 'string') throw new Error('Invalid source ID argument.');
      const document = await this.documentFor(args.sourceId, context);
      return { uri: document.uri, text: document.text, version: document.version };
    }
    if (call.name === 'searchKafeKnowledge') {
      const args = parseArguments(call.arguments, ['query'], ['query']);
      if (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 300) throw new Error('Invalid knowledge query argument.');
      if (context.snapshot.dependencies?.knowledgeLineage === null) return { status: 'unavailable', code: 'knowledge_unavailable' };
      let passages, lineage;
      try { ({ passages, lineage } = await retrieveKnowledge(this.knowledgeRetriever, args.query, [], context.snapshot.dependencies?.knowledgeLineage)); }
      catch (error) {
        if (error instanceof KnowledgeUnavailable) return { status: 'unavailable', code: error.code };
        throw error;
      }
      if (context.snapshot.dependencies && context.snapshot.dependencies.knowledgeLineage !== lineage) throw new KnowledgeLineageChanged();
      return structuredClone(passages.map(passage => ({ ...passage, knowledgeLineage: lineage })));
    }
    if (call.name === 'getLatestRunResult') {
      parseArguments(call.arguments, []);
      const source = context.snapshot.sources.find(item => item.id === 'run-result' && item.category === 'run-result');
      if (!source) return null;
      validateSnapshot(source);
      let decoded;
      try { decoded = JSON.parse(source.text); } catch { throw new Error('Captured run result shape is invalid.'); }
      const result = validateRunResult({ ...decoded, sourceUri: source.provenance.sourceUri, runSequence: source.provenance.runSequence });
      const active = context.snapshot.sources.find(item => item.id === 'active-file' && item.category === 'active-file');
      return result?.sourceUri === active?.uri ? providerRunResult(result) : null;
    }
    const args = parseArguments(call.arguments, ['newText', 'sourceId'], ['newText']);
    if (typeof args.newText !== 'string' || Buffer.byteLength(args.newText, 'utf8') > MAX_FILE_BYTES) throw new Error('Invalid proposal text size.');
    if (args.sourceId !== undefined && typeof args.sourceId !== 'string') throw new Error('Invalid source ID argument.');
    const document = await this.documentFor(args.sourceId, context);
    if (!document.uri.toLowerCase().endsWith('.kf')) throw new Error('Code proposal target must be a KAFE document.');
    return {
      uri: document.uri, documentVersion: document.version,
      contentSha256: createHash('sha256').update(document.text, 'utf8').digest('hex'),
      newText: args.newText,
    };
  }
}

module.exports = { ToolRouter, TOOL_DEFINITIONS, TOOL_NAMES, MAX_FILE_BYTES, MAX_RUN_BYTES, validateUri, validateDocument, validateRunResult, providerRunResult, selectedSourceId, validatePassages,
  KnowledgeLineageChanged, metadataLineage, readKnowledgeLineage, assertKnowledgeCoherence, retrieveKnowledge };
