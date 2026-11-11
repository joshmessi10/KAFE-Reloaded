# Cómo razonar sobre la evaluación de un clasificador

[Resumen de MACHINE](../machine.md) · [Métricas](metrics.md)

Empieza por la **pregunta** que debe responder un resultado. Una función hace una cuenta; para interpretarla hace falta decidir cuál es la clase positiva, tener datos adecuados y un criterio explícito.

## Sensibilidad y la clase positiva { #sensitivity }

La **sensibilidad** es `TP / (TP + FN)`: la fracción de positivos reales que el modelo detectó. Un **falso negativo** es un caso que era positivo en las respuestas correctas, pero el modelo predijo negativo. Antes de contar, di cuál es la clase positiva.

En `machine.confusion_matrix`, las filas son las clases reales, las columnas son las clases predichas y las etiquetas siguen el orden de todas las etiquetas que aparecen, de menor a mayor. Busca dónde está la etiqueta positiva en vez de suponer una posición fija. `machine.recall_score` es un **promedio macro** sobre las clases presentes en las respuestas correctas: no es automáticamente la sensibilidad de la clase positiva que elegiste. Si una partición no tiene positivos reales, no sirve para estimar esa sensibilidad. No confundas esa falta de evidencia con lo que la función devuelve cuando el denominador es cero.

Una buena explicación empieza preguntando qué casos van en el denominador. Deja que el estudiante identifique los verdaderos positivos y los positivos que se escaparon antes de hacer la cuenta. Una sensibilidad alta, sola, dice poco sobre las falsas alarmas.

## Comparar clasificadores cuando los errores no pesan igual { #costs }

Usa ejemplos de prueba comparables y el mismo significado de clase positiva. Identifica qué error tiene la consecuencia más grave y por qué. Un modelo de costos acordado puede pesar distinto los falsos negativos y los falsos positivos, pero esos costos son supuestos que hay que justificar.

La matriz de confusión ayuda a explicar esos compromisos. Ni la regresión logística ni Gaussian Naive Bayes es mejor en todos los casos. Pide al estudiante que elija un criterio, compare sus propias observaciones y explique su conclusión. Una exactitud más alta, sola, no decide la elección, y elegir una y otra vez mirando el conjunto de prueba final lo contamina.

## Exactitud con clases desbalanceadas { #imbalance }

La **exactitud** cuenta la fracción de etiquetas que coinciden. Un clasificador que siempre elige la clase común puede parecer exacto mientras se pierde todos los positivos raros. Compara ese punto de partida con las predicciones reales del estudiante y revisa cuántos ejemplos hay de cada clase y cómo le va en cada una con la matriz de confusión o el reporte de clasificación.

Los resúmenes macro, la sensibilidad de la clase positiva y el costo de los errores responden preguntas distintas. Si la clase minoritaria tiene pocos ejemplos, las estimaciones son inciertas. La estratificación conserva las proporciones cuando puede; no crea más observaciones ni garantiza una evaluación adecuada.

## Aprender de observaciones separadas { #held-out }

Los datos de **entrenamiento** ajustan los parámetros. Los de **validación** ayudan a elegir los ajustes. Un conjunto de **prueba final** estima el comportamiento después de esas decisiones. Ajusta el preprocesamiento (`fit`) con los datos de entrenamiento y aplica la transformación aprendida a los demás conjuntos sin volver a ajustarla.

`machine.train_test_split` devuelve un contenedor `MACHINE` que se lee por posición, no una tupla de Python que se desarma, y no estratifica automáticamente. El divisor estratificado puede conservar las proporciones de las clases, y la validación cruzada usa copias independientes de un modelo sin entrenar para sus métricas. Dividir al azar puede no servir con observaciones ordenadas en el tiempo o agrupadas.

Un buen siguiente paso es pedir al estudiante que diga qué papel tiene cada conjunto de datos y qué información influyó en el modelo o en su elección. Que el entrenamiento salga bien no demuestra, por sí solo, que el modelo generalice.
