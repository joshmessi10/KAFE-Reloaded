# Cómo razonar sobre el comportamiento de una red

[Resumen de GESHA](../gesha.md) · [Modelos y entrenamiento](models-training.md)

Trata las salidas del modelo y los registros del entrenamiento como **evidencia que hay que interpretar**. Una explicación conceptual debe ayudar al estudiante a formular una hipótesis y elegir un experimento pequeño; no reemplaza su arquitectura, su código ni su conclusión final.

## Puntajes y etiquetas predichas { #scores }

Una salida numérica cruda y una clase predicha son cosas distintas. Una salida sigmoide adecuada puede representar un puntaje binario. Un umbral convierte el puntaje en una decisión; cambiar esa regla cambia el equilibrio de los errores. Una salida sigmoide no es automáticamente una probabilidad calibrada, y las salidas de una regresión no son probabilidades.

`model.predict` da las salidas numéricas; con lotes puede devolver filas anidadas. `model.predict_label` usa el umbral fijo de la mitad para una sola salida y elige el componente mayor con varias salidas. No tiene argumento para un umbral propio. Interpreta la forma de la salida y el significado de cada clase antes de comparar puntajes explícitamente. Las salidas de varias clases y de regresión necesitan su propia interpretación.

Una reflexión opcional: explica qué significa una posición de la salida y predice cómo afectaría a los errores otra regla de decisión, antes de revisar las respuestas de prueba.

## Representación y transformaciones no lineales { #representation }

Una capa densa calcula una suma con pesos y aplica una activación. Un solo puntaje afín con una regla de decisión binaria monótona tiene una frontera recta. Apilar capas afines sin activaciones no lineales sigue produciendo una transformación afín. Las transformaciones ocultas no lineales pueden cambiar los rasgos que tiene disponibles una decisión posterior.

Para patrones como [XOR](dense-networks.md#xor), pide al estudiante que dibuje los grupos etiquetados y pruebe una frontera propuesta. Deja que esa geometría motive una hipótesis sobre la representación. La cantidad de épocas, la tasa de aprendizaje y la semilla afectan la optimización dentro de la arquitectura elegida; no amplían lo que esa arquitectura puede representar. No reemplaces ese razonamiento con una arquitectura terminada, pesos resueltos o un programa copiado. Tener una representación adecuada tampoco garantiza que el entrenamiento o la generalización salgan bien.

## Tasa de aprendizaje y una pérdida que cambia { #learning-rate }

Un paso de gradiente le resta a los parámetros el gradiente multiplicado por la tasa. Pasos demasiado grandes para la forma local de la pérdida pueden pasarse de largo o divergir; pasos muy pequeños pueden ser lentos. El ruido de los lotes, la escala, la inicialización y el estado del optimizador también afectan la curva, así que una oscilación no tiene un solo diagnóstico.

Llama a `compile` antes de `model.set_lr` o `gesha.set_lr`, y elige una tasa positiva. Pide al estudiante que prediga un efecto, cambie una sola condición en una corrida corta y controlada, y compare una tendencia, no una sola época. Una curva de entrenamiento más suave no arregla cualquier problema de pérdida, respuestas o formas, y no demuestra por sí sola un mejor rendimiento con datos aparte.

## Sobreajuste y validación { #overfitting }

Que el ajuste al entrenamiento mejore mientras la validación empeora puede indicar que el entrenamiento se está adaptando a detalles propios de esa muestra. Compara tendencias y cantidades comparables, en vez de tomar una observación ruidosa como prueba. Este runtime puede incluir castigos de regularización en la pérdida de entrenamiento mientras la validación informa solo la pérdida de los datos, así que los valores absolutos no siempre se pueden comparar directamente.

La parada temprana necesita una cantidad que de verdad se vigile, con datos de validación si vigila la pérdida de validación. El dropout cambia el comportamiento al entrenar y se apaga al predecir. Los castigos L2 desalientan los pesos grandes. Son controles posibles que hay que justificar y probar; no son garantías, y demasiada regularización o muy poco entrenamiento pueden hacer que el modelo aprenda de menos. Deja el conjunto de prueba final fuera de las decisiones guiadas por la validación. Pregunta qué observación nueva apoyaría o debilitaría la explicación del estudiante.
