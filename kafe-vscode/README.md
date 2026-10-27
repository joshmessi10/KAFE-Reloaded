# KAFE Neural Development Suite

For test-backed code guidance, reference freshness checks, and the contributor workflow, see [Maintaining Tutor reliability](../docs/extension/tutor-reliability.md). The [evaluation alignment guide](../docs/extension/evaluation-alignment.md) maps conceptual teaching, practical learner reasoning and evidence handling to the study proposal.

The extension provides KAFE `.kf` highlighting, snippets, learner-started execution and a Tutor conversation in VS Code 1.96.0 or later. Open **KAFE: Open Tutor**.

Local candidate **2.3.0** adds complete reviewed MACHINE/GESHA API reference coverage, available before runtime installation, alongside saved workspace conversations and JSON export.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. One answer streams in place. **Stop** replaces Send during a response while the next draft stays editable. **Retry** uses the original question and current authorized context, preserves the next draft and does not duplicate the learner message. Key configuration never sends automatically.

The included whole-file indicators identify the active eligible `.kf` and selected optional files. **Add context** lists visible same-workspace `.kf` metadata without reading optional contents; explicit inclusion provides consent to capture those files at Send. Indicators reveal their named file natively; optional indicators can be removed. Accessible names and tooltips retain full identities, including duplicate basenames. Optional selection survives becoming active and closing its editors. Source/trust/knowledge changes fence admission and invalidate dependent authority. Restricted Mode permits message-only learning while excluding workspace files, edits and Run.

## Saved conversations and export

Each VS Code workspace keeps its own Tutor conversations. Messages, unsent drafts and each conversation's learning level and guided/paused mode are saved locally after a 250 ms pause in changes. Reopening the same workspace restores the last selected conversation. History follows VS Code's workspace storage scope; it is not shared across projects.

Use the Tutor view-title actions or the Command Palette:

| Command | Behavior |
| --- | --- |
| **KAFE: New Conversation** | Preserves the current chat and opens an empty conversation with guided Beginner preferences. |
| **KAFE: Switch Conversation** | Lists saved conversations with their updated dates; reopens the chosen chat and its draft/preferences. |
| **KAFE: Rename Conversation** | Changes the active conversation's title. A new chat initially takes its title from the first learner message. |
| **KAFE: Delete Conversation** | Requests native confirmation before removing the active chat and draft. Deleting the last chat creates an empty conversation. |
| **KAFE: Export Conversation** | Opens a native Save dialog for a JSON snapshot of the selected conversation. Cancelling saves nothing. |

New, Switch and Delete stop a streaming response and preserve its partial reply as cancelled. Finish a current **Apply** before changing conversations. Archived checkpoints and proposals remain readable; their old Review/Apply/Run actions cannot be reused. An independently running KAFE program continues in its own terminal.

Export includes the full visible transcript, message statuses, title/dates and safe checkpoint/proposal summaries. It preserves Unicode, message text and code exactly, including text or code you pasted. Drafts, learning preferences, provider history/dependencies, attached-source metadata and executable actions are omitted. The export belongs to the conversation selected when the Save dialog opened, even if you switch chats before choosing the destination. Export does not stop an active response; its snapshot can contain a partial reply marked responding.

## Guided learning and permissions

Concept questions can receive direct explanations. For meaningful design decisions, the Tutor asks for learner reasoning, discusses requested options and may propose a Design or Implementation checkpoint. The level button beside the composer or **KAFE: Learning Level** opens one native picker with exactly three choices:

- **Beginner** (default): step-by-step explanations, unfamiliar terms explained, more guidance and worked examples when requested.
- **Intermediate**: shorter explanations, hints and trade-offs, collaborative preparation and occasional checkpoints.
- **Expert**: direct technical answers, minimal introductory explanation and checkpoints for major decisions.

Levels select a teaching style, not measured ability. Each selection applies a complete preset; independent frequency, reasoning, preparation and familiarity menus are no longer exposed. All levels use the same KAFE references and explicit preparation, Review, Apply and Run permissions. **KAFE: Pause/Resume Teaching** separately toggles teaching without changing the selected level; selecting a different level does not resume paused teaching. Changes during a response queue until settlement. Repeated pause/resume requests act on the queued selection. The button shows the active level, including paused status; queued changes are announced when queued and when applied. Each saved conversation retains its own level and guided/paused mode; New conversation starts with guided Beginner. Ordinary typed discussion remains available; no onboarding wizard is required.

