# Kaggle Image Ingestion

## Name

Kaggle Image Ingestion (KafeKAGGLE) — API genérica de imágenes.

## Category

Library utility — image data ingestion (KAFE built-in library).

## Description

Kaggle publica datasets de imágenes (CIFAR-10, plantas, radiografías, etc.) como
archivos comprimidos (`.zip`, `.7z`) que contienen PNG/JPEG/BMP y, a veces, un
CSV de etiquetas. KafeKAGGLE (`import kaggle;`) pone a disposición de KAFE tres
funciones genéricas —`load_image`, `load_images` y `load_image_dataset`— que
descubren, decodifican, reescalan y normalizan esas imágenes a tensores
`[C][H][W]` con píxeles en `[0,1]`, el formato que consumen las capas `Conv2D`
de GESHA (ADR-0011).

La ingesta está **desacoplada de cualquier dataset concreto** y **no realiza la
división train/test**: entrega los datos crudos indexados y deja la partición a
`machine.stratified_train_test_split`. Esto sustituye al antiguo `load_cifar10`,
que acoplaba la librería a CIFAR-10 y a KafeMACHINE (decisión A1, ADR-0018).

`color_mode` selecciona la profundidad: `"rgb"` → 3 canales (``convert("RGB")``)
y `"gray"`/`"grayscale"` → 1 canal (``convert("L")``). `limit` acota cuántas
imágenes se cargan (`0` = todas).

## Mathematical Foundation

La ingesta no es un modelo, sino una transformación de datos. Cada imagen sigue
la cadena:

1. **Decodificación** de la rejilla discreta de píxeles
   $p \in \{0,1,\dots,255\}^{H_0 \times W_0 \times C_0}$.
2. **Reescalado** a $(W, H)$ mediante interpolación de Pillow
   (`PIL.Image.resize`), que remuestrea la rejilla original a la resolución de
   salida.
3. **Normalización** de cada píxel al intervalo real $[0,1]$:
   $$\hat{p} = \frac{p}{255}, \qquad \hat{p} \in [0,1].$$
4. **Transposición** del layout intercalado (HWC de Pillow) al layout de canal
   primero (CHW) que espera Conv2D:
   $$X[c][y][x] = \hat{p}(y, x, c).$$

El resultado por imagen es $X \in \mathbb{R}^{C \times H \times W}$ con
$C \in \{1, 3\}$. La red GESHA consume un lote $[N, C, H, W]$.

- **Time Complexity**: $O(N \cdot C \cdot H \cdot W)$ para cargar $N$ imágenes.
  La decodificación, el reescalado y el bucle de normalización píxel a píxel
  dominan el coste (implementación educativa en Python puro, sin vectorizar).
- **Space Complexity**: $O(N \cdot C \cdot H \cdot W)$ en memoria, porque las
  listas anidadas de Python se materializan por completo. El reescalado reduce
  $H_0 \times W_0$ a $H \times W$ antes de normalizar, así que el residuo
  depende de la resolución de salida, no de la original.
- **Key Formulas**: normalización $\hat{p} = p/255$; tamaño de salida
  $|X| = N \cdot C \cdot H \cdot W$ flotantes; el coste temporal de ordenación
  de rutas es $O(N \log N)$, despreciable frente al de decodificación.

## Step-by-Step Algorithm

1. Validar `dataset_name`, `color_mode`, `height`, `width` y `limit` **antes**
   de tocar la red (permite errores offline y evita descargas inútiles).
2. Obtener las dependencias opcionales `Pillow` y `py7zr`; auto-instalarlas con
   el intérprete actual si faltan.
3. Descargar y localizar el dataset con `kagglehub` (anónimo para públicos;
   caché en `~/.cache/kagglehub`).
4. Extraer los `.zip`/`.7z` anidados de forma idempotente, validando cada
   entrada contra *path traversal* (`_safe_join` descarta las inseguras).
5. Descubrir recursivamente las imágenes `.png/.jpg/.jpeg/.bmp` ignorando
   `__MACOSX` y archivos ocultos, y ordenar las rutas relativas para que el
   resultado sea determinista.
6. Para cada imagen: decodificar con Pillow, convertir al `color_mode` pedido,
   reescalar a `(width, height)` y normalizar cada píxel a `[0,1]`
   transponiendo a `[C][H][W]`.
