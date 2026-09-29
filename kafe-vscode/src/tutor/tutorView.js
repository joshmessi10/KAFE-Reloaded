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
  let reviewedCheckPending = false;
  let lastRenderedMessageCount = 0;
  let reviewedCheckRunSequence;
  let lastEvidenceRunSequence;

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
  byId('record-reviewed-check').addEventListener('click', () => {
    const label = byId('reviewed-check-label').value.trim();
    const outcome = byId('reviewed-check-outcome').value;
    if (!Number.isSafeInteger(reviewedCheckRunSequence) || reviewedCheckRunSequence < 1 ||
      !label || label.length > 120 || !['passed', 'failed', 'unknown'].includes(outcome)) {
      setText('reviewed-check-status', 'Enter a label and choose an outcome before recording.');
      byId('reviewed-check-status').hidden = false;
      return;
    }
    reviewedCheckPending = true;
    send({ type: 'recordReviewedCheck', runSequence: reviewedCheckRunSequence, label, outcome });
    setText('reviewed-check-status', 'Saving reviewed check…');
    byId('reviewed-check-status').hidden = false;
  });

  function clearReviewedCheckStatus() {
    reviewedCheckPending = false;
    byId('reviewed-check-status').hidden = true;
    setText('reviewed-check-status', '');
  }

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
      if (source.category === 'selected-file') {
        const controlLabel = document.createElement('label');
        controlLabel.textContent = `Include ${String(source.label ?? 'context source')} in request`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = source.included === true;
        checkbox.addEventListener('change', () => send({
          type: 'setContextSourceIncluded', id: source.id, included: checkbox.checked,
        }));
        controlLabel.append(checkbox);
        row.append(controlLabel);
      }
      list.append(row);
    }
  }

  function renderEvidence(evidence) {
    byId('evidence-empty').hidden = Boolean(evidence);
    byId('evidence-content').hidden = !evidence;
    const runSequence = Number.isSafeInteger(evidence?.runSequence) && evidence.runSequence > 0 ? evidence.runSequence : undefined;
    if (runSequence !== lastEvidenceRunSequence || evidence?.reviewedCheckId) {
      byId('reviewed-check-label').value = '';
      byId('reviewed-check-outcome').value = '';
      clearReviewedCheckStatus();
    }
    lastEvidenceRunSequence = runSequence;
    const canRecord = runSequence !== undefined && !evidence?.reviewedCheckId;
    reviewedCheckRunSequence = canRecord ? runSequence : undefined;
    byId('reviewed-check-form').hidden = !canRecord;
    if (!evidence) return;
    const provenance = evidence.runtimeMode === 'contributor' ? 'Contributor checkout; runtime and knowledge-pack versions unavailable' :
      evidence.runtimeVersion && evidence.knowledgePackVersion ?
        `Managed KAFE ${evidence.runtimeVersion}; knowledge pack ${evidence.knowledgePackVersion}` : 'Version unavailable';
    setText('evidence-summary', `Exit code: ${evidence.exitCode ?? 'unknown'} · Source: ${evidence.sourceUri || 'unattributed'} · ${provenance}${evidence.outputTruncated ? ' · output truncated' : ''}`);
    setText('evidence-stdout', evidence.stdout);
    setText('evidence-stderr', evidence.stderr);
  }

  function renderReviewedChecks(checks) {
    const container = byId('reviewed-check-history');
    const list = byId('reviewed-check-list');
    setText('reviewed-check-explanation', 'Recording a reviewed check is not proof of mastery.');
    list.replaceChildren();
    const records = Array.isArray(checks) ? checks : [];
    container.hidden = records.length === 0;
    for (const record of records) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = String(record.label ?? '');
      const outcome = document.createElement('span');
      outcome.textContent = `Outcome: ${String(record.outcome ?? 'unknown')}`;
      const timestamp = document.createElement('time');
      timestamp.dateTime = String(record.recordedAt ?? '');
      timestamp.textContent = String(record.recordedAt ?? '');
      item.append(label, document.createTextNode(' · '), outcome, document.createTextNode(' · '), timestamp);
      list.append(item);
    }
  }

  function renderProposal(proposal) {
    proposalId = typeof proposal?.id === 'string' ? proposal.id : undefined;
    byId('proposal-empty').hidden = Boolean(proposal);
    byId('proposal-content').hidden = !proposal;
    if (proposal) setText('proposal-description', proposal.description);
  }

  function render(state = {}) {
    if (reviewedCheckPending && state.responseMessageType === 'recordReviewedCheck') {
      clearReviewedCheckStatus();
    }
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
    const messages = Array.isArray(state.messages) ? state.messages : [];
    if (messages.length > lastRenderedMessageCount) {
      const addedMessages = messages.slice(lastRenderedMessageCount);
      const submitted = addedMessages[0];
      const response = addedMessages[1];
      if (addedMessages.length >= 2 && submitted?.role === 'learner' && response?.role === 'tutor' &&
        submitted.text === byId('message-input').value.trim()) byId('message-input').value = '';
    }
    lastRenderedMessageCount = messages.length;
    renderMessages(messages);
    renderContext(Array.isArray(state.contextSources) ? state.contextSources : []);
    const preview = state.preview;
    const currentDraft = byId('message-input').value.trim();
    previewToken = !state.retryAvailable && preview?.draft === currentDraft ? preview.token : undefined;
    previewDraft = previewToken ? preview.draft : undefined;
    retryToken = state.retryAvailable ? preview?.token : undefined;
    byId('send-message').disabled = !previewToken;
    byId('retry-message').hidden = !retryToken;
    setText('context-payload', (previewToken || retryToken) ? JSON.stringify(preview.payload, null, 2) :
      'Type a message to preview its context before sending.');
    renderEvidence(state.evidence);
    renderReviewedChecks(state.completedChecks);
    renderProposal(state.proposal);
  }

  window.addEventListener('message', event => {
    if (event.data?.type === 'render') render(event.data.state);
  });
})();
