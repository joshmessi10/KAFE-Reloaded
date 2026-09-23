# Backlog

Candidate items not yet on the roadmap. Add items here during Impact Analysis and planning sessions.

## Repository Policy Alignment — Remaining Deliverables

The policy baseline is integrated locally. The locked uv dependency/setup migration is implemented on `build/uv-environment`; its final validation, feature commit, push, and test CI result remain pending in `.opencode/progress/current.md`. The branch sequence, scope, and unresolved English-migration decisions are tracked in `.opencode/progress/repository-alignment.md`.

- **Interpreter quality evidence:** measure and combine coverage from fixture-launched child interpreters, propagate warning policy, and inspect full child stdout/stderr and exit behavior. Preserve expected-error fixtures and CLI semantics. Parent-process pytest-cov and warning filters alone are insufficient. Exclude generated ANTLR outputs and demonstrate at least 80% coverage of owned source before calling this gate complete.
- **Complete English migration:** inventory and migrate remaining Spanish in source, grammar sources and syntax where needed, identifiers, user-facing diagnostics, fixtures and expected outputs, published documentation, file/directory names, and project guidance. Update imports, links, MkDocs navigation, and other references together; plan public syntax and path changes explicitly and verify affected interpreter behavior and the documentation build. Keep intentional translations separate from application logic.
- **Python quality gates:** implement explicit Ruff rules, basedpyright, codespell, `uv audit`, suppression-policy checks, warnings-as-errors, and zero-error/zero-warning checks in the existing workflows. The required tools are in the uv `dev` group; child-interpreter coverage and diagnostic observation remain part of the separate evidence work. Preserve Nix lock maintenance, ANTLR prerequisites, and the docs deployment while extending the existing workflows.

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
