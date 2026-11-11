# KAFE VS Code extension 2.0.2

Version 2.0.2 fixes managed runtime reuse after the first KAFE execution. Python bytecode caches below `src/` and KAFE's `src/stderr.txt` diagnostic are recognized as runtime-generated files. Packaged source and configuration files remain type-checked and SHA-256 verified.

Managed execution now uses `python -B` to prevent new bytecode caches. Existing affected installations recover after the extension update without downloading runtime 0.2.0 again.

The release keeps the published runtime contract unchanged:

- Runtime: `0.2.0`
- Python: `>=3.11`
- Runtime archive SHA-256: `e8d56dcd6bf429fb08c10c47c3775bcfd73dc889aed2f564fcaf260055957291`
- macOS targets: Intel x64 and Apple Silicon arm64

Validation includes the complete extension unit suite, VSIX content inspection, and two consecutive executions against the installed macOS arm64 managed runtime.

Package: `kafe-neural-suite-2.0.2.vsix`  
SHA-256: `a219eb6800e2b6135fa996de1dbe602dfe1e46eab650714cff9ce3c225065438`
