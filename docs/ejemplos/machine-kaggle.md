# Machine Learning con datasets de Kaggle

Estos **18 programas independientes** aplican un algoritmo de KafeMACHINE a un dataset público de Kaggle. Cada archivo `.kf` muestra cinco predicciones o asignaciones de ejemplo y genera un SVG reproducible. Su flujo completo incluye: importación, selección de columnas, preparación, ajuste, predicción o asignación de grupos y evaluación. Puedes ejecutar cualquiera desde la raíz del repositorio:

```bash
python src/Kafe.py docs/ejemplos/machine-breast-cancer-svm.kf
```

Sustituye el nombre del archivo por cualquiera de la tabla. La primera ejecución necesita conexión para descargar el CSV; las siguientes usan la caché de `kagglehub`. Las métricas son de **una ejecución local con semilla 42**, no de validación cruzada. Los modelos supervisados ajustan cualquier escalador solo con entrenamiento.

| Algoritmo — dataset | Resultado observado | Archivo KAFE |
|---|---|---|
| Agglomerative Clustering — Mall Customers | silhouette 0,554 | [machine-mall-customers-agglomerative.kf](machine-mall-customers-agglomerative.kf) |
| DBSCAN — Mall Customers | 6 grupos; `-1` indica ruido | [machine-mall-customers-dbscan.kf](machine-mall-customers-dbscan.kf) |
| K-Means — Mall Customers | silhouette 0,554 | [machine-mall-customers-kmeans.kf](machine-mall-customers-kmeans.kf) |
| Gaussian Mixture — Iris Species | silhouette 0,568 | [machine-iris-gaussian-mixture.kf](machine-iris-gaussian-mixture.kf) |
| Linear Discriminant Analysis — Iris Species | accuracy test 0,900 | [machine-iris-lda.kf](machine-iris-lda.kf) |
| Gaussian Naive Bayes — Iris Species | accuracy test 0,933 | [machine-iris-gaussian-nb.kf](machine-iris-gaussian-nb.kf) |
| KNN — Iris Species | accuracy test 0,933 | [machine-iris-knn.kf](machine-iris-knn.kf) |
| Decision Tree — Iris Species | accuracy test 0,933 | [machine-iris-decision-tree.kf](machine-iris-decision-tree.kf) |
| AdaBoost — Breast Cancer Wisconsin | accuracy test 0,830 | [machine-breast-cancer-adaboost.kf](machine-breast-cancer-adaboost.kf) |
| Gradient Boosting — Breast Cancer Wisconsin | accuracy test 0,872 | [machine-breast-cancer-gradient-boosting.kf](machine-breast-cancer-gradient-boosting.kf) |
| Logistic Regression — Breast Cancer Wisconsin | accuracy test 0,830 | [machine-breast-cancer-logistic-regression.kf](machine-breast-cancer-logistic-regression.kf) |
| SVM — Breast Cancer Wisconsin | accuracy test 0,830 | [machine-breast-cancer-svm.kf](machine-breast-cancer-svm.kf) |
| Random Forest — Breast Cancer Wisconsin | accuracy test 0,830 | [machine-breast-cancer-random-forest.kf](machine-breast-cancer-random-forest.kf) |
| Ridge Regression — Red Wine Quality | MAE test 0,427 | [machine-wine-quality-ridge.kf](machine-wine-quality-ridge.kf) |
| Lasso Regression — Red Wine Quality | MAE test 0,427 | [machine-wine-quality-lasso.kf](machine-wine-quality-lasso.kf) |
| Elastic Net — Red Wine Quality | MAE test 0,427 | [machine-wine-quality-elastic-net.kf](machine-wine-quality-elastic-net.kf) |
| Linear Regression — Salary Data | MAE test 4,722 mil | [machine-salary-linear-regression.kf](machine-salary-linear-regression.kf) |
| SVR — Salary Data | MAE test 19,004 mil | [machine-salary-svr.kf](machine-salary-svr.kf) |

## Mall Customers

