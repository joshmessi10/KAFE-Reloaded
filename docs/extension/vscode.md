# VS Code extension and AI Tutor

The extension provides KAFE `.kf` highlighting, snippets, learner-started execution and a Tutor conversation in VS Code 1.96.0 or later. Open **KAFE: Open Tutor**.

Local candidate **2.2.0** adds saved workspace conversations and selected-conversation JSON export.

Program output, errors and interactive input appear only in the local **KAFE Run** terminal. Run lifecycle events do not create Tutor messages. The latest matching result remains bounded in host memory so the Tutor can use it when the learner asks for help.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. One answer streams in place. **Stop** replaces Send during a response while the next draft stays editable. **Retry** uses the original question and current authorized context, preserves the next draft and does not duplicate the learner message. Key configuration never sends automatically.

The included whole-file indicators identify the active eligible `.kf` and selected optional files. **Add context** lists visible same-workspace `.kf` metadata without reading optional contents; explicit inclusion permits capture at Send. Indicators reveal their named file natively; optional indicators can be removed. Accessible names and tooltips retain full identities, including duplicate basenames. Optional selection survives becoming active and closing its editors. Source/trust/knowledge changes fence admission and invalidate dependent authority. Restricted Mode permits message-only learning while excluding workspace files, edits and Run.

## Saved workspace conversations

The Tutor keeps multiple independent conversations in the current VS Code workspace. It saves their messages, drafts, completed history and learning level/mode locally with a 250 ms debounce. Reopening the workspace restores the last selected chat. An empty untitled window uses its own VS Code workspace storage scope.

The view description shows the active title. Use its title actions or the Command Palette:

| Command | Behavior |
| --- | --- |
| **KAFE: New Conversation** | Saves the current chat and starts an empty guided Beginner conversation. |
| **KAFE: Switch Conversation** | Opens a native picker of saved chats with updated dates; restores the selected chat's draft and preferences. |
| **KAFE: Rename Conversation** | Renames the active chat. The initial automatic title comes from its first learner message. |
| **KAFE: Delete Conversation** | Requests confirmation before deleting the active chat and its draft; creates an empty chat if it was the last one. |
| **KAFE: Export Conversation** | Saves a snapshot of the selected chat through a native JSON Save dialog. |

New, Switch and Delete stop an active provider response before transitioning and retain its partial text as cancelled. A current native Apply must finish before changing conversations. Switching clears selected optional sources, live learning decisions/observations, proposal/Run grants and private execution evidence. Stored checkpoint/proposal summaries remain readable without restoring their old native actions. An independently running program continues in its terminal; late results cannot populate another conversation.

### JSON export

Export produces one versioned UTF-8 JSON document containing the selected conversation's title, identity, creation/update dates, complete visible entries, statuses and safe display summaries. Text, code and Unicode are preserved exactly. The snapshot is captured before the Save dialog opens, so a later chat switch does not redirect the export. Cancelling the dialog writes nothing; a failed write reports an error and keeps the chat open. Export does not stop a response, so an unfinished reply can retain its responding status in the snapshot.

Drafts, learning preferences, provider history/dependencies, attached-source metadata and executable action handles are excluded from the public JSON. Text or code entered in the conversation remains part of its transcript. SecretStorage values, attached-file snapshots, raw provider requests and private Run evidence are never copied into it. JSON export has a separate 16 MiB bound and remains available for a live chat when archive saving fails, subject to that bound.

## Guided learning and permissions

Concept questions can receive direct explanations. For exercises, the Tutor asks diagnostic questions and provides progressively stronger hints without giving the final answer, a complete ready-to-submit solution, or a verbatim repository fixture. Reviewed MACHINE and GESHA fixtures ground its syntax and API knowledge. The level button beside the composer or **KAFE: Learning Level** opens the native Beginner, Intermediate and Expert picker. **KAFE: Pause/Resume Teaching** preserves the selected level. Each conversation saves its own level and guided/paused mode; a new chat starts with guided Beginner preferences.

