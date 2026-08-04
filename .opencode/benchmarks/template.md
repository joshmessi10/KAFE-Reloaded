# Benchmark Template

Use for ML algorithms, DL components, and performance optimizations (see `.opencode/knowledge/engineering.md` — Benchmark Process).
Save as `.opencode/benchmarks/benchmark-<component>.md` and register it in `benchmark-index.md`.

# Benchmark: <Component>

- **Date**: YYYY-MM-DD
- **Component**: <src/lib/... module>
- **Category**: ML algorithm / DL component / performance optimization
- **Purpose**: <what is measured and why>

## Setup

- **Dataset**: <dataset or workload description>
- **Hardware**: <CPU/GPU, RAM>
- **Environment**: <Python version, OS, dependency versions>

## Methodology

- <reproducible steps: how the benchmark is run, iterations, warmup, metrics captured>

## Results

| Metric | Value |
|--------|-------|
| Runtime | <seconds / ms> |
| Memory | <MB / peak> |
| Dataset | <dataset and size used> |
| Hardware | <hardware the run used> |
| Comparison results | <vs baseline or previous version> |

## Conclusions

- <findings, regressions, performance notes>

## Related

- Related tests, ADR records, docs, or knowledge concepts.
