# KAGGLE: tablas

Esta página es parte de la librería [KAGGLE](../kaggle.md). Aquí aprendes a leer tablas: archivos CSV con filas y columnas.

!!! info "Sobre los ejemplos de esta página"
    Las funciones de esta página necesitan internet y el [pack de Kaggle](../kaggle.md#pack). Por eso sus ejemplos se muestran con una **salida de ejemplo**: es lo que verás con el pack instalado y conexión. Los errores sí están probados, porque KAFE los revisa **antes** de descargar nada.

Una tabla de Kaggle suele ser un archivo **CSV**: un texto donde cada línea es una fila y las celdas se separan con comas. La primera línea es el **encabezado**: los nombres de las columnas.

```text
Id,SepalLengthCm,SepalWidthCm,PetalLengthCm,PetalWidthCm,Species
1,5.1,3.5,1.4,0.2,Iris-setosa
2,4.9,3.0,1.4,0.2,Iris-setosa
```

KAGGLE puede darte la tabla completa como un **DataFrame** de [PARDOS](../../libraries/pardos.md) (una tabla con nombres de columnas), o solo los números como una **matriz** (una lista de listas de `FLOAT`), que es lo que los modelos necesitan.

**¿Qué archivo lee?** KAFE elige el archivo así:

1. Si das el nombre de archivo (`file_name`), usa ese. Puede ser el nombre (`"Iris.csv"`) o la ruta dentro del dataset (`"data/train.csv"`).
2. Si no, usa el selector `split`: `"train"` busca `train.csv` y `"test"` busca `test.csv`.
3. Si no das ninguno y el dataset tiene **un solo** CSV, lee ese. Si tiene varios, te muestra la lista para que elijas.

### `kaggle.load_dataset(dataset_name, file_name)` { #load_dataset }

**Qué hace:** Descarga un dataset y lee una tabla CSV como DataFrame de PARDOS.

**Cuándo usarla:** Cuando quieres ver la tabla completa, con sus nombres de columnas, antes de entrenar un modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, con la forma `"dueño/nombre"`. |
| `file_name` | `STR` | Opcional. El archivo CSV que quieres leer. Si lo omites, lee el único CSV del dataset. |

**Devuelve:** `PARDOS`: un DataFrame. Los números se vuelven `INT` o `FLOAT`, el texto queda como `STR` y las celdas vacías se vuelven `NaN` ("no es un número").

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:**

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
show(df.shape());
```

**Salida de ejemplo:** `[filas, columnas]`.

```text
[150, 6]
```

??? warning "Error común"
    El nombre del dataset no puede estar vacío:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset-empty-name.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset-empty-name.error.stderr.expec"
    ```

### `kaggle.load_dataset_split(dataset_name, file_name, split)` { #load_dataset_split }

**Qué hace:** Igual que `load_dataset`, pero te deja elegir el archivo con un **selector** parecido a un *split*: `"train"` busca `train.csv` y `"test"` busca `test.csv`.

**Cuándo usarla:** Cuando el dataset trae la división hecha en dos archivos y quieres cargar solo la parte de entrenamiento o solo la de prueba.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `file_name` | `STR` | El archivo que quieres leer. Escribe `""` (vacío) para usar `split`. Si no está vacío, **tiene prioridad**. |
| `split` | `STR` | Opcional. Selector de archivo: `"train"`, `"test"` o el nombre del archivo sin `.csv`. |

**Devuelve:** `PARDOS`: un DataFrame con el archivo elegido.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:** el dataset de iris tiene un archivo `Iris.csv`, así que el selector `"Iris"` lo encuentra. En un dataset con `train.csv` escribirías `"train"`.

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset_split("uciml/iris", "", "Iris");
show(df.shape());
```

**Salida de ejemplo:**

```text
[150, 6]
```

??? warning "Error común"
    `file_name` es obligatorio, aunque esté vacío. Si solo das el dataset, KAFE se queja del número de argumentos:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset_split-missing-file.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset_split-missing-file.error.stderr.expec"
    ```

### `kaggle.load_dataset_matrix(dataset_name, columns, split, limit)` { #load_dataset_matrix }

**Qué hace:** Lee solo las **columnas numéricas** que eliges y te las da como una matriz de `FLOAT`, sin pasar por un DataFrame.

**Cuándo usarla:** Cuando ya sabes qué columnas quieres y vas a dárselas directo a un modelo de [MACHINE](../../libraries/machine.md) o de [GESHA](../../libraries/gesha.md).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `columns` | `List[STR]` | Opcional. Los nombres de las columnas. Si la lista está vacía, KAFE elige las columnas que son números en la primera fila. |
| `split` | `STR` | Opcional. Selector de archivo, como en `load_dataset_split` (`"train"`, `"Iris.csv"`…). Vacío = el único CSV. |
| `limit` | `INT` | Opcional. Cuántas filas leer como máximo. `0` = todas. |

**Devuelve:** `List[List[FLOAT]]`: una fila de números por cada ejemplo.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:** las 3 primeras flores, con el largo del sépalo y del pétalo.

```kafe
import kaggle;
List[List[FLOAT]] X = kaggle.load_dataset_matrix("uciml/iris", ["SepalLengthCm", "PetalLengthCm"], "Iris.csv", 3);
show(X);
```

**Salida de ejemplo:**

```text
[[5.1, 1.4], [4.9, 1.4], [4.7, 1.3]]
```

!!! note "Ojo"
    Todas las celdas de las columnas elegidas deben ser números. Si una celda está vacía o tiene texto, KAFE se detiene con un error que nombra la columna. (Esto es distinto de `load_dataset`, que convierte las celdas vacías en `NaN`.)

??? warning "Error común"
    `columns` es una **lista** de nombres, aunque quieras una sola columna. Escribe `["SepalLengthCm"]`, no `"SepalLengthCm"`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset_matrix-columns-not-list.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset_matrix-columns-not-list.error.stderr.expec"
    ```

## ¿Qué aprendiste?

- `load_dataset` te da la tabla completa como DataFrame de PARDOS.
- `load_dataset_split` elige el archivo con un selector como `"train"` o `"test"`.
- `load_dataset_matrix` te da solo los números, listos para un modelo.

[Siguiente: Frases con etiqueta :material-arrow-right:](texto.md){ .md-button .md-button--primary }
