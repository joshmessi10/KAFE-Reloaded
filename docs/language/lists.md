# Listas

Una **lista** guarda muchos valores del mismo tipo, uno detrás de otro. En la lección [Variables](../aprende/variables.md#listas-una-caja-con-compartimentos) viste que es como una caja con compartimentos numerados y aprendiste `[0]`, `len` y `append`. Aquí verás todo lo demás.

## Crear listas

El tipo de una lista se escribe `List[TIPO]`, y sus valores van entre corchetes `[ ]`, separados por comas. Una lista puede estar vacía, y también puede guardar **otras listas** (una lista de listas es como una tabla o una **matriz**):

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-declare.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-declare.expec"
```

| Tipo | Qué guarda |
|---|---|
| `List[INT]` | Enteros, como `[1, 2, 3]` |
| `List[List[INT]]` | Listas de enteros: una tabla con filas y columnas |
| `List[List[List[BOOL]]]` | Listas de listas de `BOOL`: un "cubo" de tres niveles |

!!! note "Todas del mismo tipo"
    Una lista es **homogénea**: todos sus elementos tienen el mismo tipo. `List` se escribe con mayúscula inicial y el resto en minúscula.

## Agregar, quitar y contar

### Una comparación de la vida diaria

Piensa en tu **lista de compras**. Agregas cosas al final, tachas lo que ya compraste y cuentas cuántas cosas faltan.

| Función | Qué hace |
|---|---|
| `append(lista, elemento)` | Agrega `elemento` **al final** de la lista |
| `remove(lista, elemento)` | Quita la **primera** vez que aparece `elemento` |
| `len(lista)` | Devuelve cuántos elementos hay (un `INT`) |

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-compras.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-compras.expec"
```

`append` y `remove` cambian la lista que les das; no hace falta guardarla otra vez. Cuando `show` muestra una lista de textos, cada texto aparece entre comillas simples.

Si el elemento aparece varias veces, `remove` solo quita el primero:

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-remove-first.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-remove-first.expec"
```

!!! note "`len` solo cuenta listas"
    En KAFE, `len` acepta listas, pero no textos. `len("hola")` da un error.

Para crear listas de números seguidos usa `range(...)`, que viste en [Estructuras de control](control-structures.md).

## Índices: la posición de cada elemento

### La idea en una frase

El **índice** es el número de compartimento de un elemento, y se cuenta **desde 0**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang2-indices.svg"
<figcaption>Arriba, los índices desde el inicio (0, 1, 2). Abajo, los índices negativos, que cuentan desde el final (-1 es el último).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-index.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-index.expec"
```

| Regla | Qué significa |
|---|---|
| Empieza en 0 | `nums[0]` es el primer elemento |
| Índices negativos | `nums[-1]` es el último; `nums[-2]`, el penúltimo |
| Cambiar un elemento | `nums[0] = 99;` reemplaza el valor de ese compartimento |
| Fuera de rango | Pedir una posición que no existe da un `IndexError` |
| Tipo del índice | El índice debe ser un `INT` |

## Listas dentro de listas: matrices

Una **matriz** es una tabla de números. En KAFE es una lista de filas, y cada fila es una lista. Para llegar a un número usas **dos** índices: primero la fila, luego la columna. Es como buscar un asiento en el cine: fila 1, asiento 2.

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-matrix.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-matrix.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `matrix[0]` es la primera fila completa: `[1, 2, 3]`.
    2. `matrix[1][2]` es la fila 1, columna 2: el `6`. `matrix[-1][-1]` es la última fila, última columna: el `9`.
    3. `matrix[1][1] = 0;` cambió el `5` del centro por `0`.
    4. `len(matrix)` cuenta las filas (3) y `len(matrix[0])` cuenta las columnas de la primera fila (3).

Para hacer cuentas de álgebra lineal con matrices (sumar, multiplicar, transponer), usa la librería [NUMK](../libraries/numk.md).

## Unir listas con `+`

El operador `+` une dos listas del mismo tipo, una detrás de la otra (esto se llama **concatenar**):

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-concat.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-concat.expec"
```

!!! warning "Por ahora `+` también cambia la primera lista"
    `c` es `[1, 2, 3, 4]`, como esperabas. Pero fíjate en la segunda línea: `a` **también** cambió, aunque solo escribimos `a + b`. Así funciona KAFE hoy. Si necesitas conservar `a` intacta, no la uses a la izquierda de `+`.

??? info "Para curiosos 🤓: dos nombres, una sola lista"
    Cuando escribes `List[INT] other = original;`, no se crea una lista nueva: `other` y `original` son **dos etiquetas pegadas a la misma caja**. Si cambias una, ves el cambio en la otra:

    ```kafe
    --8<-- "tests/DocsExamples/tutorial/lists-shared.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/tutorial/lists-shared.expec"
    ```

## Errores comunes

### Pedir una posición que no existe

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-out-of-range.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-out-of-range.error.stderr.expec"
```

La lista tiene 3 elementos, así que sus índices son 0, 1 y 2. El último es `nums[2]` (o `nums[-1]`).

### Mezclar tipos en una lista

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-mixed-types.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-mixed-types.error.stderr.expec"
```

Una `List[INT]` solo guarda enteros. Ojo: hoy KAFE no avisa en el `append`, sino la siguiente vez que usas la lista (aquí, en `show`). Si ves este error, busca hacia atrás dónde agregaste el valor equivocado.

### Quitar algo que no está

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-remove-missing.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-remove-missing.error.stderr.expec"
```

El `5` no está en la lista, así que no se puede quitar.

### Usar un índice que no es `INT`

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-float-index.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-float-index.error.stderr.expec"
```

`1.0` es un `FLOAT`. No existe el compartimento "uno coma cero": escribe `nums[1]`.

## ¿Qué aprendiste?

- `append` agrega al final, `remove` quita la primera coincidencia y `len` cuenta.
- Los índices empiezan en 0; los negativos cuentan desde el final.
- Una lista de listas es una matriz: `matriz[fila][columna]`.

[Siguiente: Imports :material-arrow-right:](imports.md){ .md-button .md-button--primary }
