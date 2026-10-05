const assert = require('node:assert/strict');
const test = require('node:test');
const { loadView, snapshot, entry } = require('../helpers/tutorViewHarness');
const row = v => v.byId('timeline').querySelector('[data-entry-id="answer"]');
const body = v => row(v).querySelector('.entry-text');
const render = (v, text, revision = 1) => v.render(snapshot({ revision, entries: [entry('answer', 'assistant', text, { status: 'responding' })] }));

test('screenshot-like headings and four-column code table become readable semantic blocks', () => {
  const v = loadView();
  render(v, '## Function parameters\nA parameter belongs to the declaration.\n\n| Concept | Declaration | Call | Meaning |\n| --- | --- | --- | --- |\n| Parameter | `function greet(name)` | `greet("Ana")` | Receives a value |\n| Argument | `name` | `"Ana"` | Value supplied |\n\n### Compare the two');
  const b = body(v), table = b.querySelector('table');
  assert.equal(b.querySelector('h2')?.textContent, 'Function parameters');
  assert.equal(b.querySelector('h3')?.textContent, 'Compare the two');
  assert.equal(b.querySelector('p')?.textContent, 'A parameter belongs to the declaration.');
  assert.ok(table, 'pipe table must not remain paragraph text');
  assert.deepEqual(table.querySelectorAll('th').map(n => n.textContent), ['Concept', 'Declaration', 'Call', 'Meaning']);
  assert.equal(table.querySelectorAll('th').every(n => n.getAttribute('scope') === 'col'), true);
  assert.equal(table.querySelectorAll('tbody').length, 1);
  assert.equal(table.querySelectorAll('td').length, 8);
  assert.deepEqual(table.querySelectorAll('code').map(n => n.textContent), ['function greet(name)', 'greet("Ana")', 'name', '"Ana"']);
  assert.doesNotMatch(b.textContent, /---|##|\|/);
  assert.equal(table.parentNode.className, 'markdown-table');
  assert.equal(table.parentNode.getAttribute('tabindex'), '0', 'narrow table scroll area is keyboard reachable');
  assert.equal(table.parentNode.getAttribute('role'), 'region');
  assert.equal(table.parentNode.getAttribute('aria-label'), 'Table');
});

test('ATX levels are limited to 1–6 and require a space; headings interrupt paragraphs', () => {
  const v = loadView();
  render(v, 'Intro\n# One\n## Two ##\n### Three\n#### Four\n##### Five\n###### Six\n####### Literal\n##No space\n    ## Indented literal\n\\## Escaped');
  const b = body(v);
  for (const [level, label] of ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].entries()) assert.equal(b.querySelector('h' + (level + 1))?.textContent, label);
  assert.match(b.querySelectorAll('p').at(-1).textContent, /####### Literal\n##No space\n    ## Indented literal/);
  assert.equal(b.querySelectorAll('h2').length, 1);
});

test('table splitting preserves escaped pipes and pipes/backticks within inline code', () => {
  const v = loadView();
  render(v, '| Syntax | Value |\n| :--- | ---: |\n| a\\|b | `x|y` |\n| ``a`|b`` | `x\\|y` |\n| \\`literal\\` | **bold** and *emphasis* |');
  const t = body(v).querySelector('table');
  assert.ok(t);
  assert.deepEqual(t.querySelectorAll('td').map(n => n.textContent), ['a|b', 'x|y', 'a`|b', 'x|y', '`literal`', 'bold and emphasis']);
  assert.deepEqual(t.querySelectorAll('code').map(n => n.textContent), ['x|y', 'a`|b', 'x|y']);
  assert.equal(t.querySelector('strong').textContent, 'bold');
  assert.equal(t.querySelector('em').textContent, 'emphasis');
});

for (const [block, raw, selector] of [
  ['paragraph', 'Use `a\\|b` to match a literal pipe.', 'p'],
  ['heading', '## Pattern `a\\|b`', 'h2'],
  ['list', '- Pattern `a\\|b`', 'li'],
]) {
  test(`${block} inline code preserves escaped-pipe bytes while table code unescapes cell pipes`, () => {
    const v = loadView();
    render(v, raw + '\n\n| Pattern | Meaning |\n| --- | --- |\n| `a\\|b` | Table example |');
    assert.equal(body(v).querySelector(selector).querySelector('code').textContent, 'a\\|b');
    assert.equal(body(v).querySelector('table').querySelector('code').textContent, 'a|b');
  });
}

test('closing an ordinary escaped-pipe code span preserves source selection and exact code bytes', () => {
  const v = loadView(), raw = 'Regex `a\\|stable';
  render(v, raw);
  const selected = body(v).querySelector('p').childNodes.find(n => n.nodeType === 3 && n.data.includes('stable'));
  const start = selected.data.indexOf('stable');
  v.selection.setBaseAndExtent(selected, start + 6, selected, start);
  const composer = v.byId('composer'); composer.focus(); composer.value = 'Next draft'; composer.setSelectionRange(2, 5); composer.dispatch('input');
  render(v, raw + '` matches a literal pipe.', 2);
  assert.equal(body(v).querySelector('code').textContent, 'a\\|stable');
  assert.equal(v.selection.toString(), 'stable'); assert.equal(v.selection.backward, true);
  assert.equal(v.document.activeElement, composer); assert.equal(composer.value, 'Next draft');
  assert.equal(composer.selectionStart, 2); assert.equal(composer.selectionEnd, 5);
});

test('tables without outside pipes and one-column tables retain header/cell boundaries', () => {
  const v = loadView();
  render(v, 'Name | Value\n--- | ---\nname | value\n\n| One |\n| --- |\n| only |');
  assert.deepEqual(body(v).querySelectorAll('table').map(n => n.querySelectorAll('td').map(c => c.textContent)), [['name', 'value'], ['only']]);
});

test('headings and tables never promote provider HTML attributes or unsafe links to DOM authority', () => {
  const v = loadView();
  render(v, '## <img src=x onerror="bad()">\n| <button data-action-id="forged">Run</button> | Link |\n| --- | --- |\n| <script>bad()</script> | [bad](javascript:bad) |\n| [command](command:evil) | [data](data:text/html,x) |\n| [local](file:///secret) | [bad](https://user:pass@example.com) |\n| [bad](https://example.com\\evil) | [safe](https://example.com/docs) |');
  const b = body(v);
  assert.ok(b.querySelector('table'));
  for (const tag of ['script', 'img', 'button']) assert.equal(b.querySelectorAll(tag).length, 0);
  assert.match(b.textContent, /<script>bad\(\)<\/script>/);
  assert.match(b.textContent, /data-action-id="forged"/);
  assert.equal(b.querySelectorAll('a').length, 1);
  b.querySelector('a').dispatch('click');
  assert.equal(v.sent.at(-1).type, 'openLink');
  assert.equal(v.sent.at(-1).url, 'https://example.com/docs');
});

test('fenced code takes precedence over headings tables and HTML including an unclosed fence', () => {
  const v = loadView(), literal = '## Literal\n| A | B |\n| --- | --- |\n| `<img>` | \\| |';
  for (const [index, suffix] of ['', '\n```'].entries()) {
    render(v, '```kf\n' + literal + suffix, index + 1);
    assert.equal(body(v).querySelector('pre').textContent, literal);
    assert.equal(body(v).querySelector('table'), null);
    assert.equal(body(v).querySelector('h2'), null);
  }
});

test('malformed separator and mismatched rows stay visible without dropping cells', () => {
  const v = loadView();
  for (const [index, raw] of ['| A | B |\n| -- | --- |', '| A | B |\n| --- |', '| A | B |\n| --- | text |'].entries()) {
    render(v, raw, index + 1);
    assert.equal(body(v).querySelector('table'), null);
    assert.equal(body(v).textContent, raw);
  }
  render(v, '| A | B |\n| --- | --- |\n| one | two | extra |\n## Next', 4);
  assert.equal(body(v).querySelectorAll('td').length, 0);
  assert.match(body(v).querySelector('p').textContent, /one \| two \| extra/);
  assert.equal(body(v).querySelector('h2').textContent, 'Next');
});

for (const backward of [false, true]) {
  test(`streaming incomplete table reconciliation retains ${backward ? 'backward' : 'forward'} selection draft IME focus and entry identity`, () => {
    const v = loadView(), raw = '| Stable header | Value |\r\n| --- | --';
    render(v, raw);
    const initial = row(v), selected = body(v).querySelector('p').firstChild;
    v.selection.setBaseAndExtent(selected, backward ? 8 : 2, selected, backward ? 2 : 8);
    assert.equal(v.selection.toString(), 'Stable');
    const composer = v.byId('composer'); composer.focus(); composer.value = 'Next draft'; composer.setSelectionRange(2, 5); composer.dispatch('input'); composer.dispatch('compositionstart');
    const timeline = v.byId('timeline'); timeline.scrollTop = 20; timeline.scrollHeight = 1000; timeline.clientHeight = 200;
    render(v, raw + '- |\r\n| first | `pending', 2);
    assert.equal(row(v), initial);
    assert.equal(body(v).querySelector('th').textContent, 'Stable header');
    assert.equal(v.selection.toString(), 'Stable'); assert.equal(v.selection.backward, backward);
    assert.equal(v.document.activeElement, composer); assert.equal(composer.value, 'Next draft');
    assert.equal(composer.selectionStart, 2); assert.equal(composer.selectionEnd, 5); assert.equal(timeline.scrollTop, 20);
    composer.dispatch('keydown', { key: 'Enter' });
    assert.equal(v.sent.filter(m => m.type === 'submitMessage').length, 0);
  });
}

test('streamed cell code delimiter preserves source-mapped selection and stable table DOM', () => {
  const v = loadView(), raw = '| Header | Value |\n| --- | --- |\n| first | `stable words';
  render(v, raw);
  const t = body(v).querySelector('table'); assert.ok(t);
  const cell = t.querySelectorAll('td')[1], selected = cell.firstChild;
  v.selection.setBaseAndExtent(selected, 1, selected, 7);
  assert.equal(v.selection.toString(), 'stable');
  render(v, raw + '` |\n| next | value |', 2);
  assert.equal(body(v).querySelector('table'), t); assert.equal(t.querySelectorAll('td')[1], cell);
  assert.equal(cell.querySelector('code').textContent, 'stable words');
  assert.equal(v.selection.toString(), 'stable');
});

test('escaped pipe source segments keep selection through table admission and later row streaming', () => {
  const v = loadView(), raw = '| a\\| Stable header | Value |\n| --- | --';
  render(v, raw);
  const selected = body(v).querySelector('p').childNodes.find(n => n.nodeType === 3 && n.data.includes('Stable'));
  const start = selected.data.indexOf('Stable');
  v.selection.setBaseAndExtent(selected, start + 6, selected, start);
  render(v, raw + '- |\n| a\\| b | ``x`|y`` |', 2);
  const t = body(v).querySelector('table'); assert.ok(t);
  assert.equal(v.selection.toString(), 'Stable'); assert.equal(v.selection.backward, true);
  assert.equal(t.querySelector('th').textContent, 'a| Stable header');
  render(v, raw + '- |\n| a\\| b | ``x`|y`` |\n| next | value |', 3);
  assert.equal(body(v).querySelector('table'), t); assert.equal(v.selection.toString(), 'Stable');
});
