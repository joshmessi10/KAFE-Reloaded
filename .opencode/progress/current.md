# Current Work

| Field | Value |
|-------|-------|
| Feature | Update README.md to reflect current KafeMACHINE capabilities |
| Status | done |
| Current step | Edited README.md: added DecisionTree model row, added OrdinalEncoder to preprocessing/encoder list. Verified table consistency with source and docs. |
| Next step | None |
| Blockers | None |
| Related ADRs | |

## Implementation Summary

Updated the primary repository README.md to accurately reflect current KafeMACHINE capabilities:

### Changes made
- Added **DecisionTreeClassifier** row to MACHINE models table with factory `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` and description.
- Added **OrdinalEncoder** row to MACHINE models table alongside LabelEncoder and OneHotEncoder, with factory `machine.ordinal_encoder()` and description.
- Verified consistency with `src/lib/KafeMACHINE/funciones.py` and `docs/bibliotecas/machine.md`.
- Preserved existing Spanish style and did not remove unrelated sections.

### Files modified
- `README.md` (MACHINE models table updated)

### Verification
- Re‑read edited sections to confirm correct markdown formatting and content alignment.