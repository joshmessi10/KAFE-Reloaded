# Impact Analysis (retroactivo) — Nomenclatura inglesa en helpers privados de KafeKaggle/KafeMACHINE/KafeGESHA

> Nota: análisis retroactivo escrito el 2026-10-18 tras implementar y validar (mismo precedente que `impact-cnn-performance.md`). El alcance fue acordado con el usuario mediante escaneo previo del Lead.

## Feature

Anglicanizar los helpers privados (prefijo `_`) con nombres en español de las librerías nuevas — KafeKaggle, KafeHF, KafeMACHINE y KafeGESHA. FUERA de alcance por decisión explícita: el núcleo del intérprete (`TypeUtils.py`, `global_utils.py`) y las constantes de tipos (`entero_t`, `flotante_t`, `vector_numeros_t`...), que son lotes futuros con blast radius amplio.

## Mapeo aplicado (12 funciones + parámetros)

- KafeKaggle/funciones.py: `_formatear_lista(elementos, limite)`→`_format_list(items, limit)`; `_elegir_archivo(..., extensiones, descripcion, etiqueta)`→`_choose_file(..., extensions, description, label)`; `_select_file_texto(miembros,...)`→`_select_file_text(members,...)`; `_leer_filas`→`_read_rows`; `_es_entero(celda)`→`_is_integer(cell)`; params de `_to_number(cell)`, `_convert_to_pardos(columns, rows)`, `_normalize_dimension(value, name)`, `_resolve_member(..., description)`.
- KafeMACHINE/preprocessing/Tokenizer.py: `_tokenizar(texto)`→`_tokenize(text)`; `_validar_texts(self, texts, metodo)`→`_validate_texts(self, texts, method)`.
- KafeGESHA/models.py: `_acumular_en(destino, origen)`→`_accumulate_into(target, source)`.
- KafeGESHA/optimizers/adam.py: `_adam_actualizar(datos, momentos, varianzas, gradiente, ..., correccion_m, correccion_v)`→`_adam_update(data, moments, variances, gradient, ..., bias_correction_m, bias_correction_v)`.
- KafeHF: sin hallazgos (limpio).

## Riesgos

- Uso intra-archivo de todos los helpers → riesgo bajo; API pública (fábricas `machine.*`, `kaggle.*`, `geshaDeep.*`) intacta.
- Tests que referenciaban nombres privados (`test_KafeMACHINE.py`, `test_KafeKaggle_backend.py`) actualizados en la misma pasada.

## Resultado

Greps de los 12 nombres viejos: 0 hits en `src/`, `tests/`, `docs/` y `.opencode/knowledge/` (hits en history/adr/progress/benchmarks esperados e intocables: registros históricos). Suite `pytest tests/ -q` → **692 passed, 2 skipped** (589 s). Knowledge vivo actualizado: `libraries.md`, `concepts/kaggle-dataset-ingestion.md`. Hallazgo lateral: fixture `tests/KafeMACHINE/model_selection/test_train_test_split_container.kf` aparecido durante un despacho interrumpido de la sesión (23:06), sin atribución, validado y conservado (verde, cobertura real del contrato contenedor de `train_test_split`).

## Follow-ups

1. Constantes de tipos en español (lote futuro).
2. Núcleo TypeUtils/global_utils en español (lote futuro).
3. Locales en español dentro de cuerpos (p. ej. `valor`, `indice` en models.py) — deuda menor.
