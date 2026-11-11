const test = require('node:test');
const assert = require('node:assert/strict');
const { ContextRegistry, identity, assertReachableGeometry } = require('./harness.cjs');
const { isRenderedSettlement } = require('./harness.cjs');

test('native recreation expects visible production entries while retaining unrendered host adoption notes', () => {
  const { projectedEntryIds } = require('./harness.cjs');
  const { loadView, snapshot } = require('../helpers/tutorViewHarness');
  const view = loadView(), state = snapshot({entries:[
    {id:'learner',kind:'learner',status:'completed',text:'Reasoning',data:null,actions:[]},
    {id:'adoption',kind:'host',status:'completed',text:'Decision adopted',data:null,actions:[]},
    {id:'scope',kind:'host',status:'ready',text:'Prepare one change',data:{scopeSummary:'One assignment'},actions:[]},
    {id:'answer',kind:'assistant',status:'completed',text:'Explanation',data:null,actions:[]},
  ]});
  try {
    view.render(state);
    assert.deepEqual([...view.byId('timeline').children].map(e=>e.getAttribute('data-entry-id')),['learner','scope','answer']);
    assert.deepEqual(projectedEntryIds(state),['learner','scope','answer']);
    assert.equal(state.entries.length,4,'projection does not discard stored adoption history');
  } finally {view.dispose();}
});

test('settled host cannot authorize assertions against an older or different rendered turn', () => {
  const host = {sessionId:'session',generation:2,revision:20,turn:{status:'completed',learnerEntryId:'question',assistantEntryId:'answer'}};
  const rendered = {ack:{sessionId:'session',generation:2,revision:20},entryIds:['question','answer'],lastAssistantEntryId:'answer'};
  assert.equal(isRenderedSettlement(host,rendered),true);
  for (const change of [
    {ack:null}, {ack:{...rendered.ack,revision:19}}, {ack:{...rendered.ack,generation:1}}, {ack:{...rendered.ack,sessionId:'old'}},
    {entryIds:['prior-question','prior-answer'],lastAssistantEntryId:'prior-answer'}, {lastAssistantEntryId:'prior-answer'}, {entryIds:['answer']},
  ]) assert.equal(isRenderedSettlement(host,{...rendered,...change}),false);
  assert.equal(isRenderedSettlement({...host,turn:{...host.turn,status:'responding'}},rendered),false);
  assert.equal(isRenderedSettlement({...host,turn:{...host.turn,status:'cancelled',assistantEntryId:null}},{...rendered,entryIds:['question']}),true);
});
const add = (r, sessionId, id, uniqueId) => { r.event({method:'Runtime.executionContextCreated',sessionId,params:{context:{id,uniqueId}}}); return r.items.at(-1); };
for (const event of ['Runtime.executionContextDestroyed','Runtime.executionContextsCleared','Target.detachedFromTarget']) test(`selected context is invalid after ${event}`, () => {
  const r=new ContextRegistry(), old=add(r,'child',7,'old'), other=add(r,'other',7,'other'); r.select(old);
  r.event({method:event,sessionId:'child',params:{executionContextId:7,sessionId:'child'}});
  assert.equal(r.selected,null); assert.deepEqual(r.candidates(),[other]);
});
test('recreation excludes prior identity, handles numeric ID reuse, and cannot select a destroyed candidate', () => {
  const r=new ContextRegistry(), old=add(r,'child',7,'old'); r.select(old);
  assert.deepEqual(r.candidates(identity(old)),[]);
  r.event({method:'Runtime.executionContextsCleared',sessionId:'child',params:{}});
  const replacement=add(r,'child',7,'new'); assert.deepEqual(r.candidates(identity(old)),[replacement]);
  assert.throws(()=>r.select(old),/live/); r.select(replacement); assert.equal(r.selected,replacement);
});
test('detaching a parent target invalidates its nested webview context only', () => {
  const r=new ContextRegistry();
  r.event({method:'Target.attachedToTarget',sessionId:'outer',params:{sessionId:'inner'}});
  const inner=add(r,'inner',3,'nested'),other=add(r,'other',4,'independent');r.select(inner);
  r.event({method:'Target.detachedFromTarget',params:{sessionId:'outer'}});
  assert.equal(r.selected,null);assert.deepEqual(r.candidates(),[other]);
});
const native={outerWidth:1024,outerHeight:768};
const layout={width:243,height:292,ratio:2,scrollWidth:243,timeline:{height:100},composer:{bottom:245},primary:{height:28,bottom:288}};
test('same physical small window accepts reachable actual 243 CSS at 200% without claiming 280',()=>{
  assert.doesNotThrow(()=>assertReachableGeometry(layout,native,{physicalWidth:1024,physicalHeight:768,ratio:2}));
  assert.throws(()=>assertReachableGeometry(layout,native,{physicalWidth:1024,physicalHeight:768,ratio:2,width:280}));
});
test('zoom acceptance rejects offscreen composer, overflow, wrong zoom and changed physical bounds',()=>{
  for(const bad of [{...layout,composer:{bottom:400}},{...layout,scrollWidth:244},{...layout,ratio:1}]) assert.throws(()=>assertReachableGeometry(bad,native,{physicalWidth:1024,physicalHeight:768,ratio:2}));
  assert.throws(()=>assertReachableGeometry(layout,{outerWidth:1440,outerHeight:900},{physicalWidth:1024,physicalHeight:768,ratio:2}));
});
test('280 CSS at 200% in separately enlarged ordinary window is distinct evidence',()=>{
  assert.doesNotThrow(()=>assertReachableGeometry({...layout,width:280,scrollWidth:280},{outerWidth:1440,outerHeight:900},{physicalWidth:1440,physicalHeight:900,width:280,ratio:2}));
});
