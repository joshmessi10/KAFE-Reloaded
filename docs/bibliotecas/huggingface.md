# HUGGINGFACE: datasets de Hugging Face

La librería **HUGGINGFACE** trae datasets de internet a tu programa, igual que [KAGGLE](kaggle.md), pero desde otra biblioteca: Hugging Face. Te los entrega como una tabla o como una matriz de números, lista para entrenar un modelo.

Si todavía no sabes qué es un dataset, qué es la caché o qué significa dividir en *train* y *test*, lee primero [las ideas de la página de KAGGLE](kaggle.md#ideas). Aquí las repasamos rápido.

## Primero, las ideas { #ideas }

### ¿Qué es Hugging Face? { #what-is-hugging-face }

[Hugging Face](https://huggingface.co) es otra **biblioteca de datasets en internet**, muy usada en inteligencia artificial. Guarda miles de **datasets** (cajas grandes de ejemplos para aprender): tablas de flores, reseñas de películas, preguntas y respuestas…

Cada dataset tiene un nombre. A veces es una sola palabra (`"imdb"`) y a veces tiene dos partes, quién lo subió y cómo se llama (`"scikit-learn/iris"`).

### Los *splits* ya vienen hechos { #splits }

Para saber si un modelo aprendió, separas los ejemplos en dos montones: **train** (para estudiar) y **test** (para el examen, con ejemplos que el modelo nunca vio). A cada montón se le llama **split** (parte).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-split.svg"
<figcaption>De una caja con 10 ejemplos, 8 van a train (para estudiar) y 2 a test (para el examen).</figcaption>
</figure>

La gran diferencia con Kaggle: en Hugging Face, muchos datasets **ya traen los splits hechos**, con nombres como `"train"`, `"test"` o `"validation"` (validación: un tercer montón para ajustar el modelo mientras estudia). Tú solo eliges cuál quieres.

### Descargar y caché { #cache }

La primera vez que pides un dataset, KAFE lo **descarga** (lo copia de internet a tu computadora). Después queda en la **caché**, una despensa en tu computadora (normalmente la carpeta `~/.cache/huggingface`). La segunda vez ya no hace falta descargarlo.

## Antes de empezar: el pack de Hugging Face { #pack }

HUGGINGFACE necesita el paquete `datasets`, que **no viene instalado** con KAFE porque pesa mucho y casi ningún programa lo usa. Ese paquete forma el **pack de Hugging Face**.

Para instalarlo usas la extensión de VS Code **KAFE - Neural Language Suite** (de KAFEGROUP, en el Marketplace de VS Code):

1. Abre la **paleta de comandos** con `Ctrl+Shift+P` (en Mac, `Cmd+Shift+P`).
2. Escribe **KAFE: Install Hugging Face Pack** y pulsa Enter.
3. Espera a que termine la instalación. Solo lo haces una vez.

!!! note "Para quienes trabajan con el repositorio"
    Si trabajas con una copia del código de KAFE en lugar de la extensión, instala el pack con `uv sync --locked --extra huggingface`.

KAFE **nunca** instala paquetes por su cuenta. Si el pack falta, el programa se detiene y te dice cómo instalarlo:

```kafe
--8<-- "tests/DocsExamples/huggingface/no-pack.error.kf"
```

```text
--8<-- "tests/DocsExamples/huggingface/no-pack.error.stderr.expec"
```

## Importar la librería { #import }

Como toda librería, HUGGINGFACE es una **caja de herramientas** que traes con `import`. Después usas cada herramienta con `huggingface.` delante. Importar funciona aunque el pack no esté instalado: el pack solo se necesita cuando llamas a una función.

```kafe
--8<-- "tests/DocsExamples/huggingface/import.kf"
```

```text
--8<-- "tests/DocsExamples/huggingface/import.expec"
```

!!! warning "Error común: olvidar el `import`"
    Si usas `huggingface.` sin haber escrito `import huggingface;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/no-import.error.stderr.expec"
    ```

## Cómo funciona por dentro { #inside }

HUGGINGFACE vive en el archivo `src/lib/KafeHF/functions.py` del código de KAFE. Es una librería pequeña: hace de **puente** entre KAFE y el paquete `datasets` de Hugging Face. Cuando llamas a una función, los datos recorren cinco pasos:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-hf-pipeline.svg"
<figcaption>Descargar con datasets, guardar en la caché, elegir un split, leer sus filas y convertirlas en listas de listas.</figcaption>
</figure>

1. **Cargar el paquete solo cuando hace falta.** La primera vez que llamas a una función, KAFE busca la función `load_dataset` del paquete `datasets` y la guarda para las siguientes llamadas. Si el paquete no está, sale el mensaje del pack.
2. **Descargar.** `datasets` descarga el dataset desde Hugging Face.
3. **Guardar en la caché.** `datasets` deja los archivos en tu computadora para la próxima vez.
4. **Elegir un split.** `load_dataset` toma `"train"` si existe (si no, el primer split que haya). `load_dataset_split` y `load_dataset_matrix` toman el split que tú pides.
5. **Convertir en listas de listas**, la estructura de datos de KAFE. KAFE recorre las filas una por una:
    - Para un **DataFrame** de [PARDOS](../libraries/pardos.md), guarda los nombres de columna y una lista por fila. Los números, textos y valores `BOOL` quedan igual; un valor vacío se vuelve `""`; una lista o un diccionario se vuelve texto.
    - Para una **matriz**, toma solo las columnas que pediste y convierte cada valor en `FLOAT`. Si un valor no es un número, se detiene con un error que nombra la columna. Con `limit`, deja de leer al llegar a ese número de filas.

El resultado es lo que usan [MACHINE](../libraries/machine.md) y [GESHA](../libraries/gesha.md) para entrenar.

## Mapa de la librería { #map }

| Página | Funciones | Para qué |
|---|---|---|
| [Referencia](huggingface/referencia.md) | `load_dataset`, `load_dataset_split`, `load_dataset_matrix` | Cargar un dataset como DataFrame, elegir un split, o leer solo los números. |

## ¿Qué aprendiste?

- Hugging Face es una biblioteca de datasets en internet, y muchos traen los **splits** hechos.
- HUGGINGFACE necesita el **pack de Hugging Face**: lo instalas en VS Code con **KAFE: Install Hugging Face Pack**.
- Por dentro, KAFE usa el paquete `datasets` y convierte las filas en **listas de listas**.

[Empezar: Referencia :material-arrow-right:](huggingface/referencia.md){ .md-button .md-button--primary }
