# KAFE Neural Language Suite 2.1.0

Version 2.1.0 sends learner-started KAFE output exclusively to the local VS Code terminal. The Tutor retains bounded private execution evidence for requested diagnostic guidance, but it does not add Run cards or raw program output to the conversation. Its teaching policy supplies explanations and progressive hints without completing exercises for the learner.

The bundled reference catalogue now covers representative KafeMACHINE and KafeGESHA fixtures. The managed runtime installs the locked `extension` dependency extra, which includes Hugging Face `datasets`, `kagglehub`, Pillow, and `py7zr` while preserving the optional baseline used by interpreter tests.

## Runtime release

- GitHub tag: `kafe-runtime-v0.3.0`
- Source revision: `6ee33f742909f74a3d597379e713aedc3a5703b2`
- Archive: `kafe-runtime-0.3.0.zip`
- Archive SHA-256: `87414d8904e8d528378655827c8cf6247285edf6cbee80e24ae755dc938789ff`
- Sidecar: `kafe-runtime-0.3.0.manifest.json`
- Python requirement: 3.11 or newer

The runtime ZIP and sidecar were built twice from the same source revision and compared byte for byte. Both assets were uploaded before `releasePublished` was enabled in the extension manifest.

## Publication order

1. Build the runtime ZIP and sidecar from the pinned Git revision with `scripts/build-runtime-release.py`.
2. Publish both files under the matching GitHub release tag.
3. Verify the uploaded asset names, target revision, and GitHub SHA-256 digest.
4. Set `releasePublished` to `true` in `src/runtimeManifest.json`.
5. Build and inspect the VSIX with `vsce package`.
6. Install the VSIX locally with `code --install-extension <file> --force` and run a `.kf` file.
7. Publish that same verified VSIX to Visual Studio Marketplace.

This order matters because **KAFE: Install Runtime** refuses unpublished pinned assets. A VSIX published before its runtime release would install successfully but could not prepare KAFE for execution.
