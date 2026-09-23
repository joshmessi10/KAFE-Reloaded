# Backlog

Candidate items not yet on the roadmap. Add items here during Impact Analysis and planning sessions.

## Repository Policy Alignment — Remaining Deliverables

The policy baseline is integrated locally. The locked uv dependency/setup migration is implemented and locally validated on `build/uv-environment` (`f4e544a`), pushed, and verified by GitHub test CI at `b40965f` (485 passed). The interpreter subprocess quality implementation is complete on the user-approved `test/interpreter-quality-evidence` branch: 497 tests passed in 353.72s with 83.78% coverage and no warnings; independent review passed; commit `6e8edd5` was pushed and GitHub `Run Tests` passed at its exact SHA (run 127). The branch sequence and unresolved English-migration decisions are tracked in `.opencode/progress/repository-alignment.md`; explicit authorization is required before further branch creation, rename, or switch operations.

- **Interpreter quality evidence (complete on `test/interpreter-quality-evidence`):** all 29 fixture launches in 15 test modules use the shared runner; 160 invalid fixtures have complete stderr sidecars and two have explicit stdout sidecars. The final full suite passed 497 tests in 353.72s with 83.78% coverage across 111 tracked Python source files and no warnings. Commit `6e8edd5` was pushed and GitHub `Run Tests` passed at its exact SHA (run 127). The workflow enforces the same 80% gate. Preserve CLI behavior and keep the three generated ANTLR files as the only coverage exclusions.
- **Complete English migration:** inventory and migrate remaining Spanish in source, grammar sources and syntax where needed, identifiers, user-facing diagnostics, fixtures and expected outputs, published documentation, file/directory names, and project guidance. Update imports, links, MkDocs navigation, and other references together; plan public syntax and path changes explicitly and verify affected interpreter behavior and the documentation build. Keep intentional translations separate from application logic.
- **Remaining Python quality gates:** implement explicit Ruff rules, basedpyright, codespell, `uv audit`, and suppression-policy checks. Warnings-as-errors and the child-interpreter coverage/diagnostic gate are implemented on `test/interpreter-quality-evidence`; the remaining tools are in the uv `dev` group. Preserve Nix lock maintenance, ANTLR prerequisites, and the docs deployment while extending the existing workflows.

## Machine Learning

- Gradient Boosting (ensemble method, combines weak learners sequentially)
- SVM (Support Vector Machine, kernel methods)

## Deep Learning

- Conv2D (convolutional layers for image processing)
- LSTM (recurrent layers for sequence modeling)
- Transformer (attention-based architecture)

## Language / Core

- Vectorization (batch operations for performance)
- Parallel execution (multi-threading support)

## Documentation

- Review tasks for legacy implementations (BaseMachine, LinearRegression, LogisticRegression, KNN, Metrics)
