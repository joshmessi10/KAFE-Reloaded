# Benchmarks

Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations (see AGENTS.md — Automatic Actions and `.opencode/knowledge/engineering.md`).

## Files

| File | Purpose |
|------|---------|
| `template.md` | Benchmark record template (ML algorithms, DL components, performance optimizations) |
| `benchmark-index.md` | Index of all benchmark records |
| `benchmark-<component>.md` | One record per benchmarked component |

## Rules

- Each benchmark targets one component under `src/lib/`.
- Measure time and/or memory on representative workloads.
- Be reproducible: record dataset, hardware, environment, and methodology.
- Register every record in `benchmark-index.md`.

## Adding a Benchmark

Run via `/benchmark` (the Tester role) after adding an ML algorithm, DL component, or performance optimization:

1. Copy `.opencode/benchmarks/template.md` → `benchmark-<component>.md`.
2. Run the benchmark, record results (runtime, memory, dataset, hardware, comparison).
3. Add a row to `.opencode/benchmarks/benchmark-index.md`.

Current benchmarks: none yet.
