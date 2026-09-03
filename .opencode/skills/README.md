# Skills

Reusable engineering workflows for KAFE. Skills are loaded by opencode from `.opencode/skills/<name>/SKILL.md`.

## Convention

Each skill is a directory named after the skill containing a `SKILL.md` with frontmatter:

```markdown
---
name: <skill-name>
description: One sentence: what it does AND when to trigger it.
---
```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `impact-analysis/` | Run impact analysis before adding ML/DL components, changing public APIs, refactoring the interpreter, or modifying grammar |
| `add-ml-algorithm/` | Add a new ML algorithm to KafeMACHINE from scratch, with fixtures, docs, and benchmarks |
| `add-dl-layer/` | Add a new DL layer/component to KafeGESHA from scratch, with fixtures, docs, and benchmarks |
| `modify-grammar/` | Change grammar rules/tokens, regenerate the parser, and keep the spec and fixtures in sync |
| `create-library/` | Add a new built-in library (`src/lib/KafeXXX`) and register it in `self.libraries` |
| `create-adr/` | Create an ADR record for an important engineering decision |
| `release-checklist/` | Verify release readiness: tests, parser, docs, history, benchmarks, Definition of Done |

## Adding a Skill

1. Create `.opencode/skills/<name>/SKILL.md`.
2. Keep the frontmatter `name` lowercase and hyphen-separated, matching the folder name.
3. Write the workflow as step-by-step instructions referencing `.opencode/knowledge/` where relevant.
4. Before creating a new skill, search existing skills and reuse or extend them when possible (see OPENCODE.md — Skills Usage Rule).
