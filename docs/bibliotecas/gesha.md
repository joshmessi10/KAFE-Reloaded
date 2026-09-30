# GESHA — Redes neuronales sobre NUMK

GESHA define modelos, capas, activaciones, pérdidas y optimizadores. NUMK
almacena los datos como listas y realiza el álgebra numérica. El tipo del
lenguaje sigue siendo `GESHA`; el alias Python `Gesha` sigue apuntando a Model.

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
| `activations.py` | No linealidades, caché completa y derivadas locales |
| `losses.py` | Pérdida escalar y gradiente respecto a predicciones |
| `optimizers.py` | Actualización de parámetros y momentos de Adam/RMSprop |
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
