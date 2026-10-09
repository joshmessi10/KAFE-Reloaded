# KafeKAGGLE y datasets de Kaggle

KafeKAGGLE importa datasets de [Kaggle](https://www.kaggle.com) dentro de KAFE
usando el cliente oficial moderno `kagglehub` (el mismo que usa Google Colab),
como contraparte de KafeHF (Hugging Face). Los datasets **públicos** se
descargan **sin credenciales** (descarga anónima); las credenciales son
opcionales y solo hacen falta para datasets privados. Las funciones
`load_dataset` y `load_dataset_split` retornan un DataFrame de PARDOS;
`load_dataset_matrix` entrega directamente una matriz numérica compatible con
NUMK y GESHA.

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
