---
description: Generate a benchmark skeleton for an ML algorithm, DL component, or performance optimization.
---

Generate a benchmark skeleton.

## Process

1. Confirm the trigger: an ML algorithm, DL component, or performance optimization is being added or changed (AGENTS.md — Automatic Actions).
2. Copy `.opencode/benchmarks/template.md` to `.opencode/benchmarks/benchmark-<component>.md`.
3. Fill the header: Date, Component, Category, Purpose.
4. Provide placeholders for Setup (Dataset, Hardware, Environment), Methodology, Results (Runtime, Memory, Dataset, Hardware, Comparison results), and Conclusions.
5. Register the record in `.opencode/benchmarks/benchmark-index.md` with its status.

## Output

- A benchmark skeleton under `.opencode/benchmarks/`.
- A row in `.opencode/benchmarks/benchmark-index.md`.
