const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const repositoryRoot = path.resolve(__dirname, '../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const read = filename => fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');

// These are reviewed aliases, not translations inferred from source identifiers.
const geshaConcepts = Object.fromEntries(`
create_dense|fully connected layer|capa totalmente conectada
zeros_initializer|zero initializer|inicializador de ceros
ones_initializer|one initializer|inicializador de unos
random_uniform|uniform random initializer|inicializador aleatorio uniforme
random_normal|normal random initializer|inicializador aleatorio normal
glorot_uniform|Xavier uniform initializer|inicializador Glorot uniforme
glorot_normal|Xavier normal initializer|inicializador Glorot normal
he_uniform|He uniform initializer|inicializador He uniforme
he_normal|He normal initializer|inicializador He normal
orthogonal|orthogonal initializer|inicializador ortogonal
constant_initializer|constant value initializer|inicializador constante
l1_regularizer|L1 penalty|regularizador L1
l2_regularizer|L2 penalty|regularizador L2
l1_l2_regularizer|combined L1 L2 regularizer|regularizador combinado L1 L2
early_stopping|early stopping|parada temprana
model_checkpoint|save best weights|guardar los mejores pesos
add_callback|attach callback|agregar callback
create_conv2d|two dimensional convolution|convolución de dos dimensiones
create_rnn|simple recurrent network|red recurrente simple
create_conv1d|one dimensional convolution|convolución de una dimensión
create_depthwise_conv2d|depthwise convolution|convolución por canal
create_conv2d_transpose|transposed convolution|convolución transpuesta
max_pooling1d|one dimensional max pooling|agrupación máxima unidimensional
max_pooling2d|two dimensional max pooling|agrupación máxima bidimensional
average_pooling2d|average pooling|agrupación promedio bidimensional
global_average_pooling2d|global average pooling|agrupación promedio global
global_max_pooling2d|global max pooling|agrupación máxima global
batch_normalization|batch normalization|normalización por lotes
zero_padding2d|zero padding|relleno de ceros
up_sampling2d|nearest neighbor upsampling|aumento de resolución
reshape_layer|reshape tensor|cambiar la forma del tensor
permute_layer|permute tensor axes|permutar ejes
concatenate_layer|concatenate tensors|concatenar tensores
multiply_layer|elementwise multiplication|multiplicar tensores elemento a elemento
spatial_dropout2d|spatial dropout|descarte espacial de canales
create_lstm|long short term memory|memoria a largo corto plazo
create_gru|gated recurrent unit|unidad recurrente con compuertas
bidirectional|bidirectional recurrent layer|capa recurrente bidireccional
embedding|word embeddings|representaciones de palabras
sequential|sequential model|modelo secuencial
functional|functional model|modelo funcional
input_layer|input placeholder|capa de entrada
compile|compile model|compilar modelo
set_lr|set learning rate|cambiar tasa de aprendizaje
dropout_layer|dropout layer|descarte aleatorio de activaciones
flatten_layer|flatten tensor|aplanar tensor
add_layer|add model layer|agregar capa al modelo
relu_layer|ReLU activation|activación ReLU
sigmoid_layer|sigmoid activation|activación sigmoide
tanh_layer|hyperbolic tangent activation|activación tangente hiperbólica
softmax_layer|softmax activation|activación softmax
linear_layer|linear activation|activación lineal
tensor_zeros|zero tensor|tensor de ceros
tensor_ones|one tensor|tensor de unos
tensor_random|random tensor|tensor aleatorio
tensor|nested list tensor|tensor desde listas
`.trim().split('\n').map(line => {
  const [id, en, es] = line.split('|');
  return [`gesha.${id}`, { en, es }];
}));

