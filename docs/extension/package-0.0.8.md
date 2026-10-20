# Extension 0.0.8 packaging report

## Integration

`feature/vsc-extension` incorporates `integration/Kafe_Gesha_Clustering_v2` at
`b955ba606b051debcdc291e58acb8a25fa8390c8`. Interpreter sources match that branch.
Conflicting language/library documentation, examples and Python dependencies use
the integration versions. The existing Tutor implementation is preserved.

The extension version is 0.0.8. Its reviewed fixture catalogue uses the renamed
English test directories, and its bundled references have been regenerated.
Local `.kf` programs and obsolete `bin/` interpreter builds are excluded from the
VSIX. Existing untracked learner files are preserved.

## Artifact

- Extension: `kafe-vscode/kafe-neural-suite-0.0.8.vsix`.
- Extension SHA-256: `7508a5fd07201df5e04854e1edb730c9e18ce8afced561982557e03eef2b3e6a`.
- Runtime: `kafe-vscode/release/kafe-runtime-0.2.0.zip`.
- Runtime sidecar: `kafe-vscode/release/kafe-runtime-0.2.0.manifest.json`.
- Runtime SHA-256: `97f5ae5248b992b1f03f650b847e90728ab8a8fcbbff37a8927da9a793309f5c`.
- Runtime source: `b955ba606b051debcdc291e58acb8a25fa8390c8`.
- Tutor assets, runtime manager, runtime manifest and production dependencies pass
  `node test/verify-vsix.js`.
- No Marketplace publication, GitHub release or remote push was performed.

## Validation

- Extension unit tests: 693 passed.
- Reference freshness check: passed.
- Reviewed reference execution: 21 passed against the pinned runtime revision.
- Integrated Python suite: 760 passed, 4 skipped.
- Integrated coverage gate: 85.70%, above the required 80%.
- Tutor Python tests after import formatting: 15 passed.
- Ruff, basedpyright, tracked-file codespell and quality-policy checks: passed.
- ANTLR 4.13.2 parser regenerated locally; generated files are ignored.
- Strict MkDocs build: passed after fixing two extension handoff links.
- VS Code host tests: unavailable locally because the existing configuration
  requires cached Windows VS Code 1.96.0 and PowerShell; this machine is macOS.
  The Windows CI job must still pass.
- Browser layout tests were not run.
- The dependency audit remains a release blocker for Python 3.10: Pillow 12.3.0
  has nine reported vulnerabilities, while the fixed Pillow 13.0.0 release does
  not support Python 3.10. Certifi was updated to its fixed release. The managed
  runtime installs with `--no-dev`, so Pillow is not installed during normal KAFE
  runtime setup, but the repository-wide release gate is still not clean.

## Publication order

The VSIX contains the language support and Tutor. On first setup it downloads the
separately published, checksum-pinned KAFE 0.2.0 runtime and uv 0.11.3, creates an
isolated environment in VS Code global storage, and installs the locked runtime
dependencies. This replaces the old VSIX behavior that bundled a stale interpreter
and invoked ambient `pip`.

Publish the runtime archive and sidecar first under GitHub release tag
`kafe-runtime-v0.2.0`, using their exact filenames. Publish the Marketplace VSIX
only after both URLs work. A clean-profile install/run remains pending until those
assets are available, as do the Windows Extension Host CI checks.
