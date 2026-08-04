---
description: Benchmark an ML algorithm, DL component, or performance optimization. Generates the record from the template, executes the benchmark to measure runtime and memory, and registers the results. The Tester role runs this command.
---

Benchmark an ML algorithm, DL component, or performance optimization. The **Tester** role runs this command when a benchmarkable component is added or changed (see AGENTS.md — Automatic Actions).

## Process

1. Confirm the trigger: an ML algorithm, DL component, or performance optimization is being added or changed.
2. Read `.opencode/benchmarks/template.md` for the record format.
3. Fill the header: Date, Component, Category, Purpose.
4. Run the benchmark and measure real values:
   - Execute the component on a representative workload (a `.kf` program or a Python harness) and record **runtime** and **memory**.
   - Record the **dataset**, **hardware**, and **environment** used (reproducibility).
   - If a baseline exists, record **comparison results** vs the previous run/version.
5. Fill in Results and Conclusions with the measured values.
6. Add the completed record to `.opencode/benchmarks/records.md` (consolidated file).
7. Update the index table in `records.md` with the new benchmark entry.

## Output

- A completed benchmark section in `.opencode/benchmarks/records.md` with real measurements.
- An updated index table in `records.md`.
- A note in `.opencode/memory/technical-debt.md` or a history record if a regression is found.
