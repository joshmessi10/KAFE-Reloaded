// Shared dependency-free vocabulary for bundled and managed KAFE references.
const CONCEPT_GROUPS = [
  ['regression', 'regresion'], ['classification', 'classifier', 'clasificacion', 'clasificador'],
  ['clustering', 'cluster', 'agrupamiento', 'agrupacion'], ['linear', 'lineal'],
  ['logistic', 'logistica', 'logistico'], ['forest', 'bosque'], ['random', 'aleatorio', 'aleatoria'],
  ['tree', 'arbol'], ['decision', 'decisiones'], ['neighbors', 'neighbours', 'vecinos', 'vecino'],
  ['neural', 'neuronal', 'neuronales'], ['network', 'networks', 'red', 'redes'],
  ['convolution', 'convolutional', 'convolucion', 'convolucional', 'cnn'],
  ['recurrent', 'recurrente', 'recurrentes', 'rnn'], ['dense', 'densa', 'densas', 'denso'],
  ['layer', 'layers', 'capa', 'capas'], ['training', 'train', 'entrenamiento', 'entrenar'],
  ['prediction', 'predict', 'prediccion', 'predecir'], ['loss', 'perdida'],
  ['optimizer', 'optimizers', 'optimizador', 'optimizadores'], ['metric', 'metrics', 'metrica', 'metricas'],
  ['preprocessing', 'preprocesamiento'], ['feature', 'features', 'caracteristica', 'caracteristicas'],
  ['scaler', 'scaling', 'escalado', 'escalar'],
  ['normalization', 'normalizacion'], ['tensor', 'tensors', 'tensores'],
  ['shape', 'shapes', 'forma', 'formas', 'dimension', 'dimensiones'],
  ['validation', 'validacion'], ['split', 'division', 'particion'], ['weight', 'weights', 'peso', 'pesos'],
  ['save', 'guardar'], ['load', 'cargar'], ['embedding', 'embeddings', 'incrustacion'],
  ['initializer', 'initializers', 'inicializador', 'inicializadores'], ['orthogonal', 'ortogonal'],
  ['imputation', 'imputer', 'imputacion', 'imputar', 'rellenar'], ['missing', 'faltante', 'faltantes'],
  ['cross', 'cruzada', 'cruzado'], ['batch', 'lote', 'lotes'], ['variance', 'varianza'],
  ['regularization', 'regularizer', 'regularizacion', 'regularizador'], ['recursive', 'recursiva', 'recursivo'],
  ['selection', 'seleccion', 'seleccionar'],
  ['transpose', 'transposed', 'transpuesta', 'transpuesto'],
  ['early', 'temprana', 'temprano'], ['stopping', 'parada', 'detencion'],
];
const ALIASES = new Map(CONCEPT_GROUPS.flatMap(group => group.map(term => [term, group])));

function normalizeSearchText(value) {
  return String(value).replace(/https?:\/\/[^\s/]+/gi, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

function searchTokens(value, { expandAliases = false } = {}) {
  const terms = normalizeSearchText(value).match(/[a-z0-9]+/g) || [];
  return [...new Set(expandAliases ? terms.flatMap(term => ALIASES.get(term) || [term]) : terms)];
}

/** Keep signatures, tables, paragraphs and fenced programs whole; never return clipped code. */
function extractAtomicUnits(value, { path = '', maxChars = 2000, onOmitted = () => {} } = {}) {
  if (!Number.isSafeInteger(maxChars) || maxChars < 1) throw Error('Invalid reference unit character limit.');
  const text = String(value).replace(/\r\n/g, '\n').trim();
  const result = []; let index = 0;
  const admit = (body, heading = '') => {
    if (!body.trim()) return;
    const content = [heading, body.trim()].filter(Boolean).join('\n\n');
    const unit = { text: content, index: ++index };
    if (content.length > maxChars) onOmitted({ index: unit.index, reason: 'unit_too_large', chars: content.length, path });
    else result.push(unit);
  };
  if (!text) return result;
  // A standalone source is one runnable unit, even if it contains blank lines.
  if (/\.(?:kf|g4)$/i.test(path)) { admit(text); return result; }
  let heading = '', headings = [], blocks = [], paragraph = [], fence = null;
  const flushParagraph = () => { if (paragraph.length) { blocks.push(paragraph.join('\n')); paragraph = []; } };
  const flushSection = () => {
    flushParagraph();
    if (!blocks.length) return;
    const entire = blocks.join('\n\n');
    // A headed API section keeps its parameters, caveats and example together when bounded.
    if (heading && `${heading}\n\n${entire}`.length <= maxChars) admit(entire, heading);
    else for (const block of blocks) admit(block, heading);
    blocks = [];
  };
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      paragraph.push(line);
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = null; flushParagraph();
      }
      continue;
    }
    if (marker) { flushParagraph(); fence = { character: marker[1][0], length: marker[1].length }; paragraph.push(line); continue; }
    const title = line.match(/^(#{1,6})\s+/);
    if (title) {
      flushSection(); headings.length = title[1].length - 1; headings.push(line.trim());
      heading = headings.filter(Boolean).join('\n'); continue;
    }
    if (!line.trim()) flushParagraph();
    else paragraph.push(line);
  }
  if (fence) {
    // Incomplete fenced source is unavailable, never converted into apparent runnable guidance.
    onOmitted({ index: ++index, reason: 'unclosed_code_fence', chars: paragraph.join('\n').length, path });
    paragraph = [];
  }
  flushSection();
  return result;
}

module.exports = { normalizeSearchText, searchTokens, extractAtomicUnits };
