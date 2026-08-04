# Benchmark Records

This file consolidates all benchmark records for KAFE. Individual benchmark files have been merged here to reduce file accumulation.

## Benchmark Index

| Benchmark | Component | Category | Date | Status |
|-----------|-----------|----------|------|--------|
| (none yet) | | | | |

## Adding a Benchmark

When the Tester runs `/benchmark`:

1. Determine the component category (ML algorithm, DL component, performance optimization)
2. Add a new section to this file using the format below
3. Update the index table above with the new benchmark

### Benchmark Entry Format

Within this file, use this format for each benchmark:

```markdown
---

### Benchmark: <Component Name>

- **Date**: YYYY-MM-DD
- **Component**: `src/lib/...` module
- **Category**: ML algorithm / DL component / performance optimization
- **Purpose**: <what is measured and why>

#### Setup

- **Dataset**: <dataset or workload description>
- **Hardware**: <CPU/GPU, RAM>
- **Environment**: <Python version, OS, dependency versions>

#### Methodology

- <reproducible steps: how the benchmark is run, iterations, warmup, metrics captured>

#### Results

| Metric | Value |
|--------|-------|
| Runtime | <seconds / ms> |
| Memory | <MB / peak> |
| Dataset | <dataset and size used> |
| Hardware | <hardware the run used> |
| Comparison | <vs baseline or previous version> |

#### Conclusions

- <findings, regressions, performance notes>

#### Related

- Related tests, ADR records, docs, or knowledge concepts.
```

### Rules

- Each benchmark targets one component under `src/lib/`
- Measure time and/or memory on representative workloads
- Be reproducible: record dataset, hardware, environment, and methodology
- Update the index table after adding a new benchmark
- Keep related references up to date
