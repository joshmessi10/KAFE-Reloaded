# KafeGESHA — backend sobre NUMK

Estado 2026-09-30. ADR-0008 conserva el tipo y la API de modelos; ADR-0010
retira expresamente el wrapper Tensor y centraliza operaciones ND en NUMK.

## Estructura y contratos

- `core.py`: Parameter, Node, InputNode; estado, sin aritmética.
- `layers.py`: Layer, Dense, Conv2D, SimpleRNN, Input, Dropout, Flatten, Add,
  ActivationLayer.
- `activations.py`: ActivationFunction/Activation con forward/backward y
  activate/derivative históricos. Caché completa por instancia.
- `losses.py`: LossFunction/Loss; forward(predicho, real), backward() y
  compute/derivative(real, predicho) compatibles.
- `optimizers.py`: Optimizer.step(parameters), update(layers); SGD, Adam,
  RMSprop, AdamW. NUMK recorre parámetros; GESHA define las fórmulas escalares.
- `models.py`: Model (exportado como Gesha), Sequential y Functional.
- `funciones.py`: fábricas públicas y delegación de tensor_* a NUMK.

## Datos y tipo GESHA

Las estructuras numéricas son listas validadas por `numk.tensor`, no una clase.
`geshaDeep.tensor*` devuelve listas. No importar Tensor desde core ni acceder
a .data/.shape/.ndim en esos resultados. Parameter.data sigue existiendo.

`TypeUtils.obtener_tipo_dato` verifica Model/Layer/Node/Input antes de
`callable`; no alterar ese orden. Las capas siguen siendo conectables.

## Dense y gradientes

Dense usa dot_matrix, transpose, broadcast_add, sum_axis y random_tensor.
Acepta muestra [I] y matriz [B,I]. Conserva w/b como Parameter y expone
weights/biases/d_weights/d_biases/input_cache como propiedades sin duplicar estado.
Cada activación recibe todo Z una vez. Softmax usa máximo por fila y JVP O(BC).

CCE devuelve -Y/(P+epsilon), dividido por muestras para entrada matricial.
Softmax aplica la regla de la cadena una sola vez. MSE/MAE/BCE promedian por
componentes. Sparse CCE reutiliza CCE mediante etiquetas one-hot.
BCE conserva el gradiente estabilizado anterior para reproducibilidad.

## Entrenamiento y predicción

Fit acumula por muestra, promedia una sola vez por el tamaño real del lote
y actualiza una vez por lote. Recoge parámetros después del forward lazy.
El modo entrenamiento se restaura después de validación.
Adam usa potencias enteras para corregir momentos; evita pow_ aproximado.

predict/predict_proba: vector → vector; matriz → matriz.
predict_label: INT por muestra, List[INT] por lote incluso de una muestra.
Formato de fit: `Epoch N/M — Loss X.XX%`; fixtures AND/OR no regenerados.

## Verificación y límites

Fixtures KAFE: tests/KafeGESHA y tests/KafeNUMK.
Pruebas numéricas: tests/test_gesha_numk_backend.py y test_numk_nd_backend.py.
Ejemplo: docs/ejemplos/gesha-numk.kf.
Cinco escenarios reproducibles: .opencode/benchmarks/gesha_numk.py.

Functional: probado grafo simple y acumulación de ramas con capas distintas;
no prometer capas compartidas entre varios nodos ni entrenamiento multi-salida.
NUMK admite listas ND; Dense/pérdidas son rango 1/2. Las aproximaciones KafeMATH
y la estabilización histórica BCE limitan precisión extrema.
Conv2D recibe CHW y delega convolución/gradientes a NUMK. SimpleRNN recibe
`[timesteps, features]`, devuelve el último estado o la secuencia y usa BPTT.
Fábricas públicas: `create_conv2d` y `create_rnn`.

Nuevos componentes DL requieren impacto, ADR si aplica, tests, conceptos,
documentación, historia y cinco mediciones reales.
