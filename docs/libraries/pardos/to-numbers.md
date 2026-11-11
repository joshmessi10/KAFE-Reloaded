# De tabla a números para MACHINE

Los modelos de [MACHINE](../machine.md) no entienden tablas con títulos: necesitan una **matriz**, es decir, una lista de filas que solo tiene números. Pasar de tabla a matriz es como copiar las notas de la lista de clase a una cuadrícula sin nombres: el modelo solo ve los números.

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

Con esta tabla, las columnas `age` y `score` son números y van a la matriz. `name` y `city` son texto: si una de ellas es la respuesta que quieres predecir (la **etiqueta**), sácala aparte con [`col`](select.md#col) y codifícala para el modelo.

!!! tip "Prepara bien los datos"
    Antes de convertir, revisa las columnas con [`dtypes`](inspect.md#dtypes) y rellena los huecos (mira [Datos que faltan](missing.md)). Separa los datos de entrenamiento y de prueba **antes** de ajustar un escalador. Tienes un recorrido completo en [MACHINE con datos de Kaggle](../../ejemplos/machine-kaggle.md).

### `pardos.to_matrix(df)` { #to_matrix }

**Qué hace:** Convierte la tabla en una **matriz de números decimales** (`FLOAT`). Se queda solo con las columnas `INT` y `FLOAT`; las de texto se ignoran. Un `nan` se convierte en `0.0`.

**Cuándo usarla:** Justo antes de entrenar un modelo de MACHINE con los datos de una tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `df` | `PARDOS` | La tabla con la que trabajas. |

**Devuelve:** `List[List[FLOAT]]`: una fila de números por cada fila de la tabla.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_matrix.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/to_matrix.expec"
```


*También existe con el nombre `pardos.df_to_matrix(df)`, que hace exactamente lo mismo.*

!!! warning "Cuidado con los huecos"
    Como cada `nan` pasa a ser `0.0`, un hueco puede parecer un dato real. Rellénalos tú antes con [`fillna`](missing.md#fillna), [`ffill`](missing.md#ffill) o [`bfill`](missing.md#bfill).


??? warning "Error común"
    Si la tabla no tiene ninguna columna con números, no hay nada que convertir (*No numeric columns were found*):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/to_matrix-no-numbers.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/to_matrix-no-numbers.error.stderr.expec"
    ```

### `pardos.flatten(nested)` { #flatten }

**Qué hace:** **Aplana** una lista de listas: saca todos los valores y los pone en una sola lista, en orden. También aplana listas de listas de listas.

**Cuándo usarla:** Cuando un modelo devuelve una matriz de una sola columna y tú quieres una lista sencilla, o para contar todos los valores de una matriz.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `nested` | `List[...]` | Una lista, con listas dentro o no. |

**Devuelve:** Una lista plana con los mismos valores.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/flatten.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/flatten.expec"
```

## ¿Qué aprendiste?

- `to_matrix` (o `df_to_matrix`) convierte las columnas con números en una matriz `FLOAT`.
- Las etiquetas de texto se sacan aparte con `col`.
- `flatten` convierte una lista de listas en una lista plana.

Volver a [PARDOS](../pardos.md).

[Siguiente: datasets de Kaggle :material-arrow-right:](../../bibliotecas/kaggle.md){ .md-button .md-button--primary }
