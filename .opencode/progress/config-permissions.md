# Reporte: Permisos por agente en opencode.json

Fecha: 2026-10-18

## Archivo escrito

- `opencode.json` (raíz del proyecto) — contenido completo reemplazado según la especificación de permisos.

## Validación JSON

- JSON válido (parseado con `json.load`): OK.
- Claves de `agent` (6): `engineering-lead`, `architect`, `builder`, `reviewer`, `historian`, `tester`.
- `subagent_depth`: eliminado (ya no está presente).
- Bloque `write`: eliminado (ya no está presente; las escrituras pasan por `edit`).

## Resumen de permisos por agente

### engineering-lead (primary)
- `task`: `*` = ask; allow para `architect`, `builder`, `reviewer`, `historian`, `tester`.
- `edit`: `**` = deny primero; allow para `.opencode/**`, `docs/**`, `AGENTS.md`, `OPENCODE.md`, `mkdocs.yml`, `opencode.json`.
- `bash`: `*` = ask; allow para `pytest*`, `python*`.

### architect (subagent)
- `task`: deny (sin anidación).
- `edit`: `**` = deny; allow para `.opencode/**`, `docs/**`.
- `bash`: `*` = deny (sin allow).

### builder (subagent)
- `task`: deny (sin anidación).
- `edit`: `**` = deny; allow para `src/**`, `tests/**`, `docs/**`, `.opencode/**`, `mkdocs.yml`, `opencode.json`.
- `bash`: `*` = deny; allow para `pytest*`, `python*`.

### reviewer (subagent)
- `task`: deny (sin anidación).
- `edit`: `**` = deny; allow para `.opencode/**`.
- `bash`: `*` = deny; allow para `pytest*`.

### historian (subagent)
- `task`: deny (sin anidación).
- `edit`: `**` = deny; allow para `.opencode/**`, `docs/**`.
- `bash`: `*` = deny (sin allow).

### tester (subagent)
- `task`: deny (sin anidación).
- `edit`: `**` = deny; allow para `.opencode/**`, `docs/**`.
- `bash`: `*` = deny; allow para `pytest*`, `python*`.

## Notas

- En `edit`, `**` = deny va PRIMERO y los `allow` específicos después (el último match gana en opencode).
- Subagentes con `mode: "subagent"` explícito y `bash` deny con catch-all: cero prompts en el flujo normal de KAFE; acciones fuera de alcance fallan rápido.
- Cambios efectivos solo tras reiniciar opencode (la config no se recarga en caliente).