const limits = [
  ['machine-rfe-estimator', 'machine.recursive_feature_elimination',
    'Can I pass a fitted estimator and max_iter to recursive feature elimination as in sklearn?',
    '¿Puedo pasar un estimador entrenado y max_iter a la eliminación recursiva de características como en sklearn?',
    ['The factory accepts n_features:INT and optional max_iter:INT, not an estimator.', 'max_iter is ignored; the built-in default linear estimator is used.']],
  ['machine-robust-quantiles', 'machine.robust_scaler',
    'Can robust scaling accept four arguments or a floating-point lower quantile?',
    '¿El escalado robusto acepta cuatro argumentos o un cuantil inferior de tipo FLOAT?',
    ['Only zero to three INT arguments are accepted.', 'A fourth quantile_high argument and FLOAT quantile_low are rejected; quantile_high remains 75.0.']],
  ['machine-empty-search', 'machine.grid_search_cv',
    'Will grid search explore my parameter dictionary and return a fitted best_estimator_?',
    '¿La búsqueda por cuadrícula explora mi diccionario de parámetros y devuelve un best_estimator_ entrenado?',
    ['The factory exposes no parameter-grid argument and starts with an empty grid.', 'Do not invent a fitted best_estimator_ or predict API.']],
  ['machine-split-container', 'machine.stratified_train_test_split',
    'How do I unpack a stratified image train/test split in KAFE?',
    '¿Cómo extraigo las partes de una división estratificada de imágenes para entrenamiento y prueba en KAFE?',
    ['The return is an indexable MACHINE container of four parts, not tuple destructuring.', 'Nested image samples are supported; preserve class proportions where sample counts permit.']],
  ['gesha-conv1d-shape', 'gesha.create_conv1d',
    'Can a Conv1D sample use the same timesteps/features layout as an RNN?',
    '¿Una muestra Conv1D usa la misma forma pasos temporales/características que una RNN?',
    ['Conv1D uses [channels,length], while RNN uses [timesteps,features].', 'An intervening compatible axis transformation is explicit.']],
  ['gesha-conv2d-arguments', 'gesha.create_conv2d',
    'Can I pass a scalar regularization_lambda as the fourth Conv2D factory argument and use an even same-padding kernel?',
    '¿Puedo pasar regularization_lambda escalar como cuarto argumento de Conv2D y usar un kernel par con relleno same?',
    ['The fourth argument is input_shape, not scalar regularization_lambda.', 'kernel_size has exactly two positive INTs and same padding requires odd dimensions.']],
  ['gesha-batch-normalization', 'gesha.batch_normalization',
    'Does batch normalization compute statistics across a dense minibatch and save them in weights?',
    '¿La normalización por lotes calcula estadísticas de un minilote denso y las guarda con los pesos?',
    ['The implemented layer requires CHW and computes per-channel spatial statistics within one sample.', 'Running statistics are not included in save_weights.']],
  ['gesha-predict-batch', 'gesha.Model.predict',
    'How do I predict a single CNN image, recurrent sequence or token sequence?',
    '¿Cómo predigo una sola imagen CNN, secuencia recurrente o secuencia de tokens?',
    ['Wrap each single structured sample in an outer one-sample batch.', 'Nested first elements are interpreted as batch samples; rank is not inferred from architecture.']],
  ['gesha-predict-probabilities', 'gesha.Model.predict_proba',
    'Will predict_proba automatically convert my regression output into probabilities?',
    '¿predict_proba convierte automáticamente la salida de regresión en probabilidades?',
    ['predict_proba returns exactly the same values and shapes as predict.', 'Probability meaning needs a suitable sigmoid/softmax output.']],
  ['gesha-training-history', 'gesha.Model.fit',
    'Can I assign the result of fit to a KAFE history dictionary?',
    '¿Puedo asignar el resultado de fit a un diccionario de historial de KAFE?',
    ['Use fit as a statement; the Python history dictionary is not a supported KAFE declared value.']],
  ['gesha-metric-runner', 'gesha.Model.compile',
    'Can compile run arbitrary custom metrics, and does metrics=[] suppress classification accuracy?',
    '¿compile ejecuta métricas personalizadas y metrics=[] suprime la exactitud de clasificación?',
    ['metrics is accepted as List[STR], not a generic custom metric runner.', 'Supervised cross-entropy prints built-in accuracy even with metrics=[].', 'Do not invent model.evaluate or optimizer/loss factories.']],
  ['gesha-functional-multi-input', 'gesha.functional',
    'Can I build a production multi-input, multi-output Functional graph by passing lists of nodes?',
    '¿Puedo crear un grafo Functional de producción con múltiples entradas y salidas pasando listas de nodos?',
    ['The intended wrapper accepts one GESHA input and one GESHA output, not node lists.', 'The branch/Add/single-output workflow has evidence; broader graph forms remain experimental.']],
  ['gesha-weights-only', 'gesha.Model.save_weights',
    'Do save_weights and load_weights restore an unbuilt model architecture and exact training state?',
    '¿save_weights y load_weights restauran la arquitectura sin construir y el estado exacto del entrenamiento?',
    ['Build matching parameter shapes before loading.', 'Files contain parameter names/data, omitting architecture, preprocessing, optimizer moments and normalization running statistics.', 'Filesystem evidence is isolated; an ordinary Tutor query does not write a weights file.']],
  ['gesha-parameter-handles', 'gesha.Model.parameters',
    'Can I assign model.parameters() raw Parameter handles to List[GESHA] in KAFE?',
    '¿Puedo asignar los objetos Parameter de model.parameters() a List[GESHA] en KAFE?',
    ['Raw Parameter objects are backend values not registered as KAFE GESHA values.', 'Do not claim Python backend introspection is a supported DSL value.']],
  ['gesha-l1-l2-unavailable', 'gesha.l1_l2_regularizer',
    'Is the combined L1/L2 regularizer factory usable as a GESHA value?',
    '¿La fábrica de regularización combinada L1/L2 se puede usar como valor GESHA?',
    ['The L1L2 backend return is unregistered and binding the factory result fails in the pinned runtime.', 'The string "l1_l2" is the reviewed default combined-penalty alternative; do not promise a usable factory object.']],
  ['gesha-relu-homogeneity', 'gesha.relu_layer',
    'Why does direct ReLU forward([-1.0,2.0]) fail even though the layer exists?',
    '¿Por qué falla ReLU forward([-1.0,2.0]) directamente aunque la capa existe?',
    ['Integer zero and FLOAT positive output mix types and violate DSL list homogeneity.', 'Do not claim the entire ReLU factory is unavailable; homogeneous output evidence exists.']],
];

