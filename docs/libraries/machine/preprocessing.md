# MACHINE: preprocesamiento y reducción

Antes de enseñarle a un modelo, casi siempre hay que **preparar los datos**: ponerlos en la misma escala, rellenar huecos, convertir palabras en números o quedarse solo con las columnas útiles. Las herramientas de esta página **no predicen nada**: transforman los datos para que los modelos aprendan mejor.

| Herramienta | Qué hace |
|---|---|
| [`StandardScaler`](#standardscaler) | Centra cada columna en 0 y la mide en "desviaciones". |
| [`MinMaxScaler`](#minmaxscaler) | Estira cada columna entre 0 y 1. |
| [`RobustScaler`](#robustscaler) | Escala sin dejarse engañar por datos raros. |
| [`SimpleImputer`](#simpleimputer) | Rellena los datos que faltan. |
| [`LabelEncoder`](#labelencoder) | Cambia etiquetas de texto por números. |
| [`OneHotEncoder`](#onehotencoder) | Abre una columna de 0 y 1 por cada categoría. |
| [`OrdinalEncoder`](#ordinalencoder) | Cambia las categorías de una columna por números. |
| [`PCA`](#pca) | Resume muchas columnas en pocas sin perder casi nada. |
| [`LinearDiscriminantAnalysis`](#lineardiscriminantanalysis) | Resume columnas para que los grupos queden separados. |
| [`PolynomialFeatures`](#polynomialfeatures) | Agrega columnas como $x^2$ para dibujar curvas. |
| [`VarianceThreshold`](#variancethreshold) | Quita las columnas que casi no cambian. |
| [`RecursiveFeatureElimination`](#recursivefeatureelimination) | Quita, una a una, las columnas que menos ayudan. |
| [`Tokenizer`](#tokenizer) | Convierte texto en listas de números. |

!!! tip "Antes de empezar: `fit`, `transform` y `fit_transform`"
    Todas las herramientas siguen la misma receta:

    - `fit(X)` **mira** los datos y aprende lo que necesita (promedios, mínimos, categorías…).
    - `transform(X)` **aplica** lo aprendido, a esos datos o a datos nuevos.
    - `fit_transform(X)` hace las dos cosas de una vez.
    - Muchas tienen `inverse_transform`, que deshace la transformación.

    Aprende (`fit`) **solo con los datos de entrenamiento** y aplica (`transform`) esos mismos números a los datos de prueba. Si no, el modelo "espía" el examen. [`Pipeline`](selection.md#pipeline) hace esto por ti.

## StandardScaler: centrar y medir en desviaciones { #standardscaler }

### La idea en una frase

**StandardScaler** resta a cada columna su **promedio** y la divide por su **desviación estándar**. Así cada columna queda centrada en 0, y un valor de 1 significa "una desviación por encima de lo normal".

### Una comparación de la vida diaria

Sacaste 15 en un examen de 20 y 70 en uno de 100. ¿Cuál fue mejor? Depende de **cómo le fue al resto**. Si el promedio del primero fue 10 y casi todos sacaron entre 7 y 13, tu 15 es excelente. Estandarizar es comparar contra el promedio del grupo.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-standard-scaler.svg"
<figcaption>Pesos de mascotas de 7, 9, 9 y 15 kg en la regla de arriba. Bajan a una regla medida en desviaciones: el promedio, 10, cae en 0, y los puntos caen en −1, −0.33, −0.33 y 1.67.</figcaption>
</figure>

### Tu primer StandardScaler

```kafe
--8<-- "tests/DocsExamples/machine/standard_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/standard_scaler.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `mean_` guarda el promedio de cada columna: `10.0` y `4.0`.
    2. `scale_` guarda la desviación: `3.0` y `2.24`.
    3. La primera mascota pesa 7: (7 − 10) ÷ 3 = `-1.0`.
    4. `inverse_transform` deshace todo: vuelve a `[15.0, 7.0]`.

### Las matemáticas con números pequeños { #standardscaler-math }

$$z = \frac{x - \text{promedio}}{\text{desviación}}$$

```kafe
--8<-- "tests/DocsExamples/machine/standard_scaler-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/standard_scaler-by-hand.expec"
```

La **varianza** (`9.0`) es el promedio de las distancias al promedio, elevadas al cuadrado. La **desviación** es su raíz: `3.0`.

| Llamada | Qué hace |
|---|---|
| `machine.standard_scaler()` | Crea la herramienta. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Aprender, aplicar y deshacer. |
| `mean_` / `scale_` | El promedio y la desviación de cada columna. |

??? warning "Error común: transformar sin aprender"
    ```kafe
    --8<-- "tests/DocsExamples/machine/standard_scaler-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/standard_scaler-not-fitted.error.stderr.expec"
    ```

!!! note "¿Cuándo usarlo?"
    Con los modelos que **miden distancias o dan pasos de gradiente**: [KNN](classifiers.md#knn), [SVM](linear.md#svm-support-vector-machine-classifier), [K-Means](clustering.md#kmeans), la regresión logística y PCA. A los árboles no les afecta la escala.

## MinMaxScaler: todo entre 0 y 1 { #minmaxscaler }

### La idea en una frase

**MinMaxScaler** estira cada columna para que su valor más pequeño sea **0** y el más grande sea **1**.

### Una comparación de la vida diaria

Es como convertir notas de distintos exámenes a porcentaje: el peor resultado del grupo queda en 0 % y el mejor en 100 %.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-minmax-scaler.svg"
<figcaption>Pesos de 7, 9, 9 y 15 kg bajan a una regla de 0 a 1: el más liviano cae en 0, el más pesado en 1 y los dos de 9 kg en 0.25.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/minmax_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/minmax_scaler.expec"
```

!!! tip "¿Qué pasó aquí?"
    La fórmula es $x' = \dfrac{x - \text{mín}}{\text{máx} - \text{mín}}$. Para 9 kg: (9 − 7) ÷ (15 − 7) = `0.25`. `scale_` es $1 \div (\text{máx} - \text{mín})$ = `0.125`. Un dato nuevo de 11 kg queda en `0.5`.

| Llamada | Qué hace |
|---|---|
| `machine.minmax_scaler()` | Crea la herramienta. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Aprender, aplicar y deshacer. |
| `data_min_` / `data_max_` / `scale_` | El mínimo, el máximo y la escala de cada columna. |

??? warning "Error común: cambiar la cantidad de columnas"
    ```kafe
    --8<-- "tests/DocsExamples/machine/minmax_scaler-columns.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/minmax_scaler-columns.error.stderr.expec"
    ```

## RobustScaler: a prueba de datos raros { #robustscaler }

### La idea en una frase

**RobustScaler** usa la **mediana** (el valor del medio) en vez del promedio, y el **rango intercuartílico** (el ancho de la mitad central de los datos) en vez de la desviación. Así, un dato rarísimo no arruina la escala de los demás.

### Una comparación de la vida diaria

En un barrio, nueve casas valen alrededor de 100 y una mansión vale 10 000. El promedio dice que una casa "típica" vale 1 090, y eso no describe a nadie. La mediana dice 100.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-robust-scaler.svg"
<figcaption>Monedas de 1, 2, 3 y 4, y un dato raro de 100. Con StandardScaler las cuatro monedas normales quedan aplastadas entre −0.54 y −0.46, y el raro en 2. Con RobustScaler quedan separadas en −1, −0.5, 0 y 0.5, y solo el raro sale disparado a 48.5.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/robust_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/robust_scaler.expec"
```

!!! tip "¿Qué pasó aquí?"
    La mediana de 1, 2, 3, 4, 100 es `3` (`center_`). El percentil 25 es 2 y el 75 es 4, así que el rango intercuartílico es `2` (`scale_`). La fórmula es $(x - \text{mediana}) \div \text{RIC}$: la moneda de 1 queda en (1 − 3) ÷ 2 = `-1.0`.

### Ajustes { #robustscaler-options }

```kafe
--8<-- "tests/DocsExamples/machine/robust_scaler-options.kf"
```

```text
--8<-- "tests/DocsExamples/machine/robust_scaler-options.expec"
```

- `machine.robust_scaler(1, 0)` solo **centra** (resta la mediana) y no escala.
- `machine.robust_scaler(1, 1, 0)` usa como rango del percentil 0 al 75: de 1 a 4, ancho `3.0`.

| Llamada | Qué hace |
|---|---|
| `machine.robust_scaler(with_centering, with_scaling, quantile_low, quantile_high)` | Todos son `INT` opcionales: `1`/`0` para centrar y escalar, y los percentiles del rango (por defecto `25` y `75`). |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Aprender, aplicar y deshacer. |
| `center_` / `scale_` | La mediana y el rango de cada columna. |

??? warning "Error común: percentiles con decimales"
    En KAFE los percentiles se escriben como enteros:

    ```kafe
    --8<-- "tests/DocsExamples/machine/robust_scaler-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/robust_scaler-float.error.stderr.expec"
    ```

## SimpleImputer: rellenar huecos { #simpleimputer }

### La idea en una frase

Cuando falta un dato (`math.nan`), **SimpleImputer** lo rellena con un valor típico de su columna: el promedio, la mediana, el valor más frecuente o un número fijo.

### Una comparación de la vida diaria

Si un termómetro falló un día, no tiras toda la semana: anotas para ese día la temperatura típica de la semana.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-simple-imputer.svg"
<figcaption>Una tabla de cuatro días con dos columnas y dos huecos marcados con "?". Debajo aparece el promedio de cada columna, 22 y 8, y los huecos se rellenan con esos promedios.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Con `"mean"`, el promedio de la primera columna sin el hueco es (20 + 22 + 24) ÷ 3 = `22`, y el de la segunda es (4 + 6 + 14) ÷ 3 = `8`.
    2. Con `"median"`, la segunda columna da `6`: la mediana no se deja arrastrar por el 14.

Para texto se usa `"most_frequent"`, el valor que más se repite:

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer-most-frequent.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer-most-frequent.expec"
```

Y para rellenar con un número fijo hay una función aparte:

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer_constant.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer_constant.expec"
```

| Llamada | Qué hace |
|---|---|
| `machine.simple_imputer(strategy)` | `strategy`: `"mean"`, `"median"` o `"most_frequent"`. |
| `machine.simple_imputer_constant(fill_value)` | Rellena siempre con `fill_value`. |
| `fit` / `transform` / `fit_transform` | Aprender y rellenar. |
| `statistics_` / `strategy` / `fill_value` | El valor de relleno de cada columna y los ajustes. |

??? warning "Error común: pedir `\"constant\"` a `simple_imputer`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/simple_imputer-constant.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/simple_imputer-constant.error.stderr.expec"
    ```

## LabelEncoder: palabras a números { #labelencoder }

### La idea en una frase

Los modelos solo entienden números. **LabelEncoder** ordena las etiquetas alfabéticamente y le da a cada una un número: 0, 1, 2…

### Una comparación de la vida diaria

Es la lista de asistencia de una clase: en vez de "Ana", "Beto", "Carla", la profesora dice "número 0, número 1, número 2".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-label-encoder.svg"
<figcaption>Cuatro palabras: pear, apple, pear, kiwi. Aparece un diccionario en orden alfabético (apple 0, kiwi 1, pear 2) y cada palabra se convierte en su número: 2, 0, 2, 1.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/label_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/label_encoder.expec"
```

| Llamada | Qué hace |
|---|---|
| `machine.label_encoder()` | Crea la herramienta. Trabaja con una **lista** de etiquetas (`List[STR]`). |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Aprender, codificar y decodificar. |
| `classes_` | Las etiquetas en orden: la posición es su número. |

??? warning "Error común: una etiqueta que no vio"
    ```kafe
    --8<-- "tests/DocsExamples/machine/label_encoder-unseen.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/label_encoder-unseen.error.stderr.expec"
    ```

!!! note "Úsalo para `y`, no para `X`"
    Si conviertes "rojo, verde, azul" en 0, 1, 2 dentro de `X`, el modelo creerá que azul es "el doble" que verde. Para columnas de datos usa [`OneHotEncoder`](#onehotencoder).

## OneHotEncoder: una columna por categoría { #onehotencoder }

### La idea en una frase

**OneHotEncoder** reemplaza una columna de categorías por **una columna por categoría**, con un `1` donde corresponde y `0` en las demás. Así ninguna categoría parece "más grande" que otra.

### Una comparación de la vida diaria

En un formulario, en vez de escribir tu mascota, marcas una casilla: ☑ gato ☐ perro ☐ pez.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-one-hot-encoder.svg"
<figcaption>Una columna "pet" con cat, dog, fish y cat. Aparecen tres columnas nuevas (pet_cat, pet_dog y pet_fish) y cada fila enciende un 1 en la columna de su mascota y 0 en las demás.</figcaption>
</figure>

Trabaja con tablas [PARDOS](../pardos.md) y le dices qué columnas convertir:

```kafe
--8<-- "tests/DocsExamples/machine/one_hot_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/one_hot_encoder.expec"
```

| Llamada | Qué hace |
|---|---|
| `machine.one_hot_encoder()` | Crea la herramienta. |
| `fit(df, columnas)` / `fit_transform(df, columnas)` | Aprende las categorías de esas columnas (y las convierte). |
| `transform(df)` / `inverse_transform(df)` | Convertir y deshacer. |
| `columns_` / `handle_unknown` | Las columnas convertidas y qué hacer con categorías nuevas (`"error"`). |

??? warning "Error común: una categoría que no vio"
    ```kafe
    --8<-- "tests/DocsExamples/machine/one_hot_encoder-unseen.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/one_hot_encoder-unseen.error.stderr.expec"
    ```

## OrdinalEncoder: categorías a números, en una tabla { #ordinalencoder }

### La idea en una frase

**OrdinalEncoder** hace lo mismo que LabelEncoder, pero sobre **columnas de una tabla**: cambia cada categoría por su posición en **orden alfabético**.

```kafe
--8<-- "tests/DocsExamples/machine/ordinal_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ordinal_encoder.expec"
```

!!! warning "Orden alfabético, no de tamaño"
    Las tallas quedaron `large = 0`, `medium = 1`, `small = 2`: en orden alfabético, **no** de chica a grande. Si el orden importa para tu modelo, revisa que el alfabético tenga sentido o usa `OneHotEncoder`.

| Llamada | Qué hace |
|---|---|
| `machine.ordinal_encoder()` | Crea la herramienta. |
| `fit(df, columnas)` / `fit_transform(df, columnas)` / `transform` / `inverse_transform` | Igual que `OneHotEncoder`. |
| `columns_` | Las columnas convertidas. |

??? warning "Error común: una columna que no existe"
    ```kafe
    --8<-- "tests/DocsExamples/machine/ordinal_encoder-column.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ordinal_encoder-column.error.stderr.expec"
    ```

## PCA: la mejor sombra { #pca }

### La idea en una frase

**PCA** (*Principal Component Analysis*, análisis de componentes principales) busca la **dirección en la que los datos están más extendidos** y los proyecta sobre ella. Así resume muchas columnas en pocas, perdiendo lo menos posible.

### Una comparación de la vida diaria

Si iluminas un lápiz con una linterna, su sombra puede ser un punto (si lo alumbras de punta) o una raya larga (si lo alumbras de lado). PCA busca el ángulo con la **sombra más larga**: la que más información conserva.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-pca-shadow.svg"
<figcaption>Cuatro puntos en una cuadrícula. Una línea gira hasta apuntar en diagonal, donde los puntos están más extendidos. Cada punto deja caer su sombra sobre la línea, y las sombras se vuelven una sola fila de números: −2.12, 0, 0 y 2.12.</figcaption>
</figure>

### Tu primer PCA

```kafe
--8<-- "tests/DocsExamples/machine/pca.kf"
```

```text
--8<-- "tests/DocsExamples/machine/pca.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.pca(1)` resume **2 columnas en 1**.
    2. `components_` es la dirección: `[0.707, 0.707]`, la diagonal.
    3. `explained_variance_` (`3.0`) dice cuánta dispersión hay en esa dirección.
    4. Las sombras son `-2.12`, `0.0`, `0.0` y `2.12`.
    5. `inverse_transform` vuelve a 2 columnas, pero solo recupera lo que había en la sombra: los puntos (2, 3) y (3, 2) quedan los dos en (2.5, 2.5). Esa es la información que se pierde.

### Las matemáticas con números pequeños { #pca-math }

PCA mira la **matriz de covarianza**: cuánto varía cada columna y cuánto varían juntas.

```kafe
--8<-- "tests/DocsExamples/machine/pca-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/pca-by-hand.expec"
```

1. Las varianzas de las dos columnas son `1.667` y su covarianza es `1.333`: crecen juntas.
2. Para una matriz de 2 × 2 hay fórmula directa de sus **valores propios**: `3.0` (la dirección diagonal) y `0.333` (la perpendicular). El grande es el que conserva PCA.
3. Las sombras son el producto de cada punto (menos el promedio) por la dirección $(\sqrt{0.5}, \sqrt{0.5})$.

??? info "Para curiosos 🤓"
    Con $X$ centrada, la covarianza es $C = \frac{1}{n-1}X^T X$. Los componentes principales son los **vectores propios** de $C$ ordenados por su **valor propio** $\lambda$; cada $\lambda$ es la varianza en esa dirección. Conservar $k$ componentes guarda la fracción $\sum_{i \le k}\lambda_i \big/ \sum_i \lambda_i$ de la varianza total: aquí $3 \div 3.333 = 90\%$.

| Llamada | Qué hace |
|---|---|
| `machine.pca(n_components)` | Crea la herramienta; `n_components` (`INT`) es cuántas columnas quedan. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Aprender, proyectar y volver (aproximadamente). |
| `components_` / `explained_variance_` / `mean_` | Las direcciones, su varianza y el promedio. |
| `pca.round(decimales)` | Redondea los números guardados para mostrarlos. |

??? warning "Error común: pedir más componentes que columnas"
    ```kafe
    --8<-- "tests/DocsExamples/machine/pca-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/pca-too-many.error.stderr.expec"
    ```

## LinearDiscriminantAnalysis: separar al resumir { #lineardiscriminantanalysis }

### La idea en una frase

**LDA** también resume columnas proyectando, pero **conoce los grupos** y elige la dirección en la que los grupos quedan **más separados** entre sí y más **apretados** por dentro. Además puede clasificar.

### Una comparación de la vida diaria

Para fotografiar dos equipos de fútbol, PCA busca el ángulo donde se ve a más gente; LDA busca el ángulo donde **no se mezclan las camisetas**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-lda-direction.svg"
<figcaption>Círculos abajo a la izquierda y cuadrados arriba a la derecha. Una línea gira hacia la dirección donde los dos grupos quedan más lejos entre sí, comparado con lo dispersos que están por dentro. Sus sombras sobre esa línea forman una fila donde círculos y cuadrados no se mezclan.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/linear_discriminant_analysis.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_discriminant_analysis.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Con 2 grupos, LDA deja **1** dirección: `n_components` es `1`.
    2. `prior_` y `means_` son la proporción y el centro de cada grupo.
    3. `predict` clasifica `[3, 3]` en el grupo 0 y `[7, 6]` en el 1. La exactitud es `1.0`.
    4. `transform` da la sombra de cada mascota: los gatos quedan entre 1.7 y 3.93 y los perros entre 7.47 y 10.09, sin mezclarse.

??? info "Para curiosos 🤓"
    LDA maximiza el **cociente de Fisher**: la distancia entre los centros de los grupos sobre la dispersión dentro de cada grupo. Con dos grupos, la mejor dirección es $w \propto S_W^{-1}(\mu_1 - \mu_0)$, donde $S_W$ suma la dispersión de cada grupo. Con $k$ grupos se pueden obtener como mucho $k - 1$ direcciones.

| Llamada | Qué hace |
|---|---|
| `machine.linear_discriminant_analysis()` | Crea la herramienta. |
| `fit(X, y)` | Aprende, **con** las respuestas. |
| `transform` / `predict` / `score` | Proyectar, clasificar y la exactitud. |
| `classes_`, `prior_`, `means_`, `n_components` | Los grupos, su proporción, sus centros y cuántas direcciones guarda. |

??? warning "Error común: un solo grupo"
    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_discriminant_analysis-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_discriminant_analysis-one-class.error.stderr.expec"
    ```

## PolynomialFeatures: curvas con un modelo de rectas { #polynomialfeatures }

### La idea en una frase

**PolynomialFeatures** agrega columnas nuevas hechas con las que ya tienes: cuadrados ($x^2$), productos ($x \cdot y$)… Con eso, un modelo **lineal** puede dibujar **curvas**.

### Una comparación de la vida diaria

El área de un cuadrado no crece en línea recta con su lado: lado 2 da área 4, lado 3 da área 9. Una regla recta no puede seguir esos puntos. Pero si le das al modelo la columna "lado²", la relación vuelve a ser recta: área = 1 × lado².

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-polynomial-features.svg"
<figcaption>Cuadrados de lado 1 a 4 con áreas 1, 4, 9 y 16 forman una curva. Una recta (punteada) no puede seguirlos. Al agregar la columna x², el mismo modelo lineal dibuja una curva que pasa por todos los puntos.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/polynomial_features-curve.kf"
```

```text
--8<-- "tests/DocsExamples/machine/polynomial_features-curve.expec"
```

La regresión lineal predijo `25.0` para un lado de 5: exactamente 5². Con dos columnas y grado 2 aparecen todas las combinaciones:

```kafe
--8<-- "tests/DocsExamples/machine/polynomial_features.kf"
```

```text
--8<-- "tests/DocsExamples/machine/polynomial_features.expec"
```

Para `[2, 3]` salen 6 columnas: `1` (el sesgo), `3`, `9` (3²), `2`, `6` (2 × 3) y `4` (2²).

| Llamada | Qué hace |
|---|---|
| `machine.polynomial_features(degree, include_bias)` | `degree` (`INT`, por defecto `2`); `include_bias` (`BOOL`, por defecto `True`) agrega la columna de unos. |
| `fit` / `transform` / `fit_transform` | Aprender y agregar columnas. |
| `n_features_in_` / `n_features_out_` | Cuántas columnas entran y cuántas salen. |

??? warning "Error común: intentar deshacerlo"
    ```kafe
    --8<-- "tests/DocsExamples/machine/polynomial_features-inverse.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/polynomial_features-inverse.error.stderr.expec"
    ```

!!! note "Cuidado con el grado"
    Las columnas crecen muy rápido: con 10 columnas y grado 3 salen 286. Con un grado alto, el modelo puede memorizar los datos.

## VarianceThreshold: fuera lo que no cambia { #variancethreshold }

### La idea en una frase

Una columna que **siempre vale lo mismo** no ayuda a distinguir nada. **VarianceThreshold** quita las columnas cuya varianza no supera un umbral.

### Una comparación de la vida diaria

Si en una encuesta todos respondieron "sí" a una pregunta, esa pregunta no te sirve para separar a nadie.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-variance-threshold.svg"
<figcaption>Tres barras muestran la varianza de tres columnas: 0, 0.125 y 5. Un umbral en 0 tacha la primera, que nunca cambia. Después el umbral sube a 0.5 y tacha también la segunda; solo queda la tercera.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/variance_threshold.kf"
```

```text
--8<-- "tests/DocsExamples/machine/variance_threshold.expec"
```

!!! tip "¿Qué pasó aquí?"
    Las varianzas son `0.0`, `0.125` y `5.0`. Con el umbral por defecto (`0.0`) se va la primera columna y quedan las posiciones `[1, 2]`. Con `0.5` se va también la segunda y solo queda `[2]`.

| Llamada | Qué hace |
|---|---|
| `machine.variance_threshold(threshold)` | `threshold` (`FLOAT`, por defecto `0.0`). |
| `fit` / `transform` / `fit_transform` | Medir y quitar columnas. |
| `variances_` / `selected_indices_` | La varianza de cada columna y las que quedan. |

??? warning "Error común: umbral negativo"
    ```kafe
    --8<-- "tests/DocsExamples/machine/variance_threshold-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/variance_threshold-negative.error.stderr.expec"
    ```

## RecursiveFeatureElimination: quitar lo que menos ayuda { #recursivefeatureelimination }

### La idea en una frase

**RFE** entrena una regresión lineal, mira qué columna tiene el **peso más pequeño**, la quita y vuelve a entrenar, hasta que quedan las columnas que pediste.

### Una comparación de la vida diaria

Un entrenador quiere un equipo de 2. Ve jugar a los 3, saca al que menos aportó, y si todavía sobran, los vuelve a ver jugar.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-rfe.svg"
<figcaption>Tres barras muestran cuánto usa un modelo lineal cada columna: 2.00, 0.00 y 3.00. Se tacha la de peso más pequeño, x1, y el ranking muestra con 1 las columnas que quedan y con 3 la que salió.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/recursive_feature_elimination.kf"
```

```text
--8<-- "tests/DocsExamples/machine/recursive_feature_elimination.expec"
```

!!! tip "¿Qué pasó aquí?"
    El precio de estas casas es exactamente 2 × columna 0 + 3 × columna 2: la columna 1 es puro ruido. RFE la quitó: `support_` es `[True, False, True]` y `ranking_` es `[1, 3, 1]` (1 = se queda).

| Llamada | Qué hace |
|---|---|
| `machine.recursive_feature_elimination(n_features)` | `n_features` (`INT`, por defecto `1`): cuántas columnas quedan. |
| `fit(X, y)` / `transform(X)` | Elegir columnas (con las respuestas) y quedarse con ellas. |
| `support_`, `ranking_`, `selected_indices_` | Qué columnas quedan, su orden de salida y sus posiciones. |

??? warning "Error común: pedir más columnas de las que hay"
    ```kafe
    --8<-- "tests/DocsExamples/machine/recursive_feature_elimination-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/recursive_feature_elimination-too-many.error.stderr.expec"
    ```

!!! warning "Los pesos dependen de la escala"
    RFE compara pesos. Si una columna está en metros y otra en milímetros, sus pesos no son comparables: escala antes con [`StandardScaler`](#standardscaler).

## Tokenizer: texto a números { #tokenizer }

### La idea en una frase

**Tokenizer** pasa el texto a minúsculas, lo **parte en palabras** y le da a cada palabra un número, según qué tan frecuente es. Así una frase se vuelve una lista de números que un modelo (por ejemplo, una red de [GESHA](../gesha.md)) puede leer.

### Una comparación de la vida diaria

Es un diccionario numerado: la palabra más usada recibe el número más chico. En vez de enviar "the dog eats the bone", envías "2 5 3 2 6".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tokenizer.svg"
<figcaption>La frase "the dog eats the bone" se parte en cinco palabras, y cada una se convierte en su número del vocabulario: 2, 5, 3, 2, 6. El índice 0 queda reservado para el relleno y el 1 para las palabras desconocidas.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/tokenizer.kf"
```

```text
--8<-- "tests/DocsExamples/machine/tokenizer.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.tokenizer(0, "<?>")`: sin límite de palabras (`0`) y con `"<?>"` para las desconocidas, que ocupa el número `1`.
    2. "the" aparece 3 veces: recibe el `2`. "eats" aparece 2: el `3`. Después vienen cat `4`, dog `5` y bone `6`.
    3. "bird" no estaba en el vocabulario: se convierte en `1`.
    4. `vocabulary_size` es `7`: los números del 0 al 6.
    5. Con `machine.tokenizer(2)` solo se guardan las **2 palabras más frecuentes**, sin palabra desconocida: "the bird eats" queda `[1, 2]` y "bird" desaparece.

| Llamada | Qué hace |
|---|---|
| `machine.tokenizer(num_words, oov_token)` | `num_words` (`INT`, `0` = sin límite); `oov_token` (`STR`, por defecto vacío): la marca para palabras desconocidas. |
| `fit(textos)` / `transform(textos)` / `fit_transform(textos)` | Armar el vocabulario y convertir. Reciben `List[STR]`. |
| `vocabulary_size`, `num_words`, `oov_token` | El tamaño del vocabulario (contando el 0) y los ajustes. |

??? warning "Error común: convertir sin vocabulario"
    ```kafe
    --8<-- "tests/DocsExamples/machine/tokenizer-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/tokenizer-not-fitted.error.stderr.expec"
    ```

!!! tip "¿Qué aprendiste en esta página?"
    - Los **escaladores** ponen las columnas en una escala parecida: StandardScaler (promedio y desviación), MinMaxScaler (0 a 1) y RobustScaler (mediana, a prueba de datos raros).
    - **SimpleImputer** rellena huecos; los **encoders** convierten categorías en números.
    - **PCA** y **LDA** resumen columnas proyectando; **PolynomialFeatures** agrega columnas para dibujar curvas.
    - **VarianceThreshold** y **RFE** quitan columnas que no ayudan; **Tokenizer** convierte texto en números.
    - Aprende con `fit` solo en el entrenamiento y aplica con `transform` en todo lo demás.
