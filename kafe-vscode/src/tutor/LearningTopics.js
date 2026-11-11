const { normalizeSearchText, searchTokens } = require('./ReferenceSearch');

const MAX_TOPICS = 64;
const MAX_TOPIC_BYTES = 6 * 1024;
const LEARNING_TOPIC_IDS = Object.freeze(['classification-sensitivity', 'classifier-cost-tradeoffs', 'imbalanced-accuracy',
  'held-out-validation', 'prediction-thresholds', 'nonlinear-representation', 'learning-rate-oscillation', 'overfitting']);
const ANCHORS = new Map([
  ['classification-sensitivity', ['sensitivity', 'sensibilidad', 'recall']],
  ['classifier-cost-tradeoffs', ['tradeoffs']],
  ['imbalanced-accuracy', ['imbalance', 'imbalanced', 'unbalanced', 'desbalance', 'desbalanceados', 'desbalanceadas', 'minority', 'minoritaria']],
  ['held-out-validation', ['generalization', 'generalizacion', 'leakage', 'fuga', 'unseen']],
  ['prediction-thresholds', ['threshold', 'umbral', 'sigmoid', 'probability', 'probabilities', 'probabilidad', 'probabilidades']],
  ['nonlinear-representation', ['nonlinear', 'xor', 'perceptron']],
  ['learning-rate-oscillation', ['oscillation', 'oscillating', 'oscilacion', 'oscila', 'bouncing', 'overshooting', 'inestables', 'unstable']],
  ['overfitting', ['overfitting', 'overfit', 'sobreajuste', 'memorization', 'memorizar']],
].map(([id, anchors]) => [id, new Set(anchors)]));
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'how', 'what', 'which', 'why', 'when', 'does', 'can', 'could',
  'would', 'should', 'please', 'explain', 'help', 'about', 'this', 'that', 'these', 'those', 'from', 'into', 'than',
  'have', 'has', 'been', 'being', 'some', 'more', 'only', 'just', 'keep', 'keeps', 'getting', 'get', 'use', 'using',
  'model', 'models', 'data', 'training', 'learning', 'classifier', 'classifiers', 'classification', 'kafe', 'machine', 'gesha',
  'como', 'que', 'cual', 'cuales', 'por', 'porque', 'para', 'con', 'una', 'uno', 'unos', 'unas', 'los', 'las', 'del',
  'sobre', 'este', 'esta', 'esto', 'estos', 'estas', 'puedo', 'puede', 'podria', 'debo', 'explica', 'explicar', 'ayuda',
  'usar', 'utilizar', 'tengo', 'tiene', 'solo', 'modelo', 'modelos', 'datos', 'entrenamiento', 'aprendizaje', 'clasificador', 'clasificadores', 'clasificacion']);
const phrase = value => normalizeSearchText(value).replace(/[^a-z0-9]+/g, ' ').trim();
const terms = (value, expanded = false) => searchTokens(value, { expandAliases: expanded }).filter(word => word.length > 2 && !STOP_WORDS.has(word));

function validateLearningTopics(value) {
  const topics = Array.isArray(value) ? value : value?.schemaVersion === 1 ? value.topics : null;
  if (!Array.isArray(topics) || topics.length > MAX_TOPICS) throw TypeError('Invalid learning topic collection.');
  const seen = new Set();
  for (const topic of topics) {
    if (!topic || typeof topic !== 'object' || Array.isArray(topic) ||
      Object.keys(topic).some(key => !['id', 'aliases', 'text', 'apiIds'].includes(key)) ||
      typeof topic.id !== 'string' || !/^[a-z][a-z0-9-]{0,95}$/.test(topic.id) || seen.has(topic.id) ||
      !Array.isArray(topic.aliases) || !topic.aliases.length || topic.aliases.length > 64 ||
      topic.aliases.some(alias => typeof alias !== 'string' || !alias.trim() || alias.length > 200) ||
      typeof topic.text !== 'string' || !topic.text.trim() || Buffer.byteLength(topic.text, 'utf8') > MAX_TOPIC_BYTES ||
      !Array.isArray(topic.apiIds) || !topic.apiIds.length || topic.apiIds.length > 3 ||
      topic.apiIds.some(id => typeof id !== 'string' || !/^(machine|gesha)\.[A-Za-z][A-Za-z0-9_.]*$/.test(id)) ||
      new Set(topic.apiIds).size !== topic.apiIds.length) throw TypeError('Invalid learning topic reference.');
    seen.add(topic.id);
  }
  return structuredClone(topics);
}

/** Select current conceptual references only; no learner files, model calls or retained context. */
function selectLearningTopics(topics, query, { maxItems = 2, maxBytes = 4 * 1024 } = {}) {
  const current = validateLearningTopics(topics);
  if (typeof query !== 'string' || !Number.isSafeInteger(maxItems) || maxItems < 0 || maxItems > 5 ||
    !Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 12 * 1024) throw TypeError('Invalid learning topic selection.');
  const request = query.slice(0, 4000), normalized = ` ${phrase(request)} `;
  const bare = request.trim().replace(/\(\s*\)$/, '');
  if (/^(?:machine|gesha|geshaDeep|geshaV2)\.[A-Za-z][A-Za-z0-9_.]*$/i.test(bare) ||
    current.some(topic => topic.apiIds.some(id => id.split('.').at(-1).toLowerCase() === bare.toLowerCase()))) return [];
  const direct = new Set(terms(request)), expanded = new Set(terms(request, true));
  if (!direct.size || !maxItems || !maxBytes) return [];
  const ranked = current.map(topic => {
    const names = new Set(terms(`${topic.id} ${topic.aliases.join(' ')}`));
    const words = new Set(terms(topic.text));
    const directMatches = [...direct].filter(word => names.has(word)).length;
    const expandedMatches = [...expanded].filter(word => names.has(word)).length;
    const matchedPhrase = Math.max(0, ...topic.aliases.filter(alias => terms(alias).length && normalized.includes(` ${phrase(alias)} `))
      .map(alias => 40 + terms(alias).length * 8));
    const supporting = [...expanded].filter(word => words.has(word)).length;
    const specific = [...direct].some(word => names.has(word) && ANCHORS.get(topic.id)?.has(word));
    // Expanded synonyms of one generic term are not independent conceptual evidence.
    const confident = matchedPhrase > 0 || directMatches >= 2 || specific;
    return { topic, score: confident ?
      matchedPhrase + directMatches * 10 + expandedMatches * 3 + supporting : 0 };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.topic.id.localeCompare(b.topic.id, 'en'));
  const selected = []; let bytes = 0;
  for (const { topic } of ranked) {
    const size = Buffer.byteLength(topic.text, 'utf8');
    if (bytes + size > maxBytes) continue;
    selected.push(topic); bytes += size;
    if (selected.length === maxItems) break;
  }
  return selected;
}

module.exports = { LEARNING_TOPIC_IDS, validateLearningTopics, selectLearningTopics };
