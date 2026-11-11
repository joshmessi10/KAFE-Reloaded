# KAGGLE: datasets de Kaggle

La librería **KAGGLE** trae datos de internet a tu programa. Con ella puedes descargar tablas, frases e imágenes que otras personas ya juntaron, y usarlas para entrenar tus modelos de Machine Learning.

Antes de ver las funciones, vamos a aprender cinco ideas: qué es un dataset, qué es Kaggle, qué significan "descargar" y "caché", qué es dividir en *train* y *test*, y cómo una imagen se convierte en números.

## Primero, las ideas { #ideas }

### ¿Qué es un dataset? { #dataset }

Un **dataset** (conjunto de datos) es una **caja grande llena de ejemplos** para aprender. Piensa en un álbum de fotos de animales, cada una con el nombre del animal escrito abajo. Si miras muchas, aprendes a reconocer un gato. Un modelo de Machine Learning aprende igual: mirando muchos ejemplos.

Un dataset puede ser:

- Una **tabla**, como una hoja de cálculo: cada fila es un ejemplo y cada columna es un dato (largo de una flor, ancho, especie…).
- Un montón de **frases**, cada una con una etiqueta (por ejemplo, 1 = opinión buena, 0 = opinión mala).
- Un montón de **imágenes**, cada una con su clase (gato, perro, avión…).

### ¿Qué es Kaggle? { #what-is-kaggle }

