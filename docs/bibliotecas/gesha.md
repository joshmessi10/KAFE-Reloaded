# GESHA — Redes neuronales sobre NUMK

GESHA define modelos, capas, activaciones, pérdidas y optimizadores. NUMK
almacena los datos como listas y realiza el álgebra numérica. El tipo del
lenguaje sigue siendo `GESHA`; el alias Python `Gesha` sigue apuntando a Model.

## Organización de capas

Las capas viven en `src/lib/KafeGESHA/layers/`, agrupadas por categoría:

```text
layers/
├── base/             # Layer, Input
├── core/             # Dense, ActivationLayer
├── convolutional/    # Conv1D, Conv2D, DepthwiseConv2D, Conv2DTranspose
├── pooling/          # Max/Average/Global pooling
├── normalization/    # BatchNormalization
├── spatial/          # Flatten, Padding, Upsampling, Reshape, Permute
├── merge/            # Add, Concatenate, Multiply
├── regularization/   # Dropout, SpatialDropout2D
└── recurrent/        # SimpleRNN, LSTM, GRU, Bidirectional, Embedding
```

Cada capa concreta tiene un archivo propio dentro de su categoría. El
`layers/__init__.py` reexporta todas las clases para preservar los imports
existentes de GESHA.

## Ejemplo ejecutable

```kafe
import geshaDeep;
import numk;

List[List[FLOAT]] x = numk.tensor([[1.0, 0.0], [0.0, 1.0]]);
List[List[FLOAT]] y = [[1.0, 0.0], [0.0, 1.0]];
GESHA layer = geshaDeep.create_dense(2, "softmax", [2], 0.0, 42);
GESHA model = geshaDeep.sequential([layer]);
model.compile("adam", "categorical_crossentropy", []);
model.fit(x, y, 10, 2);
List[List[FLOAT]] probabilities = model.predict(x);
show(probabilities);
```

Ejemplo con capa oculta y último lote incompleto: `docs/ejemplos/gesha-numk.kf`.

## API disponible

| Función | Responsabilidad |
|---|---|
| `create_dense(units, activation, input_shape, reg=0.0, seed=None)` | Capa densa; `[]` permite inferir features |
| `sequential(layers)` o `sequential()` | Modelo secuencial; `model.add(layer)` añade capas |
| `input_layer(shape)`, `functional(inputs, outputs)` | Grafo conectado mediante `layer.connect(inputs)` |
| `dropout_layer(rate, seed)`, `flatten_layer()`, `add_layer()` | Capas auxiliares existentes |
| `relu_layer()`, `sigmoid_layer()`, `tanh_layer()`, `softmax_layer()`, `linear_layer()` | Adaptadores históricos; en Dense usar el argumento de activación |
| `compile(model, optimizer, loss, metrics)`, `set_lr(model, lr)` | Configuración; también disponibles como métodos |
| `tensor(data)`, `tensor_zeros(shape)`, `tensor_ones(shape)`, `tensor_random(shape)` | Delegaciones directas a NUMK; devuelven listas |

Los nombres antiguos documentados `binary`, `categorical`, `regression`,
`clustering` y `fit_from_df` no forman parte del módulo actual. Usar
`sequential` y preparar los datos antes de `fit`.

## Organización del código

| Archivo | Qué contiene |
|---|---|
| `core.py` | Parameter (datos y gradientes) y nodos del grafo; ninguna clase Tensor |
| `funciones.py` | Fábricas y validación de argumentos del lenguaje |
| `layers.py` | Transformación de las entradas y composición con activaciones |
| `activations/` | Una activación por archivo, contrato base y registro de nombres |
| `losses/` | Una pérdida por archivo y contrato escalar común |
| `optimizers/` | Un optimizador por archivo: SGD, RMSprop, Adam y AdamW |
| `models.py` | Orden de ejecución, entrenamiento y predicción |

Las cuatro familias de componentes son Layer, ActivationFunction (alias
Activation), LossFunction (alias Loss) y Optimizer. Model conserva el contrato
de los modelos existentes. Cada componente mantiene su estado; NUMK centraliza
los recorridos sobre listas y las operaciones matriciales.

## Dense y activaciones

