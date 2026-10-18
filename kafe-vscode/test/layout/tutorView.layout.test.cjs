const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { snapshot, entry } = require('../helpers/tutorViewHarness');

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
const scenarios = [
  { name: 'sidebar', width: 460, height: 650, fontSize: 13 },
  { name: 'narrow sidebar', width: 240, height: 650, fontSize: 13 },
  { name: 'short panel', width: 460, height: 320, fontSize: 13 },
  { name: 'larger text', width: 320, height: 500, fontSize: 20 },
  { name: 'narrow short panel with larger text', width: 240, height: 320, fontSize: 20 },
];

function viewHtml(fontSize) {
  const state = snapshot({ entries: Array.from({ length: 12 }, (_, index) => entry(
    `message-${index}`, index % 2 ? 'assistant' : 'learner',
    `Conversation entry ${index + 1}\n\n${'A synthetic explanation of KAFE code and control flow. '.repeat(15)}`,
  )) });
  // Match VS Code's default body padding before loading the shipped stylesheet.
  const hostStyle = `body { margin: 0; padding: 0 20px; }
    :root { --vscode-font-size: ${fontSize}px; --vscode-font-family: Arial;
      --vscode-foreground: #ddd; --vscode-sideBar-background: #181818;
      --vscode-input-background: #242424; --vscode-input-foreground: #ddd;
      --vscode-scrollbarSlider-background: #666; --vscode-panel-border: #555; }`;
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
