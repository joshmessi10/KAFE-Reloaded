# KafeKAGGLE y datasets de Kaggle

KafeKAGGLE importa datasets de [Kaggle](https://www.kaggle.com) dentro de KAFE
usando el cliente oficial moderno `kagglehub` (el mismo que usa Google Colab),
como contraparte de KafeHF (Hugging Face). Los datasets **públicos** se
descargan **sin credenciales** (descarga anónima); las credenciales son
opcionales y solo hacen falta para datasets privados. Las funciones
`load_dataset` y `load_dataset_split` retornan un DataFrame de PARDOS;
`load_dataset_matrix` entrega directamente una matriz numérica compatible con
NUMK y GESHA; `load_text_dataset` lee archivos de texto etiquetado sin
encabezado (p. ej. frases con sentimiento) para flujos de NLP con RNN.

Los [ejemplos KafeKAGGLE + KafeMACHINE](../ejemplos/machine-kaggle.md) muestran cinco datasets reales y 18 algoritmos, desde clustering hasta regresión y clasificación.

```kafe
import kaggle;
import machine;

LIST[STR] columnas = ["SepalLengthCm", "PetalLengthCm"];
LIST[LIST[FLOAT]] datos = kaggle.load_dataset_matrix("uciml/iris", columnas, "Iris", 50);
MACHINE model = machine.kmeans(3);
model.fit(datos);
```

`columns` selecciona columnas y `limit` limita filas; `0` procesa todas. En un
CSV no hay tipos nativos: una celda es numérica si su contenido se puede
interpretar como número (`"30"` y `"2.5"` sí, `"texto"` y las vacías no). Si
`columns` está vacío, las columnas numéricas se infieren a partir de la
primera fila.

## Diferencias con Hugging Face

Kaggle no organiza los datos en splits (`train`/`test`/`validation`): cada
dataset es un conjunto de archivos (normalmente uno o varios CSV) que
`kagglehub` descarga y extrae. Por
eso el parámetro `split` actúa como un **selector de archivo con forma de
split**: `"train"` busca `train.csv`, `"test"` busca `test.csv` y también se
acepta la ruta exacta (`"data/train.csv"`). La selección sigue estas reglas:

1. Si `file_name` no está vacío, tiene prioridad.
2. Si no, se usa `split` como selector.
3. Si ambos están vacíos, se lee el único CSV del dataset (error si hay
   varios, listando los disponibles).

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
show(df.head(5));
```

## Autenticación y dependencia

**Los datasets públicos no necesitan credenciales**: `kagglehub` los descarga
de forma anónima, igual que en Google Colab. Las credenciales son
**opcionales** y solo se necesitan para datasets privados; si existen,
`kagglehub` las usa automáticamente desde `~/.kaggle/kaggle.json` (o
`KAGGLE_CONFIG_DIR/kaggle.json`), las variables de entorno `KAGGLE_USERNAME`
y `KAGGLE_KEY`, o los secrets de Colab. Si la descarga de un dataset privado
falla sin credenciales, KAFE muestra en español cómo configurarlas.

Si la librería `kagglehub` no está instalada, KAFE intenta instalarla
automáticamente con el intérprete actual de Python (`pip install kagglehub`);
si no hay conexión o permisos, muestra el comando manual. `kagglehub` es una
dependencia **opcional**: solo se instala cuando un programa usa
`import kaggle;` por primera vez.

## Lectura, caché y memoria

Los archivos se leen con la librería `csv` estándar (sin pandas) y se
convierten a `DataFrame` de PARDOS con las mismas reglas de tipos que
`pardos.read_csv` (`"30"` → `30`, `"2.5"` → `2.5`, `""` → NaN). `kagglehub`
descarga, extrae y **cachea** el dataset en `~/.cache/kagglehub`, de modo que
un segundo acceso al mismo dataset es instantáneo y no vuelve a tocar la red.
El contenido cargado, sin embargo, queda en memoria. Para datasets grandes
usa `limit`, muestreo o `load_dataset_matrix`, que evita construir el
DataFrame intermedio. KAFE solo admite archivos CSV dentro del dataset.

El ejemplo completo
[`kaggle-iris-clustering.kf`](../ejemplos/kaggle-iris-clustering.kf) descarga
Iris desde Kaggle, aplica K-Means con tres grupos y muestra el mismo dataset
como DataFrame de PARDOS. El flujo análogo con Hugging Face está en
[`gesha-huggingface-clustering.kf`](../ejemplos/gesha-huggingface-clustering.kf);
para Kaggle basta con reemplazar `huggingface` por `kaggle` y el nombre del
dataset por su identificador `dueno/conjunto`.

`src/Ejemplo.kf` contiene un segundo flujo completo para
`uciml/breast-cancer-wisconsin-data`: elimina `id` y la columna vacía con
PARDOS, transforma `diagnosis` en `B=0` y `M=1`, crea una división
estratificada 80/20 y normaliza solamente con el entrenamiento. Después
entrena GESHA con la arquitectura 30-64-32-16-1, ReLU, Dropout del 20 % y
salida Sigmoid; la evaluación muestra el accuracy de prueba y `P(maligno)`.

## Datasets de texto etiquetado (`load_text_dataset`)

Además de los CSV tabulares, KafeKAGGLE lee datasets de **texto etiquetado**
para clasificación: archivos en los que cada fila es un registro
`texto<SEP>etiqueta` (p. ej. frases con sentimiento 0/1) **sin encabezado**,
el formato canónico de colecciones como *sentiment labelled sentences*. La
función `load_dataset` no sirve para estos archivos (exige CSV con coma y
encabezado); para eso existe `load_text_dataset`:

| Función | Retorno |
|---|---|
| `load_text_dataset(dataset_name, file_name="", delimiter="\t", text_column=0, label_column=1, limit=0)` | PARDOS con columnas `text` (STR) y `label` (INT) |

- **Parámetros**:
  - `dataset_name` (STR): identificador `dueno/conjunto` del dataset.
  - `file_name` (STR, opcional): archivo dentro del dataset. Si está vacío,
    se lee el único archivo `.txt`/`.tsv`/`.csv` del dataset (error si hay
    varios, listando los disponibles de forma acotada).
  - `delimiter` (STR, opcional): un solo carácter separador; default `"\t"`
    (TAB), el formato de los datasets de frases etiquetadas.
  - `text_column` / `label_column` (INT, opcional): índices de las columnas
    de texto y de etiqueta entera (defaults 0 y 1).
  - `limit` (INT, opcional): máximo de filas a cargar; `0` = todas.
- **Valor de retorno**: un DataFrame de PARDOS con las columnas `text` (STR)
  y `label` (INT), tipadas de forma explícita: `df.col("text")` siempre
  retorna `List[STR]` y `df.col("label")` siempre `List[INT]`.
- **Selección de archivo**: acepta `.txt`, `.tsv` y `.csv`. Sigue la misma
  prioridad que la API tabular: `file_name` (si no está vacío) manda; si
  está vacío, se selecciona automáticamente el único archivo de texto del
  dataset y, si hay varios, se lanza un error listando los candidatos
  (recortados, sin volcar rutas interminables).
- **Validaciones** (antes de descargar nada): `delimiter` debe ser un solo
  carácter, las columnas deben ser ≥ 0, `limit` ≥ 0 y cada fila debe tener
  ambas columnas con una etiqueta convertible a entero; los mensajes de
  error listan como mucho las primeras filas problemáticas.

```kafe
import kaggle;

-- Dataset de frases con sentimiento (frase<TAB>0|1, sin encabezado).
-- La ruta del archivo es completa porque el zip trae una copia anidada
-- y la selección automática sería ambigua.
PARDOS df = kaggle.load_text_dataset("marklvl/sentiment-labelled-sentences-data-set", "sentiment labelled sentences/yelp_labelled.txt");
List[STR] textos = df.col("text");
List[INT] etiquetas = df.col("label");
show([len(textos), len(etiquetas)]);  -- [1000, 1000]
```

Notas: requiere la librería `kagglehub` (misma auto-instalación y descarga
anónima para datasets públicos que el resto de KafeKAGGLE); `limit` acota
las filas cargadas en memoria. El flujo completo que conecta
`load_text_dataset` con `machine.tokenizer` y una RNN de GESHA está en
`src/EjemploRNN2.kf`.

## Ingesta de imágenes

Además de las tablas CSV, KafeKAGGLE ofrece una **API genérica de imágenes**
(construida sobre `kagglehub`, ADR-0013) que descarga el dataset, descubre
recursivamente los archivos `.png/.jpg/.jpeg/.bmp` (ignorando `__MACOSX` y los
archivos ocultos), los decodifica, los redimensiona y normaliza sus píxeles a
`[0,1]`. El resultado tiene layout **`[C][H][W]`** (`canal × alto × ancho`), el
que esperan las capas `Conv2D` de GESHA (ADR-0011). No está ligada a ningún
dataset concreto: sirve para cualquier conjunto de imágenes de Kaggle.

| Función | Retorno |
|---|---|
| `load_image(dataset_name, image_path, height=32, width=32, color_mode="rgb")` | una imagen `[C][H][W]` |
| `load_images(dataset_name, height=32, width=32, color_mode="rgb", limit=0)` | `List[[C][H][W]]` |
| `load_image_dataset(dataset_name, labels_file, height=32, width=32, color_mode="rgb", limit=0)` | contenedor `MACHINE` con `[0]=X`, `[1]=y` |
| `load_image_folder_dataset(dataset_name, height=32, width=32, color_mode="rgb", limit=0, split="train")` | contenedor `MACHINE` con `[0]=X`, `[1]=y` (etiqueta = carpeta contenedora) |

- **Formato `[C,H,W]`**: cada imagen es una lista `[canal][alto][ancho]`; cada
  píxel se normaliza a `[0,1]` dividiendo por 255 (`p/255`).
- **`color_mode`**: `"rgb"` produce 3 canales (`convert("RGB")`);
  `"gray"`/`"grayscale"` produce 1 canal (`convert("L")`). Cualquier otro valor
  lanza un error educativo antes de descargar nada.
- **`limit`**: `0` carga todas las imágenes; un valor positivo carga como mucho
  las primeras `limit`.
- **`load_image_dataset`**: lee el CSV de etiquetas indicado, detecta las
  columnas de id (`id`/`filename`/`image`/`file`/`img`) y de etiqueta
  (`label`/`class`/`category`/`clase`/`etiqueta`), empareja cada imagen con su
  etiqueta por el *stem* del nombre de archivo y codifica las clases como
  enteros `0..N-1` en orden alfabético (codificación reproducible). Devuelve un
  contenedor indexable de tipo KAFE `MACHINE`: `datos[0]` son las imágenes `X`
  y `datos[1]` las etiquetas `y`.
- **`load_image_folder_dataset`**: para datasets **sin CSV de etiquetas**, en
  los que la clase viene dada por la **carpeta** que contiene la imagen. Lee
  `split` como subdirectorio ancestro y devuelve el mismo contenedor `MACHINE`
  con `[0]=X` y `[1]=y`. Se detalla más abajo.

El orden de `load_images` y `load_image_dataset` es **determinista**: las rutas
relativas se ordenan alfabéticamente, de modo que dos ejecuciones sobre los
mismos datos producen siempre el mismo resultado. `load_image_folder_dataset`
también es determinista, pero aplica una **mezcla con semilla fija** (`42`)
antes de recortar con `limit`, para que la muestra contenga varias clases: sin
ella, las primeras rutas ordenadas pertenecerían todas a la misma carpeta.

### Etiquetas por carpetas (CIFAR-10 y similares)

Muchos datasets de imágenes no traen un CSV de etiquetas: organizan las
imágenes en carpetas por clase (`.../<split>/<clase>/<imagen>.png`), como
CIFAR-10. En esos datasets los nombres de archivo suelen **repetirse** entre
carpetas (`0001.png` aparece una vez por clase), de modo que emparejar "por
nombre" es ambiguo y el nombre de la carpeta es la única señal fiable. Para ese
esquema existe `load_image_folder_dataset`:

- **Etiqueta = carpeta padre**: cada imagen toma como clase el nombre del
  directorio que la contiene; las clases se codifican `0..N-1` en orden
  alfabético (codificación reproducible).
- **`split`**: filtra por subdirectorio ancestro (`"train"`, `"test"`, …). Por
  defecto `"train"`; con `""` no se filtra y se cargan todas las imágenes del
  dataset.
- **`limit` representativo**: la mezcla con semilla fija se aplica antes de
  decodificar, así que la muestra contiene varias clases en lugar de una sola.
- **Errores legibles**: si un selector no encuentra archivos, el mensaje lista
  solo las primeras rutas y resume el resto (`… y N más (total M)`) en vez de
  volcar decenas de miles de rutas. Si la descarga no produce archivos, se
  lanza un error educativo antes de intentar leer nada.

### Dependencias opcionales de imágenes

La ingesta de imágenes necesita dos dependencias **opcionales**, instaladas
automáticamente bajo demanda (patrón de `kagglehub`):

- `Pillow` — decodificación de PNG/JPEG/BMP y redimensionado.
- `py7zr` — extracción de archivos `.7z` anidados (los `.zip` usan la
  biblioteca estándar `zipfile`).

Solo se instalan cuando un programa usa esta API. La extracción de archivos
comprimidos valida cada entrada contra *path traversal* y descarta las que
intenten salir del destino.

### Memoria

Todas las imágenes se materializan **en memoria** con complejidad
`O(N·C·H·W)` (listas anidadas de Python). Una imagen 32×32 RGB ocupa del orden
de 0,1 MB, por lo que 4000 imágenes rondan los 400 MB y el split de
entrenamiento completo de CIFAR-10 (50000 imágenes) ronda los 5 GB. Usa
`limit` para cargar solo una muestra de conjuntos grandes.

### División train/test

KafeKAGGLE **no** realiza la división train/test: esa responsabilidad queda en
KafeMACHINE con `machine.stratified_train_test_split`, que reparte `X` e `y`
conservando la proporción de cada clase. Esto desacopla la ingesta de imágenes
de la selección de modelo (ADR-0018).

```kafe
import kaggle;
import machine;

MACHINE datos = kaggle.load_image_folder_dataset("ayush1220/cifar10", 32, 32, "rgb", 4000, "train");
List[List[List[List[FLOAT]]]] X = datos[0];
List[INT] y = datos[1];

MACHINE split = machine.stratified_train_test_split(X, y, 0.2, 42);
List[List[List[List[FLOAT]]]] X_train = split[0];
List[List[List[List[FLOAT]]]] X_test  = split[1];
```

Para una sola imagen o una lista sin etiquetas, usa `load_image` o
`load_images`. Usa `load_image_dataset` cuando el dataset incluya un CSV de
etiquetas y `load_image_folder_dataset` cuando las etiquetas sean nombres de
carpeta. `src/Ejemplo.kf` entrena una CNN Mini sobre CIFAR-10 con GESHA usando
`load_image_folder_dataset` + `machine.stratified_train_test_split`.
