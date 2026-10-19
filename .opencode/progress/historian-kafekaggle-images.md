# Historian Report — KafeKAGGLE: API genérica de ingesta de imágenes

**Date:** 2026-10-13
**Role:** Historian — documentation, concept record, knowledge layer, history and roadmap updates.
**Task:** Document the replacement of `load_cifar10` by the generic image API (`load_image` / `load_images` / `load_image_dataset`), the A1 change in KafeMACHINE and ADR-0018.
**Status:** Completed.

## Files written / updated

1. `docs/bibliotecas/kaggle.md` — added section **«Ingesta de imágenes»** documenting the
   three functions, the `[C][H][W]` layout, `color_mode`, `limit`, the optional
   `Pillow`/`py7zr` dependencies, the in-memory `O(N·C·H·W)` warning with `limit`
   mitigation, determinism, the `load_image_dataset` container (`[0]=X`, `[1]=y`) and
   the note that the train/test split stays outside KafeKAGGLE with
   `machine.stratified_train_test_split` (ADR-0018); includes a short KAFE example.

2. `.opencode/knowledge/concepts/kaggle-image-ingestion.md` — NEW concept record
   following `concept-template.md` and the style of `kaggle-dataset-ingestion.md`
   (Spanish content). Covers: what it is and why; mathematical foundation
   (decode → resize → normalize $p/255$ → transpose to $[C,H,W]$); time/space
   complexity $O(N \cdot C \cdot H \cdot W)$; step-by-step algorithm; advantages;
   limitations (memory, optional dependencies); KAFE implementation mapping
   (paths and concrete functions); API, examples and references.

3. `.opencode/knowledge/libraries.md` — updated the `KafeKaggle` entry: added the
   generic image API (`load_image`, `load_images`, `load_image_dataset`, `ImageDataset`),
   the optional `Pillow`/`py7zr` dependencies and ADR-0018. No `load_cifar10` mention
   remains (there was none before).

4. `.opencode/history/2026/2026-10.md` — appended entry
   **«KafeKAGGLE — API genérica de ingesta de imágenes (2026-10-13, ADR-0018)»**
   describing the event: replacement of `load_cifar10`, the new 3-function API,
   `ImageDataset`, optional dependencies, the A1 relaxation in
   `train_test_split`/`stratified_train_test_split`, the `src/Ejemplo.kf` migration
   and the suite result (628 passed, 2 skipped).

5. `.opencode/progress/roadmap.md` — added the completed entry for the generic image
   API + A1 under *Documentation & Engineering* (next to the KafeKAGGLE v2 entry).

6. `.opencode/progress/historian-kafekaggle-images.md` — this report.

## References used

- `src/lib/KafeKaggle/funciones.py`, `src/lib/KafeKaggle/dataset.py` (real API).
- `.opencode/adr/decisions.md` — ADR-0018 (not duplicated, only referenced), ADR-0011, ADR-0013.
- `.opencode/progress/impact-kafekaggle-images.md`,
  `.opencode/progress/builder-kafekaggle-images.md`,
  `.opencode/progress/tester-kafekaggle-images.md`.
- `.opencode/knowledge/concepts/concept-template.md`,
  `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md`.

## Notes

- No files under `src/` were modified (Historian scope).
- ADR-0018 was left untouched in `.opencode/adr/decisions.md`; only referenced.
- The `.opencode/progress/backlog.md` item for this feature was **not** modified
  (out of the requested file set); the roadmap entry records completion.
