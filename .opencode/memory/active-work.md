# Active Work

## Current Feature

KafeKAGGLE — ingesta robusta de datasets de imágenes (etiquetas por carpetas).

## Status

in_progress (2026-10-13). Impact analysis completado (ADR-0019); pendiente implementación por el Builder.

## Current Step

Implementación de `load_image_folder_dataset` + acotado de mensajes de error + verificación de descarga/extracción en `src/lib/KafeKaggle/funciones.py`.

## Next Step

Builder implementa y añade tests herméticos en `tests/test_KafeKaggle_backend.py`; luego actualizar `src/Ejemplo.kf` y fixtures.

## Expected Outcome

Datos de imagen etiquetados (`X` `[N,3,H,W]` en [0,1], `y` en [0,N-1]) listos para entrenar con `machine.stratified_train_test_split` + GESHA, y errores acotados en vez de volcados de rutas.

## Notes

- Motivo: `Ejemplo.kf` usaba `load_image_dataset(..., "trainLabels.csv", ...)` sobre un dataset sin CSV (etiquetas por carpetas) → error que volcaba ~60000 rutas.
- ADRs de referencia: ADR-0018 (API de imágenes), ADR-0019 (etiquetas por carpetas).