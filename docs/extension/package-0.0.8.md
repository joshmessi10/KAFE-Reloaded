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
- Extension SHA-256: `12b5300feb6d296a7340fb56aa942bd1d406ba4006515101fed7ed3781a4d58b`.
- Runtime: `kafe-vscode/release/kafe-runtime-0.2.0.zip`.
- Runtime sidecar: `kafe-vscode/release/kafe-runtime-0.2.0.manifest.json`.
- Runtime SHA-256: `e8d56dcd6bf429fb08c10c47c3775bcfd73dc889aed2f564fcaf260055957291`.
- Runtime source: `8441cec35ffa8cf76e2595313d77256f118e5175`.
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
- The dependency audit passes after raising the supported baseline to Python 3.11
  and resolving Pillow 13.0.0 and the corrected certifi release.

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
