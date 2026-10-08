# KafeHF y datasets grandes

KafeHF ya integra la dependencia opcional `datasets` de Hugging Face. Las
funciones `load_dataset` y `load_dataset_split` mantienen su retorno PARDOS.

Para clustering se puede obtener directamente una matriz numérica compatible
con NUMK y GESHA:

```kafe
import huggingface;
import machine;

LIST[STR] columnas = ["sepal_length", "sepal_width"];
LIST[LIST[FLOAT]] datos = huggingface.load_dataset_matrix("mstz/iris", columnas, "train", 0);
MACHINE model = machine.kmeans(3);
model.fit(datos);
```

`columns` selecciona características y `limit` limita filas; `0` procesa todo
el split. La función recorre el dataset sin crear un DataFrame intermedio y
convierte valores a `FLOAT`. Si `datasets` no está instalado, KAFE intenta
instalarlo automáticamente usando el intérprete actual de Python; si no hay
conexión o permisos, muestra el comando manual `pip install datasets`.

KMeans y DBSCAN siguen siendo algoritmos en memoria. Esta API evita copias y
conversiones innecesarias, pero para datos que no caben en memoria se debe usar
`limit`, muestreo o un pipeline por lotes.

El ejemplo completo [`gesha-huggingface-clustering.kf`](../ejemplos/gesha-huggingface-clustering.kf)
descarga Iris, entrena un autoencoder GESHA (4→3→2→3→4), transforma las 150
muestras al espacio latente y aplica K-Means con tres grupos.
