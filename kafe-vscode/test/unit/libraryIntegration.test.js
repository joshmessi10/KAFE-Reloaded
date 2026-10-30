const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');
const { ToolRouter, metadataLineage } = require('../../src/tutor/ToolRouter');
const { createLibraryReferences, formatEntry } = require('../../src/tutor/LibraryReferences');
const { createKafeReferences } = require('../../src/tutor/KafeReferences');

const byteLength = value => Buffer.byteLength(value, 'utf8');
const privateUri = { scheme: 'file', path: '/workspace/private.kf', toString() { return 'file:///workspace/private.kf'; } };
const unavailablePack = { status: 'unavailable', code: 'knowledge_missing' };
const pack = { sourceMode: 'managed', runtimeVersion: '0.3.0', knowledgePackVersion: '0.3.0',
  packIdentity: 'installed-old-pack', contentSha256: 'a'.repeat(64) };

function privateBoundaries() {
  const calls = { files: 0, knowledge: 0, lineage: 0 };
  return { calls,
    documentReader: {
      readDocument() { calls.files++; throw Error('Private document bytes must not be read.'); },
      validateUri() { calls.files++; throw Error('An unselected private URI must not be authorized.'); },
    },
    knowledgeRetriever: {
      search() { calls.knowledge++; throw Error('Unavailable managed knowledge must not be searched.'); },
      getKnowledgeLineage() { calls.lineage++; throw Error('An unavailable pack has no current lineage.'); },
    },
  };
}

function stalePassages() {
  return [
    ['libraries/machine.md', 'STALE_MACHINE_NARRATIVE'],
    ['libraries/machine/classifiers.md', 'STALE_MACHINE_CLASSIFIER'],
    ['libraries/gesha/recurrent-networks.md', 'STALE_GESHA_NARRATIVE'],
    ['examples/tutorials/gesha-rnn.kf', 'STALE_TUTORIAL_COPY'],
    ['language/loops.md', 'CURRENT_NON_LIBRARY_GUIDANCE'],
  ].map(([path, text], index) => ({ id: `${path}#${index + 1}`, path, category: path.split('/')[0], text, ...pack }));
}

test('immediate shipped library context has honest provenance without runtime, managed reads or private source access', async () => {
  const boundary = privateBoundaries();
  const composer = new ContextComposer(boundary);
  const result = await composer.compose({ request: 'Explain machine.robust_scaler positional arguments.',
    candidateUris: [privateUri], knowledgeAvailability: unavailablePack,
    history: [{ id: 'old', learnerText: 'PRIVATE_OLD_PACK_QUESTION', assistantText: 'PRIVATE_OLD_PACK_ANSWER',
      dependencies: { fileUris: [], knowledgeLineage: 'expired-pack' } }] });
  const contract = result.snapshots.find(source => source.provenance.apiId === 'machine.robust_scaler');
  assert.ok(contract);
  assert.equal(contract.category, 'library-reference');
  assert.equal(contract.provenance.origin, 'bundled-library-reference');
  assert.equal(contract.provenance.runtimeVersion, '0.4.0');
  assert.equal(contract.uri, null);
  assert.deepEqual(result.dependencies, { fileUris: [], knowledgeLineage: null });
  assert.deepEqual(boundary.calls, { files: 0, knowledge: 0, lineage: 0 });
  assert.equal(result.snapshots.some(source => source.category === 'knowledge'), false);
  assert.equal(result.history.pairs.length, 0);
  const payload = JSON.stringify(result.payload);
  assert.doesNotMatch(payload, /PRIVATE_OLD_PACK|file:\/\/\/workspace\/private/);
  assert.match(result.payload.messages[0].content, /full KAFE knowledge pack is unavailable/i);
  assert.match(result.payload.messages.find(message => message.content.startsWith(`[Source ${contract.id}]`)).content,
    /bundled KAFE library contracts and documentation/);
});

test('Restricted Mode can search shipped contracts while private tools and new managed authority stay unavailable', async () => {
  const boundary = privateBoundaries();
  const composer = new ContextComposer(boundary);
  const composed = await composer.compose({ request: 'gesha.create_conv1d shapes', knowledgeAvailability: unavailablePack });
  const router = new ToolRouter(boundary);
  const context = { snapshot: { sources: composed.snapshots, dependencies: composed.dependencies,
    submission: { context: { restricted: true } } } };
  const results = await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'gesha.create_conv1d' } }, context);
  assert.ok(results.some(result => result.apiId === 'gesha.create_conv1d'));
  assert.ok(results.every(result => result.category === 'library-reference' && result.knowledgeLineage === null));
  assert.ok(results.length <= 5);
  assert.ok(results.reduce((total, result) => total + byteLength(result.text), 0) <= 12 * 1024);
  for (const name of ['readActiveDocument', 'getLatestRunResult', 'proposeCodeChange']) {
    await assert.rejects(router.route({ name, arguments: {} }, context), /restricted/i);
  }
  const unknown = await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'machine.train_quantum_transformer' } }, context);
  assert.equal(unknown[0].status, 'unsupported');
  assert.match(unknown[0].text, /not in the reviewed/);
  assert.deepEqual(boundary.calls, { files: 0, knowledge: 0, lineage: 0 });
});

