# KAFE Neural Development Suite

Extension **2.3.0** provides KAFE highlighting, snippets, saved conversations and a unified Tutor in VS Code 1.96.0 or later, over unchanged published runtime **0.3.0**. Reviewed MACHINE/GESHA guidance is bundled before runtime installation.

## Start chatting

1. Open **KAFE: Open Tutor**.
2. Choose **Configure Tutor** if prompted, or **KAFE: Configure Provider Key**. Enter your DeepSeek API key in the masked native VS Code prompt; it stays in SecretStorage. Configuration records a stored key; it does not verify credentials. Configuration preserves your draft and never sends it.
3. Type a concept or code question and choose **Send**. Ask for shorter or fuller explanations in the conversation when useful.

## Run your first saved program

1. Open a workspace folder and create or open a saved `.kf` file.
2. In a trusted workspace, choose **KAFE: Run File** or Ctrl+F5 (Cmd+F5 on macOS).
3. Read output, errors and interactive input in the native **KAFE Run** terminal. Run is separate from chat and applying a change.

Trusted activation automatically prepares a missing published runtime. Setup is noncancellable: hiding its progress is not cancellation. A failed setup offers a native retry and optional details; retry never sends your draft or runs a program. Chat with a configured provider and bundled references can work independently of Run setup.

## Your data and choices

Sending shares your message, eligible recent discussion and currently authorized context with DeepSeek. Optional files require explicit inclusion. Conversations and drafts are saved locally per workspace; exporting or sharing them is your choice and is not research consent. Restricted Mode supports message-only chat without file, edit or Run access. Credentials use native key entry, changes use native diffs, and execution uses native terminals.

