# MACHINE: contratos de la API de KAFE

[Volver al resumen](../machine.md)

Esta referencia describe el lenguaje público, con argumentos por posición, que implementa el runtime 0.4.0. La extensión incluye contratos de la misma versión para los 42 constructores de MACHINE, las 16 métricas, los métodos implementados y el estado público. La fuente revisada es `kafe-vscode/reference/machine-api.json`. Los ejemplos y errores esperados describen evidencia del repositorio, no la ejecución del programa del estudiante.

El inventario revisado define lo que está soportado. El despacho de librerías busca atributos en el backend; el inventario no es una lista de permitidos. Que exista un nombre en el backend no lo convierte en parte de la API de KAFE.

## Reglas de llamada y de datos { #rules }

Importa `machine` y crea el objeto concreto antes de llamar a sus métodos. `MACHINE` es un tipo compartido: no convierte a todo estimador en transformador, a todo transformador en predictor ni a todo objeto en clasificador. Los métodos heredados que no están soportados lanzan errores. Las llamadas usan argumentos **por posición**; los argumentos con nombre de Python, las declaraciones de diccionarios, desarmar tuplas y los menús de parámetros de sklearn no son sintaxis de KAFE.

`INT`, `FLOAT`, `BOOL`, `STR`, `List[INT]` y `List[FLOAT]` son tipos distintos cuando se revisa una firma. Un argumento que solo acepta `FLOAT` necesita un decimal, como `1.0`. Las tablas que dicen `NUM` describen alternativas aceptadas entre INT y FLOAT, no una palabra clave. Las matrices tienen una muestra por fila y la misma cantidad de columnas. Las respuestas supervisadas tienen un valor por muestra. Ajusta los transformadores con los datos de entrenamiento antes de aplicarlos a validación o prueba.

Los métodos `fit(...)` concretos devuelven el mismo `MACHINE`, no `VOID`. Haz llamadas separadas sobre variables; no supongas que se pueden encadenar como en Python. Las predicciones y transformaciones posteriores necesitan la misma cantidad de columnas y, cuando corresponde, un `fit` exitoso. Una función de puntaje propia se pasa por posición, por ejemplo `model.score(X, y, machine.mean_squared_error)`.

## Estimadores y clustering { #estimators }

### Predicción lineal y por vecinos

| Constructor | Opciones por posición y límites |
| --- | --- |
| `machine.linear_regression()` | Mínimos cuadrados ordinarios; puede fallar si el sistema es singular. |
| `machine.ridge_regression(alpha, fit_intercept, max_iter)` | De cero a tres argumentos; por defecto `1.0, True, 1000`. Resuelve con una fórmula cerrada; el `max_iter` guardado no controla ningún bucle. |
| `machine.lasso_regression(alpha, fit_intercept, max_iter)` | De cero a tres argumentos; alpha no negativa y número de vueltas positivo. |
| `machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter)` | De cero a cuatro argumentos; alpha y ratio deben ser FLOAT y el ratio debe estar entre 0 y 1. |
| `machine.logistic_regression()` / `(learning_rate, max_iter)` | Exactamente cero o dos argumentos; las etiquetas deben ser 0 o 1. Una tasa de aprendizaje sola se rechaza. |
| `machine.svr(C, epsilon, kernel)` | De cero a tres argumentos; C y epsilon deben ser FLOAT; kernels `linear`, `rbf`, `poly`. |
| `machine.svm(C, kernel, max_iter)` | De cero a tres argumentos; C es FLOAT; etiquetas numéricas binarias. Gamma, grado y tolerancia no son argumentos del constructor. |
| `machine.knn(k)` | k=3 por defecto; clasificación con etiquetas numéricas y suficientes muestras de entrenamiento. |
| `machine.knn_regressor(k, weights)` | Por defecto `5, "uniform"`; weights es `uniform` o `distance`. |

La predicción devuelve un valor por muestra. `score(X, y)` usa por defecto la exactitud en clasificadores y $R^2$ en regresores. Las columnas de probabilidad de la regresión logística son `[P(0), P(1)]`; las de GaussianNB y SVM siguen `classes_`. Las de KNN siguen las etiquetas de entrenamiento ordenadas, y esa clase no tiene `classes_`. Los valores sigmoides de SVM son puntajes no calibrados. Pasa a ROC AUC la columna de la clase positiva, no la matriz de dos columnas.

### Árboles, ensambles y reducción supervisada

