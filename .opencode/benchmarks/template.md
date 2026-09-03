# Benchmark Template

Use for ML algorithms, DL components, and performance optimizations (see `.opencode/knowledge/engineering.md` — Benchmark Process).
Save as `.opencode/benchmarks/benchmark-<component>.md` and register it in `records.md`.

# Benchmark: <Component>

- **Date**: YYYY-MM-DD
- **Component**: <src/lib/... module>
- **Category**: ML algorithm / DL component / performance optimization
- **Purpose**: <what is measured and why>

## Setup

- **Hardware**: <CPU/GPU, RAM>
- **Environment**: <Python version, OS, dependency versions>

## Test Scenarios (Minimum 5 Required)

Each benchmark MUST include at least 5 test scenarios that are reliable and sensible.

### Scenario 1: Small Dataset
- **Purpose**: Verify basic functionality
- **Dataset**: 10-50 samples, 2-3 features
- **Expected**: Correct output, no errors
- **Metrics**: Runtime, accuracy/output correctness

### Scenario 2: Medium Dataset
- **Purpose**: Verify performance characteristics
- **Dataset**: 100-500 samples, 5-10 features
- **Expected**: Reasonable runtime (< 1s), correct output
- **Metrics**: Runtime, memory, accuracy

### Scenario 3: Edge Cases
- **Purpose**: Verify robustness
- **Cases**: Empty input, single sample, single feature, all-same values
- **Expected**: Graceful handling, appropriate errors
- **Metrics**: Error handling, no crashes

### Scenario 4: Multi-class/Multi-feature
- **Purpose**: Verify scalability
- **Dataset**: 3+ classes, 10+ features, 200+ samples
- **Expected**: Correct classification/regression, reasonable runtime
- **Metrics**: Runtime, memory, accuracy, class balance

### Scenario 5: Stress Test
- **Purpose**: Verify performance limits
- **Dataset**: 1000+ samples or extreme parameters (max_depth, large k, etc.)
- **Expected**: Completes without crash, documents performance characteristics
- **Metrics**: Runtime, memory, accuracy degradation

## Results

| Scenario | Dataset Size | Features | Runtime | Memory | Accuracy | Status |
|----------|-------------|----------|---------|--------|----------|--------|
| Small | N | d | t | m | a | ✓/✗ |
| Medium | N | d | t | m | a | ✓/✗ |
| Edge | N | d | t | m | a | ✓/✗ |
| Multi-class | N | d | t | m | a | ✓/✗ |
| Stress | N | d | t | m | a | ✓/✗ |

## Conclusions

- <findings for each scenario>
- <overall assessment>
- <recommendations for production use>

## Related

- Tests, ADR records, docs, knowledge concepts.
