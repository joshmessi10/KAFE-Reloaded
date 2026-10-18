const { createHash } = require('node:crypto');
const bundled = require('./kafeReferences.json');
const manifest = require('../runtimeManifest.json');

const digest = value => createHash('sha256').update(value).digest('hex');
const tokens = text => text.replace(/([a-z])([A-Z])/g, '$1 $2').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2);
const ignored = new Set(['the', 'and', 'with', 'for', 'can', 'code', 'kafe', 'write', 'please', 'una', 'para', 'con', 'que', 'los', 'las', 'del', 'haz']);

function createKafeReferences(bundle = bundled, runtime = manifest.runtime) {
  const { contentSha256, ...body } = bundle;
  if (body.schemaVersion !== 1 || body.referenceVersion !== 1 ||
    body.runtimeVersion !== runtime.version || body.runtimeSourceRevision !== runtime.sourceRevision ||
    !/^[a-f0-9]{64}$/.test(body.sourceFingerprint || '') || !/^[a-f0-9]{64}$/.test(body.fixtureFingerprint || '') ||
    !/^[a-f0-9]{64}$/.test(body.runtimeSourceFingerprint || '') ||
    contentSha256 !== digest(JSON.stringify(body)) || typeof body.essentials !== 'string' ||
    Buffer.byteLength(body.essentials, 'utf8') > 12 * 1024 || !Array.isArray(body.fixtures) || body.fixtures.length > 2000) {
    throw Error('Bundled KAFE reference integrity or version mismatch');
  }
  const seen = new Set();
  for (const fixture of body.fixtures) {
    if (!/^tests\/(?!.*(?:\\|\.\.\/))[^\u0000-\u001f]+\.kf$/.test(fixture.path || '') || seen.has(fixture.path) ||
      !['valid', 'expected-error'].includes(fixture.kind) ||
      !['code', 'input', 'expectedOutput'].every(key => typeof fixture[key] === 'string' && Buffer.byteLength(fixture[key], 'utf8') <= 64 * 1024) ||
      fixture.expectedStream !== (fixture.kind === 'expected-error' ? 'stderr' : 'stdout') ||
      fixture.expectedExitCode !== (fixture.kind === 'expected-error' ? 1 : 0)) {
      throw Error('Invalid bundled KAFE fixture');
    }
    seen.add(fixture.path);
  }
  const provenance = Object.freeze({ referenceVersion: body.referenceVersion, runtimeVersion: body.runtimeVersion,
    runtimeSourceRevision: body.runtimeSourceRevision, sourceFingerprint: body.sourceFingerprint,
    runtimeSourceFingerprint: body.runtimeSourceFingerprint, contentSha256,
    evidence: 'repository expectations; not a current program execution', license: 'GPL-3.0 (repository fixture sources)' });
  const essentials = Object.freeze({ id: 'kafe-essentials', category: 'language-reference', label: `Bundled KAFE ${body.runtimeVersion} fundamentals`,
    text: body.essentials, provenance });
  const fixtures = structuredClone(body.fixtures).map(fixture => ({ fixture,
    names: new Set(tokens(fixture.path)), words: new Set(tokens(`${fixture.path}\n${fixture.code}`)) }));
  return Object.freeze({
    essentials,
    select(query) {
      const terms = [...new Set(tokens(String(query).slice(0, 4000)).filter(word => !ignored.has(word)))].slice(0, 48);
      const ranked = fixtures.map(item => ({ ...item, score: terms.reduce((score, term) => score + (item.names.has(term) ? 4 : item.words.has(term) ? 1 : 0), 0) }))
        .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.fixture.path.localeCompare(b.fixture.path, 'en'));
      const selected = []; let bytes = 0;
      for (const { fixture } of ranked) {
        const text = 'Repository expectations, not results for the learner\'s current program.\n' + JSON.stringify(fixture);
        const size = Buffer.byteLength(text, 'utf8');
        if (size > 6 * 1024 || bytes + size > 12 * 1024) continue;
        selected.push({ id: `fixture:${fixture.path}`, category: 'test-reference', label: `Repository ${fixture.kind} fixture: ${fixture.path}`,
          text, provenance: { ...provenance, path: fixture.path } });
        bytes += size;
        if (selected.length === 3) break;
      }
      return selected;
    },
  });
}
module.exports = { createKafeReferences };
