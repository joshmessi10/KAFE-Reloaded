# GESHA: inicializadores, regularización y callbacks

La **inicialización** controla el tamaño de los pesos al empezar. Pesos muy pequeños pueden debilitar las señales; pesos muy grandes pueden desestabilizar los gradientes. La inicialización Glorot equilibra la varianza para muchas activaciones simétricas. La inicialización He suele ser mejor punto de partida para ReLU. Una semilla fija hace que un ejemplo se pueda repetir, pero no convierte una sola división entrenamiento/prueba en una estimación robusta.

## Inicializadores { #initializers }

| Función | Firma | Qué hace |
|---------|-------|-------------|
| `gesha.zeros_initializer` | `() -> inicializador` | Todo ceros. |
| `gesha.ones_initializer` | `() -> inicializador` | Todo unos. |
| `gesha.constant_initializer` | `(valor) -> inicializador` | Un valor constante. |
| `gesha.random_uniform` | `(mínimo, máximo, semilla) -> inicializador` | Al azar, uniforme. |
| `gesha.random_normal` | `(promedio, desviación, semilla) -> inicializador` | Al azar, normal. |
| `gesha.glorot_uniform` | `(semilla) -> inicializador` | Glorot/Xavier uniforme. |
| `gesha.glorot_normal` | `(semilla) -> inicializador` | Glorot/Xavier normal. |
| `gesha.he_uniform` | `(semilla) -> inicializador` | He uniforme (redes con ReLU). |
| `gesha.he_normal` | `(semilla) -> inicializador` | He normal (redes con ReLU). |
| `gesha.orthogonal` | `(ganancia, semilla) -> inicializador` | Matriz ortogonal (pesos recurrentes). |

Los inicializadores se pasan a las capas en la posición `kernel_initializer`, por ejemplo `gesha.create_dense(16, "relu", [8], 0.0, 42, gesha.he_normal(42))`.

### Elegir un inicializador

| Activación oculta o propósito | Buena opción inicial | Por qué |
|---|---|---|
| Capa oculta ReLU | `he_normal` o `he_uniform` | Escala la varianza para activaciones rectificadas. |
| Tanh o capa densa equilibrada | `glorot_uniform` o `glorot_normal` | Equilibra la varianza de entrada y de salida. |
| Matriz recurrente | `orthogonal` | Ayuda a conservar la dirección de las señales al principio. |
| Ejemplo que se pueda repetir | Cualquier inicializador al azar con semilla | Las comparaciones se repiten igual. |

Un inicializador afecta el comienzo del entrenamiento, no el objetivo final. No compensa unas respuestas mal codificadas ni una fuga de datos.

## Regularizadores { #regularizers }

| Función | Firma | Qué hace |
|---------|-------|-------------|
| `gesha.l1_regularizer` | `(valor) -> regularizador` | Castigo L1. |
| `gesha.l2_regularizer` | `(valor) -> regularizador` | Castigo L2. |
| `gesha.l1_l2_regularizer` | `(l1, l2) -> objeto del backend` | **No disponible como valor GESHA en el runtime 0.4.0**; ver el límite más abajo. |

Los regularizadores se pasan en la última posición, `kernel_regularizer`. `create_dense` además tiene un número `regularization_lambda` en su cuarta posición. `create_conv2d` **no** lo tiene: su cuarta posición es `input_shape`. Usa su última posición (objeto o texto de regularizador), o el séptimo argumento de `model.fit` para el castigo L2 escalar del entrenamiento.

El constructor combinado L1L2 hoy devuelve un objeto de Python que no está en el registro de tipos de GESHA. Asignarlo a `GESHA` produce un `KeyError`; el fixture negativo `tests/TutorLibraries/gesha-l1-l2-unavailable.error.kf` conserva ese comportamiento. Una alternativa verificada para el castigo combinado por defecto es el texto `"l1_l2"` en la última posición de una capa densa, por ejemplo `gesha.create_dense(2, "relu", [2], 0.0, 42, gesha.he_normal(42), "l1_l2")`. Así no se pueden elegir fuerzas L1/L2 propias.

