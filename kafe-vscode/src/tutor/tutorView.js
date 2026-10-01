(() => {
  const vscode = acquireVsCodeApi();
  const byId = id => document.getElementById(id);
  const timeline = byId('timeline'), composer = byId('composer');
  let state = null, composing = false, disposed = false, beforeHydration = false;
  let localRevision = 0, pending = [], lastPostedDraft, submission = null;
  let contentSignature, announcedTurn, lastAnnouncement = '';
  const announcedOutcomes = new Map(), listeners = [], sourceNodes = new Map();
  let runBinding = null;
  const activeStates = ['preparing', 'responding', 'processing-tools'];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const nonblank = value => typeof value === 'string' && Boolean(value.trim());
  const counter = value => Number.isSafeInteger(value) && value >= 0;
  const validAction = a => record(a) && nonblank(a.id) && nonblank(a.type) && nonblank(a.label) && typeof a.enabled === 'boolean' && record(a.args);
  const validSource = (s, category) => record(s) && nonblank(s.id) && typeof s.label === 'string' && typeof s.uri === 'string' && /^file:\/\//.test(s.uri) && s.category === category && typeof s.included === 'boolean';
  function validSnapshot(s) {
    return record(s) && nonblank(s.sessionId) && counter(s.generation) && counter(s.revision) && counter(s.inputRevision) && typeof s.draft === 'string' &&
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
  function updateControls() {
    const active = activeStates.includes(state?.turn?.status);
    const focused = document.activeElement;
    byId('send').hidden = active; byId('send').disabled = !state || busy() || !composer.value.trim();
    byId('stop').hidden = !active; byId('stop').disabled = !active;
    if (active && focused === byId('send')) byId('stop').focus();
    else if (!active && focused === byId('stop')) {
      if (!byId('send').disabled) byId('send').focus();
      else composer.focus();
    }
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
  function input() { localRevision++; postDraft(); }
  function submit(event) {
    event.preventDefault();
    if (composing || !state || busy() || !composer.value.trim()) return;
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
  listen(byId('stop'), 'click', () => { if (activeStates.includes(state?.turn?.status)) send('stopTurn', { turnId: state.turn.id, turnGeneration: state.turn.turnGeneration }); });
  listen(byId('context-run'), 'click', () => { if (runBinding && !byId('context-run').hidden) send('invokeAction', runBinding); });
  listen(byId('context-sources'), 'change', event => {
    const sourceId = event.target.getAttribute?.('data-source-id');
    if (!state?.context.restricted && !event.target.disabled && state?.context.sources.some(s=>s.id===sourceId)) send('setSourceIncluded', { sourceId, included: event.target.checked === true, contextRevision: state.context.revision });
  });
  function renderContext() {
    const context = state.context, sources = context.restricted ? [] : context.sources.filter(source => source.uri !== context.activeSource?.uri);
    const active = context.restricted ? 'Files excluded in Restricted Mode.' : context.activeSource?.included ? context.activeSource.label : 'No file included.';
    if (byId('active-context').textContent !== active) byId('active-context').textContent = active;
    byId('context-selector').hidden = sources.length === 0;
    const ids = new Set(); let index = 0;
    for (const source of sources) {
      ids.add(source.id); let item = sourceNodes.get(source.id);
      if (!item) {
        const node = document.createElement('label'), checkbox = document.createElement('input'), label = document.createElement('span');
        checkbox.type = 'checkbox'; checkbox.setAttribute('type', 'checkbox'); checkbox.setAttribute('data-source-id', source.id);
        node.append(checkbox, label); item = { node, checkbox, label }; sourceNodes.set(source.id, item);
      }
      if (item.label.textContent !== source.label) item.label.textContent = source.label;
      item.checkbox.setAttribute('aria-label', `Include ${source.label} in request`); item.checkbox.checked = source.included;
      if (byId('context-sources').children[index] !== item.node) byId('context-sources').insertBefore(item.node, byId('context-sources').children[index] || null);
      index++;
    }
    for (const [id,item] of sourceNodes) if (!ids.has(id)) { item.node.remove(); sourceNodes.delete(id); }
    const action = !context.restricted && state.contextActions.actions.find(a=>a.type==='runFile' && a.enabled);
    const button = byId('context-run'); button.hidden = !action;
    runBinding = action ? { entryId: state.contextActions.entryId, actionId: action.id, args: action.args } : null;
    if (action) { if (button.textContent !== action.label) button.textContent = action.label; button.setAttribute('aria-label', action.label); }
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
    for (const e of next.entries) {
      if (!['run','proposal','error'].includes(e.kind) || ['preparing','running','responding','processing-tools','ready'].includes(e.status)) continue;
      const outcome = `${e.status}:${e.text}`;
      if (announcedOutcomes.get(e.id) !== outcome) updates.push(e.text);
      announcedOutcomes.set(e.id,outcome);
    }
    const value = updates.join(' ');
    if (value && value !== lastAnnouncement) { byId('conversation-status').textContent = value; lastAnnouncement = value; }
  }
  function render(next) {
    if (disposed || !validSnapshot(next)) return;
    if (state && next.sessionId === state.sessionId && (next.generation < state.generation || (next.generation === state.generation && next.revision <= state.revision))) return;
    const fresh = !state || state.sessionId !== next.sessionId || state.generation !== next.generation;
    const nearBottom = timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop <= 48, scrollTop = timeline.scrollTop;
    hydrate(next, fresh); state = next;
    if (beforeHydration) { beforeHydration = false; postDraft(); }
    const signature = JSON.stringify(next.entries), contentChanged = fresh || signature !== contentSignature; contentSignature = signature;
    renderer.render(next); renderContext(); updateControls();
    if (contentChanged) {
      if (fresh || nearBottom) { timeline.scrollTop = timeline.scrollHeight; byId('new-content').hidden = true; }
      else { timeline.scrollTop = scrollTop; byId('new-content').hidden = false; }
    }
    announce(next, fresh);
  }
  listen(window, 'message', event => { if (event.data?.type === 'render') render(event.data.state); });
  listen(byId('new-content'), 'click', () => { timeline.scrollTop = timeline.scrollHeight; byId('new-content').hidden = true; });
  listen(timeline, 'scroll', () => { if (timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop <= 48) byId('new-content').hidden = true; });
  listen(window, 'pagehide', () => { disposed = true; listeners.splice(0).forEach(remove=>remove()); renderer.dispose(); sourceNodes.clear(); state = null; pending = []; submission = null; runBinding = null; });
  try { render(JSON.parse(byId('initial-state').textContent)); } catch { /* Await a valid host projection. */ }
})();
