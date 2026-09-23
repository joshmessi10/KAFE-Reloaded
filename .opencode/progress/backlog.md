# Backlog

Candidate items not yet on the roadmap. Add items here during Impact Analysis and planning sessions.

## Repository Policy Alignment — Pending Deliverables

The instruction alignment documents the following work; it does not complete either migration.

The proposed branch order and current continuation point are tracked in `.opencode/progress/repository-alignment.md` and `.opencode/progress/current.md`.

- **Complete English migration:** inventory and migrate remaining Spanish in source, grammar sources and syntax where needed, identifiers, user-facing diagnostics, fixtures and expected outputs, published documentation, file/directory names, and project guidance. Update imports, links, MkDocs navigation, and other references together; plan public syntax and path changes explicitly and verify the affected interpreter behavior and documentation build. Keep intentional translations separate from application logic.
- **Coordinated uv and quality-gate migration:** introduce `pyproject.toml` and `uv.lock` with runtime, development, documentation, and optional dependencies; update setup guidance, MkDocs dependencies, CI, and `flake.nix` together. Reconcile Nix's Python package declarations with the uv project while retaining useful system tools. Keep `datasets` optional and preserve a deterministic default environment without it, including migration of legacy install diagnostics and expected outputs. Implement the mirrored root quality requirements: Ruff, basedpyright, codespell, `uv audit`, explicit suppression-policy checks, at least 80% coverage of owned source excluding generated ANTLR files, and zero errors/warnings. Measure fixture-launched child interpreter coverage and observe their full diagnostics; parent pytest-cov and warning filters alone are insufficient. Preserve expected-error fixtures and current CLI semantics. Extend the existing test, docs, and Nix workflow responsibilities, then provide local and CI execution evidence before declaring the gates operational.

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
