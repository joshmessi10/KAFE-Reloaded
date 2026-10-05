(() => {
  const labels = { learner: "You", assistant: "KAFE Tutor", checkpoint: "Learning decision", host: "KAFE", proposal: "Proposed change", run: "Run", error: "Unable to complete" };
  const actionTypes = new Set(["configureProviderKey", "installRuntime", "retryTurn", "reviewProposal", "acceptProposal", "rejectProposal", "runFile", "openTerminal", "confirmCheckpoint", "implementCheckpoint", "discussCheckpoint", "skipCheckpoint", "prepareChange"]);
  function externalUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : null; } catch { return null; }
  }
  const text = (value, sourceStart) => ({ text: String(value ?? ''), sourceStart });
  const element = (tag, children = [], attrs = {}, key) => ({ tag, children, attrs, key });
  function codeSpan(value, start) {
    const marker = value.slice(start).match(/^`+/)?.[0];
    if (!marker) return null;
    const runs = /`+/g; runs.lastIndex = start + marker.length;
    let match;
    while ((match = runs.exec(value))) {
      if (value.slice(start + marker.length, match.index).includes('\n')) return null;
      if (match[0].length === marker.length) return { start: start + marker.length, end: match.index, next: runs.lastIndex };
    }
    return null;
  }
  // Escaped punctuation stays text; each source segment retains its actual offset.
  function escapedText(value, sourceStart, code = false) {
    const result = [], pattern = code ? /\\\|/g : /\\[\\`*{}\[\]()#+\-.!_|>]/g;
    let cursor = 0, match;
    while ((match = pattern.exec(value))) {
      if (match.index > cursor) result.push(text(value.slice(cursor, match.index), sourceStart + cursor));
      result.push(text(match[0].slice(1), sourceStart + match.index + 1)); cursor = pattern.lastIndex;
    }
    if (cursor < value.length) result.push(text(value.slice(cursor), sourceStart + cursor));
    return result;
  }
  function inline(value, sourceStart = 0, { tableCell = false } = {}) {
    const result = [], pattern = /^(?:\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\n]+)\))/;
    let cursor = 0, plainStart = 0;
    function flush() { if (plainStart < cursor) result.push(...escapedText(value.slice(plainStart, cursor), sourceStart + plainStart)); }
    while (cursor < value.length) {
      if (value[cursor] === '\\' && /[\\`*{}\[\]()#+\-.!_|>]/.test(value[cursor + 1] || '')) { cursor += 2; continue; }
      if (value[cursor] === '`') {
        const span = codeSpan(value, cursor);
        if (span) {
          flush();
          const code = value.slice(span.start, span.end), start = sourceStart + span.start;
          result.push(element('code', tableCell ? escapedText(code, start, true) : [text(code, start)]));
          cursor = span.next; plainStart = cursor; continue;
        }
        cursor += value.slice(cursor).match(/^`+/)[0].length; continue;
      }
      const match = ['*', '['].includes(value[cursor]) ? value.slice(cursor).match(pattern) : null;
      if (!match) { cursor++; continue; }
      flush();
      if (match[1] !== undefined) result.push(element('strong', escapedText(match[1], sourceStart + cursor + 2)));
      else if (match[2] !== undefined) result.push(element('em', escapedText(match[2], sourceStart + cursor + 1)));
      else if (externalUrl(match[4])) result.push(element('a', escapedText(match[3], sourceStart + cursor + 1), { href: match[4], rel: 'noopener noreferrer', title: 'Open external link' }));
      else result.push(text(match[0], sourceStart + cursor));
      cursor += match[0].length; plainStart = cursor;
    }
    flush();
    return result;
  }
  function heading(line) {
    const match = line.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/);
    if (!match) return null;
    const content = match[2] || '';
    return { level: match[1].length, value: content.replace(/[ \t]+#+[ \t]*$/, '').trimEnd(), start: line.length - content.length };
  }
  function tableCells(line) {
    const pipes = [];
    for (let i = 0; i < line.length;) {
      if (line[i] === '\\') { i += 2; continue; }
      if (line[i] === '`') {
        const span = codeSpan(line, i);
        i = span ? span.next : i + line.slice(i).match(/^`+/)[0].length; continue;
      }
      if (line[i] === '|') pipes.push(i);
      i++;
    }
    if (!pipes.length) return null;
    const cells = [], boundaries = [-1, ...pipes, line.length];
    for (let i = 1; i < boundaries.length; i++) {
      const start = boundaries[i - 1] + 1, value = line.slice(start, boundaries[i]);
      // Optional outside pipes delimit the row, rather than empty cells.
      if (!value.trim() && (i === 1 || i === boundaries.length - 1)) continue;
      cells.push({ value: value.trim(), start: start + value.length - value.trimStart().length });
    }
    return cells.length ? cells : null;
  }
  function tableHeader(lines, index) {
    const cells = tableCells(lines[index]), separators = tableCells(lines[index + 1] || '');
    if (!cells || !separators || cells.length !== separators.length || !separators.every(cell => /^:?-{3,}:?$/.test(cell.value))) return null;
    return { cells, alignment: separators.map(cell => cell.value.startsWith(':') ? (cell.value.endsWith(':') ? 'center' : 'left') : (cell.value.endsWith(':') ? 'right' : 'left')) };
  }
  function markdown(value) {
    const normalized = String(value).replaceAll('\r\n', '\n'), lines = normalized.split('\n'), blocks = [], offsets = [];
    let offset = 0;
    for (const line of lines) { offsets.push(offset); offset += line.length + 1; }
    for (let i = 0; i < lines.length;) {
      if (!lines[i].trim()) { i++; continue; }
      if (/^```[^`]*$/.test(lines[i])) {
        const language = lines[i++].slice(3).trim(), code = [], sourceStart = offsets[i] ?? normalized.length;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
        if (i < lines.length) i++;
        blocks.push(element('pre', [element('code', [text(code.join('\n'), sourceStart)])], language ? { 'aria-label': `${language} code` } : {})); continue;
      }
      const title = heading(lines[i]);
      if (title) { blocks.push(element(`h${title.level}`, inline(title.value, offsets[i] + title.start))); i++; continue; }
      const table = tableHeader(lines, i);
      if (table) {
        const cells = (values, tag, lineIndex) => values.map((cell, column) => element(tag, inline(cell.value, offsets[lineIndex] + cell.start, { tableCell: true }), { class: `align-${table.alignment[column]}`, ...(tag === 'th' ? { scope: 'col' } : {}) }));
        const header = element('thead', [element('tr', cells(table.cells, 'th', i))]), rows = []; i += 2;
        while (i < lines.length && lines[i].trim() && !heading(lines[i]) && !/^```/.test(lines[i])) {
          const values = tableCells(lines[i]);
          if (!values || values.length !== table.cells.length) break;
          rows.push(element('tr', cells(values, 'td', i++)));
        }
        blocks.push(element('div', [element('table', [header, element('tbody', rows)])], { class: 'markdown-table', tabindex: '0', role: 'region', 'aria-label': 'Table' })); continue;
      }
      const list = lines[i].match(/^(?:([-*]) |(\d+)\. )(.*)$/);
      if (list) {
        const ordered = Boolean(list[2]), items = [];
        while (i < lines.length) {
          const next = lines[i].match(/^(?:([-*]) |(\d+)\. )(.*)$/);
          if (!next || Boolean(next[2]) !== ordered) break;
          items.push(element('li', inline(next[3], offsets[i] + next[0].length - next[3].length))); i++;
        }
        blocks.push(element(ordered ? 'ol' : 'ul', items)); continue;
      }
      const sourceStart = offsets[i], paragraph = [lines[i++]];
      while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^(?:[-*] |\d+\. )/.test(lines[i]) && !heading(lines[i]) && !tableHeader(lines, i)) paragraph.push(lines[i++]);
      blocks.push(element('p', inline(paragraph.join('\n'), sourceStart)));
    }
    return blocks;
  }
  function prose(value, key) { return element('p', [text(value)], {}, key); }
  function details(label, children, key) { return element('details', [element('summary', [text(label)]), ...children], {}, key); }
  function field(label, value, key) { return element('div', [element('h3', [text(label)]), prose(value)], { class: 'learning-field' }, key); }
  function listField(label, values, key) { return values?.length ? [element('div', [element('h3', [text(label)]), element('ul', values.map(value => element('li', [text(value)])))], { class: 'learning-field' }, key)] : []; }
  const recovery = {
    learning_limit: 'Learning records were retained. Continue message-only discussion, or use New conversation in the view title; it clears this conversation and its memory-only learning state. Retrying cannot free the limit.',
    invalid_checkpoint: 'Send a new request with current context to replace the invalid checkpoint. No decision or preparation permission was added.',
    stale_context: 'Check the included files and send a new request with current context. A new displayed scope needs fresh confirmation.',
    context_unavailable: 'Check the included files and send a new request with current context.',
    stale_proposal: 'Request a fresh preparation scope before reviewing another change.',
    trust_unavailable: 'Message-only learning remains available. Workspace files, preparation and Run require a trusted workspace.',
    runtime_unavailable: 'Message-only learning remains available. Run requires an available KAFE runtime.',
    knowledge_unavailable: 'Message-only discussion remains available. Local KAFE guidance is unverified while knowledge is unavailable.',
    missing_key: 'Configure the provider key using the native action, then send explicitly. Configuration does not resend a request.',
    auth: 'Update the provider key using the native action, then send explicitly. Configuration does not resend a request.',
    preparation_required: 'Review the exact target and scope, then confirm Prepare change. Preparation does not Apply or Run.',
    tool_limit: 'Send a smaller new request. The Tutor will not retry automatically.',
  };
  function structured(entry) {
    const data = entry.data || {}, out = [];
    const filename = uri => typeof uri === 'string' ? uri.split('/').at(-1) : '';
    if (entry.kind === 'checkpoint' && data.checkpoint) {
      const c = data.checkpoint;
      out.push(prose(`${c.kind === 'implementation' ? 'Implementation' : 'Design'} checkpoint`, 'kind'));
      const adopted = data.disposition === 'confirmed' || entry.status === 'confirmed';
      const outcome = entry.status === 'stale' ? 'Stale: context changed or became unavailable. Request a current checkpoint before acting.' :
        ({ ready: 'Proposed: waiting for your reasoning or a displayed action.', preparing: 'Preparation was authorized for one change. Native Review and Apply remain separate; Run requires its own action.', discussed: 'Returned to discussion; no preparation permission granted.', skipped: 'Question skipped; no preparation permission granted.', confirmed: 'Design confirmed.' }[entry.status] || 'Checkpoint unavailable.');
      out.push(prose(`${adopted ? 'Adopted. ' : ''}${outcome}`, 'decision-outcome'));
      out.push(field('Learner proposal — Tutor summary, unconfirmed', c.learnerProposalSummary || 'No learner proposal summarized.', 'learner-summary'));
      out.push(...listField('Tutor additions', c.tutorProposedAdditions, 'additions'));
      out.push(field('Preparation scope', c.scopeSummary || 'No preparation scope proposed.', 'scope'));
      if (data.targetUri) out.push(field('Preparation target', data.targetUri, 'preparation-target'));
      else if (c.kind === 'implementation') out.push(prose('No eligible authorized preparation target. Message-only discussion remains available.', 'no-target'));
      out.push(...listField('Tradeoffs', c.tradeoffs, 'tradeoffs'), ...listField('Unresolved choices — preparation is unavailable', c.unresolvedChoices, 'choices'));
      out.push(prose(data.grounding === 'source-linked-proposal' ? 'Source-linked Tutor proposal; source availability does not verify the proposed design.' : 'Message-only proposal; not verified KAFE guidance.', 'grounding'));
      out.push(prose('Confirmation records adoption of this displayed decision. It does not establish independent authorship, understanding or mastery. Preparation, native Review and Apply, and learner-started Run are separate actions.', 'authority'));
      const references = [...listField('Admitted source IDs', c.sourceIds, 'source-ids'), ...listField('Prior decision IDs', c.priorDecisionIds, 'prior-ids')];
      if (references.length) out.push(details('Decision references', references, 'references'));
    }
    if (data.scopeSummary) out.push(field('Preparation scope', data.scopeSummary, 'preparation-scope'));
    if (data.targetUri && entry.kind === 'host') {
      out.push(field('Preparation target', data.targetUri, 'preparation-target'));
      out.push(prose(entry.status === 'stale' ? 'Stale scope. Request a current scope and confirm it again.' : 'Confirm this displayed scope to prepare one change. Native Review and Apply remain separate; Run starts only by your action.', 'scope-authority'));
    }
    if (entry.kind === 'proposal') {
      if (data.targetUri) out.push(field('Target', data.targetUri, 'target'));
      const outcome = { ready: 'Staged for native review; not applied. Review change must precede Apply. Run remains a separate learner action.', applied: 'Applied by the native host. Run remains a separate learner action; program correctness is not established.', stale: 'Stale proposal. Request a fresh preparation scope before reviewing another change.', rejected: 'Rejected; not applied.', cancelled: 'Cancelled; not confirmed as applied.', failed: 'The change was not confirmed as applied. Request a fresh preparation scope.', unavailable: 'The change is unavailable; not confirmed as applied.' }[entry.status];
      if (outcome) out.push(prose(outcome, 'proposal-outcome'));
    }
    if (entry.kind === 'error' && recovery[data.code]) out.push(prose(recovery[data.code], 'recovery'));
    if (entry.kind === 'run') {
      if (data.sourceUri) out.push(prose(filename(data.sourceUri), 'source'));
      if (!Number.isSafeInteger(data.exitCode) && data.exitCode !== null) {
        out.push(prose('Run has no completed exit result. Saved source: unknown. Current editor: unknown.', 'run-pending'));
        out.push(prose(`Runtime: ${data.runtimeVersion || 'unknown'}. Knowledge: ${data.knowledgePackVersion || 'unknown'}. Exact executed bytes: unknown. Correctness: not established.`, 'run-pending-evidence'));
        if (['failed', 'unavailable', 'cancelled'].includes(entry.status)) out.push(prose(recovery[data.code] || 'Check the current target and KAFE runtime before starting Run again. Message-only learning remains available.', 'run-recovery'));
      }
      if (Number.isSafeInteger(data.exitCode) || data.exitCode === null) {
        out.push(prose('Exit code: ' + (data.exitCode === null ? 'unknown' : data.exitCode) + (data.outputTruncated ? ' · Output truncated' : ''), 'result'));
        const output = [];
        if (data.stdout) output.push(element('pre', [text(data.stdout)], { 'aria-label': 'Program output' }, 'stdout'));
        if (data.stderr) output.push(element('pre', [text(data.stderr)], { 'aria-label': 'Program errors' }, 'stderr'));
        if (output.length) out.push(details('Output', output, 'output'));
        const saved = { 'unchanged-at-observed-boundaries': 'unchanged at observed boundaries', changed: 'changed', unknown: 'unknown' }[data.sourceRelationship] || 'unknown';
        const editor = { 'same-content': 'same content', changed: 'changed', unknown: 'unknown' }[data.currentDocumentRelationship] || 'unknown';
        out.push(prose(`Saved source: ${saved}. Current editor: ${editor}.`, 'source-comparison'));
        out.push(details('Run evidence', [prose('Exact executed bytes: unknown. Correctness: not established.', 'limits'), prose(`Runtime: ${data.runtimeVersion || 'unknown'}. Runtime mode: ${data.runtimeMode || 'unknown'}. Knowledge: ${data.knowledgePackVersion || 'unknown'}. Knowledge lineage: ${data.knowledgeLineage || 'unknown'}.`, 'versions')], 'run-evidence'));
      }
    }
    return out;
  }
  /** Patches only changed CharacterData, keeping selection in unchanged text prefixes. */
  function patchText(node, value) {
    if (node.data === value) return;
    const old = node.data; let start = 0, end = 0;
    while (start < old.length && start < value.length && old[start] === value[start]) start++;
    while (end < old.length - start && end < value.length - start && old[old.length - end - 1] === value[value.length - end - 1]) end++;
    node.replaceData(start, old.length - start - end, value.slice(start, value.length - end));
  }
  function createRenderer({ document, root, onAction, onOpenLink }) {
    const records = new Map(), specs = new WeakMap(), bindings = new WeakMap(); let current, disposed = false;
    function patch(parent, desired) {
      const oldNodes = [...parent.childNodes]; const used = new Set();
      desired.forEach((spec, index) => {
        const tag = spec.tag || '#text';
        let node = spec.key !== undefined ? oldNodes.find(n => !used.has(n) && specs.get(n)?.key === spec.key && specs.get(n)?.tag === tag) : oldNodes[index];
        if (!node || used.has(node) || specs.get(node)?.tag !== tag || (spec.key === undefined && specs.get(node)?.key !== undefined)) node = tag === '#text' ? document.createTextNode('') : document.createElement(tag);
        const prior = specs.get(node); used.add(node);
        if (tag === '#text') patchText(node, spec.text);
        else {
          const attrs = spec.attrs || {};
          for (const name of Object.keys(prior?.attrs || {})) if (!Object.hasOwn(attrs, name)) node.removeAttribute(name);
          for (const [name, value] of Object.entries(attrs)) {
            if (['checked', 'disabled'].includes(name)) node[name] = value === true;
            else if (node.getAttribute(name) !== String(value)) node.setAttribute(name, String(value));
          }
          patch(node, spec.children || []);
        }
        specs.set(node, { ...spec, tag });
        if (parent.childNodes[index] !== node) parent.insertBefore(node, parent.childNodes[index] || null);
      });
      for (const node of oldNodes) if (!used.has(node)) node.remove();
    }
    function textNodes(node) {
      if (node.nodeType === 3) return [node];
      return [...node.childNodes].flatMap(textNodes);
    }
    // Selection points refer to normalized Markdown source positions, not the
    // temporary literal delimiters or a particular parsed text-node structure.
    function captureSelection(body) {
      const selection = document.getSelection?.();
      if (!selection?.anchorNode || (!body.contains(selection.anchorNode) && !body.contains(selection.focusNode))) return null;
      function point(node, position) {
        if (!body.contains(node)) return { node, position };
        if (node.nodeType !== 3) {
          const following = node.childNodes[position];
          const candidates = following ? textNodes(following) : textNodes(node);
          node = following ? candidates[0] : candidates.at(-1);
          position = following ? 0 : node?.data.length;
        }
        const start = node && specs.get(node)?.sourceStart;
        return Number.isInteger(start) ? { source: start + position } : null;
      }
      const anchor = point(selection.anchorNode, selection.anchorOffset), focus = point(selection.focusNode, selection.focusOffset);
      return anchor && focus ? { selection, anchor, focus } : null;
    }
    function restoreSelection(body, captured) {
      if (!captured) return;
      const candidates = textNodes(body).filter(node => Number.isInteger(specs.get(node)?.sourceStart));
      function resolve(point) {
        if (point.node) return point;
        let previous;
        for (const node of candidates) {
          const start = specs.get(node).sourceStart, end = start + node.data.length;
          if (point.source >= start && point.source <= end) return { node, position: point.source - start };
          if (point.source < start) return { node, position: 0 };
          previous = node;
        }
        return previous ? { node: previous, position: previous.data.length } : null;
      }
      const anchor = resolve(captured.anchor), focus = resolve(captured.focus), selection = captured.selection;
      if (!anchor || !focus || (selection.anchorNode === anchor.node && selection.anchorOffset === anchor.position && selection.focusNode === focus.node && selection.focusOffset === focus.position)) return;
      if (typeof selection.setBaseAndExtent === 'function') selection.setBaseAndExtent(anchor.node, anchor.position, focus.node, focus.position);
      else {
        const range = document.createRange(); range.setStart(anchor.node, anchor.position); range.setEnd(focus.node, focus.position);
        selection.removeAllRanges(); selection.addRange(range);
      }
    }
    function click(event) {
      const button = event.target.closest?.('button');
      if (button && root.contains(button)) { const bound = bindings.get(button); if (bound && !button.disabled) onAction(bound); return; }
      const anchor = event.target.closest?.('a');
      if (anchor && root.contains(anchor)) { event.preventDefault(); const url = externalUrl(anchor.getAttribute('href')); if (url) onOpenLink(url); }
    }
    root.addEventListener('click', click);
    return {
      render(snapshot) {
        if (disposed) return; current = snapshot;
        const ids = new Set();
        snapshot.entries.filter(entry => Object.hasOwn(labels, entry.kind) && (entry.kind !== 'host' || Boolean(entry.data?.scopeSummary))).forEach((entry, index) => {
          ids.add(entry.id); let record = records.get(entry.id);
          if (!record) {
            const node = document.createElement('article'); node.className = 'entry'; node.setAttribute('data-entry-id', entry.id);
            const heading = document.createElement('h2'), body = document.createElement('div'), data = document.createElement('div'), actions = document.createElement('div');
            body.className = 'entry-text'; data.className = 'entry-data'; actions.className = 'entry-actions'; node.append(heading, body, data, actions);
            record = { node, heading, body, data, actions, buttons: new Map() }; records.set(entry.id, record);
          }
          const signature = JSON.stringify(entry);
          if (record.signature === signature) {
            if (root.children[index] !== record.node) root.insertBefore(record.node, root.children[index] || null);
            return;
          }
          record.signature = signature;
          record.node.setAttribute('data-kind', entry.kind); record.node.setAttribute('data-status', entry.status);
          patch(record.heading, [text(labels[entry.kind])]);
          if (record.text !== entry.text) {
            const selection = captureSelection(record.body);
            patch(record.body, ['learner', 'assistant'].includes(entry.kind) ? markdown(entry.text) : [prose(entry.text)]);
            restoreSelection(record.body, selection); record.text = entry.text;
          }
          // Keyed structured subtrees retain details expansion and selection as data changes.
          patch(record.data, structured(entry));
          const latest = new Map();
          for (const action of entry.actions) if (action.enabled && actionTypes.has(action.type)) latest.set(`${action.type}:${JSON.stringify(action.args)}`, action);
          const keys = new Set(); let actionIndex = 0;
          for (const [key, action] of latest) {
            keys.add(key); let button = record.buttons.get(key);
            if (!button) { button = document.createElement('button'); button.type = 'button'; record.buttons.set(key, button); }
            patch(button, [text(action.label)]); button.disabled = !action.enabled; button.setAttribute('aria-disabled', String(!action.enabled));
            button.setAttribute('data-action-id', action.id); button.setAttribute('data-action-type', action.type);
            bindings.set(button, { entryId: entry.id, actionId: action.id, args: action.args });
            if (record.actions.children[actionIndex] !== button) record.actions.insertBefore(button, record.actions.children[actionIndex] || null);
            actionIndex++;
          }
          for (const [key, button] of record.buttons) if (!keys.has(key)) { button.remove(); record.buttons.delete(key); }
          if (root.children[index] !== record.node) root.insertBefore(record.node, root.children[index] || null);
        });
        for (const [id, record] of records) if (!ids.has(id)) { record.node.remove(); records.delete(id); }
      },
      dispose() { disposed = true; root.removeEventListener('click', click); records.clear(); current = null; },
    };
  }
  window.KafeTutorTimeline = { createRenderer };
})();
