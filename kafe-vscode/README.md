# KAFE Neural Development Suite

The extension provides KAFE `.kf` highlighting, snippets, learner-started execution and a Tutor conversation in VS Code 1.96.0 or later. Open **KAFE: Open Tutor**.

## Conversation

Type a message and press **Send** or Enter once. Shift+Enter inserts a newline. The answer streams into one message. During a response, **Stop** replaces Send and the composer remains editable for your next draft. **Retry** resubmits the original question with current authorized context, preserves your next draft and adds no duplicate learner message. There is no automatic retry.

The filename beside the composer identifies the active eligible `.kf` included with your message. **Other files** lists visible same-workspace `.kf` candidates without reading their contents. Select only the files you want to include. Selected optional files remain selected during the live conversation until removed, even when their editors close. Send includes eligible conversation history, selected file context, available validated KAFE knowledge and attributable recent Run evidence. Source changes during capture stop the request and expose Retry. In Restricted Mode, message-only chat remains available and the context row explains file exclusion; file tools, edits and Run stay blocked.

Goals, explanations and requested summaries belong in ordinary dialogue. An empty conversation shows a brief prompt. It does not restore administrative messages or require goal, milestone, check or request-review steps.

## Credentials and native actions

Use **KAFE: Configure Provider Key** to enter a DeepSeek key in the masked native input. The key stays in VS Code SecretStorage. A missing key exposes a contextual Configure action. Cancelling preserves the draft; successful configuration does not send automatically. **KAFE: Clear Provider Key** deletes the stored key from SecretStorage. Never put credentials in chat.

**Run main.kf**, beside the composer, identifies its bound target. **KAFE: Run File** and Ctrl+F5 (Cmd+F5 on macOS) run the active eligible editor. Run requires trust and a saved file; cancelling a save leaves it unrun. Interactive input and output use the native terminal. The Run message provides bounded output and **Open terminal**. Stop interrupts the provider response independently of Run.

A proposed edit exposes **Review change**, **Apply**, and **Dismiss**. Review opens VS Code's native diff; Apply requires that review and matching source identity, version and content hash. A changed source prevents the edit. Applying an edit never starts Run. Provider tools cannot execute programs.

## Retention and limits

The host keeps conversation, drafts, selected files, requests and Run output in memory. Hiding or recreating the view preserves that live state. **New conversation**, in the view title menu, clears it; restarting the extension host also discards it. Neither operation erases legacy progress or the provider key. Existing legacy progress remains untouched and is not added to messages or provider context. **KAFE: Clear Tutor Progress** separately requests confirmation to delete legacy records while preserving live chat and credentials.

Follow-ups include at most eight eligible completed learner/assistant pairs within 32 KiB of UTF-8 text, omitting whole pairs when necessary. Failed and interrupted attempts are excluded. Source removal, revoked authorization or changed knowledge lineage exclude dependent history. Source snapshots are bounded to 64 KiB each and Run output to 1 MiB. The provider retains four permitted tools, four calls per round and four rounds per turn. Old discussion is not current execution evidence. Transcripts, keys, source bytes, requests and raw transport errors are not persisted or logged by the Tutor.

## Runtime and knowledge

The managed runtime is pinned to KAFE 0.1.0 and uv 0.11.3. Its release remains unpublished, so **KAFE: Install Runtime** reports unavailable and downloads nothing. When a release is published, setup requires explicit consent before its first download. Ordinary conversation with a configured provider can proceed without an executable runtime or knowledge pack; requests disclose unavailable knowledge. Available validated cached knowledge can be used independently of executable readiness. Invalid or changed knowledge must never be represented as valid grounding.

Contributor Run can use a prepared KAFE checkout and installed tools. An Extension Development Host can use an explicitly validated development knowledge pack. Production installations do not read a development checkout as a fallback. These development paths do not establish managed-release readiness. Supported managed targets are Windows x64, macOS x64/arm64 and Linux x64.

## Local verification

From `kafe-vscode`, use `npm.cmd run test:unit` and `npm.cmd run test:extension`. Host tests require the cached VS Code 1.96.0 executable and use isolated trusted and restricted profiles; they do not download it. `node test/native/acceptance.cjs <evidence-directory>` runs bounded Windows native acceptance with the cached host and deterministic services. `node test/verify-vsix.js <vsix-path>` validates packaged assets and rejects development, secret and retired workflow files. The local installed `vsce` packager can build a VSIX for inspection without installation.

Deterministic tests do not establish real DeepSeek behavior, published runtime readiness or learning efficacy. Synthetic IME and accessibility-tree checks do not prove physical Windows IME operation or screen-reader speech. Native evidence must report actual measured geometry, including any small-window zoom clamp.