A checkpoint's learner-proposal summary is explicitly an unconfirmed Tutor summary. **Confirm and continue** records adoption and continues discussion; it does not establish learner authorship, understanding or mastery. **Discuss** and **Skip** confer no preparation grant. Waiting for reasoning is settled, with no work spinner or Stop.

**Implement this step** (or **Prepare change** while paused) authorizes one proposal for the exact displayed target and scope. Direct requests still require a fresh displayed scope click. A missing key, stopped attempt or failed preparation does not preserve permission for automatic retry. Fresh authorization is required. Native **Review change**, **Apply**, **Dismiss**, and a separate explicit **Run** remain distinct actions.

## Credentials and native actions

Use **KAFE: Configure Provider Key** for the masked native DeepSeek input. The key stays in VS Code SecretStorage. Missing-key recovery preserves the draft; successful configuration never resends. **KAFE: Clear Provider Key** deletes that key from SecretStorage. Never put credentials in chat.

**Review change** opens the native diff. **Apply** requires reviewed current proposal identity and authorization of the target plus its complete dependencies, version and content hash. Source edits/deletion, revoked trust or reset invalidate stale proposals. Applying never runs the program. Provider tools cannot apply edits or execute programs.

**Run main.kf** identifies the saved-file target. **KAFE: Run File** and Ctrl+F5 (Cmd+F5 on macOS) require trust and a saved eligible file. Cancelled saving leaves it unrun. Input/output use the native terminal. Stop cancels the provider independently of Run; New conversation does not terminate an independently running process.

Run evidence distinguishes host-observed launch/completion/current saved-source comparisons from current editor comparisons. Missing comparisons and null exit outcomes remain unknown. Equal observed boundary hashes do not prove exact interpreter-read bytes, imported-file bytes or correctness. Zero exit is an exit result; **Exact executed bytes: unknown** and **Correctness: not established** remain explicit. Subsequent authorized explanations may use staged/applied/Run facts while retaining these limits.

## Retention and limits

The workspace archive retains transcripts, drafts, completed history and learning preferences across restarts. Source selections, live learning decisions/observations, pending proposals, request snapshots and action/output evidence remain transient. Switching or restoring a conversation clears that authority and checks current workspace context again; a historical transcript does not restore permission to read a file, apply a change or run a program. Credentials and legacy progress remain independent. Legacy progress is neither imported into learning nor transmitted to the provider. **KAFE: Clear Legacy Tutor Progress** requests separate native confirmation and preserves saved/live chat and credentials.

The archive allows 200 conversations, 4 MiB per conversation and 16 MiB total, including at most 10,000 entries and 5,000 completed history pairs per conversation. Reaching a limit reports a save failure without silently removing old chats. A failed write leaves the current chat open; retry or export it before closing VS Code. If existing storage is malformed, the original data is preserved and a warning explains that the current chat is temporary. JSON export has its own 16 MiB limit and can preserve a live conversation when its archive save fails.

Follow-ups retain at most eight eligible completed whole learner/assistant pairs within 32 KiB UTF-8. Failed/interrupted pairs are excluded; removed or changed source/knowledge grounding omits dependent context without reviving it through learning records. Source snapshots are limited to 64 KiB each and Run output to 1 MiB. The five permitted tools retain four calls per response and four rounds per turn. Checkpoints are bounded to 16 KiB each; teaching retains at most 32 decisions, 32 observations and 64 KiB total state. Exhaustion rejects the admission without silently evicting pending records; New conversation clears this state. Host action evidence retains at most 32 whole records, 8 KiB each and 64 KiB total/projection text. Old discussion and adopted decisions are not current execution proof.

The saved transcript is separate from that bounded provider context: older visible messages remain available and exportable even when they are outside the follow-up window. The archive excludes SecretStorage values, attached source snapshots, raw requests, private Run evidence and raw transport errors. Message text, code and safe checkpoint summaries are retained. Tutor diagnostics continue to exclude transcript text and those private values.

