const assert = require('node:assert/strict');
const test = require('node:test');
const { ConversationStore, CONVERSATIONS_KEY, LIMITS, normalizeContent, exportConversation,
  conversationFilename } = require('../../src/tutor/ConversationStore');

const DATE = '2026-10-25T12:00:00.000Z';
const entry = (id, kind = 'assistant', text = 'A Tutor answer', overrides = {}) =>
  ({ id, kind, text, status: 'completed', data: null, actions: [], ...overrides });
const pair = (id = 'pair') => ({ id, learnerText: 'My question', assistantText: 'A Tutor answer',
  dependencies: { fileUris: ['file:///workspace/lesson.kf'], knowledgeLineage: 'knowledge-v1' } });
const content = overrides => ({ draft: 'My next question', entries: [entry('answer')], historyPairs: [pair()],
  preferences: { mode: 'guided' }, ...overrides });
const record = (id = 'chat', overrides = {}) => ({ id, title: 'A lesson', createdAt: DATE, updatedAt: DATE,
  content: content(), ...overrides });
const archive = (conversations = [record()], activeId = conversations[0]?.id ?? null) => ({ activeId, conversations });

function fixture(initial) {
  const values = new Map(initial === undefined ? [] : [[CONVERSATIONS_KEY, initial]]), writes = [];
  const workspaceState = { get: key => values.get(key), update: async (key, value) => {
    writes.push(structuredClone(value)); values.set(key, structuredClone(value));
  } };
  return { store: new ConversationStore({ workspaceState }), workspaceState, values, writes };
}

test('archive round trip and export preserve bilingual provider explanation and quoted certification exactly', async () => {
  const text = 'A passing run does not prove you understand KAFE.\nUna lista conserva el orden.\n\n```kafe\nshow("You have mastered KAFE")\n```\nThe quoted string is data, not an assessment.';
  const value = archive([record('retained', { content: content({ entries: [entry('answer', 'assistant', text)], historyPairs: [{ ...pair(), assistantText: text }] }) })]);
  const f = fixture(); await f.store.save(value);
  const restored = f.store.load().conversations[0];
  assert.equal(restored.content.entries[0].text, text);
  assert.equal(restored.content.historyPairs[0].assistantText, text);
  assert.equal(JSON.parse(exportConversation(restored)).conversation.entries[0].text, text);
  assert.deepEqual(restored.content.entries[0].actions, []);
});

test('empty and unavailable storage start safely and unavailable storage retains an isolated memory archive', async () => {
  assert.deepEqual(fixture().store.load(), { activeId: null, conversations: [] });
  const first = new ConversationStore({ workspaceState: null }), second = new ConversationStore();
  await first.save(archive());
  assert.deepEqual(first.load(), archive());
  assert.deepEqual(second.load(), { activeId: null, conversations: [] });
});

test('workspace archive round trips exact Unicode drafts, transcript, dependencies and preferences without aliases', async () => {
  const f = fixture(), input = archive([record('first', { title: 'Café ☕ 日本語', content: content({
    draft: '¿Qué sigue?\n🌱', entries: [entry('answer', 'assistant', '```kf\nshow("☕");\n```\r\n')],
    preferences: { mode: 'paused' },
  }) }), record('second')], 'second');
  const expected = structuredClone(input);
  const saving = f.store.save(input); input.conversations[0].title = 'Later mutation'; await saving;
  assert.deepEqual(f.store.load(), expected);
  assert.equal(f.values.get(CONVERSATIONS_KEY).schemaVersion, 2);
  const restored = f.store.load(); restored.conversations[0].content.entries[0].text = 'Mutated';
  assert.deepEqual(f.store.load(), expected);
  assert.deepEqual(new ConversationStore({ workspaceState: f.workspaceState }).load(), expected);
  assert.deepEqual(fixture().store.load(), { activeId: null, conversations: [] });
});

