const assert = require('node:assert/strict');
const test = require('node:test');
const { loadView, snapshot, entry, action } = require('../helpers/tutorViewHarness');
const { ConversationSession } = require('../../src/tutor/ConversationSession');
const { dispatchTutorMessage } = require('../../src/tutor/TutorViewProvider');
const row = (v,id) => v.byId('timeline').querySelector('[data-entry-id="'+id+'"]');
const command = (type,fields={}) => ({type,sessionId:'session',generation:1,...fields});
test('streaming preserves entry text identity selection focus and next draft', () => {
  const v = loadView(), entries = [entry('older', 'assistant', 'Earlier answer'), entry('stream', 'assistant', 'Stable prefix', { status: 'responding' })]; v.render(snapshot({ entries }));
  const older = row(v, 'older'), stream = row(v, 'stream'), text = stream.querySelector('.entry-text').querySelector('p').firstChild;
  const range = v.document.createRange(); range.setStart(text, 0); range.setEnd(text, 6); v.selection.addRange(range);
  const c = v.byId('composer'); c.focus(); c.value = 'Next draft'; c.setSelectionRange(3, 7); c.dispatch('input');
  v.render(snapshot({ revision: 2, entries: [entries[0], { ...entries[1], text: 'Stable prefix with delta' }] }));
  assert.equal(row(v, 'older'), older); assert.equal(row(v, 'stream'), stream); assert.equal(stream.querySelector('.entry-text').querySelector('p').firstChild, text);
  assert.equal(v.selection.getRangeAt(0), range); assert.equal(range.endOffset, 6); assert.equal(v.document.activeElement, c); assert.equal(c.value, 'Next draft'); assert.equal(c.selectionStart, 3); assert.equal(c.selectionEnd, 7);
});

test('reading earlier entries preserves scroll; bottom following has the 48px boundary', () => {
  const v = loadView(); v.render(snapshot({ entries: [entry('a', 'assistant', 'A')] })); const t = v.byId('timeline'); t.scrollHeight = 1000; t.clientHeight = 300; t.scrollTop = 652;
  v.render(snapshot({ revision: 2, entries: [entry('a', 'assistant', 'AB')] })); assert.equal(t.scrollTop, 1000);
  t.scrollTop = 651; v.render(snapshot({ revision: 3, draft: 'Draft', inputRevision: 1, entries: [entry('a', 'assistant', 'AB')] })); assert.equal(t.scrollTop, 651); assert.equal(v.byId('new-content').hidden, true);
  t.scrollTop = 0; v.render(snapshot({ revision: 4, entries: [entry('a', 'assistant', 'ABC')] })); assert.equal(t.scrollTop, 0); assert.equal(v.byId('new-content').hidden, false);
  v.byId('new-content').dispatch('click'); assert.equal(t.scrollTop, 1000); assert.equal(v.byId('new-content').hidden, true);
});

test('safe Markdown formats lists code emphasis and validated links; model action markup stays inert', () => {
  const v = loadView(), text = '**Hint** *next* `x`\n\n- first\n- second\n\n```kf\nprint(1)\n```\n\n<script>bad()</script> <button data-action-id="forged">Run</button>\n\n[command](command:evil) [safe](https://example.com/docs) [data](data:text/html,x)';
  v.render(snapshot({ entries: [entry('a', 'assistant', text)] })); const a = row(v, 'a'); assert.equal(a.querySelector('strong').textContent, 'Hint'); assert.equal(a.querySelector('em').textContent, 'next'); assert.equal(a.querySelectorAll('li').length, 2); assert.equal(a.querySelector('pre').textContent, 'print(1)'); assert.equal(a.querySelectorAll('script').length, 0); assert.equal(a.querySelectorAll('button').length, 0); assert.match(a.textContent, /<button/); assert.equal(a.querySelectorAll('a').length, 1);
  a.querySelector('a').dispatch('click'); assert.deepEqual(v.sent.at(-1), command('openLink', { url: 'https://example.com/docs' }));
});

test('view disposal removes listeners and writes no disk-backed state', () => {
  const v = loadView(); v.render(snapshot({ draft: 'Private', entries: [entry('a', 'assistant', 'Private answer')] })); v.dispose(); v.byId('composer').value = 'Later'; v.byId('composer').dispatch('input'); assert.deepEqual(v.sent, []); assert.deepEqual(v.persisted, []);
});

test('text entered before the first host snapshot survives hydration and is forwarded once', () => {
  const v = loadView(), c = v.byId('composer'); c.value = 'Locally newer'; c.dispatch('input');
  v.render(snapshot({ draft: 'Older host draft', inputRevision: 2 }));
  assert.equal(c.value, 'Locally newer'); assert.deepEqual(v.sent, [command('setDraft', { text: 'Locally newer' })]);
});