[Dataset Mall Customers](https://www.kaggle.com/datasets/vjchoudhary7/customer-segmentation-tutorial-in-python). Los tres ejemplos usan ingreso anual y puntuación de gasto; excluyen `CustomerID` y `Gender`, y estandarizan ambas variables antes de medir distancias. Como no existe una etiqueta real, el clustering se ajusta sobre las 200 observaciones. DBSCAN puede asignar `-1` a ruido; su número de grupos depende de `eps` y `min_samples`.

### K-Means — Mall Customers

Cinco centroides minimizan la dispersión dentro de los grupos. El SVG marca clientes en azul y centroides en rojo.

![Mall Customers: clientes y centroides K-Means](machine-mall-customers-kmeans.svg)

```kafe
--8<-- "docs/ejemplos/machine-mall-customers-kmeans.kf"
```

### Agglomerative Clustering — Mall Customers

Fusiona grupos cercanos hasta conservar cinco segmentos; usa el enlace Ward.

```kafe
--8<-- "docs/ejemplos/machine-mall-customers-agglomerative.kf"
```

[Ver grafico de mall customers agglomerative](machine-mall-customers-agglomerative.svg)

### DBSCAN — Mall Customers

Busca regiones densas con `eps=0.35` en el espacio estandarizado y al menos cinco vecinos.

```kafe
--8<-- "docs/ejemplos/machine-mall-customers-dbscan.kf"
```

[Ver grafico de mall customers dbscan](machine-mall-customers-dbscan.svg)

## Iris Species

[Dataset Iris Species](https://www.kaggle.com/datasets/uciml/iris). `Id` no es una característica. GMM solo usa dos medidas de pétalos y nunca ve las especies. Los clasificadores codifican `Species` como 0, 1 y 2, hacen una división estratificada 80/20 y evalúan exclusivamente sobre test.

### Gaussian Mixture — Iris Species

Estima tres componentes Gaussianas; sus etiquetas son nombres arbitrarios de grupo, no especies.

```kafe
--8<-- "docs/ejemplos/machine-iris-gaussian-mixture.kf"
```

[Ver grafico de iris gaussian mixture](machine-iris-gaussian-mixture.svg)

### Linear Discriminant Analysis — Iris Species

Aprende una proyección supervisada de dos componentes y predice la especie. Estandariza con datos de train.

```kafe
--8<-- "docs/ejemplos/machine-iris-lda.kf"
```

[Ver grafico de iris lda](machine-iris-lda.svg)

### Gaussian Naive Bayes — Iris Species

Modela cada característica con una distribución Gaussiana condicionada a la clase.

```kafe
--8<-- "docs/ejemplos/machine-iris-gaussian-nb.kf"
```

[Ver grafico de iris gaussian nb](machine-iris-gaussian-nb.svg)

### KNN — Iris Species

Clasifica mediante los cinco vecinos más cercanos; estandariza usando solo train.

```kafe
--8<-- "docs/ejemplos/machine-iris-knn.kf"
```

[Ver grafico de iris knn](machine-iris-knn.svg)

### Decision Tree — Iris Species

Construye reglas de partición con profundidad máxima cuatro y muestra matriz de confusión.

```kafe
--8<-- "docs/ejemplos/machine-iris-decision-tree.kf"
```

[Ver grafico de iris decision tree](machine-iris-decision-tree.svg)

## Breast Cancer Wisconsin

[Dataset Breast Cancer Wisconsin](https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data). Cada ejemplo usa 240 filas y seis características para una ejecución breve, excluye `id`, `diagnosis` y la columna vacía, codifica `B=0` y `M=1`, y divide estratificadamente 80/20. Logistic Regression y SVM requieren escala ajustada solo con train; los modelos de árboles usan valores originales.

### AdaBoost — Breast Cancer Wisconsin

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-adaboost.kf"
```

[Ver grafico de breast cancer adaboost](machine-breast-cancer-adaboost.svg)

### Gradient Boosting — Breast Cancer Wisconsin

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-gradient-boosting.kf"
```

[Ver grafico de breast cancer gradient boosting](machine-breast-cancer-gradient-boosting.svg)

### Logistic Regression — Breast Cancer Wisconsin

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-logistic-regression.kf"
```

[Ver grafico de breast cancer logistic regression](machine-breast-cancer-logistic-regression.svg)

### SVM — Breast Cancer Wisconsin

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-svm.kf"
```

[Ver grafico de breast cancer svm](machine-breast-cancer-svm.svg)

### Random Forest — Breast Cancer Wisconsin

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-random-forest.kf"
```

[Ver grafico de breast cancer random forest](machine-breast-cancer-random-forest.svg)

## Red Wine Quality

[Dataset Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009). `quality` se trata como valor numérico. Cada ejemplo carga 320 filas, divide aleatoriamente 80/20 y ajusta el escalador de nueve características solo con train. MAE y R² se calculan sobre test.

### Ridge Regression — Red Wine Quality

Penalización L2: reduce coeficientes grandes sin llevarlos necesariamente a cero.

```kafe
--8<-- "docs/ejemplos/machine-wine-quality-ridge.kf"
```

[Ver grafico de wine quality ridge](machine-wine-quality-ridge.svg)

### Lasso Regression — Red Wine Quality

Penalización L1: puede llevar coeficientes a cero y seleccionar variables.

```kafe
--8<-- "docs/ejemplos/machine-wine-quality-lasso.kf"
```

[Ver grafico de wine quality lasso](machine-wine-quality-lasso.svg)

### Elastic Net — Red Wine Quality

Combina penalizaciones L1 y L2.

```kafe
--8<-- "docs/ejemplos/machine-wine-quality-elastic-net.kf"
```

[Ver grafico de wine quality elastic net](machine-wine-quality-elastic-net.svg)

## Salary Data

[Dataset Salary Data](https://www.kaggle.com/datasets/karthickveerakumar/salary-data-simple-linear-regression). La entrada es años de experiencia y la salida es salario en miles. Cada ejemplo divide 80/20, ajusta el escalador con train y muestra MAE (miles) y R² sobre las mismas seis observaciones de test. Con solo 30 registros, los resultados son sensibles al split y a los hiperparámetros.

### Linear Regression — Salary Data

```kafe
--8<-- "docs/ejemplos/machine-salary-linear-regression.kf"
```

[Ver grafico de salary linear regression](machine-salary-linear-regression.svg)

### SVR — Salary Data

```kafe
--8<-- "docs/ejemplos/machine-salary-svr.kf"
```

[Ver grafico de salary svr](machine-salary-svr.svg)

## Cómo interpretar los resultados

El split precede al ajuste del escalador para evitar **fuga de información**. Accuracy mide aciertos de clasificación; MAE y R² cuantifican error de regresión. En clustering no existe objetivo externo y los números de grupo no equivalen a clases. *Silhouette* compara cohesión y separación cuando hay más de un grupo; el gráfico aporta una inspección visual adicional.
