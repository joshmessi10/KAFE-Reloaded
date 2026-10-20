# Builder Report — Gesha follow-ups: metrics interoperability

Branch: `integration/Kafe_Gesha_Clustering_v2` (unchanged; no branch created or switched).
Date: 2026-10-20. Role: Builder (metrics-interoperability portion of "Gesha follow-ups").

## What was implemented

1. **`src/lib/KafeMACHINE/metrics.py`** (only source file changed):
   - Added module-private `_flatten_predictions(values)` immediately after `_validate_inputs`. Behavior: empty input returned as-is; if `values[0]` is not a list the input is treated as already flat; otherwise every row must be a list of exactly length 1, else `raise Exception("predictions must be a flat vector or a single-column matrix; the metric expects one value per sample")`; single-column rows are flattened to `[row[0] for row in values]`.
   - Widened the **second** `check_sig` type list from `numeric_vector_types` to `numeric_vector_types + numeric_matrix_types` (first type list unchanged) and inserted the flatten call at the top of the function body **before** `_validate_inputs` in exactly these nine functions: `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`, and `roc_auc_score` (there the parameter is `y_score`, so `y_score = _flatten_predictions(y_score)` after the docstring).
   - `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`, and `silhouette_score` were **not** touched. No `# noqa` / `# pyright:` suppressions added.

2. **Process files (task 0):**
   - Created `.opencode/progress/impact-gesha-followups.md` from the impact-analysis template.
   - Restored `.opencode/progress/current.md` (feature/status/steps as assigned; after implementation, "Current step" was advanced to record the metrics portion complete).
   - Restored `.opencode/memory/active-work.md`.
   - Appended one row to `.opencode/progress/session-commands.md` (`/open-work | Gesha follow-ups (re-open after 2026-10-19 close) | completed - 2026-10-20`); existing rows untouched.
   - Appended one status line to `.opencode/progress/backlog.md` under `## Gesha Follow-ups (ADR-0016 / ADR-0017)`; deprecation-window bullet untouched.

3. **ADR-0023** appended to `.opencode/adr/decisions.md` in the exact ADR-0016/ADR-0017 format: `## ADR-0023: Widen KafeMACHINE Metric Signatures to Accept Single-Column Gesha Predictions` (Status accepted, Date 2026-10-20, Context/Decision/Consequences/Alternatives Considered). Per the assigned numbering decision, ADR-0023 was used and the missing ADR-0018..0022 range is flagged as a pre-existing inconsistency in this worktree; none were fabricated. (Note: the file is CRLF with no BOM and contains a pre-existing form-feed character inside the ADR-0017 text; the append was done byte-safely without rewriting existing lines.)

## New fixtures (auto-collected by `tests/test_KafeMACHINE.py` via `metrics/regression/`)

| Fixture (.kf + .expec) | What it proves |
|---|---|
| `tests/KafeMACHINE/metrics/regression/test_regression_gesha_batch_predict.kf` | NEW capability: seeded gesha Dense(1, linear) regression, batch `predict` -> nested `[6, 1]` matrix -> `machine.mean_squared_error` (0.04780343247512881) and `machine.r2_score` (0.9959025629307032). |
| `tests/KafeMACHINE/metrics/regression/test_metrics_gesha_binary_roc_auc.kf` | NEW capability: seeded gesha Dense(1, sigmoid) binary classifier (adam, lr 0.05, 60 epochs), batch `predict` -> nested `[8, 1]` probabilities -> `machine.roc_auc_score` = 1.0. |
| `tests/KafeMACHINE/metrics/regression/test_regression_machine_flat_predict.kf` | Guard: `machine.linear_regression()` flat `predict` -> `mean_squared_error` (9.34800172686899e-30) and `r2_score` (1.0). No equivalent fixture existed before (grep confirmed no fixture fed model predictions into these metrics), so this is new, not a duplicate. |

`.expec` files were written as UTF-8 without BOM, LF newlines (the harness reads them in text mode with universal newlines, so this matches exactly).

## Determinism evidence (two identical runs per fixture)

Procedure: a temp script replicating `tests/utils.py`'s `run_kafe_program` (`cwd=src`, `PYTHONWARNINGS=error`, `PYTHONIOENCODING=utf-8`) ran each fixture twice, required exit 0 + empty stderr + byte-identical stdout, then wrote the `.expec` from run 1. SHA-256 of stdout:

