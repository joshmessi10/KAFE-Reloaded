const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tutorRoot = path.resolve(__dirname, '../../src/tutor');

// Browser boundary only: the shipped scripts and HTML run unchanged.
function loadView({ html = fs.readFileSync(path.join(tutorRoot, 'tutorView.html'), 'utf8') } = {}) {
  const sent = [], persisted = [];
  const selection = {
    range: null, backward: false,
    addRange(range) { this.range = range; this.backward = false; },
    removeAllRanges() { this.range = null; }, getRangeAt() { return this.range; },
    get rangeCount() { return this.range ? 1 : 0; },
    get anchorNode() { return this.range?.[this.backward ? 'endContainer' : 'startContainer'] || null; },
    get anchorOffset() { return this.range?.[this.backward ? 'endOffset' : 'startOffset'] || 0; },
    get focusNode() { return this.range?.[this.backward ? 'startContainer' : 'endContainer'] || null; },
    get focusOffset() { return this.range?.[this.backward ? 'startOffset' : 'endOffset'] || 0; },
    setBaseAndExtent(anchor, anchorOffset, focus, focusOffset) {
      const order = [];
      function visit(node) { order.push(node); node.childNodes.forEach(visit); }
      visit(root);
      this.backward = anchor === focus ? anchorOffset > focusOffset : order.indexOf(anchor) > order.indexOf(focus);
      const range = document.createRange();
      range.setStart(this.backward ? focus : anchor, this.backward ? focusOffset : anchorOffset);
      range.setEnd(this.backward ? anchor : focus, this.backward ? anchorOffset : focusOffset);
      this.range = range;
    },
    toString() {
      if (!this.range) return '';
      const texts = [];
      function visit(node) { if (node.nodeType === 3) texts.push(node); else node.childNodes.forEach(visit); }
      visit(root);
      const start = texts.indexOf(this.range.startContainer), end = texts.indexOf(this.range.endContainer);
      return texts.slice(start, end + 1).map((node, index, selected) => node.data.slice(index === 0 ? this.range.startOffset : 0, index === selected.length - 1 ? this.range.endOffset : node.data.length)).join('');
    },
  };
  const document = { activeElement: null };
  class Node {
    constructor(tagName, data = '') {
      this.tagName = tagName; this.nodeType = tagName === '#text' ? 3 : 1; this.data = data;
      this.childNodes = []; this.parentNode = null; this.listeners = new Map(); this.attributes = new Map(); this.dataset = {};
      this.value = ''; this.hidden = false; this.disabled = false; this.scrollTop = 0; this.scrollHeight = 500; this.clientHeight = 500; this.attributeWrites = 0;
      this.selectionStart = 0; this.selectionEnd = 0;
    }
    get children() { return this.childNodes.filter(n => n.nodeType === 1); }
    get firstChild() { return this.childNodes[0] || null; }
    get textContent() { return this.nodeType === 3 ? this.data : this.childNodes.map(n => n.textContent).join(''); }
    set textContent(v) { if (this.nodeType === 3) this.replaceData(0, this.data.length, String(v)); else this.replaceChildren(...(v === '' ? [] : [document.createTextNode(String(v))])); }
    get className() { return this.getAttribute('class') || ''; }
    set className(v) { this.setAttribute('class', v); }
    setAttribute(k, v) { this.attributeWrites++; this.attributes.set(k, String(v)); if (k === 'id') this.id = String(v); if (k === 'hidden') this.hidden = true; if (k === 'disabled') this.disabled = true; if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v); }
    getAttribute(k) { return this.attributes.get(k) ?? null; }
    removeAttribute(k) { this.attributes.delete(k); if (k === 'hidden') this.hidden = false; if (k === 'disabled') this.disabled = false; }
    contains(n) { return this === n || this.childNodes.some(c => c.contains(n)); }
    append(...nodes) { for (const n of nodes) this.insertBefore(typeof n === 'string' ? document.createTextNode(n) : n, null); }
    insertBefore(n, before) { if (n.parentNode) n.parentNode.childNodes.splice(n.parentNode.childNodes.indexOf(n), 1); n.parentNode = this; const i = before ? this.childNodes.indexOf(before) : this.childNodes.length; this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, n); return n; }
    remove() { if (!this.parentNode) return; if (this.contains(document.activeElement)) document.activeElement = null; if (this.contains(selection.range?.startContainer)) selection.removeAllRanges(); this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1); this.parentNode = null; }
    replaceChildren(...nodes) { [...this.childNodes].forEach(n => n.remove()); this.append(...nodes); }
    replaceData(offset, count, value) {
      const end = Math.min(this.data.length, offset + count), range = selection.range;
      if (range) for (const side of ['start', 'end']) if (range[`${side}Container`] === this) {
        const p = range[`${side}Offset`]; if (p > offset && p <= end) range[`${side}Offset`] = offset;
        else if (p > end) range[`${side}Offset`] += String(value).length - (end - offset);
      }
      this.data = this.data.slice(0, offset) + value + this.data.slice(end);
    }
    matches(s) {
      if (s.startsWith('#')) return this.id === s.slice(1);
      if (s.startsWith('.')) return this.className.split(/\s+/).includes(s.slice(1));
      const m = s.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return m ? (!m[1] || this.tagName === m[1]) && this.getAttribute(m[2]) !== null && (m[3] === undefined || this.getAttribute(m[2]) === m[3]) : this.tagName === s;
    }
    closest(s) { for (let n = this; n; n = n.parentNode) if (n.matches(s)) return n; return null; }
    querySelectorAll(s) { return this.childNodes.flatMap(n => [...(n.matches(s) ? [n] : []), ...n.querySelectorAll(s)]); }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    addEventListener(t, f) { if (!this.listeners.has(t)) this.listeners.set(t, new Set()); this.listeners.get(t).add(f); }
    removeEventListener(t, f) { this.listeners.get(t)?.delete(f); }
    dispatchEvent(e) { if (this.disabled && e.type === 'click') return false; e.target ||= this; e.preventDefault ||= () => { e.defaultPrevented = true; }; for (const f of [...(this.listeners.get(e.type) || [])]) f(e); if (e.bubbles !== false && this.parentNode) this.parentNode.dispatchEvent(e); return !e.defaultPrevented; }
    dispatch(type, fields = {}) { return this.dispatchEvent({ type, ...fields }); }
    focus() { document.activeElement = this; }
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
    scrollIntoView() { this.scrolledIntoView = true; }
  }
  document.createElement = t => new Node(t); document.createTextNode = v => new Node('#text', String(v));
  document.createRange = () => ({ setStart(n, o) { this.startContainer = n; this.startOffset = o; }, setEnd(n, o) { this.endContainer = n; this.endOffset = o; } });
  document.getSelection = () => selection;
  const root = new Node('document'), stack = [root];
  for (const token of html.match(/<!--[^]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || []) {
    if (/^<!/.test(token)) continue;
    if (/^<\//.test(token)) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)?.[1]; if (!tag) continue; const n = new Node(tag);
      for (const [, k, v] of token.matchAll(/\s([\w-]+)(?:="([^"]*)")?/g)) n.setAttribute(k, v ?? '');
      stack.at(-1).append(n); if (!['meta', 'link', 'input', 'br', 'hr'].includes(tag) && !token.endsWith('/>')) stack.push(n);
    } else stack.at(-1).append(document.createTextNode(token));
  }
  document.body = root.querySelector('body'); document.getElementById = id => root.querySelector(`#${id}`);
  const window = new Node('window'); window.document = document; window.getSelection = () => selection;
  const context = vm.createContext({ document, window, URL, crypto: require('node:crypto').webcrypto, acquireVsCodeApi: () => ({ postMessage: m => sent.push(structuredClone(m)), setState: s => persisted.push(s) }) });
  const timeline = path.join(tutorRoot, 'tutorTimeline.js'); if (fs.existsSync(timeline)) vm.runInContext(fs.readFileSync(timeline, 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(tutorRoot, 'tutorView.js'), 'utf8'), context);
  return { root, document, window, selection, sent, persisted, byId: id => document.getElementById(id),
    render: state => window.dispatchEvent({ type: 'message', data: { type: 'render', state } }), dispose: () => window.dispatchEvent({ type: 'pagehide' }) };
}
function snapshot(fields = {}) { return { sessionId: 'session', generation: 1, revision: 1, draft: '', inputRevision: 0, context: { revision: 0, restricted: false, activeSource: null, sources: [] }, contextActions: { entryId: 'context', actions: [] }, entries: [], turn: null, ...fields }; }
function entry(id, kind, text, fields = {}) { return { id, kind, status: 'completed', text, actions: [], data: null, ...fields }; }
function action(id, type, args = {}, enabled = true) { return { id, type, label: type, args, enabled }; }
module.exports = { loadView, snapshot, entry, action };
