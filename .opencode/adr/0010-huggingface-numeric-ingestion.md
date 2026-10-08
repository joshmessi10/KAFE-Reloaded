# ADR-0010: Ingesta numérica de Hugging Face para clustering

## Decisión

Se añade `huggingface.load_dataset_matrix`, que carga un split mediante la
dependencia opcional `datasets`, selecciona columnas numéricas y devuelve una
matriz compatible con NUMK. Las funciones PARDOS existentes no cambian.

## Motivo

La conversión completa a PARDOS añade una representación intermedia y mezcla
columnas textuales con las características. Clustering solo necesita una
matriz numérica y puede seleccionar sus columnas explícitamente.

## Consecuencias

La iteración reduce copias y permite usar `IterableDataset`, además de limitar
filas. KMeans y DBSCAN continúan requiriendo la matriz en memoria; no se añade
un motor distribuido ni se modifica NUMK.
