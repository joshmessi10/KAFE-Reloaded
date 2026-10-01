/**
 * @typedef {{fileUris:string[], knowledgeLineage:string|null}} Dependencies
 * @typedef {{id:string, learnerText:string, assistantText:string, dependencies:Dependencies}} HistoryPair
 */
const MAX_HISTORY_PAIRS = 8;
const MAX_HISTORY_BYTES = 32 * 1024;

function validDependencies(value) {
  return value && Array.isArray(value.fileUris) && value.fileUris.every(uri => typeof uri === 'string' && /^file:\/\/.+/.test(uri)) &&
    (value.knowledgeLineage === null || (typeof value.knowledgeLineage === 'string' && value.knowledgeLineage.length > 0));
}

/** @param {Dependencies[]} items @returns {Dependencies} */
function mergeDependencies(items) {
  if (!Array.isArray(items) || items.some(item => !validDependencies(item))) throw new Error('Invalid history dependencies.');
  const lineages = [...new Set(items.map(item => item.knowledgeLineage).filter(item => item !== null))];
  if (lineages.length > 1) throw new Error('Conflicting knowledge lineage.');
  return { fileUris: [...new Set(items.flatMap(item => item.fileUris))].sort(), knowledgeLineage: lineages[0] ?? null };
}

/** @returns {{pairs:HistoryPair[], omissions:{id:string,reason:string}[], byteLength:number, dependencies:Dependencies}} */
function selectHistory({ pairs = [], authorizedFileUris = [], knowledgeLineage = null }) {
  if (!Array.isArray(pairs) || !Array.isArray(authorizedFileUris)) throw new Error('Invalid history selection.');
  const authorized = new Set(authorizedFileUris), reasons = new Map(), selected = [];
  let byteLength = 0, byteBudgetReached = false;
  for (let index = pairs.length - 1; index >= 0; index--) {
    const pair = pairs[index];
    let reason;
    if (!pair || typeof pair.id !== 'string' || typeof pair.learnerText !== 'string' || typeof pair.assistantText !== 'string' ||
      !validDependencies(pair.dependencies) || (pair.status !== undefined && pair.status !== 'completed')) reason = 'incomplete-pair';
    else if (pair.dependencies.fileUris.some(uri => !authorized.has(uri))) reason = 'source-revoked';
    else if (pair.dependencies.knowledgeLineage !== null && pair.dependencies.knowledgeLineage !== knowledgeLineage) reason = 'knowledge-lineage-changed';
    const size = reason ? 0 : Buffer.byteLength(pair.learnerText, 'utf8') + Buffer.byteLength(pair.assistantText, 'utf8');
    if (!reason && size > MAX_HISTORY_BYTES) reason = 'oversized-pair';
    if (!reason && selected.length >= MAX_HISTORY_PAIRS) reason = 'pair-limit';
    if (!reason && (byteBudgetReached || byteLength + size > MAX_HISTORY_BYTES)) { reason = 'byte-limit'; byteBudgetReached = true; }
    if (reason) reasons.set(index, reason);
    else {
      selected.unshift(structuredClone({ id: pair.id, learnerText: pair.learnerText, assistantText: pair.assistantText, dependencies: pair.dependencies }));
      byteLength += size;
    }
  }
  return { pairs: selected, omissions: pairs.flatMap((pair, index) => reasons.has(index) ? [{ id: pair?.id ?? `invalid:${index}`, reason: reasons.get(index) }] : []),
    byteLength, dependencies: mergeDependencies(selected.map(pair => pair.dependencies)) };
}

module.exports = { selectHistory, mergeDependencies, MAX_HISTORY_PAIRS, MAX_HISTORY_BYTES };
