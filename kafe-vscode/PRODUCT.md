# KAFE Tutor product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Learners writing, understanding and validating KAFE programs in VS Code.

## Product Purpose

KAFE is an educational DevKit with `.kf` editing, highlighting, snippets, explicit native execution and a conversational Tutor. Hints, goals, explanations, requested summaries and direct answers belong in dialogue.

## Operating Context

One sidebar conversation and one composer. Enter or Send submits once and streams one answer. Compact metadata identifies file context; optional files require inclusion. Stop replaces Send during a response while the next draft stays editable. New conversation is a secondary view-title action. Errors, proposals and Run results appear only when relevant. Credentials, diffs and terminals use native VS Code controls.

## Capabilities and Constraints

- Plain HTML/CSS/JavaScript webview and JavaScript host; minimum VS Code `^1.96.0`.
- Send captures the submitted message, eligible history and visibly authorized context; the host checks sources and knowledge before transmission. Typing does not retrieve knowledge or contact the provider.
- Restricted Mode permits message-only chat while excluding workspace files, edits and Run. Provider tools cannot execute programs or apply edits.
- Missing executable runtime or knowledge does not block ordinary configured-provider conversation; unavailable knowledge is disclosed. Validated cached knowledge has independent availability.
- DeepSeek configuration, SecretStorage, bounded context/output and native diff guards remain. Apply requires a reviewed current proposal and never starts Run.
- Conversation, draft, source selection, requests and output are memory-only. New conversation and host restart discard ephemeral state. Existing legacy progress is preserved without entering chat or model context; confirmed legacy clearing is independent of live chat and credentials.
- The managed runtime release remains unpublished. Deterministic services do not prove real-provider or release readiness, physical IME, screen-reader speech or learning efficacy.

## Brand Commitments

Preserve KAFE identity. Kilo is a behavior reference for composer, context and conversation boundaries; its framework, branding, assets, services, telemetry and autonomous features are outside scope.

## Evidence on Hand

The approved conversation simplification supersedes the historical pure-chat workflow. Unit, trusted/restricted host, native-webview and archive gates provide distinct bounded evidence. Native measurements must state actual widths and zoom clamps rather than infer acceptance. Real-provider and managed-install release acceptance remain separate.

## Product Principles

- Keep one message submission and one streamed response.
- Make included file context clear before submission.
- Keep execution, credentials, edits and legacy deletion under explicit authority.
- Preserve drafting, focus, reading position and selection during streaming.
- Treat execution results as evidence, not proof of understanding.

## Accessibility & Inclusion

Keyboard traversal, multiline IME-safe input, stable focus and selection, scroll preservation, narrow sidebars, enlarged text, VS Code light/dark/high-contrast tokens and reduced-motion preferences are requirements. Status announcements describe response activity without announcing every token.