Dense acepta un vector `[I]` o una matriz `[B,I]`, y conserva ese rango en la
salida `[O]` o `[B,O]`. Calcula `Z = XW + b` con NUMK y llama una sola vez a
`activation.forward(Z)`. Su backward calcula `dW = XᵀdZ`,
`db = sum(dZ, axis=0)` y `dX = dZWᵀ`.

Propiedades Python: `weights`, `biases`, `d_weights`, `d_biases` e
`input_cache`. Los Parameter originales `w` y `b` conservan su identidad.
Con input_shape conocido se construye al crear la capa; con `[]` en el primer
forward. Reconstruir con dimensiones diferentes produce un error.

Activaciones: relu, sigmoid/sigmoide, tanh/tangente, softmax, linear/identity/
identidad y step/escalon/escalonada. Softmax resta el máximo por fila y usa un
producto Jacobiano-vector en backward. ReLU usa derivada cero en el origen.

## Entrenamiento

`fit(X, Y, epochs=1, batch_size=1, val_data=None, regularization_lambda=0.0)`
procesa cada muestra manteniendo fijos los parámetros durante el lote,
acumula mediante NUMK, promedia por el tamaño real del lote y aplica el
optimizador una vez. No es un motor de entrenamiento vectorizado de grafos.
Los parámetros lazy se recogen después del forward. La validación restaura
el modo de entrenamiento.

MSE/MAE/BCE promedian por componente. CCE promedia por muestra, con etiquetas
one-hot; Sparse CCE recibe índices enteros. El backward de CCE devuelve
`dL/dP`; Softmax lo transforma a `dL/dZ` una sola vez.
Se conserva la estabilización histórica de BCE para no cambiar AND/OR.

Optimizadores: SGD, Adam, RMSprop y AdamW. `update(layers)` deduplica
Parameter por identidad y delega en `step(parameters)`.

`predict` y `predict_proba` conservan muestra/vector frente a lote/matriz.
`predict_label` devuelve INT para muestra y List[INT] para lote, incluso
si tiene una sola muestra. La salida de entrenamiento conserva
`Epoch N/M — Loss X.XX%`.

## Migración de Tensor

No existe `lib.KafeGESHA.core.Tensor`. Las fábricas tensoriales conservan sus
nombres y devuelven listas: usar directamente el resultado, sin `.data`.
Para inspeccionar dimensiones en Python usar `numk.shape(datos)` y
`len(numk.shape(datos))` en lugar de `.shape` y `.ndim`.
GESHA no añade un nuevo tipo al intérprete.

## Límites conocidos

- Functional conserva el grafo existente y acumula gradientes de ramas; reutilizar
  la misma instancia de capa en varios nodos requiere cachés por invocación y
  sigue fuera del soporte comprobado. Usar una instancia por nodo.
- La exponencial y el logaritmo reutilizan las aproximaciones de KafeMATH.
  El logaritmo histórico pierde precisión cerca de algunas fronteras de su
  reducción de argumento; BCE conserva su gradiente estabilizado histórico.
- Dense y las pérdidas aceptan rango 1/2; NUMK y Flatten admiten listas ND.
- No hay autograd ni kernels acelerados externos. No se añadieron dependencias.

## Conv2D

`geshaDeep.create_conv2d(filters, kernel_size, activation, input_shape,
stride, padding, seed)` crea una capa convolucional entrenable. La entrada usa
formato `[canales][alto][ancho]`; los kernels usan
`[filtros][canales][kernel_alto][kernel_ancho]`. Admite padding `valid` y
`same` (kernel impar), activación y retropropagación.

```kafe
GESHA conv = geshaDeep.create_conv2d(8, [3, 3], "relu", [1, 28, 28], 1, "same", 42);
```

Su costo es `O(F*C*Ho*Wo*Kh*Kw)`. El ejemplo completo está en
`docs/ejemplos/gesha-conv2d.kf`.

## SimpleRNN

`geshaDeep.create_rnn(units, activation, input_shape, return_sequences, seed)`
crea una RNN de Elman. Recibe `[timesteps][features]`; con
`return_sequences=False` devuelve el último estado y con `True` devuelve todos.
Entrena mediante backpropagation through time completo.

```kafe
GESHA recurrent = geshaDeep.create_rnn(16, "tanh", [20, 4], False, 42);
```

Su costo es `O(T*(F*U+U²))`. El ejemplo completo está en
`docs/ejemplos/gesha-rnn.kf`.

## Capas CNN adicionales

