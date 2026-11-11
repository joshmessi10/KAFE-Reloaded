# HUGGINGFACE: referencia

Esta página es parte de la librería [HUGGINGFACE](../huggingface.md). Aquí están sus tres funciones: cargar un dataset completo, cargar un split concreto y leer solo los números.

!!! info "Sobre los ejemplos de esta página"
    Las funciones necesitan internet y el [pack de Hugging Face](../huggingface.md#pack). Por eso sus ejemplos se muestran con una **salida de ejemplo**: es lo que verás con el pack instalado y conexión. Los errores sí están probados, porque KAFE revisa los argumentos **antes** de descargar nada.

## Cargar datasets { #load }

Un dataset de Hugging Face llega como una tabla: cada fila es un ejemplo y cada columna es un dato. KAFE te lo puede dar de dos maneras:

- Como **DataFrame** de [PARDOS](../../libraries/pardos.md): la tabla completa, con los nombres de las columnas. Sirve para mirar los datos.
- Como **matriz**: una lista de listas de `FLOAT`, solo con las columnas que eliges. Es lo que necesitan los modelos.

### `huggingface.load_dataset(dataset_name)` { #load_dataset }

**Qué hace:** Descarga un dataset y te da su split `"train"` como DataFrame de PARDOS. Si el dataset no tiene `"train"`, te da el primer split que encuentre.

**Cuándo usarla:** Para conocer un dataset nuevo: cuántas filas tiene y qué columnas trae.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset en Hugging Face, como `"imdb"` o `"scikit-learn/iris"`. |

**Devuelve:** `PARDOS`: un DataFrame. Los números, textos y `BOOL` quedan igual; los valores vacíos se vuelven `""`; las listas y los diccionarios se vuelven texto.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Hugging Face.

**Ejemplo:**

```kafe
import huggingface;
PARDOS df = huggingface.load_dataset("scikit-learn/iris");
show(df.shape());
```

**Salida de ejemplo:** `[filas, columnas]`.

```text
[150, 6]
```

!!! warning "Los datasets grandes ocupan mucha memoria"
    `load_dataset` lee **todas** las filas del split. Con un dataset enorme, tu computadora puede quedarse sin memoria. Si solo necesitas números, usa `load_dataset_matrix` con un `limit`.

??? note "¿Y `hf_load_dataset`?"
    `hf_load_dataset` **no** es una función de KAFE. Es un nombre interno que la librería usa para guardar la función del paquete `datasets`. Usa `huggingface.load_dataset`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/hf_load_dataset.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/hf_load_dataset.error.stderr.expec"
    ```

### `huggingface.load_dataset_split(dataset_name, split)` { #load_dataset_split }

**Qué hace:** Descarga un dataset y te da **el split que eliges** como DataFrame de PARDOS.

**Cuándo usarla:** Cuando quieres el montón de examen (`"test"`) o el de validación (`"validation"`), y no el de entrenamiento.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset en Hugging Face. |
| `split` | `STR` | El split que quieres: `"train"`, `"test"`, `"validation"`… Depende de cada dataset. |

**Devuelve:** `PARDOS`: un DataFrame con las filas de ese split.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Hugging Face. El dataset `imdb` (reseñas de películas) pesa bastante: la primera descarga tarda.

**Ejemplo:** el split de examen de `imdb`, con una columna `text` (la reseña) y una `label` (0 = mala, 1 = buena).

```kafe
import huggingface;
PARDOS test_df = huggingface.load_dataset_split("imdb", "test");
show(test_df.shape());
```

**Salida de ejemplo:**

```text
[25000, 2]
```

??? warning "Error común"
    Aquí `split` es obligatorio. Si solo das el nombre del dataset, KAFE se queja del número de argumentos. Para el split por defecto, usa `load_dataset`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/load_dataset_split-missing-split.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/load_dataset_split-missing-split.error.stderr.expec"
    ```

### `huggingface.load_dataset_matrix(dataset_name, columns, split, limit)` { #load_dataset_matrix }

**Qué hace:** Lee solo las **columnas numéricas** que eliges y te las da como matriz de `FLOAT`, sin construir un DataFrame.

**Cuándo usarla:** Cuando vas a dar los datos directo a un modelo de [MACHINE](../../libraries/machine.md) (por ejemplo, para agrupar flores con K-Means) o de [GESHA](../../libraries/gesha.md).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset en Hugging Face. |
| `columns` | `List[STR]` | Opcional. Los nombres de las columnas. Si la lista está vacía, KAFE elige las columnas que son números en la primera fila. |
| `split` | `STR` | Opcional. El split que quieres. Por defecto, `"train"`. |
| `limit` | `INT` | Opcional. Cuántas filas leer como máximo. `0` = todas. |

**Devuelve:** `List[List[FLOAT]]`: una fila de números por cada ejemplo.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Hugging Face.

**Ejemplo:** las 3 primeras flores, con el largo y el ancho del sépalo.

```kafe
import huggingface;
List[STR] columns = ["SepalLengthCm", "SepalWidthCm"];
List[List[FLOAT]] X = huggingface.load_dataset_matrix("scikit-learn/iris", columns, "train", 3);
show(X);
```

**Salida de ejemplo:**

```text
[[5.1, 3.5], [4.9, 3.0], [4.7, 3.2]]
```

!!! note "Ojo"
    Todos los valores de las columnas elegidas deben ser números. Si uno está vacío o es texto, KAFE se detiene con un error que nombra la columna. Leer una matriz ahorra el DataFrame intermedio, pero los modelos como K-Means igual guardan todas las filas en memoria: usa `limit` con datasets grandes.

??? warning "Error común"
    `columns` es una **lista** de nombres, aunque quieras una sola columna. Escribe `["SepalLengthCm"]`, no `"SepalLengthCm"`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/load_dataset_matrix-columns-not-list.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/load_dataset_matrix-columns-not-list.error.stderr.expec"
    ```

## Resumen de todas las funciones { #summary }

| Función | Devuelve |
|---|---|
| [`huggingface.load_dataset(dataset_name)`](#load_dataset) | `PARDOS` con el split `"train"` |
| [`huggingface.load_dataset_split(dataset_name, split)`](#load_dataset_split) | `PARDOS` con el split elegido |
| [`huggingface.load_dataset_matrix(dataset_name, columns, split, limit)`](#load_dataset_matrix) | `List[List[FLOAT]]` |

Si quieres comparar, la librería [KAGGLE](../kaggle.md) tiene funciones con nombres parecidos.

## ¿Qué aprendiste?

- `load_dataset` te da el split `"train"` como DataFrame; `load_dataset_split` te da el split que elijas.
- `load_dataset_matrix` te da solo los números, listos para un modelo.
- Las tres necesitan internet y el pack de Hugging Face.

[Siguiente librería: MACHINE :material-arrow-right:](../../libraries/machine.md){ .md-button .md-button--primary }
