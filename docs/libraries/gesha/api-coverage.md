# GESHA: contratos de enseñanza y evidencia

Los contratos revisados de GESHA que usa el Tutor separan las llamadas previstas de KAFE de los detalles de implementación del backend de Python. La superficie del runtime fijado tiene **56 funciones y cinco alias de compatibilidad para activaciones**. Los contratos de objetos revisados cubren las operaciones de modelos y capas, las propiedades numéricas seguras y los límites explícitos que solo existen en el backend. Que un nombre de función aparezca en un import de Python no lo convierte en una API soportada para el estudiante.

## Elige un tema { #topics }

| Tema | Alcance revisado |
|---|---|
| [Modelos y entrenamiento](models-training.md) | Armado Sequential/Functional, compile/fit por posición, validación, predicción, métricas, resúmenes y pesos. |
| [Redes densas](dense-networks.md) | Perceptrones, MLP, elección de activación/salida/pérdida, propiedades de gradientes y alias antiguos. |
| [Convolución](convolutional-networks.md) | Conv1D/Conv2D/depthwise/transpuesta, pooling, formas CHW, transformaciones y límites de normalización. |
| [Secuencias](recurrent-networks.md) | SimpleRNN/LSTM/GRU, salidas bidireccionales, embeddings y predicción por lotes. |
| [Herramientas de entrenamiento](training-tools.md) | Inicializadores, regularizadores, callbacks, listas tensor y guardado aislado de parámetros. |
| [Clustering suave](soft-clustering.md) | Entrenamiento experimental con respuestas vacías e interpretación de números de grupo arbitrarios. |

## Qué significa "soportado" { #support }

Un contrato **soportado** describe una operación prevista de KAFE, disponible, con evidencia de uso revisada. Un contrato **limitado** marca restricciones, como la forma de lo que se predice, valores del historial de entrenamiento que solo existen en Python o un guardado de pesos incompleto. La construcción de grafos Functional sigue siendo experimental más allá de su ejemplo revisado de una entrada con una rama que se une. Los alias de compatibilidad siguen funcionando, aunque se prefieren los nombres canónicos. Los contratos **no soportados** explican límites reales del backend en vez de animar a inventar APIs de KAFE.

El constructor L1L2 es un enlace GESHA conocido como no disponible en el runtime 0.4.0, aunque su castigo exista en Python. Las salidas ReLU directas que mezclan INT y FLOAT, los manejadores crudos de parámetros y `len(List[GESHA])` tienen restricciones adicionales del lenguaje. Cada página de tema da alternativas soportadas y evidencia de los casos negativos.

## Evidencia ejecutable acotada { #evidence }

Pequeños fixtures con semilla en `tests/TutorLibraries/gesha-*.kf` ejercitan cada función utilizable y los cinco alias de activación con llamadas reales de KAFE. El constructor L1L2 no disponible tiene un fixture de error esperado. Los casos positivos agrupados cubren constructores, dimensiones numéricas, un entrenamiento corto con parada temprana e inspección de propiedades. Los casos negativos también registran el historial como diccionario (no soportado), los manejadores de parámetros, la carga perezosa de pesos, las entradas múltiples en Functional y una muestra recurrente sin lote.

El fixture de pesos y checkpoints es solo aislado porque escribe un archivo JSON local de parámetros. Durante la validación se ejecuta en un runtime descartable. La consulta común de referencias del Tutor no ejecuta código ni da acceso a los archivos del estudiante.

Analizar cada programa hasta el final, comparar salidas y códigos de salida exactos y repetir ejecuciones con semilla establece el comportamiento acotado de los fixtures. Otras pruebas del backend de Python revisan más propiedades numéricas y de gradientes. Ninguna de las dos fuentes de evidencia prueba combinaciones arbitrarias de arquitecturas, que el aprendizaje funcione, probabilidades calibradas ni una ejecución actual del estudiante. El Tutor debe explicar esa diferencia y usar el contrato exacto de la API pedida.

[Volver al resumen de GESHA](../gesha.md)
