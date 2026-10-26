# KAFE Tutor product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Learners writing, understanding and validating KAFE programs in VS Code.

## Product Purpose

KAFE is an educational DevKit with `.kf` editing, highlighting, snippets, explicit native execution and a conversational Tutor. Concept explanations, learner reasoning and requested options belong in dialogue. Typed checkpoints support learner-first design, one scoped proposal preparation, native Review/Apply and separate Run.

## Operating Context

One active sidebar conversation and one composer, with saved conversations scoped to the current VS Code workspace. Enter or Send submits once and streams one answer. Compact metadata identifies file context; optional files require inclusion. Stop replaces Send during a response while the next draft stays editable. Native title actions and the Command Palette provide New, Switch, Rename, Delete and Export; the view description identifies the active conversation. Credentials, diffs and terminals use native VS Code controls.

## Capabilities and Constraints

- Plain HTML/CSS/JavaScript webview and JavaScript host; minimum VS Code `^1.96.0`.
- Send captures the submitted message, eligible history and visibly authorized context; the host checks sources and knowledge before transmission. Typing does not retrieve knowledge or contact the provider.
- Restricted Mode permits message-only chat while excluding workspace files, edits and Run. Provider tools cannot execute programs or apply edits.
- Missing executable runtime or knowledge does not block ordinary configured-provider conversation; unavailable knowledge is disclosed. Validated cached knowledge has independent availability.
- Extension 2.3.0 includes reviewed version-matched MACHINE/GESHA contracts, documentation and examples before runtime installation, including message-only Restricted Mode. Exact API names and English/Spanish concepts select bounded complete reference units; bundled lookup does not require a ready managed knowledge pack. Unsupported/limited behavior stays explicit. Complete reference coverage does not establish model-answer correctness or learning efficacy.
- Reference selection shares a 12 KiB budget between library material and fixture examples. Library selection uses at most three units and 8 KiB, with each admitted unit at most 6 KiB. Knowledge tool lookup uses at most five units and 12 KiB. Programs, signatures and fenced code remain whole; oversized units are omitted. Current bundled MACHINE/GESHA material takes precedence over old managed library narratives.
- DeepSeek configuration, SecretStorage, bounded context/output and native diff guards remain. Apply requires a reviewed current proposal and never starts Run.
- Confirmation adopts a Tutor-proposed checkpoint; it does not establish authorship, understanding or mastery. Discuss/Skip confer no grant. Native optional learning levels offer Beginner (default), Intermediate and Expert as complete teaching presets. A separate Pause/Resume Teaching command preserves the selected level; busy changes queue until settlement. Levels describe guidance preferences, not measured ability.
- Exact target/scope permission admits one proposal preparation. Missing keys, failure or cancellation require fresh permission; Review, Apply and Run remain separate.
- Host-observed staging, Apply and Run facts retain source/knowledge dependencies. Saved-source boundary equality and zero exit do not prove executed bytes or correctness; unavailable comparisons remain unknown.
- Conversation transcripts, drafts, completed history and learning level/mode are saved locally per workspace, with a 250 ms autosave debounce and restoration of the last selected conversation across restarts. New preserves the previous conversation and starts with guided Beginner preferences; returning to a saved conversation restores its own draft and preferences.
- One live session owns all native authority. Changing conversations stops a streaming response and retains its partial text as cancelled. A current Apply must finish first. Source selection, transient learning decisions/observations, pending proposals, request snapshots and action/output evidence are cleared on transition or restart. Historical checkpoint/proposal summaries remain readable and inert; current authorization is required for new actions. Independently running programs retain their terminal owner.
- The local archive is limited to 200 conversations, 4 MiB per conversation and 16 MiB total, without silent eviction. Its full transcript is separate from the eight eligible completed pairs / 32 KiB provider context window. Malformed saved data is preserved and the current chat is marked temporary; failed writes keep the current chat live and report the failure.
- Export saves the selected conversation as versioned UTF-8 JSON through a native Save dialog, including complete visible messages, statuses and safe summaries. It omits draft, preferences, provider history/dependencies, source metadata and executable handles. Message text and code entered by the learner remain part of saved/exported content. Export has a separate 16 MiB bound and does not stop the response.
- Credentials remain in SecretStorage; attached source snapshots, raw requests, private Run evidence and raw transport errors are excluded from the conversation archive and export. Existing legacy progress remains separate from saved conversations and model context; confirmed legacy clearing preserves live chat and credentials.
- The managed runtime remains separately published, checksum-pinned KAFE 0.3.0 with uv 0.11.3 and Python 3.11 or newer. Trusted activation can prepare it automatically; preparation grants no permission to run learner code. Updated managed corpus packaging requires a future versioned release. Deterministic services do not prove real-provider behavior, physical IME, screen-reader speech or learning efficacy.

## Brand Commitments

Preserve KAFE identity. The pinned Kilo extension is the visual and interaction authority for the conversation layout, reading lane, inset composer and status dock. The pinned VibeWise learning policy supplies learner-first engineering decisions, direct concept explanations and optional onboarding. Pinned references: Kilo `ccb6673bf501b1d64ed3711e97d8572128298fa7`; VibeWise `1135f4ae8205da78404a71e85f567d5911da4e4d`. Kilo source inspection supplies composition guidance; its mapped `vscode-bridge.css` is absent at this revision. The sibling clone has no dependencies, build or installed extension, so actual paired reference captures remain unavailable. Rendered similarity and teaching efficacy remain unverified.

## Evidence on Hand

The approved conversation simplification supersedes the historical pure-chat workflow. Unit, trusted/restricted host, native-webview and archive gates provide distinct bounded evidence. Native measurements must state actual widths and zoom clamps rather than infer acceptance. Real-provider and managed-install release acceptance remain separate.

Library coverage joins the intended pinned public API inventory to reviewed positional contracts, source-bound receiver members and actual KAFE evidence. The intended top-level surface is 58 MACHINE functions, 56 GESHA wrappers and five activation aliases. The unavailable GESHA `l1_l2_regularizer` binding has negative evidence and an explicit limitation; it is not promoted to a working API. Dependency audits and native/managed-install acceptance remain separate release gates, regardless of reference completeness.

Eight bundled conceptual topics align practice support with the study proposal. The Tutor should explain first, use grounding quietly, interpret actual authorized results and keep practical choices with the learner. Positive-class sensitivity differs from macro recall. Pre/post answers and research scoring are not production content; source-changed results stay historical, and transcript analysis requires separate consent. The alignment guide records the unfinished human instruments and the distinction between deterministic checks and empirical learning outcomes.

## Product Principles

- Keep one message submission and one streamed response.
- Make included file context clear before submission.
- Keep execution, credentials, edits and legacy deletion under explicit authority.
- Preserve drafting, focus, reading position and selection during streaming.
- Keep conversations independent, durable within their workspace, and exportable through native file controls.
- Treat execution results as evidence, not proof of understanding.

## Accessibility & Inclusion

Keyboard traversal, multiline IME-safe input, stable focus and selection, scroll preservation, narrow sidebars, enlarged text, VS Code light/dark/high-contrast tokens and reduced-motion preferences are requirements. Status announcements describe response activity without announcing every token.
