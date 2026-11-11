# MACHINE: clasificación y árboles

**Clasificar** es decidir a qué **grupo** pertenece algo: ¿este correo es spam o no?, ¿esta fruta es una manzana, una naranja o una sandía? En esta página también hay modelos que predicen **números** con la misma idea (los que terminan en *Regressor*).

| Modelo | Para qué sirve | Cómo piensa |
|---|---|---|
| [`LogisticRegression`](#logisticregression) | Decidir entre **dos** grupos y dar una probabilidad. | Una curva en S. |
| [`KNN`](#knn) | Clasificar copiando a los vecinos más cercanos. | "Dime con quién andas…" |
| [`KNNRegressor`](#knnregressor) | Predecir un número promediando a los vecinos. | Igual que KNN, pero con promedio. |
| [`DecisionTreeClassifier`](#decisiontreeclassifier) | Clasificar con preguntas de sí o no. | Un árbol de preguntas. |
| [`DecisionTreeRegressor`](#decisiontreeregressor) | Predecir un número con preguntas de sí o no. | Escalones. |
| [`GaussianNB`](#gaussiannb) | Clasificar comparando campanas de probabilidad. | "¿Qué tan típico es este dato en cada grupo?" |
| [`RandomForestClassifier`](#randomforestclassifier) | Clasificar con muchos árboles que votan. | La mayoría gana. |
| [`RandomForestRegressor`](#randomforestregressor) | Predecir un número con muchos árboles. | El promedio de todos. |

!!! tip "Antes de empezar"
    Todos se usan igual: los **creas**, les enseñas con `fit(X, y)` y les preguntas con `predict(X)`. En clasificación, `y` es una lista de enteros (`List[INT]`) con el grupo de cada ejemplo, y `score` da la **exactitud**: la fracción de aciertos. Si es tu primera vez, lee [cómo funciona MACHINE](../machine.md).

## LogisticRegression: la curva en S { #logisticregression }

### La idea en una frase

La **regresión logística** convierte tus datos en una **probabilidad** entre 0 y 1 con una curva en forma de S. Si la probabilidad pasa de 0.5, dice "grupo 1"; si no, "grupo 0".

### Una comparación de la vida diaria

Piensa en un interruptor con regulador de luz. Con poca energía la bombilla está apagada (0) y con mucha está encendida (1), pero en el medio hay un tramo donde se va encendiendo poco a poco. La curva en S es ese regulador: cerca del medio, el modelo **duda**; lejos, está **seguro**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-logistic-curve.svg"
<figcaption>Quienes estudiaron de 1 a 3 horas reprobaron (abajo) y de 4 a 6 aprobaron (arriba). La curva en S va de 0 a 1, la raya punteada marca la mitad y, con 3.5 horas, la curva da una probabilidad de 0.54: aprueba, pero por poco.</figcaption>
</figure>

### Tu primera regresión logística

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.logistic_regression(0.5, 2000)` creó el modelo con un **paso de aprendizaje** de `0.5` y `2000` vueltas de práctica.
    2. `fit` aprendió con 6 estudiantes: `0` = reprobó, `1` = aprobó.
    3. `predict` dijo: con 2.5 horas reprueba; con 3.5 y 5.5, aprueba.
    4. `predict_proba` da la seguridad de aprobar: `0.02`, `0.54` y `1.0`. Con 3.5 horas el modelo casi duda.

### Las matemáticas con números pequeños { #logisticregression-math }

El modelo hace dos cuentas:

1. Una **suma con pesos**, como la regresión lineal: $z = w \cdot x + b$.
2. Aplasta $z$ entre 0 y 1 con la **función sigmoide**: $p = \dfrac{1}{1 + e^{-z}}$.

Para saber si lo hace bien, mide la **pérdida logarítmica**: castiga mucho estar **muy seguro y equivocado**. Este programa lo calcula a mano con $w = 2$ y $b = -7$:

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression-by-hand.expec"
```

Las tres probabilidades (`0.05`, `0.27`, `0.95`) van bien con las respuestas (reprobó, reprobó, aprobó), así que la pérdida promedio es pequeña: `0.137`. Y esta comprobación muestra que `predict_proba` hace exactamente esa cuenta con los pesos que aprendió:

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression-check.expec"
```

??? info "Para curiosos 🤓"
    El modelo minimiza la pérdida logarítmica promedio

    $$L = -\frac{1}{n}\sum_i \big[y_i \log p_i + (1-y_i)\log(1-p_i)\big]$$

    Su gradiente es muy simple: $\frac{\partial L}{\partial w} = \frac{1}{n}\sum_i (p_i - y_i)\,x_i$. KAFE usa **descenso por gradiente**: en cada vuelta calcula todas las $p_i$, mira cuánto se equivocó y mueve $w$ y $b$ un paso (`learning_rate`) en contra del error.

### Cómo está construido por dentro { #logisticregression-inside }

El modelo vive en `src/lib/KafeMACHINE/linear/LogisticRegression.py`. En `fit`:

1. Comprueba que `y` tenga **solo 0 y 1**.
2. Empieza con pesos en 0.
3. Da `max_iter` vueltas. En cada una calcula la probabilidad de todos los ejemplos, el error $p - y$ y mueve los pesos un paso de tamaño `learning_rate`.
4. Guarda `coef_` e `intercept_`.

!!! note "¿Por qué `0.5` y `2000`?"
    Los valores por defecto son `0.01` y `1000`: pasos pequeños y pocas vueltas. Con datos tan cortos el modelo no alcanza a aprender, así que en los ejemplos se dan pasos más grandes y más vueltas.

### API { #logistic_regression }

| Llamada | Qué hace |
|---|---|
| `machine.logistic_regression()` o `machine.logistic_regression(learning_rate, max_iter)` | Crea el modelo. Se pasan **los dos** números o ninguno: `learning_rate` (`FLOAT`, `0.01`) y `max_iter` (`INT`, `1000`). |
| `model.fit(X, y)` | Aprende. `y` solo puede tener `0` y `1`. |
| `model.predict(X)` | Devuelve `List[INT]` con `0` o `1`. |
| `model.predict_proba(X)` | Devuelve, por fila, `[prob. de 0, prob. de 1]`. |
| `model.score(X, y)` | La exactitud. |
| `model.coef_` / `model.intercept_` | Los pesos y el punto de partida. |

??? warning "Errores comunes"
    Solo acepta los grupos `0` y `1`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/logistic_regression-labels.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/logistic_regression-labels.error.stderr.expec"
    ```

    Y se le dan los dos ajustes o ninguno:

    ```kafe
    --8<-- "tests/DocsExamples/machine/logistic_regression-one-arg.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/logistic_regression-one-arg.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Da una probabilidad, no solo un sí o un no. | Solo dos grupos. |
| Cada peso dice hacia qué grupo empuja cada dato. | La frontera entre grupos es una recta. |
| Rápida al predecir. | Hay que elegir el paso y las vueltas. |

## KNN: copia a tus vecinos { #knn }

### La idea en una frase

**KNN** (*K-Nearest Neighbors*, los K vecinos más cercanos) no aprende ninguna fórmula: **recuerda** todos los ejemplos y, para un dato nuevo, busca los `k` más parecidos y elige el grupo que **más se repite** entre ellos.

### Una comparación de la vida diaria

Te mudas a un barrio nuevo y quieres saber de qué equipo son los vecinos. Preguntas a las **3 casas más cercanas**: si dos son de un equipo y una del otro, apuestas por el primero. Eso es KNN con `k = 3`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-knn-vote.svg"
<figcaption>Círculos y cuadrados en una cuadrícula y un punto nuevo con "?". Un círculo crece a su alrededor hasta encerrar a sus 3 vecinos más cercanos: dos círculos y un cuadrado. El punto nuevo pasa a ser círculo, 2 votos contra 1.</figcaption>
</figure>

### Tu primer KNN

Mascotas medidas por altura (cm) y peso (kg). Grupo `0` = gato, `1` = perro:

```kafe
--8<-- "tests/DocsExamples/machine/knn.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.knn(3)` creó un KNN que pregunta a **3** vecinos.
    2. `fit` solo **guardó** las 6 mascotas. No hizo cuentas.
    3. La mascota `[45, 14]` está entre los dos grupos. De sus 3 vecinos, 2 son perros: `predict_proba` da `0.33` gato y `0.67` perro.

### Las matemáticas con números pequeños { #knn-math }

"Más cercano" se mide con la **distancia en línea recta** (distancia euclídea), el teorema de Pitágoras:

$$d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

Este programa mide la distancia del punto nuevo `[3, 3]` a los cinco puntos del dibujo:

```kafe
--8<-- "tests/DocsExamples/machine/knn-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn-by-hand.expec"
```

Los tres más cercanos son `1.0` (cuadrado), `2.0` (círculo) y `2.24` (círculo). Gana círculo, 2 a 1. MACHINE llega a lo mismo:

```kafe
--8<-- "tests/DocsExamples/machine/knn-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn-check.expec"
```

### Cómo está construido por dentro { #knn-inside }

El modelo vive en `src/lib/KafeMACHINE/neighbors/KNN.py`.

- `fit` copia `X` e `y`. Eso es todo: por eso se dice que KNN es un **aprendiz perezoso**.
- `predict`, para cada fila nueva, mide la distancia a **todos** los ejemplos guardados, los ordena, toma los `k` primeros y cuenta votos. Si hay empate, gana la etiqueta menor.
- `predict_proba` devuelve la fracción de votos de cada grupo.

!!! warning "Las escalas importan"
    Si una columna va de 0 a 1000 y otra de 0 a 1, la primera decide sola quién está cerca. Escala tus datos con [`StandardScaler`](preprocessing.md) antes de usar KNN.

### API { #knn-api }

| Llamada | Qué hace |
|---|---|
| `machine.knn(k)` | Crea el modelo. `k` (`INT`, por defecto `3`) es cuántos vecinos votan. |
| `model.fit(X, y)` | Guarda los ejemplos. |
| `model.predict(X)` / `model.predict_proba(X)` / `model.score(X, y)` | Grupo, fracción de votos por grupo y exactitud. |
| `model.k` | El número de vecinos. |

??? warning "Error común: más vecinos que ejemplos"
    ```kafe
    --8<-- "tests/DocsExamples/machine/knn-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/knn-too-many.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Muy fácil de entender. | Lento al predecir con muchos datos: mide todas las distancias. |
| Funciona con cualquier número de grupos. | Sensible a la escala de los datos. |
| Las fronteras pueden tener cualquier forma. | Hay que elegir `k`: muy chico copia el ruido, muy grande lo aplana todo. |

## KNNRegressor: el promedio de los vecinos { #knnregressor }

### La idea en una frase

Igual que KNN, pero en vez de votar un grupo, **promedia los números** de los `k` vecinos más cercanos.

### Una comparación de la vida diaria

Para saber cuánto cobrar por tu apartamento, miras el precio de los **2 apartamentos más parecidos** en tamaño y sacas el promedio.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-knn-regressor.svg"
<figcaption>Cinco apartamentos por tamaño y precio. Una raya marca un apartamento nuevo de 42 m². Sus dos vecinos más cercanos (40 y 50 m²) se marcan con anillos, y la predicción aparece justo en medio de sus precios: 15.5.</figcaption>
</figure>

### Tu primer KNNRegressor

```kafe
--8<-- "tests/DocsExamples/machine/knn_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn_regressor.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.knn_regressor(2)` promedia **2** vecinos.
    2. Para 45 m², los vecinos son 40 (14) y 50 (17): (14 + 17) ÷ 2 = `15.5`.
    3. Para 70 m², son 60 (21) y 80 (28): `24.5`.

### Vecinos que pesan distinto { #knnregressor-distance }

Con `"distance"`, el vecino **más cercano pesa más** en el promedio. Para 42 m², el de 40 m² está a 2 y el de 50 m² está a 8: el primero cuenta 4 veces más.

```kafe
--8<-- "tests/DocsExamples/machine/knn_regressor-distance.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn_regressor-distance.expec"
```

El promedio simple da `15.5`; el promedio por distancia da `14.6`, más cerca del precio del vecino de 40 m². La cuenta es $(14 \cdot \tfrac12 + 17 \cdot \tfrac18) \div (\tfrac12 + \tfrac18) = 14.6$.

### API { #knn_regressor }

| Llamada | Qué hace |
|---|---|
| `machine.knn_regressor(k, weights)` | Crea el modelo. `k` (`INT`, por defecto `5`); `weights` (`STR`): `"uniform"` (todos iguales, por defecto) o `"distance"` (pesa más el más cercano). |
| `model.fit` / `predict` / `score` | Guardar, promediar y la nota $R^2$. |
| `model.k` / `model.weights` | Los ajustes elegidos. |

??? warning "Error común: un `weights` que no existe"
    ```kafe
    --8<-- "tests/DocsExamples/machine/knn_regressor-weights.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/knn_regressor-weights.error.stderr.expec"
    ```

!!! note "No sabe salir del mapa"
    Un KNNRegressor nunca predice algo más alto que el mayor de sus ejemplos ni más bajo que el menor: solo promedia lo que ya vio.

## DecisionTreeClassifier: un árbol de preguntas { #decisiontreeclassifier }

### La idea en una frase

Un **árbol de decisión** aprende una lista de **preguntas de sí o no** ("¿pesa menos de 125 g?") que van separando los ejemplos hasta que cada grupo queda limpio.

### Una comparación de la vida diaria

Es el juego de **adivinar el personaje**: "¿es humano?", "¿usa sombrero?", "¿tiene barba?". Cada respuesta descarta a muchos. Un buen jugador elige primero la pregunta que **más descarta**. El árbol hace lo mismo con tus datos.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tree-split.svg"
<figcaption>Seis puntos mezclados en una línea. Un corte de prueba se mueve a 4.5, a 3.5 y a 2.5, y muestra cuánto ordena cada uno (0.25, 0.056 y 0.25). Se queda con 2.5 y aparece el árbol: la pregunta "x ≤ 2.5" con una hoja círculo a la izquierda y una hoja cuadrado a la derecha.</figcaption>
</figure>

### Tu primer árbol

Frutas medidas por peso (g) y diámetro (cm): `0` = limón, `1` = manzana, `2` = mango.

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. El árbol acertó todas las frutas (`1.0`).
    2. `model.tree_` muestra las preguntas que aprendió. Léelo así: "¿el dato 0 (peso) es ≤ 125? Si sí → limón. Si no: ¿peso ≤ 220? Si sí → manzana; si no → mango".
    3. Solo necesitó el peso: el diámetro no ayudaba a separar más.

### Las matemáticas con números pequeños { #decisiontreeclassifier-math }

¿Cómo sabe qué pregunta es mejor? Mide qué tan **mezclado** está cada grupo con el **índice de Gini**: 0 si todos son iguales y 0.5 si es mitad y mitad (con dos clases).

$$\text{Gini} = 1 - p_0^2 - p_1^2$$

Para cada corte posible calcula el Gini promedio de los dos lados y cuánto **bajó** respecto del inicio (0.5). A eso se le llama **ganancia**. Este programa prueba tres cortes en la recta del dibujo:

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-gini.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-gini.expec"
```

Los cortes 2.5 y 4.5 empatan con `0.25`; el 3.5 casi no ordena nada (`0.056`). El árbol se queda con el primero que encontró, 2.5. Con un árbol de **una sola pregunta** (`max_depth = 1`) se ve justo eso:

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-check.expec"
```

El árbol de una pregunta acierta 5 de 6 (`0.83`). El árbol sin límite sigue preguntando hasta acertar todos (`1.0`).

??? info "Para curiosos 🤓"
    Con $k$ clases, $\text{Gini} = 1 - \sum_c p_c^2$. La otra opción, `"entropy"`, usa $H = -\sum_c p_c \log_2 p_c$. La ganancia de un corte es la mezcla del padre menos el promedio ponderado de la mezcla de los hijos:

    $$\Delta = I(\text{padre}) - \frac{n_L}{n} I(L) - \frac{n_R}{n} I(R)$$

    Para cada columna, el árbol ordena los valores y prueba como corte el **punto medio** entre dos valores seguidos.

### Cómo está construido por dentro { #decisiontreeclassifier-inside }

El modelo vive en `src/lib/KafeMACHINE/tree/DecisionTree.py`. `fit` llama a una función **recursiva** (que se llama a sí misma):

1. Si todos los ejemplos son del mismo grupo, si se llegó a `max_depth` o si quedan menos de `min_samples_split` ejemplos, crea una **hoja** con el grupo más común.
2. Si no, prueba todos los cortes de todas las columnas y elige el de mayor ganancia, respetando `min_samples_leaf` en cada lado.
3. Separa los ejemplos en izquierda (≤ corte) y derecha (> corte) y repite en cada lado.

El resultado es un diccionario anidado: `model.tree_`. `predict` lo recorre desde arriba, respondiendo las preguntas, hasta llegar a una hoja.

### API { #decision_tree_classifier }

| Llamada | Qué hace |
|---|---|
| `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | Crea el árbol. Todos son opcionales: `criterion` (`"gini"` o `"entropy"`), `max_depth` (`INT`, `0` = sin límite), `min_samples_split` (`2`), `min_samples_leaf` (`1`). |
| `model.fit` / `predict` / `score` | Aprender, clasificar y la exactitud. |
| `model.tree_` | Las preguntas aprendidas. |
| `model.classes_` / `model.n_features_` | Los grupos y cuántas columnas tiene cada ejemplo. |

??? warning "Error común: un criterio de regresión"
    ```kafe
    --8<-- "tests/DocsExamples/machine/decision_tree_classifier-criterion.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/decision_tree_classifier-criterion.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Puedes leer sus preguntas y entender cada decisión. | Sin límite, memoriza los datos (se **sobreajusta**). |
| No le importa la escala de los datos. | Un cambio pequeño en los datos puede cambiar todo el árbol. |
| Funciona con varios grupos. | Sus fronteras son siempre rectas y en escalera. |

## DecisionTreeRegressor: predecir con escalones { #decisiontreeregressor }

### La idea en una frase

El mismo árbol de preguntas, pero cada hoja guarda un **número**: el **promedio** de los ejemplos que llegaron a ella. Por eso sus predicciones parecen **escalones**.

### Una comparación de la vida diaria

Una heladería anota cuántos helados vende según la temperatura. En vez de una fórmula, la encargada usa una regla: "si hace menos de 21.5 °C, vendemos unos 21; si hace más, unos 48".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tree-regressor.svg"
<figcaption>Ventas de helado según la temperatura. Primero, una línea plana en el promedio de todo (37.2). Después el árbol corta en 21.5 °C y la línea se vuelve dos escalones: 21 del lado frío y 48 del lado cálido.</figcaption>
</figure>

### Tu primer árbol de regresión

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_regressor.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.decision_tree_regressor("mse", 1)` crea un árbol de **una pregunta**. Su `tree_` dice: "¿temperatura ≤ 21.5? → 21; si no → 48". 21 es el promedio de 20 y 22; 48, el de 40, 44 y 60.
    2. Tiene nota `0.79`: bien para una sola pregunta.
    3. El árbol sin límite sigue cortando hasta que cada hoja tiene un solo ejemplo: nota `1.0`, pero ya **memorizó** los datos.

En vez de Gini, el árbol de regresión mide el **error cuadrático medio** (`"mse"`) de cada lado: el mejor corte es el que deja los números de cada lado **más parecidos entre sí**.

### API { #decision_tree_regressor }

| Llamada | Qué hace |
|---|---|
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | Igual que el clasificador, pero `criterion` solo puede ser `"mse"`. |
| `model.fit` / `predict` / `score` | Aprender, predecir números y la nota $R^2$. |
| `model.tree_` | Las preguntas; cada hoja tiene un `value`. |

??? warning "Error común: un criterio de clasificación"
    ```kafe
    --8<-- "tests/DocsExamples/machine/decision_tree_regressor-criterion.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/decision_tree_regressor-criterion.error.stderr.expec"
    ```

!!! note "Tampoco sabe salir del mapa"
    Como cada hoja es un promedio de ejemplos vistos, el árbol no predice más allá de los datos: con 40 °C diría 60, igual que con 32 °C.

## GaussianNB: ¿qué tan típico es? { #gaussiannb }

### La idea en una frase

**Naive Bayes gaussiano** describe cada grupo con una **campana** (su promedio y qué tan dispersos están sus datos). Para un dato nuevo pregunta: ¿en qué campana queda **más alto**? Ese es su grupo.

### Una comparación de la vida diaria

Si ves a alguien de 2.10 m, piensas "probablemente juega básquetbol": esa altura es **rara** en la gente en general pero **típica** entre basquetbolistas. Naive Bayes compara qué tan típico es el dato en cada grupo, y también cuántos hay de cada grupo.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-naive-bayes-bells.svg"
<figcaption>Una campana estrecha centrada en 4 kg para los gatos y una ancha y baja centrada en 10 kg para los perros. En 6 kg, la campana de los perros es más alta (0.052) que la de los gatos (0.024), aunque 6 está más cerca de 4.</figcaption>
</figure>

### Tu primer Naive Bayes

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `fit` calculó el promedio de cada grupo, `theta_`: 100 y 150.
    2. `class_prior_` dice cuántos hay de cada grupo: mitad y mitad.
    3. Para 122 (más cerca de 100 que de 150) dio `0.9` al grupo `0`.

### Las matemáticas con números pequeños { #gaussiannb-math }

Ahora el caso del dibujo: 3 gatos (3, 4 y 5 kg) y 5 perros (6, 8, 10, 12 y 14 kg). ¿Un animal de 6 kg es gato o perro? El programa calcula:

1. La **varianza** de cada grupo (qué tan dispersos están): gatos `0.667`, perros `8.0`.
2. La altura de cada campana en 6: gatos `0.0243`, perros `0.0519`.
3. Multiplica cada altura por la proporción del grupo (3/8 y 5/8) y reparte el total.

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb-by-hand.expec"
```

Resultado: `0.22` gato y `0.78` perro. Los gatos son **muy parejos** entre sí, así que 6 kg es raro para un gato. MACHINE da lo mismo:

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb-check.expec"
```

??? info "Para curiosos 🤓"
    Es el **teorema de Bayes**: $P(c \mid x) \propto P(c)\,P(x \mid c)$. Cada $P(x_j \mid c)$ es una campana normal

    $$P(x_j \mid c) = \frac{1}{\sqrt{2\pi\sigma_{c,j}^2}}\exp\!\left(-\frac{(x_j - \mu_{c,j})^2}{2\sigma_{c,j}^2}\right)$$

    Se llama **ingenuo** (*naive*) porque, con varias columnas, multiplica sus campanas como si fueran **independientes**. Casi nunca lo son, pero funciona sorprendentemente bien. KAFE suma logaritmos en vez de multiplicar, para no perder precisión con números muy pequeños.

### Cómo está construido por dentro { #gaussiannb-inside }

El modelo vive en `src/lib/KafeMACHINE/naive_bayes/GaussianNB.py`. `fit` no da vueltas: para cada grupo calcula una sola vez su proporción (`class_prior_`), el promedio de cada columna (`theta_`) y su varianza (`var_`). `predict` evalúa las campanas y elige la mayor.

### API { #gaussian_nb }

| Llamada | Qué hace |
|---|---|
| `machine.gaussian_nb()` | Crea el modelo. No recibe parámetros. |
| `model.fit` / `predict` / `predict_proba` / `score` | Aprender, clasificar, probabilidad por grupo y exactitud. |
| `model.classes_`, `class_prior_`, `theta_`, `var_`, `n_features_in_` | Los grupos, su proporción, sus promedios, sus varianzas y el número de columnas. |

??? warning "Error común: un solo grupo"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gaussian_nb-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gaussian_nb-one-class.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Aprende al instante y con pocos datos. | Supone que cada grupo tiene forma de campana. |
| Da probabilidades. | Supone que las columnas no se relacionan entre sí. |

## RandomForestClassifier: muchos árboles votan { #randomforestclassifier }

### La idea en una frase

Un **bosque aleatorio** entrena **muchos árboles**, cada uno con una versión un poco distinta de los datos, y deja que **voten**. Gana el grupo con más votos.

### Una comparación de la vida diaria

En un concurso de preguntas, el público vota. Cada persona se equivoca a veces, pero no todas en lo mismo, así que **la mayoría suele acertar**. Es la "sabiduría de la multitud".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-forest-vote.svg"
<figcaption>Cinco árboles pequeños votan uno por uno: cuadrado, círculo, cuadrado, cuadrado, círculo. El conteo queda 2 círculos contra 3 cuadrados, así que el bosque responde cuadrado.</figcaption>
</figure>

### Tu primer bosque

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_classifier.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.random_forest_classifier(25)` creó un bosque de **25 árboles**.
    2. Cada árbol aprendió con un sorteo distinto de los ejemplos. Juntos clasificaron bien los 8.

El voto es una cuenta muy simple. Con cinco árboles que votaron `1, 0, 1, 1, 0`:

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_classifier-vote.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_classifier-vote.expec"
```

2 votos para `0`, 3 para `1`: gana `1`.

### ¿Por qué los árboles son distintos? { #randomforestclassifier-inside }

Si todos los árboles vieran lo mismo, votarían igual y no serviría de nada. El bosque usa dos sorteos (por eso es *aleatorio*):

1. **Sorteo de ejemplos (*bootstrap*).** Cada árbol recibe una lista del mismo tamaño que la original, sacada **con reposición**: algunos ejemplos salen repetidos y otros no salen.
2. **Sorteo de columnas.** En cada pregunta, el árbol solo puede mirar algunas columnas al azar: la raíz cuadrada del total.

El código está en `src/lib/KafeMACHINE/tree/RandomForest.py`. `predict` pregunta a cada árbol y cuenta votos.

??? info "Para curiosos 🤓"
    A esta técnica se le llama ***bagging*** (*bootstrap aggregating*). Si cada árbol acierta más de la mitad de las veces y sus errores no van todos juntos, la votación de muchos árboles acierta más que cualquiera de ellos. Un árbol solo tiene mucha **varianza** (cambia mucho con los datos); el promedio de muchos la reduce.

### API { #random_forest_classifier }

| Llamada | Qué hace |
|---|---|
| `machine.random_forest_classifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Crea el bosque. Todos son `INT` opcionales: `n_estimators` (cuántos árboles, `10`), `max_depth` (`0` = sin límite), `min_samples_split` (`2`), `min_samples_leaf` (`1`). |
| `model.fit` / `predict` / `score` | Aprender, votar y la exactitud. |
| `model.classes_`, `n_estimators`, `n_features_` | Los grupos, el número de árboles y de columnas. |

??? warning "Error común: predecir sin entrenar"
    ```kafe
    --8<-- "tests/DocsExamples/machine/random_forest_classifier-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/random_forest_classifier-not-fitted.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Se sobreajusta mucho menos que un solo árbol. | Ya no se lee como un árbol de preguntas. |
| Funciona bien sin tocar casi nada. | Más árboles = más lento. |

## RandomForestRegressor: el promedio del bosque { #randomforestregressor }

### La idea en una frase

Lo mismo que el bosque clasificador, pero cada árbol predice un **número** y el bosque da el **promedio**.

### Una comparación de la vida diaria

Para adivinar cuántos caramelos hay en un frasco, el promedio de lo que dicen muchas personas suele estar más cerca que la respuesta de cualquiera de ellas.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-forest-average.svg"
<figcaption>Las ventas de helado otra vez. Aparecen tres líneas finas de escalones, una por árbol, cada uno entrenado con un sorteo distinto de los datos. Después aparece su promedio: una línea más gruesa con escalones más pequeños y suaves.</figcaption>
</figure>

### Tu primer bosque de regresión

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_regressor.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Con 20 árboles, para 16 °C predijo `21.5` y para 30 °C, `45.3`.
    2. Compara con el árbol de una pregunta de arriba (21 y 48): el promedio de muchos árboles da escalones más suaves.
    3. `max_depth` vale `0`: los árboles no tienen límite de profundidad.

### API { #random_forest_regressor }

| Llamada | Qué hace |
|---|---|
| `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Igual que el clasificador. |
| `model.fit` / `predict` / `score` | Aprender, promediar y la nota $R^2$. |
| `model.n_estimators` / `model.max_depth` | Los ajustes elegidos. |

??? warning "Error común: cambiar la cantidad de columnas"
    ```kafe
    --8<-- "tests/DocsExamples/machine/random_forest_regressor-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/random_forest_regressor-features.error.stderr.expec"
    ```

!!! tip "¿Qué aprendiste en esta página?"
    - **LogisticRegression** usa una curva en S para dar probabilidades entre dos grupos.
    - **KNN** copia a los vecinos más cercanos: vota o promedia.
    - Un **árbol de decisión** aprende preguntas de sí o no y elige la que más ordena.
    - **GaussianNB** compara qué tan típico es un dato en la campana de cada grupo.
    - Un **bosque aleatorio** junta muchos árboles distintos: votan o promedian.
