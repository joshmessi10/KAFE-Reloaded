# Backlog

Candidate items not yet on the roadmap. Add items here during Impact Analysis and planning sessions.

## Repository Policy Alignment — Remaining Deliverables

The policy baseline is integrated locally. The locked uv dependency/setup migration is implemented and locally validated on `build/uv-environment` (`f4e544a`), pushed, and verified by GitHub test CI at `b40965f` (485 passed). The interpreter subprocess quality implementation is complete on the user-approved `test/interpreter-quality-evidence` branch: 497 tests passed in 353.72s with 83.78% coverage and no warnings; independent review passed; commit `6e8edd5` was pushed and GitHub `Run Tests` passed at its exact SHA (run 127). On `refactor/english-repository`, Tasks 1–7 are complete: the 498-test suite passed at 83.78% coverage with no warnings, and the repository-wide English audit passed. See `.opencode/progress/repository-alignment.md` for the approved scope and status. Commits and pushes are authorized when needed. Do not create, rename, or switch branches without explicit authorization.

- **Interpreter quality evidence (complete on `test/interpreter-quality-evidence`):** all 29 fixture launches in 15 test modules use the shared runner; 160 invalid fixtures have complete stderr sidecars and two have explicit stdout sidecars. The final full suite passed 497 tests in 353.72s with 83.78% coverage across 111 tracked Python source files and no warnings. Commit `6e8edd5` was pushed and GitHub `Run Tests` passed at its exact SHA (run 127). The workflow enforces the same 80% gate. Preserve CLI behavior and keep the three generated ANTLR files as the only coverage exclusions.
- **Complete English migration:** Tasks 1–7 migrated and audited source, identifiers, tests, fixtures, documentation, routes, repository guidance, and project records; only the three approved archived artifacts were removed. The final full suite passed 498 tests at 83.78% coverage with no warnings.
- **Remaining Python quality gates:** implement explicit Ruff rules, basedpyright, codespell, `uv audit`, and suppression-policy checks. Warnings-as-errors and the child-interpreter coverage/diagnostic gate are implemented on `test/interpreter-quality-evidence`; the remaining tools are in the uv `dev` group. Preserve Nix lock maintenance, ANTLR prerequisites, and the docs deployment while extending the existing workflows.

## Machine Learning

## Deep Learning

- Conv2D (convolutional layers for image processing)
- LSTM (recurrent layers for sequence modeling)
- Transformer (attention-based architecture)

## Language / Core

- Vectorization (batch operations for performance)
- Parallel execution (multi-threading support)

## Documentation

- Review tasks for legacy implementations (BaseMachine, LinearRegression, LogisticRegression, KNN, Metrics)
