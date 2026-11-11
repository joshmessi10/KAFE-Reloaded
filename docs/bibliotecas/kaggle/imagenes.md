# KAGGLE: imágenes

Esta página es parte de la librería [KAGGLE](../kaggle.md). Aquí aprendes a convertir fotos en números. Si aún no lo has leído, mira primero [una imagen es una cuadrícula de números](../kaggle.md#image-grid).

!!! info "Sobre los ejemplos de esta página"
    Las funciones de esta página necesitan internet y el [pack de Kaggle](../kaggle.md#pack). Por eso sus ejemplos se muestran con una **salida de ejemplo**: es lo que verás con el pack instalado y conexión. Los errores sí están probados, porque KAFE los revisa **antes** de descargar nada.

Las funciones de imágenes buscan archivos `.png`, `.jpg`, `.jpeg` y `.bmp` dentro del dataset, en todas sus carpetas. Cada imagen pasa por tres pasos:

1. **Se cambia de tamaño** a `height × width` píxeles (por defecto, 32 × 32), para que todas midan lo mismo.
2. **Se elige el color**: `"rgb"` da 3 canales (rojo, verde, azul) y `"gray"` (o `"grayscale"`) da 1 canal gris.
3. **Se convierte en números** entre `0.0` y `1.0`, con la forma `[canales][alto][ancho]`.

Esa forma es la que esperan las capas de convolución de [GESHA](../../libraries/gesha.md).

!!! warning "Las imágenes ocupan mucha memoria"
    Cada imagen de 32 × 32 en color son 3 × 32 × 32 = 3072 números. Mil imágenes son más de tres millones. Usa `limit` para cargar primero una muestra pequeña.

??? info "Para curiosos 🤓"
    Un píxel guardado en el archivo va de 0 a 255. KAFE lo divide entre 255 para dejarlo entre 0 y 1: $p_{\text{KAFE}} = p / 255$. Cargar $N$ imágenes ocupa memoria proporcional a $N \times C \times H \times W$ (imágenes × canales × alto × ancho).

### `kaggle.load_image(dataset_name, image_path, height, width, color_mode)` { #load_image }

**Qué hace:** Carga **una sola** imagen del dataset como lista de números `[canales][alto][ancho]`.

**Cuándo usarla:** Para mirar una imagen concreta o probar tu modelo con un ejemplo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `image_path` | `STR` | La ruta de la imagen dentro del dataset, como `"train/12.png"`. También vale solo el nombre del archivo si no hay otro igual. |
| `height` | `INT` | Opcional. Alto final en píxeles. Por defecto, `32`. |
| `width` | `INT` | Opcional. Ancho final en píxeles. Por defecto, `32`. |
| `color_mode` | `STR` | Opcional. `"rgb"` (3 canales) o `"gray"` (1 canal). Por defecto, `"rgb"`. |

**Devuelve:** `List[List[List[FLOAT]]]`: una imagen.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle. Cambia `"owner/images"` y `"train/12.png"` por un dataset y una imagen reales. Si la ruta no existe, el error te muestra la lista de archivos disponibles.

**Ejemplo:** una imagen en gris de 28 × 28.

```kafe
import kaggle;
List[List[List[FLOAT]]] img = kaggle.load_image("owner/images", "train/12.png", 28, 28, "gray");
show([len(img), len(img[0]), len(img[0][0])]);
```

**Salida de ejemplo:** `[canales, alto, ancho]`.

```text
[1, 28, 28]
```

??? warning "Error común"
    `color_mode` solo acepta `"rgb"`, `"gray"` o `"grayscale"`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image-color-mode.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image-color-mode.error.stderr.expec"
    ```

### `kaggle.load_images(dataset_name, height, width, color_mode, limit)` { #load_images }

**Qué hace:** Carga **todas** las imágenes del dataset (o las primeras `limit`), ordenadas por su ruta.

**Cuándo usarla:** Cuando quieres un montón de imágenes **sin etiquetas**, por ejemplo para agruparlas o para un autoencoder.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `height` | `INT` | Opcional. Alto final. Por defecto, `32`. |
| `width` | `INT` | Opcional. Ancho final. Por defecto, `32`. |
| `color_mode` | `STR` | Opcional. `"rgb"` o `"gray"`. Por defecto, `"rgb"`. |
| `limit` | `INT` | Opcional. Cuántas imágenes como máximo. `0` = todas. |

**Devuelve:** `List[List[List[List[FLOAT]]]]`: una lista de imágenes, con forma `[imágenes][canales][alto][ancho]`.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle. El dataset CIFAR-10 es grande: la primera descarga tarda.

**Ejemplo:**

```kafe
import kaggle;
List[List[List[List[FLOAT]]]] imgs = kaggle.load_images("ayush1220/cifar10", 32, 32, "rgb", 2);
show([len(imgs), len(imgs[0]), len(imgs[0][0]), len(imgs[0][0][0])]);
```

**Salida de ejemplo:** `[imágenes, canales, alto, ancho]`.

```text
[2, 3, 32, 32]
```

??? warning "Error común"
    `limit` no puede ser negativo. Para cargar todas, usa `0`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_images-negative-limit.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_images-negative-limit.error.stderr.expec"
    ```

### `kaggle.load_image_dataset(dataset_name, labels_file, height, width, color_mode, limit)` { #load_image_dataset }

**Qué hace:** Carga imágenes **con su etiqueta**, que lee de un archivo CSV del dataset. Une cada imagen con su fila del CSV usando el nombre del archivo sin extensión (`12.png` ↔ id `12`).

**Cuándo usarla:** Cuando el dataset trae las clases en una tabla, por ejemplo `trainLabels.csv` con las columnas `id` y `label`.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `labels_file` | `STR` | El CSV de etiquetas. Debe tener una columna de id (`id`, `filename`, `image`, `file` o `img`) y una de clase (`label`, `class`, `category`, `clase` o `etiqueta`). |
| `height` | `INT` | Opcional. Alto final. Por defecto, `32`. |
| `width` | `INT` | Opcional. Ancho final. Por defecto, `32`. |
| `color_mode` | `STR` | Opcional. `"rgb"` o `"gray"`. Por defecto, `"rgb"`. |
| `limit` | `INT` | Opcional. Cuántas imágenes con etiqueta como máximo. `0` = todas, y entonces **todas** las imágenes deben tener etiqueta. |

**Devuelve:** `MACHINE`: una caja con dos partes. `data[0]` son las imágenes (`X`) y `data[1]` son las etiquetas (`y`, `List[INT]`). Las clases se numeran en orden alfabético: si son `cat` y `dog`, `cat` es 0 y `dog` es 1.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:**

```kafe
import kaggle;
MACHINE data = kaggle.load_image_dataset("ayush1220/cifar10", "trainLabels.csv", 32, 32, "rgb", 4);
List[List[List[List[FLOAT]]]] X = data[0];
List[INT] y = data[1];
show([len(X), len(X[0]), len(X[0][0]), len(X[0][0][0])]);
show(len(y));
```

**Salida de ejemplo:**

```text
[4, 3, 32, 32]
4
```

??? warning "Error común"
    `labels_file` no puede estar vacío:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image_dataset-empty-labels.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image_dataset-empty-labels.error.stderr.expec"
    ```

### `kaggle.load_image_folder_dataset(dataset_name, height, width, color_mode, limit, split)` { #load_image_folder_dataset }

**Qué hace:** Carga imágenes con etiqueta cuando **la clase es el nombre de la carpeta**. Es como un armario con un cajón por clase: todo lo que está en el cajón `cat/` es un gato.

```text
train/
├── cat/   0001.png  0002.png …
└── dog/   0001.png  0002.png …
```

**Cuándo usarla:** Para datasets de clasificación de imágenes sin CSV de etiquetas, como CIFAR-10.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `dataset_name` | `STR` | Nombre del dataset, `"dueño/nombre"`. |
| `height` | `INT` | Opcional. Alto final. Por defecto, `32`. |
| `width` | `INT` | Opcional. Ancho final. Por defecto, `32`. |
| `color_mode` | `STR` | Opcional. `"rgb"` o `"gray"`. Por defecto, `"rgb"`. |
| `limit` | `INT` | Opcional. Cuántas imágenes como máximo. `0` = todas. |
| `split` | `STR` | Opcional. Usa solo las imágenes dentro de una carpeta con ese nombre, como `"train"` o `"test"`. `""` = todas. Por defecto, `"train"`. |

**Devuelve:** `MACHINE`: la misma caja de dos partes que `load_image_dataset`. `data[0]` son las imágenes y `data[1]` las etiquetas.

!!! tip "Una muestra con varias clases"
    Si pones un `limit`, KAFE **mezcla** las imágenes antes de tomar la muestra, siempre de la misma forma (con una semilla fija). Así una muestra pequeña tiene varias clases y no solo la primera carpeta.

!!! note "Este ejemplo necesita internet"
    Necesita conexión y el pack de Kaggle.

**Ejemplo:**

```kafe
import kaggle;
MACHINE data = kaggle.load_image_folder_dataset("ayush1220/cifar10", 32, 32, "rgb", 4, "train");
List[List[List[List[FLOAT]]]] X = data[0];
List[INT] y = data[1];
show([len(X), len(X[0]), len(X[0][0]), len(X[0][0][0])]);
show(len(y));
```

**Salida de ejemplo:**

```text
[4, 3, 32, 32]
4
```

KAGGLE no divide las imágenes en *train* y *test*. Para eso, después de cargarlas, usa `machine.stratified_train_test_split` de [MACHINE](../../libraries/machine.md), que mantiene la misma proporción de cada clase en las dos partes.

??? warning "Error común"
    `height` y `width` deben ser enteros **positivos**. Un alto de 0 píxeles no tiene sentido:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image_folder_dataset-zero-height.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image_folder_dataset-zero-height.error.stderr.expec"
    ```

## Resumen de todas las funciones { #summary }

| Función | Página |
|---|---|
| [`kaggle.load_dataset(dataset_name, file_name)`](tablas.md#load_dataset) | Tablas |
| [`kaggle.load_dataset_split(dataset_name, file_name, split)`](tablas.md#load_dataset_split) | Tablas |
| [`kaggle.load_dataset_matrix(dataset_name, columns, split, limit)`](tablas.md#load_dataset_matrix) | Tablas |
| [`kaggle.load_text_dataset(dataset_name, file_name, delimiter, text_column, label_column, limit)`](texto.md#load_text_dataset) | Frases con etiqueta |
| [`kaggle.load_image(dataset_name, image_path, height, width, color_mode)`](#load_image) | Imágenes |
| [`kaggle.load_images(dataset_name, height, width, color_mode, limit)`](#load_images) | Imágenes |
| [`kaggle.load_image_dataset(dataset_name, labels_file, height, width, color_mode, limit)`](#load_image_dataset) | Imágenes |
| [`kaggle.load_image_folder_dataset(dataset_name, height, width, color_mode, limit, split)`](#load_image_folder_dataset) | Imágenes |

## ¿Qué aprendiste?

- Las tablas llegan como DataFrame (`load_dataset`) o como matriz de números (`load_dataset_matrix`).
- Las frases con etiqueta llegan como un DataFrame con las columnas `text` y `label`.
- Una **imagen** es una cuadrícula de números con forma `[canales][alto][ancho]`.
- Con etiquetas, las imágenes llegan en una caja `MACHINE`: `[0]` son las imágenes y `[1]` las etiquetas.

[Siguiente librería: Hugging Face :material-arrow-right:](../huggingface.md){ .md-button .md-button--primary }