7. Devolver según la función:
   - `load_image` → una imagen `[C][H][W]` (resolviendo la ruta exacta o el
     basename, con error de ambigüedad si hay homónimos);
   - `load_images` → `List[[C][H][W]]` (aplicando `limit`);
   - `load_image_dataset` → leer el CSV de etiquetas, emparejar por *stem*,
     codificar las clases a `0..N-1` en orden alfabético y devolver un
     `ImageDataset` indexable con `[0]=X`, `[1]=y`.

## Motivation

KAFE enseña Deep Learning con `Conv2D`, pero hasta ahora faltaba una vía
genérica para llevar imágenes reales de Kaggle a un tensor `[C][H][W]`. El
antiguo `load_cifar10` era un cargador experimental específico de un dataset,
sin tests ni documentación, y acoplado a KafeMACHINE. Una API genérica y
desacoplada permite ejercitar la cadena completa *adquisición → división →
entrenamiento* con cualquier dataset de imágenes, y a la vez enseña el patrón de
ingeniería de **dependencias opcionales con auto-instalación diferida** y de
**extracción segura de archivos no confiables**.

## Advantages

- **Genérica y desacoplada**: sirve para cualquier dataset de imágenes de
  Kaggle; no depende de KafeMACHINE ni de un dataset concreto (ADR-0018).
- **Compatible con GESHA**: entrega `[C][H][W]` en `[0,1]`, listo para `Conv2D`
  (ADR-0011), sin pasos manuales de normalización.
- **Determinista**: rutas ordenadas y clases codificadas alfabéticamente, de
  modo que dos ejecuciones producen exactamente el mismo `X`/`y`.
- **Segura**: la extracción de `.zip`/`.7z` descarta entradas con *path
  traversal*; solo se escribe bajo el destino controlado.
- **Dependencias limpias**: `Pillow`/`py7zr` son utilidades de E/S (no
  implementaciones de algoritmos), se instalan solo al usar la API y `.zip` usa
  la biblioteca estándar.
- **Errores educativos**: validaciones en español, con detección de columnas de
  etiquetas, conteos de emparejamiento y listado de candidatos.

## Limitations

- **Todo en memoria**: $O(N \cdot C \cdot H \cdot W)$; un CIFAR-10 completo de
  50000 imágenes 32×32 RGB ronda los 5 GB. `limit` es la mitigación documentada.
- **Dependencias opcionales externas**: sin `Pillow` (decodificación) o `py7zr`
  (`.7z`) la ingesta no funciona; la auto-instalación requiere conexión/permisos.
- **Sin división ni aumento de datos**: la partición queda fuera (KafeMACHINE) y
  no hay *data augmentation*; solo decodificación, reescalado y normalización.
- **Rendimiento**: la normalización píxel a píxel en Python puro es el cuello de
  botella (≈24 ms por imagen RGB 32×32), sin vectorización.
- **Caché sin evicción**: `kagglehub` acumula datasets en `~/.cache/kagglehub`
  sin limpiarse automáticamente.

## When to Use

- Entrenar/evaluar redes `Conv2D` de GESHA con un dataset de imágenes de Kaggle.
- Enseñar la cadena completa de ML con imágenes: adquirir → emparejar etiquetas
  → dividir → entrenar → evaluar.
- Cargar un dataset de clasificación de imágenes con su CSV de etiquetas usando
  `load_image_dataset` y `machine.stratified_train_test_split`.

## When NOT to Use

- Imágenes ya locales — usa las utilidades de `KafeFILES`.
- Datasets tabulares CSV de Kaggle — usa `load_dataset`/`load_dataset_matrix`.
- Datasets que no caben en memoria — usa `limit` o preprocesa fuera de KAFE.
- Formatos distintos de PNG/JPEG/BMP — conviértelos antes.

## Dependencies

- KAFE: `KafeMACHINE.BaseMachine` (clase base neutra para `ImageDataset`),
  `TypeUtils` (`cadena_t`, `lista_cadenas_t`, `entero_t`),
  `global_utils.check_sig`.
