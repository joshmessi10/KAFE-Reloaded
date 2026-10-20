# Builder Report — Gesha follow-ups: DoD required fixes

## Four required changes

1. `.opencode/progress/builder-gesha-metrics.md:42`: confirmed the flagged spelling is now “changed to adam/lr 0.05/60 epochs”; hashes and other text remain intact.
2. `.opencode/history/2026/2026-10.md:346`: appended the 2026-10-20 Gesha follow-ups entry for ADR-0023, nine widened metric signatures, three deterministic metric fixtures, the Functional branch-and-merge fixture, and the bounded docs scope. It references the existing ADR-0024 epoch entry and notes the pre-existing ADR-0018–0022 numbering gap.
3. `.opencode/knowledge/ml-library.md:55`: confirmed the Option A metric-input bullet is present after the regression metrics bullet and before clustering metrics.
4. `.opencode/progress/builder-gesha-functional.md:24-25,102-106`: reconciled the report with the current docs: MLP/CNN/RNN are supported, a Functional branch-and-merge fixture is tested, broader graphs remain experimental, and `fit` supports one output and loss.

## Validation

- `uv run --locked --group dev python -m codespell_lib`: exit 1 with 6,821 third-party findings under local `.opencode/node_modules/`; zero findings outside that directory.
- `uv run --locked --group dev python -m codespell_lib src tests docs .opencode/progress .opencode/history .opencode/knowledge .opencode/adr .opencode/memory`: exit 0, no findings.
- `rg` confirmed no “FUTURE WORK” or “future work for training” remains in the reconciled report or `docs/`.
- No code, fixtures, or `.expec` files were changed for these four record fixes; the existing full-suite result was not rerun for this records-only portion.

## Record files

The four intended records are the metrics report, October history, ML knowledge layer, and Functional report. This report records their final state. The metrics report and ML knowledge bullet were already corrected before this pass; the history entry and Functional report were completed here.
