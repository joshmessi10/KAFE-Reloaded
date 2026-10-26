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

test('workflow configuration covers language/reference changes, read-only permissions, the three OS matrix, Windows needs unit, and no publication commands', () => {
  const workflow = readFileSync(workflowPath, 'utf8');

  for (const event of ['push', 'pull_request']) {
    const block = workflow.match(new RegExp(`^  ${event}:\\r?\\n    paths:\\r?\\n((?:      - [^\\r\\n]+\\r?\\n)+)`, 'm'))?.[1];
    assert.ok(block, `${event} has explicit path triggers`);
    const paths = [...block.matchAll(/      - '([^']+)'/g)].map(match => match[1]);
    assert.deepEqual(paths, ['kafe-vscode/**', 'src/**', 'tests/**', 'docs/**', 'pyproject.toml', 'uv.lock', '.github/workflows/vscode-extension.yml']);
  }
  assert.match(workflow, /^  workflow_dispatch:$/m);

  assertReadOnlyPermissions(workflow);

  assert.match(workflow, /^  unit:\r?\n    strategy:\r?\n      fail-fast: false\r?\n      matrix:\r?\n        os: \[ubuntu-latest, windows-latest, macos-26-intel\]\r?\n    runs-on: \$\{\{ matrix\.os \}\}$/m);
  assert.match(workflow, /^  windows-extension:\r?\n    needs: unit\r?\n    runs-on: windows-latest$/m);

  const unitJob = workflow.slice(workflow.indexOf('\n  unit:'), workflow.indexOf('\n  windows-extension:'));
  const windowsJob = workflow.slice(workflow.indexOf('\n  windows-extension:'));
  assert.match(unitJob, /^    defaults:\r?\n      run:\r?\n        working-directory: kafe-vscode$/m);
  assert.match(unitJob, /^      - uses: actions\/checkout@v7$/m);
  assert.match(unitJob, /^      - uses: actions\/setup-node@v7\r?\n        with:\r?\n          node-version: 24$/m);
  assert.match(unitJob, /^      - name: Verify macOS host architecture\r?\n        if: matrix\.os == 'macos-26-intel'\r?\n        run: \|\r?\n          sw_vers\r?\n          node -e /m);
  assert.match(unitJob, /console\.log\(process\.platform, process\.arch\); assert\.equal\(process\.platform, 'darwin'\); assert\.equal\(process\.arch, 'x64'\);/);
  assert.match(unitJob, /^      - run: npm ci$/m);
  assert.match(unitJob, /^      - name: Audit extension dependencies\r?\n        if: matrix\.os == 'ubuntu-latest'\r?\n        run: npm audit --audit-level=low$/m);
  assert.match(unitJob, /^      - run: npm run test:unit$/m);
  assert.match(windowsJob, /^    defaults:\r?\n      run:\r?\n        working-directory: kafe-vscode$/m);
  assert.match(windowsJob, /^      - uses: actions\/checkout@v7$/m);
  assert.match(windowsJob, /^      - uses: actions\/setup-node@v7\r?\n        with:\r?\n          node-version: 24$/m);
  const developerNodeVersions = [...workflow.matchAll(/^          node-version: (\d+)$/gm)].map(match => match[1]);
  assert.deepEqual(developerNodeVersions, ['24', '24', '24', '24'], 'all developer jobs use the supported LTS toolchain');

  const windowsCommands = [
    '      - run: npm ci',
    '      - run: npm run test:extension',
    '      - run: npx vsce package --out "$env:RUNNER_TEMP\\kafe-neural-suite.vsix"',
    '      - run: node test/verify-vsix.js "$env:RUNNER_TEMP\\kafe-neural-suite.vsix"',
  ];
  const windowsCommandPositions = windowsCommands.map((command) => windowsJob.indexOf(command));
  assert.ok(windowsCommandPositions.every((position) => position >= 0), 'Windows job must install, test, package, and verify');
  assert.deepEqual(windowsCommandPositions, [...windowsCommandPositions].sort((left, right) => left - right));

  const layoutJob = workflow.slice(workflow.indexOf('\n  layout:'));
  assert.match(layoutJob, /^    timeout-minutes: 10$/m);
  assert.match(layoutJob, /if ! browser_path="\$\(command -v google-chrome\)"; then/);
  assert.match(layoutJob, /::error::The runner image must provide Google Chrome/);
  assert.match(layoutJob, /^          test -x "\$browser_path"$/m);
  assert.match(layoutJob, /^          "\$browser_path" --version$/m);
  assert.match(layoutJob, /echo "KAFE_LAYOUT_BROWSER=\$browser_path" >> "\$GITHUB_ENV"/);
  assert.match(layoutJob, /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install[^\r\n]*--ignore-scripts[^\r\n]*playwright@1\.62\.1$/m);
  assert.match(layoutJob, /KAFE_PLAYWRIGHT_MODULE="\$RUNNER_TEMP\/kafe-layout\/node_modules\/playwright" npm run test:layout/);
  assert.doesNotMatch(layoutJob, /\bapt(?:-get)?\b|--with-deps|cli\.js["']?\s+install/);

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
