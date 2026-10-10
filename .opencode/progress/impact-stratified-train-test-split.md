# Impact Analysis — separación estratificada para Iris/GESHA

## Objetivo

Permitir que el ejemplo supervisado de Iris conserve la proporción de las tres
especies al separar entrenamiento y prueba.

## Cambio

`machine.stratified_train_test_split(X, y, test_size, random_state)` agrupa
índices por etiqueta, baraja cada grupo de forma reproducible y retorna
`[X_train, X_test, y_train, y_test]`, igual que la partición existente.

## Riesgos y validación

El split no acepta clases vacías ni tamaños fuera de (0, 1). Las pruebas usan
150 muestras Iris simuladas y verifican 40/10 ejemplos por clase y la semilla.
