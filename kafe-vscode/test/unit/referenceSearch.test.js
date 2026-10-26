const assert = require('node:assert/strict');
const test = require('node:test');
const { searchTokens, extractAtomicUnits } = require('../../src/tutor/ReferenceSearch');

test('shared reference vocabulary normalizes accents, API spelling and bilingual concepts', () => {
  assert.deepEqual(searchTokens('Regresión RandomForest Conv2D input_shape'), ['regresion', 'random', 'forest', 'conv2d', 'input', 'shape']);
  const terms = searchTokens('bosque aleatorio, red neuronal, clasificación', { expandAliases: true });
  for (const expected of ['forest', 'random', 'network', 'neural', 'classification']) assert.ok(terms.includes(expected), expected);
  assert.ok(!searchTokens('regresión').includes('regression'), 'alias expansion is explicit');
});

test('atomic markdown retains nested headings, complete signatures and complete fences', () => {
  const markdown = '# GESHA\n\n## Conv1D\n\nInput shape is [batch, time, channels].\n\n```kafe\nGESHA layer = gesha.Conv1D(2, 3);\n\nshow(layer);\n```';
  const units = extractAtomicUnits(markdown);
  assert.equal(units.length, 1);
  assert.match(units[0].text, /^# GESHA\n## Conv1D/);
  assert.ok(units[0].text.includes('Input shape'));
  assert.ok(units[0].text.endsWith('```'));
  assert.ok(units[0].text.includes('\n\nshow(layer)'));
});

test('oversized code, tables and paragraphs are skipped whole with omission reasons', () => {
  const skipped = [];
  const markdown = ['# API', 'Useful short explanation.', `\`\`\`kafe\n${'show(1);\n'.repeat(50)}\`\`\``, '| signature | contract |\n' + '| x | value |\n'.repeat(30)].join('\n\n');
  const units = extractAtomicUnits(markdown, { maxChars: 150, onOmitted: item => skipped.push(item) });
  assert.deepEqual(units.map(unit => unit.text), ['# API\n\nUseful short explanation.']);
  assert.equal(skipped.length, 2);
  assert.ok(skipped.every(item => item.reason === 'unit_too_large'));
  assert.deepEqual(extractAtomicUnits('show(1);\n\n'.repeat(40), { path: 'examples/whole.kf', maxChars: 100 }), []);
});

test('incomplete fences never become apparent complete source', () => {
  const omitted = [];
  const units = extractAtomicUnits('A safe explanation.\n\n```kafe\nshow(1);', { onOmitted: item => omitted.push(item) });
  assert.deepEqual(units, [{ text: 'A safe explanation.', index: 2 }]);
  assert.equal(omitted[0].reason, 'unclosed_code_fence');
});
