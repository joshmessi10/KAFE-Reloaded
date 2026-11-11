const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { snapshot, entry, action } = require('../helpers/tutorViewHarness');

// Optional rendered suite: node --test test/layout/tutorView.layout.test.cjs
// Reuse an installed Playwright via KAFE_PLAYWRIGHT_MODULE (module name or path).
// KAFE_LAYOUT_BROWSER selects an existing Chromium/Edge executable; otherwise
// Playwright uses its configured Chromium. This test never downloads a browser.
const playwrightModule = process.env.KAFE_PLAYWRIGHT_MODULE || 'playwright';
let chromium;
try {
  ({ chromium } = require(playwrightModule));
} catch (cause) {
  throw new Error('Layout tests need an installed Playwright. Set KAFE_PLAYWRIGHT_MODULE to its module path.', { cause });
}

const tutorRoot = path.resolve(__dirname, '../../src/tutor');

test('runtime recovery browser fixtures retain explicit retry, key-dependent Send and drafts', async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const output = process.env.KAFE_LAYOUT_EVIDENCE_DIR;
  if (output) fs.mkdirSync(output, { recursive: true });
  const evidence = { surface: 'Shipped webview browser fixture; no native VS Code or real runtime acceptance', scenarios: [] };
  try {
    for (const scenario of [
      { name: 'runtime-configured-dark', width: 460, height: 650, fontSize: 13, providerKey: 'present' },
      { name: 'runtime-first-use-light', width: 460, height: 650, fontSize: 13, providerKey: 'missing', light: true, firstUse: true },
      { name: 'runtime-unknown-narrow', width: 240, height: 650, fontSize: 13, providerKey: 'unknown', firstUse: true },
      { name: 'runtime-short-light', width: 460, height: 320, fontSize: 13, providerKey: 'present', light: true },
      { name: 'runtime-enlarged', width: 320, height: 500, fontSize: 20, providerKey: 'present' },
      { name: 'runtime-narrow-short-enlarged', width: 240, height: 320, fontSize: 20, providerKey: 'present' },
      { name: 'runtime-missing-short-enlarged', width: 240, height: 320, fontSize: 20, providerKey: 'missing', firstUse: true },
    ]) await t.test(scenario.name, async () => {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
      try {
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        const state = snapshot({ entries: scenario.firstUse ? [] : Array.from({ length: 8 }, (_, i) => entry(`message-${i}`, i % 2 ? 'assistant' : 'learner', 'A saved discussion of loop boundaries. '.repeat(12))),
          view: { revision: 1, providerKey: scenario.providerKey, runtime: 'failed', contextNotice: null } });
        await page.setContent(viewHtml(scenario.fontSize, { state, light: scenario.light }));
        await page.evaluate(() => { window.sent = []; window.acquireVsCodeApi = () => ({ postMessage: message => window.sent.push(message), setState() {} }); });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
        await assertControls(page, ['#composer', '#send', '#retry-runtime', ...(scenario.firstUse ? ['#configure-provider'] : [])]);
        await page.locator('#composer').fill('Keep this draft');
        assert.equal(await page.locator('#send').isEnabled(), scenario.providerKey === 'present');
        assert.equal(await page.locator('#retry-runtime').isVisible(), true);
        await page.locator('#retry-runtime').focus(); await page.keyboard.press('Enter');
        assert.deepEqual(await page.evaluate(() => window.sent.filter(m => m.type !== 'setDraft')), [{ type: 'retryRuntimeSetup', sessionId: state.sessionId, generation: state.generation }]);
        const before = await page.evaluate(() => {
          const rect = document.querySelector('#retry-runtime').getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, documentHeight: document.documentElement.scrollHeight, documentWidth: document.documentElement.scrollWidth };
        });
        assert.ok(before.left >= 0 && before.right <= scenario.width && before.top >= 0 && before.bottom <= scenario.height);
        assert.ok(before.documentHeight <= scenario.height + 1 && before.documentWidth <= scenario.width + 1);
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}.png`) });
        await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: { ...next, view: { ...next.view, revision: 2, runtime: 'preparing' } } } })), state);
        assert.equal(await page.locator('#retry-runtime').isVisible(), false);
        assert.equal(await page.locator('#composer').inputValue(), 'Keep this draft');
        assert.equal(await page.locator('#composer').evaluate(node => node === document.activeElement), true);
        assert.equal(await page.locator('#send').isEnabled(), scenario.providerKey === 'present');
        assert.deepEqual(errors, []);
        evidence.scenarios.push({ ...scenario, recoveryControl: before, errors });
      } finally { await page.close(); }
    });
  } finally {
    if (output) fs.writeFileSync(path.join(output, 'runtime-recovery-browser-fixture.json'), JSON.stringify(evidence, null, 2));
    await browser.close();
  }
});
const scenarios = [
  { name: 'sidebar', width: 460, height: 650, fontSize: 13 },
  { name: 'narrow sidebar', width: 240, height: 650, fontSize: 13 },
  { name: 'short panel', width: 460, height: 320, fontSize: 13 },
  { name: 'larger text', width: 320, height: 500, fontSize: 20 },
  { name: 'narrow short panel with larger text', width: 240, height: 320, fontSize: 20 },
];

function viewHtml(fontSize, { state = snapshot({ entries: Array.from({ length: 12 }, (_, index) => entry(
    `message-${index}`, index % 2 ? 'assistant' : 'learner',
    `Conversation entry ${index + 1}\n\n${'A synthetic explanation of KAFE code and control flow. '.repeat(15)}`,
  )) }), light = false } = {}) {
  // Match VS Code's default body padding before loading the shipped stylesheet.
  const hostStyle = `body { margin: 0; padding: 0 20px; }
    :root { --vscode-font-size: ${fontSize}px; --vscode-font-family: Arial;
      --vscode-foreground: ${light ? '#242424' : '#ddd'}; --vscode-sideBar-background: ${light ? '#f6f6f6' : '#181818'};
      --vscode-input-background: ${light ? '#fff' : '#242424'}; --vscode-input-foreground: ${light ? '#242424' : '#ddd'};
      --vscode-input-placeholderForeground: ${light ? '#595959' : '#aaa'};
      --vscode-button-background: ${light ? '#005fb8' : '#0078d4'}; --vscode-button-foreground: #fff;
      --vscode-button-hoverBackground: ${light ? '#00519c' : '#026ec1'}; --vscode-focusBorder: ${light ? '#005fb8' : '#0078d4'};
      --vscode-scrollbarSlider-background: ${light ? '#999' : '#666'}; --vscode-panel-border: ${light ? '#b8b8b8' : '#555'}; }`;
  return fs.readFileSync(path.join(tutorRoot, 'tutorView.html'), 'utf8')
    .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
    .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${hostStyle}\n${fs.readFileSync(path.join(tutorRoot, 'tutorView.css'), 'utf8')}</style>`)
    .replace('{{INITIAL_STATE}}', () => JSON.stringify(state))
    .replace(/<script nonce="\{\{NONCE\}\}" src="[^>]*><\/script>/g, '');
}

async function geometry(page) {
  return page.evaluate(() => {
    const bounds = selector => {
      const node = document.querySelector(selector), rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
        clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
        clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, scrollTop: node.scrollTop };
    };
    return { width: window.innerWidth, height: window.innerHeight,
      document: bounds('html'), body: bounds('body'), timeline: bounds('#timeline'),
      composer: bounds('#composer-form'), first: bounds('.entry:first-child'), last: bounds('.entry:last-child') };
  });
}

function assertContained(layout, position) {
  const diagnostic = `${position}: ${JSON.stringify(layout)}`;
  assert.ok(layout.document.scrollHeight <= layout.height + 1, `Document must not have a second vertical scrollbar; ${diagnostic}`);
  assert.ok(layout.document.scrollWidth <= layout.width + 1, `Document must not overflow horizontally; ${diagnostic}`);
  assert.ok(layout.body.scrollHeight <= layout.height + 1, `Body must stay within the webview; ${diagnostic}`);
  assert.ok(layout.timeline.clientHeight > 0, `Conversation must retain visible space; ${diagnostic}`);
  assert.ok(layout.timeline.scrollHeight > layout.timeline.clientHeight, `Long conversation must scroll inside the timeline; ${diagnostic}`);
  assert.ok(layout.timeline.scrollWidth <= layout.timeline.clientWidth + 1, `Conversation text must fit its lane; ${diagnostic}`);
  assert.ok(layout.composer.top >= layout.timeline.bottom - 1, `Composer must remain below the timeline; ${diagnostic}`);
  assert.ok(layout.composer.bottom <= layout.height + 1, `Composer must remain inside the webview; ${diagnostic}`);
}

test('checkpoint browser fixtures preserve decision hierarchy, exact targets and bounded disclosures', async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const output = process.env.KAFE_LAYOUT_EVIDENCE_DIR;
  if (output) fs.mkdirSync(output, { recursive: true });
  const evidence = { surface: 'Shipped HTML/CSS/JS browser fixture; not native VS Code acceptance', scenarios: [] };
  try {
    for (const scenario of [
      { name: 'short-design', kind: 'design', width: 320, height: 650, fontSize: 13 },
      { name: 'short-implementation', kind: 'implementation', width: 320, height: 650, fontSize: 13, light: true },
      { name: 'maximal-design', kind: 'design', maximal: true, width: 320, height: 650, fontSize: 13, light: true },
      { name: 'maximal-implementation', kind: 'implementation', maximal: true, width: 320, height: 650, fontSize: 13 },
      { name: 'narrow-maximal-implementation', kind: 'implementation', maximal: true, width: 240, height: 320, fontSize: 20 },
    ]) await t.test(scenario.name, async () => {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
      try {
        const errors = [], targetUri = 'file:///C:/lessons/iteration/src/main.kf';
        const bounded = topic => Array.from({ length: 8 }, (_, i) => `${i + 1}. ${topic} ${'Keep the loop bounds explicit, compare the final counter with the last valid item, and explain how an empty input changes the result. '.repeat(5)}`.slice(0, 500));
        const checkpoint = { kind: scenario.kind, name: 'Choose how to visit each item',
          learnerProposalSummary: 'I would visit every item once and print its value.',
          tutorProposedAdditions: scenario.maximal ? bounded('Tutor suggests a boundary check.') : ['Keep the existing output format.'],
          scopeSummary: scenario.kind === 'implementation' ? 'Replace only the output statement in visitItems; keep imports, input data and other functions unchanged.' : '',
          tradeoffs: scenario.maximal ? bounded('Index control adds counter state.') : ['An index gives explicit bounds but adds counter state.'],
          unresolvedChoices: scenario.maximal ? bounded('Choose whether ordering matters before preparing code.') : [],
          sourceIds: scenario.maximal ? ['active-file', ...Array.from({ length: 7 }, (_, i) => `selected:source-${i}`)] : ['active-file'],
          priorDecisionIds: [] };
        const { LearningSession } = require('../../src/tutor/LearningSession');
        // Validate the actual domain bounds, rather than depicting an impossible checkpoint.
        const activeSource = { id: 'active-file', uri: targetUri, label: 'iteration/src/main.kf', included: true, category: 'active-file' };
        const sources = scenario.maximal ? checkpoint.sourceIds.slice(1).map((id, i) => ({ id,
          uri: `file:///C:/lessons/iteration/src/helpers-${i}.kf`, label: `iteration/src/helpers-${i}.kf`, included: true, category: 'selected-file' })) : [];
        const learning = new LearningSession(), dependencies = { files: [activeSource, ...sources].map(source => ({ uri: source.uri, version: 1, contentSha256: 'a'.repeat(64) })), knowledgeLineage: null };
        if (scenario.maximal) checkpoint.priorDecisionIds = Array.from({ length: 8 }, (_, i) => learning.addDecision({ ...checkpoint,
          name: `Earlier choice ${i + 1}`, tutorProposedAdditions: [], tradeoffs: [], unresolvedChoices: [], sourceIds: [], priorDecisionIds: [] }, dependencies).id);
        learning.addDecision(checkpoint, dependencies);
        const actions = [action('discuss', 'discussCheckpoint'), action('skip', 'skipCheckpoint')];
        actions[0].label = 'Discuss'; actions[1].label = 'Skip';
        if (scenario.kind === 'design') actions.unshift({ ...action('confirm', 'confirmCheckpoint'), label: 'Confirm choice' });
        else if (!scenario.maximal) actions.unshift({ ...action('prepare', 'implementCheckpoint'), label: 'Prepare change' });
        const current = entry('decision', 'checkpoint', checkpoint.name, { status: 'ready', actions, data: { checkpoint,
          grounding: 'source-linked-proposal', ...(scenario.kind === 'implementation' ? { targetUri, targetLabel: 'iteration/src/main.kf' } : {}) } });
        const state = snapshot({ entries: [current], context: { revision: 1, restricted: false, activeSource, sources } });
        page.on('pageerror', error => errors.push(error.message));
        await page.setContent(viewHtml(scenario.fontSize, { state, light: scenario.light }));
        await page.evaluate(() => { window.fixtureMessages = []; window.acquireVsCodeApi = () => ({ postMessage: value => window.fixtureMessages.push(value) }); });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
        const detail = page.locator('.entry-data details'), timeline = page.locator('#timeline');
        assert.match(await page.locator('#included-context').textContent(), /iteration\/src\/main.kf/);
        assert.doesNotMatch(await page.locator('#active-context').innerText(), /No file included/);
        assert.equal(await detail.getAttribute('open'), null);
        assert.equal(await page.getByText(checkpoint.tutorProposedAdditions[0], { exact: true }).isVisible(), false);
        assert.equal(await page.getByText(checkpoint.tradeoffs[0], { exact: true }).isVisible(), true);
        if (scenario.kind === 'design') assert.equal(await page.getByRole('heading', { name: 'Preparation scope', exact: true }).count(), 0);
        else {
          assert.equal(await timeline.getByText('iteration/src/main.kf', { exact: true }).isVisible(), true);
          assert.equal(await page.getByText(targetUri, { exact: true }).isVisible(), false);
        }
        assert.equal(await page.getByRole('button', { name: 'Prepare change', exact: true }).count(), scenario.kind === 'implementation' && !scenario.maximal ? 1 : 0);
        await timeline.evaluate(node => { node.scrollTop = 0; });
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}-decision.png`) });
        await page.getByRole('button', { name: 'Discuss', exact: true }).focus();
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}-actions.png`) });
        await detail.locator('summary').click();
        assert.equal(await page.getByText(checkpoint.tutorProposedAdditions.at(-1), { exact: true }).isVisible(), true);
        await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })),
          { ...state, revision: 2, entries: [{ ...current, status: 'discussed' }] });
        assert.notEqual(await detail.getAttribute('open'), null, 'Disclosure expansion survives status updates');
        const metrics = await page.evaluate(() => ({ width: innerWidth, height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
          timelineWidth: document.querySelector('#timeline').clientWidth, timelineScrollWidth: document.querySelector('#timeline').scrollWidth,
          timelineHeight: document.querySelector('#timeline').clientHeight, timelineScrollHeight: document.querySelector('#timeline').scrollHeight,
          headingMarginTop: getComputedStyle(document.querySelector('.learning-field')).marginTop,
          headingMarginBottom: getComputedStyle(document.querySelector('.learning-field h3')).marginBottom,
          messages: window.fixtureMessages }));
        assert.ok(metrics.scrollWidth <= metrics.width + 1); assert.ok(metrics.scrollHeight <= metrics.height + 1);
        await assertControls(page, ['#composer', '#send']);
        assert.ok(metrics.timelineScrollWidth <= metrics.timelineWidth + 1);
        assert.ok(metrics.timelineHeight >= scenario.fontSize * 4, 'Transcript must retain readable space at ordinary dimensions');
        assert.deepEqual(metrics.messages, []); assert.deepEqual(errors, []);
        evidence.scenarios.push({ ...scenario, checkpointBytes: Buffer.byteLength(JSON.stringify(checkpoint)), metrics, errors });
      } finally { await page.close(); }
    });
  } finally {
    await browser.close();
    if (output) fs.writeFileSync(path.join(output, 'checkpoint-browser-fixture.json'), JSON.stringify(evidence, null, 2));
  }
});

