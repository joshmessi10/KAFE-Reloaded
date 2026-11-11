# KAGGLE: frases con etiqueta

Esta página es parte de la librería [KAGGLE](../kaggle.md). Aquí aprendes a leer frases que traen una clase, como opiniones buenas o malas.

!!! info "Sobre los ejemplos de esta página"
    Las funciones de esta página necesitan internet y el [pack de Kaggle](../kaggle.md#pack). Por eso sus ejemplos se muestran con una **salida de ejemplo**: es lo que verás con el pack instalado y conexión. Los errores sí están probados, porque KAFE los revisa **antes** de descargar nada.

Algunos datasets son listas de frases, cada una con un número que dice su **clase**. Por ejemplo, reseñas de restaurantes: `1` si la opinión es buena y `0` si es mala. Cada línea del archivo tiene la frase, un separador (casi siempre una tabulación, `TAB`) y la etiqueta:

```text
Wow... Loved this place.	1
Crust is not good.	0
```

Estos archivos **no tienen encabezado**: todas las líneas son ejemplos. Por eso usan su propia función.

### `kaggle.load_text_dataset(dataset_name, file_name, delimiter, text_column, label_column, limit)` { #load_text_dataset }

**Qué hace:** Lee un archivo de frases con etiqueta y te da un DataFrame con dos columnas: `text` (la frase) y `label` (la etiqueta entera).

**Cuándo usarla:** Para entrenar un modelo que clasifique textos, como el de [análisis de sentimiento con RNN](../../ejemplos/ejemplo-rnn2-sentimiento.kf).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `file_name` | `STR` | Opcional. El archivo `.txt`, `.tsv` o `.csv`. Vacío = el único archivo de texto. |
| `delimiter` | `STR` | Opcional. **Un solo carácter** que separa las celdas. Por defecto, la tabulación. |
| `text_column` | `INT` | Opcional. En qué celda está la frase, contando desde 0. Por defecto, `0`. |
| `label_column` | `INT` | Opcional. En qué celda está la etiqueta. Por defecto, `1`. |
| `limit` | `INT` | Opcional. Cuántas frases como máximo. `0` = todas. |

**Devuelve:** `PARDOS`: un DataFrame con las columnas `text` (`STR`) y `label` (`INT`).

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:** reseñas de Yelp. La ruta del archivo va completa porque el dataset trae dos copias con el mismo nombre.

```kafe
import kaggle;
PARDOS df = kaggle.load_text_dataset("marklvl/sentiment-labelled-sentences-data-set", "sentiment labelled sentences/yelp_labelled.txt");
show(df.shape());
List[STR] texts = df.col("text");
List[INT] labels = df.col("label");
show(texts[0]);
show(labels[0]);
```

**Salida de ejemplo:**

```text
[1000, 2]
Wow... Loved this place.
1
```

??? warning "Error común"
    `delimiter` debe ser **un solo** carácter. `"; "` tiene dos (punto y coma y espacio):

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_text_dataset-delimiter.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_text_dataset-delimiter.error.stderr.expec"
    ```

## ¿Qué aprendiste?

- Los archivos de frases con etiqueta no tienen encabezado: cada línea es un ejemplo.
- `load_text_dataset` te da un DataFrame con las columnas `text` y `label`.

[Siguiente: Imágenes :material-arrow-right:](imagenes.md){ .md-button .md-button--primary }
