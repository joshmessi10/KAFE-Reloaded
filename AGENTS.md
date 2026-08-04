# AGENTS.md

Engineering constitution for the KAFE engineering system. This file defines what KAFE is and the rules agents must follow. **OPENCODE.md is the primary entry point** (operating manual); the persistent engineering system (knowledge, memory, history, planning, ADR, benchmarks, skills, commands) lives under `.opencode/`.

# How to Use This Document

AGENTS.md is both the **constitution** (non-negotiable rules) and a **navigation map**. Use progressive disclosure: read the section you need when you need it — do not treat it as a bible to consume end-to-end. Process detail lives in `.opencode/knowledge/engineering.md`; reusable workflows live in `.opencode/skills/`.

Read before deciding, in this order: `.opencode/knowledge/` → `.opencode/memory/` → `.opencode/history/` → `.opencode/progress/`.

| If you are… | Read |
|---|---|
| Starting a session | `/init` (validate the system) + Session Recovery → `/resume` |
| Resuming a session | Session Recovery → `/resume` |
| Opening a new work item | `/open-work` (+ `/impact` if the item is significant) |
| Closing a session | Session Closure Process → `/close` |
| Adding an ML algorithm or DL component | Impact Analysis + `.opencode/knowledge/ml-library.md` / `dl-library.md` → `/impact` |
| Changing public APIs or refactoring the core interpreter | Impact Analysis → `/impact` |
| Adding a new library | Impact Analysis → `/impact` + `.opencode/skills/create-library/` |
| Changing grammar or tokens | Impact Analysis + `.opencode/skills/modify-grammar/` |
| Completing a task | Definition of Done → `/dod` |
| Releasing or tagging | Definition of Done → `/dod` + `.opencode/skills/release-checklist/` |

# Mission

KAFE is a DSL focused on education, machine learning, and deep learning.

The objective of this engineering system is to evolve KAFE while preserving:

- Simplicity
- Consistency
- Documentation
- Performance
- Long-term project knowledge

Every important change must be understandable, traceable, and documented.

# Engineering Workflow

Before implementing any significant change:

1. Understand the current implementation.
2. Read relevant documentation.
3. Perform Impact Analysis.
4. Produce an implementation plan.

After implementation:

1. Run tests.
2. Validate behavior.
3. Update documentation.
4. Update project history.
5. Verify Definition of Done.

# Repository Knowledge Map

Project knowledge is stored in the knowledge layer. Consult it before making decisions.

| Path | Purpose |
|------|---------|
| `.opencode/knowledge/` | How KAFE works: `architecture.md`, `conventions.md`, `verifications.md`, `language-spec.md`, `ml-library.md`, `dl-library.md`, `libraries.md`, `engineering.md` |
| `.opencode/knowledge/concepts/` | Concept records (template: `.opencode/knowledge/concepts/concept-template.md`) |
| `.opencode/memory/` | Session-to-session context: `current-state.md`, `active-work.md`, `technical-debt.md`, `known-issues.md`, `context.md` |
| `.opencode/history/` | Significant project events by year (consolidated monthly: `YYYY/YYYY-MM.md`) |
| `.opencode/progress/` | Planning: `roadmap.md`, `backlog.md`, `milestones.md`, `current.md`, `session-log.md`, `session-commands.md` |
| `.opencode/adr/` | Engineering decisions (consolidated: `decisions.md`, template: `.opencode/adr/template.md`) |
| `.opencode/benchmarks/` | Performance benchmarks (consolidated: `records.md`, template: `.opencode/benchmarks/template.md`) |
| `.opencode/skills/` | Reusable engineering workflows (`impact-analysis`, `add-ml-algorithm`, `add-dl-layer`, `modify-grammar`, `create-library`, `create-adr`, `release-checklist`) |
| `.opencode/commands/` | Custom project commands (`/init`, `/resume`, `/open-work`, `/impact`, `/adr`, `/benchmark`, `/dod`, `/close`) |
| `.opencode/templates/` | Reusable project templates: `impact-analysis.md`, `dod-checklist.md`, `benchmark-template.md`, `session-recovery.md` |

Consult information in this order before deciding: `.opencode/knowledge/` → `.opencode/memory/` → `.opencode/history/` → `.opencode/progress/`. Do not invent architecture, APIs, or conventions if they are already documented.

### Operational Files

Session state (`.opencode/memory/`):

- `current-state.md` — architecture status, current milestone, priorities, blockers.
- `active-work.md` — active feature, current step, next step, expected outcome.
- `technical-debt.md` — debt items, cost, risk, proposed resolution.
- `known-issues.md` — known bugs, limitations, workarounds.
- `context.md` — project context, assumptions, engineering notes.

Progress (`.opencode/progress/`):

- `roadmap.md` — long-term roadmap.
- `backlog.md` — prioritized task list.
- `milestones.md` — major project milestones.
- `current.md` — current work tracking (feature, status, current/next step, blockers, related ADRs).
- `session-log.md` — append-only bitácora of closed sessions (written by `/close`).