test('long conversations keep a single transcript scrollbar and a stationary composer', async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  try {
    for (const scenario of scenarios) {
      await t.test(scenario.name, async () => {
        const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
        try {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.setContent(viewHtml(scenario.fontSize));
          await page.evaluate(() => { window.acquireVsCodeApi = () => ({ postMessage() {} }); });
          await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
          await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
          assert.deepEqual(errors, [], 'The shipped view scripts must render without browser errors');
          assert.equal(await page.locator('.entry').count(), 12);
          assert.equal(await page.getByRole('heading', { name: 'You', exact: true }).count(), 6);
          assert.equal(await page.getByRole('heading', { name: 'KAFE Tutor', exact: true }).count(), 6);
          const timeline = page.getByRole('log', { name: 'Tutor conversation' });
          await timeline.focus();
          assert.equal(await page.evaluate(() => document.activeElement.id), 'timeline');

          await timeline.evaluate(node => { node.scrollTop = 0; });
          const top = await geometry(page);
          assertContained(top, 'top');
          assert.equal(top.timeline.scrollTop, 0, 'The start of the conversation must be reachable');
          assert.ok(top.first.top >= top.timeline.top - 1 && top.first.top < top.timeline.bottom,
            'The first entry must be visible at the top');

          await timeline.evaluate(node => { node.scrollTop = node.scrollHeight; });
          const bottom = await geometry(page);
          assertContained(bottom, 'bottom');
          assert.ok(Math.abs(bottom.timeline.scrollTop + bottom.timeline.clientHeight - bottom.timeline.scrollHeight) <= 1,
            'The end of the conversation must be reachable');
          assert.ok(bottom.last.bottom <= bottom.timeline.bottom + 1 && bottom.last.bottom > bottom.timeline.top,
            'The last entry must be visible at the bottom');
          assert.ok(Math.abs(top.composer.top - bottom.composer.top) <= 1 && Math.abs(top.composer.bottom - bottom.composer.bottom) <= 1,
            'Scrolling the conversation must not move the composer');
          t.diagnostic(`${scenario.name}: document ${bottom.document.scrollHeight}px / viewport ${bottom.height}px; timeline ${bottom.timeline.scrollHeight}px / ${bottom.timeline.clientHeight}px`);
        } finally { await page.close(); }
      });
    }
  } finally { await browser.close(); }
});