test('normalization retains safe visible summaries and removes capabilities and private request/source/evidence data', () => {
  const checkpoint = { kind: 'implementation', name: 'A list', learnerProposalSummary: 'Use a list.',
    tutorProposedAdditions: ['Check an empty list.'], scopeSummary: 'Explain the loop.',
    tradeoffs: ['One pass.'], unresolvedChoices: [], sourceIds: ['private-source'], priorDecisionIds: ['grant'],
    request: { secret: 'PRIVATE REQUEST' } };
  const value = normalizeContent(content({ entries: [entry('decision', 'checkpoint', 'Discuss the design.', {
    status: 'ready', actions: [{ id: 'private-capability', type: 'runFile', args: { targetUri: 'file:///private' } }],
    data: { checkpoint, disposition: 'proposed', grounding: 'source-linked-proposal', targetUri: 'file:///private',
      request: { secret: 'PRIVATE REQUEST' }, sourceSnapshot: 'PRIVATE SOURCE', stdout: 'PRIVATE OUTPUT' },
  }), entry('host', 'host', 'Prepare one change.', { data: { scopeSummary: 'Only explain the loop.', targetUri: 'file:///private' } }),
  entry('run', 'run', 'Run finished.', { data: { stdout: 'PRIVATE OUTPUT', sourceUri: 'file:///private', exitCode: 0 } })],
  request: 'PRIVATE REQUEST', actionEvidence: 'PRIVATE EVIDENCE' }));
  assert.deepEqual(value.entries[0].actions, []);
  assert.deepEqual(value.entries[0].data.checkpoint, { kind: 'implementation', name: 'A list',
    learnerProposalSummary: 'Use a list.', tutorProposedAdditions: ['Check an empty list.'],
    scopeSummary: 'Explain the loop.', tradeoffs: ['One pass.'], unresolvedChoices: [] });
  assert.deepEqual(value.entries[1].data, { scopeSummary: 'Only explain the loop.' });
  assert.equal(value.entries[2].data, null);
  assert.doesNotMatch(JSON.stringify(value.entries), /PRIVATE|private|targetUri|sourceIds|priorDecisionIds|capability/);
  assert.deepEqual(value.historyPairs, [pair()]);
});

test('normalization preserves partial response status without mutating its live source', () => {
  const value = content({ entries: [entry('partial', 'assistant', 'Still thinking…', { status: 'responding' })] });
  assert.equal(normalizeContent(value).entries[0].status, 'responding');
  assert.equal(value.entries[0].status, 'responding');
});

test('malformed existing archive is reported without writing or silently replacing its data', () => {
  const valid = { schemaVersion: 2, ...archive() };
  const invalid = [null, [], {}, { ...valid, schemaVersion: 3 }, { ...valid, activeId: 'missing' },
    { ...valid, conversations: [record(), record()] }, { ...valid, conversations: [record('bad', { createdAt: 'yesterday' })] },
    { ...valid, conversations: [record('bad', { title: '' })] }, { ...valid, secret: 'unexpected data' },
    { ...valid, conversations: [record('bad', { content: content({ request: 'private' }) })] }];
  for (const saved of invalid) {
    const f = fixture(saved);
    assert.throws(() => f.store.load(), /conversation|archive/i);
    assert.equal(f.writes.length, 0);
    assert.deepEqual(f.values.get(CONVERSATIONS_KEY), saved);
  }
});

test('invalid required content, duplicate identities and malformed histories cannot reach storage', async () => {
  const invalid = [
    content({ draft: null }), content({ entries: [entry('same'), entry('same')] }),
    content({ entries: [entry('a', 'system')] }), content({ entries: [entry('a', 'assistant', null)] }),
    content({ historyPairs: [pair(), pair()] }), content({ historyPairs: [{ ...pair(), dependencies: { fileUris: ['https://example.com'], knowledgeLineage: null } }] }),
    content({ preferences: { mode: 'guided', level: 'mastered' } }),
    content({ entries: [entry('a', 'checkpoint', '', { data: { checkpoint: { tradeoffs: [5] } } })] }),
  ];
  for (const value of invalid) {
    const f = fixture();
    await assert.rejects(f.store.save(archive([record('bad', { content: value })])), /Invalid|Duplicate|limit/);
    assert.equal(f.writes.length, 0);
  }
});