test('a streaming delta performs no DOM writes on unrelated stable entries', () => {
  const v = loadView(), older = entry('older', 'assistant', 'Selected earlier text'), streaming = entry('a', 'assistant', 'First');
  v.render(snapshot({ entries: [older, streaming] })); const oldRow = row(v, 'older'), writes = oldRow.attributeWrites;
  v.render(snapshot({ revision: 2, entries: [older, { ...streaming, text: 'First delta' }] }));
  assert.equal(oldRow.attributeWrites, writes); assert.equal(row(v, 'older'), oldRow);
});
for (const [name, marker, tag] of [['inline code', '`', 'code'], ['emphasis', '*', 'em'], ['strong emphasis', '**', 'strong']]) {
  for (const backward of [false, true]) {
    test(`${name} closing delimiter preserves ${backward ? 'backward' : 'forward'} selection in stable characters`, () => {
      const v = loadView(), raw = `Read ${marker}stable words`;
      v.render(snapshot({ entries: [entry('a', 'assistant', raw, { status: 'responding' })] }));
      const before = row(v, 'a').querySelector('.entry-text').querySelector('p').firstChild;
      const start = 5 + marker.length, end = start + 6;
      v.selection.setBaseAndExtent(before, backward ? end : start, before, backward ? start : end);
      assert.equal(v.selection.toString(), 'stable');
      const composer = v.byId('composer'); composer.focus(); composer.value = 'Next draft'; composer.dispatch('input');
      v.render(snapshot({ revision: 2, entries: [entry('a', 'assistant', `${raw}${marker} then more`, { status: 'responding' })] }));
      assert.equal(row(v, 'a').querySelector(tag).textContent, 'stable words');
      assert.equal(v.selection.toString(), 'stable');
      assert.equal(v.selection.backward, backward);
      assert.equal(v.document.activeElement, composer); assert.equal(composer.value, 'Next draft');
    });
  }
}

