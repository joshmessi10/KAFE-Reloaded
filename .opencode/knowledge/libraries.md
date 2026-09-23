# KAFE Built-in Libraries

This technical reference implements the repository invariants in `AGENTS.md` and `CLAUDE.md`, subject to applicable system/runtime and user instructions.

## Registry

Library `functions` modules are imported in `src/InterpreterVisitor.py` and registered in `InterpreterVisitor.__init__` (`self.libraries`). Registry keys are case-sensitive. The KAFE keyword is lowercase `import`, but the existing `geshaDeep` name retains its mixed case. The current registrations use these imported module aliases:

```python
self.libraries = {
    "numk": [numk_funcs_module, False],
    "math": [math_funcs_module, False],
    "files": [files_funcs_module, False],
    "plot": [plot_funcs_module, False],
    "geshaDeep": [gesha_funcs_module, False],
    "pardos": [pardos_funcs_module, False],
    "machine": [machine_funcs_module, False],
    "huggingface": [hf_funcs_module, False],
}
```

- For example, `import lib.KafeMACHINE.functions as machine_funcs_module` and `import lib.KafeHF.functions as hf_funcs_module` bind the MACHINE and HF modules before registration.
- Each entry is `[module, imported_flag]`. KAFE `import <name>;` flips the flag to `True`.
- Dispatch: `language_components/libraries/functions.py` → `libraryFunctionCall(library, function_name, args)` / `libraryConstant(library, constant_name)`.
- Un-imported library → `raiseLibraryNotImported`; missing function/constant → `raiseFunctionNotDefined` / `raiseVariableNotDefined`.
- User `.kf` modules are resolved by `src/language_components/imports/functions.py` relative to `globals.current_dir`, then `src/language_components/imports/`, then `src/language_components/`.

## Library Reference

- `KafeNUMK` — linear algebra (NumPy-like). Modules: `functions.py`, `utils.py`, `errors.py`.
- `KafeMATH` — math utilities (`log`, `exp`, `sqrt`, `pow_`, `math_abs`, etc.). Modules: `functions.py`, `errors.py`. Used by other libraries (GESHA, PARDOS, PLOT, MACHINE).
- `KafeFILES` — file I/O.
- `KafePLOT` — SVG plotting. Modules: `functions.py`, `utils.py`.
- `KafeGESHA` — deep learning (see `.opencode/knowledge/dl-library.md`).
- `KafePARDOS` — DataFrames / CSV. Modules: `functions.py`, `DataFrame.py`.
- `KafeMACHINE` — ML models and metrics (see `.opencode/knowledge/ml-library.md`).
- `KafeHF` — optional Hugging Face dataset loading through `import huggingface;`. `src/lib/KafeHF/functions.py` exports `load_dataset` and `load_dataset_split`, returning KafePARDOS `DataFrame` objects.

## Optional Hugging Face Dependency

KafeHF's wrapper is imported and registered by the visitor in the default environment. Its external `datasets` dependency is optional and absent from the default uv environment: `import huggingface;` works without that package, while a dataset-loading call reports the missing dependency. Preserve the baseline without `datasets`, including `tests/KafeHF/hf_load_dataset_no_dep.error.kf`, and keep any environment for exercising the installed integration distinct from that baseline. Enable the integration with `uv sync --locked --extra huggingface`; the missing-dependency diagnostic points to this command and its paired expected-output fixture records the exact message.

## Adding a New Library

1. Create `src/lib/KafeXXX/functions.py` (mirror an existing library's `functions.py`).
2. Import the module in `InterpreterVisitor.py` near the other `import lib.Kafe*` lines.
3. Register it in `self.libraries` with its chosen KAFE `import` name; use lowercase for new names and preserve existing public-key casing such as `geshaDeep`.
4. Add fixtures under `tests/KafeXXX/` and a `tests/test_KafeXXX.py` that parameterizes via `obtener_parametros(get_programs(...))`.
5. Update docs (`docs/bibliotecas/`) and `.opencode/knowledge/` if the library introduces a concept.
