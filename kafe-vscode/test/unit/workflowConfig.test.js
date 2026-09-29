const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflowPath = path.resolve(__dirname, '../../../.github/workflows/vscode-extension.yml');
const forbiddenPublicationAction = /^\s*-\s*uses:\s*(?=[^#\r\n]*(?:release|publish|marketplace|vsce|tag))[^#\r\n]*(?:#.*)?$/im;

function assertNoPublicationActions(workflow) {
  assert.doesNotMatch(workflow, /^\s*.*\bupload-artifact\b.*$/m);
  assert.doesNotMatch(workflow, forbiddenPublicationAction);
}

function assertNoPublicationCommands(workflow) {
  assert.doesNotMatch(
    workflow,
    /^\s*(?:-\s*run:\s*)?[^#\r\n]*\b(?:vsce\b[^#\r\n]*\bpublish|npm\s+publish|gh\s+release|git\s+tag)\b[^#\r\n]*(?:#.*)?$/im,
  );
}

function assertReadOnlyPermissions(workflow) {
  const permissionDeclarations = [...workflow.matchAll(/^[ \t]*permissions\s*:/gm)];
  assert.equal(permissionDeclarations.length, 1);
  assert.equal(permissionDeclarations[0][0], 'permissions:');
  assert.match(workflow, /^permissions:\r?\n  contents: read$/m);

  const permissionBlock = workflow.match(/^permissions:\r?\n((?:[ \t]+[^\r\n]*(?:\r?\n|$))+)/m)?.[1];
  assert.equal(permissionBlock?.replace(/\r\n/g, '\n').trimEnd(), '  contents: read');
}

test('workflow configuration asserts extension-only triggers, read-only permissions, the three OS matrix, Windows needs unit, and no publication commands', () => {
  const workflow = readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /^  push:\r?\n    paths:\r?\n      - 'kafe-vscode\/\*\*'\r?\n      - '\.github\/workflows\/vscode-extension\.yml'$/m);
  assert.match(workflow, /^  pull_request:\r?\n    paths:\r?\n      - 'kafe-vscode\/\*\*'\r?\n      - '\.github\/workflows\/vscode-extension\.yml'$/m);
  assert.match(workflow, /^  workflow_dispatch:$/m);

  assertReadOnlyPermissions(workflow);

  assert.match(workflow, /^  unit:\r?\n    strategy:\r?\n      fail-fast: false\r?\n      matrix:\r?\n        os: \[ubuntu-latest, windows-latest, macos-latest\]\r?\n    runs-on: \$\{\{ matrix\.os \}\}$/m);
  assert.match(workflow, /^  windows-extension:\r?\n    needs: unit\r?\n    runs-on: windows-latest$/m);

  const unitJob = workflow.slice(workflow.indexOf('\n  unit:'), workflow.indexOf('\n  windows-extension:'));
  const windowsJob = workflow.slice(workflow.indexOf('\n  windows-extension:'));
  assert.match(unitJob, /^    defaults:\r?\n      run:\r?\n        working-directory: kafe-vscode$/m);
  assert.match(unitJob, /^      - uses: actions\/checkout@v7$/m);
  assert.match(unitJob, /^      - uses: actions\/setup-node@v7\r?\n        with:\r?\n          node-version: 20$/m);
  assert.match(unitJob, /^      - run: npm ci$/m);
  assert.match(unitJob, /^      - run: npm run test:unit$/m);
  assert.match(windowsJob, /^    defaults:\r?\n      run:\r?\n        working-directory: kafe-vscode$/m);
  assert.match(windowsJob, /^      - uses: actions\/checkout@v7$/m);
  assert.match(windowsJob, /^      - uses: actions\/setup-node@v7\r?\n        with:\r?\n          node-version: 20$/m);

  const windowsCommands = [
    '      - run: npm ci',
    '      - run: npm run test:extension',
    '      - run: npx vsce package --out "$env:RUNNER_TEMP\\kafe-neural-suite.vsix"',
    '      - run: node test/verify-vsix.js "$env:RUNNER_TEMP\\kafe-neural-suite.vsix"',
  ];
  const windowsCommandPositions = windowsCommands.map((command) => windowsJob.indexOf(command));
  assert.ok(windowsCommandPositions.every((position) => position >= 0), 'Windows job must install, test, package, and verify');
  assert.deepEqual(windowsCommandPositions, [...windowsCommandPositions].sort((left, right) => left - right));

  assertNoPublicationActions(workflow);
  assertNoPublicationCommands(workflow);
  assert.doesNotMatch(workflow, /^\s*[^#\n]*\$\{\{\s*secrets\./m);
});

test('workflow publication guard rejects release and Marketplace actions under uses', () => {
  for (const actionLine of [
    '      - uses: softprops/action-gh-release@v2',
    '      - uses: HaaLeo/publish-vscode-extension@v1',
    '      - uses: org/marketplace-publish@v1',
    '      - uses: lannonbr/vsce-action@v1',
    '      - uses: actions/create-tag@v1',
  ]) {
    assert.throws(() => assertNoPublicationActions(actionLine), assert.AssertionError);
  }
});

test('workflow publication guard rejects action references with trailing comments', () => {
  const unsafeAction = '      - uses: HaaLeo/publish-vscode-extension@v1 # publishes to the Marketplace';
  assert.throws(() => assertNoPublicationActions(unsafeAction), assert.AssertionError);
});

test('workflow publication guard rejects publish commands inside block run scripts', () => {
  const unsafeBlockRun = [
    '      - run: |',
    '          npx vsce publish',
  ].join('\n');
  assert.throws(() => assertNoPublicationCommands(unsafeBlockRun), assert.AssertionError);
});

test('workflow permission guard rejects a nested job-level permission override', () => {
  const unsafePermissions = [
    'permissions:',
    '  contents: read',
    'jobs:',
    '  unit:',
    '    permissions:',
    '      contents: write',
  ].join('\n');
  assert.throws(() => assertReadOnlyPermissions(unsafePermissions), assert.AssertionError);
});