test('Enter submits a single conversational message with exact fields and duplicate activation blocked', () => {
  const v = loadView(); v.render(snapshot({ context: { revision: 7, restricted: false, activeSource: null, sources: [] } }));
  const c = v.byId('composer'); c.value = '  Help\nwith lists  '; c.dispatch('input');
  c.dispatch('keydown', { key: 'Enter' }); v.byId('composer-form').dispatch('submit'); c.dispatch('keydown', { key: 'Enter' });
  const submissions = v.sent.filter(m=>m.type==='submitMessage'); assert.equal(submissions.length,1);
  const m=submissions[0]; assert.match(m.submissionId,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.deepEqual(m,command('submitMessage',{submissionId:m.submissionId,text:'  Help\nwith lists  ',contextRevision:7}));
  assert.deepEqual(v.sent.map(m=>m.type),['setDraft','submitMessage']);
});
test('first view has no administration and ignores obsolete structured transcript entries', () => {
  const v=loadView(); v.render(snapshot({entries:['review','milestones','check','progress','host'].map(k=>entry(k,k,'INTERNAL ADMIN',{data:{request:{secret:'payload'}}}))}));
  assert.equal(v.root.querySelector('h1'),null); assert.equal(v.byId('header-actions'),null); assert.equal(v.byId('timeline').children.length,0);
  assert.equal(v.root.querySelectorAll('textarea').length,1); assert.equal(v.byId('send').textContent,'Send');
  assert.doesNotMatch(v.root.textContent,/review|milestone|payload|provenance|progress|prepares/i);
});
const source=(id,label,category='selected-file',included=false)=>({id,label,uri:'file:///workspace/'+label,category,included});
test('active explicit selection is displayed once and returns checked after focus changes', () => {
  const v = loadView(), selected = source('optional:1', 'b.kf', 'selected-file', true);
  v.render(snapshot({context:{revision:1,restricted:false,activeSource:source('active-file','b.kf','active-file',true),sources:[selected]}}));
  assert.equal(v.byId('context-sources').querySelectorAll('input').length, 0);
  v.render(snapshot({revision:2,context:{revision:2,restricted:false,activeSource:source('active-file','a.kf','active-file',true),sources:[selected]}}));
  assert.equal(v.byId('context-sources').querySelector('input').checked, true);
});

test('settled null exit preserves partial output errors and truncation without sending actions', () => {
  const v = loadView();
  v.render(snapshot({entries:[entry('run','run','Learner-started KAFE run completed.',{status:'completed',data:{exitCode:null,stdout:'PARTIAL_OUTPUT',stderr:'Launch failed',outputTruncated:true}})]}));
  const run = row(v, 'run'); assert.match(run.textContent, /Exit code: unknown/); assert.match(run.textContent, /Output truncated/);
  assert.equal(run.querySelector('summary').textContent, 'Output'); assert.match(run.querySelector('details').textContent, /PARTIAL_OUTPUT/); assert.match(run.querySelector('details').textContent, /Launch failed/);
  assert.deepEqual(v.sent, []);
  v.render(snapshot({revision:2,entries:[entry('running','run','Running',{status:'running',data:{stdout:'not settled'}})]}));
  assert.equal(row(v,'running').querySelector('details'), null); assert.doesNotMatch(row(v,'running').textContent, /Exit code/);
});
test('context is visible before a request and selection sends canonical ID with current host revision', () => {
  const v=loadView(); v.render(snapshot({context:{revision:8,restricted:false,activeSource:source('active-file','main.kf','active-file',true),sources:[source('optional:1','extra.kf')]}}));
  assert.match(v.byId('context-row').textContent,/main\.kf/); const choice=v.byId('context-sources').querySelector('input');
  assert.equal(choice.checked,false); choice.checked=true; choice.dispatch('change');
  assert.deepEqual(v.sent.at(-1),command('setSourceIncluded',{sourceId:'optional:1',included:true,contextRevision:8}));
});
test('restricted context excludes file disclosure and contextual Run', () => {
  const v=loadView(); v.render(snapshot({context:{revision:9,restricted:true,activeSource:source('active-file','private.kf','active-file',true),sources:[source('optional:1','secret.kf','selected-file',true)]},contextActions:{entryId:'ctx',actions:[action('run','runFile',{targetUri:'file:///workspace/private.kf'})]}}));
  assert.doesNotMatch(v.root.textContent,/private|secret/); assert.match(v.byId('context-row').textContent,/Files excluded/); assert.equal(v.byId('context-run').hidden,true);
});
test('Shift Enter and all IME paths never submit; native newline default is preserved', () => {
  const v=loadView(); v.render(snapshot()); const c=v.byId('composer'); c.value='Question'; c.dispatch('input');
  assert.equal(c.dispatch('keydown',{key:'Enter',shiftKey:true}),true);
  assert.equal(c.dispatch('keydown',{key:'Enter',isComposing:true}),true);
  assert.equal(c.dispatch('keydown',{key:'Enter',keyCode:229}),true);
  c.dispatch('compositionstart'); c.dispatch('keydown',{key:'Enter'}); v.byId('composer-form').dispatch('submit'); c.dispatch('compositionend');
  assert.equal(v.sent.filter(m=>m.type==='submitMessage').length,0);
});
const turn=(submissionId,status='preparing')=>({id:'t1',turnGeneration:1,status,submissionId,learnerEntryId:'l1',assistantEntryId:null});
test('delayed admission cannot erase identical newer text and acknowledgements preserve newer local revision', () => {
  const v=loadView(); v.render(snapshot()); const c=v.byId('composer'); c.value='Same'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'});
  const id=v.sent.at(-1).submissionId; c.value='Different'; c.dispatch('input'); c.value='Same'; c.dispatch('input');
  v.render(snapshot({revision:2,inputRevision:1,draft:'Same'}));
  v.render(snapshot({revision:3,inputRevision:2,draft:'',turn:turn(id)})); assert.equal(c.value,'Same');
  v.render(snapshot({revision:4,inputRevision:3,draft:'Different',turn:turn(id,'responding')})); assert.equal(c.value,'Same');
  v.render(snapshot({revision:5,inputRevision:4,draft:'Same',turn:turn(id,'completed')})); assert.equal(c.value,'Same');
  v.render(snapshot({revision:6,inputRevision:5,draft:'',turn:turn(id,'completed')})); assert.equal(c.value,'Same');
});
test('admitted original draft clears once and Stop replaces Send through preparation and streaming', () => {
  const v=loadView(); v.render(snapshot()); const c=v.byId('composer'); c.value='Send me'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'}); const id=v.sent.at(-1).submissionId;
  v.render(snapshot({revision:2,inputRevision:1,draft:'Send me',turn:turn(id)})); assert.equal(c.value,'');
  for(const [i,status] of ['preparing','responding','processing-tools'].entries()) {
    v.render(snapshot({revision:3+i,inputRevision:2,draft:'',turn:turn(id,status)}));
    assert.equal(v.byId('send').hidden,true); assert.equal(v.byId('stop').hidden,false); assert.equal(c.disabled,false);
  }
  v.byId('stop').dispatch('click'); assert.deepEqual(v.sent.at(-1),command('stopTurn',{turnId:'t1',turnGeneration:1}));
  c.value='Next'; c.dispatch('input'); v.render(snapshot({revision:6,inputRevision:2,turn:turn(id,'cancelled')})); assert.equal(c.value,'Next'); assert.equal(v.byId('send').hidden,false);
});
test('context projection preserves focused optional selector and input selection without changing older scroll', () => {
  const v=loadView(), context={revision:1,restricted:false,activeSource:source('active-file','a.kf','active-file',true),sources:[source('optional:1','b.kf')]};
  v.render(snapshot({context,entries:[entry('a','assistant','Answer')]})); const input=v.byId('context-sources').querySelector('input'); input.focus();
  const t=v.byId('timeline'); t.scrollHeight=1200; t.clientHeight=300; t.scrollTop=30;
  v.render(snapshot({revision:2,context:{...context,revision:2,sources:[{...context.sources[0],included:true}]},entries:[entry('a','assistant','Answer')]}));
  assert.equal(v.document.activeElement,input); assert.equal(v.byId('context-sources').querySelector('input'),input); assert.equal(t.scrollTop,30);
});
test('context Run is non-transcript and sends an exact host capability accepted by the real bridge', () => {
  const s=new ConversationSession(), active=source('active-file','main.kf','active-file',true); s.setContext({restricted:false,activeSource:active,sources:[]}); s.setContextRunAction(active);
  const v=loadView(); v.render(s.snapshot()); const button=v.byId('context-run'); assert.equal(button.textContent,'Run main.kf'); button.focus();
  s.setDraft('next'); v.render(s.snapshot()); assert.equal(v.document.activeElement,button); button.dispatch('click');
  const a=s.snapshot().contextActions.actions[0], m=v.sent.at(-1);
  assert.deepEqual(m,{type:'invokeAction',sessionId:s.snapshot().sessionId,generation:1,entryId:s.snapshot().contextActions.entryId,actionId:a.id,args:{targetUri:'file:///workspace/main.kf'}});
  assert.equal(dispatchTutorMessage(m,()=>{},s),true); assert.equal(v.byId('timeline').children.length,0);
});
test('reissued relevant capability retains focused button and unavailable Apply vanishes', () => {
  const v=loadView(), a=entry('p','proposal','Change main.kf',{actions:[action('old','reviewProposal',{proposalId:'p'})]}); v.render(snapshot({entries:[a]})); const b=row(v,'p').querySelector('button'); b.focus();
  v.render(snapshot({revision:2,entries:[{...a,actions:[action('old','reviewProposal',{proposalId:'p'},false),action('new','reviewProposal',{proposalId:'p'}),action('disabled','acceptProposal',{proposalId:'p'},false),action('obsolete','showProgress')]}]}));
  assert.equal(row(v,'p').querySelectorAll('button').length,1); assert.equal(row(v,'p').querySelector('button'),b); assert.equal(v.document.activeElement,b); b.dispatch('click'); assert.equal(v.sent.at(-1).actionId,'new');
});
test('Run output disclosure retains expansion and attributes available runtime with unknown comparisons', () => {
  const v=loadView(), run=entry('run','run','Run completed',{data:{sourceUri:'file:///workspace/main.kf',exitCode:0,stdout:'ok',stderr:'diagnostic',outputTruncated:true,runtimeVersion:'SECRET_VERSION'}});
  v.render(snapshot({entries:[run,entry('a','assistant','A')]})); const d=row(v,'run').querySelector('details'); d.open=true;
  v.render(snapshot({revision:2,entries:[run,entry('a','assistant','AB')]})); assert.equal(row(v,'run').querySelector('details'),d); assert.equal(d.open,true); assert.match(row(v,'run').textContent,/main\.kf.*Exit code: 0/s); assert.match(row(v,'run').textContent,/Runtime: SECRET_VERSION/); assert.match(row(v,'run').textContent,/Saved source: unknown/); assert.doesNotMatch(row(v,'run').textContent,/Document version/);
});
test('status announces response and settlement once without speaking streaming tokens or lifecycle suffixes', () => {
  const v=loadView(), t=turn('id','responding'), a=entry('a','assistant','First',{status:'responding'}); v.render(snapshot({turn:t,entries:[a]})); const status=v.byId('conversation-status').textContent;
  assert.match(status,/Responding/); assert.equal(row(v,'a').querySelector('h2').textContent,'KAFE Tutor');
  v.render(snapshot({revision:2,turn:t,entries:[{...a,text:'First delta'}]})); assert.equal(v.byId('conversation-status').textContent,status);
  v.render(snapshot({revision:3,turn:{...t,status:'cancelled'},entries:[a]})); assert.match(v.byId('conversation-status').textContent,/interrupted/i);
  v.render(snapshot({revision:4,turn:{...t,status:'failed'},entries:[entry('error','error','Request unavailable',{status:'failed'})]})); assert.match(v.byId('conversation-status').textContent,/unavailable/);
  assert.equal(v.byId('timeline').getAttribute('aria-live'),'off');
});
test('malformed and older renders do not alter live draft transcript or capability bindings', () => {
  const v=loadView(); v.render(snapshot({revision:8,draft:'Current',entries:[entry('a','assistant','Current answer')]}));
  for(const bad of [null,{},snapshot({revision:7,draft:'Old'}),snapshot({revision:9,context:null}),snapshot({revision:9,entries:[{id:'bad',kind:'assistant',text:1}]}),snapshot({revision:9,contextActions:{entryId:'x',actions:[{id:'bad',args:null}]}})]) v.render(bad);
  assert.equal(v.byId('composer').value,'Current'); assert.match(v.byId('timeline').textContent,/Current answer/);
});

test('primary keyboard focus follows Send to Stop and returns on settlement', () => {
  const v=loadView(); v.render(snapshot({draft:'Next'})); const send=v.byId('send'), stop=v.byId('stop');
  send.focus(); v.render(snapshot({revision:2,turn:turn('id')})); assert.equal(v.document.activeElement,stop);
  v.render(snapshot({revision:3,turn:turn('id','responding')})); assert.equal(v.document.activeElement,stop);
  v.render(snapshot({revision:4,turn:turn('id','completed')})); assert.equal(v.document.activeElement,send);
});

test('submission rejected by an unseen busy turn releases duplicate guard at authoritative settlement', () => {
  const v=loadView(); v.render(snapshot()); const c=v.byId('composer'); c.value='Next'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'});
  const rejected=v.sent.at(-1).submissionId;
  v.render(snapshot({revision:2,draft:'Next',inputRevision:1,turn:turn('other','responding')})); assert.equal(c.value,'Next');
  v.render(snapshot({revision:3,draft:'Next',inputRevision:1,turn:turn('other','completed')})); assert.equal(v.byId('send').disabled,false);
  c.dispatch('keydown',{key:'Enter'}); const submits=v.sent.filter(m=>m.type==='submitMessage'); assert.equal(submits.length,2); assert.notEqual(submits[1].submissionId,rejected);
});
test('unadmitted stale context releases duplicate guard while preserving next draft', () => {
  const v=loadView(); v.render(snapshot()); const c=v.byId('composer'); c.value='Original'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'}); c.value='Next'; c.dispatch('input');
  v.render(snapshot({revision:2,context:{revision:1,restricted:false,activeSource:null,sources:[]}})); assert.equal(c.value,'Next'); assert.equal(v.byId('send').disabled,false);
});

test('unchanged settled owner and older renders cannot release pending duplicate guard', () => {
  const v=loadView(), settled={...turn('old','failed'),turnGeneration:4}; v.render(snapshot({revision:8,turn:settled}));
  const c=v.byId('composer'); c.value='Next'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'});
  v.render(snapshot({revision:9,inputRevision:1,draft:'Next',turn:settled})); assert.equal(v.byId('send').disabled,true);
  v.render(snapshot({revision:7,turn:{...settled,turnGeneration:9,status:'completed'}})); assert.equal(v.byId('send').disabled,true);
  v.render(snapshot({revision:10,inputRevision:1,draft:'Next',turn:{...settled,turnGeneration:3,status:'completed'}})); assert.equal(v.byId('send').disabled,true);
  assert.equal(v.sent.filter(m=>m.type==='submitMessage').length,1);
});
test('advanced settled owner releases guard without losing matching late admission revision protection', () => {
  const v=loadView(), settled=turn('old','failed'); v.render(snapshot({turn:settled})); const c=v.byId('composer'); c.value='Same'; c.dispatch('input'); c.dispatch('keydown',{key:'Enter'}); const id=v.sent.at(-1).submissionId;
  c.value='Different'; c.dispatch('input'); c.value='Same'; c.dispatch('input');
  v.render(snapshot({revision:2,inputRevision:1,draft:'',turn:{...settled,turnGeneration:2,submissionId:'retry',status:'cancelled'}})); assert.equal(v.byId('send').disabled,false); assert.equal(c.value,'Same');
  v.render(snapshot({revision:3,inputRevision:2,draft:'',turn:turn(id)})); assert.equal(c.value,'Same');
  assert.equal(v.sent.filter(m=>m.type==='submitMessage').length,1);
});
