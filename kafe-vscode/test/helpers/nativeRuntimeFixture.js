// Test-only in-memory pin: real activation and Setup must not download a release.
function pinUnpublishedRuntime(manifest) {
  if (!manifest?.runtime || typeof manifest.runtime.releasePublished !== 'boolean') {
    throw new TypeError('A runtime manifest with a published-release flag is required.');
  }
  const runtime = manifest.runtime, published = runtime.releasePublished;
  runtime.releasePublished = false;
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    runtime.releasePublished = published;
  };
}

module.exports = { pinUnpublishedRuntime };
