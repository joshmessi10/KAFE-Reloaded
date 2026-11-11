# Guardar tablas

Después de limpiar o combinar una tabla, puedes **guardarla** en un archivo para usarla otro día o abrirla en una hoja de cálculo. Es como pasar a limpio tu cuaderno.

Los ejemplos guardan el archivo, lo leen con la librería [FILES](../files.md) para que veas qué quedó dentro y luego lo borran.

!!! warning "Se escribe encima"
    Si ya existe un archivo con ese nombre, se **reemplaza** sin preguntar. La ruta se cuenta desde la carpeta de tu archivo `.kf`.

### `df.to_csv(path)` { #to_csv }

**Qué hace:** Guarda la tabla en un archivo **CSV** separado por comas. Los `nan` se guardan como celdas vacías.

**Cuándo usarla:** Para compartir tus datos o leerlos después con [`read_csv`](tables.md#read_csv).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | La ruta del archivo nuevo. |

**Devuelve:** Nada (`VOID`). Se usa como instrucción suelta.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_csv.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/to_csv.expec"
```

### `df.to_json(path)` { #to_json }

**Qué hace:** Guarda la tabla en un archivo **JSON**: una lista de fichas, una por fila. Los `nan` se guardan como `null`.

**Cuándo usarla:** Para pasar los datos a una página web u otro programa, o leerlos con [`read_json`](tables.md#read_json).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | La ruta del archivo nuevo. |

**Devuelve:** Nada (`VOID`).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_json.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/to_json.expec"
```

## ¿Qué aprendiste?

- `to_csv` guarda la tabla como CSV y `to_json` como JSON.
- Si el archivo ya existe, se reemplaza.

Volver a [PARDOS](../pardos.md).

[Siguiente: de tabla a números :material-arrow-right:](to-numbers.md){ .md-button .md-button--primary }