test('first-use browser fixture keeps setup optional, bounded and independent from runtime', async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const evidence = { surface: 'Browser fixture of shipped HTML/CSS/JS; not a native VS Code host', scenarios: [] };
  const output = process.env.KAFE_LAYOUT_EVIDENCE_DIR;
  if (output) fs.mkdirSync(output, { recursive: true });
  try {
    for (const scenario of [
      { name: 'dark-first-use', width: 320, height: 650, fontSize: 13 },
      { name: 'light-first-use', width: 320, height: 650, fontSize: 13, light: true },
      { name: 'restricted-first-use', width: 280, height: 500, fontSize: 13, restricted: true },
      { name: 'short-enlarged-first-use', width: 240, height: 320, fontSize: 20 },
    ]) await t.test(scenario.name, async () => {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
      try {
        const errors = [], state = snapshot({ view: { revision: 1, providerKey: 'missing', runtime: 'preparing', contextNotice: null },
          context: { revision: 0, restricted: Boolean(scenario.restricted), activeSource: null, sources: [] } });
        page.on('pageerror', error => errors.push(error.message));
        await page.setContent(viewHtml(scenario.fontSize, { state, light: scenario.light }));
        await page.evaluate(() => { window.fixtureMessages = []; window.acquireVsCodeApi = () => ({ postMessage: message => window.fixtureMessages.push(message) }); });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
        const aid = page.locator('#starting-aid'), configure = page.getByRole('button', { name: 'Configure Tutor', exact: true });
        assert.equal(await aid.isVisible(), true);
        const metrics = await page.evaluate(() => {
          const form = document.getElementById('composer-form').getBoundingClientRect();
          const aid = document.getElementById('starting-aid'), heading = document.getElementById('starting-title');
          return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight, composerTop: form.top, composerBottom: form.bottom,
            aidClientHeight: aid.clientHeight, aidScrollHeight: aid.scrollHeight,
            headingFontSize: getComputedStyle(heading).fontSize, headingMarginBottom: getComputedStyle(heading).marginBottom };
        });
        assert.ok(metrics.scrollWidth <= metrics.width + 1); assert.ok(metrics.scrollHeight <= metrics.height + 1);
        await assertControls(page, ['#configure-provider', '#composer', '#send']);
        assert.ok(metrics.composerTop >= 0 && metrics.composerBottom <= metrics.height + 1);
        assert.ok(metrics.aidClientHeight >= scenario.fontSize * 4, 'First-use guidance must retain useful scrolling space');
        const headingFits = await page.locator('#starting-title').evaluate(n => {
          const heading = n.getBoundingClientRect(), port = n.parentElement.getBoundingClientRect();
          return heading.top >= port.top && heading.bottom <= port.bottom && n.scrollWidth <= n.clientWidth;
        });
        assert.ok(headingFits, 'The initial introduction must be a complete visible phrase');
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}.png`) });
        await page.getByRole('textbox', { name: 'Message to KAFE Tutor' }).fill('My unsent question');
        assert.equal(await page.locator('#send').isDisabled(), true);
        await configure.click();
        const command = (await page.evaluate(() => window.fixtureMessages)).at(-1);
        assert.deepEqual(command, { type: 'configureProvider', sessionId: state.sessionId, generation: state.generation });
        await page.locator('#first-program-help > summary').click();
        await assertControls(page, ['#configure-provider', '#composer', '#send']);
        assert.match(await page.locator('#first-program-help').innerText(), /folder[\s\S]*\.kf[\s\S]*Run[\s\S]*terminal/i);
        if (scenario.restricted) { assert.equal(await page.locator('#context-run').isVisible(), false); assert.equal(await page.locator('#context-selector').isVisible(), false); }
        await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })),
          { ...state, view: { ...state.view, revision: 2, providerKey: 'present' } });
        assert.equal(await aid.isVisible(), false); assert.equal(await page.locator('#composer').inputValue(), 'My unsent question');
        assert.equal(await page.locator('#send').isEnabled(), true);
        assert.match(await page.locator('#response-state').innerText(), /key configured.*Run setup preparing/);
        assert.equal((await page.evaluate(() => window.fixtureMessages)).some(m => m.type === 'submitMessage'), false);
        assert.deepEqual(errors, []);
        evidence.scenarios.push({ ...scenario, metrics, exactConfigureMessage: command, runtimeDoesNotBlockConfiguredSend: true, errors });
      } finally { await page.close(); }
    });
  } finally {
    await browser.close();
    if (output) fs.writeFileSync(path.join(output, 'first-use-browser-fixture.json'), JSON.stringify(evidence, null, 2));
  }
});


test('captured-history browser fixtures show bounded long and restored-source disclosure', async t => {
  const { SessionCoordinator } = require('../../src/tutor/SessionCoordinator');
  const { ContextComposer } = require('../../src/tutor/ContextComposer');
  const { TutorViewProvider } = require('../../src/tutor/TutorViewProvider');
  const { randomUUID } = require('node:crypto');
  const browser = await chromium.launch({ headless: true, ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const output = process.env.KAFE_LAYOUT_EVIDENCE_DIR;
  if (output) fs.mkdirSync(output, { recursive: true });
  const evidence = { surface: 'Actual captured-history projection in shipped browser view; not native VS Code acceptance', scenarios: [] };
  try {
    for (const scenario of [
      { name: 'long-window', width: 460, height: 650, fontSize: 13 },
      { name: 'restored-source', width: 320, height: 650, fontSize: 13, restored: true, source: true, light: true },
      { name: 'changed-knowledge', width: 320, height: 650, fontSize: 13, knowledge: true },
      { name: 'narrow-restored-source', width: 240, height: 320, fontSize: 20, restored: true, source: true },
    ]) await t.test(scenario.name, async () => {
      const uri = { scheme: 'file', toString: () => 'file:///lessons/current.kf' };
      const retriever = { getKnowledgeLineage: async () => null, search: async () => [] };
      const coordinator = new SessionCoordinator({
        provider: { async *stream() { yield { type: 'complete', text: 'We can continue with your current question and included file.', toolCalls: [], finishReason: 'stop' }; } },
        contextComposer: new ContextComposer({ documentReader: { displayLabel: () => 'lessons/current.kf' }, knowledgeRetriever: retriever }),
        getContext: () => ({ activeDocument: { uri, text: 'show(1);', version: 1 }, restricted: false }), getSourceRevision: () => 0,
      });
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      try {
        for (let i = 0; i < 11; i++) {
          const learnerText = `Earlier question ${i + 1}: explain this loop.`, assistantText = 'A loop repeats its body for each item. Compare the first iteration with the next one. '.repeat(4);
          coordinator.session.appendEntry({ kind: 'learner', status: 'completed', text: learnerText });
          coordinator.session.appendEntry({ kind: 'assistant', status: 'completed', text: assistantText });
          coordinator.session.recordCompletedPair({ id: randomUUID(), learnerText, assistantText, dependencies: {
            fileUris: scenario.source && i === 0 ? ['file:///lessons/old.kf'] : [], knowledgeLineage: scenario.knowledge && i === 0 ? 'old-pack' : null } });
        }
        if (scenario.restored) {
          const saved = coordinator.captureConversation();
          assert.equal(coordinator.restoreConversation(saved).status, 'completed');
          assert.equal(coordinator.snapshot().contextNotice, null);
        }
        await coordinator.refreshContext();
        assert.equal((await coordinator.handleLearnerMessage({ type: 'submitMessage', submissionId: randomUUID(), text: 'Continue with the current file.', contextRevision: coordinator.snapshot().context.revision })).status, 'completed');
        const provider = new TutorViewProvider({ conversationSession: coordinator });
        provider.setHostMetadata({ providerKey: 'present', runtime: 'ready' });
        const state = provider.project(coordinator.snapshot());
        assert.deepEqual(state.view.contextNotice.reasons, ['window', ...(scenario.source ? ['source'] : []), ...(scenario.knowledge ? ['knowledge'] : [])]);
        assert.deepEqual(state.context.sources, []);
        await page.setContent(viewHtml(scenario.fontSize, { state, light: scenario.light }));
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
        await page.evaluate(() => { window.acquireVsCodeApi = () => ({ postMessage() {}, setState() {} }); });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
        assert.equal(await page.locator('#context-notice').count(), 1);
        assert.equal(await page.locator('#context-notice').evaluate(node => node.open), false);
        assert.match(await page.locator('#included-context').textContent(), /current.kf/);
        assert.equal(await page.locator('#timeline #context-notice').count(), 0);
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}-collapsed.png`) });
        await page.locator('#context-notice summary').click();
        assert.match(await page.locator('#context-notice-detail').textContent(), /size limit/);
        if (scenario.source) assert.match(await page.locator('#context-notice-detail').textContent(), /files that are no longer included/);
        await assertControls(page, ['#composer', '#send']);
        const layout = await geometry(page);
        assert.ok(layout.timeline.clientHeight >= scenario.fontSize * 4);
        assert.ok(layout.document.scrollWidth <= scenario.width + 1);
        assert.ok(layout.timeline.scrollWidth <= layout.timeline.clientWidth + 1);
        await page.locator('#composer').fill('My next question'); await page.locator('#composer').focus();
        await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: { ...next, revision: next.revision + 1 } } })), state);
        assert.equal(await page.locator('#context-notice').evaluate(node => node.open), true);
        assert.equal(await page.locator('#composer').inputValue(), 'My next question');
        assert.equal(await page.locator('#composer').evaluate(node => node === document.activeElement), true);
        if (output) await page.screenshot({ path: path.join(output, `${scenario.name}-expanded.png`) });
        assert.deepEqual(errors, []);
        evidence.scenarios.push({ ...scenario, reasons: state.view.contextNotice.reasons, layout, errors });
        assert.ok(layout.document.scrollHeight <= scenario.height + 1, `Document height ${layout.document.scrollHeight} exceeds viewport ${scenario.height}`);
      } finally { coordinator.dispose(); await page.close(); }
    });
  } finally {
    if (output) fs.writeFileSync(path.join(output, 'captured-history-browser-fixture.json'), JSON.stringify(evidence, null, 2));
    await browser.close();
  }
});