| Constructor | Opciones por posición y límites |
| --- | --- |
| `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | De cero a cuatro argumentos; `gini` o `entropy`; profundidad 0 = sin límite. |
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | De cero a cuatro argumentos; el criterio es exactamente `mse`, no `mae` ni `squared_error`. |
| `machine.random_forest_classifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | De cero a cuatro argumentos; el constructor no expone random_state ni max_features. |
| `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Las mismas opciones; el azar por defecto no es una semilla fija reproducible. |
| `machine.gaussian_nb()` | Estadísticas gaussianas por clase y columna, evaluadas con logaritmos. |
| `machine.ada_boost_classifier(n_estimators, learning_rate, random_state)` | De cero a tres argumentos; etiquetas binarias; número de árboles y tasa positivos. |
| `machine.gradient_boosting_classifier(n_estimators, learning_rate, max_depth)` | De cero a tres argumentos; etiquetas binarias; no expone subsample ni random_state. |
| `machine.gradient_boosting_regressor(n_estimators, learning_rate, max_depth)` | De cero a tres argumentos; predice números. |
| `machine.linear_discriminant_analysis(n_components)` | Cero o un argumento; proyección y clasificación supervisada. La implementación actual (método de Jacobi) necesita al menos dos columnas y una matriz intraclase adecuada. |

Los valores aprendidos públicos, como `coef_`, `classes_`, `theta_`, `var_`, `scalings_` y `explained_variance_ratio_`, se leen como **propiedades**, no como métodos. Que existan y su forma dependen de la clase y de si ya se entrenó. Que un ajuste del backend se pueda leer no lo convierte en argumento del constructor. Después de entrenar un árbol, `show(model.tree_)` muestra la representación cruda del backend; no admite operaciones de listas tipadas ni indexado general de diccionarios. Una propiedad con valor `None` se informa como no disponible. Para explicar el comportamiento del modelo, prefiere sus predicciones.

### Clustering

| Constructor | Resultado y límites |
| --- | --- |
| `machine.kmeans(n_clusters, max_iter, random_state)` | Centros, etiquetas de entrenamiento, `fit_predict(X)`, `predict(X)` y `score(X)` con inercia negativa; más alto es mejor. |
| `machine.dbscan(eps, min_samples)` | Grupos por densidad, índices de los puntos núcleo y la etiqueta de ruido -1; no predice datos nuevos. |
| `machine.agglomerative_clustering(n_clusters, linkage)` | Etiquetas de entrenamiento e historia de uniones; linkage `single`, `complete`, `average`, `ward`; no predice datos nuevos. |
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | Mezcla diagonal, probabilidades por componente, AIC/BIC y `score(X)` con la log-verosimilitud negativa total; más bajo es mejor. |

La cantidad de grupos o componentes no puede superar la de muestras. Usa una semilla distinta de cero cuando esté disponible; 0 significa azar no fijo. Las columnas de probabilidad de la mezcla siguen el orden de los componentes en `means_` y `weights_`, no etiquetas supervisadas. BIC usa el logaritmo natural de la cantidad de muestras.

## Preprocesamiento, codificadores y selección de columnas { #preprocessing }

### Escalado y datos faltantes

| Constructor | Contrato |
| --- | --- |
| `machine.standard_scaler()` | Aprende el promedio y la escala de cada columna; una matriz devuelve una matriz y una tabla PARDOS devuelve PARDOS. |
| `machine.minmax_scaler()` | Escala fija a [0, 1]; no tiene opción de rango. |
| `machine.robust_scaler()` / `(centering)` / `(centering, scaling)` / `(centering, scaling, quantile_low)` | Los argumentos son banderas INT y un percentil INT. Un percentil FLOAT se rechaza; el percentil superior se queda en 75.0. |
| `machine.simple_imputer(strategy)` | `mean`, `median`, `most_frequent`; usa `math.nan` para los números faltantes. Una columna toda vacía falla, salvo con relleno constante. |
| `machine.simple_imputer_constant(fill_value)` | Relleno constante explícito; puede ser INT, FLOAT o STR. |

Estos objetos implementan `fit(data)`, `transform(data)` y `fit_transform(data)`. Los escaladores también implementan `inverse_transform(data)`. El imputador no tiene transformación inversa. Una cantidad de columnas distinta falla; no supongas que se aceptan datos vacíos o mal formados.

### Categorías y texto

| Constructor | Contrato |
| --- | --- |
| `machine.label_encoder()` | Etiquetas que se pueden ordenar; `fit`/`transform` a índices e `inverse_transform` a las etiquetas originales. |
| `machine.one_hot_encoder()` | `fit(df, columnas)` y `fit_transform(df, columnas)` necesitan PARDOS y los nombres de las columnas. Las categorías nuevas fallan; ignorarlas no es un argumento del constructor. |
| `machine.ordinal_encoder()` | La misma interfaz; las categorías se ordenan, no se puede elegir el orden. |
| `machine.tokenizer(num_words, oov_token)` | De cero a dos argumentos; 0 = sin límite de palabras; índice 1 opcional para las desconocidas; el índice 0 está reservado. |

Los codificadores one-hot y ordinal devuelven PARDOS en `transform` e `inverse_transform`. Los índices o grupos one-hot inválidos fallan. Los métodos del tokenizador aceptan `List[STR]` y devuelven `List[List[INT]]`; `fit` devuelve el mismo MACHINE. El vocabulario se ordena por frecuencia y, a igual frecuencia, por primera aparición. Pasa el texto a minúsculas y lo corta en todo lo que no sea letra o número ASCII, así que las tildes pueden partir palabras. Sin `oov_token` las palabras desconocidas se saltan; con él, van a su índice reservado. Un `fit` nuevo reemplaza el vocabulario.

### Dimensionalidad y selección

| Constructor | Contrato |
| --- | --- |
| `machine.pca(n_components)` | INT positivo obligatorio; las transformaciones conservan la forma (matriz o PARDOS). `round()` usa cuatro decimales por defecto y devuelve el mismo MACHINE. |
| `machine.polynomial_features(degree, include_bias)` | De cero a dos argumentos; grado positivo y sesgo BOOL; el orden de las columnas lo define la implementación. |
| `machine.variance_threshold(threshold)` | Cero o un argumento; conserva las columnas con varianza **estrictamente mayor** que un umbral no negativo; si no queda ninguna, devuelve filas vacías. |
| `machine.recursive_feature_elimination(n_features, max_iter)` | De cero a dos argumentos INT; estimador lineal fijo; el segundo argumento hoy se ignora. Nunca pases un estimador como primer argumento. |

PolynomialFeatures, VarianceThreshold y RFE rechazan `inverse_transform`: la selección no puede recuperar valores eliminados. RFE puede fallar si un sistema de mínimos cuadrados intermedio es singular. Lee `selected_indices_`, `support_`, `ranking_` o `variances_` solo en los selectores que los definen.

## Divisiones, validación cruzada y pipelines { #selection }

| Constructor | Contrato |
| --- | --- |
| `machine.train_test_split(X, y, test_size, random_state, shuffle)` | De dos a cinco argumentos; matriz numérica; devuelve un MACHINE indexable con cuatro partes. |
| `machine.stratified_train_test_split(X, y, test_size, random_state)` | De dos a cuatro argumentos; conserva las proporciones de las clases y acepta muestras anidadas, como imágenes. |
| `machine.k_fold(n_samples, n_splits, shuffle, random_state)` | De uno a cuatro argumentos; devuelve pares de índices y no entrena ningún modelo. |
| `machine.cross_val_score(cv, scoring, random_state)` | De cero a tres argumentos; `fit(model, X, y)` evalúa copias independientes del modelo sin entrenar. |
| `machine.grid_search_cv(cv, scoring, random_state)` | De cero a tres argumentos; el constructor fija una grilla vacía, así que evalúa una sola combinación vacía. |
| `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` | De cero a cuatro argumentos; el constructor fija una distribución vacía, así que las pruebas repiten ese ajuste vacío. |
| `machine.pipeline(name1, step1, name2, step2, ...)` | Al menos una pareja STR/MACHINE y una cantidad par de argumentos; transformaciones intermedias y un modelo supervisado al final. |

Para las particiones usa `MACHINE split = ...;` y después `split[0]`, `[1]`, `[2]`, `[3]` para X_train, X_test, y_train e y_test. El `fit` de validación cruzada y de búsqueda recibe primero el modelo y lo deja sin entrenar. La exactitud y $R^2$ se maximizan; MSE se minimiza. Las grillas o distribuciones configuradas, `best_estimator_` y un `predict` del buscador no están expuestos en los constructores actuales.

Los pipelines implementan `fit`, `predict`, `score`, `transform` y `fit_transform`. `transform` excluye el modelo final y `fit_transform` devuelve columnas. `get_params()` devuelve los nombres de los pasos como `List[STR]`, no un diccionario de parámetros. La lista `steps_` del backend contiene tuplas: `len(pipe.steps_)` produce un error de tipo de KAFE; usa `get_params`. Las opciones de cada modelo se eligen con su constructor antes de entrenar.

## Métricas y formas de salida { #metrics }

Las dieciséis métricas están en `machine`: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`, `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`, `roc_auc_score` y `silhouette_score`.

Las métricas de clasificación reciben etiquetas numéricas planas. Precisión, sensibilidad y F1 son promedios macro fijos sobre las clases de las respuestas correctas; no hay argumentos average, labels ni zero_division. Las matrices de confusión usan las clases ordenadas que aparecen en las respuestas o las predicciones. El reporte de clasificación devuelve STR, así que no le apliques `len`, que es solo para listas. Las ocho métricas de regresión y ROC AUC aceptan listas planas o matrices de una columna, incluidas las predicciones de una salida de GESHA; las filas con varias salidas fallan. ROC AUC necesita exactamente dos clases y puntajes para la clase mayor en orden. MAPE devuelve un porcentaje y rechaza respuestas iguales a cero. Con respuestas constantes, $R^2$ y la varianza explicada devuelven 0.0 en esta implementación.

Silhouette recibe una matriz numérica y etiquetas de grupo numéricas. Necesita al menos dos grupos y menos grupos que muestras; una muestra sola en su grupo aporta 0. Lee las [definiciones de las métricas](metrics.md) para las unidades, fórmulas e interpretación. Que un ejemplo dé el resultado esperado nunca prueba que el programa de un estudiante se ejecutó o es correcto.
