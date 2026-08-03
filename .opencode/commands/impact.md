---
description: Execute the KAFE Impact Analysis workflow: identify affected modules, risks, compatibility/documentation/testing impact, and produce an implementation plan.
---

Execute the KAFE Impact Analysis workflow. It is mandatory before adding ML algorithms, adding DL components, modifying public APIs, refactoring core interpreter components, or modifying grammar rules (AGENTS.md — Impact Analysis).

## Process

1. Read the relevant `.opencode/knowledge/` documents (`architecture.md`, `ml-library.md`, `dl-library.md`, `libraries.md`, `language-spec.md`).
2. Read `.opencode/memory/` and `.opencode/progress/` for current state and priorities.
3. Use `.opencode/templates/impact-analysis.md` and fill in: affected modules, risks, compatibility impact, documentation impact, testing impact, and the implementation plan.

## Output

Report the impact analysis in the standard response format: Theory, Analysis, Impact, Plan, Implementation, Validation, Documentation, Next Steps. The Impact section must list affected modules and risks; the Plan section must include the verification steps.
