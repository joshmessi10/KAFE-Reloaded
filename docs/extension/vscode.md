# VS Code extension and AI Tutor

The extension provides KAFE `.kf` highlighting, snippets, learner-started execution and a Tutor conversation in VS Code 1.96.0 or later. Open **KAFE: Open Tutor**.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. One answer streams in place. **Stop** replaces Send during a response while the next draft stays editable. **Retry** uses the original question and current authorized context, preserves the next draft and does not duplicate the learner message. Key configuration never sends automatically.

The included whole-file indicators identify the active eligible `.kf` and selected optional files. **Add context** lists visible same-workspace `.kf` metadata without reading optional contents; explicit inclusion permits capture at Send. Indicators reveal their named file natively; optional indicators can be removed. Accessible names and tooltips retain full identities, including duplicate basenames. Optional selection survives becoming active and closing its editors. Source/trust/knowledge changes fence admission and invalidate dependent authority. Restricted Mode permits message-only learning while excluding workspace files, edits and Run.

## Guided learning and permissions

Concept questions can receive direct explanations. For meaningful design decisions, the Tutor asks for learner reasoning, discusses requested options and may propose a Design or Implementation checkpoint. Guided learning defaults to Normal frequency, open-ended reasoning, AI preparation and unknown familiarity. **Guided learning** beside the composer or **KAFE: Learning Preferences** opens native, optional memory-only preferences, including pause/resume. Changes during a response queue until settlement. Ordinary typed discussion remains available; no onboarding wizard is required.

A checkpoint's learner-proposal summary is explicitly an unconfirmed Tutor summary. **Confirm and continue** records adoption and continues discussion; it does not establish learner authorship, understanding or mastery. **Discuss** and **Skip** confer no preparation grant. Waiting for reasoning is settled, with no work spinner or Stop.

**Implement this step** (or **Prepare change** while paused) authorizes one proposal for the exact displayed target and scope. Direct requests still require a fresh displayed scope click. A missing key, stopped attempt or failed preparation does not preserve permission for automatic retry. Fresh authorization is required. Native **Review change**, **Apply**, **Dismiss**, and a separate explicit **Run** remain distinct actions.

## Credentials and native actions

Use **KAFE: Configure Provider Key** for the masked native DeepSeek input. The key stays in VS Code SecretStorage. Missing-key recovery preserves the draft; successful configuration never resends. **KAFE: Clear Provider Key** deletes that key from SecretStorage. Never put credentials in chat.

**Review change** opens the native diff. **Apply** requires reviewed current proposal identity and authorization of the target plus its complete dependencies, version and content hash. Source edits/deletion, revoked trust or reset invalidate stale proposals. Applying never runs the program. Provider tools cannot apply edits or execute programs.

**Run main.kf** identifies the saved-file target. **KAFE: Run File** and Ctrl+F5 (Cmd+F5 on macOS) require trust and a saved eligible file. Cancelled saving leaves it unrun. Input/output use the native terminal. Stop cancels the provider independently of Run; New conversation does not terminate an independently running process.

Run evidence distinguishes host-observed launch/completion/current saved-source comparisons from current editor comparisons. Missing comparisons and null exit outcomes remain unknown. Equal observed boundary hashes do not prove exact interpreter-read bytes, imported-file bytes or correctness. Zero exit is an exit result; **Exact executed bytes: unknown** and **Correctness: not established** remain explicit. Subsequent authorized explanations may use staged/applied/Run facts while retaining these limits.

## Retention and limits

Conversation, drafts, selection, learning preferences/checkpoints/observations, requests and action/output evidence stay in host memory. View recreation retains the same owner. **New conversation** and host restart clear this new state and restore learning defaults. Credentials and legacy progress remain independent. Legacy progress is neither imported into learning nor transmitted to the provider. **KAFE: Clear Tutor Progress** requests separate native confirmation and preserves live chat and credentials.

Follow-ups retain at most eight eligible completed whole learner/assistant pairs within 32 KiB UTF-8. Failed/interrupted pairs are excluded; removed or changed source/knowledge grounding omits dependent context without reviving it through learning records. Source snapshots are limited to 64 KiB each and Run output to 1 MiB. The five permitted tools retain four calls per response and four rounds per turn. Checkpoints are bounded to 16 KiB each; teaching retains at most 32 decisions, 32 observations and 64 KiB total state. Exhaustion rejects the admission without silently evicting pending records; New conversation clears this state. Host action evidence retains at most 32 whole records, 8 KiB each and 64 KiB total/projection text. Old discussion and adopted decisions are not current execution proof.

Transcripts, credentials, source bytes, requests, checkpoint text and raw transport errors are not persisted or added to Tutor diagnostics.

## Runtime and knowledge

The managed runtime is pinned to KAFE 0.1.0 and uv 0.11.3. Its release remains unpublished, so **KAFE: Install Runtime** reports unavailable and downloads nothing. When a release is published, setup requires explicit consent before its first download. Ordinary conversation with a configured provider can proceed without an executable runtime or knowledge pack; requests disclose unavailable knowledge. Available validated cached knowledge can be used independently of executable readiness. Invalid or changed knowledge must never be represented as valid grounding.

Contributor Run can use a prepared KAFE checkout and installed tools. An Extension Development Host can use an explicitly validated development knowledge pack. Production installations do not read a development checkout as a fallback. These development paths do not establish managed-release readiness. Supported managed targets are Windows x64, macOS x64/arm64 and Linux x64.

## Contributor validation

From `kafe-vscode`, run:

```powershell
npm ci
npm test
.\node_modules\.bin\vsce.cmd package
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

The extension host gate uses the cached pinned VS Code executable, isolated trusted and genuinely restricted profiles, and no download API. Windows native acceptance uses the real composer and bridge with deterministic provider/runtime fixtures; inspect its per-capture viewport, CSS, DPR and image-size evidence. Synthetic IME and AX checks do not establish physical IME or screen-reader speech; fixture acceptance does not establish real-provider or managed-release readiness.