// Bounds are checked before any action that could scroll a locator into view.
async function assertControls(page, selectors) {
  const controls = await page.evaluate(selectors => selectors.map(selector => {
    const node = document.querySelector(selector), r = node.getBoundingClientRect();
    const clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    for (let p = node.parentElement; p; p = p.parentElement) {
      const style = getComputedStyle(p), b = p.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { clip.left = Math.max(clip.left, b.left); clip.right = Math.min(clip.right, b.right); }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { clip.top = Math.max(clip.top, b.top); clip.bottom = Math.min(clip.bottom, b.bottom); }
    }
    return { selector, rect: r.toJSON(), clip, visible: r.width > 0 && r.height > 0 && r.left >= clip.left - 1 && r.right <= clip.right + 1 && r.top >= clip.top - 1 && r.bottom <= clip.bottom + 1 };
  }), selectors);
  for (const control of controls) assert.ok(control.visible, `Essential control clipped: ${JSON.stringify(control)}`);
  return controls;
}

test('browser Stop disable blur returns draft selection immediately and late settlement respects reading focus', async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const page = await browser.newPage({ viewport: { width: 240, height: 320 } });
  try {
    const state = snapshot({ draft: 'Keep next draft', turn: { id: 'turn', turnGeneration: 1, submissionId: 'submission', status: 'responding' }, entries: Array.from({ length: 12 }, (_, i) => entry(`old-${i}`, 'assistant', 'Earlier answer. '.repeat(30))) });
    await page.setContent(viewHtml(20, { state }));
    await page.evaluate(() => { window.sent = []; window.acquireVsCodeApi = () => ({ postMessage: m => window.sent.push(m) }); });
    await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') });
    await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
    await assertControls(page, ['#composer', '#stop']);
    await page.locator('#timeline').evaluate(n => { n.scrollTop = 0; });
    await page.locator('#composer').focus();
    await page.locator('#composer').evaluate(n => n.setSelectionRange(2, 8, 'backward'));
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'stop');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'composer');
    assert.equal(await page.locator('#composer').evaluate(n => n.matches(':focus-visible') && getComputedStyle(n).outlineWidth !== '0px'), true);
    assert.equal(await page.locator('#stop').isDisabled(), true);
    assert.deepEqual(await page.locator('#composer').evaluate(n => [n.value, n.selectionStart, n.selectionEnd, n.selectionDirection]), ['Keep next draft', 2, 8, 'backward']);
    assert.deepEqual(await page.evaluate(() => window.sent), [{ type: 'stopTurn', sessionId: 'session', generation: 1, turnId: 'turn', turnGeneration: 1 }]);
    await page.locator('#timeline').focus();
    for (const [revision, status] of [[2, 'responding'], [3, 'cancelled']]) await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })), { ...state, revision, turn: { ...state.turn, status } });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'timeline');
    assert.equal(await page.locator('#timeline').evaluate(n => n.scrollTop), 0);
    assert.equal(await page.locator('#composer').inputValue(), 'Keep next draft');
    // Natural completion must not choose a new focus target for the learner.
    await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })), { ...state, revision: 4, turn: { ...state.turn, id: 'another', turnGeneration: 2 } });
    await page.locator('#stop').focus();
    await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })), { ...state, revision: 5, turn: { ...state.turn, id: 'another', turnGeneration: 2, status: 'completed' } });
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    if (process.env.KAFE_LAYOUT_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.KAFE_LAYOUT_EVIDENCE_DIR, 'stop-focus-browser-fixture.json'), JSON.stringify({ browser: await browser.version(), stopImmediatelyFocusedComposer: true, draft: 'Keep next draft', selection: [2, 8, 'backward'], lateSettlementFocus: 'timeline', lateSettlementScrollTop: 0, naturalSettlementFocus: 'body', exactStopEnvelope: await page.evaluate(() => window.sent[0]) }, null, 2));
  } finally { await page.close(); await browser.close(); }
});


