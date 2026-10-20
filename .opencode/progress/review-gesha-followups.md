# Review - feature gesha-followups (ADR-0023 / ADR-0024)

**Date:** 2026-10-20
**Reviewer:** KAFE Reviewer (role /dod)
**Scope:** Approved feature Gesha follow-ups (Option A): metrics interoperability, Functional branch-merge fixture, docs scope, plus the authorized concurrent epoch-reporting change (ADR-0024).
**Note on working tree:** the tree also carries other authorized concurrent tasks (ADR-0025 logical-correctness, ADR-0026 evaluation-correctness). They touch shared files - notably src/lib/KafeMACHINE/metrics.py, which contains both the Option A widening and separate ADR-0025 F1/silhouette changes. Those changes are attributed to their own tasks; this review judges only the Gesha follow-ups scope, and the suite runs below cover the whole tree.

**Verdict:** CHANGES_REQUESTED

## Independent verification performed by this review

| Command | Observed result |
|---|---|
| uv run --locked python -m pytest tests/ -q -p no:cacheprovider | PASS - 745 passed, 4 skipped in 204.65s. Current suite state re-confirmed independently after the reported transient failure (the earlier Tester count of 726 is superseded: concurrent work added tests since then). |
| uv run --locked python -m pytest tests/ -q -p no:cacheprovider --cov=src --cov-config=pyproject.toml --cov-report=term --cov-fail-under=80 | PASS - 745 passed, 4 skipped; Required test coverage of 80% reached. Total coverage: 85.69%. Subprocess-aware config (tool.coverage.run source=src, patch=subprocess) collects interpreter-child data; the three generated ANTLR files remain the only exclusions. |
| collect-only -k test_regression_gesha_batch_predict or test_metrics_gesha_binary_roc_auc or test_regression_machine_flat_predict or functional_branch_merge | PASS - 4/749 collected, all four present (3 via tests/test_KafeMACHINE.py path metrics/regression/, 1 via tests/test_KafeGESHA.py), none skipped. |
| uv run --locked --group dev ruff check src tests | PASS - All checks passed! |
| uv run --locked --group dev python -m basedpyright | PASS - 0 errors, 0 warnings, 0 notes. Console-script form still fails with uv trampoline failed to canonicalize script path (host quirk, PENDING). |
| uv run --locked --group dev python scripts/check_quality_policy.py | PASS - exit 0, no output. |
| uv audit --locked --preview-features audit | PASS - 87 packages resolved, no known vulnerabilities, no adverse project statuses (86 packages). |
| NO_MKDOCS_2_WARNING=1 with uv run --locked --group docs --no-dev mkdocs build --strict | PASS - exit 0; only the documented scoped NO_MKDOCS_2_WARNING=1 exception used. |
| uv run --locked --group dev python -m codespell_lib | FAIL (gate errored) - one finding in repository-scanned content: .opencode/progress/builder-gesha-metrics.md line 42 contains a misspelling of returned. All remaining findings are under local .opencode/node_modules/ (OpenCode JS tooling, absent from git and from CI). Zero findings in src/, tests/, docs/, and other .opencode/ project records. Not reported as passed. |
| Multi-output rejection demo (temp .kf passing [[1,2],[2,3],[3,4]] to machine.mean_squared_error, run via uv run --locked python src/Kafe.py ...) | PASS - stdout: Exception: machine: predictions must be a flat vector or a single-column matrix; the metric expects one value per sample; exit 0 (documented non-.error.kf CLI quirk). |
| AGENTS/CLAUDE mirror | PASS - neither file modified (absent from git status); programmatic comparison: substantive bodies identical from # Mission onward. |

## Task Checks

| Requirement | Status | Evidence or reason |
|---|---|---|
| Requested implementation exists per approved design (Option A) and follows it | PASS | src/lib/KafeMACHINE/metrics.py: module-private _flatten_predictions added after _validate_inputs; second @check_sig type list widened to numeric_vector_types + numeric_matrix_types (first list unchanged) with the flatten call before _validate_inputs in exactly the 8 regression metrics (mean_squared_error, mean_absolute_error, root_mean_squared_error, r2_score, max_error, median_absolute_error, mean_absolute_percentage_error, explained_variance_score) plus roc_auc_score (parameter y_score). Classification metrics and silhouette_score signatures untouched by Option A. Functional fixture tests/KafeGESHA/functional/functional_branch_merge.kf builds input - shared trunk - two branches - Add merge - output, then gesha.functional, compile(adam, bce, []), fit, predict_label, machine.accuracy_score. Docs scope present at docs/libraries/gesha.md:9 and docs/libraries/gesha/models-training.md:3. |
| Applicable tests | PASS | Full suite independently run twice: 745 passed, 4 skipped (plain + coverage). All 4 new fixtures collected, none skipped, none in _SLOW_EXAMPLES (tests/test_KafeGESHA.py lines 17-22 still list only the 4 pre-existing slow examples). Builder reports give two-run byte-identical SHA-256 determinism evidence per new fixture (metrics: 2e29ed96, 47242f5c, 947cebce; functional: 6392e077). Backward compatibility: existing flat-vector metric fixtures green. Multi-output rejection independently reproduced with the exact clear error message. |
| Root policies and relevant knowledge | FAIL | Violations: (1) codespell gate errors - see Required Changes item 1; (2) history not updated for this feature (.opencode/history/2026/2026-10.md has sibling entries at :333, :337, :341 but no Option A / ADR-0023 / new-fixture entry) - root DoD requires history updates for significant features; (3) knowledge layer not updated for Option A (.opencode/knowledge/ml-library.md metrics list at :53-55 unchanged by this feature) - DoD item 2 requires docs AND knowledge layer. All other policies checked and PASS: Superpowers artifacts local-only and unstaged (nothing under docs/superpowers/ or .superpowers/ in git status); AGENTS.md/CLAUDE.md untouched and bodies identical; no new noqa or pyright suppressions (grep: 0 in src/; only pre-existing literals in untouched tests/test_quality_policy.py); pyproject.toml and uv.lock untouched (no dependency changes, uv remains the sole manager); English/Spanish policy fine (English prose, Spanish comments only inside the .kf fixture, permitted by ADR-0014); no ML/DL algorithm added so benchmark/concept-record requirements are N/A. |
| Documentation and history | FAIL | docs updated (gesha.md:9, models-training.md:3/11/14, machine/metrics.md section on one metric API); backlog marked (backlog.md:19), impact record created, ADR-0023 and ADR-0024 present in full format, current.md/active-work.md/session-commands.md updated. But history MISSING for this feature and knowledge layer MISSING the Option A line - both required by DoD. |

