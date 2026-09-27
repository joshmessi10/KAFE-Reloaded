(() => {
  const vscode = acquireVsCodeApi();
  const byId = id => document.getElementById(id);
  const setText = (id, value) => { byId(id).textContent = String(value ?? ''); };
  const send = message => vscode.postMessage(message);
  let lastRenderedGoal;
  let previewToken;
  let previewDraft;
  let retryToken;
  let proposalId;

  byId('goal-form').addEventListener('submit', event => {
    event.preventDefault();
    const goal = byId('goal-input').value.trim();
    if (goal) send({ type: 'startSession', goal });
  });
  byId('message-form').addEventListener('submit', event => {
    event.preventDefault();
    const text = byId('message-input').value.trim();
    if (!text || !previewToken || text !== previewDraft) return;
    send({ type: 'sendMessage', text, previewToken });
    previewToken = undefined;
    previewDraft = undefined;
    retryToken = undefined;
    byId('send-message').disabled = true;
    byId('message-input').value = '';
  });
  byId('message-input').addEventListener('input', () => {
    const text = byId('message-input').value.trim();
    previewToken = undefined;
    previewDraft = undefined;
    retryToken = undefined;
    byId('retry-message').hidden = true;
    byId('send-message').disabled = true;
    setText('context-payload', 'Preparing local request preview…');
    if (text) send({ type: 'sendMessage', phase: 'preview', text });
  });
  byId('confirm-milestones').addEventListener('click', () => {
    const milestones = [...byId('milestone-list').querySelectorAll('input')]
      .map(input => ({ id: input.dataset.id, text: input.value.trim() }))
      .filter(item => item.text);
    send({ type: 'confirmMilestones', milestones });
  });
  byId('accept-proposal').addEventListener('click', () => { if (proposalId) send({ type: 'acceptProposal', id: proposalId }); });
  byId('reject-proposal').addEventListener('click', () => { if (proposalId) send({ type: 'rejectProposal', id: proposalId }); });
  byId('clear-progress').addEventListener('click', () => send({ type: 'clearProgress' }));
  byId('retry-message').addEventListener('click', () => {
    if (retryToken) send({ type: 'retryMessage', previewToken: retryToken });
  });

  function renderMilestones(milestones, confirmed) {
    const list = byId('milestone-list');
    for (const [index, item] of milestones.entries()) {
      const id = String(item.id ?? '');
      const text = String(item.text ?? '');
      let row = [...list.children].find(candidate => candidate.dataset.id === id);
      if (!row) {
        row = document.createElement('li');
        row.dataset.id = id;
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.id = id;
        label.textContent = 'Edit milestone';
        label.append(input);
        row.append(label);
      }
      const input = row.querySelector('input');
      if (input.dataset.hostText !== text) {
        input.value = text;
        input.dataset.hostText = text;
      }
      if (list.children[index] !== row) list.insertBefore(row, list.children[index] ?? null);
    }
    for (const row of [...list.children].slice(milestones.length)) row.remove();
    byId('milestones-empty').hidden = milestones.length > 0;
    byId('confirm-milestones').disabled = milestones.length === 0;
    byId('confirm-milestones').textContent = confirmed ? 'Update confirmed milestones' : 'Confirm milestones';
  }

  function renderMessages(messages) {
    const list = byId('message-list');
    list.replaceChildren();
    for (const message of messages) {
      const paragraph = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = message.role === 'learner' ? 'You: ' : 'Tutor: ';
      paragraph.append(label);
      appendTutorText(paragraph, message.text);
      list.append(paragraph);
    }
  }

  function appendTutorText(target, value) {
    const lines = String(value ?? '').split(/\r?\n/);
    for (const [lineIndex, line] of lines.entries()) {
      if (lineIndex > 0) target.append(document.createElement('br'));
      const tokenPattern = /\*\*([^*\r\n]+)\*\*|`([^`\r\n]+)`|\*([^*\r\n]+)\*/g;
      let cursor = 0;
      let match;
      while ((match = tokenPattern.exec(line))) {
        if (match.index > cursor) target.append(document.createTextNode(line.slice(cursor, match.index)));
        const token = document.createElement(match[1] !== undefined ? 'strong' : match[2] !== undefined ? 'code' : 'em');
        token.textContent = match[1] ?? match[2] ?? match[3];
        target.append(token);
        cursor = tokenPattern.lastIndex;
      }
      if (cursor < line.length) target.append(document.createTextNode(line.slice(cursor)));
    }
  }

  function renderContext(sources) {
    const list = byId('context-list');
    list.replaceChildren();
    for (const source of sources) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${source.included === true ? 'Included' : 'Excluded'} · ${String(source.category ?? 'source')}: ${String(source.label ?? '')}`;
      row.append(label);
      if (source.category === 'selected-file' && source.included === true) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Remove';
        button.setAttribute('aria-label', `Remove ${String(source.label ?? 'context source')}`);
        button.addEventListener('click', () => send({ type: 'removeContextSource', id: source.id }));
        row.append(button);
      }
      list.append(row);
    }
  }

  function renderEvidence(evidence) {
    byId('evidence-empty').hidden = Boolean(evidence);
    byId('evidence-content').hidden = !evidence;
    if (!evidence) return;
    const provenance = evidence.runtimeMode === 'contributor' ? 'Contributor checkout; runtime and knowledge-pack versions unavailable' :
      evidence.runtimeVersion && evidence.knowledgePackVersion ?
        `Managed KAFE ${evidence.runtimeVersion}; knowledge pack ${evidence.knowledgePackVersion}` : 'Version unavailable';
    setText('evidence-summary', `Exit code: ${evidence.exitCode ?? 'unknown'} · Source: ${evidence.sourceUri || 'unattributed'} · ${provenance}${evidence.outputTruncated ? ' · output truncated' : ''}`);
    setText('evidence-stdout', evidence.stdout);
    setText('evidence-stderr', evidence.stderr);
  }

  function renderProposal(proposal) {
    proposalId = typeof proposal?.id === 'string' ? proposal.id : undefined;
    byId('proposal-empty').hidden = Boolean(proposal);
    byId('proposal-content').hidden = !proposal;
    if (proposal) setText('proposal-description', proposal.description);
  }

  function render(state = {}) {
    const goal = String(state.goal ?? '');
    setText('provider-status', state.providerStatus || (goal ?
      'Learning goal active. Coaching requires a configured provider; KAFE editing and Run remain available.' :
      'Set a learning goal to begin. Coaching requires a configured provider; KAFE editing and Run remain available.'));
    if (goal !== lastRenderedGoal) {
      byId('goal-input').value = goal;
      lastRenderedGoal = goal;
    }
    byId('empty-state').hidden = Boolean(state.goal);
    renderMilestones(Array.isArray(state.milestones) ? state.milestones : [], state.confirmed === true);
    setText('milestone-status', state.milestoneStatus);
    byId('milestone-status').hidden = !state.milestoneStatus;
    setText('interaction-status', state.interactionStatus);
    byId('interaction-status').hidden = !state.interactionStatus;
    renderMessages(Array.isArray(state.messages) ? state.messages : []);
    renderContext(Array.isArray(state.contextSources) ? state.contextSources : []);
    const preview = state.preview;
    const currentDraft = byId('message-input').value.trim();
    previewToken = preview?.draft === currentDraft ? preview.token : undefined;
    previewDraft = previewToken ? preview.draft : undefined;
    retryToken = state.retryAvailable ? preview?.token : undefined;
    byId('send-message').disabled = !previewToken;
    byId('retry-message').hidden = !retryToken;
    setText('context-payload', (previewToken || retryToken) ? JSON.stringify(preview.payload, null, 2) :
      'Type a message to preview its context before sending.');
    renderEvidence(state.evidence);
    renderProposal(state.proposal);
  }

  window.addEventListener('message', event => {
    if (event.data?.type === 'render') render(event.data.state);
  });
})();
