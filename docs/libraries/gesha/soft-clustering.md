# GESHA: clustering suave

GESHA tiene un camino **experimental** de entrenamiento sin respuestas. Con una lista de respuestas vacía, `model.fit(X, [], épocas, lote)` hace **clustering suave**: la salida softmax representa cuánto pertenece cada dato a cada grupo. Los números de grupo son nombres arbitrarios, no etiquetas conocidas.

El entrenamiento alterna entre asignar las observaciones y ajustar los parámetros hacia una estructura de grupos. El resultado depende de la inicialización, de la escala de los datos, de la cantidad de grupos y de la forma de los datos. Revisa las asignaciones y, cuando tenga sentido, compáralas con una métrica de clustering como [silhouette](../machine/metrics.md#silhouette_score); no interpretes los pesos softmax como probabilidades de clase calibradas.

## Programa completo { #program }

```kafe
import gesha;

List[List[FLOAT]] X_train = [
    [1.0, 1.0], [1.5, 2.0], [5.0, 8.0],
    [8.0, 8.0], [1.0, 0.6], [9.0, 11.0]
];

GESHA layer1 = gesha.create_dense(2, "relu", [2], 0.0, 42);
GESHA layer2 = gesha.create_dense(2, "softmax", [], 0.0, 42);
GESHA model = gesha.sequential([layer1, layer2]);

gesha.compile(model, "adam", "mse", []);
model.fit(X_train, [], 20, 1);

List[FLOAT] probs = model.predict([1.0, 1.0]);
show("Cluster probabilities: " + str(probs));
INT cluster = model.predict_label([1.0, 1.0]);
show("Assigned cluster: " + str(cluster));
```

Pasar una lista vacía como `y_train` elige el entrenamiento sin supervisión *Soft K-Means*: la salida softmax de la red se interpreta como asignación suave a cada grupo.

Esa elección depende de que las respuestas estén vacías u omitidas, no del nombre del archivo ni de la pérdida configurada. Por ejemplo, `tests/KafeGESHA/multiclass/neural_network_multiclass.kf` usa `fit(data, [])` y es un ejemplo sin supervisión aunque su nombre diga lo contrario. Para clasificación de varias clases de verdad usa respuestas etiquetadas, como en `multiclass_with_validation.kf`. No presentes las asignaciones a grupos como predicciones de clase verificadas.

## Qué significa una asignación { #assignment }

Si la última capa tiene `K` neuronas softmax, cada dato produce `K` puntajes no negativos que suman uno. `predict_label` da la posición del mayor. El modelo puede descubrir una partición, pero los números de los grupos se pueden intercambiar sin cambiar la partición, y los puntajes no son probabilidades de clase calibradas.

## Cuándo comparar con otro método { #compare }

| Método | Idea principal | A tener en cuenta |
|---|---|---|
| Clustering suave de GESHA | Aprender asignaciones suaves con una red. | Depende de la arquitectura y del entrenamiento. |
| [K-Means de MACHINE](../machine/clustering.md#kmeans) | Asignar cada punto al centro más cercano. | Prefiere grupos compactos y más o menos redondos. |
| [DBSCAN de MACHINE](../machine/clustering.md#dbscan) | Encontrar zonas densas conectadas. | Puede marcar ruido; depende de la escala de las distancias. |
| [Gaussian Mixture de MACHINE](../machine/clustering.md#gaussianmixture) | Ajustar componentes probabilísticos. | Supone un modelo de mezcla. |

Estos métodos tienen objetivos distintos y no tienen por qué dar los mismos grupos. Escala las columnas cuando las distancias importan y sus escalas son distintas. Prueba varias semillas y mira gráficos solo cuando los ejes tengan sentido. Un gráfico de pocas dimensiones es una ayuda para diagnosticar, no una prueba de que los grupos representan categorías conocidas.

[Volver al resumen de GESHA](../gesha.md)