| Fixture | run 1 | run 2 | identical |
|---|---|---|---|
| `test_regression_gesha_batch_predict` | `2e29ed96…f810139` | `2e29ed96…f810139` | yes |
| `test_metrics_gesha_binary_roc_auc` (final version) | `47242f5c…554f1a` | `47242f5c…554f1a` | yes |
| `test_regression_machine_flat_predict` | `947cebce…9dfe887` | `947cebce…9dfe887` | yes |

(Full hashes: `2e29ed962dc4f8e9b5ecf873ac7cc0df2eed4dde6a4ed957ad0890fb2f810139`, `47242f5c68acd9be23c1fbaf30808de60165852ab170a625f292c9680b554f1a`, `947cebce449ab5f68c72afad8a9ef5bce2cd2087a1b1c0470d7f525ae9dfe887`.) The gesha and machine fixture hashes were also identical across two separate invocations of the capture script, i.e. stable beyond the pair. An initial SGD/25-epoch draft of the ROC fixture trained to an inverted ranking (AUC 0.0); it was changed to adam/lr 0.05/60 epochs so the fixture asserts the pedagogically meaningful AUC = 1.0.

## Validation (exact commands and observed results)

| Gate | Command | Result |
|---|---|---|
| Focused MACHINE suite | `uv run --locked python -m pytest tests/test_KafeMACHINE.py -q -p no:cacheprovider` | **PASS** — 210 passed in 68.27s (includes the 3 new fixtures). |
| Full suite | `uv run --locked python -m pytest tests/ -q -p no:cacheprovider` | **PASS** — 724 passed, 4 skipped in 172.31s (baseline 718–721 passed / 4 skipped + 3 new fixtures). |
| Ruff | `uv run --locked --group dev ruff check src tests` | **PASS** — "All checks passed!". |
| basedpyright | `uv run --locked --group dev basedpyright` | **PENDING (environment)** — `error: uv trampoline failed to canonicalize script path`. Equivalent invocation `uv run --locked --group dev python -m basedpyright` ran the same analyzer: **PASS**, `0 errors, 0 warnings, 0 notes`. The canonical console-script form remains unusable on this host. |
| codespell | `uv run --locked --group dev codespell` | **PENDING (environment)** — same `uv trampoline` error. Equivalent `uv run --locked --group dev python -m codespell_lib` loads the `pyproject.toml` config (evidenced by hidden-path scanning and the `.venv`/`.git` skips) and reports **all** findings under local `.opencode/node_modules/` (OpenCode third-party JS tooling that does not exist in CI) — **zero findings in `src/`, `tests/`, `docs/`, `.opencode/` project records, or any file from this change**. The gate cannot be reported as passed on this host. |
| Suppression policy | `uv run --locked --group dev python scripts/check_quality_policy.py` | **PASS** — exit 0, no output. |
| Policy-focused tests | `uv run --locked python -m pytest tests/test_quality_policy.py -q -p no:cacheprovider` | **PASS** — 5 passed. |

Additional manual demonstration (not a repo fixture): a 2-column prediction matrix passed to `mean_squared_error` now yields `Exception: machine: predictions must be a flat vector or a single-column matrix; the metric expects one value per sample` (printed to stdout with exit 0, the interpreter's documented non-`.error.kf` quirk), confirming multi-output inputs are still rejected with the clear message rather than a silent length mismatch.

## Not done here / left for Tester and Reviewer

- **Other builder's scope:** Functional-API fixture under `tests/KafeGESHA/functional/`, and the docs scope statements in `docs/libraries/gesha.md` / `docs/libraries/gesha/models-training.md`.
- **History:** `.opencode/history/2026/2026-10.md` has not been updated for this feature (Historian/`/close` step).
- **Hosted CI:** no remote run was observed; report only after a push passes at the exact commit.
- **Host environment quirks (pre-existing, not caused by this change):** the documented `uv run --locked --group dev pytest ...` and the console-script forms of `basedpyright`/`codespell` fail with `uv trampoline failed to canonicalize script path`; workarounds used are listed above. `.opencode/node_modules/` (local tooling) is outside the codespell skip list, so a clean codespell gate on this host additionally requires either skipping that local output or removing it — a lead-level decision, out of this task's scope.
- **Reviewer `/dod`:** builder does not declare done; hand off for `/dod`.