# Impact Analysis

Impact Analysis is mandatory before:

- Adding ML algorithms.
- Adding DL components.
- Modifying public APIs.
- Refactoring core interpreter components.
- Modifying grammar rules.

Process: `.opencode/knowledge/engineering.md` (Impact Analysis Process).

# Agent Roles

## Architect

Responsible for:

- System design
- Impact analysis
- ADR generation

## Builder

Responsible for:

- Implementation
- Refactoring
- Feature development

## Reviewer

Responsible for:

- Quality
- Consistency
- Maintainability

Runs `/dod` before a task is declared complete.

## Historian

Responsible for:

- History updates
- Knowledge updates
- Project memory

## Tester

Responsible for:

- Validation
- Tests
- Benchmarks

Runs `/benchmark` for ML/DL components and performance changes.

# Automatic Actions

Automatically create an ADR when:

- Architecture changes.
- Public APIs change.
- Important engineering decisions are made.

Automatically create benchmarks when:

- ML algorithms are added.
- DL components are added.
- Performance optimizations are implemented.

Automatically update project history after significant changes.

ADR generation should be automatic and should not require explicit user requests.

The engineering system is responsible for determining when these artifacts are necessary.

Template: `.opencode/adr/template.md`. Processes: `.opencode/knowledge/engineering.md`.

# Project Memory Responsibilities

When a significant feature is implemented:

- Update `.opencode/history/`.
- Update `.opencode/knowledge/`.
- Update `.opencode/progress/` if roadmap or milestones change.

When a new concept is introduced:

- Create or update the corresponding file in `.opencode/knowledge/concepts/`.

When a significant engineering decision is made:

- Create or update ADR records.

# Definition of Done

A task is not complete unless:

- Implementation exists.
- Validation passed.
- Tests passed.
- Documentation updated.
- History updated.

When applicable:

- Benchmark exists.
- ADR exists.
- Examples exist.

# Response Standards

Never respond with only: "Done", "Fixed", "Completed".

For significant tasks always provide:

1. **Theory** — underlying concept: what it is, why it exists, how it works, advantages/limitations, relationship with the KAFE implementation.
2. **Analysis** — current state.
3. **Impact** — affected modules and risks.
4. **Plan** — proposed implementation.
5. **Implementation** — changes performed.
6. **Validation** — tests and verification.
7. **Documentation** — files updated.
8. **Next Steps** — remaining work.

Standards: `.opencode/knowledge/engineering.md` (Educational Response Standards).

# Session Recovery

When resuming work, use the Repository Knowledge Map to reconstruct project state:

1. Read `.opencode/knowledge/` — how KAFE works and how engineering processes run.
2. Read `.opencode/memory/` — session-to-session context.
3. Read recent `.opencode/history/` — significant project events.
4. Read active `.opencode/progress/` — roadmap, backlog, milestones, and current work.
5. Reconstruct project state before proposing changes.

Session recovery should produce:

- Current project status.
- Active work.
- Pending work.
- Relevant historical context.
- Blockers.
- Recommended next steps.

Process: `.opencode/knowledge/engineering.md` (Session Recovery Process). Run `/resume` to reconstruct state on demand.

# Progress Sources

Project planning is maintained in:

- `.opencode/progress/roadmap.md`
- `.opencode/progress/backlog.md`

Do not store active roadmap information inside AGENTS.md.

# Dependency Policy

Dependencies are forbidden by default.

Before introducing a new dependency, verify that the functionality cannot be implemented using:

1. Existing KAFE libraries.
2. Existing KAFE modules.
3. Python built-in functionality.

External dependencies require explicit justification.

For machine learning and deep learning implementations, importing external algorithm implementations is prohibited.

Examples:

- Do not use sklearn implementations of algorithms that are being implemented inside KAFE.
- Do not use TensorFlow or PyTorch implementations of layers that are being implemented inside KAFE.

# Educational Response Requirement

KAFE is an educational project.

When implementing algorithms, models, optimizers, metrics, layers, or other ML/DL components, responses must include both:

1. Engineering explanation
2. Theoretical explanation

Theoretical explanations should help understand:

- What the concept is.
- Why it exists.
- How it works.
- Advantages and limitations.
- Relationship with the KAFE implementation.

Do not only describe code changes. Explain the underlying theory behind the implemented concept.

# Source of Truth

Engineering decisions and documentation are authoritative in this order:

1. **ADRs** — `.opencode/adr/` (architectural decisions and public API changes).
2. **Knowledge Layer** — `.opencode/knowledge/` (architecture, conventions, language spec, libraries).
3. **History** — `.opencode/history/` (significant project events).
4. **Progress** — `.opencode/progress/` (roadmap, backlog, milestones, and current work).

When documents conflict, the higher-precedence source wins.