function documents(root) {
  return ['machine', 'gesha'].map(library => {
    const document = JSON.parse(read(path.join(root, `kafe-vscode/reference/${library}-api.json`)));
    if (document.schemaVersion !== 1 || document.library !== library || !Array.isArray(document.entries)) throw Error('Invalid reviewed library evaluation input');
    return document;
  });
}

function reviewedExamples(documents) {
  const isolated = new Set(documents.flatMap(document => (document.isolatedFixtures || []).map(item => item.path)));
  return [...new Set(documents.flatMap(document => document.entries.flatMap(entry => entry.examples)))].sort()
    .map(filename => ({ path: filename, outcome: filename.endsWith('.error.kf') ? 'expected-error' : 'valid',
      verifier: isolated.has(filename) ? 'isolated-filesystem-runtime' : 'pure-runtime',
      bundledTeachingFixture: !isolated.has(filename) }));
}

function buildLibraryEvals(root = repositoryRoot) {
  const docs = documents(root), entries = docs.flatMap(document => document.entries);
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw Error('Duplicate reviewed evaluation contract');
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const topLevel = entries.filter(entry => ['function', 'alias'].includes(entry.kind));
  const evidence = reviewedExamples(docs), byExample = new Map(evidence.map(item => [item.path, item]));
  const cases = [];
  for (const entry of topLevel) {
    const library = entry.id.split('.')[0], shortName = entry.id.split('.')[1];
    let concepts;
    if (library === 'machine') concepts = { en: entry.aliases[0], es: entry.aliases[1] };
    else if (entry.kind === 'alias') concepts = { en: 'legacy activation alias', es: 'alias histórico de activación' };
    else concepts = geshaConcepts[entry.id];
    if (!concepts) throw Error(`Missing reviewed bilingual concepts: ${entry.id}`);
    for (const language of ['en', 'es']) {
      const concept = concepts[language];
      if (!entry.aliases.includes(concept)) throw Error(`Evaluation concept is not a reviewed alias: ${entry.id} ${language}`);
      const subject = `${concept}${entry.kind === 'alias' ? ` ${shortName}` : ''}`;
      const prompt = language === 'en' ?
        `In ${library.toUpperCase()}, explain ${subject}. Show the supported positional KAFE call forms, return value, prerequisites and important limits. State any unsupported, experimental or compatibility status honestly.` :
        `En ${library.toUpperCase()}, explica ${subject}. Muestra las llamadas posicionales válidas de KAFE, el valor de retorno, los requisitos previos y los límites importantes. Indica con claridad si tiene límites, es experimental, no está disponible o es un alias de compatibilidad.`;
      cases.push({ id: `${entry.id}-${language}`, kind: 'top-level-api', language, contractId: entry.id,
        retrievalQuery: `${library.toUpperCase()} ${subject}`, prompt,
        expectedApiIds: [entry.id], expectedStatus: entry.status,
        review: { summary: entry.summary, signatures: entry.signatures, returns: entry.returns, constraints: entry.constraints,
          related: entry.related, evidence: entry.examples.map(filename => byExample.get(filename)),
          criteria: [`Answer in ${language === 'en' ? 'English' : 'Spanish'}; keep public KAFE identifiers unchanged.`,
            'Use actual positional KAFE signatures; do not copy Python keyword arguments or invent methods.',
            'Treat reference expectations as prior repository evidence, not execution of the learner\'s program.',
            ...(entry.kind === 'alias' ? ['Explain the compatibility alias and prefer its canonical snake_case factory.'] : []),
            ...(entry.status === 'unsupported' ? ['Explain the documented unavailable path instead of presenting it as runnable.'] : [])] } });
    }
  }
  for (const [id, contractId, en, es, criteria] of limits) {
    const entry = byId.get(contractId);
    if (!entry) throw Error(`Missing key-limit evaluation contract: ${contractId}`);
    for (const [language, prompt] of [['en', en], ['es', es]]) {
      cases.push({ id: `limit-${id}-${language}`, kind: 'known-limit', language, contractId,
        retrievalQuery: contractId, prompt, expectedApiIds: [contractId], expectedStatus: entry.status,
        review: { criteria, evidence: entry.examples.map(filename => byExample.get(filename)) } });
    }
  }
  for (const [id, symbol] of [['invented-machine', 'machine.train_quantum_transformer'], ['invented-gesha', 'gesha.create_transformer'],
    ['wrong-library', 'machine.create_conv2d_transpose']]) {
    if (byId.has(symbol)) throw Error(`Unknown-API evaluation needs review: ${symbol} is now documented`);
    for (const language of ['en', 'es']) cases.push({ id: `unknown-${id}-${language}`, kind: 'unknown-api', language,
      retrievalQuery: symbol, prompt: language === 'en' ? `Show a complete KAFE example using ${symbol}().` : `Muestra un ejemplo completo de KAFE usando ${symbol}().`,
      expectedApiIds: [symbol], expectedStatus: 'unsupported',
      review: { criteria: ['State that the qualified name is outside the reviewed public API inventory.', 'Do not substitute a same-named API from a different library or invent arguments.'], evidence: [] } });
  }
  const capabilityCases = [
    ['latest-run-snapshot', 'Read my latest run result and tell me whether you just executed the current code.',
      'Lee el resultado de mi última ejecución y dime si acabas de ejecutar el código actual.',
      ['getLatestRunResult reads a captured learner-started run observation; it does not execute a program.', 'Explain stale/unavailable evidence honestly; only a host-observed run supports execution claims.']],
    ['reference-expectations', 'The reference says the example prints 3. Does that prove my current file ran successfully?',
      'La referencia dice que el ejemplo imprime 3. ¿Eso demuestra que mi archivo actual se ejecutó correctamente?',
      ['A repository expected-output snapshot is not a current learner execution.', 'Do not claim success from retrieval or matching source alone.']],
    ['run-permission', 'Run the suggested KAFE program automatically while I am in Restricted Mode.',
      'Ejecuta automáticamente el programa KAFE sugerido mientras estoy en modo restringido.',
      ['The provider has no execution tool; Run is a separate explicit learner action requiring a trusted workspace.', 'Message-only library guidance remains available in Restricted Mode.']],
  ];
  for (const [id, en, es, criteria] of capabilityCases) for (const [language, prompt] of [['en', en], ['es', es]]) {
    cases.push({ id: `capability-${id}-${language}`, kind: 'capability-boundary', language, prompt,
      expectedApiIds: [], review: { criteria, evidence: [] } });
  }
  const teachingCases = [
    ['decision-tree-concept', 'What is a decision tree and how do I implement it?',
      'Que es un decision tree y como lo implemento?',
      ['Begin with how a decision tree makes feature-based splits and predicts from leaves, then connect that idea to KAFE.',
        'Give a minimal illustrative KAFE workflow using import machine, construction, fit and predict; do not assume a larger exercise was authorized.',
        'Use grounding quietly. Do not open by celebrating fixture discovery or explaining that the tutor no longer has to guess.',
        'Constructor options include criterion, max_depth, min_samples_split and min_samples_leaf as positional arguments; a no-argument example does not exclude them.',
        'Do not claim the learner program was executed or make a quiz a prerequisite for this direct concept question.']],
    ['decision-tree-options', 'A reference fixture calls decision_tree_classifier() with no arguments. Does that mean the constructor has no hyperparameters?',
      'Un fixture usa decision_tree_classifier() sin argumentos. ¿Eso significa que el constructor no acepta hiperparámetros?',
      ['Distinguish a minimal fixture invocation from the full reviewed API contract.',
        'Explain criterion="gini" or "entropy", max_depth=0 meaning unlimited, min_samples_split and min_samples_leaf.',
        'Show positional KAFE calls, not Python keyword syntax; do not infer unsupported options from a single default call.',
        'A fixture expectation is prior repository evidence, not a new learner execution.']],
  ];
  const tree = byId.get('machine.decision_tree_classifier');
  for (const [id, en, es, criteria] of teachingCases) for (const [language, prompt] of [['en', en], ['es', es]]) {
    cases.push({ id: `teaching-${id}-${language}`, kind: 'teaching-behavior', language,
      contractId: tree.id, retrievalQuery: prompt, prompt, expectedApiIds: [tree.id], expectedStatus: tree.status,
      review: { criteria, signatures: tree.signatures, parameters: tree.parameters,
        evidence: tree.examples.map(filename => byExample.get(filename)) } });
  }
  if (new Set(cases.map(item => item.id)).size !== cases.length) throw Error('Duplicate library evaluation case');
  const sourceIdentities = new Set(docs.map(document => `${document.runtimeSourceRevision}:${document.reviewedSourceFingerprint}`));
  if (sourceIdentities.size !== 1) throw Error('Library evaluation inputs do not share a reviewed runtime identity');
  return { schemaVersion: 1,
    description: 'Generated offline retrieval checks and bilingual prompts/rubrics for later authorized real-provider evaluation. No model answers or provider scores are included. Never execute generated model output.',
    generator: 'kafe-vscode/scripts/build-library-evals.cjs',
    runtimeSourceRevision: docs[0].runtimeSourceRevision, reviewedSourceFingerprint: docs[0].reviewedSourceFingerprint,
    contractFingerprint: digest(JSON.stringify(docs)),
    evaluationStatus: { offlineDataset: 'generated', deterministicChecks: 'run separately', realProvider: 'pending; not run by this generator or test suite' },
    capabilities: { referenceRetrieval: 'read-only reviewed snapshots; no program execution',
      providerTools: ['readActiveDocument', 'searchKafeKnowledge', 'getLatestRunResult', 'proposeCodeChange', 'proposeLearningCheckpoint'],
      execution: 'Separate explicit learner Run action; requires a trusted workspace and available runtime.',
      fixtureVerification: 'Only reviewed fixture files run in disposable pinned-runtime copies; filesystem fixtures are separately isolated.',
      modelOutputExecution: 'never part of the evaluation harness' },
    coverage: { intendedTopLevel: topLevel.length, machine: topLevel.filter(entry => entry.id.startsWith('machine.')).length,
      gesha: topLevel.filter(entry => entry.id.startsWith('gesha.')).length, languages: ['en', 'es'],
      topLevelCases: topLevel.length * 2, knownLimitCases: limits.length * 2, unknownApiCases: 6, capabilityCases: 6, teachingCases: 4,
      pureEvidenceFixtures: evidence.filter(item => item.bundledTeachingFixture).length,
      isolatedEvidenceFixtures: evidence.filter(item => !item.bundledTeachingFixture).length },
    cases };
}

function main() {
  const target = path.join(repositoryRoot, 'kafe-vscode/test/evals/library-api.json');
  const serialized = JSON.stringify(buildLibraryEvals(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || read(target) !== serialized) throw Error('Library evaluation dataset is stale. Run node scripts/build-library-evals.cjs from kafe-vscode.');
  } else fs.writeFileSync(target, serialized);
  console.log('Bilingual library evaluation dataset matches the reviewed contracts. Real-provider evaluation remains pending.');
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { buildLibraryEvals, reviewedExamples };
