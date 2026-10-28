# VS Code extension and AI Tutor

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

See [reliability, budgets and contributor checks](tutor-reliability.md) and [study procedures and consent](evaluation-alignment.md) for detail. [Older package notes](package-0.0.8.md) describe a historical candidate.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. One answer streams in place. **Stop** replaces Send during a response while the next draft stays editable. **Retry** uses the original question and current authorized context, preserves the next draft and does not duplicate the learner message. Key configuration never sends automatically.

The included whole-file indicators identify the active eligible `.kf` and selected optional files. The file disclosure beside the composer lists visible same-workspace `.kf` metadata without reading optional contents; explicit inclusion permits capture at Send. Indicators reveal their named file natively; optional indicators can be removed. Accessible names and tooltips retain full identities, including duplicate basenames. Optional selection survives becoming active and closing its editors. Source/trust/knowledge changes fence admission and invalidate dependent authority. Restricted Mode permits message-only learning while excluding workspace files, edits and Run.

## Saved workspace conversations

The Tutor keeps multiple independent conversations in the current VS Code workspace. It saves their messages, drafts, completed history and guided/paused mode locally with a 250 ms debounce. Reopening the workspace restores the last selected chat. An empty untitled window uses its own VS Code workspace storage scope.

The view description shows the active title. Use its title actions or the Command Palette:

| Command | Behavior |
| --- | --- |
| **KAFE: New Conversation** | Saves the current chat and starts an empty guided conversation. |
| **KAFE: Switch Conversation** | Opens a native picker of saved chats with updated dates; restores the selected chat's draft and preferences. |
| **KAFE: Rename Conversation** | Renames the active chat. The initial automatic title comes from its first learner message. |
| **KAFE: Delete Conversation** | Requests confirmation before deleting the active chat and its draft; creates an empty chat if it was the last one. |
| **KAFE: Export Conversation** | Saves a snapshot of the selected chat through a native JSON Save dialog. |

New, Switch and Delete stop an active provider response before transitioning and retain its partial text as cancelled. A current native Apply must finish before changing conversations. Switching clears selected optional sources, live learning decisions/observations, proposal/Run grants and private execution evidence. Stored checkpoint/proposal summaries remain readable without restoring their old native actions. An independently running program continues in its terminal; late results cannot populate another conversation.

### JSON export

Export produces one versioned UTF-8 JSON document containing the selected conversation's title, identity, creation/update dates, complete visible entries, statuses and safe display summaries. Text, code and Unicode are preserved exactly. The snapshot is captured before the Save dialog opens, so a later chat switch does not redirect the export. Cancelling the dialog writes nothing; a failed write reports an error and keeps the chat open. Export does not stop a response, so an unfinished reply can retain its responding status in the snapshot.

Drafts, learning preferences, provider history/dependencies, attached-source metadata and executable action handles are excluded from the public JSON. Text or code entered in the conversation remains part of its transcript. SecretStorage values, attached-file snapshots, raw provider requests and private Run evidence are never copied into it. JSON export has a separate 16 MiB bound and remains available for a live chat when archive saving fails, subject to that bound.

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

The local workspace archive retains the full transcript, draft, completed history and learning preferences across restarts. It stores safe checkpoint/proposal summaries without restoring live decisions or executable authority. Source selections, request snapshots, pending proposals, transient observations/decisions and action/output evidence reset on transition or restart. Restored completed history keeps its original source/knowledge dependencies and must pass current context eligibility before use by the provider. Credentials and legacy progress remain independent. Legacy progress is neither imported into learning nor transmitted to the provider. **KAFE: Clear Legacy Tutor Progress** requests separate native confirmation and preserves saved/live chat and credentials.

The archive permits 200 conversations, 4 MiB per conversation and 16 MiB total, with at most 10,000 entries and 5,000 completed history pairs per conversation. Limits reject saving without silent eviction. Failed writes keep the current conversation live and display an error; retry or export before closing. Malformed existing storage is preserved instead of overwritten, and the warning identifies the current chat as temporary.

Follow-ups retain at most eight eligible completed whole learner/assistant pairs within 32 KiB UTF-8. Failed/interrupted pairs are excluded; removed or changed source/knowledge grounding omits dependent context without reviving it through learning records. Source snapshots are limited to 64 KiB each and Run output to 1 MiB. The five permitted tools retain four calls per response and four rounds per turn. Checkpoints are bounded to 16 KiB each; teaching retains at most 32 decisions, 32 observations and 64 KiB total state. Exhaustion rejects the admission without silently evicting pending records; New conversation clears this state. Host action evidence retains at most 32 whole records, 8 KiB each and 64 KiB total/projection text. Old discussion and adopted decisions are not current execution proof.

A short notice reports omissions in the actual submitted request, with optional details; it never resends or restores old file permission. The saved transcript and export include older visible messages beyond the eight-pair provider window. The private archive retains history dependency references but excludes attached source snapshots, SecretStorage values, raw provider requests, private Run evidence and raw transport errors. Visible message text/code and safe checkpoint summaries are retained. Tutor diagnostics continue to exclude transcript text and private content.

## Runtime and knowledge

The managed runtime is checksum-pinned and installed with uv 0.11.3. It includes the locked `extension` dependency extra for Hugging Face datasets, Kaggle downloads, images and 7z archives. Ordinary conversation with a configured provider can proceed without an executable runtime or knowledge pack; requests disclose unavailable knowledge. Invalid or changed knowledge is never represented as valid grounding.

Contributor Run can use a prepared KAFE checkout and installed tools. An Extension Development Host can use an explicitly validated development knowledge pack. Production installations do not read a development checkout as a fallback. These development paths do not establish managed-release readiness. Supported managed targets are Windows x64, macOS x64/arm64 and Linux x64.

## Contributor validation and diagnostics

Use the [reliability guide](tutor-reliability.md#contributor-workflow) for locked setup, current checks, reference review, layout, native-host and package procedures. Its [diagnostic guidance](tutor-reliability.md#diagnosing-a-tutor-failure) explains safe metadata and its limits. See [Getting Started](../getting-started/installation.md) for Python 3.11+ and ANTLR 4.13.2 setup.

Local tests, exact-revision hosted results, native acceptance, real-provider review and learner outcomes are separate evidence. Source `9c25d04` passed real VS Code 1.96.0 trusted/untrusted CI and downstream packaging; the absent local pinned cache and the newer local provider rehearsal are separate facts. Later documentation-only commits need their own delivery receipts. The user kept the checkpoint with answer-quality acceptance incomplete. No publication or efficacy claim follows from these instructions.
