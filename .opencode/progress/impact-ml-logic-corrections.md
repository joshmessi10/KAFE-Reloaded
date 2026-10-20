# Impact Analysis: Gesha and Machine logical corrections

## Affected Modules

- `src/lib/KafeGESHA/models_v2.py` and Dense, Conv2D, SimpleRNN, Dropout layers.
- `src/lib/KafeMACHINE/metrics.py`, AdaBoost, GradientBoostingClassifier, AgglomerativeClustering.
- Exact-output fixtures, regression tests, public learning pages, concept record.

## Risks

- Corrected loss and metric values differ from old snapshots; compare predictions and only refresh affected values.
- Changed boosting optimization can alter predictions; verify both orientations and class imbalance with behavioral tests.
- Seeded Dropout must vary masks across epochs while remaining reproducible between identical instances.

## Compatibility Impact

- Function signatures and KAFE grammar stay unchanged. Metric values and invalid-input behavior change to match the documented mathematical contracts.
- Training loss now includes the existing scalar L2 penalty where Dense, Conv2D, or SimpleRNN already optimize it.

## Documentation and Testing Impact

- Update Machine metrics and boosting guides, Gesha training guide, classification metric concept, and project history.
- Run focused counterexample tests, KAFE fixture suites, Ruff, and strict MkDocs build.

## Implementation Plan

1. Correct formulas and edge-case checks in the existing implementations.
2. Add small regression tests reproducing each observed issue.
3. Refresh only snapshots whose numeric values changed and confirm non-loss outputs match.
4. Run focused and broad verification; inspect the final diff.
