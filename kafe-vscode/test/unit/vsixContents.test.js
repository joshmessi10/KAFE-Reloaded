const assert = require('node:assert/strict');
const test = require('node:test');

const { verifyEntries } = require('../verify-vsix');

const requiredEntries = [
  'extension/package.json',
  'extension/extension.js',
  'extension/LICENSE.txt',
  'extension/src/tutor/TutorViewProvider.js',
  ...['ConversationSession.js', 'ConversationHistory.js', 'RequestSnapshot.js', 'TurnController.js',
    'TutorHostActions.js', 'SessionCoordinator.js', 'ContextComposer.js', 'ToolRouter.js', 'ProgressStore.js',
    'CodeProposalProvider.js', 'KnowledgeRetriever.js', 'DevelopmentKnowledgePack.js',
    'tutorTimeline.js', 'tutorView.js', 'tutorView.html', 'tutorView.css',
    'providers/DeepSeekProvider.js', 'providers/CompletionStream.js', 'providers/ProviderError.js']
    .map(name => `extension/src/tutor/${name}`),
  'extension/src/runtimeManager.js',
  'extension/src/kafeRunner.js',
  'extension/src/runtimeManifest.json',
  'extension/media/tutor.svg',
  'extension/node_modules/yauzl/index.js',
  'extension/node_modules/yauzl/crc32.js',
  'extension/node_modules/yauzl/fd-slicer.js',
  'extension/node_modules/yauzl/package.json',
  'extension/node_modules/pend/index.js',
  'extension/node_modules/pend/package.json',
];

test('VSIX content rejects removal of each required runtime or browser asset', () => {
  for (const missing of requiredEntries) {
    assert.throws(() => verifyEntries(requiredEntries.filter(entry => entry !== missing)),
      error => error.message.includes(`required VSIX entry is missing: ${missing}`), missing);
  }
});

test('VSIX content accepts required extension files and runtime dependency', () => {
  assert.doesNotThrow(() => verifyEntries([
    '[Content_Types].xml',
    'extension.vsixmanifest',
    'extension/',
    'extension/src/',
    'extension/node_modules/',
    ...requiredEntries,
  ]));
});

test('VSIX content requires the configured tutor view icon', () => {
  assert.throws(
    () => verifyEntries(requiredEntries.filter((entry) => entry !== 'extension/media/tutor.svg')),
    /required VSIX entry is missing: extension\/media\/tutor\.svg/,
  );
});

test('VSIX content rejects tests, diagrams, host caches, secrets, and missing license', () => {
  for (const rejectedEntry of [
    'extension/test/unit/example.test.js',
    'extension/diagram/kafe-tutor-lecture.drawio',
    'extension/.vscode-test/cache.json',
    'extension/.vscode/settings.json',
    'extension/.env.production',
    'extension/config/credentials.json',
    'extension/certs/private.key',
    'extension/certs/private.pem',
  ]) {
    assert.throws(
      () => verifyEntries([...requiredEntries, rejectedEntry]),
      new RegExp(rejectedEntry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `expected verifier to reject ${rejectedEntry}`,
    );
  }

  assert.throws(
    () => verifyEntries(requiredEntries.filter((entry) => entry !== 'extension/LICENSE.txt')),
    /extension\/LICENSE\.txt/,
    'expected verifier to require the extension license',
  );

  assert.throws(
    () => verifyEntries([
      ...requiredEntries.filter((entry) => entry !== 'extension/package.json'),
      'extension/package.json/',
    ]),
    /required VSIX entry is missing: extension\/package\.json/,
    'expected a directory entry not to satisfy a required file',
  );

  assert.throws(
    () => verifyEntries([
      ...requiredEntries.filter((entry) => entry !== 'extension/package.json'),
      'extension/package.json/.',
    ]),
    /dot path segments are not allowed/,
    'expected a dot-segment alias not to satisfy a required file',
  );

  assert.throws(
    () => verifyEntries(requiredEntries.filter((entry) => entry !== 'extension/node_modules/pend/index.js')),
    /extension\/node_modules\/pend\/index\.js/,
    'expected verifier to require the runtime dependency subtree',
  );
});

test('VSIX rejects retired request and learning assets', () => {
  for (const name of ['ReviewedRequest.js', 'TutorPanel.js']) assert.throws(() => verifyEntries([...requiredEntries, `extension/src/tutor/${name}`]), /retired/);
});
