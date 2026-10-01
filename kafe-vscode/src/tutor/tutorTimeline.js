(() => {
  const labels = { learner: "You", assistant: "KAFE Tutor", proposal: "Proposed change", run: "Run", error: "Unable to complete" };
  const actionTypes = new Set(["configureProviderKey", "installRuntime", "retryTurn", "reviewProposal", "acceptProposal", "rejectProposal", "runFile", "openTerminal"]);
  function externalUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : null; } catch { return null; }
  }
  const text = (value, sourceStart) => ({ text: String(value ?? ''), sourceStart });
  const element = (tag, children = [], attrs = {}, key) => ({ tag, children, attrs, key });
  function inline(value, sourceStart = 0) {
    const result = [], pattern = /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
    let cursor = 0, match;
    while ((match = pattern.exec(value))) {
      if (match.index > cursor) result.push(text(value.slice(cursor, match.index), sourceStart + cursor));
      if (match[1] !== undefined) result.push(element('strong', [text(match[1], sourceStart + match.index + 2)]));
      else if (match[2] !== undefined) result.push(element('code', [text(match[2], sourceStart + match.index + 1)]));
      else if (match[3] !== undefined) result.push(element('em', [text(match[3], sourceStart + match.index + 1)]));
      else if (externalUrl(match[5])) result.push(element('a', [text(match[4], sourceStart + match.index + 1)], { href: match[5], rel: 'noopener noreferrer', title: 'Open external link' }));
      else result.push(text(match[0], sourceStart + match.index));
      cursor = pattern.lastIndex;
    }
    if (cursor < value.length) result.push(text(value.slice(cursor), sourceStart + cursor));
    return result;
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
      while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^(?:[-*] |\d+\. )/.test(lines[i])) paragraph.push(lines[i++]);
      blocks.push(element('p', inline(paragraph.join('\n'), sourceStart)));
    }
    return blocks;
  }
  function prose(value, key) { return element('p', [text(value)], {}, key); }
  function details(label, children, key) { return element('details', [element('summary', [text(label)]), ...children], {}, key); }
  function structured(entry) {
    const data = entry.data || {}, out = [];
    const filename = uri => typeof uri === 'string' ? uri.split('/').at(-1) : '';
    if (entry.kind === 'proposal' && data.targetUri) out.push(prose(filename(data.targetUri), 'target'));
    if (entry.kind === 'run') {
      if (data.sourceUri) out.push(prose(filename(data.sourceUri), 'source'));
      if (Number.isSafeInteger(data.exitCode) || data.exitCode === null) {
        out.push(prose('Exit code: ' + (data.exitCode === null ? 'unknown' : data.exitCode) + (data.outputTruncated ? ' · Output truncated' : ''), 'result'));
        const output = [];
        if (data.stdout) output.push(element('pre', [text(data.stdout)], { 'aria-label': 'Program output' }, 'stdout'));
        if (data.stderr) output.push(element('pre', [text(data.stderr)], { 'aria-label': 'Program errors' }, 'stderr'));
        if (output.length) out.push(details('Output', output, 'output'));
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
        snapshot.entries.filter(entry => Object.hasOwn(labels, entry.kind)).forEach((entry, index) => {
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