test('writes serialize snapshots and expose a failed update while allowing a later explicit retry', async () => {
  const f = fixture(); let release, reject, started = [];
  f.workspaceState.update = (key, value) => {
    started.push(value.activeId);
    return new Promise((resolve, fail) => { release = () => { f.values.set(key, value); resolve(); }; reject = fail; });
  };
  const first = f.store.save(archive([record('first')]));
  const failed = assert.rejects(first, /disk unavailable/);
  const next = f.store.save(archive([record('second')]));
  await Promise.resolve();
  assert.deepEqual(started, ['first']);
  reject(new Error('disk unavailable')); await failed;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, ['first', 'second']);
  release(); await next;
  assert.equal(f.store.load().activeId, 'second');
});

test('sparse arrays cannot create archives that become invalid after JSON serialization', async () => {
  const f = fixture();
  const sparse = Array(1);
  for (const value of [archive(sparse), archive([record('bad', { content: content({ entries: sparse }) })]),
    archive([record('bad', { content: content({ historyPairs: sparse }) })]),
    archive([record('bad', { content: content({ historyPairs: [{ ...pair(), dependencies: { fileUris: sparse, knowledgeLineage: null } }] }) })]),
    archive([record('bad', { content: content({ entries: [entry('a', 'checkpoint', '', { data: { checkpoint: { tradeoffs: sparse } } })] }) })])]) {
    await assert.rejects(f.store.save(value), /Invalid conversation archive/);
  }
  assert.equal(f.writes.length, 0);
  await f.store.save(archive());
  f.values.set(CONVERSATIONS_KEY, JSON.parse(JSON.stringify(f.values.get(CONVERSATIONS_KEY))));
  assert.deepEqual(f.store.load(), archive());
});

test('archive count and byte limits reject additions without eviction or a write', async () => {
  const f = fixture(); await f.store.save(archive()); const before = f.store.load();
  await assert.rejects(f.store.save(archive(Array.from({ length: LIMITS.conversations + 1 }, (_, i) => record(`chat-${i}`)))), /limit/i);
  await assert.rejects(f.store.save(archive([record('large', { content: content({ draft: 'x'.repeat(LIMITS.contentBytes + 1) }) })])), /limit/i);
  const large = content({ draft: 'x'.repeat(Math.floor(LIMITS.contentBytes / 2)), entries: [], historyPairs: [] });
  await assert.rejects(f.store.save(archive(Array.from({ length: 10 }, (_, i) => record(`large-${i}`, { content: large })))), /limit/i);
  assert.deepEqual(f.store.load(), before);
  assert.equal(f.writes.length, 1);
});

test('entry and history count limits are explicit and never silently trim transcripts', () => {
  assert.throws(() => normalizeContent(content({ entries: Array.from({ length: LIMITS.entries + 1 }, (_, i) => entry(`entry-${i}`)) })), /limit/i);
  assert.throws(() => normalizeContent(content({ historyPairs: Array.from({ length: LIMITS.historyPairs + 1 }, (_, i) => pair(`pair-${i}`)) })), /limit/i);
});

test('selected JSON export contains the complete visible transcript beyond model history and exact code/Unicode', () => {
  const text = '```kf\nshow("Café ☕ 日本語");\n```\r\n';
  const selected = record('selected', { title: 'Café ☕', content: content({
    entries: [...Array.from({ length: 24 }, (_, i) => entry(`entry-${i}`, i % 2 ? 'assistant' : 'learner', `${i}\n${text}`)),
      entry('hidden', 'host', 'INTERNAL HOST MESSAGE'),
      entry('visible', 'host', 'An agreed scope.', { data: { scopeSummary: 'Explain the loop.', targetUri: 'file:///private' } }),
      entry('failure', 'error', 'Response unavailable.', { data: { code: 'auth' } })],
  }) });
  const encoded = exportConversation(selected), exported = JSON.parse(encoded);
  assert.equal(exported.format, 'kafe-tutor-conversation'); assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.conversation.id, 'selected'); assert.equal(exported.conversation.title, 'Café ☕');
  assert.equal(exported.conversation.entries.length, 26);
  assert.equal(exported.conversation.entries[23].text, `23\n${text}`);
  assert.deepEqual(exported.conversation.entries[24].data, { scopeSummary: 'Explain the loop.' });
  assert.equal(exported.conversation.entries[25].data, null);
  assert.equal(encoded.endsWith('\n'), true);
  assert.doesNotMatch(encoded, /historyPairs|fileUris|knowledgeLineage|sourceUri|targetUri|preferences|draft|actions|INTERNAL|"code"/);
  assert.equal(selected.content.entries.length, 27);
});

