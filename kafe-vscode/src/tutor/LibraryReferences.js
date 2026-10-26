const { createHash } = require('node:crypto');
const { searchTokens, normalizeSearchText } = require('./ReferenceSearch');
const { validateLearningTopics, selectLearningTopics } = require('./LearningTopics');
const manifest = require('../runtimeManifest.json');

const digest = value => createHash('sha256').update(value).digest('hex');
const STOP = new Set(['the', 'and', 'with', 'for', 'how', 'what', 'can', 'does', 'this', 'that', 'please', 'explain',
  'kafe', 'machine', 'gesha', 'geshadeep', 'geshav2', 'como', 'que', 'para', 'con', 'una', 'los', 'las', 'del', 'explica',
  'is', 'it', 'be', 'do', 'are', 'me', 'use', 'my', 'your', 'tell', 'about', 'using', 'es', 'son', 'un', 'el', 'la', 'lo', 'se', 'de', 'por', 'sobre', 'usar', 'utilizar']);
const safePath = value => typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
  !/[:\\\x00-\x1f\x7f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
const phrase = value => normalizeSearchText(value).replace(/[^a-z0-9]+/g, ' ').trim();
let defaultReferences;

function formatEntry(entry) {
  return [`${entry.id} — ${entry.status}`, entry.summary, 'KAFE positional call forms:', ...entry.signatures,
    ...(entry.parameters.length ? ['Parameters:', ...entry.parameters] : []), `Returns: ${entry.returns}`,
    ...(entry.constraints.length ? ['Constraints and limits:', ...entry.constraints] : []),
    ...(entry.examples.length ? [`Reviewed KAFE evidence: ${entry.examples.join(', ')}`] : []),
    `Sources: ${entry.sources.join(', ')}`].join('\n');
}

function createLibraryReferences(bundle, runtime = manifest.runtime) {
  const defaults = bundle === undefined && runtime === manifest.runtime;
  if (defaults && defaultReferences) return defaultReferences;
  bundle ??= require('./libraryReferences.json');
  const { contentSha256, ...body } = bundle;
  if (body.schemaVersion !== 1 || body.referenceVersion !== 1 || body.runtimeVersion !== runtime.version ||
    body.runtimeSourceRevision !== runtime.sourceRevision || contentSha256 !== digest(JSON.stringify(body)) ||
    !['sourceFingerprint', 'runtimeSourceFingerprint', 'corpusFingerprint', 'contractFingerprint', 'evidenceFingerprint'].every(key => /^[a-f0-9]{64}$/.test(body[key] || '')) ||
    body.sourceFingerprint !== body.runtimeSourceFingerprint ||
    !Array.isArray(body.entries) || body.entries.length > 2000 || !Array.isArray(body.units) || body.units.length > 10000 ||
    Buffer.byteLength(JSON.stringify(body), 'utf8') > 8 * 1024 * 1024) throw Error('Bundled library reference integrity or runtime mismatch');
  const seen = new Set(), entries = structuredClone(body.entries), units = structuredClone(body.units);
  const topics = validateLearningTopics(body.topics || []);
  for (const entry of entries) {
    if (!/^(machine|gesha)\.[A-Za-z][A-Za-z0-9_.]*$/.test(entry.id || '') || seen.has(entry.id) ||
      !['supported', 'limited', 'experimental', 'deprecated', 'unsupported'].includes(entry.status) ||
      !['signatures', 'parameters', 'constraints', 'aliases', 'sources', 'examples'].every(field => Array.isArray(entry[field]) && entry[field].every(item => typeof item === 'string')) ||
      !entry.signatures.length || typeof entry.summary !== 'string' || typeof entry.returns !== 'string' ||
      !entry.sources.every(safePath) || Buffer.byteLength(formatEntry(entry), 'utf8') > 6 * 1024) throw Error('Invalid bundled library API contract');
    seen.add(entry.id);
  }
  for (const unit of units) {
    if (!safePath(unit.path) || typeof unit.id !== 'string' || typeof unit.text !== 'string' ||
      Buffer.byteLength(unit.text, 'utf8') > 16 * 1024 || seen.has(unit.id)) throw Error('Invalid bundled library documentation unit');
    seen.add(unit.id);
  }
  const provenance = Object.freeze({ origin: 'bundled-library-reference', referenceVersion: body.referenceVersion,
    runtimeVersion: body.runtimeVersion, runtimeSourceRevision: body.runtimeSourceRevision,
    sourceFingerprint: body.sourceFingerprint, runtimeSourceFingerprint: body.runtimeSourceFingerprint,
    corpusFingerprint: body.corpusFingerprint, contentSha256,
    evidence: 'reviewed version-matched repository contracts; not a current learner execution', license: 'GPL-3.0 (KAFE reference sources)' });
  const byId = new Map(entries.map(entry => [entry.id.toLowerCase(), entry]));
  for (const entry of entries) {
    const library = entry.id.split('.')[0];
    for (const alias of [...entry.aliases, ...(entry.sourceSymbols || []).map(symbol => `${library}.${symbol}`)]) {
      if (/^(machine|gesha)\.[A-Za-z][A-Za-z0-9_.]*$/.test(alias) && !byId.has(alias.toLowerCase())) byId.set(alias.toLowerCase(), entry);
    }
  }
  const prepared = entries.map(entry => ({ entry, names: new Set(searchTokens(entry.id)),
    aliases: entry.aliases.map(phrase), aliasWords: new Set(searchTokens(entry.aliases.join(' '))),
    words: new Set(searchTokens(`${entry.summary}\n${entry.aliases.join(' ')}\n${entry.signatures.join(' ')}`)) }));
  const preparedDocs = units.map(unit => ({ unit, pathWords: new Set(searchTokens(unit.path)), words: new Set(searchTokens(unit.text)) }));
  const bareNames = new Map();
  for (const entry of entries.filter(value => ['function', 'alias'].includes(value.kind))) {
    const name = entry.id.split('.')[1].toLowerCase();
    bareNames.set(name, [...(bareNames.get(name) || []), entry]);
  }
  const source = (id, label, text, detail) => ({ id, category: 'library-reference', label, text,
    provenance: { ...provenance, ...structuredClone(detail) } });
  const references = Object.freeze({
    entryIds: Object.freeze(entries.map(entry => entry.id)),
    inventory: Object.freeze(structuredClone(body.inventory)),
    coversPath: value => /^(?:libraries\/(?:machine|gesha)(?:\/|\.md)|examples\/tutorials\/)/i.test(value),
    select(query, { maxBytes = 8 * 1024, maxItems = 3 } = {}) {
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 12 * 1024 || !Number.isSafeInteger(maxItems) || maxItems < 0 || maxItems > 5) throw Error('Invalid library selection budget');
      const raw = String(query).slice(0, 4000), normalized = phrase(raw);
      const direct = searchTokens(raw).filter(term => term.length >= 2 && !STOP.has(term));
      const expanded = new Set(searchTokens(raw, { expandAliases: true }).filter(term => term.length >= 2 && !STOP.has(term)));
      const qualifiedPattern = /\b(machine|gesha|geshaDeep|geshaV2)\.([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)/gi;
      const qualified = [...raw.matchAll(qualifiedPattern)]
        .map(match => `${match[1].toLowerCase() === 'machine' ? 'machine' : 'gesha'}.${match[2]}`);
      const exact = new Set(qualified.map(value => byId.get(value.toLowerCase())?.id).filter(Boolean));
      const library = /\bmachine\b/i.test(raw) && !/\bgesha(?:Deep|V2)?\b/i.test(raw) ? 'machine' :
        /\bgesha(?:Deep|V2)?\b/i.test(raw) && !/\bmachine\b/i.test(raw) ? 'gesha' : null;
      // Resolve a standalone factory identifier only outside qualified expressions.
      // This must never turn an unknown machine.foo into an alleged gesha.foo.
      const unqualified = raw.replace(qualifiedPattern, ' ');
      for (const name of unqualified.match(/[A-Za-z][A-Za-z0-9_]*/g) || []) {
        // Ordinary phrases such as "random tensor" must outrank the generic
        // tensor factory. Exact priority is reserved for explicit code names.
        if (!name.includes('_') && !/[a-z][A-Z]/.test(name) &&
          unqualified.trim().toLowerCase() !== name.toLowerCase() &&
          !new RegExp(`\\b${name}\\s*\\(`, 'i').test(unqualified)) continue;
        const matches = (bareNames.get(name.toLowerCase()) || []).filter(entry => !library || entry.id.startsWith(`${library}.`));
        if (matches.length === 1) exact.add(matches[0].id);
      }
      const selectedTopics = !qualified.length && !exact.size ? selectLearningTopics(topics, raw, { maxItems: 1, maxBytes: Math.min(maxBytes, 3 * 1024) }) : [];
      const topicApis = new Set(selectedTopics.flatMap(topic => topic.apiIds));
      const requestsApiForm = /\b(?:positional|signatures?|arguments?|arity|api|posicionales?|firmas?|argumentos|parametros)\b/.test(normalized);
      const conceptualQuestion = /\b(?:how|what|why|which|explain|interpret|compare|como|que|cual|explica|interpretar|comparar)\b/.test(normalized);
      const preferContract = library && (requestsApiForm || !conceptualQuestion);
      const ranked = prepared.filter(item => !library || item.entry.id.startsWith(`${library}.`) || topicApis.has(item.entry.id)).map(item => {
        const nameScore = direct.reduce((sum, term) => sum + (item.names.has(term) ? 12 : 0), 0) +
          [...expanded].reduce((sum, term) => sum + (item.names.has(term) ? 5 : 0), 0);
        const aliasScore = direct.reduce((sum, term) => sum + (item.aliasWords.has(term) ? 8 : 0), 0) +
          [...expanded].reduce((sum, term) => sum + (item.aliasWords.has(term) ? 3 : 0), 0) +
          item.aliases.reduce((sum, alias) => sum + (alias && ` ${normalized} `.includes(` ${alias} `) ? 80 + alias.split(' ').length * 10 : 0), 0);
        const textScore = [...expanded].reduce((sum, term) => sum + (item.words.has(term) ? 1 : 0), 0);
        const kindScore = item.entry.kind === 'function' ? 20 : item.entry.kind === 'method' ? 8 : 0;
        return { ...item, score: exact.has(item.entry.id) ? 10000 : (!preferContract && topicApis.has(item.entry.id) ? 500 : 0) + nameScore + aliasScore + (nameScore || aliasScore ? textScore + kindScore : 0) };
      // A general language question mentioning "weight" or "zero" is not a
      // library request. Without a library/code anchor, require concept evidence
      // strong enough to distinguish an API from incidental one-word overlap.
      }).filter(item => item.score >= (library || exact.size ? 1 : 70)).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id, 'en'));
      const selected = []; let bytes = 0;
      const admit = value => {
        const size = Buffer.byteLength(value.text, 'utf8');
        if (selected.some(item => item.id === value.id) || size > 6 * 1024 || bytes + size > maxBytes || selected.length >= maxItems) return;
        selected.push(value); bytes += size;
      };
      if (library && !direct.length) {
        const overview = units.find(unit => unit.path === `libraries/${library}.md`);
        if (overview) admit(source(`library:${overview.id}`, `Bundled ${library.toUpperCase()} overview`, overview.text, { path: overview.path }));
        return selected;
      }
      for (const symbol of [...new Set(qualified.filter(value => !byId.has(value.toLowerCase())))]) {
        admit(source(`library-unknown:${symbol}`, `Unsupported documented API: ${symbol}`,
          `${symbol} is not in the reviewed intended public API inventory for KAFE ${body.runtimeVersion}. Do not invent its arguments or claim this API is supported. Incidental Python globals are not documented KAFE APIs.`,
          { path: 'reference/library-api-inventory', status: 'unsupported', apiId: symbol }));
      }
      // An unknown exact name must not quietly turn into a different alleged API.
      if (qualified.length && !exact.size) return selected;
      const contractSource = entry => source(`library:${entry.id}`, `KAFE ${body.runtimeVersion} API: ${entry.id}`,
        formatEntry(entry), { path: `reference/${entry.id.split('.')[0]}-api.json`, apiId: entry.id, status: entry.status, examplePaths: entry.examples });
      // A library-prefixed API phrase requests its call contract; conceptual
      // questions receive the teaching explanation before implementation details.
      if (preferContract && ranked.length) admit(contractSource(ranked[0].entry));
      for (const topic of selectedTopics) admit(source(`learning:${topic.id}`, 'Reviewed learning concept', topic.text,
        { path: 'reference/learning-topics.json', topicId: topic.id, apiIds: topic.apiIds }));
      for (const { entry } of ranked) admit(contractSource(entry));
      if (selected.length < maxItems && direct.length && (library || exact.size || ranked.length)) {
        const rankedDocs = preparedDocs.map(item => ({ ...item,
          score: direct.reduce((sum, term) => sum + (item.pathWords.has(term) ? 4 : 0) + (item.words.has(term) ? 1 : 0), 0) }))
          .filter(item => item.score >= 3 && (!library || item.unit.path.includes(library)))
          .sort((a, b) => b.score - a.score || a.unit.id.localeCompare(b.unit.id, 'en'));
        for (const { unit } of rankedDocs) admit(source(`library:${unit.id}`, `Bundled KAFE tutorial: ${unit.path}`, unit.text, { path: unit.path }));
      }
      return selected;
    },
    search(query) {
      return references.select(query, { maxBytes: 12 * 1024, maxItems: 5 }).map(value => ({ id: value.id,
        path: value.provenance.path, category: value.category, text: value.text, ...value.provenance }));
    },
  });
  if (defaults) defaultReferences = references;
  return references;
}

module.exports = { createLibraryReferences, formatEntry };
