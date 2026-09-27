# VS Code extension and AI Tutor

The KAFE Neural Development Suite provides `.kf` language support, an interactive Run command, and a guided Tutor view in VS Code 1.96.0 or later. The managed runtime targets Windows x64, macOS x64/arm64, and Linux x64. Contributors on other platforms can use a prepared checkout.

## Open and run KAFE

Open a `.kf` file inside a trusted workspace. Choose **KAFE: Run File** or press Ctrl+F5 (Cmd+F5 on macOS). If the buffer is dirty, save it when prompted; cancelling does not start the process. Run uses an interactive terminal so you can provide input. A completed run supplies bounded stdout, stderr, exit code, and runtime provenance to the Tutor evidence panel. Only this learner action starts KAFE; a model tool call cannot start it. A successful run is useful evidence, not proof of understanding.

**KAFE: Install Runtime** is intended to install a pinned, verified KAFE 0.1.0 runtime and uv 0.11.3 into VS Code storage after explicit first-download confirmation. The pinned release is currently marked unpublished; Setup reports unavailable and downloads nothing. No alternate release is substituted. Contributor mode uses a checkout containing `pyproject.toml`, `uv.lock`, `src/Kafe.py`, and generated ANTLR parser files plus installed `uv`. Contributor Run evidence has null managed version fields and is labelled contributor mode.

## Configure and use the Tutor

1. Run **KAFE: Configure Provider Key**, enter your own DeepSeek key, and open **KAFE: Open Tutor**. The key stays in VS Code SecretStorage. **KAFE: Clear Provider Key** deletes it. Editing and local Run remain available when no key or connection exists.
2. Enter a learning goal, edit the proposed milestones, and confirm them. The Tutor starts with a hint and a concrete next step. Ask when you want a direct answer, worked example, or repair.
3. Type a message and inspect the exact request payload before **Send**. The source list marks each item Included or Excluded. It can include the confirmed goal/milestones, active `.kf` file, latest learner-started Run evidence, version-matched local KAFE knowledge passages, and other visible `.kf` files from the same workspace. Other visible files are optional: **Remove** excludes their contents and refreshes the payload. A changed draft needs a fresh preview. Send transmits the reviewed payload from the extension host directly to DeepSeek; there is no KAFE server relay or additional per-message approval step.
4. Ask explicitly for a repair if you want one. The Tutor prepares a native diff. **Reject** discards it without writing. **Accept** applies only the reviewed edit after checking source URI, document version, and content hash. If the buffer has changed, the stale proposal is discarded without a write.

In a regular VS Code installation, Tutor knowledge search requires the managed runtime's matching local `knowledge-pack`. In an **Extension Development Host** only, the Tutor can prepare a development pack from the extension checkout's parent KAFE repository. It copies Markdown from the six learner-guide sections, `.kf` examples in `docs/examples/`, and the two canonical grammar files into VS Code global storage. It records the pinned runtime and knowledge-pack versions and verifies a SHA-256 digest both when reusing the cache and when reading passages. The Tutor prefers an installed managed pack; Production and Test modes do not read the development checkout. A missing source section, incompatible version, or changed cache fails closed with a visible message. This local path does not publish or modify the runtime release.

Knowledge search uses the learner's exact message and confirmed learning goal/milestones. If a short syntax term such as `if` is asked about, matching language-reference passages are ranked ahead of ordinary prose. Review the resulting source list and exact payload before sending.

To try the local path, open the `kafe-vscode` folder in VS Code, start **Run KAFE Extension (Development Host)** with F5, then in the Extension Development Host open **KAFE: Open Tutor**. Enter a goal, confirm the milestones, type a question, and inspect the exact preview. A knowledge source label beginning **Development KAFE runtime 0.1.0 · knowledge pack 0.1.0** confirms the local source was used. Configure your DeepSeek key with **KAFE: Configure Provider Key** before pressing **Send** to request coaching. Preview is local and does not call the provider.

Model-visible context treats source comments and documents as untrusted data. The model may request only allowlisted reads, local knowledge search, latest run evidence, and proposal preparation. It cannot run a process or directly write a file. A provider outage exposes a learner-triggered **Retry** with the reviewed payload; no automatic retry occurs.

VS Code workspace state stores only the goal, milestone list, and completed checks. It does not save a chat transcript, source contents, provider request body, or key. **KAFE: Clear Tutor Progress** and the view's **Clear progress** button use the same summary-clear path. Clearing the provider key is separate.

## Contributor validation

From `kafe-vscode`, run:

```powershell
npm ci
npm test
npx vsce package
```

The extension tests use injected fake provider responses and documents. They do not contact DeepSeek or run KAFE. Inspect the resulting VSIX locally; do not install it into a regular VS Code profile or publish it as part of validation.

From the repository root, generate ANTLR 4.13.2 parser outputs from `src/` first when absent. Then run the locked Python gates described in [repository verification guidance](https://github.com/joshmessi10/KAFE-Reloaded/blob/main/.opencode/knowledge/verifications.md):

```powershell
$repo = (Get-Location).Path
uv audit --locked --preview-features audit
uv run --locked --group dev ruff check src tests
uv run --locked --group dev basedpyright
uv run --locked --group dev codespell
uv run --locked --group dev python scripts/check_quality_policy.py
uv run --locked --group dev pytest tests/test_quality_policy.py -q
uv run --locked --python 3.10 --group dev pytest tests/ -v "--cov=$repo/src" "--cov-config=$repo/pyproject.toml" --cov-report=term-missing --cov-fail-under=80
$env:NO_MKDOCS_2_WARNING = "1"
uv run --locked --python 3.10 --group docs --no-dev mkdocs build --strict
Remove-Item Env:\NO_MKDOCS_2_WARNING
```

See [Getting Started](../getting-started/installation.md) for parser generation and KAFE setup. These commands are local validation; they do not establish a hosted CI result.
The root codespell command skips generated `node_modules`, `.vscode-test`, and VSIX output while continuing to scan extension source, tests, and this guide.