test('public export and filename remain available when omitted private content exceeds the archival limit', () => {
  const oversized = record('recoverable', { content: content({
    draft: 'x'.repeat(LIMITS.textBytes), historyPairs: Array.from({ length: 3 }, (_, i) => ({ ...pair(`pair-${i}`),
      learnerText: 'x'.repeat(1024 * 1024) })),
  }) });
  assert.throws(() => normalizeContent(oversized.content), /limit/i);
  assert.equal(JSON.parse(exportConversation(oversized)).conversation.entries[0].text, 'A Tutor answer');
  assert.match(conversationFilename(oversized), /recoverable\.json$/);
  const publicOnly = { ...oversized, content: { entries: oversized.content.entries } };
  assert.deepEqual(JSON.parse(exportConversation(publicOnly)), JSON.parse(exportConversation(oversized)));
  assert.throws(() => exportConversation({ ...publicOnly, content: { entries: [entry('a', 'assistant', null)] } }), /Invalid/);
  const huge = { ...publicOnly, content: { entries: Array.from({ length: 10 }, (_, i) => entry(`entry-${i}`, 'assistant', 'x'.repeat(LIMITS.textBytes))) } };
  assert.throws(() => exportConversation(huge), /export size limit/i);
});

test('conversation filenames preserve useful Unicode while rejecting path separators and Windows filename hazards', () => {
  for (const title of ['.. /<>:"\\|?* Café ☕', 'CON', '...', '日本語'.repeat(60)]) {
    const filename = conversationFilename(record('safe-id', { title }));
    assert.equal(filename.endsWith('.json'), true);
    assert.doesNotMatch(filename, /[<>:"/\\|?*\x00-\x1f]/);
    assert.ok(filename.length <= 220);
    assert.equal(filename.endsWith(' .json'), false);
  }
  assert.match(conversationFilename(record('safe-id', { title: 'Café ☕' })), /Café ☕/);
  assert.notEqual(conversationFilename(record('first')), conversationFilename(record('second')));
});

for (const level of ['beginner', 'intermediate', 'expert']) for (const mode of ['guided', 'paused']) {
  test(`legacy ${level}/${mode} migrates detached with no load writes and a retryable v2 save`, async () => {
    const legacy = { schemaVersion: 1, ...archive([
      record('first', { title: 'Café ☕ 日本語', updatedAt: '2026-10-26T13:14:15.123Z', content: content({ draft: '¿Qué sigue?\n🌱', preferences: { mode, level }, entries: [entry('answer', 'assistant', 'Expert was a historical label.\r\n☕')] }) }),
      record('selected', { content: content({ preferences: { mode: 'paused', level: 'expert' } }) }),
    ], 'selected') };
    const original = structuredClone(legacy), f = fixture(legacy), expected = structuredClone(legacy);
    delete expected.schemaVersion; for (const record of expected.conversations) delete record.content.preferences.level;
    const loaded = f.store.load(); assert.deepEqual(loaded, expected); assert.deepEqual(legacy, original);
    const { teachingInstructions } = require('../../src/tutor/TeachingPolicy');
    const { LearningSession } = require('../../src/tutor/LearningSession');
    const fresh = new LearningSession(); fresh.setPreferences({ mode });
    assert.equal(teachingInstructions(loaded.conversations[0].content.preferences), teachingInstructions(fresh.snapshot().preferences));
    assert.equal(f.writes.length, 0); assert.deepEqual(f.values.get(CONVERSATIONS_KEY), original);
    assert.equal(JSON.parse(exportConversation(loaded.conversations[0])).schemaVersion, 1);
    loaded.conversations[0].content.draft = 'mutated'; assert.deepEqual(f.store.load(), expected);
    const update = f.workspaceState.update;
    f.workspaceState.update = async () => { throw new Error('disk unavailable'); };
    await assert.rejects(f.store.save(expected), /disk unavailable/);
    assert.deepEqual(f.values.get(CONVERSATIONS_KEY), original);
    assert.deepEqual(new ConversationStore({ workspaceState: f.workspaceState }).load(), expected);
    f.workspaceState.update = update; await f.store.save(expected);
    assert.deepEqual(f.values.get(CONVERSATIONS_KEY), { schemaVersion: 2, ...expected });
    assert.deepEqual(new ConversationStore({ workspaceState: f.workspaceState }).load(), expected);
  });
}
for (const schemaVersion of [1, 2]) test(`v${schemaVersion} rejects corrupt or unknown fields before conversion`, () => {
  const valid = { schemaVersion, ...archive() };
  if (schemaVersion === 1) valid.conversations[0].content.preferences.level = 'beginner';
  const corruptions = [
    v => { v.extra = true; }, v => { v.conversations[0].extra = true; }, v => { v.conversations[0].content.extra = true; },
    v => { v.conversations[0].content.preferences.extra = true; }, v => { v.conversations[0].content.preferences.level = 'invalid'; },
    v => { delete v.conversations[0].content.preferences.mode; },
    v => { if (schemaVersion === 1) delete v.conversations[0].content.preferences.level; else v.conversations[0].content.preferences.level = 'expert'; },
    v => { v.conversations[0].content.entries[0].actions = [{ id: 'grant' }]; },
    v => { v.conversations[0].content.historyPairs[0].dependencies.extra = true; },
    v => { v.conversations[0].createdAt = '2026-02-30T12:00:00.000Z'; },
    v => { v.conversations[0].content.entries[0].data = { private: true }; },
    v => { v.conversations[0].content.draft = 'x'.repeat(LIMITS.textBytes + 1); },
    v => { v.conversations = Array.from({ length: LIMITS.conversations + 1 }, (_, i) => record(`chat-${i}`)); },
    v => { v.conversations[0].content.entries = Array(LIMITS.entries + 1).fill(entry('same')); },
    v => { v.conversations[0].content.historyPairs = Array(LIMITS.historyPairs + 1).fill(pair()); },
  ];
  for (const corrupt of corruptions) {
    const saved = structuredClone(valid); corrupt(saved); const original = structuredClone(saved), f = fixture(saved);
    assert.throws(() => f.store.load(), /Invalid|limit/); assert.equal(f.writes.length, 0); assert.deepEqual(f.values.get(CONVERSATIONS_KEY), original);
  }
});

for (const schemaVersion of [1, 2]) test(`v${schemaVersion} enforces content and archive bytes before migration`, () => {
  const large = content({ draft: 'x'.repeat(LIMITS.textBytes), entries: [entry('large', 'assistant', 'x'.repeat(LIMITS.textBytes))], historyPairs: [] });
  if (schemaVersion === 1) large.preferences.level = 'expert';
  const oversizedContent = { schemaVersion, ...archive([record('large', { content: large })]) };
  const draftOnly = { ...large, entries: [] };
  const oversizedArchive = { schemaVersion, ...archive(Array.from({ length: 9 }, (_, i) => record(`large-${i}`, { content: draftOnly }))) };
  for (const value of [oversizedContent, oversizedArchive]) {
    const f = fixture(value); assert.throws(() => f.store.load(), /size limit/);
    assert.equal(f.writes.length, 0); assert.equal(f.values.get(CONVERSATIONS_KEY), value);
  }
});
