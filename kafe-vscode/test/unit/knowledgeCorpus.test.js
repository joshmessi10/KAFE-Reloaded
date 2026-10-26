const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { KNOWLEDGE_MANIFEST, collectKnowledgeCorpus, collectKnowledgeCorpusSync, MAX_FILE_BYTES } = require('../../src/tutor/KnowledgeCorpus');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kafe-corpus-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, content) => {
    const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content);
  };
  for (const section of KNOWLEDGE_MANIFEST.sections.filter(item => item.required)) write(`${section.source}/lesson.md`, `${section.target} lesson.\n`);
  write('src/Kafe_Grammar.g4', 'grammar Kafe;\n'); write('src/Kafe_Lexer.g4', 'lexer grammar Kafe;\n');
  write('docs/ejemplos/gesha/recurrent.md', '# GESHA recurrent tutorial\n');
  write('docs/ejemplos/gesha/recurrent.kf', 'show("tutorial");\n');
  write('docs/ejemplos/chart.svg', '<svg>presentation only</svg>');
  return { root, write };
}

const digest = entries => entries.map(entry => [entry.relative, createHash('sha256').update(entry.bytes).digest('hex')]);

test('bundled and development selectors admit identical bounded tutorial text and exclude assets', async t => {
  const f = fixture(t), sync = collectKnowledgeCorpusSync({ sourceRoot: f.root });
  assert.deepEqual(digest(await collectKnowledgeCorpus({ sourceRoot: f.root })), digest(sync));
  assert.ok(sync.some(entry => entry.relative === 'examples/tutorials/gesha/recurrent.kf'));
  assert.ok(sync.some(entry => entry.relative === 'examples/tutorials/gesha/recurrent.md'));
  assert.ok(!sync.some(entry => entry.relative.endsWith('.svg')));
  fs.rmSync(path.join(f.root, 'docs/ejemplos'), { recursive: true, force: true });
  assert.equal(collectKnowledgeCorpusSync({ sourceRoot: f.root }).length, 8, 'legacy six-section source remains valid');
});

test('corpus rejects unreviewed file types, oversized inputs and target collisions', t => {
  const f = fixture(t);
  f.write('docs/ejemplos/unreviewed.js', 'unsafe example');
  assert.throws(() => collectKnowledgeCorpusSync({ sourceRoot: f.root }), /unsupported/i);
  fs.unlinkSync(path.join(f.root, 'docs/ejemplos/unreviewed.js'));
  f.write('docs/ejemplos/large.md', 'x'.repeat(MAX_FILE_BYTES + 1));
  assert.throws(() => collectKnowledgeCorpusSync({ sourceRoot: f.root }), /size limit/i);
  fs.unlinkSync(path.join(f.root, 'docs/ejemplos/large.md'));
  f.write('docs/examples/tutorials/gesha/recurrent.kf', 'collision');
  assert.throws(() => collectKnowledgeCorpusSync({ sourceRoot: f.root }), /duplicate/i);
});

test('corpus refuses unsafe selection paths and real symbolic directories before reading bytes', t => {
  const f = fixture(t), manifest = structuredClone(KNOWLEDGE_MANIFEST);
  manifest.sections[0].source = 'docs/../outside';
  assert.throws(() => collectKnowledgeCorpusSync({ sourceRoot: f.root, manifest }), /unsafe/i);
  const outside = path.join(f.root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'private.md'), 'Outside reviewed source.');
  try { fs.symlinkSync(outside, path.join(f.root, 'docs/ejemplos/linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return t.skip('Directory links are unavailable on this host.');
    throw error;
  }
  assert.throws(() => collectKnowledgeCorpusSync({ sourceRoot: f.root }), /symbolic link/i);
});

test('future Python release selector matches shared JavaScript corpus paths and exact bytes', t => {
  const f = fixture(t);
  const builder = path.resolve(__dirname, '../../scripts/build-runtime-release.py');
  const manifest = path.resolve(__dirname, '../../reference/knowledge-corpus.json');
  const script = `import hashlib,importlib.util,json,sys\nfrom pathlib import Path\nspec=importlib.util.spec_from_file_location("builder",sys.argv[1])\nbuilder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)\nentries=builder.collect_knowledge_corpus(Path(sys.argv[2]),json.loads(Path(sys.argv[3]).read_text(encoding="utf-8")))\nprint(json.dumps([[name,hashlib.sha256(source.read_bytes()).hexdigest()] for name,source in entries]))`;
  const result = spawnSync(process.env.KAFE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-B', '-c', script, builder, f.root, manifest], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.deepEqual(JSON.parse(result.stdout), digest(collectKnowledgeCorpusSync({ sourceRoot: f.root })));
});

test('release assembly consumes only its staged source policy and preserves historical six-section layout', t => {
  const builder = path.resolve(__dirname, '../../scripts/build-runtime-release.py');
  const script = `import importlib.util,json,sys\nfrom pathlib import Path\nspec=importlib.util.spec_from_file_location("builder",sys.argv[1])\nbuilder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)\nstage=Path(sys.argv[2]);builder.assemble_knowledge_pack(stage)\nprint(json.dumps(sorted(path.relative_to(stage/"knowledge-pack").as_posix() for path in (stage/"knowledge-pack").rglob("*") if path.is_file())))`;
  const assemble = root => {
    const result = spawnSync(process.env.KAFE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-B', '-c', script, builder, root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return JSON.parse(result.stdout);
  };
  const legacy = fixture(t);
  const legacyFiles = assemble(legacy.root);
  assert.equal(legacyFiles.length, 8);
  assert.ok(!legacyFiles.some(name => name.startsWith('examples/tutorials/')));
  const current = fixture(t);
  current.write('kafe-vscode/reference/knowledge-corpus.json', JSON.stringify(KNOWLEDGE_MANIFEST));
  const currentFiles = assemble(current.root);
  assert.equal(currentFiles.length, 10);
  assert.ok(currentFiles.includes('examples/tutorials/gesha/recurrent.kf'));
  assert.ok(!currentFiles.some(name => name.endsWith('.svg')));
});
