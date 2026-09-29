const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const readJson = (name) => JSON.parse(readFileSync(path.join(root, name), 'utf8'));

test('manifest keeps the Marketplace identity and registers KAFE editing', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.publisher, 'KAFEGROUP');
  assert.equal(pkg.name, 'kafe-neural-suite');
  assert.equal(pkg.version, '0.0.5');
  assert.match(pkg.engines.vscode, /^\^1\.(?:9\d|[1-9]\d\d)\.0$/);
  assert.ok(pkg.activationEvents.includes('onLanguage:kafe'));
  const language = pkg.contributes.languages.find((item) => item.id === 'kafe');
  assert.ok(language.extensions.includes('.kf'));
  assert.equal(language.configuration, './language-configuration.json');
  assert.ok(pkg.contributes.grammars.some((item) => item.language === 'kafe' && item.scopeName === 'source.kafe'));
  assert.ok(pkg.contributes.snippets.some((item) => item.language === 'kafe'));
});

test('manifest exposes the runner, runtime installer, and tutor view', () => {
  const pkg = readJson('package.json');
  const commands = new Map(pkg.contributes.commands.map((item) => [item.command, item.title]));
  assert.deepEqual([...commands.keys()].sort(), ['kafe.clearProviderKey', 'kafe.clearTutorProgress', 'kafe.configureProvider', 'kafe.installRuntime', 'kafe.openTutor', 'kafe.runFile']);
  assert.ok(pkg.activationEvents.includes('onCommand:kafe.configureProvider'));
  assert.ok(!pkg.activationEvents.includes('onCommand:kafe.configureProviderKey'));
  const extension = readFileSync(path.join(root, 'extension.js'), 'utf8');
  assert.match(extension, /registerCommand\('kafe\.configureProvider', keyHandlers\.configure\)/);
  const runCommand = pkg.contributes.commands.find((item) => item.command === 'kafe.runFile');
  assert.equal(runCommand.enablement, 'editorLangId == kafe && isWorkspaceTrusted');
  const setupCommand = pkg.contributes.commands.find((item) => item.command === 'kafe.installRuntime');
  assert.equal(setupCommand.enablement, 'isWorkspaceTrusted');
  for (const title of commands.values()) assert.match(title, /^KAFE: [A-Z][a-z]/);
  const views = Object.values(pkg.contributes.views).flat();
  assert.ok(views.some((item) => item.id === 'kafeTutorView'));
  assert.ok(pkg.activationEvents.includes('onView:kafeTutorView'));
  assert.equal(pkg.scripts['test:unit'], 'node test/run-unit-tests.js');
  assert.deepEqual(pkg.dependencies, { yauzl: '3.4.0' });
});

test('language assets reflect current grammar and snippets parse', () => {
  const config = readJson('language-configuration.json');
  assert.equal(config.comments.lineComment, '--');
  assert.deepEqual(config.comments.blockComment, ['->', '<-']);
  const syntax = readJson('syntaxes/kafe.tmLanguage.json');
  assert.equal(syntax.scopeName, 'source.kafe');
  assert.match(syntax.repository.types.patterns[0].match, /MACHINE/);
  assert.match(syntax.repository.types.patterns[0].match, /List/);
  assert.ok(!syntax.repository.keywords.patterns[0].match.includes('match'));
  assert.ok(Object.keys(readJson('snippets/kafe.json')).length >= 3);
});

test('package ignores local execution artifacts and secrets', () => {
  const ignore = readFileSync(path.join(root, '.vscodeignore'), 'utf8');
  for (const pattern of ['test/**', '.vscode-test.js', 'node_modules/**', '*.vsix', '*.tar.gz', '.venv/**', '.env*', '*.key']) {
    assert.ok(ignore.includes(pattern), `missing ${pattern}`);
  }
  assert.ok(ignore.includes('!node_modules/yauzl/**'), 'runtime package yauzl must be included in the VSIX');
  for (const pattern of [
    '!node_modules/pend/LICENSE',
    '!node_modules/pend/README.md',
    '!node_modules/pend/index.js',
    '!node_modules/pend/package.json',
  ]) {
    assert.ok(ignore.includes(pattern), `runtime package file ${pattern} must be included in the VSIX`);
  }
  assert.doesNotMatch(ignore, /^!node_modules\/pend(?:\/\*\*|\/test\.js)$/m, 'pend test.js must not be re-included');
});

test('extension package includes its declared KAFEGROUP MIT license', () => {
  const pkg = readJson('package.json');
  const license = readFileSync(path.join(root, 'LICENSE'), 'utf8');
  assert.equal(pkg.license, 'MIT');
  assert.match(license, /^MIT License\s+/);
  assert.match(license, /Copyright \(c\) 2026 KAFEGROUP/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test('learner setup covers consent, context, progress, and supported platforms', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  for (const term of ['.kf', 'Extension Development Host', 'consent', 'SecretStorage', 'context', 'progress', 'Windows', 'macOS', 'Linux']) {
    assert.ok(readme.includes(term), `README missing ${term}`);
  }
});

test('README explains separate SecretStorage key and tutor progress removal', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('KAFE: Clear Provider Key'));
  assert.ok(readme.includes('KAFE: Clear Tutor Progress'));
  assert.match(readme, /Clear Provider Key[^\n]*SecretStorage/);
  assert.doesNotMatch(readme, /Removing the API key from extension settings/);
});