Todas usan datos NUMK y heredan de `Layer`. Los formatos son `[C,L]` para 1D y
`[C,H,W]` para 2D.

| Fábrica KAFE | Función |
|---|---|
| `create_conv1d(filters, kernel, activation, shape, stride, padding, seed)` | Convolución de señales |
| `create_depthwise_conv2d(kernel, multiplier, activation, shape, stride, padding, seed)` | Kernel independiente por canal |
| `create_conv2d_transpose(filters, kernel, activation, shape, stride, padding, seed)` | Aumento aprendido de resolución |
| `max_pooling1d(size, stride)` | Máximo temporal |
| `max_pooling2d(size, stride)` | Máximo espacial |
| `average_pooling2d(size, stride)` | Promedio espacial |
| `global_average_pooling2d()` | Promedio completo por canal |
| `global_max_pooling2d()` | Máximo completo por canal |
| `batch_normalization(epsilon, momentum)` | Normalización por canal |
| `zero_padding2d(padding)` | Bordes de ceros |
| `up_sampling2d(size)` | Repetición espacial |
| `reshape_layer(shape)` | Cambio de forma |
| `permute_layer(dims)` | Permutación de ejes base 0 |
| `concatenate_layer(axis)` | Concatenación de entradas Functional |
| `multiply_layer()` | Producto elemento a elemento Functional |
| `spatial_dropout2d(rate, seed)` | Desactivación de canales completos |

`BatchNormalization` calcula estadísticas espaciales por canal porque el bucle
educativo actual entrega una muestra a la capa en cada forward. Conserva medias
móviles para inferencia.

## Capas recurrentes adicionales

| Fábrica KAFE | Función |
|---|---|
| `create_lstm(units, shape, return_sequences, seed)` | Memoria con compuertas input/forget/output |
| `create_gru(units, shape, return_sequences, seed)` | Recurrencia gated compacta |
| `bidirectional(layer)` | Ejecuta una RNN compatible en ambos sentidos |
| `embedding(vocabulary_size, dimension, seed)` | Índices enteros a vectores entrenables |

LSTM y GRU usan BPTT completo. `Bidirectional` acepta `SimpleRNN`, `LSTM` o
`GRU` y concatena las salidas de ambas direcciones.
# Inicializadores, regularizadores y callbacks

`create_dense` acepta opcionalmente `kernel_initializer` y `kernel_regularizer` después de `seed`. Están disponibles `zeros_initializer`, `ones_initializer`, `random_uniform`, `random_normal`, `glorot_uniform`, `glorot_normal`, `he_uniform`, `he_normal`, `orthogonal` y `constant_initializer`.

Las inicializaciones históricas de Dense y Conv2D siguen siendo el valor predeterminado para conservar resultados existentes. Para CNN con ReLU se recomienda pasar `he_normal`; para capas densas con `tanh`, `glorot_uniform`; y para matrices recurrentes, `orthogonal`.

Durante clasificación, cada línea de `fit` muestra también `Accuracy` en porcentaje junto a `Loss`. La métrica usa umbral 0.5 para clasificación binaria y la clase de mayor probabilidad para clasificación multiclase; también queda disponible como `history['accuracy']` y en los callbacks.

### Ejemplo supervisado con Iris de Hugging Face

[`src/Ejemplo.kf`](../../src/Ejemplo.kf) descarga `scikit-learn/iris` con
`huggingface.load_dataset`, por lo que los datos llegan como `PARDOS`. El
ejemplo elimina `Id`, convierte `Species` a etiquetas 0/1/2 con
`machine.label_encoder`, separa 80/20 con
`machine.stratified_train_test_split` y ajusta `StandardScaler` solamente
con entrenamiento. La red es `4 -> Dense(8, ReLU) -> Dense(8, ReLU) ->
Dense(3, Softmax)` y reporta accuracy sobre las flores no vistas.

Los regularizadores son `l1_regularizer`, `l2_regularizer` y `l1_l2_regularizer`. Se asocian al peso y su penalización y gradiente se incorporan durante `fit`.

Los callbacks `early_stopping` y `model_checkpoint` se agregan con `add_callback(modelo, callback)`. El checkpoint guarda pesos en JSON; `save_weights` y `load_weights` también están disponibles en el modelo. `fit` devuelve un historial con `loss` y `val_loss` sin cambiar su salida por consola.
