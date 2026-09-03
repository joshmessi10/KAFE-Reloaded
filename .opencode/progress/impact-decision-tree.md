# Impact Analysis — Decision Tree Classifier for KafeMACHINE

**Date:** 2026-08-04
**Status:** Analysis Complete

## Affected Modules

### Files to Create

- `src/lib/KafeMACHINE/DecisionTree.py` — DecisionTreeClassifier class extending BaseMachine
- `tests/KafeMACHINE/tree_models/` — test fixture directory
- `tests/KafeMACHINE/tree_models/test_decision_tree_basic.kf` + `.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_multiclass.kf` + `.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_entropy.kf` + `.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_params.kf` + `.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_score.kf` + `.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_not_fitted.error.kf` + `.error.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_empty.error.kf` + `.error.expec`
- `tests/KafeMACHINE/tree_models/test_decision_tree_depth_limit.kf` + `.expec`
- `.opencode/knowledge/concepts/decision-tree.md`

### Files to Modify

- `src/lib/KafeMACHINE/funciones.py` — add `decision_tree_classifier()` factory + import
- `src/lib/KafeMACHINE/__init__.py` — add `from .DecisionTree import DecisionTreeClassifier`
- `tests/test_KafeMACHINE.py` — add `"tree_models"` to SUBDIRS
- `.opencode/knowledge/ml-library.md` — update Structure, Public API, Tests
- `.opencode/progress/roadmap.md` — mark Decision Tree as done

### Files NOT Affected

- Grammar files (no changes needed)
- EvalVisitorPrimitivo.py (machine library already registered)
- TypeUtils.py, global_utils.py, BaseMachine.py

## Risks

| Risk | Mitigation |
|------|------------|
| Slow pure Python tree on large data | Default max_depth=10, document perf |
| Gini/Entropy edge cases (zero probs) | Guard log(0), test pure nodes |
| Recursion limit on deep trees | Default max_depth=10 is safe |
| Split correctness | Validate with known datasets |

## Compatibility Impact

- New factory function (additive, no breaking changes)
- Same API: fit(X, y), predict(X), score(X, y)
- No grammar changes, no new keywords

## Testing Impact

- 8 fixture pairs (valid + error tests)
- Wire into test_KafeMACHINE.py SUBDIRS

## Implementation Plan

1. Create DecisionTree.py with _Node, _gini, _entropy, _best_split, _build_tree, _predict_one, fit, predict, score
2. Add factory function to funciones.py
3. Add import to __init__.py
4. Create test fixtures in tree_models/
5. Wire tests in test_KafeMACHINE.py
6. Update ml-library.md
7. Create concept record
8. Run full test suite
