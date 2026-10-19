# Ejemplos de KAFE

También hay [ocho niveles de redes neuronales con GeshaDeep](gesha-niveles.md) y [18 flujos de MACHINE con Kaggle](machine-kaggle.md). Cada flujo de MACHINE muestra cinco predicciones o asignaciones y genera un gráfico SVG.

Programas `.kf` completos y ejecutables. Los canónicos viven en `src/` (son los que ejecuta `python src/Kafe.py <archivo>`); las copias de esta carpeta existen para que el lector pueda consultarlos junto a la documentación sin salir de `docs/`.

## Ejemplos principales (copias documentales)

| Archivo | Fuente | Qué enseña | Resultado |
|---|---|---|---|
| `ejemplo-cnn-cifar10.kf` | `src/Ejemplo.kf` | Cadena completa de visión: `kaggle.load_image_folder_dataset` (etiquetas por carpetas) → `machine.stratified_train_test_split` → CNN `Conv2D→MaxPooling2D→Conv2D→GlobalAveragePooling2D→Dense(10,softmax)` con `compile/fit/predict_label` y métricas | 4000 imágenes 32×32 RGB; ~1 h 45 min de entrenamiento (tras ADR-0020); loss y accuracy por época |
| `ejemplo-rnn1-series.kf` | `src/EjemploRNN1.kf` | Series temporales con RNN: `kaggle.load_dataset` → ventanas deslizantes `[7,1]` construidas con `while` → split **cronológico** 80/20 (sin barajar: data leakage temporal) → min-max del train → `SimpleRNN(16,tanh)+Dense(1,linear)` con adam/mse | MAE test ≈ 2.71 °C sobre temperaturas mínimas de Melbourne; ~2 min |
| `ejemplo-rnn2-sentimiento.kf` | `src/EjemploRNN2.kf` | Texto→números→RNN: `kaggle.load_text_dataset` (TAB, sin encabezado) → split estratificado → `machine.tokenizer` (fit SOLO sobre train) → `Embedding+SimpleRNN(8,tanh)+Dense(1,sigmoid)` con adam/bce → `predict_label` por lote y frases nuevas | accuracy test ≈ 0.58 con ~284 frases (overfitting documentado en la cabecera); ~1,5 min |

Las tres cabeceras explican el *por qué* de cada decisión (no barajar series, fit del tokenizer solo sobre train, limitaciones honestas del modelo).

## Otros ejemplos de la carpeta

(también aquí: `decision-tree.kf`, `ejemplo-clustering-plot.kf`, `fibo-curri.kf`, `gesha-cnn-avanzada.kf`, `gesha-conv2d.kf`, `gesha-huggingface-clustering.kf`, `gesha-lstm-embedding.kf`, `gesha-numk.kf`, `gesha-rnn.kf`, `hola-mundo.kf`, `kaggle-iris-clustering.kf`, `merge-sort.kf`, `red-neuronal.kf`, `regresion-lineal.kf`)