test('compact file context matrix keeps essential controls together and optional content keyboard reachable', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.env.KAFE_LAYOUT_BROWSER ? { executablePath: process.env.KAFE_LAYOUT_BROWSER } : {}) });
  const output = process.env.KAFE_LAYOUT_EVIDENCE_DIR, evidence = { surface: 'Shipped browser view, real keyboard and clipping ancestor bounds; not native acceptance', scenarios: [] };
  try {
    for (const [index, scenario] of scenarios.entries()) for (const expanded of [false, true]) await t.test(`${scenario.name} ${expanded ? 'expanded' : 'collapsed'}`, async () => {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height }, reducedMotion: 'reduce', ...(index === 4 ? { forcedColors: 'active' } : {}) });
      try {
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        const activeSource = { id: 'active-file', label: 'lesson/current/main.kf', uri: 'file:///workspace/lesson/current/main.kf', included: true, category: 'active-file' };
        const sources = Array.from({ length: 10 }, (_, i) => ({ id: `file-${i}`, label: `lesson/${'long-folder/'.repeat(5)}${i}/main.kf`, uri: `file:///workspace/lesson/${i}/main.kf`, included: i < 7, category: 'selected-file' }));
        const state = snapshot({ draft: 'Next question', context: { revision: 4, restricted: false, activeSource, sources }, view: { revision: 1, providerKey: 'present', runtime: 'failed', contextNotice: { reasons: ['window', 'source', 'knowledge'] } },
          contextActions: { entryId: 'context', actions: [{ ...action('run', 'runFile', { targetUri: activeSource.uri }), label: 'Run main.kf' }] },
          entries: Array.from({ length: 12 }, (_, i) => entry(`previous-${i}`, 'assistant', 'The earlier explanation remains available. '.repeat(20))) });
        await page.setContent(viewHtml(scenario.fontSize, { state, light: index % 2 === 1 }));
        await page.evaluate(() => { window.sent = []; window.acquireVsCodeApi = () => ({ postMessage: m => window.sent.push(m) }); });
        await page.addScriptTag({ path: path.join(tutorRoot, 'tutorTimeline.js') }); await page.addScriptTag({ path: path.join(tutorRoot, 'tutorView.js') });
        assert.equal(await page.locator('#add-context').count(), 0);
        assert.equal(await page.locator('#context-count').innerText(), '8 files');
        await assertControls(page, ['#context-count', '#composer', '#send', '#retry-runtime']);
        if (expanded) {
          await page.locator('#context-summary').focus(); await page.keyboard.press('Enter');
          assert.equal(await page.locator('#context-selector').evaluate(n => n.open), true);
          await page.keyboard.press('Tab');
          await assertControls(page, ['#included-context [data-context-command="reveal"]']);
          assert.ok((await page.locator('#included-context [data-context-command="reveal"]').first().getAttribute('aria-label')).includes(activeSource.uri));
          await page.keyboard.press('Enter');
          assert.deepEqual(await page.evaluate(() => window.sent.at(-1)), { type: 'revealSource', sessionId: 'session', generation: 1, sourceId: 'active-file', contextRevision: 4 });
          // Sequential keyboard access must expose the final optional file without
          // locator.click's automatic scrolling concealing a clipped control.
          for (let i = 0; i < 26; i++) {
            await page.keyboard.press('Tab');
            const focused = await page.evaluate(() => ({ id: document.activeElement.id, source: document.activeElement.getAttribute('data-source-id') }));
            if (focused.source === 'file-9') break;
          }
          assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-source-id')), 'file-9');
          await assertControls(page, ['#context-sources input[data-source-id="file-9"]', '#composer', '#send']);
          await page.keyboard.press('Space');
          assert.deepEqual(await page.evaluate(() => window.sent.at(-1)), { type: 'setSourceIncluded', sessionId: 'session', generation: 1, sourceId: 'file-9', included: true, contextRevision: 4 });
          await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'context-run');
          await assertControls(page, ['#context-run', '#composer', '#send']);
          await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
          assert.equal(await page.locator('#context-notice').evaluate(n => n.open), true);
          await page.keyboard.press('ArrowDown');
        }
        await page.locator('#timeline').focus(); await page.keyboard.press('Home');
        await page.locator('#timeline').evaluate(n => { n.scrollTop = 0; });
        const before = await geometry(page); assert.equal(before.timeline.scrollTop, 0);
        // Exercise the late-content affordance alongside runtime recovery.
        await page.evaluate(next => window.dispatchEvent(new MessageEvent('message', { data: { type: 'render', state: next } })), { ...state, revision: 2, entries: [...state.entries, entry('new', 'assistant', 'New answer')] });
        const controls = await assertControls(page, ['#composer', '#send', '#retry-runtime', '#new-content']);
        const status = await page.locator('#response-state').evaluate(n => ({
          width: n.getBoundingClientRect().width, text: n.textContent, clip: getComputedStyle(n).clipPath,
        }));
        if (scenario.width <= 320) {
          assert.equal(status.clip, 'inset(50%)', 'Omit a squeezed visible status fragment when both actions need the row');
          assert.equal(status.text, 'Response complete');
          assert.match(await page.locator('#response-dock').ariaSnapshot(), /Response complete/);
        }
        const metrics = await geometry(page); assertContained(metrics, 'context matrix');
        assert.ok(metrics.timeline.clientHeight >= scenario.fontSize * 4, `Readable transcript: ${JSON.stringify(metrics)}`);
        assert.equal(metrics.timeline.scrollTop, 0);
        assert.deepEqual(errors, []);
        const optional = await page.locator('.composer-context').evaluate(n => ({ clientHeight: n.clientHeight, scrollHeight: n.scrollHeight, scrollTop: n.scrollTop }));
        evidence.scenarios.push({ ...scenario, expanded, metrics, controls, optional, errors });
        if (output) await page.screenshot({ path: path.join(output, `context-${index}-${expanded ? 'expanded' : 'collapsed'}.png`) });
      } finally { await page.close(); }
    });
  } finally {
    if (output) fs.writeFileSync(path.join(output, 'compact-context-browser-fixture.json'), JSON.stringify(evidence, null, 2));
    await browser.close();
  }
});
