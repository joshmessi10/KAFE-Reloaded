# Current Work

## Feature:

**Status:** in_progress

**Feature:** KafeKAGGLE — ingesta robusta de datasets de imágenes (etiquetas por carpetas)

**Current step:** Implementación de API de etiquetas por carpetas + acotado de errores + ingesta robusta
**Next step:** Builder implementa y añade tests
**Blockers:** None
**Related ADRs:** ADR-0018, ADR-0019

---

## Notes:

Nueva función `load_image_folder_dataset` (etiquetas por directorio padre) + muestreo determinista para `limit` + mensajes de error acotados + verificación de descarga/extracción.