test('composition excludes stale managed library narratives and tutorials while retaining unrelated verified knowledge', async () => {
  const lineage = metadataLineage(pack);
  let searches = 0;
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {
    getKnowledgeLineage: async () => lineage,
    search: async () => { searches++; return stalePassages(); },
  } });
  const result = await composer.compose({ request: 'machine.linear_regression', knowledgeAvailability: { status: 'ready', metadata: pack } });
  assert.equal(searches, 1);
  assert.ok(result.snapshots.some(source => source.provenance.apiId === 'machine.linear_regression'));
  const knowledge = result.snapshots.filter(source => source.category === 'knowledge');
  assert.deepEqual(knowledge.map(source => source.text), ['CURRENT_NON_LIBRARY_GUIDANCE']);
  assert.equal(result.dependencies.knowledgeLineage, lineage);
  assert.doesNotMatch(JSON.stringify(result.payload), /STALE_MACHINE_|STALE_GESHA_|STALE_TUTORIAL_/);
});

test('tool fallback filters stale managed library paths without relaxing the captured lineage guard', async () => {
  const lineage = metadataLineage(pack);
  let searches = 0;
  const router = new ToolRouter({ documentReader: {}, knowledgeRetriever: {
    getKnowledgeLineage: async () => lineage,
    search: async () => { searches++; return stalePassages(); },
  } });
  const result = await router.route({ name: 'searchKafeKnowledge', arguments: { query: 'unbundleduniquereference' } },
    { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: lineage } } });
  assert.equal(searches, 1);
  assert.deepEqual(result.map(passage => passage.text), ['CURRENT_NON_LIBRARY_GUIDANCE']);
  assert.equal(result[0].knowledgeLineage, lineage);
});

test('a bundled tool answer cannot bypass replacement of an already captured managed lineage', async () => {
  let searches = 0;
  const router = new ToolRouter({ documentReader: {}, knowledgeRetriever: {
    getKnowledgeLineage: async () => metadataLineage({ ...pack, packIdentity: 'replacement', contentSha256: 'b'.repeat(64) }),
    search: async () => { searches++; throw Error('Bundled lookup must not search a managed pack.'); },
  } });
  await assert.rejects(router.route({ name: 'searchKafeKnowledge', arguments: { query: 'machine.linear_regression' } },
    { snapshot: { sources: [], dependencies: { fileUris: [], knowledgeLineage: metadataLineage(pack) } } }),
  error => error.code === 'KNOWLEDGE_LINEAGE_CHANGED');
  assert.equal(searches, 0);
});

function signed(value) {
  const { contentSha256, ...body } = value;
  return { ...body, contentSha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') };
}

test('composer shares the UTF-8 library and fixture budget and omits oversized remaining examples whole', async () => {
  const ids = ['machine.linear_regression', 'machine.knn', 'gesha.create_dense'];
  const fixture = (index, characters) => ({ path: `tests/TutorReferences/machine-budget-0${index}.kf`,
    code: `-- ${'界'.repeat(characters)}\nshow(1);\n`, input: '', expectedOutput: '1\n', expectedStream: 'stdout', expectedExitCode: 0, kind: 'valid' });
  const examples = [fixture(1, 1700), fixture(2, 1000), fixture(3, 1000)];
  const libraryBundle = structuredClone(require('../../src/tutor/libraryReferences.json'));
  libraryBundle.entries = ids.map(id => {
    const entry = libraryBundle.entries.find(candidate => candidate.id === id);
    assert.ok(entry, id);
    entry.examples = examples.map(example => example.path);
    entry.summary = 'Synthetic budget pressure for the integration harness.';
    const padding = Math.floor((2600 - byteLength(formatEntry(entry))) / 3);
    assert.ok(padding > 0);
    entry.summary += '界'.repeat(padding);
    return entry;
  });
  libraryBundle.units = [];
  libraryBundle.inventory = { machine: { functions: ['linear_regression', 'knn'], aliases: {} }, gesha: { functions: ['create_dense'], aliases: {} } };
  const fixtureBundle = structuredClone(require('../../src/tutor/kafeReferences.json'));
  fixtureBundle.fixtures = examples;
  const libraryReferences = createLibraryReferences(signed(libraryBundle));
  const references = createKafeReferences(signed(fixtureBundle));
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {}, libraryReferences, references });
  const result = await composer.compose({ request: ids.join(' '), knowledgeAvailability: unavailablePack });
  const library = result.snapshots.filter(source => source.category === 'library-reference');
  const fixtures = result.snapshots.filter(source => source.category === 'test-reference');
  const libraryBytes = library.reduce((total, source) => total + byteLength(source.text), 0);
  const totalBytes = [...library, ...fixtures].reduce((total, source) => total + byteLength(source.text), 0);
  assert.equal(library.length, 3);
  assert.ok(libraryBytes > 7500 && libraryBytes <= 8 * 1024);
  assert.equal(fixtures.length, 1);
  assert.equal(fixtures[0].provenance.path, examples[1].path);
  assert.ok(fixtures[0].text.includes(JSON.stringify(examples[1])), 'the admitted fixture code/input/output is complete');
  assert.ok(totalBytes > 10000 && totalBytes <= 12 * 1024, 'multi-byte text exercises the aggregate remaining-byte bound');
  assert.ok([...library, ...fixtures].every(source => byteLength(source.text) <= 6 * 1024));
  for (const source of library) assert.equal(source.text, formatEntry(libraryBundle.entries.find(entry => entry.id === source.provenance.apiId)));
});