## Consistency finding raised by the Lead: FUTURE WORK report vs on-disk docs

**Decision: the current docs honestly fulfill the approved intent. No docs wording change is required.**

- Grep over docs/ finds zero occurrences of FUTURE WORK / future work / not yet a fully documented. On disk the wording is: supported architectures = MLP/CNN/RNN (gesha.md:9, models-training.md:3), Functional graph training has a tested branch-and-merge fixture; broader graph configurations remain experimental (gesha.md:9), Functional row see the tested Functional fixture (models-training.md:11), and the remaining limitation the current fit training loop supports a single output and a single loss (models-training.md:14).
- This matches approved scope item 3 nearly verbatim, and it is the honest resolution of the item-2 intent: a Functional fixture now trains a branched DAG end-to-end and is collected and green in the suite, so keeping FUTURE WORK for training would now understate reality, while listing Functional among fully supported architectures would overstate it. The chosen wording keeps Functional out of the supported-architecture list, points at the one tested branching example, marks broader graph configurations experimental, and documents the single-output fit caveat. That satisfies document Functional as future work; GESHA supports only MLP/CNN/RNN in substance - Functional remains outside the supported training architectures, with one bounded, tested exception acknowledged.
- **Finding (report accuracy, required):** builder-gesha-functional.md lines 24-25 and 102-107 claim the FUTURE WORK for training row was left intact and that Functional remains documented as future work - false against the current tree. The report must be reconciled with disk (whoever made the final wording change is immaterial; the record must match the tree).

## Required Changes

1. **Fix the codespell finding in our own artifact.** .opencode/progress/builder-gesha-metrics.md line 42 contains a misspelling of returned (tokens re + tuned in the wrong order), in the sentence describing the re-tuning run. Replace that token with returned, then re-run uv run --locked --group dev python -m codespell_lib and confirm the only remaining findings are under local .opencode/node_modules/ (host-only; see Pending section).
2. **Add the history record for this feature** in .opencode/history/2026/2026-10.md (root DoD + dod.md item 2): an entry covering the Option A widening of the 9 metric signatures with _flatten_predictions (ADR-0023), the three new metric fixtures, the Functional branch-merge fixture, and the docs scope statements. The epoch-reporting work is already recorded at line 337; reference it rather than duplicating it.
3. **Reflect Option A in the knowledge layer**: add one line in .opencode/knowledge/ml-library.md next to the metrics bullets (after line 54), for example: Metric inputs: classification metrics take flat label vectors (Gesha: predict_label); the eight regression metrics and roc_auc_score additionally accept a single-column List[List[FLOAT]] Gesha batch prediction, one value per sample, and reject multi-output rows (ADR-0023).
4. **Reconcile builder-gesha-functional.md with disk**: update lines 24-25 and 102-107 - no FUTURE WORK text remains under docs/; record the actual final wording (tested branching example / broader graph configurations remain experimental) so project memory stops contradicting the tree.

## Non-blocking follow-ups (do not gate this verdict)

- Add an .error.kf fixture that locks the multi-output rejection contract in CI (currently demonstrated only by manual runs).
- Refresh stale planning text at /close: active-work.md Current/Next Step still describe pre-completion work, and backlog.md line 16 still says Functional is documented as future work (superseded by status line 19 and the current docs).

## Pending repository migrations / environment quirks (recorded, not passed)

- **Hosted CI evidence** at the exact pushed commit - PENDING (nothing pushed for this work).
- **Console-script forms** of basedpyright/codespell and the documented --group dev pytest form fail on this host with uv trampoline failed to canonicalize script path - PENDING environment issue; equivalent python -m forms were used and are recorded above.
- **codespell .opencode/node_modules/ noise** - PENDING host-only: local OpenCode JS tooling is outside the codespell skip list; it does not exist in git/CI. Lead-level decision needed (skip entry or remove local output).
- **Superpowers local spec/plan artifacts** - PENDING repo-wide adoption: neither docs/superpowers/ nor .superpowers/ exists for any past feature; the impact analysis (.opencode/progress/impact-gesha-followups.md) plus the two builder reports serve as the local plan of record. Nothing staged or committed (root local-only rule honored).
- **ADR numbering gap 0018-0022** - pre-existing inconsistency, documented in the impact file; not fabricated, not caused by this task.

**Verdict:** CHANGES_REQUESTED