See [reliability, budgets and contributor checks](https://github.com/joshmessi10/KAFE-Reloaded/blob/93c447f7f1894121fe98590699d25eea1b836a46/docs/extension/tutor-reliability.md), [study procedures and consent](https://github.com/joshmessi10/KAFE-Reloaded/blob/93c447f7f1894121fe98590699d25eea1b836a46/docs/extension/evaluation-alignment.md), and the [learner guide](https://github.com/joshmessi10/KAFE-Reloaded/blob/93c447f7f1894121fe98590699d25eea1b836a46/docs/extension/vscode.md). Older package notes describe historical candidates.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. One answer streams in place. **Stop** replaces Send during a response while the next draft stays editable. **Retry** uses the original question and current authorized context, preserves the next draft and does not duplicate the learner message. Key configuration never sends automatically.

The included whole-file indicators identify the active eligible `.kf` and selected optional files. The file disclosure beside the composer lists visible same-workspace `.kf` metadata without reading optional contents; explicit inclusion provides consent to capture those files at Send. Indicators reveal their named file natively; optional indicators can be removed. Accessible names and tooltips retain full identities, including duplicate basenames. Optional selection survives becoming active and closing its editors. Source/trust/knowledge changes fence admission and invalidate dependent authority. Restricted Mode permits message-only learning while excluding workspace files, edits and Run.

## Saved conversations and export

Each VS Code workspace keeps its own Tutor conversations. Messages, unsent drafts and each conversation's guided/paused mode are saved locally after a 250 ms pause in changes. Reopening the same workspace restores the last selected conversation. History follows VS Code's workspace storage scope; it is not shared across projects.

Use the Tutor view-title actions or the Command Palette:

| Command | Behavior |
| --- | --- |
| **KAFE: New Conversation** | Preserves the current chat and opens an empty conversation with guided mode. |
| **KAFE: Switch Conversation** | Lists saved conversations with their updated dates; reopens the chosen chat and its draft/preferences. |
| **KAFE: Rename Conversation** | Changes the active conversation's title. A new chat initially takes its title from the first learner message. |
| **KAFE: Delete Conversation** | Requests native confirmation before removing the active chat and draft. Deleting the last chat creates an empty conversation. |
| **KAFE: Export Conversation** | Opens a native Save dialog for a JSON snapshot of the selected conversation. Cancelling saves nothing. |

New, Switch and Delete stop a streaming response and preserve its partial reply as cancelled. Finish a current **Apply** before changing conversations. Archived checkpoints and proposals remain readable; their old Review/Apply/Run actions cannot be reused. An independently running KAFE program continues in its own terminal.

Export includes the full visible transcript, message statuses, title/dates and safe checkpoint/proposal summaries. It preserves Unicode, message text and code exactly, including text or code you pasted. Drafts, learning preferences, provider history/dependencies, attached-source metadata and executable actions are omitted. The export belongs to the conversation selected when the Save dialog opened, even if you switch chats before choosing the destination. Export does not stop an active response; its snapshot can contain a partial reply marked responding.

## Guided learning and permissions

One guided Tutor answers concept and syntax questions directly. At meaningful design choices it invites one focused hypothesis or decision, accepts reasoning already supplied and offers stronger hints or bounded examples when needed. Final comparisons, conclusions and assessed solutions remain the learner's work. **KAFE: Pause/Resume Teaching** independently removes or resumes additional reasoning requirements; changes during a response queue until settlement. The former Learning Level command and Beginner/Intermediate/Expert selector are retired, including their hidden presets.

Ask for brevity or detail in ordinary chat. This changes presentation within eligible conversation history; there is no Remember action, durable style memory or permanent style selector. Older messages can fall outside the provider context after omission, switching or restart.

A checkpoint identifies the Tutor's interpretation of a learner proposal. **Confirm choice** adopts the displayed approach without certifying authorship, understanding or correctness. **Discuss** and **Skip** give no preparation permission. Supporting evidence appears in labelled details; genuinely unresolved choices stay visible.

**Prepare change** authorizes one proposal for the exact displayed workspace-relative target and bounded scope. A missing key, failure or cancellation consumes that permission; a retry needs a fresh displayed scope. Native **Review change**, **Apply**, **Dismiss**, and explicit **Run** remain separate actions. Pure design confirmation never authorizes preparation.

## Credentials and native actions

Use **KAFE: Configure Provider Key** for the masked native DeepSeek input. The key stays in VS Code SecretStorage. Missing-key recovery preserves the draft; successful configuration never resends. **KAFE: Clear Provider Key** deletes that key from SecretStorage. Never put credentials in chat.

**Review change** opens the native diff. **Apply** requires reviewed current proposal identity and authorization of the target plus its complete dependencies, version and content hash. Source edits/deletion, revoked trust or reset invalidate stale proposals. Applying never runs the program. Provider tools cannot apply edits or execute programs.

**Run main.kf** identifies the saved-file target. **KAFE: Run File** and Ctrl+F5 (Cmd+F5 on macOS) require trust and a saved eligible file. Cancelled saving leaves it unrun. Input/output use the native terminal. Stop cancels the provider independently of Run; New conversation does not terminate an independently running process.

Run evidence distinguishes host-observed launch/completion/current saved-source comparisons from current editor comparisons. Missing comparisons and null exit outcomes remain unknown. Equal observed boundary hashes do not prove exact interpreter-read bytes, imported-file bytes or correctness. Zero exit is an exit result; **Exact executed bytes: unknown** and **Correctness: not established** remain explicit. Subsequent authorized explanations may use staged/applied/Run facts while retaining these limits.

## Retention and limits

Archive payload version 2 stores mode-only learning preferences at the existing `kafeTutor.conversations.v1` storage key. Valid legacy v1 archives are strictly validated using their original rules before all former levels map to the common baseline. Loading leaves the original stored data untouched until a successful serialized v2 save. Older readers cannot read the archive after that save; downgrade is unsupported. Public JSON export remains schema version 1. Previously discarded response text cannot be recovered by migration.

The workspace archive retains transcripts, drafts, completed history and learning preferences across restarts. Source selections, live learning decisions/observations, pending proposals, request snapshots and action/output evidence remain transient. Switching or restoring a conversation clears that authority and checks current workspace context again; a historical transcript does not restore permission to read a file, apply a change or run a program. Credentials and legacy progress remain independent. Legacy progress is neither imported into learning nor transmitted to the provider. **KAFE: Clear Legacy Tutor Progress** requests separate native confirmation and preserves saved/live chat and credentials.

The archive allows 200 conversations, 4 MiB per conversation and 16 MiB total, including at most 10,000 entries and 5,000 completed history pairs per conversation. Reaching a limit reports a save failure without silently removing old chats. A failed write leaves the current chat open; retry or export it before closing VS Code. If existing storage is malformed, the original data is preserved and a warning explains that the current chat is temporary. JSON export has its own 16 MiB limit and can preserve a live conversation when its archive save fails.

Follow-ups retain at most eight eligible completed whole learner/assistant pairs within 32 KiB UTF-8. Failed/interrupted pairs are excluded; removed or changed source/knowledge grounding omits dependent context without reviving it through learning records. Source snapshots are limited to 64 KiB each and Run output to 1 MiB. The five permitted tools retain four calls per response and four rounds per turn. Checkpoints are bounded to 16 KiB each; teaching retains at most 32 decisions, 32 observations and 64 KiB total state. Exhaustion rejects the admission without silently evicting pending records; New conversation clears this state. Host action evidence retains at most 32 whole records, 8 KiB each and 64 KiB total/projection text. Old discussion and adopted decisions are not current execution proof.

A short context notice reports when the actual submitted request omits earlier discussion, with details available. It never resends or restores old file permission. The saved transcript is separate from that bounded provider context: older visible messages remain available and exportable even when they are outside the follow-up window. The archive excludes SecretStorage values, attached source snapshots, raw requests, private Run evidence and raw transport errors. Message text, code and safe checkpoint summaries are retained. Tutor diagnostics continue to exclude transcript text and those private values.

## Runtime and knowledge

MACHINE/GESHA references ship with the extension. They cover the intended public functions, returned-object methods/properties, positional calls, English/Spanish terminology and known limits for the pinned interpreter. The Tutor selects relevant complete contracts, documentation and reviewed examples for each request; it does not send the entire library corpus. This guidance and bundled knowledge lookup work in message-only Restricted Mode and before executable runtime or managed knowledge setup. Unsupported or experimental paths remain labelled; reference coverage does not guarantee every model answer or proposed program is correct.

The managed runtime remains pinned to **KAFE 0.3.0**, Python 3.11 or newer, and uv 0.11.3. In a trusted workspace the extension automatically prepares a missing published runtime on activation; **KAFE: Install Runtime** also prepares or repairs it. Setup downloads verified assets into VS Code's private global storage and installs locked dependencies there. It does not run a learner program. Ordinary configured-provider conversation and bundled references are available before setup; validated cached knowledge has independent availability.

The published runtime assets and their checksums are unchanged in 2.3.0. Current bundled MACHINE/GESHA contracts take precedence over the older managed pack's library narratives. Extended managed tutorial packaging is prepared for a future separately versioned release. Invalid or changed managed/development knowledge must never be represented as valid grounding.

Contributor Run can use a prepared KAFE checkout and installed tools. An Extension Development Host can use an explicitly validated development knowledge pack. Production installations do not read a development checkout as a fallback. These development paths do not establish managed-release readiness. Supported managed targets are Windows x64, macOS x64/arm64 and Linux x64.

## Contributor checks and diagnostics

Use the [reliability contributor workflow](https://github.com/joshmessi10/KAFE-Reloaded/blob/93c447f7f1894121fe98590699d25eea1b836a46/docs/extension/tutor-reliability.md#contributor-workflow) for Node 24 LTS, locked dependencies, unit/native/layout gates, reference freshness, package checks and diagnostics. Local checks, hosted CI, real-provider evaluation and release acceptance require separate evidence. Source `9c25d04` passed real VS Code 1.96.0 trusted/untrusted CI and downstream package verification. The absent local pinned cache and newer local provider rehearsal remain separate facts. The user chose to keep this checkpoint with answer-quality acceptance incomplete; later documentation-only commits need their own delivery receipts.