[Kaggle](https://www.kaggle.com) es una **biblioteca de datasets en internet**. Igual que en una biblioteca pides un libro por su título, en Kaggle pides un dataset por su nombre. El nombre tiene dos partes separadas por `/`: quién lo subió y cómo se llama. Por ejemplo, `"uciml/iris"` es el dataset `iris` que subió `uciml`.

Un dataset de Kaggle es una **carpeta con archivos** (tablas `.csv`, textos `.txt`, imágenes `.png`…). Por eso muchas funciones te piden también el nombre del archivo que quieres leer.

### Descargar y caché { #cache }

**Descargar** es copiar archivos de internet a tu computadora. La primera vez que pides un dataset, KAFE lo descarga, y eso necesita internet y puede tardar.

La **caché** es una **despensa**: lo que ya trajiste del mercado queda guardado en casa. La segunda vez que pides el mismo dataset, KAFE lo toma de la despensa (la carpeta `~/.cache/kagglehub` de tu computadora) y es casi instantáneo.

### Dividir en *train* y *test* { #split }

Para saber si un modelo aprendió de verdad, no basta con preguntarle lo que ya vio. Es como estudiar para un examen: si el examen trae las mismas preguntas del cuaderno, puedes memorizarlas sin entender nada.

Por eso los datos se dividen en dos partes:

- **train** (entrenamiento): los ejemplos con los que el modelo **estudia**. Suele ser la mayor parte, por ejemplo el 80 %.
- **test** (prueba): ejemplos que el modelo **nunca vio** y que sirven de **examen**. Por ejemplo, el 20 %.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-split.svg"
<figcaption>De una caja con 10 ejemplos, 8 van a train (para estudiar) y 2 a test (para el examen).</figcaption>
</figure>

En Kaggle, algunos datasets ya traen esa división como dos archivos: `train.csv` y `test.csv`. Otros no la traen, y tú divides los datos después con la librería [MACHINE](../libraries/machine.md).

### Una imagen es una cuadrícula de números { #image-grid }

Una imagen digital está hecha de cuadritos llamados **píxeles**. Cada píxel guarda un número que dice cuánta luz tiene. Así, una imagen es una **cuadrícula de números**, como un mosaico donde cada baldosa tiene un número escrito.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-pixels.svg"
<figcaption>Un corazón de 5 × 5 píxeles. Cada cuadrito encendido se vuelve un 1 y cada cuadrito apagado se vuelve un 0.</figcaption>
</figure>

KAFE guarda los números de cada píxel entre `0.0` (oscuro) y `1.0` (claro). Una imagen en color tiene **3 capas** (llamadas **canales**): rojo, verde y azul. Una imagen en gris tiene **1 canal**. Por eso una imagen es una lista con forma `[canales][alto][ancho]`.

Puedes escribir una imagen diminuta a mano para verlo. Esta es una cruz gris de 3 × 3 píxeles:

```kafe
--8<-- "tests/DocsExamples/kaggle/image-grid.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/image-grid.expec"
```

**¿Qué pasó aquí?**

1. `img` tiene 1 canal (gris), 3 filas de alto y 3 columnas de ancho: por eso la forma es `[1, 3, 3]`.
2. `img[0][1]` es la fila del medio del único canal: toda encendida.
3. `img[0][0][1]` es un solo píxel: la fila de arriba, columna del medio.

Las funciones de imágenes de KAGGLE hacen esto mismo con fotos reales: las convierten en listas de números con esta forma.

## Antes de empezar: el pack de Kaggle { #pack }

KAGGLE necesita programas extra que **no vienen instalados** con KAFE, porque pesan mucho y casi ningún programa los usa. Juntos forman el **pack de Kaggle**:

| Paquete | Para qué sirve |
|---|---|
| `kagglehub` | Descarga los datasets de Kaggle. |
| `Pillow` | Abre las imágenes y les cambia el tamaño. |
| `py7zr` | Abre archivos comprimidos `.7z` que traen algunos datasets de imágenes. |

Para instalar el pack usas la extensión de VS Code **KAFE - Neural Language Suite** (de KAFEGROUP, en el Marketplace de VS Code):

1. Abre la **paleta de comandos** con `Ctrl+Shift+P` (en Mac, `Cmd+Shift+P`).
2. Escribe **KAFE: Install Kaggle Pack** y pulsa Enter.
3. Espera a que termine la instalación. Solo lo haces una vez.

!!! note "Para quienes trabajan con el repositorio"
    Si trabajas con una copia del código de KAFE en lugar de la extensión, instala el pack con `uv sync --locked --extra kaggle`.

KAFE **nunca** instala paquetes por su cuenta. Si el pack falta, el programa se detiene y te dice cómo instalarlo:

```kafe
--8<-- "tests/DocsExamples/kaggle/no-pack.error.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/no-pack.error.stderr.expec"
```

!!! tip "Datasets públicos y privados"
    Los datasets **públicos** se descargan sin cuenta ni contraseña. Solo los **privados** necesitan credenciales de Kaggle: el archivo `~/.kaggle/kaggle.json` (o `KAGGLE_CONFIG_DIR/kaggle.json`) o las variables de entorno `KAGGLE_USERNAME` y `KAGGLE_KEY`.

## Importar la librería { #import }

Como toda librería, KAGGLE es una **caja de herramientas** que traes con `import`. Después usas cada herramienta con `kaggle.` delante. Importar funciona aunque el pack no esté instalado: el pack solo se necesita cuando llamas a una función.

```kafe
--8<-- "tests/DocsExamples/kaggle/import.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/import.expec"
```

!!! warning "Error común: olvidar el `import`"
    Si usas `kaggle.` sin haber escrito `import kaggle;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/no-import.error.stderr.expec"
    ```

!!! note "Mensajes con `kaggle: kaggle:`"
    Muchos errores de esta librería empiezan con `kaggle:` dos veces. Es el comportamiento actual de KAFE: la librería ya pone su nombre y KAFE lo vuelve a añadir. El mensaje que importa es el que viene después. Los mensajes de KAGGLE están en español.

## Cómo funciona por dentro { #inside }

KAGGLE vive en la carpeta `src/lib/KafeKaggle/` del código de KAFE. Casi todo está en el archivo `funciones.py`. Cuando llamas a una función, los datos recorren cinco pasos, como un paquete que viaja del almacén a tu mesa:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-kaggle-pipeline.svg"
<figcaption>Descargar, guardar en la caché, leer el archivo, convertirlo en números y, al final, dividir en train y test.</figcaption>
</figure>

1. **Revisar antes de salir.** KAFE comprueba tus datos (que el nombre no esté vacío, que `color_mode` sea válido, que `limit` no sea negativo…) **antes** de tocar internet. Así un error sale al instante.
2. **Descargar.** La primera vez que un programa usa KAGGLE, KAFE carga el paquete `kagglehub` (no antes, para que los demás programas arranquen rápido). `kagglehub` descarga el dataset y lo descomprime.
3. **Guardar en la caché.** `kagglehub` deja los archivos en `~/.cache/kagglehub` y le dice a KAFE en qué carpeta están. La próxima vez no descarga nada.
4. **Leer el archivo.** KAFE recorre la carpeta, ignora archivos ocultos y la carpeta `__MACOSX`, y elige el archivo: primero `file_name`, luego `split` y, si no hay ninguno, el único archivo posible.
    - Una **tabla CSV** se lee con el lector `csv` que trae Python (sin pandas). La primera fila es el encabezado.
    - Una **imagen** se abre con Pillow, se pasa a color o gris y se cambia de tamaño. Los archivos `.zip` y `.7z` que vienen dentro del dataset se abren primero, con cuidado de no escribir fuera de la carpeta.
5. **Convertir en números.** Todo termina en **listas de listas**, la estructura de datos de KAFE:
    - Una tabla es un DataFrame de PARDOS: una lista de nombres de columna y una lista de filas.
    - Una matriz es `List[List[FLOAT]]`: cada celda de texto se convierte a decimal.
    - Una imagen es `[canales][alto][ancho]`: cada píxel (de 0 a 255) se divide entre 255.
    - Las etiquetas de texto (`cat`, `dog`…) se ordenan alfabéticamente y se numeran 0, 1, 2…

KAGGLE **no divide** los datos en train y test: ese último paso lo haces tú con [MACHINE](../libraries/machine.md). Las funciones de imágenes con etiquetas te devuelven una caja `MACHINE` (la clase `ImageDataset` de `dataset.py`) con dos partes: `[0]` son las imágenes y `[1]` las etiquetas.

## Mapa de la librería { #map }

| Página | Funciones | Para qué |
|---|---|---|
| [Tablas](kaggle/tablas.md) | `load_dataset`, `load_dataset_split`, `load_dataset_matrix` | Leer archivos CSV como DataFrame o como matriz de números. |
| [Frases con etiqueta](kaggle/texto.md) | `load_text_dataset` | Leer frases con su clase, para clasificar textos. |
| [Imágenes](kaggle/imagenes.md) | `load_image`, `load_images`, `load_image_dataset`, `load_image_folder_dataset` | Convertir fotos en números, con o sin etiquetas. |

Para ver datasets reales de Kaggle usados con cada algoritmo, mira los [ejemplos de MACHINE](../ejemplos/machine-kaggle.md).

## ¿Qué aprendiste?

- Un **dataset** es una caja de ejemplos, y Kaggle es una biblioteca de datasets en internet.
- KAGGLE necesita el **pack de Kaggle**: lo instalas en VS Code con **KAFE: Install Kaggle Pack**.
- La primera descarga necesita internet; después, la **caché** la guarda en tu computadora.
- Por dentro, todo termina en **listas de listas** de números.

[Empezar: Tablas :material-arrow-right:](kaggle/tablas.md){ .md-button .md-button--primary }
