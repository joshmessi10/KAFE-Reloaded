# MACHINE: modelos lineales y SVM

Un **modelo lineal** aprende a dar una respuesta haciendo una **suma con pesos**: multiplica cada dato por un número (su **peso**), suma todo y agrega un número fijo. Es la misma cuenta que hace [una neurona](../../aprende/neuronas.md). Aprender significa encontrar los pesos correctos.

En esta página están los modelos que trazan **rectas**: unos para predecir un número (regresión) y uno para separar dos grupos (SVM).

| Modelo | Para qué sirve |
|---|---|
| [`LinearRegression`](#linearregression) | Predecir un número con la recta que mejor pasa entre los puntos. |
| [`RidgeRegression`](#ridgeregression) | Lo mismo, pero con pesos pequeños para no exagerar. |
| [`LassoRegression`](#lassoregression) | Lo mismo, pero apaga los datos que no ayudan. |
| [`ElasticNet`](#elasticnet) | Una mezcla de Ridge y Lasso. |
| [`SVR`](#svr-support-vector-regression) | Una recta con un "tubo" de tolerancia alrededor. |
| [`SVM`](#svm-support-vector-machine-classifier) | Separar dos grupos con la calle más ancha posible. |

!!! tip "Antes de empezar"
    Todos los modelos de MACHINE se usan igual: los **creas**, les enseñas con `fit` y les preguntas con `predict`. Si es tu primera vez, lee [cómo funciona MACHINE](../machine.md).

## LinearRegression: la recta que mejor pasa { #linearregression }

### La idea en una frase

La **regresión lineal** busca la **recta** que pasa lo más cerca posible de todos tus puntos, y después usa esa recta para **predecir** números nuevos.

### Una comparación de la vida diaria

Imagina que clavas varios clavos en una tabla y quieres apoyar una regla que quede lo más cerca posible de todos. No puede tocar todos a la vez, así que la giras y la subes hasta que **ninguno quede muy lejos**. Esa regla es la recta del modelo.

Con ella puedes responder preguntas como: "si un apartamento de 40 m² cuesta 14 y uno de 60 m² cuesta 21, ¿cuánto costará uno de 70 m²?".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-recta-errores.svg"
<figcaption>La recta empieza plana, a la altura del promedio. Las rayitas de color son los errores: lo que le falta a la recta para llegar a cada punto. Al girar, los errores se encogen y la barra de la derecha (la suma de los errores al cuadrado) baja de 98 a 1.9.</figcaption>
</figure>

### Tu primera recta

Cinco estudiantes anotaron cuántas horas estudiaron y qué nota sacaron. Le damos esos ejemplos al modelo:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.linear_regression()` creó un modelo **vacío**: todavía no sabe nada.
    2. `model.fit(hours, grade)` le mostró los ejemplos. El modelo encontró la recta.
    3. `model.coef_` es la **pendiente**: `2.0`. Cada hora extra de estudio sube la nota 2 puntos.
    4. `model.intercept_` es el **punto de partida**: `1.0`. Es la nota con 0 horas.
    5. `model.predict([6.0, 10.0])` usó la recta: 2 × 6 + 1 = `13.0` y 2 × 10 + 1 = `21.0`.

### Las dos piezas de una recta { #linearregression-parts }

Toda recta se describe con solo **dos números**:

- La **pendiente** (*slope*): cuánto sube la recta cuando avanzas un paso a la derecha. Es la inclinación de una rampa. En KAFE se llama `coef_`.
- El **punto de partida** (*intercept*): a qué altura está la recta cuando el dato vale 0. En KAFE se llama `intercept_`.

Para predecir, el modelo hace esta cuenta:

$$\text{predicción} = \text{pendiente} \times \text{dato} + \text{punto de partida}$$

Aprender es encontrar esos dos números. Nada más.

### Las matemáticas con números pequeños { #linearregression-math }

¿Cómo sabe el modelo cuál es la mejor recta? Mide el **error** de cada punto: la distancia vertical entre el punto y la recta (las rayitas de color del dibujo). Luego eleva cada error **al cuadrado** y los suma. La mejor recta es la que hace esa suma **lo más pequeña posible**. Por eso el método se llama **mínimos cuadrados**.

!!! note "¿Por qué al cuadrado?"
    Por dos razones. Un error de −3 (la recta quedó por encima) y uno de +3 (quedó por debajo) son igual de malos, y al cuadrado los dos dan 9. Además, un error grande pesa mucho más que varios pequeños: el modelo prefiere equivocarse poquito con todos antes que mucho con uno.

Cuando hay un solo dato por ejemplo, la mejor recta se calcula con una receta de cuatro pasos. Vamos a hacerla **a mano** con cinco apartamentos (tamaño en m² y precio):

| Tamaño $x$ | 20 | 30 | 40 | 50 | 60 |
|---|---|---|---|---|---|
| Precio $y$ | 9 | 12 | 14 | 19 | 21 |

1. **Saca los promedios.** El tamaño promedio es 40 y el precio promedio es 15. La mejor recta **siempre** pasa por ese punto (40, 15): es el clavo del centro sobre el que gira la regla.
2. **Mira cuánto se aleja cada punto del promedio.** Por ejemplo, el primer apartamento mide 20 − 40 = −20 (20 menos que el promedio) y cuesta 9 − 15 = −6 (6 menos que el promedio).
3. **Calcula la pendiente.** Multiplica las dos distancias de cada punto y suma todo: da 310. Luego suma las distancias de tamaño al cuadrado: da 1000. La pendiente es 310 ÷ 1000 = **0.31**.
4. **Calcula el punto de partida.** Como la recta pasa por (40, 15): 15 − 0.31 × 40 = **2.6**.

Este programa hace esa misma receta con bucles, **sin usar MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-by-hand.expec"
```

Y este le pide lo mismo a MACHINE. Los números coinciden:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-noisy.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-noisy.expec"
```

El último número, `0.981`, es la **nota del modelo** (se llama $R^2$). Compara dos sumas de errores al cuadrado, las mismas del dibujo:

- la de la recta plana que solo usa el promedio: **98**;
- la de la recta que aprendió el modelo: **1.9**.

$R^2 = 1 - 1.9 \div 98 = 0.981$. Un 1 sería perfecto; un 0 significa que el modelo no es mejor que decir siempre el promedio.

??? info "Para curiosos 🤓"
    Con un solo dato por ejemplo, la receta de arriba es:

    $$\text{pendiente} = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{\sum_i (x_i - \bar{x})^2} \qquad \text{punto de partida} = \bar{y} - \text{pendiente} \cdot \bar{x}$$

    Con varios datos por ejemplo se usa la **ecuación normal**. Se arma una matriz $X$ con una columna de unos (para el punto de partida) y una columna por cada dato, y se resuelve

    $$(X^T X)\,\theta = X^T y$$

    El resultado $\theta$ trae primero el punto de partida y después un peso por cada dato. Resolver ese sistema cuesta del orden de $n \cdot m^2 + m^3$ operaciones para $n$ ejemplos y $m$ datos. La nota es $R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}$.

### Cómo está construido por dentro { #linearregression-inside }

El modelo vive en `src/lib/KafeMACHINE/linear/LinearRegression.py`. Es una clase pequeña que guarda **solo dos cosas**: la lista `coef_` y el número `intercept_`. Al crearlo están vacíos (`[]` y `0.0`).

Cuando llamas a `fit(X, y)`, el modelo hace esto, en orden:

1. **Revisa los datos.** Si le diste una lista simple como `[1.0, 2.0, 3.0]`, la convierte en una tabla de una columna: `[[1.0], [2.0], [3.0]]`. Comprueba que todas las filas midan lo mismo y que haya tantas respuestas como filas.
2. **Agrega una columna de unos** al principio de la tabla. Ese `1` es el truco para que el punto de partida se calcule como si fuera un peso más.
3. **Hace dos resúmenes con sumas.** Multiplica la tabla por ella misma girada ($X^T X$) y por las respuestas ($X^T y$). Son [multiplicaciones de matrices](../numk/matrix-multiplication.md) hechas con bucles.
4. **Resuelve el sistema de ecuaciones** con el método de Gauss-Jordan, el mismo que usa [`numk.inv`](../numk/matrix-multiplication.md#inv): va dejando un 1 en cada fila y ceros en las demás, hasta que cada peso queda solo.
5. **Guarda el resultado**: el primer número va a `intercept_` y los demás a `coef_`. Marca el modelo como entrenado.

`predict(X)` es mucho más corto: para cada fila calcula `intercept_` más la suma de cada dato por su peso. No vuelve a aprender nada.

!!! note "No hay vueltas ni ensayo y error"
    Otros modelos mejoran poco a poco, paso a paso. La regresión lineal de KAFE no: resuelve una ecuación y obtiene la respuesta exacta de una sola vez.

### Crear el modelo: `machine.linear_regression()` { #linear_regression }

**Qué hace:** Crea un modelo de regresión lineal vacío, listo para aprender.

**Cuándo usarla:** Cuando quieres predecir **un número** (un precio, una nota, una temperatura) y crees que sube o baja de forma pareja con tus datos.

No recibe parámetros.

**Devuelve:** `MACHINE`: el modelo sin entrenar.

### `model.fit(X, y)` { #linearregression-fit }

**Qué hace:** Enseña al modelo con ejemplos: encuentra la recta.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[FLOAT]`, `List[List[FLOAT]]` o `PARDOS` | Los datos. Una lista simple si hay un dato por ejemplo; una tabla (una fila por ejemplo) si hay varios. |
| `y` | `List[FLOAT]` | La respuesta correcta de cada ejemplo, en el mismo orden. |

**Devuelve:** El mismo modelo, ya entrenado.

### `model.predict(X)` { #linearregression-predict }

**Qué hace:** Usa la recta para calcular la respuesta de datos nuevos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[FLOAT]` o `List[List[FLOAT]]` | Los datos nuevos, con la misma cantidad de columnas que usaste en `fit`. |

**Devuelve:** `List[FLOAT]`: una predicción por cada fila.

### `model.score(X, y)` { #linearregression-score }

**Qué hace:** Le pone una nota al modelo ($R^2$) comparando sus predicciones con las respuestas correctas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[FLOAT]` o `List[List[FLOAT]]` | Los datos. |
| `y` | `List[FLOAT]` | Las respuestas correctas. |

**Devuelve:** `FLOAT`: 1.0 es perfecto; cerca de 0 es tan malo como decir siempre el promedio.

### Lo que el modelo aprendió { #linearregression-properties }

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `model.coef_` | `List[FLOAT]` | Un peso (pendiente) por cada columna de datos. |
| `model.intercept_` | `FLOAT` | El punto de partida. |

Son propiedades, no funciones: se escriben **sin paréntesis**.

### Con más de un dato por ejemplo { #linearregression-many }

Si cada ejemplo tiene varios datos, cada uno recibe su propio peso. Aquí cada fila es `[horas de estudio, clases de repaso]`:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-two-features.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-two-features.expec"
```

El modelo descubrió la regla escondida en los datos: nota = **2** × horas + **3** × repasos + **1**. Ya no es una recta sobre un papel, sino una superficie plana, pero la idea es la misma.

### Errores comunes { #linearregression-errors }

??? warning "Preguntar antes de enseñar"
    Si llamas a `predict` sin haber llamado a `fit`, el modelo no tiene recta:

    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_regression-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_regression-not-fitted.error.stderr.expec"
    ```

??? warning "Cambiar la cantidad de datos"
    Si aprendió con un dato por ejemplo, no puede predecir con dos:

    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_regression-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_regression-features.error.stderr.expec"
    ```

### Ventajas y límites { #linearregression-tradeoffs }

| 👍 Ventajas | 👎 Límites |
|---|---|
| Es rápida y da siempre la misma respuesta. | Solo dibuja rectas: no sirve si tus puntos forman una curva. |
| Se entiende: cada peso dice cuánto importa un dato. | Un punto muy raro (por ejemplo, un error al anotar) puede torcer toda la recta. |
| No hay que elegir ajustes. | Si dos columnas dicen casi lo mismo, falla con `Singular matrix`. Para eso existe [`RidgeRegression`](#ridgeregression). |

!!! tip "¿Qué aprendiste?"
    - Una recta se describe con dos números: la pendiente (`coef_`) y el punto de partida (`intercept_`).
    - La mejor recta es la que hace más pequeña la suma de los errores al cuadrado.
    - `fit` encuentra la recta, `predict` la usa y `score` le pone nota.

## RidgeRegression: una recta más prudente { #ridgeregression }

### La idea en una frase

**Ridge** es una regresión lineal a la que le **cobran** por usar pesos grandes. Así prefiere rectas más suaves, que no exageran por culpa de unos pocos datos.

### Una comparación de la vida diaria

Piensa en alguien que da consejos. Si lo cambia todo por un solo comentario, es fácil engañarlo. Si es **prudente**, necesita más pruebas antes de cambiar de opinión. Ridge es la versión prudente de la regresión lineal: el número `alpha` dice **qué tan prudente** es.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-ridge-alpha.svg"
<figcaption>Con α = 0, la recta pasa justo por los puntos (pendiente 2.0). Cuando α sube a 10 y a 30, la recta gira sobre el punto del medio y se aplana: la pendiente baja a 1.0 y luego a 0.5. El peso se encoge, pero nunca llega a cero.</figcaption>
</figure>

### Tu primer Ridge

Los mismos estudiantes de antes, con un Ridge muy prudente (`alpha = 10.0`):

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.ridge_regression(10.0)` creó un modelo con prudencia 10.
    2. La regresión normal habría encontrado pendiente `2.0`. Ridge encontró `1.0`: la mitad, porque le cobraron por el peso.
    3. El punto de partida subió a `4.0` para que la recta siga pasando por el centro de los datos (3, 7).
    4. Por eso la nota bajó a `0.75`: Ridge acepta equivocarse un poco a cambio de no exagerar.

Mira cómo cambia la pendiente cuando sube `alpha`:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-alphas.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-alphas.expec"
```

Con `alpha = 0.0` es exactamente una regresión lineal. Con `alpha` muy grande, la recta queda casi plana.

### Las matemáticas con números pequeños { #ridgeregression-math }

Ridge suma dos cosas y busca la pendiente que hace el total **lo más pequeño posible**:

$$\text{total} = \underbrace{\sum \text{errores}^2}_{\text{qué tan mal predice}} + \underbrace{\alpha \cdot w^2}_{\text{lo que le cobran por el peso}}$$

Este programa prueba cuatro pendientes a mano con `alpha = 10` y después usa la receta corta:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-by-hand.expec"
```

- Las cuatro primeras líneas son el total para las pendientes 0.5, 1.0, 1.5 y 2.0. El más bajo (`20.0`) es el de la pendiente **1.0**.
- La receta corta es la de LinearRegression con un cambio: **se suma `alpha` abajo**. En vez de 20 ÷ 10 = 2.0, da 20 ÷ (10 + 10) = **1.0**.

??? info "Para curiosos 🤓"
    Ridge resuelve la ecuación normal con un extra en la diagonal:

    $$(X^T X + \alpha I)\,w = X^T y$$

    Ese $+\alpha I$ hace que el sistema **siempre** tenga solución, aunque dos columnas sean iguales. El punto de partida no se castiga: KAFE centra los datos (les resta su promedio) antes de resolver y luego lo calcula aparte.

### Cuando dos datos dicen lo mismo { #ridgeregression-twins }

Si dos columnas son **gemelas** (siempre iguales), LinearRegression falla con `Singular matrix`: hay infinitas formas de repartir el peso. Ridge reparte el peso **a partes iguales**:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-twins.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-twins.expec"
```

Cada gemelo recibe `0.95`. Juntos suman casi 2, el peso real.

### Cómo está construido por dentro { #ridgeregression-inside }

El modelo vive en `src/lib/KafeMACHINE/linear/RidgeRegression.py`. En `fit`:

1. Revisa los datos, igual que LinearRegression.
2. **Centra** cada columna y las respuestas: les resta su promedio.
3. Arma $X^T X$, le **suma `alpha` en la diagonal** y resuelve el sistema con Gauss-Jordan.
4. Calcula el punto de partida: promedio de `y` menos la suma de pesos por promedios de `X`.

Como LinearRegression, no da vueltas: resuelve la ecuación una vez.

### API { #ridge_regression }

| Llamada | Qué hace |
|---|---|
| `machine.ridge_regression(alpha)` | Crea el modelo. `alpha` (`FLOAT`, por defecto `1.0`) es la prudencia; no puede ser negativa. |
| `model.fit(X, y)` | Aprende los pesos. |
| `model.predict(X)` | Devuelve `List[FLOAT]` con una predicción por fila. |
| `model.score(X, y)` | Devuelve la nota $R^2$. |
| `model.coef_` / `model.intercept_` | Los pesos y el punto de partida, como en LinearRegression. |

??? warning "Error común: `alpha` negativa"
    Una prudencia negativa no tiene sentido: premiaría los pesos grandes.

    ```kafe
    --8<-- "tests/DocsExamples/machine/ridge_regression-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ridge_regression-alpha.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Funciona aunque haya columnas gemelas o muy parecidas. | Hay que elegir `alpha` (prueba varios con [`cross_val_score`](selection.md)). |
| Las predicciones cambian poco si cambian unos pocos datos. | Nunca deja un peso en cero: no te dice qué datos sobran. |

## LassoRegression: apaga lo que no sirve { #lassoregression }

### La idea en una frase

**Lasso** también cobra por los pesos, pero de otra forma: cobra lo mismo por cada unidad de peso. Con eso, los datos que ayudan poco quedan con peso **exactamente cero**: Lasso los **apaga**.

### Una comparación de la vida diaria

Imagina que haces la maleta con un límite de peso. Ridge saca un poco de **todo**: menos camisetas, menos zapatos, menos libros. Lasso deja en casa **cosas enteras**: si el paraguas casi no sirve, no lo lleva.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-lasso-zero.svg"
<figcaption>El mismo peso aprendido por Ridge (izquierda) y por Lasso (derecha). Con α = 0 los dos valen 2.0 y con α = 10 los dos valen 1.0. Con α = 20, Ridge sigue en 0.67, pero Lasso llega a 0 exacto: el interruptor se apaga.</figcaption>
</figure>

### Tu primer Lasso

Cada estudiante tiene dos datos: horas de estudio y su número de la suerte (que no tiene nada que ver con la nota):

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La regresión normal le dio un pesito (`0.13`) al número de la suerte: se dejó engañar por la casualidad.
    2. `machine.lasso_regression(3.0)` apagó ese dato: su peso es `0.0`.
    3. Las horas de estudio siguen importando (`1.69`). El modelo predijo `12.15` para alguien que estudia 6 horas.

Con más `alpha`, Lasso apaga cada vez más. Con una sola columna:

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression-alphas.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression-alphas.expec"
```

### Las matemáticas con números pequeños { #lassoregression-math }

Lasso cambia el cobro: en vez de $\alpha \cdot w^2$ cobra $\alpha \cdot |w|$ (el peso sin signo). Con una sola columna, la receta queda así: a la parte de arriba (20 en los estudiantes) se le **resta** `alpha`, y si queda negativa se pone en **cero**. Ese truco se llama **umbral suave**.

Este programa compara las dos recetas, Ridge y Lasso, para `alpha` = 0, 10, 20 y 30:

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression-by-hand.expec"
```

Cada par de líneas es (Ridge, Lasso). Ridge **divide** y se acerca a cero sin llegar. Lasso **resta** y llega a cero.

??? info "Para curiosos 🤓"
    Lasso minimiza

    $$\frac{1}{2}\sum_i (y_i - \hat{y}_i)^2 + \alpha \sum_j |w_j|$$

    No hay una fórmula de una sola vez porque $|w|$ tiene una punta en el cero. KAFE usa **descenso por coordenadas**: arregla un peso a la vez, con los demás quietos, aplicando el umbral suave $S(z, \alpha) = \text{signo}(z)\cdot\max(|z| - \alpha, 0)$. Repite hasta que los pesos casi no cambian.

### Cómo está construido por dentro { #lassoregression-inside }

El modelo vive en `src/lib/KafeMACHINE/linear/LassoRegression.py`. En `fit`:

1. Revisa y centra los datos, como Ridge.
2. Empieza con todos los pesos en 0.
3. **Recorre las columnas una por una.** Para cada una calcula cuánto ayudaría con los demás pesos fijos y le aplica el umbral suave. Si ayuda menos que `alpha`, el peso queda en 0.
4. Repite el recorrido hasta que ningún peso cambia más de `0.0001` o se acaban las `1000` vueltas.
5. Calcula el punto de partida a partir de los promedios.

### API { #lasso_regression }

| Llamada | Qué hace |
|---|---|
| `machine.lasso_regression(alpha)` | Crea el modelo. `alpha` (`FLOAT`, por defecto `1.0`) no puede ser negativa. |
| `model.fit(X, y)` / `model.predict(X)` / `model.score(X, y)` | Igual que en LinearRegression. |
| `model.coef_` | Los pesos. Los que valen `0.0` son datos apagados. |
| `model.intercept_` | El punto de partida. |

??? warning "Error común: `alpha` negativa"
    ```kafe
    --8<-- "tests/DocsExamples/machine/lasso_regression-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/lasso_regression-alpha.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Te dice qué datos sobran: los que quedan en cero. | Con datos gemelos se queda con uno solo y apaga el otro. |
| El modelo final es más simple de leer. | Si `alpha` es muy grande, apaga también datos útiles. |

## ElasticNet: lo mejor de los dos { #elasticnet }

### La idea en una frase

**ElasticNet** cobra por los pesos **un poco como Ridge y un poco como Lasso**. Puede apagar datos inútiles y, a la vez, repartir el peso entre datos que se parecen.

### Una comparación de la vida diaria

Dos amigos te ayudaron igual con un trabajo. Lasso le da todo el crédito a uno y nada al otro. Ridge se lo reparte, pero nunca deja a nadie sin crédito, aunque no haya hecho nada. ElasticNet **reparte entre los que ayudaron** y **deja en cero a quien no ayudó**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-elastic-twins.svg"
<figcaption>Dos columnas gemelas, x₁ y x₂. Lasso le da todo el peso (1.9) a x₁ y nada a x₂. ElasticNet lo reparte: 0.95 y 0.95.</figcaption>
</figure>

### Tu primer ElasticNet

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Las dos columnas son iguales. Lasso eligió una (`1.9`) y apagó la otra (`0.0`).
    2. `machine.elastic_net(1.0, 0.5)` usa prudencia `1.0` y una mezcla mitad Ridge, mitad Lasso (`0.5`).
    3. ElasticNet repartió: `0.95` y `0.95`. Para alguien con `[6, 6]` predice `12.71`.

### La perilla de mezcla { #elasticnet-mix }

El segundo número, `l1_ratio`, es una perilla entre 0 y 1:

- `0.0` → puro Ridge (solo encoge);
- `1.0` → puro Lasso (puede apagar);
- en medio → una mezcla.

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net-mix.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net-mix.expec"
```

Y la misma cuenta a mano. Del cobro, la parte Lasso **resta** arriba (`alpha × mezcla`) y la parte Ridge **suma** abajo (`alpha × (1 − mezcla)`):

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net-by-hand.expec"
```

??? info "Para curiosos 🤓"
    ElasticNet minimiza

    $$\frac{1}{2}\sum_i (y_i - \hat{y}_i)^2 + \alpha\,\rho \sum_j |w_j| + \frac{\alpha\,(1-\rho)}{2} \sum_j w_j^2$$

    con $\rho$ = `l1_ratio`. KAFE usa el mismo descenso por coordenadas que Lasso; en cada paso el umbral suave usa $\alpha\rho$ y el denominador suma $\alpha(1-\rho)$. El código está en `src/lib/KafeMACHINE/linear/ElasticNet.py`.

### API { #elastic_net }

| Llamada | Qué hace |
|---|---|
| `machine.elastic_net(alpha, l1_ratio)` | Crea el modelo. `alpha` (`FLOAT`, por defecto `1.0`) es la prudencia; `l1_ratio` (`FLOAT` entre 0 y 1, por defecto `0.5`) es la mezcla. |
| `model.fit` / `predict` / `score`, `coef_`, `intercept_` | Igual que en LinearRegression. |

??? warning "Errores comunes"
    La mezcla debe estar entre 0 y 1:

    ```kafe
    --8<-- "tests/DocsExamples/machine/elastic_net-ratio.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/elastic_net-ratio.error.stderr.expec"
    ```

    Y `alpha` debe ser `FLOAT`: escribe `1.0`, no `1`.

    ```kafe
    --8<-- "tests/DocsExamples/machine/elastic_net-int-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/elastic_net-int-alpha.error.stderr.expec"
    ```

| Si tus datos… | Usa |
|---|---|
| tienen columnas muy parecidas | Ridge |
| tienen columnas que sobran | Lasso |
| tienen las dos cosas | ElasticNet |

## SVR: una recta con tolerancia { #svr-support-vector-regression }

### La idea en una frase

**SVR** (*Support Vector Regression*) dibuja una recta con un **tubo** alrededor. Los errores pequeños, dentro del tubo, **no cuentan**. Solo le importan los puntos que se salen, y los cobra **sin elevar al cuadrado**, así que un dato raro no la arrastra.

### Una comparación de la vida diaria

En un concurso de tiro, el tablero tiene un **centro amplio** y todo tiro dentro vale lo mismo. Fuera del centro, pierdes puntos según qué tan lejos caíste, pero un tiro que se fue a la pared no te hace perder todo el concurso. El ancho de ese centro es `epsilon` (ε).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-svr-tube.svg"
<figcaption>Cuatro puntos en línea recta y uno raro muy arriba (con anillo). Aparece el tubo de SVR, de ancho ε, alrededor de la recta que sigue a los cuatro puntos normales. Después aparece la recta de la regresión lineal (punteada), que el dato raro tiró hacia arriba.</figcaption>
</figure>

### Tu primer SVR

El último estudiante sacó `20` en vez de `11` (alguien anotó mal la nota):

```kafe
--8<-- "tests/DocsExamples/machine/svr.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La regresión lineal predijo `20.2` para 6 horas: el error al anotar la torció.
    2. `machine.svr(10.0, 1.0)` creó un SVR con `C = 10.0` (cuánto le importan los puntos fuera del tubo) y `epsilon = 1.0` (el ancho del tubo).
    3. SVR aprendió casi la regla real: pendiente `2.02` y punto de partida `1.94`.
    4. Para 6 horas predijo `14.04`, cerca del `13` que da la regla real (2 × 6 + 1).

### Las matemáticas con números pequeños { #svr-math }

Para la recta real (2 × horas + 1) y `epsilon = 1`, este programa calcula lo que cobra SVR por cada punto: el error **menos** el ancho del tubo, o cero si el punto queda dentro:

```kafe
--8<-- "tests/DocsExamples/machine/svr-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr-by-hand.expec"
```

Los cuatro puntos buenos cuestan `0.0`. El dato raro cuesta `8.0`, y ese es el total. Con errores al cuadrado, ese mismo punto costaría `81.0`. Por eso la regresión lineal se esfuerza tanto en acercarse a él, y SVR no.

??? info "Para curiosos 🤓"
    SVR lineal minimiza

    $$\frac{1}{2}\|w\|^2 + C \sum_i \max(0,\ |y_i - \hat{y}_i| - \varepsilon)$$

    En KAFE, con `kernel = "linear"`, se entrena con **descenso por subgradiente**: en cada vuelta mira qué puntos están fuera del tubo y mueve los pesos un pasito (0.01) para acercarse a ellos. Con `"rbf"` o `"poly"` entrena de otra forma (`_fit_kernel`) y la predicción es una suma de parecidos (*kernels*) con los puntos de apoyo.

### Rectas que se doblan: el kernel { #svr-kernel }

Una recta no puede seguir una curva. Con `kernel = "rbf"`, SVR compara cada dato nuevo con los de entrenamiento y puede **doblarse**. Aquí la temperatura sube y vuelve a bajar a lo largo de la semana:

```kafe
--8<-- "tests/DocsExamples/machine/svr-kernel.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr-kernel.expec"
```

La recta tiene nota `-0.03`: es peor que decir siempre el promedio. El kernel `rbf` tiene `0.97` y para el día 4 predice `6.5` (el dato real era 7).

### API { #svr }

| Llamada | Qué hace |
|---|---|
| `machine.svr(C, epsilon, kernel)` | Crea el modelo. `C` (`FLOAT`, por defecto `1.0`): cuánto cobran los puntos fuera del tubo. `epsilon` (`FLOAT`, por defecto `0.1`): ancho del tubo. `kernel` (`STR`, por defecto `"linear"`): `"linear"`, `"rbf"` o `"poly"`. |
| `model.fit` / `predict` / `score` | Igual que en LinearRegression. |
| `model.coef_` / `model.intercept_` | Pesos y punto de partida (los pesos solo existen con `"linear"`). |

??? warning "Error común: escribir `1` en vez de `1.0`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/svr-int.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/svr-int.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Los datos raros la afectan poco. | Hay que elegir `C`, `epsilon` y el kernel. |
| Con `"rbf"` puede seguir curvas. | Aprende paso a paso: es más lenta y su resultado es aproximado. |

## SVM: la calle más ancha { #svm-support-vector-machine-classifier }

### La idea en una frase

Una **SVM** (*Support Vector Machine*) separa **dos grupos** con una línea, y entre todas las líneas posibles elige la que deja la **calle más ancha** entre los grupos.

### Una comparación de la vida diaria

En un patio hay niños de dos equipos y quieres pintar una raya para separarlos. Hay muchas rayas posibles, pero la más segura es la que pasa **por el medio de la calle más ancha**: si llega un niño nuevo un poco corrido, igual queda del lado correcto. Los niños que tocan el borde de la calle son los **vectores de soporte**: ellos solos deciden dónde va la raya.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-svm-street.svg"
<figcaption>Círculos abajo a la izquierda y cuadrados arriba a la derecha. La raya gira hasta quedar entre los grupos, y la calle se ensancha hasta tocar a los puntos más cercanos de cada grupo (con anillo): los vectores de soporte.</figcaption>
</figure>

### Tu primera SVM

Frutas pequeñas (grupo `0`) y grandes (grupo `1`), cada una con dos medidas:

```kafe
--8<-- "tests/DocsExamples/machine/svm.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `model.classes_` muestra los dos grupos que encontró: `[0, 1]`.
    2. `predict` puso `[2, 2]` en el grupo `0` y `[7, 7]` en el grupo `1`.
    3. `score` da `1.0`: acertó con todas las frutas de entrenamiento.
    4. `predict_proba` dice qué tan lejos de la raya quedó `[2, 2]`: `0.83` para el grupo `0`. Es una seguridad aproximada, no una probabilidad exacta.

### Las matemáticas con números pequeños { #svm-math }

Con un solo dato por ejemplo, la "raya" es un punto. La SVM calcula $f(x) = w \cdot x + b$: si da **positivo** es un grupo y si da **negativo** es el otro. La calle es la zona donde $f(x)$ está entre −1 y 1.

Para los puntos 1, 2 (un grupo) y 6, 7 (el otro), la mejor raya es $w = -0.5$ y $b = 2$:

```kafe
--8<-- "tests/DocsExamples/machine/svm-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm-by-hand.expec"
```

- Para cada punto se muestra $f(x)$ y lo que se cobra (cero si el punto está fuera de la calle y del lado correcto). Los cuatro cuestan `0.0`.
- El ancho de la calle es $2 \div |w|$ = `4.0` y la raya está en $-b \div w$ = `4.0`, justo en el medio de 2 y 6.

KAFE llega a esa calle **paso a paso**, así que queda muy cerca pero no exacta:

```kafe
--8<-- "tests/DocsExamples/machine/svm-margin.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm-margin.expec"
```

La raya quedó en `4.66` y la calle mide `4.42`. Los puntos 3 y 5 quedaron en grupos distintos, como debía ser.

??? info "Para curiosos 🤓"
    La SVM lineal minimiza

    $$\frac{1}{2C}\|w\|^2 + \frac{1}{n}\sum_i \max(0,\ 1 - y_i\,(w \cdot x_i + b))$$

    con $y_i = \pm 1$. Hacer $\|w\|$ pequeño es lo mismo que hacer la calle ($2/\|w\|$) ancha. El segundo término es la **pérdida bisagra** (*hinge*): cobra solo a los puntos que están dentro de la calle o del lado equivocado.

### Cómo está construida por dentro { #svm-inside }

El modelo vive en `src/lib/KafeMACHINE/svm/SVM.py`. Con `kernel = "linear"`, `fit`:

1. Comprueba que haya **exactamente dos** grupos y los convierte en +1 y −1.
2. Empieza con pesos en 0 y da `max_iter` vueltas (1000 por defecto).
3. En cada vuelta mira qué puntos están dentro de la calle o mal clasificados, y mueve los pesos hacia ellos. El paso empieza en 1 y se va achicando.
4. Al final guarda como vectores de soporte los puntos que quedaron en el borde de la calle.

Con `"rbf"` o `"poly"` usa una versión simplificada del algoritmo SMO y puede separar grupos con fronteras curvas.

!!! warning "Usa números pequeños"
    El paso inicial es grande. Si tus datos tienen valores como 50 o 1000, la SVM puede saltar de un lado a otro y no aprender bien. Escálalos antes con [`StandardScaler`](preprocessing.md).

### API { #svm }

| Llamada | Qué hace |
|---|---|
| `machine.svm(C, kernel, max_iter)` | Crea el modelo. `C` (`FLOAT`, por defecto `1.0`): cuánto cobran los puntos mal puestos. `kernel` (`STR`, por defecto `"linear"`). `max_iter` (`INT`, por defecto `1000`). |
| `model.fit(X, y)` | Aprende. `y` es `List[INT]` con **dos** grupos. |
| `model.predict(X)` | Devuelve `List[INT]`: el grupo de cada fila. |
| `model.predict_proba(X)` | Devuelve una seguridad aproximada por grupo, en el orden de `classes_`. |
| `model.score(X, y)` | Devuelve la exactitud: qué fracción acertó. |
| `model.classes_`, `coef_`, `intercept_`, `support_vectors_` | Los grupos, los pesos, el punto de partida y los vectores de soporte. |

??? warning "Error común: más de dos grupos"
    Esta SVM solo separa dos grupos. Para tres o más, usa [`LogisticRegression`](classifiers.md) o [`KNeighborsClassifier`](classifiers.md).

    ```kafe
    --8<-- "tests/DocsExamples/machine/svm-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/svm-three-classes.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Elige la frontera más segura, no cualquiera. | Solo dos grupos. |
| Con `"rbf"` separa grupos con formas curvas. | Sensible a la escala de los datos. |
| Solo los puntos del borde importan. | `predict_proba` es aproximada. |

!!! tip "¿Qué aprendiste en esta página?"
    - **LinearRegression** busca la recta con menos error.
    - **Ridge** encoge los pesos, **Lasso** apaga los que sobran y **ElasticNet** mezcla las dos ideas.
    - **SVR** ignora los errores pequeños y resiste los datos raros.
    - **SVM** separa dos grupos con la calle más ancha.
