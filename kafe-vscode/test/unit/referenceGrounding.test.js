const assert = require('node:assert/strict');
const test = require('node:test');
const { ContextComposer } = require('../../src/tutor/ContextComposer');

test('message-only code advice includes bundled KAFE fundamentals and BMI fixture expectations without claiming a ready knowledge pack', async () => {
  const composer = new ContextComposer({ documentReader: { readDocument() { throw Error('No workspace reads permitted'); } },
    knowledgeRetriever: { search() { throw Error('Unavailable pack must not be searched'); } } });
  const result = await composer.compose({ request: 'Write BMI calc_imc with weight and height, zero and negative height' });
  const reference = result.snapshots.find(source => source.category === 'language-reference');
  assert.ok(reference, 'language guidance must be available independently of the managed runtime');
  assert.match(reference.text, /show\(/);
  assert.match(reference.text, /main\(\);/);
  const example = result.snapshots.find(source => source.category === 'test-reference' && source.text.includes('calc_imc'));
  assert.ok(example, 'retrieve a complete relevant repository fixture, not an unrelated chunk');
  assert.match(example.text, /22\.857142857142858/);
  assert.match(example.text, /repository expectations/i);
  assert.equal(example.uri, null);
  assert.equal(result.dependencies.knowledgeLineage, null);
  assert.deepEqual(result.dependencies.fileUris, []);
  assert.match(result.payload.messages[0].content, /full KAFE knowledge pack is unavailable/i);
  const message = result.payload.messages.find(item => item.content.startsWith(`[Source ${example.id}]`));
  assert.match(message.content, /bundled KAFE test fixture/);
  assert.doesNotMatch(message.content, /origin":"host-observed action facts/);
});

test('bare greetings retain brief greeting policy and essentials but do not retrieve incidental fixture examples', async () => {
  const composer = new ContextComposer({ documentReader: {}, knowledgeRetriever: {} });
  const result = await composer.compose({ request: 'Hola!' });
  assert.equal(result.snapshots.filter(source => source.category === 'language-reference').length, 1);
  assert.equal(result.snapshots.filter(source => source.category === 'test-reference').length, 0);
  assert.equal(result.payload.messages.at(-1).content, 'Hola!');
  assert.match(result.payload.messages[0].content, /greet briefly/);
});

test('Spanish code questions retrieve the same tested BMI example and preserve the literal request', async () => {
  const request = 'Haz una función para calcular el IMC con peso y altura';
  const result = await new ContextComposer({ documentReader: {}, knowledgeRetriever: {} }).compose({ request });
  assert.ok(result.snapshots.some(source => source.category === 'test-reference' && source.text.includes('calc_imc')));
  assert.equal(result.payload.messages.at(-1).content, request);
});
