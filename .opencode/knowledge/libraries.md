# KAFE Built-in Libraries

## Registry

Libraries are registered in `EvalVisitorPrimitivo.__init__` (`self.libraries`), keyed by the lowercase KAFE `import` name:

```python
self.libraries = {
    "numk":      [lib.KafeNUMK.funciones,   False],
    "math":      [lib.KafeMATH.funciones,   False],
    "files":     [lib.KafeFILES.funciones,  False],
    "plot":      [lib.KafePLOT.funciones,   False],
    "geshaDeep": [lib.KafeGESHA.funciones,  False],
    "pardos":    [lib.KafePARDOS.funciones, False],
    "machine":   [lib.KafeMACHINE.funciones, False],
    "huggingface": [lib.KafeHF.funciones,   False],
    "kaggle":    [lib.KafeKaggle.funciones, False],
}
```

- Each entry is `[module, imported_flag]`. KAFE `import <name>` flips the flag to `True`.
- Dispatch: `componentes_lenguaje/librerias/funciones.py` → `libraryFunctionCall(library, function_name, args)` / `libraryConstant(library, constant_name)`.
- Un-imported library → `raiseLibraryNotImported`; missing function/constant → `raiseFunctionNotDefined` / `raiseVariableNotDefined`.
- User `.kf` modules are resolved by `componentes_lenguaje/importar/funciones.py` relative to `globals.current_dir`, then the component directory.

## Library Reference

- `KafeNUMK` — linear algebra (NumPy-like). Modules: `funciones.py`, `utils.py`, `errores.py`.
- `KafeMATH` — math utilities (`log`, `exp`, `sqrt`, `pow_`, `math_abs`, etc.). Modules: `funciones.py`, `errores.py`. Used by other libraries (GESHA, PARDOS, PLOT, MACHINE).
- `KafeFILES` — file I/O.
- `KafePLOT` — SVG plotting. Modules: `funciones.py`, `utils.py`.
- `KafeGESHA` — deep learning (see `.opencode/knowledge/dl-library.md`).
- `KafePARDOS` — DataFrames / CSV. Modules: `funciones.py`, `DataFrame.py`.
- `KafeMACHINE` — ML models and metrics (see `.opencode/knowledge/ml-library.md`).
- `KafeHF` — datasets from Hugging Face Hub (`load_dataset`, `load_dataset_split`, `load_dataset_matrix`). Optional dependency `datasets` with auto-install; returns PARDOS DataFrames or numeric matrices. Docs: `docs/bibliotecas/huggingface.md`, ADR-0010.
- `KafeKaggle` — datasets from Kaggle via the official `kagglehub` client. Tabular API: `load_dataset`, `load_dataset_split`, `load_dataset_matrix` (CSV read with stdlib `csv`, no pandas; `split` acts as a file selector because Kaggle has no splits). Generic image API: `load_image`, `load_images`, `load_image_dataset` (recursive `.png/.jpg/.jpeg/.bmp` discovery, CHW `[C][H][W]` output with pixels in `[0,1]`, `color_mode="rgb"`/`"gray"`, `limit`; labels matched by filename stem and encoded `0..N-1`; returns the `ImageDataset` container, a KAFE `MACHINE` with `[0]=X`, `[1]=y`). No train/test split happens here — that stays in `machine.stratified_train_test_split` (ADR-0018). Optional dependencies with auto-install: `kagglehub` (download; public datasets are anonymous, credentials only for private ones, cached under `~/.cache/kagglehub`), `Pillow` (image decoding/resizing) and `py7zr` (nested `.7z`; `.zip` uses stdlib `zipfile`). Docs: `docs/bibliotecas/kaggle.md`, ADR-0012, ADR-0013, ADR-0018.

## Adding a New Library

1. Create `src/lib/KafeXXX/funciones.py` (mirror an existing library's `funciones.py`).
2. Import the module in `EvalVisitorPrimitivo.py` near the other `import lib.Kafe*` lines.
3. Register it in `self.libraries` with the lowercase KAFE `import` name.
4. Add fixtures under `tests/KafeXXX/` and a `tests/test_KafeXXX.py` that parameterizes via `obtener_parametros(get_programs(...))`.
5. Update docs (`docs/bibliotecas/`) and `.opencode/knowledge/` if the library introduces a concept.
