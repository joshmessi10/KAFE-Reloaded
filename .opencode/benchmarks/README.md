# Benchmarks

Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations (see AGENTS.md — Automatic Actions and `.opencode/knowledge/engineering.md`).

## Files

| File | Purpose |
|------|---------|
| `template.md` | Benchmark record template (for reference) |
| `records.md` | Consolidated benchmark records (all benchmarks in one file) |
| `README.md` | This file |

## Rules

- Each benchmark targets a named ML/DL component or measured performance path, including extension conversation ownership where applicable
- Measure time and/or memory on representative workloads
- Be reproducible: record dataset, hardware, environment, and methodology
- All benchmarks go in `records.md` — no individual benchmark files

## Adding a Benchmark

Run via `/benchmark` (the Tester role) after adding an ML algorithm, DL component, or performance optimization:

1. Read `.opencode/benchmarks/template.md` for the format
2. Run the benchmark, record results (runtime, memory, dataset, hardware, comparison)
3. Add a new section to `.opencode/benchmarks/records.md`
4. Update the index table in `records.md`

Current records include ML/DL baselines and the controlled extension conversation profile; consult the index in `records.md`. Record measured revision and limits rather than treating synthetic timings as native/product latency.