Los objetos L1 y L2 son valores GESHA y tienen `penalty(weights)` y `gradient(weights)` para explicaciones numéricas. Aquí L2 usa `lambda * suma(pesos²)` y gradiente `2 * lambda * pesos`; el castigo escalar por capa de la capa densa usa la convención de la mitad del cuadrado de la norma, descrita en [modelos y entrenamiento](models-training.md).

L1 castiga el tamaño absoluto de los pesos y puede dejar muchos en cero. L2 castiga el cuadrado y encoge los pesos grandes. El dropout apaga activaciones al azar mientras entrena. Estas herramientas pueden reducir el sobreajuste, pero no reemplazan la evaluación con datos aparte. Un castigo fuerte puede hacer que el modelo aprenda de menos; uno débil puede no cambiar nada: compara entrenamiento y validación al elegirlo.

## Callbacks { #callbacks }

| Función | Firma | Qué hace |
|---------|-------|-------------|
| `gesha.early_stopping` | `(monitor, paciencia, mejora_mínima, modo, restaurar_mejores_pesos) -> callback` | Detiene el entrenamiento cuando lo vigilado deja de mejorar. |
| `gesha.model_checkpoint` | `(archivo, monitor, solo_el_mejor, modo) -> callback` | Guarda los pesos al final de cada época. |
| `gesha.add_callback` | `(modelo, callback) -> VOID` | Agrega un callback a un modelo. |

Los callbacks también pueden ir en el último argumento de `model.fit`. Sin datos de validación, la forma válida en KAFE es `model.fit(X, Y, épocas, lote, [], [], 0.0, [callback])`. La sintaxis de Python `callbacks=[...]` no es válida en KAFE.

La **parada temprana** vigila una métrica de validación y puede detenerse después de una ventana de paciencia. Restaurar los mejores pesos conserva el mejor estado de validación observado. El **checkpoint** guarda los pesos para usarlos después. Para vigilar `val_loss` hay que dar datos de validación; si no, elige algo que el entrenamiento realmente calcule. Deja el conjunto de prueba final fuera de esta selección.

La implementación actual se detiene cuando el contador de épocas sin mejora **supera** `patience`. Con `patience=0`, la primera observación fija el mejor valor y la siguiente sin mejora puede detener el entrenamiento. Si lo vigilado no existe, no se toma ninguna decisión. En el checkpoint, `save_best_only=False` escribe en cada época aunque lo vigilado no exista; `True` escribe solo después de una mejora observada.

## Efectos en archivos y restauración { #files }

`model_checkpoint`, `model.save_weights` y `model.load_weights` leen y escriben archivos locales cuando el estudiante ejecuta el programa. La evidencia de `tests/TutorLibraries/gesha-weights.kf` está clasificada como aislada: la validación la corre en un runtime descartable y revisa el archivo de pesos resultante. No se ejecuta desde una pregunta común del Tutor; que el Tutor explique una API no le da permiso para ejecutar código ni escribir archivos del estudiante.

Un archivo de pesos contiene solo nombres y datos de los parámetros. No guarda la arquitectura, los momentos del optimizador, el preprocesamiento ni las estadísticas de normalización. Construye un modelo igual antes de cargar y guarda el preprocesamiento por separado. `restore_best_weights` tiene el mismo límite.

## Ayudas para tensores { #tensors }

| Función | Firma | Qué hace |
|---------|-------|-------------|
| `gesha.tensor` | `(datos) -> List` | Copia de una lista numérica anidada homogénea. |
| `gesha.tensor_zeros` | `(forma) -> List` | Tensor lleno de ceros. |
| `gesha.tensor_ones` | `(forma) -> List` | Tensor lleno de unos. |
| `gesha.tensor_random` | `(forma) -> List` | Tensor al azar. |

Devuelven listas numéricas de NUMK: GESHA no tiene un tipo Tensor aparte. Que la firma acepte listas en general no garantiza que rechace todo elemento no numérico. No hay métodos como `.numpy()`, `.to()` o `.shape`: revisa las dimensiones por la forma conocida de los datos. `tensor_random` no tiene semilla; usa inicializadores con semilla cuando necesites repetir un sorteo.

Las listas NUMK llevan los números; un modelo GESHA es dueño del grafo de capas y de los parámetros entrenables. Estas ayudas crean entradas numéricas, pero no reemplazan a `gesha.sequential` ni deciden la pérdida.

[Volver al resumen de GESHA](../gesha.md)
