# KAFE Neural Development Suite

This VS Code extension edits `.kf` programs with KAFE highlighting and snippets, runs saved programs in an interactive terminal, and provides a guided Tutor view. Open the view with **KAFE: Open Tutor**.

## Tutor setup and learning flow

1. Run **KAFE: Configure Provider Key** and enter your own DeepSeek API key. The extension stores it in VS Code SecretStorage. **KAFE: Clear Provider Key** deletes it from SecretStorage. The key is not placed in the webview or project files.
2. Open a `.kf` file in a workspace, enter a learning goal, edit and confirm the suggested milestones. Ask for a hint. The tutor starts with a hint and a concrete next step; you can explicitly ask for a direct answer, worked example, or repair.
3. Before **Send**, inspect the exact request context payload and its Included/Excluded source list. The active `.kf`, confirmed goal, latest learner-started Run result, relevant version-matched KAFE knowledge passages, and other visible `.kf` files in the same workspace may be included. Use **Remove** beside an optional file to exclude its content, then inspect the updated preview. The Send action transmits that reviewed payload directly from the extension host to DeepSeek. A changed draft needs a fresh preview.
4. To test your code, choose **KAFE: Run File** or press Ctrl+F5 (Cmd+F5 on macOS). Run is learner-started and interactive. Save a dirty file when prompted; cancelling leaves it unrun. Completed stdout, stderr, exit code, and runtime provenance appear as evidence in the Tutor view. A passing run or explanation does not certify understanding.
5. Ask explicitly for a repair when needed. A proposed change opens a native VS Code diff. **Reject** leaves the source unchanged; **Accept** applies it only if the reviewed document still matches its URI, version, and content hash. A changed buffer makes the proposal stale and prevents the edit.

Provider outages and missing keys do not stop editing or local Run. After a provider failure, **Retry** is a learner action and uses the same reviewed payload. Tutor progress stores only the confirmed goal, milestones, and completed checks in this workspace's VS Code state. It does not persist a conversation transcript, provider request, file contents, or API key. Use **KAFE: Clear Tutor Progress** or the view's **Clear progress** button to remove that summary; the provider key is separate.

## Runtime availability

The managed runtime is pinned to KAFE 0.1.0 and uv 0.11.3. Its release is currently marked unpublished, so **KAFE: Install Runtime** reports unavailable and downloads nothing. After publication, Setup asks for consent before the first download and verifies the release. The Tutor's local knowledge retrieval requires that managed runtime's matching knowledge pack; without it, preview fails closed. There is no workspace-document fallback.

Contributors can run KAFE from a checkout with `pyproject.toml`, `uv.lock`, `src/Kafe.py`, installed `uv`, and generated ANTLR parser files. Such Run evidence is labelled contributor mode with unavailable version fields; it is not represented as managed knowledge-pack evidence. See the [extension guide](../docs/extension/vscode.md) for contributor validation and privacy details.

| Managed runtime OS | Architecture |
| --- | --- |
| Windows | x64 |
| macOS | x64, arm64 |
| Linux | x64 |

Other platforms may use contributor mode if the checkout and tools are available. The extension does not silently download a runtime, execute model-requested code, or apply model-proposed edits.

## Local development

Open `kafe-vscode` in VS Code and press F5 for an Extension Development Host. Run `npm ci` and `npm test` from this folder to validate the unit and extension-host behavior; `npx vsce package` builds a local VSIX for inspection.
