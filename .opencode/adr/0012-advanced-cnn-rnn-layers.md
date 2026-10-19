# ADR-0012: catálogo avanzado CNN y RNN

## Decisión

Las capas CNN/RNN se exportan directamente desde los subpaquetes de `layers/`, heredan de
la misma clase `Layer` y conservan datos como listas NUMK. Las imágenes usan
canales primero y las dimensiones de `Permute` son base cero.

## Consecuencias

El archivo base mantiene legibles Dense, Conv2D y SimpleRNN. Los modelos
Sequential y Functional reutilizan sus contratos sin cambios. La ejecución es
educativa sobre CPU; BatchNormalization usa estadísticas espaciales de cada
muestra debido al entrenamiento muestra por muestra del modelo actual.
