# Impact Analysis — Gesha follow-ups: Functional fixture, docs scope, shared metrics

Impact Analysis for the Gesha follow-ups feature (see `.opencode/knowledge/engineering.md` — Impact Analysis Process).

## Affected Modules

- `src/lib/KafeMACHINE/metrics.py` — widen the second `check_sig` type list of the 8 regression metrics plus `roc_auc_score`, and add a private flattening helper.
- `docs/libraries/gesha.md` and `docs/libraries/gesha/models-training.md` — scope statements about metric interoperability.
- New fixtures under `tests/KafeMACHINE/metrics/regression/` and a new `tests/KafeGESHA/functional/` directory.
- `.opencode/adr/decisions.md` — new ADR-0023.
- `src/lib/KafeGESHA/models_v2.py` / `functions_v2.py` are read-only references (batch `predict` returns nested lists; functional API). No change expected.

## Risks

- Widening could accept genuinely multi-output 2-D matrices — mitigated because the flattening helper only accepts single-column rows (inner length 1) and raises a clear error otherwise.
- Backward compatibility — widening is additive; existing flat-vector fixtures must stay green.
- Determinism of newly trained-model fixtures cross-platform — mitigate by seeding and running the fixture twice to confirm byte-identical output before writing the `.expec`.
- ADR numbering: `decisions.md` ends at ADR-0017 in this worktree while history references ADR-0018..0022 written outside this branch — use **ADR-0023** to avoid collision and flag the 0018..0022 gap as a pre-existing inconsistency (do NOT fabricate those).

## Compatibility Impact

- Additive public-API widening of 9 metric signatures (8 regression metrics + `roc_auc_score`).
- No grammar change.
- Existing fixtures unchanged.

## Documentation Impact

- Docs scope statements in `docs/libraries/gesha.md` and `docs/libraries/gesha/models-training.md`.
- New ADR-0023 in `.opencode/adr/decisions.md`.

## Testing Impact

- New metric fixtures: gesha regression batch `predict` -> `mse`/`r2`; gesha binary sigmoid batch `predict` -> `roc_auc`; machine regressor guard (flat output -> `mse`).
- New Functional-API fixture under `tests/KafeGESHA/functional/`.
- Full suite via `uv run --locked python -m pytest tests/ -q -p no:cacheprovider`.

## Implementation Plan

1. Widen signatures and add the flattening helper in `src/lib/KafeMACHINE/metrics.py`.
2. Add metric fixtures and verify determinism with two identical runs.
3. Functional fixture (other builder).
4. Docs scope statements (other builder).
5. ADR-0023.
6. Full suite + review + `/dod`.

## Epoch reporting follow-up

The user requested uniform accuracy display for supervised Gesha classification. `models_v2.py` changes the public training log: cross-entropy classifiers show percentage accuracy every epoch even when `metrics=[]`; loss prints as its raw mean, not a false percentage. Regression, autoencoder reconstruction, and unsupervised clustering remain loss-only. This affects exact-output `.expec` fixtures, so 19 snapshots were refreshed from real runs; a focused unit test covers the default classification display. Existing model parameters, predictions, and callbacks are unchanged.
