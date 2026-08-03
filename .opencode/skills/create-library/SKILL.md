---
name: create-library
description: Use when adding a new built-in library to KAFE (src/lib/KafeXXX). Mirrors existing libraries, registers the library in self.libraries, and adds tests and documentation.
---

Purpose: add a new built-in library to KAFE that is importable by name and dispatched through the standard library mechanism.

## Inputs

- Library name and KAFE `import` key (lowercase).
- Public API to expose (functions/constants/factories).

## Workflow

1. Read `.opencode/knowledge/libraries.md` and mirror an existing library's structure.
2. Create `src/lib/KafeXXX/funciones.py` (plain Python functions; stateful models as classes with `fit()`/`predict()`/`score()`).
3. Import the module in `src/EvalVisitorPrimitivo.py` near the other `import lib.Kafe*` lines.
4. Register it in `self.libraries` with the lowercase KAFE import name (`{"xxx": [module, False]}`).
5. Add fixtures under `tests/KafeXXX/` and a `tests/test_KafeXXX.py` parameterized via `obtener_parametros(get_programs(...))`.
6. Add an example `.kf` program under `docs/` if applicable.

## Outputs

- New library module + registration.
- Passing fixture tests.

## Required Documentation Updates

- `docs/bibliotecas/`.
- `.opencode/knowledge/libraries.md` (registry and library reference).
- Concept record in `.opencode/knowledge/concepts/` if the library introduces a concept.

## Validation Requirements

- `pytest tests/test_KafeXXX.py` passes.
- Full suite `pytest tests/` passes.
- `import <key>` works in a `.kf` program; un-imported usage raises correctly.