A checkpoint's learner-proposal summary is explicitly an unconfirmed Tutor summary. **Confirm and continue** records adoption and continues discussion; it does not establish learner authorship, understanding or mastery. **Discuss** and **Skip** confer no preparation grant. Waiting for reasoning is settled, with no work spinner or Stop.

**Implement this step** (or **Prepare change** while paused) authorizes one proposal for the exact displayed target and scope. Direct requests still require a fresh displayed scope click. A missing key, stopped attempt or failed preparation does not preserve permission for automatic retry. Fresh authorization is required. Native **Review change**, **Apply**, **Dismiss**, and a separate explicit **Run** remain distinct actions.

## Credentials and native actions

Use **KAFE: Configure Provider Key** for the masked native DeepSeek input. The key stays in VS Code SecretStorage. Missing-key recovery preserves the draft; successful configuration never resends. **KAFE: Clear Provider Key** deletes that key from SecretStorage. Never put credentials in chat.

**Review change** opens the native diff. **Apply** requires reviewed current proposal identity and authorization of the target plus its complete dependencies, version and content hash. Source edits/deletion, revoked trust or reset invalidate stale proposals. Applying never runs the program. Provider tools cannot apply edits or execute programs.

**Run main.kf** identifies the saved-file target. **KAFE: Run File** and Ctrl+F5 (Cmd+F5 on macOS) require trust and a saved eligible file. Cancelled saving leaves it unrun. Input/output use the native terminal. Stop cancels the provider independently of Run; New conversation does not terminate an independently running process.

Run evidence distinguishes host-observed launch/completion/current saved-source comparisons from current editor comparisons. Missing comparisons and null exit outcomes remain unknown. Equal observed boundary hashes do not prove exact interpreter-read bytes, imported-file bytes or correctness. Zero exit is an exit result; **Exact executed bytes: unknown** and **Correctness: not established** remain explicit. Subsequent authorized explanations may use staged/applied/Run facts while retaining these limits.

## Retention and limits

The local workspace archive retains the full transcript, draft, completed history and learning preferences across restarts. It stores safe checkpoint/proposal summaries without restoring live decisions or executable authority. Source selections, request snapshots, pending proposals, transient observations/decisions and action/output evidence reset on transition or restart. Restored completed history keeps its original source/knowledge dependencies and must pass current context eligibility before use by the provider. Credentials and legacy progress remain independent. Legacy progress is neither imported into learning nor transmitted to the provider. **KAFE: Clear Tutor Progress** requests separate native confirmation and preserves saved/live chat and credentials.

The archive permits 200 conversations, 4 MiB per conversation and 16 MiB total, with at most 10,000 entries and 5,000 completed history pairs per conversation. Limits reject saving without silent eviction. Failed writes keep the current conversation live and display an error; retry or export before closing. Malformed existing storage is preserved instead of overwritten, and the warning identifies the current chat as temporary.

Follow-ups retain at most eight eligible completed whole learner/assistant pairs within 32 KiB UTF-8. Failed/interrupted pairs are excluded; removed or changed source/knowledge grounding omits dependent context without reviving it through learning records. Source snapshots are limited to 64 KiB each and Run output to 1 MiB. The five permitted tools retain four calls per response and four rounds per turn. Checkpoints are bounded to 16 KiB each; teaching retains at most 32 decisions, 32 observations and 64 KiB total state. Exhaustion rejects the admission without silently evicting pending records; New conversation clears this state. Host action evidence retains at most 32 whole records, 8 KiB each and 64 KiB total/projection text. Old discussion and adopted decisions are not current execution proof.

The saved transcript and export include older visible messages beyond the eight-pair provider window. The private archive retains history dependency references but excludes attached source snapshots, SecretStorage values, raw provider requests, private Run evidence and raw transport errors. Visible message text/code and safe checkpoint summaries are retained. Tutor diagnostics continue to exclude transcript text and private content.

## Runtime and knowledge

The managed runtime is checksum-pinned and installed with uv 0.11.3. It includes the locked `extension` dependency extra for Hugging Face datasets, Kaggle downloads, images and 7z archives. Ordinary conversation with a configured provider can proceed without an executable runtime or knowledge pack; requests disclose unavailable knowledge. Invalid or changed knowledge is never represented as valid grounding.

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
