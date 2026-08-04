---
description: Benchmark an ML algorithm, DL component, or performance optimization with 5 test scenarios. Generates the record from the template, executes the benchmark to measure runtime and memory, and registers the results. The Tester role runs this command.
---

Benchmark an ML algorithm, DL component, or performance optimization. The **Tester** role runs this command when a benchmarkable component is added or changed (see AGENTS.md — Automatic Actions).

## Hard Gate

**Verify `/impact` was executed in this session.** Read `.opencode/progress/session-commands.md`. If `/impact` is not listed as `completed`, **abort** with: "Cannot run benchmark: `/impact` has not been run in this session. Run `/impact` first."

## Process

1. Confirm the trigger: an ML algorithm, DL component, or performance optimization is being added or changed.
2. Read `.opencode/benchmarks/template.md` for the record format (includes 5 required scenarios).
3. Fill the header: Date, Component, Category, Purpose.
4. Run the benchmark with **5 test scenarios** and measure real values:

   **Scenario 1: Small Dataset** (10-50 samples, 2-3 features)
   - Verify basic functionality, no errors
   - Record runtime, accuracy/output correctness

   **Scenario 2: Medium Dataset** (100-500 samples, 5-10 features)
   - Verify performance characteristics
   - Record runtime, memory, accuracy

   **Scenario 3: Edge Cases** (empty input, single sample, single feature, all-same values)
   - Verify robustness and error handling
   - Record error messages, no crashes

   **Scenario 4: Multi-class/Multi-feature** (3+ classes, 10+ features, 200+ samples)
   - Verify scalability
   - Record runtime, memory, accuracy, class balance

   **Scenario 5: Stress Test** (1000+ samples or extreme parameters)
   - Verify performance limits
   - Record runtime, memory, accuracy degradation

5. Fill in Results table with measured values for ALL 5 scenarios.
6. Write Conclusions with findings for each scenario and overall assessment.
7. Add the completed record to `.opencode/benchmarks/records.md` (consolidated file).
8. Update the index table in `records.md` with the new benchmark entry.

## Output

- A completed benchmark section in `.opencode/benchmarks/records.md` with 5 scenarios and real measurements.
- An updated index table in `records.md`.
- A note in `.opencode/memory/technical-debt.md` or a history record if a regression is found.