- Python opcionales (auto-instaladas): `Pillow` (`PIL.Image`), `py7zr`.
- Python estándar: `zipfile`, `csv`, `os`, `subprocess`, `importlib`, `io`.
- `kagglehub` (ADR-0013) para la descarga y la caché.

## Related Concepts

- Kaggle dataset ingestion (`kaggle-dataset-ingestion.md`, ADR-0012/ADR-0013).
- Conv2D (`conv2d.md`, ADR-0011) — consumidor del layout `[C,H,W]`.
- Train/test split estratificado (`train-test-split.md`, ADR-0017).
- Hugging Face dataset ingestion (`docs/bibliotecas/huggingface.md`).

## Relationship with KAFE

- Registro: `"kaggle": [lib.KafeKaggle.funciones, False]` en
  `EvalVisitorPrimitivo.self.libraries`; `import kaggle;` activa la bandera.
- Firmas validadas con `@check_sig` (aridades/tipos) como el resto de KAFE.
- `load_image_dataset` devuelve `ImageDataset` (subclase de
  `lib.KafeMACHINE.BaseMachine`, por tanto tipo KAFE `MACHINE`) porque KAFE
  **rechaza** enlazar una lista heterogénea `[X, y]` a una variable; el
  contenedor expone `[0]=X` y `[1]=y` sin realizar ninguna división.
- La división queda íntegramente en KafeMACHINE: `train_test_split` y
  `stratified_train_test_split` relajaron su parámetro `X` de `matriz_numeros_t`
  a `lista_cualquiera_t` para aceptar tensores 4D `[N,C,H,W]` (opción A1,
  retrocompatible).
- La descarga y las dependencias se inyectan como funciones aisladas
  (`_download_dataset`, `_require_image_dependencies`) para que los tests usen
  *monkeypatch* sin red ni `pip`.

## Usage Examples

```kafe
import kaggle;
List[List[List[FLOAT]]] img = kaggle.load_image("ayush1220/cifar10", "train/12.png", 32, 32, "rgb");
```

```kafe
import kaggle;
import machine;
MACHINE datos = kaggle.load_image_dataset("ayush1220/cifar10", "trainLabels.csv", 32, 32, "rgb", 1000);
List[List[List[List[FLOAT]]]] X = datos[0];
List[INT] y = datos[1];
MACHINE split = machine.stratified_train_test_split(X, y, 0.2, 42);
```

## Implementation Location

- `src/lib/KafeKaggle/funciones.py` — funciones públicas `load_image`,
  `load_images`, `load_image_dataset` y helpers (`_require_image_dependencies`,
  `_normalize_color_mode`, `_find_images`, `_load_image_array`,
  `_ensure_images_extracted`, `_safe_join`, `_read_image_labels`,
  `_encode_labels`).
- `src/lib/KafeKaggle/dataset.py` — contenedor `ImageDataset`.
- `src/lib/KafeMACHINE/model_selection/model_selection.py` — `lista_cualquiera_t`
  en `train_test_split`/`stratified_train_test_split`.
- `src/Ejemplo.kf` — flujo completo CIFAR-10 → GESHA.

## Public API

- `kaggle.load_image(dataset_name: STR, image_path: STR, height: INT = 32, width: INT = 32, color_mode: STR = "rgb") → List[List[List[FLOAT]]]`
- `kaggle.load_images(dataset_name: STR, height: INT = 32, width: INT = 32, color_mode: STR = "rgb", limit: INT = 0) → List[List[List[List[FLOAT]]]]`
- `kaggle.load_image_dataset(dataset_name: STR, labels_file: STR, height: INT = 32, width: INT = 32, color_mode: STR = "rgb", limit: INT = 0) → ImageDataset (MACHINE, [X, y])`

## References

- kagglehub client documentation: https://github.com/Kaggle/kagglehub
- Kaggle datasets: https://www.kaggle.com/datasets
- Pillow documentation: https://pillow.readthedocs.io
- py7zr documentation: https://py7zr.readthedocs.io
- ADR-0018 (KafeKAGGLE — interfaz genérica de ingesta de imágenes),
  ADR-0011 (Conv2D/SimpleRNN), ADR-0013 (cliente kagglehub).
- `docs/bibliotecas/kaggle.md` (sección «Ingesta de imágenes»).
