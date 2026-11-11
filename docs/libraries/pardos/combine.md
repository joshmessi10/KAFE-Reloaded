# Juntar tablas

A veces los datos vienen en **varias tablas**. Hay dos maneras de juntarlas, y cada una tiene su función y su método (la misma operación escrita de dos formas: `pardos.concat(a, b)` o `a.concat(b)`).

## Apilar: una tabla debajo de otra { #stacking }

Imagina dos hojas de lista de clase, una del grupo A y otra del grupo B, con las **mismas columnas**. Si pones la segunda hoja debajo de la primera, tienes una sola lista más larga. Eso es **concatenar** (`concat`).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-concat.svg"
<figcaption>Las filas de la segunda tabla bajan y se colocan debajo de las de la primera. Las columnas son las mismas.</figcaption>
</figure>

### `pardos.concat(first, second)` { #concat }

**Qué hace:** Pone las filas de `second` **debajo** de las de `first`.

**Cuándo usarla:** Para unir datos del mismo tipo que vienen en varios archivos: un archivo por mes, un archivo por grupo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `first` | `PARDOS` | La tabla de arriba. |
| `second` | `PARDOS` | La tabla de abajo. Debe tener las mismas columnas (pueden estar en otro orden). |

**Devuelve:** `PARDOS`: una tabla nueva con todas las filas, con el orden de columnas de `first`.

**Datos de entrada**

`data/class-a.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/class-a.csv"
```

`data/class-b.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/class-b.csv"
```

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/concat.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/concat.expec"
```

??? warning "Error común"
    Si las columnas no son las mismas, las hojas no encajan (*Columns do not match*):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/concat-columns.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/concat-columns.error.stderr.expec"
    ```

### `df.concat(other)` { #df-concat }

**Qué hace:** Lo mismo que [`pardos.concat`](#concat), escrito como método: pone `other` debajo de `df`.

**Cuándo usarla:** Cuando prefieres escribir la operación desde la primera tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `other` | `PARDOS` | La tabla de abajo, con las mismas columnas. |

**Devuelve:** `PARDOS`: una tabla nueva con todas las filas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/df-concat.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/df-concat.expec"
```

## Unir por una columna común { #joining }

Ahora imagina dos listas **distintas**: una con las notas de cada estudiante y otra con el club al que va cada uno. Para saber la nota **y** el club de cada persona, buscas su nombre en las dos listas y juntas lo que dicen. Eso es **unir** (`merge`). La columna que se busca en las dos tablas (aquí `name`) se llama **clave**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-merge.svg"
<figcaption>Se unen las filas con el mismo `name`. Ana y Sofia están en las dos tablas y pasan al resultado; Luis y Pablo no tienen pareja y se quedan fuera.</figcaption>
</figure>

### `pardos.merge(left, right, key, how)` { #merge }

**Qué hace:** Junta cada fila de `left` con las filas de `right` que tienen el **mismo valor** en la columna `key`.

**Cuándo usarla:** Cuando la información de cada persona (o producto, o ciudad) está repartida en varias tablas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `left` | `PARDOS` | La tabla principal. |
| `right` | `PARDOS` | La tabla que aporta columnas nuevas. |
| `key` | `STR` | La columna común. Debe existir en las dos tablas. |
| `how` | `STR` | Opcional. `"inner"` (por defecto): solo filas con pareja. `"left"`: todas las filas de `left`; si no tienen pareja, las columnas nuevas quedan en `None` ("nada"). |

**Devuelve:** `PARDOS`: una tabla nueva con las columnas de `left` más las de `right` (sin repetir `key`).

**Datos de entrada**

`data/students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

`data/clubs.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/clubs.csv"
```

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/merge.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/merge.expec"
```


!!! note "Solo `inner` y `left`"
    Cualquier otro valor de `how` (por ejemplo `"outer"` o `"right"`) se comporta igual que `"inner"`, sin avisar. Si `key` no existe en alguna de las dos tablas, KAFE responde `Column '…' not found in both DataFrames`.

??? info "Para curiosos 🤓"
    Para no comparar cada fila con todas las demás, `merge` primero hace un **índice** de `right`: una especie de agenda que dice, para cada valor de `key`, qué filas lo tienen. Después recorre `left` una sola vez y busca cada nombre en esa agenda. Así, con $n$ filas en `left` y $m$ en `right`, el trabajo crece como $n + m$ y no como $n \times m$.


### `df.merge(other, key, how)` { #df-merge }

**Qué hace:** Lo mismo que [`pardos.merge`](#merge), escrito como método: `df` es la tabla principal.

**Cuándo usarla:** Cuando prefieres escribir la operación desde la tabla principal.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `other` | `PARDOS` | La tabla que aporta columnas nuevas. |
| `key` | `STR` | La columna común. |
| `how` | `STR` | Opcional. `"inner"` (por defecto) o `"left"`. |

**Devuelve:** `PARDOS`: una tabla nueva.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/df-merge.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/df-merge.expec"
```

## ¿Qué aprendiste?

- `concat` apila tablas con las mismas columnas.
- `merge` une tablas buscando el mismo valor en una columna clave.
- Cada una existe como función (`pardos.concat`) y como método (`a.concat`).

Volver a [PARDOS](../pardos.md).

[Siguiente: guardar tablas :material-arrow-right:](save.md){ .md-button .md-button--primary }