## Runtime and knowledge

MACHINE/GESHA references ship with the extension. They cover the intended public functions, returned-object methods/properties, positional calls, English/Spanish terminology and known limits for the pinned interpreter. The Tutor selects relevant complete contracts, documentation and reviewed examples for each request; it does not send the entire library corpus. This guidance and bundled knowledge lookup work in message-only Restricted Mode and before executable runtime or managed knowledge setup. Unsupported or experimental paths remain labelled; reference coverage does not guarantee every model answer or proposed program is correct.

The managed runtime remains pinned to **KAFE 0.3.0**, Python 3.11 or newer, and uv 0.11.3. In a trusted workspace the extension automatically prepares a missing published runtime on activation; **KAFE: Install Runtime** also prepares or repairs it. Setup downloads verified assets into VS Code's private global storage and installs locked dependencies there. It does not run a learner program. Ordinary configured-provider conversation and bundled references are available before setup; validated cached knowledge has independent availability.

The published runtime assets and their checksums are unchanged in 2.3.0. Current bundled MACHINE/GESHA contracts take precedence over the older managed pack's library narratives. Extended managed tutorial packaging is prepared for a future separately versioned release. Invalid or changed managed/development knowledge must never be represented as valid grounding.

Contributor Run can use a prepared KAFE checkout and installed tools. An Extension Development Host can use an explicitly validated development knowledge pack. Production installations do not read a development checkout as a fallback. These development paths do not establish managed-release readiness. Supported managed targets are Windows x64, macOS x64/arm64 and Linux x64.

## Local verification

From `kafe-vscode`, use `npm.cmd run test:unit` and `npm.cmd run test:extension`. Host tests require the cached VS Code 1.96.0 executable and use isolated trusted and restricted profiles; they do not download it. `node test/native/acceptance.cjs <evidence-directory>` runs bounded Windows native acceptance with the cached host and deterministic services. `node test/verify-vsix.js <vsix-path>` validates packaged assets and rejects development, secret and retired workflow files. The local installed `vsce` packager can build a VSIX for inspection without installation.

Use Node 24 LTS for developer tooling, then `npm ci` and `npm audit --audit-level=low`. CI audits the complete development/runtime lock graph; the extension's VS Code engine and native 1.96.0 host remain unchanged. Narrow overrides select patched MSAL and serializer versions until their parent tools accept them directly. The unused signing-helper install script is explicitly denied; ordinary unsigned packaging is verified without that binary. Mocha 11 still brings glob 10.5.0's upstream deprecation notice during installation; it is a documented installer exception, with no log filtering or audit exclusion.

`npm.cmd run references:build` and `npm.cmd run references:check` cover both fundamentals/fixtures and library contracts/documentation. Reference verification needs the prepared pinned Python/ANTLR runtime; see the reliability guide for review, evidence and source-identity requirements. Local checks, hosted CI, real-provider evaluation and release acceptance are separate evidence.

Deterministic tests do not establish real DeepSeek behavior, published runtime readiness or learning efficacy. Synthetic IME and accessibility-tree checks do not prove physical Windows IME operation or screen-reader speech. Native evidence must report actual measured geometry, including any small-window zoom clamp.

## Diagnosing a Tutor failure

After changing the development extension, restart its Extension Development Host or use **Developer: Reload Window** there. Reproduce the failed message once, then open **View: Toggle Output** and select **KAFE Tutor Diagnostics**. The channel is created when the first traced event occurs; it contains only fixed metadata categories and numbers. Messages, tool arguments, source text, paths, credentials, raw exception messages and stacks are excluded. The recent buffer is bounded to 256 records and clears with a `trace-reset` marker when full.

For a tool failure, inspect `tool-start`, `tool-failed` and `turn-settled` for the same local attempt number. `reason` distinguishes rejected arguments, invalid queries, missing captured sources and other validation categories. Known exception categories/codes are recorded; `unclassified` means the cause was not identified. `turn-settled` reports controller status and whether it remains busy. `view-posted` records VS Code's postMessage acceptance at a display revision; `delivered: true` does **not** prove the browser rendered it. The diagnostics never retry, resend or weaken a tool guard. They describe a reproduced attempt, not the cause of an older screenshot.
