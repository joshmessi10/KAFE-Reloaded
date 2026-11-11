(() => {
  const vscode = acquireVsCodeApi();
  const byId = id => document.getElementById(id);
  const timeline = byId('timeline'), composer = byId('composer');
  let state = null, composing = false, disposed = false, beforeHydration = false;
  let localRevision = 0, pending = [], lastPostedDraft, submission = null;
  let contentSignature, announcedTurn, lastAnnouncement = '';
  const announcedOutcomes = new Map(), listeners = [], sourceNodes = new Map(), indicatorNodes = new Map();
  let announcedLearning;
  let stopping = null;
  let runBinding = null;
  const activeStates = ['preparing', 'responding', 'processing-tools'];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const nonblank = value => typeof value === 'string' && Boolean(value.trim());
  const counter = value => Number.isSafeInteger(value) && value >= 0;
  const validAction = a => record(a) && nonblank(a.id) && nonblank(a.type) && nonblank(a.label) && typeof a.enabled === 'boolean' && record(a.args);
  const validSource = (s, category) => record(s) && nonblank(s.id) && typeof s.label === 'string' && typeof s.uri === 'string' && /^file:\/\//.test(s.uri) && s.category === category && typeof s.included === 'boolean';
  const validNotice = n => n === null || (record(n) && Object.keys(n).length === 1 && Array.isArray(n.reasons) &&
    n.reasons.length > 0 && n.reasons.length <= 3 && n.reasons.every((r, i) => ['window', 'source', 'knowledge'].includes(r) &&
      (i === 0 || ['window', 'source', 'knowledge'].indexOf(r) > ['window', 'source', 'knowledge'].indexOf(n.reasons[i - 1]))));
  const validView = v => record(v) && Object.keys(v).length === 4 && counter(v.revision) &&
    ['unknown', 'missing', 'present', 'unavailable'].includes(v.providerKey) &&
    ['unknown', 'preparing', 'ready', 'unavailable', 'failed'].includes(v.runtime) && validNotice(v.contextNotice);
  function validSnapshot(s) {
    return record(s) && nonblank(s.sessionId) && counter(s.generation) && counter(s.revision) && counter(s.inputRevision) && typeof s.draft === 'string' &&
      (s.view === undefined || validView(s.view)) &&
      record(s.context) && counter(s.context.revision) && typeof s.context.restricted === 'boolean' && (s.context.activeSource === null || validSource(s.context.activeSource, 'active-file')) &&
      Array.isArray(s.context.sources) && s.context.sources.every(a => validSource(a, 'selected-file')) && new Set(s.context.sources.map(a=>a.id)).size === s.context.sources.length &&
      record(s.contextActions) && nonblank(s.contextActions.entryId) && Array.isArray(s.contextActions.actions) && s.contextActions.actions.every(validAction) &&
      Array.isArray(s.entries) && s.entries.every(e => record(e) && nonblank(e.id) && nonblank(e.kind) && nonblank(e.status) && typeof e.text === 'string' && (e.data === null || record(e.data)) && Array.isArray(e.actions) && e.actions.every(validAction)) &&
      new Set(s.entries.map(e=>e.id)).size === s.entries.length && (s.turn === null || (record(s.turn) && nonblank(s.turn.id) && nonblank(s.turn.submissionId) && counter(s.turn.turnGeneration) && ['preparing','responding','processing-tools','completed','cancelled','failed'].includes(s.turn.status)));
  }
  function listen(node, type, fn) { node.addEventListener(type, fn); listeners.push(() => node.removeEventListener(type, fn)); }
  function send(type, fields = {}) { if (!disposed && state) vscode.postMessage({ type, sessionId: state.sessionId, generation: state.generation, ...fields }); }
  const renderer = window.KafeTutorTimeline.createRenderer({ document, root: timeline, onAction: fields => send('invokeAction', fields), onOpenLink: url => send('openLink', { url }) });
  function busy() { return activeStates.includes(state?.turn?.status) || Boolean(submission && !submission.admitted && !submission.guardReleased); }
  function needsConfiguration() { return state?.view && !state.entries.length && state.view.providerKey !== 'present'; }
  function growComposer() {
    const scroll = composer.scrollTop;
    composer.style.height = 'auto';
    const metrics = window.getComputedStyle(composer), line = parseFloat(metrics.lineHeight) || 20;
    const minimum = line * 2 + (parseFloat(metrics.paddingTop) || 0) + (parseFloat(metrics.paddingBottom) || 0);
    const maximum = Math.min(200, window.innerHeight * .25);
    composer.style.height = `${Math.min(maximum, Math.max(Math.min(minimum, maximum), composer.scrollHeight))}px`;
    composer.scrollTop = scroll;
  }
  function renderDock() {
    const status = state?.turn?.status;
    const waiting = !activeStates.includes(status) && state?.entries.some(e => e.kind === 'checkpoint' && e.status === 'ready' && e.actions.some(a => a.enabled));
    const key = state?.turn && `${state.turn.id}:${state.turn.turnGeneration}`;
    if (!activeStates.includes(status) || stopping !== key) stopping = null;
    const dockState = stopping ? 'stopping' : activeStates.includes(status) ? 'responding' : status === 'cancelled' ? 'stopped' : status === 'failed' ? 'failed' : waiting ? 'waiting-learner' : 'idle';
    const setupWords = { unknown: 'Checking Tutor configuration', missing: 'Tutor key needed', present: 'Tutor key configured', unavailable: 'Tutor configuration unavailable' };
    const runtimeWords = { preparing: 'Run setup preparing', failed: 'Run setup failed', unavailable: 'Run tools unavailable' };
    const setupStatus = state?.view ? [setupWords[state.view.providerKey], state.view.providerKey === 'present' && runtimeWords[state.view.runtime]].filter(Boolean).join(' · ') : '';
    const words = { responding: status === 'processing-tools' ? 'Checking context' : status === 'preparing' ? 'Preparing response' : 'Responding', stopping: 'Stopping response', stopped: 'Response stopped', failed: 'Response unavailable', 'waiting-learner': 'Waiting for your reasoning', idle: state?.entries.length ? 'Response complete' : setupStatus };
    byId('response-dock').setAttribute('data-state', dockState);
    byId('response-dock').setAttribute('aria-busy', String(['responding', 'stopping'].includes(dockState)));
    if (byId('response-state').textContent !== words[dockState]) byId('response-state').textContent = words[dockState];
    byId('response-state').setAttribute('title', words[dockState]);
  }
  function updateControls() {
    const active = activeStates.includes(state?.turn?.status);
    const focused = document.activeElement;
    byId('send').hidden = active; byId('send').disabled = !state || busy() || !composer.value.trim() || Boolean(needsConfiguration());
    renderDock();
    const retryRuntime = byId('retry-runtime');
    retryRuntime.hidden = !state || state.context.restricted || !['failed', 'unavailable'].includes(state.view?.runtime);
    if (retryRuntime.hidden && focused === retryRuntime) composer.focus();
    byId('stop').hidden = !active; byId('stop').disabled = !active || Boolean(stopping);
    if (active && focused === byId('send')) byId('stop').focus();
  }
  function postDraft() {
    if (!state) { beforeHydration = true; return; }
    if (composer.value !== lastPostedDraft) {
      lastPostedDraft = composer.value;
      pending.push({ text: composer.value, afterRevision: state.inputRevision, localRevision });
      send('setDraft', { text: composer.value });
    }
    updateControls();
  }
  function input() { localRevision++; growComposer(); postDraft(); }
  function submit(event) {
    event.preventDefault();
    if (composing || !state || busy() || !composer.value.trim() || needsConfiguration()) return;
    postDraft();
    submission = { id: crypto.randomUUID(), localRevision, text: composer.value, contextRevision: state.context.revision, admitted: false,
      hostRevision: state.revision, observedTurn: state.turn && { id: state.turn.id, generation: state.turn.turnGeneration } };
    send('submitMessage', { submissionId: submission.id, text: submission.text, contextRevision: submission.contextRevision });
    updateControls();
  }
  listen(composer, 'input', input);
  listen(composer, 'compositionstart', () => { composing = true; });
  listen(composer, 'compositionend', () => { composing = false; });
  listen(composer, 'keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && !composing) submit(event);
  });
  listen(byId('composer-form'), 'submit', submit);
  listen(byId('stop'), 'click', () => {
    if (!activeStates.includes(state?.turn?.status) || stopping) return;
    const { selectionStart, selectionEnd, selectionDirection } = composer;
    stopping = `${state.turn.id}:${state.turn.turnGeneration}`;
    send('stopTurn', { turnId: state.turn.id, turnGeneration: state.turn.turnGeneration });
    updateControls();
    // Disabling Stop blurs it in browsers. Return focus as part of this learner
    // action, never from a delayed settlement that could steal reading focus.
    composer.focus({ preventScroll: true });
    composer.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  });
  listen(byId('configure-provider'), 'click', () => { if (state && !byId('starting-aid').hidden) send('configureProvider'); });
  listen(byId('retry-runtime'), 'click', () => { if (state && !byId('retry-runtime').hidden) send('retryRuntimeSetup'); });
  listen(window, 'resize', growComposer);
  listen(byId('included-context'), 'click', event => {
    const control = event.target.closest?.('button'), row = control?.closest('[data-source-id]');
    if (!control || !row || !state || state.context.restricted) return;
    const id = row.getAttribute('data-source-id'), source = [state.context.activeSource, ...state.context.sources].find(s => s?.id === id && s.included);
    if (!source) return;
    if (control.getAttribute('data-context-command') === 'reveal') send('revealSource', { sourceId: id, contextRevision: state.context.revision });
    else if (control.getAttribute('data-context-command') === 'remove' && source.category === 'selected-file') send('setSourceIncluded', { sourceId: id, included: false, contextRevision: state.context.revision });
  });
  listen(byId('context-run'), 'click', () => { if (runBinding && !byId('context-run').hidden) send('invokeAction', runBinding); });
  listen(byId('context-sources'), 'change', event => {
    const sourceId = event.target.getAttribute?.('data-source-id');
    if (!state?.context.restricted && !event.target.disabled && state?.context.sources.some(s=>s.id===sourceId)) send('setSourceIncluded', { sourceId, included: event.target.checked === true, contextRevision: state.context.revision });
  });
  function renderContext() {
    const context = state.context, sources = context.restricted ? [] : context.sources.filter(source => source.uri !== context.activeSource?.uri);
    const included = context.restricted ? [] : [context.activeSource?.included ? context.activeSource : null, ...sources.filter(s => s.included)].filter(Boolean);
    const active = context.restricted ? 'Files excluded in Restricted Mode.' : included.length ? '' : 'No file included.';
    if (byId('active-context').textContent !== active) byId('active-context').textContent = active;
    const selector = byId('context-selector'), contextFocused = selector.contains(document.activeElement);
    selector.hidden = included.length === 0 && sources.length === 0;
    if (selector.hidden && contextFocused) composer.focus({ preventScroll: true });
    const current = context.activeSource?.included && !context.restricted ? context.activeSource : null;
    const summary = byId('context-summary');
    const name = current ? current.label : 'Files', count = `${included.length} file${included.length === 1 ? '' : 's'}`;
    if (byId('context-name').textContent !== name) byId('context-name').textContent = name;
    if (byId('context-count').textContent !== count) byId('context-count').textContent = count;
    const identity = current ? `Files: ${current.label} (${current.uri}); ${included.length} included` : `Files: ${included.length} included`;
    summary.setAttribute('title', identity); summary.setAttribute('aria-label', identity);
    const includedIds = new Set(); let includedIndex = 0;
    for (const source of included) {
      includedIds.add(source.id); let item = indicatorNodes.get(source.id);
      if (!item) {
        const node = document.createElement('div'), reveal = document.createElement('button'), origin = document.createElement('span'), remove = document.createElement('button');
        node.className = 'context-indicator'; node.setAttribute('data-source-id', source.id);
        reveal.type = remove.type = 'button'; reveal.className = 'context-file'; remove.className = 'context-remove'; origin.className = 'context-origin';
        reveal.setAttribute('data-context-command', 'reveal'); remove.setAttribute('data-context-command', 'remove'); remove.textContent = 'Remove';
        node.append(reveal, origin, remove); item = { node, reveal, origin, remove }; indicatorNodes.set(source.id, item);
      }
      const identity = `${source.label} (${source.uri})`;
      if (item.reveal.textContent !== source.label) item.reveal.textContent = source.label;
      item.reveal.setAttribute('aria-label', `Reveal whole file ${identity}`); item.reveal.setAttribute('title', identity);
      item.remove.setAttribute('aria-label', `Remove whole file ${identity} from request`); item.remove.hidden = source.category === 'active-file';
      const origin = source.category === 'active-file' ? 'Active file' : 'Whole file';
      if (item.origin.textContent !== origin) item.origin.textContent = origin;
      if (byId('included-context').children[includedIndex] !== item.node) byId('included-context').insertBefore(item.node, byId('included-context').children[includedIndex] || null);
      includedIndex++;
    }
    for (const [id, item] of indicatorNodes) if (!includedIds.has(id)) { if (item.node.contains(document.activeElement)) composer.focus(); item.node.remove(); indicatorNodes.delete(id); }
    const ids = new Set(); let index = 0;
    for (const source of sources) {
      ids.add(source.id); let item = sourceNodes.get(source.id);
      if (!item) {
        const node = document.createElement('label'), checkbox = document.createElement('input'), label = document.createElement('span');
        checkbox.type = 'checkbox'; checkbox.setAttribute('type', 'checkbox'); checkbox.setAttribute('data-source-id', source.id);
        node.append(checkbox, label); item = { node, checkbox, label }; sourceNodes.set(source.id, item);
      }
      if (item.label.textContent !== source.label) item.label.textContent = source.label;
      item.checkbox.setAttribute('aria-label', `Include whole file ${source.label} (${source.uri}) in request`); item.checkbox.checked = source.included;
      if (byId('context-sources').children[index] !== item.node) byId('context-sources').insertBefore(item.node, byId('context-sources').children[index] || null);
      index++;
    }
    for (const [id,item] of sourceNodes) if (!ids.has(id)) { if (item.node.contains(document.activeElement)) composer.focus(); item.node.remove(); sourceNodes.delete(id); }
    const action = !context.restricted && state.contextActions.actions.find(a=>a.type==='runFile' && a.enabled);
    const button = byId('context-run'); button.hidden = !action;
    runBinding = action ? { entryId: state.contextActions.entryId, actionId: action.id, args: action.args } : null;
    if (action) { if (button.textContent !== action.label) button.textContent = action.label; button.setAttribute('aria-label', `Run saved file: ${action.label} (${action.args.targetUri})`); button.setAttribute('title', `Runs saved bytes. ${action.label} (${action.args.targetUri})`); }
    else if (button.textContent) button.textContent = '';
  }
  function hydrate(next, fresh) {
    if (fresh) {
      pending = []; submission = null;
      if (state || !beforeHydration) { composer.value = next.draft; localRevision++; }
      lastPostedDraft = next.draft;
      return;
    }
    // The first matching echo acknowledges only that edit, never an identical later edit.
    const ack = pending.findIndex(item => item.text === next.draft && next.inputRevision > item.afterRevision);
    if (ack >= 0) pending.splice(0, ack + 1);
    if (submission && next.turn?.submissionId === submission.id && !submission.admitted) {
      submission.admitted = true;
      if (localRevision === submission.localRevision) {
        composer.value = ''; localRevision++; lastPostedDraft = '';
        pending = pending.filter(item=>item.localRevision > submission.localRevision);
      }
    }
    // Admission clearing/echoes cannot replace the next draft. New conversation resets ownership.
    if (!submission && !pending.length && next.inputRevision !== state.inputRevision && composer.value !== next.draft) { composer.value = next.draft; localRevision++; }
    if (!pending.length && !submission) lastPostedDraft = next.draft;
    // A stale context submission has no admission; permit a fresh intentional attempt.
    if (submission && !submission.admitted && next.context.revision !== submission.contextRevision) submission = null;
    if (submission && !submission.admitted && next.turn?.submissionId !== submission.id) {
      // Retry may admit before recreated scripts attach their listener. A newer
      // settled owner can therefore arrive without any observed active phase.
      // Release only the duplicate guard; matching-ID admission still owns draft
      // clearing and must compare the original local edit revision.
      const previous = submission.observedTurn;
      const ownerAdvanced = next.turn && (!previous || next.turn.id !== previous.id || next.turn.turnGeneration > previous.generation);
      if (next.revision > submission.hostRevision && ownerAdvanced && ['completed', 'cancelled', 'failed'].includes(next.turn.status)) submission.guardReleased = true;
    }
  }
  function announce(next, fresh) {
    if (fresh) { announcedTurn = null; announcedOutcomes.clear(); lastAnnouncement = ''; }
    const key = next.turn && `${next.turn.id}:${next.turn.turnGeneration}:${next.turn.status}`, updates = [];
    if (key && key !== announcedTurn) {
      const words = { preparing: 'Preparing response.', responding: 'Responding.', 'processing-tools': 'Checking context.', completed: 'Response complete.', cancelled: 'Response interrupted. You can send another message.', failed: 'Response unavailable. Use the recovery action or send another message.' };
      updates.push(words[next.turn.status]);
    }
    announcedTurn = key;
    const paused = next.learning?.preferences?.mode === 'paused';
    const learningSignature = JSON.stringify([paused, next.learning?.preferenceChangeQueued === true]);
    if (!fresh && learningSignature !== announcedLearning) updates.push(next.learning?.preferenceChangeQueued ? 'Preference change queued until this response settles.' : `Guided learning ${paused ? 'paused' : 'active'}.`);
    announcedLearning = learningSignature;
    for (const e of next.entries) {
      if (e.kind === 'checkpoint') {
        const outcome = `${e.status}:${e.text}`;
        if (announcedOutcomes.get(e.id) !== outcome) updates.push(e.status === 'ready' ? `Waiting for your reasoning on ${e.text}.` : e.status === 'stale' ? `Learning decision ${e.text} is stale. Request a current checkpoint.` : `Learning decision ${e.text}: ${e.status}.`);
        announcedOutcomes.set(e.id, outcome); continue;
      }
      if (!['run','proposal','error'].includes(e.kind) || ['preparing','running','responding','processing-tools','ready'].includes(e.status)) continue;
      const outcome = `${e.status}:${e.text}`;
      if (announcedOutcomes.get(e.id) !== outcome) updates.push(e.text);
      announcedOutcomes.set(e.id,outcome);
    }
    const value = updates.join(' ');
    if (value && value !== lastAnnouncement) { byId('conversation-status').textContent = value; lastAnnouncement = value; }
  }
  function renderContextNotice() {
    const notice = byId('context-notice'), detail = byId('context-notice-detail');
    const reasons = state.view?.contextNotice?.reasons || [];
    const copy = {
      window: 'Some older exchanges exceeded the reply context size limit.',
      source: 'Some exchanges used files that are no longer included.',
      knowledge: 'Some exchanges relied on KAFE knowledge that is no longer current or available.',
    };
    const text = reasons.length ? `Older discussion remains saved; some was outside this reply's context. ${reasons.map(reason => copy[reason]).join(' ')}` : '';
    notice.hidden = !text;
    if (detail.textContent !== text) detail.textContent = text;
    if (!text) notice.open = false;
  }
  function render(next) {
    if (disposed || !validSnapshot(next)) return;
    if (state && next.sessionId === state.sessionId && (next.generation < state.generation || (next.generation === state.generation && (next.revision < state.revision || (next.revision === state.revision && !(counter(next.view?.revision) && next.view.revision > (state.view?.revision ?? -1)) && !(counter(next.learning?.revision) && next.learning.revision > (state.learning?.revision ?? -1)) && !(counter(next.learning?.displayRevision) && next.learning.displayRevision > (state.learning?.displayRevision ?? -1))))))) return;
    const fresh = !state || state.sessionId !== next.sessionId || state.generation !== next.generation;
    const nearBottom = timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop <= 48, scrollTop = timeline.scrollTop;
    hydrate(next, fresh); state = next;
    if (beforeHydration) { beforeHydration = false; postDraft(); }
    const signature = JSON.stringify(next.entries), contentChanged = fresh || signature !== contentSignature; contentSignature = signature;
    renderer.render(next);
    const aid = byId('starting-aid'), aidFocused = aid.contains(document.activeElement);
    aid.hidden = Boolean(next.entries.length || !next.view || next.view.providerKey === 'present');
    const copy = next.view?.providerKey === 'unavailable' ? 'Tutor configuration is unavailable. Try Configure Tutor again. Your draft stays here.' : 'Configure your DeepSeek API key to chat. VS Code stores it securely. You can draft your question now.';
    if (byId('provider-setup-copy').textContent !== copy) byId('provider-setup-copy').textContent = copy;
    if (aid.hidden && aidFocused) composer.focus();
    renderContext(); renderContextNotice(); updateControls(); growComposer();
    if (contentChanged) {
      if (fresh || nearBottom) { timeline.scrollTop = timeline.scrollHeight; byId('new-content').hidden = true; }
      else { timeline.scrollTop = scrollTop; byId('new-content').hidden = false; }
    }
    announce(next, fresh);
  }
  listen(window, 'message', event => { if (event.data?.type === 'render') render(event.data.state); });
  listen(byId('new-content'), 'click', () => { timeline.scrollTop = timeline.scrollHeight; byId('new-content').hidden = true; });
  listen(timeline, 'scroll', () => { if (timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop <= 48) byId('new-content').hidden = true; });
  listen(window, 'pagehide', () => { disposed = true; listeners.splice(0).forEach(remove=>remove()); renderer.dispose(); sourceNodes.clear(); indicatorNodes.clear(); state = null; pending = []; submission = null; runBinding = null; stopping = null; });
  try { render(JSON.parse(byId('initial-state').textContent)); } catch { /* Await a valid host projection. */ }
})();
