# MACHINE: clustering y ensambles

Esta página tiene dos familias de modelos:

- **Clustering** (agrupar): le das datos **sin respuestas** y el modelo descubre solo qué grupos hay. Es aprendizaje **no supervisado**: nadie le dice cuál es el grupo correcto.
- **Ensambles por refuerzo** (*boosting*): juntan muchos modelos pequeños, y cada uno **corrige los errores** del anterior.

| Modelo | Para qué sirve | Cómo piensa |
|---|---|---|
| [`KMeans`](#kmeans) | Partir los datos en `k` grupos. | Centros que se mueven al medio de su grupo. |
| [`DBSCAN`](#dbscan) | Encontrar zonas llenas y marcar los datos sueltos. | "¿Tienes suficientes vecinos cerca?" |
| [`AgglomerativeClustering`](#agglomerativeclustering) | Agrupar uniendo primero lo más cercano. | Un árbol familiar de grupos. |
| [`GaussianMixture`](#gaussianmixture) | Agrupar con campanas y dar probabilidades. | Campanas que se ajustan a los datos. |
| [`AdaBoostClassifier`](#adaboostclassifier) | Clasificar en dos grupos con muchos árboles mínimos. | Insistir en lo que se falló. |
| [`GradientBoostingRegressor`](#gradientboostingregressor) | Predecir números con árboles que corrigen. | Corregir lo que falta, de a poco. |
| [`GradientBoostingClassifier`](#gradientboostingclassifier) | Lo mismo para dos grupos. | Empujar las probabilidades. |

!!! tip "Antes de empezar"
    Los modelos de clustering se entrenan con `fit(X)`, **sin** `y`, porque no hay respuestas. `fit_predict(X)` entrena y devuelve el grupo de cada fila en un solo paso. Los **números de grupo no significan nada** por sí mismos: el grupo `0` no es "mejor" ni "primero", es solo un nombre.

## KMeans: centros que se mueven { #kmeans }

### La idea en una frase

**K-Means** pone `k` **centros** sobre los datos y repite dos pasos hasta que nada cambia: cada punto se une a su centro más cercano, y cada centro se mueve al **medio** de sus puntos.

### Una comparación de la vida diaria

Dos heladeros llegan a una playa y se ponen en cualquier lugar. Cada bañista va al heladero más cercano. Al ver de dónde vienen sus clientes, cada heladero se mueve al centro de su grupo. Los bañistas vuelven a elegir al más cercano, los heladeros se vuelven a mover… hasta que ya nadie cambia de heladero.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-kmeans-centers.svg"
<figcaption>Seis frutas en dos montoncitos. Dos centros (las cruces) empiezan en lugares cualquiera. Cada fruta toma el color de su centro más cercano y cada centro se mueve al medio de sus frutas. En 3 rondas los centros quedan en el medio de cada montoncito y dejan de moverse.</figcaption>
</figure>

### Tu primer K-Means

Seis frutas medidas con dos números. No le decimos qué fruta es cada una:

```kafe
--8<-- "tests/DocsExamples/machine/kmeans.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.kmeans(2, 100, 42)` pide **2** grupos, como mucho **100** rondas y la **semilla** `42` para que el sorteo inicial sea siempre igual.
    2. `fit(fruits)` encontró los grupos: las tres primeras frutas en el grupo `1` y las tres últimas en el `0`.
    3. Los centros quedaron en (8.33, 8.33) y (1.33, 1.33): el medio de cada montoncito.
    4. `inertia_` (`2.67`) mide qué tan apretados quedaron los grupos: es la suma de las distancias al cuadrado de cada punto a su centro.
    5. `predict` usa los centros para datos nuevos: `[2, 2]` va al grupo `1` y `[7, 9]` al `0`.

### Las matemáticas con números pequeños { #kmeans-math }

Este programa hace **una ronda** a mano, con los centros empezando en (1, 1) y (8, 8):

```kafe
--8<-- "tests/DocsExamples/machine/kmeans-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans-by-hand.expec"
```

1. **Asignar:** cada fruta va al centro más cercano. Las tres primeras al centro 0 y las tres últimas al 1.
2. **Mover:** cada centro pasa al promedio de sus frutas: (1 + 1 + 2) ÷ 3 = **1.33**.
3. **Medir:** la inercia es `2.67`.

¿Cuántos grupos pedir? La inercia **siempre baja** si pides más grupos (con un grupo por punto sería 0), así que hay que buscar dónde deja de bajar mucho:

```kafe
--8<-- "tests/DocsExamples/machine/kmeans-score.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans-score.expec"
```

Con 1 grupo la inercia es `149.67`; con 2, `2.67`. Ese salto enorme dice que los datos tienen **2 grupos**. `score` devuelve la inercia con signo negativo (`-2.67`), para que "más alto" signifique "mejor". Otra forma de elegir es [`silhouette_score`](metrics.md#silhouette_score).

??? info "Para curiosos 🤓"
    K-Means minimiza la inercia $J = \sum_i \lVert x_i - \mu_{c(i)} \rVert^2$. Cada paso (asignar o mover) nunca la hace subir, así que el algoritmo siempre termina. Pero puede quedarse en un **mínimo local**: una solución buena pero no la mejor, según dónde empezaron los centros. Por eso KAFE usa **K-Means++** para elegir los centros iniciales: el primero al azar y cada siguiente con más probabilidad cuanto **más lejos** esté de los que ya hay.

### Cómo está construido por dentro { #kmeans-inside }

El modelo vive en `src/lib/KafeMACHINE/clustering/KMeans.py`. `fit`:

1. Elige los centros iniciales con K-Means++, usando la semilla.
2. Repite hasta `max_iter` veces: asigna cada punto a su centro más cercano y mueve cada centro al promedio de sus puntos.
3. Se detiene antes si los centros ya no se mueven.
4. Guarda `labels_`, `cluster_centers_` e `inertia_`.

### API { #kmeans-api }

| Llamada | Qué hace |
|---|---|
| `machine.kmeans(n_clusters, max_iter, random_state)` | Crea el modelo. `n_clusters` (`INT`, por defecto `3`), `max_iter` (`100`), `random_state` (la semilla; usa un número fijo como `42` para obtener siempre el mismo resultado). |
| `model.fit(X)` / `model.fit_predict(X)` | Agrupa; el segundo también devuelve los grupos. |
| `model.predict(X)` | Grupo del centro más cercano para datos nuevos. |
| `model.score(X)` | La inercia con signo negativo: más alto es mejor. |
| `model.labels_` o `model.labels()` | El grupo de cada fila. |
| `model.cluster_centers_` | Los centros. |
| `model.inertia_` o `model.inertia()` | La inercia. |

??? warning "Error común: más grupos que datos"
    ```kafe
    --8<-- "tests/DocsExamples/machine/kmeans-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/kmeans-too-many.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Simple y rápido. | Hay que decirle cuántos grupos buscar. |
| Los centros resumen cada grupo. | Solo encuentra grupos redondos y de tamaño parecido. |
| | Un punto muy lejano arrastra a su centro. |

## DBSCAN: zonas con mucha gente { #dbscan }

### La idea en una frase

**DBSCAN** junta los puntos que están en **zonas llenas** (con muchos vecinos cerca) y marca como **ruido** a los que quedan solos. No hay que decirle cuántos grupos buscar.

### Una comparación de la vida diaria

Miras una ciudad de noche desde un avión. Donde hay muchas luces juntas ves **barrios**; una casa sola en el campo no forma un barrio, es una luz suelta. DBSCAN mira cuántas luces hay a menos de cierta distancia de cada una.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-dbscan-density.svg"
<figcaption>Nueve casas. Alrededor de cada una aparece un círculo de radio ε. Las que tienen al menos 3 casas dentro de su círculo (contándose a sí mismas) son puntos núcleo (en color). Las zonas llenas forman los grupos 1 y 2, y la casa sola del medio queda como ruido: −1.</figcaption>
</figure>

### Tu primer DBSCAN

```kafe
--8<-- "tests/DocsExamples/machine/dbscan.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.dbscan(1.0, 3)`: el radio `eps` es `1.0` y una casa es **núcleo** si tiene al menos `3` casas en su círculo, contándose a sí misma.
    2. Encontró **2** grupos. En KAFE los grupos de DBSCAN se numeran desde `1`.
    3. La casa 5, en (6, 6), quedó sola: `-1` significa **ruido**.
    4. `core_sample_indices()` lista los núcleos: las casas 0, 1, 2, 3 y 6. La casa 4 está en el grupo 1 sin ser núcleo: es un **borde**, porque está cerca de un núcleo.

### Las matemáticas con números pequeños { #dbscan-math }

Este programa cuenta, para cada casa, cuántas casas hay a distancia `1.0` o menos:

```kafe
--8<-- "tests/DocsExamples/machine/dbscan-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan-by-hand.expec"
```

Las que llegan a 3 son núcleo. DBSCAN une los núcleos que están cerca entre sí y les suma sus bordes. Lo que no alcanza a ningún núcleo es ruido.

### El radio lo cambia todo { #dbscan-eps }

```kafe
--8<-- "tests/DocsExamples/machine/dbscan-eps.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan-eps.expec"
```

Con `eps = 0.5` ninguna casa tiene vecinos: **todo es ruido** y hay 0 grupos. Con `eps = 5.0` todas se tocan: **un solo grupo**. El radio correcto depende de la escala de tus datos.

??? info "Para curiosos 🤓"
    DBSCAN significa *Density-Based Spatial Clustering of Applications with Noise*. Un punto es **núcleo** si $|N_\varepsilon(p)| \ge$ `min_samples`, donde $N_\varepsilon(p)$ son los puntos a distancia $\le \varepsilon$ (incluido él). Cada grupo crece desde un núcleo agregando todo lo que se alcanza saltando de núcleo en núcleo. Con el método simple de KAFE cuesta del orden de $n^2$ distancias.

### Cómo está construido por dentro { #dbscan-inside }

El modelo vive en `src/lib/KafeMACHINE/clustering/DBSCAN.py`. `fit` recorre los puntos. Cuando encuentra un núcleo que no tiene grupo, abre un grupo nuevo y lo **expande** con una lista de pendientes: agrega a sus vecinos y, si un vecino también es núcleo, agrega también a los vecinos de ese vecino.

### API { #dbscan-api }

| Llamada | Qué hace |
|---|---|
| `machine.dbscan(eps, min_samples)` | Crea el modelo. `eps` (`FLOAT`, por defecto `0.5`) es el radio; `min_samples` (`INT`, por defecto `5`) es cuántos puntos necesita un núcleo. |
| `model.fit(X)` / `model.fit_predict(X)` | Agrupa. |
| `model.labels_` o `model.labels()` | El grupo de cada fila; `-1` es ruido. |
| `model.n_clusters_` o `model.n_clusters()` | Cuántos grupos encontró, sin contar el ruido. |
| `model.core_sample_indices()` | Las posiciones de los puntos núcleo. |

??? warning "Error común: pedir `predict`"
    DBSCAN no tiene centros ni campanas: no sabe ubicar datos nuevos. Para eso vuelve a llamar a `fit_predict` con todos los datos.

    ```kafe
    --8<-- "tests/DocsExamples/machine/dbscan-predict.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/dbscan-predict.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| No hay que decirle cuántos grupos hay. | Elegir `eps` puede ser difícil. |
| Encuentra grupos de cualquier forma. | Si hay zonas con densidades muy distintas, un solo `eps` no sirve para todas. |
| Señala los datos raros (ruido). | No predice datos nuevos. |

## AgglomerativeClustering: unir lo más cercano { #agglomerativeclustering }

### La idea en una frase

**Agglomerative** empieza con **cada punto como su propio grupo** y, una y otra vez, **une los dos grupos más cercanos**, hasta que quedan los que pediste.

### Una comparación de la vida diaria

En una fiesta, primero se juntan las parejas de mejores amigos. Después esas parejas se juntan con otras parejas cercanas, y así se forman grupos cada vez más grandes. Si anotas cuándo se unió cada grupo, obtienes un **árbol familiar** (un *dendrograma*).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-agglomerative-merge.svg"
<figcaption>Cinco casas en una calle, en 1, 2, 6, 7 y 15. Primero se unen 1 y 2 (distancia 1), luego 6 y 7 (distancia 1), y después las dos parejas (distancia 4). Al cortar el árbol por encima de ese nivel quedan dos grupos: las cuatro casas juntas y la casa del 15 sola.</figcaption>
</figure>

### Tu primer Agglomerative

Mascotas por peso y altura:

```kafe
--8<-- "tests/DocsExamples/machine/agglomerative_clustering.kf"
```

```text
--8<-- "tests/DocsExamples/machine/agglomerative_clustering.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.agglomerative_clustering(2, "ward")` pide **2** grupos, uniendo con el criterio `"ward"`.
    2. Las dos mascotas pequeñas quedaron en el grupo `0` y las tres grandes en el `1`.
    3. `children_` es la historia de uniones, en orden: primero se unieron las mascotas 0 y 1, después la 2 y la 4, y así sigue.

### La calle del dibujo { #agglomerativeclustering-street }

```kafe
--8<-- "tests/DocsExamples/machine/agglomerative_clustering-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/agglomerative_clustering-by-hand.expec"
```

`distances_` dice a qué distancia ocurrió cada unión: `1.0`, `1.0` y `4.0`, igual que en el dibujo. La casa del 15 quedó sola porque estaba a 8 de su vecina más cercana.

### ¿Qué es "más cercano" entre dos grupos? { #agglomerativeclustering-linkage }

Entre dos puntos es fácil, pero entre dos **grupos** hay varias formas de medir. Eso es el `linkage`:

| `linkage` | Distancia entre dos grupos |
|---|---|
| `"single"` | La de sus dos puntos **más cercanos**. Forma cadenas largas. |
| `"complete"` | La de sus dos puntos **más lejanos**. Forma grupos compactos. |
| `"average"` | El **promedio** de todas las distancias entre sus puntos. |
| `"ward"` | Une los dos grupos que **menos aumentan** la dispersión interna. Es el valor por defecto. |

??? info "Para curiosos 🤓"
    Con `"ward"`, el costo de unir los grupos $A$ y $B$ es el aumento de la suma de distancias al cuadrado a su centro: $\Delta = \frac{|A||B|}{|A|+|B|}\lVert \mu_A - \mu_B \rVert^2$. La implementación de KAFE (`src/lib/KafeMACHINE/clustering/AgglomerativeClustering.py`) recalcula en cada paso la distancia entre todos los pares de grupos, así que cuesta del orden de $n^3$: va bien con pocos datos.

### API { #agglomerative_clustering }

| Llamada | Qué hace |
|---|---|
| `machine.agglomerative_clustering(n_clusters, linkage)` | Crea el modelo. `n_clusters` (`INT`, por defecto `2`); `linkage` (`STR`, por defecto `"ward"`). |
| `model.fit(X)` / `model.fit_predict(X)` | Agrupa. |
| `model.labels_` | El grupo de cada fila. |
| `model.children_` / `model.distances_` | La historia de uniones y a qué distancia ocurrió cada una. |
| `model.n_clusters_` | Cuántos grupos quedaron. |

??? warning "Error común: un `linkage` que no existe"
    ```kafe
    --8<-- "tests/DocsExamples/machine/agglomerative_clustering-linkage.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/agglomerative_clustering-linkage.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Guarda toda la historia de uniones. | Lento con muchos datos. |
| Puedes cambiar el criterio de unión. | Una unión ya hecha no se deshace. |

## GaussianMixture: grupos con forma de campana { #gaussianmixture }

### La idea en una frase

Una **mezcla de gaussianas** supone que los datos vienen de varias **campanas** mezcladas, y busca el centro, el ancho y el tamaño de cada una. Para cada dato da una **probabilidad** de pertenecer a cada campana, no una respuesta de todo o nada.

### Una comparación de la vida diaria

En un parque hay perros pequeños y perros grandes. Uno mediano podría ser de cualquiera de los dos tipos. En vez de obligarlo a elegir, dices: "79 % pequeño, 21 % grande". Eso es un agrupamiento **suave**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gaussian-mixture.svg"
<figcaption>Pesos 1, 2 y 3 y pesos 10, 11 y 12 sobre una línea. Sobre cada montoncito crece una campana. La raya en 6.4 muestra una barra repartida: 0.79 para la primera campana y 0.21 para la segunda. El modelo no está del todo seguro.</figcaption>
</figure>

### Tu primera mezcla

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.gaussian_mixture(2, 100, 0.001, 1)` pide **2** campanas, como mucho **100** rondas, que pare cuando mejore menos de **0.001**, y la semilla **1**.
    2. Encontró las campanas con centro (`means_`) en `2.0` y `11.0`, ancho (`covariances_`, la varianza) `0.67` y peso (`weights_`) `0.5` cada una.
    3. `predict` dice que 2.5 es de la campana `0` y 9 de la `1`.
    4. Para 6.4, casi en el medio, `predict_proba` reparte: `0.79` y `0.21`.

### Las matemáticas con números pequeños { #gaussianmixture-math }

Cada campana se describe con un **promedio** y una **varianza**. Para los pesos 1, 2 y 3:

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture-by-hand.expec"
```

Promedio `2.0` y varianza `0.67`: los mismos números que encontró el modelo para su primera campana.

### ¿Cuántas campanas? { #gaussianmixture-choose }

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture-choose.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture-choose.expec"
```

!!! warning "Aquí `score` es un error: más bajo es mejor"
    En `GaussianMixture`, `score` devuelve el **error** del modelo (la *log-verosimilitud negativa*): con 1 campana es `17.64` y con 2, `11.46`. `aic` y `bic` son ese mismo error más una **multa por usar más campanas**. Con 2 campanas los dos bajan (de `39.27` a `32.91` y de `38.85` a `31.87`), así que 2 campanas es mejor aunque el modelo sea más complicado. `converged_` dice que terminó antes del límite, en `2` rondas.

??? info "Para curiosos 🤓"
    El modelo es $p(x) = \sum_k \pi_k\,\mathcal{N}(x \mid \mu_k, \sigma_k^2)$. Se entrena con el algoritmo **EM** (*Expectation–Maximization*), que repite dos pasos:

    - **E:** con las campanas actuales, calcula para cada dato la probabilidad de cada campana (la *responsabilidad*).
    - **M:** recalcula cada campana con esos datos, pesados por su responsabilidad.

    Se detiene cuando la log-verosimilitud mejora menos que `tol`. $\text{AIC} = 2p - 2\log L$ y $\text{BIC} = p\log n - 2\log L$, con $p$ = número de parámetros. El código está en `src/lib/KafeMACHINE/clustering/GaussianMixture.py`.

!!! note "Es como K-Means, pero suave"
    K-Means asigna cada punto a **un** centro. GaussianMixture asigna cada punto a **todas** las campanas, con distinta probabilidad, y además aprende el ancho de cada grupo.

### API { #gaussian_mixture }

| Llamada | Qué hace |
|---|---|
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | Crea el modelo. Por defecto: `3` campanas, `100` rondas, `tol = 0.001`, semilla `0`. |
| `model.fit(X)` / `model.fit_predict(X)` / `model.predict(X)` | Aprender y ubicar datos. |
| `model.predict_proba(X)` | La probabilidad de cada campana, por fila. |
| `model.score(X)` / `model.aic(X)` / `model.bic(X)` | Error, y error con multa. **Más bajo es mejor.** |
| `model.means_`, `covariances_`, `weights_` | Centro, varianza y peso de cada campana. |
| `model.converged_` / `model.n_iter_` | Si terminó antes del límite y en cuántas rondas. |

??? warning "Error común: cambiar la cantidad de columnas"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gaussian_mixture-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gaussian_mixture-features.error.stderr.expec"
    ```

## AdaBoostClassifier: insistir en lo que se falló { #adaboostclassifier }

### La idea en una frase

**AdaBoost** entrena, uno tras otro, árboles de **una sola pregunta** (muy flojos). Después de cada uno, **agranda** los ejemplos que ese árbol falló, para que el siguiente se fije más en ellos. Al final, todos votan, y los mejores árboles votan con más fuerza.

### Una comparación de la vida diaria

Estudias para un examen con fichas. Las preguntas que respondes bien las dejas al fondo del mazo; las que fallas las pones **arriba**, para verlas más. Después de varias vueltas, dominas justo lo que te costaba.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-adaboost-weights.svg"
<figcaption>Cinco estudiantes con 1 a 5 horas de estudio: los círculos reprobaron y los cuadrados aprobaron. El primer árbol corta en 2.5 y falla con el estudiante 4. Ese estudiante crece: su peso pasa de 0.2 a 0.5, mientras los cuatro acertados bajan a 0.125. Así el siguiente árbol le presta más atención.</figcaption>
</figure>

### Tu primer AdaBoost

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier.expec"
```

!!! tip "¿Qué pasó aquí?"
    `machine.ada_boost_classifier(10, 1.0)` creó un equipo de **10** árboles de una pregunta con **tasa de aprendizaje** `1.0`. Juntos clasificaron bien todas las frutas.

### Las matemáticas con números pequeños { #adaboostclassifier-math }

Si un árbol falla 1 de 5 ejemplos, su error es $e = 0.2$ y su **fuerza de voto** es

$$\alpha = \tfrac12 \ln\frac{1-e}{e} = \tfrac12 \ln 4 = 0.69$$

Después, el peso de cada ejemplo fallado se multiplica por $e^{\alpha}$ y el de cada acertado por $e^{-\alpha}$, y se reparten para que sumen 1:

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-by-hand.expec"
```

El ejemplo fallado pasa a pesar `0.5`, **la mitad de todo**, y los acertados `0.125` cada uno. Y MACHINE muestra el error y la fuerza de cada árbol:

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-weights.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-weights.expec"
```

El primer árbol tiene error `0.2` y fuerza `0.69`, como en la cuenta a mano. El segundo, con los pesos nuevos, solo falla `0.125` y vota con fuerza `0.97`. Juntos, los 3 árboles aciertan los 5 estudiantes, aunque ninguno lo lograba solo.

??? info "Para curiosos 🤓"
    La predicción final es $\text{signo}\big(\sum_t \alpha_t\,h_t(x)\big)$, con cada $h_t(x) = \pm 1$. La tasa de aprendizaje multiplica cada $\alpha_t$. Cada árbol es un **tocón** (*stump*): KAFE prueba todos los cortes de todas las columnas y se queda con el de menor error **ponderado** por los pesos actuales. El código está en `src/lib/KafeMACHINE/ensemble/AdaBoost.py`.

### API { #ada_boost_classifier }

| Llamada | Qué hace |
|---|---|
| `machine.ada_boost_classifier(n_estimators, learning_rate)` | Crea el modelo. `n_estimators` (`INT`, por defecto `50`); `learning_rate` (`FLOAT`, por defecto `1.0`). |
| `model.fit` / `predict` / `score` | Aprender, clasificar y la exactitud. |
| `model.estimator_errors_` / `model.estimator_weights_` | El error y la fuerza de voto de cada árbol. |
| `model.classes_` | Los dos grupos. |

??? warning "Error común: más de dos grupos"
    ```kafe
    --8<-- "tests/DocsExamples/machine/ada_boost_classifier-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ada_boost_classifier-three-classes.error.stderr.expec"
    ```

| 👍 Ventajas | 👎 Límites |
|---|---|
| Convierte modelos muy flojos en uno fuerte. | Solo dos grupos. |
| Dice qué tan bueno fue cada árbol. | Un dato mal etiquetado se agranda una y otra vez. |

## GradientBoostingRegressor: corregir lo que falta { #gradientboostingregressor }

### La idea en una frase

**Gradient Boosting** empieza con una predicción simple (el promedio) y agrega árboles **uno por uno**. Cada árbol nuevo aprende a predecir **lo que todavía falta** (el *residuo*), y solo se suma **un poco** de su respuesta.

### Una comparación de la vida diaria

Un escultor no hace la estatua de un golpe. Primero saca un bloque con la forma general; después, con cada pasada, quita un poco de lo que **sobra**. Cada pasada es más fina que la anterior, hasta que la figura queda.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gradient-boosting.svg"
<figcaption>Cuatro apartamentos que cuestan 10, 20, 30 y 40. Las barras de predicción empiezan planas en el promedio (25). Con 1, 2, 5 y 50 árboles se acercan paso a paso a cada punto: 20 y 30; luego 15 y 31.67; luego 11.46 y 38.4; y al final llegan a 10, 20, 30 y 40.</figcaption>
</figure>

### Tu primer Gradient Boosting

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.gradient_boosting_regressor(50, 0.5, 1)`: **50** árboles, cada uno suma la **mitad** (`0.5`) de lo que dice, y cada árbol tiene **una pregunta** (`max_depth = 1`).
    2. `initial_prediction_` es el punto de partida: el promedio, `25.0`.
    3. Al final predice exactamente `10.0` y `40.0`: nota `1.0`.

### Las matemáticas con números pequeños { #gradientboostingregressor-math }

El primer árbol, a mano:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-by-hand.expec"
```

1. Se empieza en el promedio: `25`.
2. Los **residuos** son lo que falta: a la izquierda `-15` y `-5`, a la derecha `5` y `15`.
3. Un árbol de una pregunta predice el promedio de cada lado: `-10` y `10`.
4. Se suma la **mitad**: 25 + 0.5 × (−10) = `20` y 25 + 0.5 × 10 = `30`.

Y cómo mejora la predicción del primer apartamento (precio real 10) al agregar árboles:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-steps.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-steps.expec"
```

??? info "Para curiosos 🤓"
    Con $F_0 = \bar{y}$, cada paso hace $r_i = y_i - F_{t-1}(x_i)$, entrena un árbol $h_t$ sobre los $r_i$ y actualiza $F_t = F_{t-1} + \eta\,h_t$. Se llama *gradiente* porque, con error cuadrático, el residuo $r_i$ es exactamente la dirección en que más baja el error: es un **descenso por gradiente** en el espacio de las funciones. Un $\eta$ (`learning_rate`) pequeño necesita más árboles, pero suele generalizar mejor. El código está en `src/lib/KafeMACHINE/ensemble/GradientBoosting.py`.

### API { #gradient_boosting_regressor }

| Llamada | Qué hace |
|---|---|
| `machine.gradient_boosting_regressor(n_estimators, learning_rate, max_depth)` | Crea el modelo. Por defecto: `100` árboles, `learning_rate = 0.1`, `max_depth = 3`. |
| `model.fit` / `predict` / `score` | Aprender, predecir y la nota $R^2$. |
| `model.initial_prediction_` | El punto de partida (el promedio). |

??? warning "Error común: predecir sin entrenar"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-not-fitted.error.stderr.expec"
    ```

## GradientBoostingClassifier: empujar las probabilidades { #gradientboostingclassifier }

### La idea en una frase

La misma idea de corregir lo que falta, pero para **dos grupos**: el modelo guarda un puntaje que pasa por la curva en S de la [regresión logística](classifiers.md#logisticregression), y cada árbol **empuja** la probabilidad de cada ejemplo hacia su respuesta correcta.

### Una comparación de la vida diaria

Un meteorólogo empieza diciendo "hay un 33 % de probabilidad de lluvia" para todos los días, porque llovió 2 de cada 6. Después mira la temperatura y la humedad y va ajustando: los días secos bajan, los húmedos suben.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gradient-boosting-classifier.svg"
<figcaption>Seis días sobre un eje de probabilidad de lluvia. Todos empiezan en 0.33. Con 1, 3 y 20 árboles, los cuatro días secos (círculos) se mueven hacia la izquierda, entre 0.11 y 0.18, y los dos de lluvia (cuadrados) pasan la mitad y llegan a 0.82 y 0.76.</figcaption>
</figure>

### Tu primer Gradient Boosting de clasificación

Cada día tiene `[temperatura, humedad]`; `1` = llovió:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_classifier.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.gradient_boosting_classifier(20, 0.5, 2)`: 20 árboles de hasta 2 preguntas, cada uno suma la mitad.
    2. `initial_prediction_` es `-0.69`: el punto de partida en la escala de la curva en S. Como llovió 2 de 6 días, $\ln(2/4) = -0.69$, que la curva convierte en **0.33**.
    3. Clasificó bien los 6 días y los dos días nuevos.

En cada paso, el residuo de un ejemplo es $y - p$: la respuesta (0 o 1) menos la probabilidad actual. Al final, el modelo dice `1` si la probabilidad es 0.5 o más.

### API { #gradient_boosting_classifier }

| Llamada | Qué hace |
|---|---|
| `machine.gradient_boosting_classifier(n_estimators, learning_rate, max_depth)` | Igual que el regresor. |
| `model.fit` / `predict` / `score` | Aprender, clasificar y la exactitud. |
| `model.classes_` / `model.initial_prediction_` | Los dos grupos y el punto de partida. |

??? warning "Error común: un solo grupo"
    Necesita exactamente dos grupos en `y`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/gradient_boosting_classifier-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gradient_boosting_classifier-one-class.error.stderr.expec"
    ```

| | Random Forest | AdaBoost | Gradient Boosting |
|---|---|---|---|
| Árboles | Grandes, en paralelo | De una pregunta, en fila | Pequeños, en fila |
| Cada árbol nuevo… | No sabe de los demás | Se fija en los ejemplos fallados | Predice lo que falta |
| Combina con | Voto o promedio | Voto con fuerza | Suma de pasitos |

!!! tip "¿Qué aprendiste en esta página?"
    - **K-Means** mueve centros; **DBSCAN** busca zonas llenas; **Agglomerative** une lo más cercano; **GaussianMixture** reparte probabilidades entre campanas.
    - En clustering los números de grupo son solo nombres.
    - **AdaBoost** insiste en lo que se falló y **Gradient Boosting** corrige lo que falta, árbol tras árbol.
