# MACHINE: selección de modelos

Entrenar un modelo es solo la mitad del trabajo. La otra mitad es saber **qué tan bueno es** y **elegir la mejor versión**. Esta página tiene las herramientas para eso: separar datos para un examen justo, repetir el examen varias veces, probar distintos ajustes y encadenar pasos.

Ninguna de estas herramientas es un modelo nuevo. Son **ayudantes** que trabajan con los modelos que ya conoces.

| Herramienta | Para qué sirve |
|---|---|
| [`train_test_split`](#train_test_split) | Guardar una parte de los datos para el examen. |
| [`stratified_train_test_split`](#stratified_train_test_split) | Lo mismo, pero cuidando que cada grupo quede bien repartido. |
| [`k_fold`](#k_fold) | Repartir los datos en varios turnos de examen. |
| [`cross_val_score`](#cross_val_score) | Hacer varios exámenes y promediar las notas. |
| [`grid_search_cv`](#grid_search_cv) | Probar ajustes en orden, uno por uno. |
| [`randomized_search_cv`](#randomized_search_cv) | Probar ajustes elegidos por sorteo. |
| [`pipeline`](#pipeline) | Unir varios pasos (preparar datos → modelo) en un solo objeto. |

!!! tip "Antes de empezar"
    Aquí usamos `fit`, `predict` y `score`. Si no los conoces, lee primero [cómo funciona MACHINE](../machine.md). Las firmas exactas de cada llamada están en los [contratos de MACHINE](contracts.md).

## Separar datos para el examen { #model-selection }

### La idea en una frase

Para saber si un modelo aprendió de verdad, hay que probarlo con datos que **nunca vio**.

### Una comparación de la vida diaria

Imagina que un profesor te da diez ejercicios resueltos para estudiar y luego te pone **esos mismos diez** en el examen. Sacarías la nota máxima aunque solo te los hubieras aprendido de memoria. Ese examen no dice nada.

Un buen profesor **guarda** algunos ejercicios y no te los muestra. Con esos hace el examen. Si los resuelves bien, es porque entendiste.

Con los modelos pasa igual. Repartimos los datos en dos montones:

- **Entrenamiento** (*train*): los ejemplos con los que el modelo estudia (`fit`).
- **Prueba** (*test*): los ejemplos guardados para el examen (`score`).

<!-- figura pendiente: diez fichas se barajan y dos se apartan a una caja "test"; las otras ocho entran al modelo -->

### Las matemáticas con números pequeños { #model-selection-math }

Solo hay una cuenta: **cuántos ejemplos van a cada montón**. Tú eliges `test_size`, la fracción que se guarda para el examen.

$$\text{entrenamiento} = \lfloor n \times (1 - \text{test\_size}) \rfloor \qquad \text{prueba} = n - \text{entrenamiento}$$

Las barritas $\lfloor\ \rfloor$ significan "quita los decimales".

Con $n = 10$ ejemplos y `test_size = 0.2`:

- entrenamiento: 10 × (1 − 0.2) = 10 × 0.8 = **8**
- prueba: 10 − 8 = **2**

Con $n = 5$ y `test_size = 0.4`: 5 × 0.6 = **3** para entrenar y **2** para el examen.

### `machine.train_test_split(X, y, test_size, random_state, shuffle)` { #train_test_split }

**Qué hace:** Baraja los ejemplos y los reparte en dos montones: entrenamiento y prueba.

**Cuándo usarla:** Siempre que quieras ponerle una nota honesta a un modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` o `List[List[INT]]` | La tabla de datos: una fila por ejemplo. |
| `y` | `List[FLOAT]` o `List[INT]` | La respuesta de cada ejemplo, en el mismo orden. |
| `test_size` | `FLOAT` | Fracción para el examen, entre 0 y 1 (sin tocarlos). Si no la escribes vale `0.2`. |
| `random_state` | `INT` | La **semilla** para barajar. Con el mismo número, el reparto es siempre igual. Si no la escribes vale `0`, que significa "baraja distinto cada vez". |
| `shuffle` | `BOOL` | `True` baraja antes de repartir (es lo normal). `False` respeta el orden. |

KAFE no usa argumentos con nombre: los parámetros se escriben **en este orden**. Puedes omitir los últimos.

**Devuelve:** `MACHINE`: una cajita con cuatro partes que sacas con corchetes.

| Parte | Qué contiene |
|---|---|
| `split[0]` | `X` de entrenamiento |
| `split[1]` | `X` de prueba |
| `split[2]` | `y` de entrenamiento |
| `split[3]` | `y` de prueba |

**Ejemplo:** Diez estudiantes anotaron sus horas de estudio y su nota. Guardamos dos para el examen:

```kafe
--8<-- "tests/DocsExamples/machine/train_test_split.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/train_test_split.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `train_test_split(hours, grade, 0.2, 42)` barajó los diez ejemplos con la semilla `42` y apartó el 20 %.
    2. Quedaron `8` para entrenar y `2` para el examen, como en la cuenta de arriba.
    3. Al examen fueron los estudiantes de 1 y 2 horas, con sus notas `3.0` y `5.0`. Cada dato viaja junto con su respuesta.
    4. El modelo estudió solo con los otros ocho (`fit`).
    5. `score` lo examinó con los dos que nunca vio y sacó `1.0`: aprendió la regla, no la memorizó.

Si pones `shuffle` en `False`, no se baraja: los **últimos** ejemplos van al examen.

```kafe
--8<-- "tests/DocsExamples/machine/train_test_split-no-shuffle.kf"
```

```text
--8<-- "tests/DocsExamples/machine/train_test_split-no-shuffle.expec"
```

!!! warning "La semilla 0 no es fija"
    `random_state = 0` significa "sin semilla": el reparto cambia cada vez que ejecutas el programa. Para repetir siempre el mismo resultado usa otro número, como `42`.

**Errores comunes:**

??? warning "Un `test_size` fuera de rango"
    `test_size` es una fracción, no un porcentaje. Para el 20 % se escribe `0.2`, no `20.0`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/train_test_split-test-size.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/train_test_split-test-size.error.stderr.expec"
    ```

También falla si `X` está vacía o si `X` e `y` no tienen la misma cantidad de ejemplos. Y recuerda que KAFE no reparte un resultado en cuatro variables de un golpe: saca cada parte con `split[0]`, `split[1]`, `split[2]` y `split[3]`.

### Estratificar: que cada grupo llegue al examen { #stratified-idea }

Barajar tiene un riesgo. Imagina 12 frutas: 8 manzanas y 4 uvas. Si apartas 3 al azar, podrían salir **3 manzanas**. El examen no tendría ni una uva y nunca sabrías si el modelo las reconoce.

**Estratificar** es repartir **grupo por grupo**, para que el examen tenga la misma proporción de cada clase que el conjunto completo. Es como armar un equipo que represente a todo el colegio: tomas algunos estudiantes de cada curso, no todos del mismo.

<!-- figura pendiente: 8 fichas de un color y 4 de otro; de cada fila se aparta la cuarta parte hacia la caja "test" -->

La cuenta se hace **por cada clase**, con `test_size = 0.25`:

| Clase | Hay | Van al examen | Se quedan a entrenar |
|---|---|---|---|
| Manzana (`0`) | 8 | 8 × 0.25 = **2** | 6 |
| Uva (`1`) | 4 | 4 × 0.25 = **1** | 3 |
| Total | 12 | **3** | **9** |

En el conjunto completo, 4 de cada 12 frutas son uvas (un tercio). En el examen, 1 de cada 3 es uva (un tercio). La proporción se mantuvo.

### `machine.stratified_train_test_split(X, y, test_size, random_state)` { #stratified_train_test_split }

**Qué hace:** Reparte en entrenamiento y prueba manteniendo la proporción de cada clase.

**Cuándo usarla:** En **clasificación**, sobre todo si tienes pocos datos o un grupo es mucho más pequeño que otro.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | Una lista con un ejemplo por posición | Los datos. Cada ejemplo puede ser una fila de números o algo más grande, como una imagen (listas dentro de listas). |
| `y` | `List[INT]` o `List[FLOAT]` | La clase de cada ejemplo. |
| `test_size` | `FLOAT` | Fracción para el examen, entre 0 y 1. Si no la escribes vale `0.2`. |
| `random_state` | `INT` | La semilla. `0` (el valor si no la escribes) significa "distinto cada vez". |

Esta función **siempre baraja**; no tiene parámetro `shuffle`.

**Devuelve:** `MACHINE`: la misma cajita de cuatro partes que `train_test_split`.

**Ejemplo:** Las 12 frutas de la tabla (cada una con su peso):

```kafe
--8<-- "tests/DocsExamples/machine/stratified_train_test_split.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/stratified_train_test_split.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Quedaron `9` frutas para entrenar y `3` para el examen.
    2. En el examen hay `[1, 0, 0]`: una uva y dos manzanas, justo lo que calculamos a mano.
    3. El bucle suma las etiquetas del examen. Como las uvas valen `1`, la suma (`1`) es la cantidad de uvas.

??? info "Para curiosos 🤓"
    Para cada clase con $n_c$ ejemplos, van al examen $\lfloor n_c \times \text{test\_size} \rfloor$. Si la clase tiene más de un ejemplo, la función se asegura de que al menos **uno** vaya al examen y al menos **uno** se quede para entrenar. Una clase con un solo ejemplo se queda entera en entrenamiento. Por eso, con muy pocos datos, la proporción puede no salir exacta. Al final se barajan los dos montones para que las clases no queden en fila.

**Errores comunes:** Los mismos de `train_test_split`: `test_size` fuera de rango, `X` vacía o tamaños distintos de `X` e `y`. Los mensajes empiezan con `stratified_train_test_split:`.

!!! tip "¿Qué aprendiste?"
    - Un modelo se examina con datos que no vio al entrenar.
    - `test_size` dice qué fracción se guarda; `random_state` (distinto de 0) hace que el reparto se repita.
    - Estratificar mantiene la proporción de cada clase en el examen.

## Validación cruzada: varios exámenes en vez de uno { #crossvalscore }

### La idea en una frase

En lugar de un solo examen, hacemos **varios**, cada vez con una parte distinta de los datos, y **promediamos** las notas.

### Una comparación de la vida diaria

Un solo examen puede salir bien o mal por suerte: justo te preguntaron lo que sabías, o justo lo que no. Por eso los profesores hacen varios exámenes en el año y sacan el **promedio**. El promedio es más justo que una sola nota.

En la **validación cruzada** cortamos los datos en partes iguales llamadas **pliegues** (*folds*). Con 5 pliegues hay 5 rondas. En cada ronda, un pliegue distinto es el examen y los otros cuatro son para estudiar. Al final, **todos** los ejemplos fueron examen exactamente una vez.

<!-- figura pendiente: fila de 5 bloques; el bloque "examen" (color acento) se mueve de izquierda a derecha en 5 rondas y debajo aparece la nota de cada ronda y su promedio -->

| Ronda | Pliegue 1 | Pliegue 2 | Pliegue 3 | Pliegue 4 | Pliegue 5 |
|---|---|---|---|---|---|
| 1 | **examen** | estudia | estudia | estudia | estudia |
| 2 | estudia | **examen** | estudia | estudia | estudia |
| 3 | estudia | estudia | **examen** | estudia | estudia |
| 4 | estudia | estudia | estudia | **examen** | estudia |
| 5 | estudia | estudia | estudia | estudia | **examen** |

### Las matemáticas con números pequeños { #crossvalscore-math }

Supón que las cinco rondas dieron estas notas (1.0 es acertar todo; 0.5 es acertar la mitad):

| Ronda | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Nota | 0.5 | 1.0 | 1.0 | 1.0 | 1.0 |

**El promedio** es sumar todo y dividir entre cuántas notas hay:

$$\text{promedio} = \frac{0.5 + 1.0 + 1.0 + 1.0 + 1.0}{5} = \frac{4.5}{5} = 0.9$$

**La desviación** dice qué tan **parecidas** fueron las notas entre sí. Si es pequeña, el modelo es parejo. Si es grande, a veces le va bien y a veces mal. Se calcula así:

1. Resta el promedio a cada nota: −0.4, 0.1, 0.1, 0.1, 0.1.
2. Eleva cada resta al cuadrado: 0.16, 0.01, 0.01, 0.01, 0.01.
3. Súmalas: **0.20**.
4. Divide entre la cantidad de notas **menos uno**: 0.20 ÷ 4 = **0.05**.
5. Saca la raíz cuadrada: √0.05 ≈ **0.22**.

Entonces el modelo saca **0.9 ± 0.22**. Vas a ver estos mismos números más abajo, calculados por KAFE.

??? info "Para curiosos 🤓"
    Con $k$ pliegues y notas $s_1, \dots, s_k$:

    $$\bar{s} = \frac{1}{k}\sum_{i=1}^{k} s_i \qquad \text{desviación} = \sqrt{\frac{1}{k-1}\sum_{i=1}^{k}(s_i - \bar{s})^2}$$

    Si $n$ no se divide exacto entre $k$, los primeros pliegues reciben un ejemplo más. Con $n = 7$ y $k = 3$ los tamaños son 3, 2 y 2. La validación cruzada entrena el modelo $k$ veces, así que cuesta $k$ veces más que un solo `train_test_split`. A cambio, usa todos los datos para examinar y la nota depende menos de la suerte.

### Cómo está construido por dentro { #crossvalscore-inside }

Todo vive en `src/lib/KafeMACHINE/model_selection/model_selection.py`.

`k_fold` no toca tus datos: trabaja solo con **números de posición** (índices).

1. Hace la lista `0, 1, 2, …, n − 1`. Si `shuffle` es `True`, la baraja con la semilla.
2. La corta en `n_splits` trozos casi iguales.
3. Para cada trozo arma una pareja: `[los demás índices, este trozo]`.

`CrossValScore` (el objeto que crea `cross_val_score`) guarda `cv`, `scoring`, `random_state` y tres resultados vacíos. Su `fit(model, X, y)`:

1. Comprueba que el modelo **no esté entrenado**.
2. Pide los pliegues a `k_fold`, **siempre barajando**, con tu semilla.
3. En cada ronda hace una **copia nueva** del modelo, la entrena con los ejemplos de estudio y le pone nota con los de examen.
4. Guarda las notas en `scores_`, su promedio en `mean_score_` y su desviación en `std_score_`.

Tu modelo original queda **sin entrenar**: solo se usaron las copias.

### `machine.k_fold(n_samples, n_splits, shuffle, random_state)` { #k_fold }

**Qué hace:** Reparte los índices `0 … n_samples − 1` en pliegues y te dice, para cada ronda, quién estudia y quién es examen.

**Cuándo usarla:** Cuando quieres armar la validación cruzada **tú mismo**, paso a paso. No entrena nada.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n_samples` | `INT` | Cuántos ejemplos tienes. |
| `n_splits` | `INT` | Cuántos pliegues (rondas). Mínimo 2 y no más que `n_samples`. Si no lo escribes vale `5`. |
| `shuffle` | `BOOL` | `True` baraja los índices antes de cortar. Si no lo escribes vale `False`. |
| `random_state` | `INT` | La semilla para barajar. `0` significa "distinto cada vez". |

**Devuelve:** `List[List[List[INT]]]`: una lista con una pareja por ronda. `folds[i][0]` son los índices para estudiar y `folds[i][1]` los del examen.

**Ejemplo:** Diez ejemplos en cinco pliegues, sin barajar:

```kafe
--8<-- "tests/DocsExamples/machine/k_fold.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/k_fold.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Hay `5` rondas.
    2. Los exámenes son `[0, 1]`, `[2, 3]`, `[4, 5]`, `[6, 7]` y `[8, 9]`: cada ejemplo aparece una sola vez. Es el bloque que se va moviendo.
    3. En la primera ronda estudian todos los demás: del `2` al `9`.

Con `shuffle` en `True` y una semilla, los índices se barajan antes de cortar:

```kafe
--8<-- "tests/DocsExamples/machine/k_fold-shuffle.kf"
```

```text
--8<-- "tests/DocsExamples/machine/k_fold-shuffle.expec"
```

**Errores comunes:**

??? warning "Más pliegues que ejemplos"
    No puedes cortar 3 ejemplos en 5 partes:

    ```kafe
    --8<-- "tests/DocsExamples/machine/k_fold-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/k_fold-too-many.error.stderr.expec"
    ```

También falla si `n_samples` no es positivo o si `n_splits` es menor que 2.

### `machine.cross_val_score(cv, scoring, random_state)` { #cross_val_score }

**Qué hace:** Crea un **evaluador** que hace toda la validación cruzada por ti.

**Cuándo usarla:** Cuando quieres una nota confiable de un modelo, sobre todo con pocos datos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `cv` | `INT` | Cuántos pliegues. Si no lo escribes vale `5`. |
| `scoring` | `STR` | Cómo se pone la nota (mira la tabla de abajo). Si no lo escribes vale `"accuracy"`. |
| `random_state` | `INT` | La semilla para barajar los pliegues. `0` significa "distinto cada vez". |

| `scoring` | Qué mide | ¿Mejor alto o bajo? |
|---|---|---|
| `"accuracy"` | Fracción de aciertos. Para clasificación. | Alto |
| `"r2"` | La nota $R^2$ de [la regresión](linear.md#linearregression-math). | Alto |
| `"mse"` | El promedio de los errores al cuadrado. Para regresión. | **Bajo** |

Las métricas se explican en [Funciones y métricas](metrics.md). Con cualquier otro texto se usa el `score` propio del modelo.

**Devuelve:** `MACHINE`: el evaluador, todavía sin resultados.

### `cv.fit(model, X, y)` { #crossvalscore-fit }

**Qué hace:** Ejecuta las rondas: entrena una copia del modelo en cada una y guarda las notas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `model` | `MACHINE` | Un modelo **sin entrenar** (recién creado). |
| `X` | `List[List[FLOAT]]` | La tabla de datos. |
| `y` | `List[INT]` o `List[FLOAT]` | Las respuestas. |

**Devuelve:** El mismo evaluador, ya con resultados.

Fíjate en el orden: aquí `fit` recibe **primero el modelo** y después los datos.

### Lo que el evaluador guarda { #crossvalscore-properties }

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `cv.scores_` | `List[FLOAT]` | La nota de cada ronda. |
| `cv.mean_score_` | `FLOAT` | El promedio de las notas. |
| `cv.std_score_` | `FLOAT` | La desviación: qué tan distintas fueron las notas. |
| `cv.cv` | `INT` | Los pliegues que pediste. |
| `cv.scoring` | `STR` | La forma de poner nota que pediste. |
| `cv.random_state` | `INT` | La semilla que pediste. |

Son propiedades: se escriben **sin paréntesis** y solo se leen.

**Ejemplo:** Diez frutas con su peso y su diámetro: cinco manzanas (`0`) y cinco uvas (`1`). Ojo: hay una manzana muy pequeña (`[40.0, 3.0]`) y una uva muy grande (`[45.0, 3.2]`), que se parecen entre sí.

```kafe
--8<-- "tests/DocsExamples/machine/cross_val_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/cross_val_score.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `cross_val_score(5, "accuracy", 7)` creó un evaluador de 5 rondas que mide aciertos.
    2. `cv.fit(machine.knn(3), fruits, kind)` hizo las 5 rondas con copias de un [KNN](classifiers.md) de 3 vecinos.
    3. En la primera ronda la nota fue `0.5`: al examen le tocó la manzana pequeña, y sus vecinas más cercanas eran uvas. Falló una de dos.
    4. En las otras cuatro acertó todo: `1.0`.
    5. El promedio es `0.9` y la desviación `0.22`: los mismos números que calculamos a mano.

Con un solo `train_test_split`, la nota habría sido `0.5` o `1.0` según la suerte del reparto. El promedio `0.9` cuenta la historia completa.

Este programa hace lo mismo **a mano**: pide los pliegues a `k_fold`, arma las listas de cada ronda, entrena, anota y promedia.

```kafe
--8<-- "tests/DocsExamples/machine/cross_val_score-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/cross_val_score-by-hand.expec"
```

Las cinco notas y el promedio coinciden. Eso es todo lo que hace `cross_val_score` por dentro.

**Errores comunes:**

??? warning "Pasar un modelo ya entrenado"
    El evaluador necesita un modelo nuevo, porque lo va a entrenar él mismo en cada ronda:

    ```kafe
    --8<-- "tests/DocsExamples/machine/cross_val_score-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/cross_val_score-fitted.error.stderr.expec"
    ```

    Quita la línea `model.fit(...)` y funciona.

También falla si los datos están vacíos o si `X` e `y` tienen tamaños distintos. Y recuerda: después de `cv.fit(...)` tu modelo sigue **sin entrenar**. Si quieres usarlo para predecir, llama a su propio `fit`.

### Ventajas y límites { #crossvalscore-tradeoffs }

| | Un solo reparto (`train_test_split`) | Validación cruzada |
|---|---|---|
| Exámenes | 1 | `cv` |
| Entrenamientos | 1 | `cv` (más lento) |
| ¿Depende de la suerte? | Bastante | Poco |
| Datos usados como examen | Solo una parte | Todos, una vez cada uno |
| Va mejor con | Muchos datos | Pocos o medianos |

!!! tip "¿Qué aprendiste?"
    - La validación cruzada hace varios exámenes moviendo el bloque de prueba.
    - La nota final es el promedio; la desviación dice si el modelo es parejo.
    - `k_fold` solo reparte índices; `cross_val_score` entrena y pone las notas.

## GridSearchCV: probar todos los ajustes en orden { #gridsearchcv }

### La idea en una frase

Muchos modelos tienen **perillas** que tú eliges antes de entrenar. Buscar en rejilla es **probar todas las combinaciones** de perillas y quedarse con la que saca mejor nota.

### Una comparación de la vida diaria

Quieres hornear la mejor galleta. Puedes cambiar la temperatura (160°, 180°, 200°) y el tiempo (10 o 15 minutos). Para estar seguro, horneas **una tanda con cada combinación**, las pruebas todas y eliges la más rica. Eso es una **rejilla** (*grid*): una tabla con todas las combinaciones.

<!-- figura pendiente: rejilla 3×2 de casillas; se iluminan una por una con su nota y la mejor queda marcada -->

Esas perillas se llaman **hiperparámetros**. No son lo que el modelo aprende de los datos: son lo que **tú decides antes**. Por ejemplo, la `k` de [KNN](classifiers.md) (cuántos vecinos mirar) o el `alpha` de [`RidgeRegression`](linear.md#ridgeregression).

### Elegir ajustes sin hacer trampa { #gridsearchcv-overfitting }

Un modelo **sobreajustado** es el que se aprendió los ejemplos de memoria: saca nota perfecta con lo que ya vio y falla con lo nuevo.

Si eliges los hiperparámetros mirando la nota sobre los **mismos datos de entrenamiento**, vas a premiar justamente a los que más memorizan. Con KNN y `k = 1`, cada ejemplo es su propio vecino más cercano, así que la nota de entrenamiento es perfecta siempre. Eso no dice nada.

La solución es la de toda esta página: **cada combinación se califica con validación cruzada**, es decir, con datos que esa copia del modelo no vio.

!!! note "Un examen final aparte"
    Si pruebas muchas combinaciones, alguna puede ganar por pura suerte. Por eso lo más limpio es: primero apartar un conjunto de prueba con `train_test_split`, buscar los ajustes solo con el de entrenamiento, y usar el de prueba **una sola vez**, al final.

### Las matemáticas con números pequeños { #gridsearchcv-math }

**¿Cuántas combinaciones hay?** Se multiplica la cantidad de opciones de cada perilla:

$$\text{combinaciones} = 3 \text{ temperaturas} \times 2 \text{ tiempos} = 6$$

**¿Cuántos entrenamientos?** Cada combinación se examina con `cv` rondas. Con 5 pliegues: 6 × 5 = **30** entrenamientos.

**¿Quién gana?** La combinación con mejor promedio. Estas son las notas reales de un KNN con cuatro valores de `k` (las calcula el programa de más abajo):

| `k` | 1 | 3 | 5 | 7 |
|---|---|---|---|---|
| Promedio de 5 rondas | 0.8 | **0.9** | 0.9 | 0.5 |

Gana `k = 3`. Empata con `k = 5`, pero se queda el primero que llegó a la mejor nota.

??? info "Para curiosos 🤓"
    Si la perilla $i$ tiene $|G_i|$ opciones, hay $\prod_i |G_i|$ combinaciones y el costo total es $\prod_i |G_i| \times k \times T$, donde $k$ son los pliegues y $T$ el tiempo de un entrenamiento. Cada perilla nueva **multiplica** el trabajo: con 4 perillas de 5 opciones ya son 625 combinaciones. Con `"mse"` gana la nota más **baja**; con `"accuracy"` y `"r2"`, la más alta.

### Cómo está construido por dentro { #gridsearchcv-inside }

La clase `GridSearchCV` guarda una rejilla (`param_grid`), los pliegues, la forma de poner nota y la semilla. Su `fit(model, X, y)`:

1. Comprueba que el modelo no esté entrenado.
2. Arma la lista de todas las combinaciones de la rejilla.
3. Para cada combinación hace validación cruzada (copias del modelo con esos ajustes) y guarda el promedio en `cv_results_`.
4. Se queda con el mejor promedio (`best_score_`) y sus ajustes (`best_params_`).
5. Pone esos ajustes en tu modelo, **sin entrenarlo**.

!!! warning "Límite actual de KAFE: la rejilla está vacía"
    La función `machine.grid_search_cv(...)` todavía **no tiene un parámetro para darle la rejilla**. Siempre crea el buscador con una rejilla vacía, así que evalúa **una sola combinación**: el modelo tal como lo creaste. Por eso `best_params_` es `{}`. En la práctica hoy hace lo mismo que `cross_val_score`. Para buscar de verdad, usa el bucle de [la rejilla a mano](#gridsearchcv-by-hand).

### `machine.grid_search_cv(cv, scoring, random_state)` { #grid_search_cv }

**Qué hace:** Crea un buscador en rejilla. Hoy, con la rejilla vacía, califica el modelo con validación cruzada.

**Cuándo usarla:** Para entender la idea. Para elegir ajustes de verdad, usa el bucle de más abajo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `cv` | `INT` | Cuántos pliegues (mínimo 2). Si no lo escribes vale `5`. |
| `scoring` | `STR` | `"accuracy"`, `"r2"` o `"mse"`. Si no lo escribes vale `"accuracy"`. |
| `random_state` | `INT` | La semilla de los pliegues. `0` significa "distinto cada vez". |

**Devuelve:** `MACHINE`: el buscador, todavía sin resultados.

### `search.fit(model, X, y)` { #gridsearchcv-fit }

**Qué hace:** Evalúa cada combinación de la rejilla con validación cruzada.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `model` | `MACHINE` | Un modelo **sin entrenar**. |
| `X` | `List[List[FLOAT]]` | La tabla de datos. |
| `y` | `List[INT]` o `List[FLOAT]` | Las respuestas. |

**Devuelve:** El mismo buscador, ya con resultados. El modelo que le pasaste queda **sin entrenar**.

### Lo que el buscador guarda { #gridsearchcv-properties }

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `search.best_score_` | `FLOAT` | La mejor nota promedio. |
| `search.cv_results_` | `List[FLOAT]` | La nota promedio de cada combinación probada. |
| `search.n_splits_` | `INT` | Los pliegues usados. |
| `search.cv`, `search.scoring`, `search.random_state` | `INT`, `STR`, `INT` | Lo que pediste al crearlo. |
| `search.best_params_` | Valor interno | Los mejores ajustes. Hoy siempre es `{}`. Puedes mostrarlo con `show`, pero KAFE no tiene un tipo para guardarlo en una variable. |
| `search.param_grid` | Valor interno | La rejilla. Hoy siempre está vacía. |

El buscador **no tiene** `predict` ni un "mejor modelo ya entrenado". Para predecir, entrena tú el modelo con los ajustes ganadores.

**Ejemplo:** Las mismas diez frutas de antes:

```kafe
--8<-- "tests/DocsExamples/machine/grid_search_cv.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/grid_search_cv.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `best_params_` es `{}`: no había perillas para mover.
    2. Se probó una sola combinación, por eso `cv_results_` tiene una sola nota: `[0.9]`.
    3. Esa nota es el mismo `0.9` que dio `cross_val_score` con la misma semilla.

### La rejilla a mano { #gridsearchcv-by-hand }

Una rejilla es, en el fondo, un **bucle**. Este programa prueba `k = 1, 3, 5, 7`, califica cada uno con validación cruzada y se queda con el mejor:

```kafe
--8<-- "tests/DocsExamples/machine/grid_search_cv-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/grid_search_cv-by-hand.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Las cuatro notas son las de la tabla: `0.8`, `0.9`, `0.9` y `0.5`.
    2. Con `k = 7` el modelo mira demasiados vecinos y se confunde: es demasiado simple para estos datos.
    3. El ganador es `3`. Ahora puedes crear `machine.knn(3)`, entrenarlo con todos los datos y usarlo.

Con dos perillas pondrías un bucle dentro de otro: eso es la rejilla completa.

**Errores comunes:** Pasar un modelo ya entrenado da `Cross-validation requires an unfitted model`, igual que en [`cross_val_score`](#cross_val_score). Un `cv` menor que 2 da `GridSearchCV: cv must be greater than 1`. Datos vacíos o de tamaños distintos también fallan.

!!! tip "¿Qué aprendiste?"
    - Los hiperparámetros son las perillas que eliges tú antes de entrenar.
    - Se eligen con validación cruzada, nunca con la nota de entrenamiento.
    - En KAFE, hoy la rejilla se escribe como un bucle sobre `cross_val_score`.

## RandomizedSearchCV: probar ajustes por sorteo { #randomizedsearchcv }

### La idea en una frase

Cuando hay demasiadas combinaciones para probarlas todas, se **sortean** unas cuantas y se elige la mejor de esas.

### Una comparación de la vida diaria

Una heladería tiene 100 sabores. Probarlos todos te tomaría el día entero. En cambio, pides **10 cucharitas al azar**. Tal vez no encuentres el mejor sabor de todos, pero casi seguro encuentras uno muy bueno, y terminas en diez minutos.

<!-- figura pendiente: rejilla grande de casillas; solo algunas, elegidas al azar, se iluminan con su nota -->

### Las matemáticas con números pequeños { #randomizedsearchcv-math }

Supón tres perillas con 10 opciones cada una:

- **Rejilla completa:** 10 × 10 × 10 = **1000** combinaciones. Con 5 pliegues: **5000** entrenamientos.
- **Sorteo con `n_iter = 20`:** 20 combinaciones. Con 5 pliegues: 20 × 5 = **100** entrenamientos.

El sorteo cuesta lo que **tú decides** (`n_iter`), sin importar cuántas perillas haya.

??? info "Para curiosos 🤓"
    El costo es $n_{iter} \times k \times T$. ¿Qué tan probable es encontrar algo bueno? Si el 5 % de las combinaciones son "muy buenas", la probabilidad de que **ninguno** de 20 sorteos caiga ahí es $0.95^{20} \approx 0.36$. O sea, con 20 intentos hay un 64 % de probabilidad de dar con una de las mejores; con 60 intentos, un 95 %. La rejilla garantiza encontrar la mejor **de la rejilla**; el sorteo no garantiza nada, pero suele acercarse con mucho menos trabajo.

### Cómo está construido por dentro { #randomizedsearchcv-inside }

La clase `RandomizedSearchCV` se parece mucho a `GridSearchCV`. Guarda las opciones de cada perilla (`param_distributions`) y cuántos sorteos hacer (`n_iter`). Su `fit(model, X, y)` repite `n_iter` veces:

1. Sortea un valor para cada perilla.
2. Califica esa combinación con validación cruzada y guarda el promedio en `cv_results_`.
3. Si es la mejor hasta ahora, la recuerda en `best_score_` y `best_params_`.

!!! warning "Límite actual de KAFE: no hay nada que sortear"
    Igual que en la rejilla, `machine.randomized_search_cv(...)` **no tiene un parámetro para darle las opciones**. Las crea vacías, así que los `n_iter` intentos evalúan **la misma** configuración y sacan la misma nota. `best_params_` es `{}`.

### `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` { #randomized_search_cv }

**Qué hace:** Crea un buscador por sorteo. Hoy, sin opciones que sortear, repite `n_iter` veces la misma validación cruzada.

**Cuándo usarla:** Para entender la idea. Para buscar de verdad, usa un bucle como el de [la rejilla a mano](#gridsearchcv-by-hand) con menos opciones.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n_iter` | `INT` | Cuántas combinaciones sortear (mínimo 1). Si no lo escribes vale `10`. |
| `cv` | `INT` | Cuántos pliegues (mínimo 2). Si no lo escribes vale `5`. |
| `scoring` | `STR` | `"accuracy"`, `"r2"` o `"mse"`. Si no lo escribes vale `"accuracy"`. |
| `random_state` | `INT` | La semilla. `0` significa "distinto cada vez". |

Ojo con el orden: aquí `n_iter` va **primero**, antes de `cv`.

**Devuelve:** `MACHINE`: el buscador, todavía sin resultados.

### `search.fit(model, X, y)` { #randomizedsearchcv-fit }

**Qué hace:** Hace los `n_iter` sorteos y califica cada uno con validación cruzada.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `model` | `MACHINE` | Un modelo **sin entrenar**. |
| `X` | `List[List[FLOAT]]` | La tabla de datos. |
| `y` | `List[INT]` o `List[FLOAT]` | Las respuestas. |

**Devuelve:** El mismo buscador, ya con resultados. El modelo queda **sin entrenar**.

### Lo que el buscador guarda { #randomizedsearchcv-properties }

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `search.best_score_` | `FLOAT` | La mejor nota promedio. |
| `search.cv_results_` | `List[FLOAT]` | La nota promedio de cada sorteo. |
| `search.n_iter_` | `INT` | Los sorteos realizados. |
| `search.n_splits_` | `INT` | Los pliegues usados. |
| `search.n_iter`, `search.cv`, `search.scoring`, `search.random_state` | `INT`, `INT`, `STR`, `INT` | Lo que pediste al crearlo. |
| `search.best_params_` | Valor interno | Los mejores ajustes. Hoy siempre es `{}`. |
| `search.param_distributions` | Valor interno | Las opciones de cada perilla. Hoy siempre está vacío. |

Tampoco tiene `predict` ni un modelo ganador ya entrenado.

**Ejemplo:** Tres "sorteos" con las diez frutas:

```kafe
--8<-- "tests/DocsExamples/machine/randomized_search_cv.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/randomized_search_cv.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `cv_results_` tiene `3` notas, una por sorteo.
    2. Las tres son `0.9`: como no había perillas, los tres intentos probaron lo mismo.
    3. `best_params_` es `{}`.

**Errores comunes:** Un `n_iter` de `0` da `RandomizedSearchCV: n_iter must be positive`. Un `cv` menor que 2 da `RandomizedSearchCV: cv must be greater than 1`. Un modelo ya entrenado da `Cross-validation requires an unfitted model`.

### Rejilla o sorteo { #randomizedsearchcv-tradeoffs }

| | Rejilla (`GridSearchCV`) | Sorteo (`RandomizedSearchCV`) |
|---|---|---|
| Qué prueba | Todas las combinaciones | `n_iter` combinaciones al azar |
| Costo | Crece con cada perilla | Lo decides tú |
| ¿Encuentra la mejor? | Sí, dentro de la rejilla | No siempre, pero suele acercarse |
| Va mejor con | Pocas perillas y pocas opciones | Muchas perillas |
| En KAFE hoy | Rejilla vacía: una combinación | Opciones vacías: la misma combinación `n_iter` veces |

!!! tip "¿Qué aprendiste?"
    - El sorteo prueba solo algunas combinaciones, y tú decides cuántas.
    - Cuesta `n_iter × cv` entrenamientos, haya las perillas que haya.
    - En KAFE, hoy los dos buscadores evalúan el modelo tal como lo creaste.

## Pipeline: una línea de montaje { #pipeline }

### La idea en una frase

Un **pipeline** une varios pasos, uno detrás de otro, para que se comporten como **un solo modelo**.

### Una comparación de la vida diaria

En una fábrica de jugos, la fruta pasa por estaciones en fila: primero se **lava**, después se **exprime**, al final se **embotella**. Tú solo pones la fruta al principio y recoges la botella al final. Nadie tiene que llevar la fruta de una estación a otra.

En MACHINE casi siempre hay dos estaciones:

1. **Preparar los datos**, por ejemplo con [`standard_scaler`](preprocessing.md), que pone todas las columnas en la misma escala.
2. **El modelo**, que aprende con los datos ya preparados.

<!-- figura pendiente: una fila de datos entra por la izquierda, pasa por la caja "scale", luego por la caja "model" y sale una predicción -->

### ¿Por qué no hacerlo paso a paso? { #pipeline-leakage }

Puedes hacerlo a mano, pero hay una trampa fácil de pisar. El escalador también **aprende** cosas de los datos (el promedio y la dispersión de cada columna). Si lo dejas aprender con **todos** los datos, incluidos los del examen, el modelo recibe una pista del examen antes de presentarlo. A eso se le llama **fuga de datos**.

El pipeline lo evita solo: en `fit`, cada paso aprende **solo** con lo que le diste a `fit`. En `predict`, los pasos de preparación solo **aplican** lo aprendido; no vuelven a aprender.

### Las matemáticas con números pequeños { #pipeline-math }

Sigamos una columna por la línea de montaje. Cinco casas miden 50, 80, 100, 120 y 150 m².

**Estación 1: escalar.** El escalador calcula dos números y luego transforma cada dato:

$$z = \frac{x - \text{promedio}}{\text{dispersión}}$$

1. Promedio: (50 + 80 + 100 + 120 + 150) ÷ 5 = **100**.
2. Distancias al promedio: −50, −20, 0, 20, 50. Al cuadrado: 2500, 400, 0, 400, 2500. Suma: 5800.
3. Dispersión: √(5800 ÷ 5) = √1160 ≈ **34.06**.
4. La primera casa queda en (50 − 100) ÷ 34.06 ≈ **−1.47**.

Ese −1.47 significa "esta casa está 1.47 pasos por debajo del promedio".

**Estación 2: el modelo.** Recibe −1.47 (y no 50) y aprende con eso. Cuando llegue una casa nueva de 90 m², la línea usará **el mismo** promedio y la misma dispersión: (90 − 100) ÷ 34.06 ≈ −0.29, y eso es lo que verá el modelo.

??? info "Para curiosos 🤓"
    Si los pasos de preparación son $T_1, \dots, T_n$ y el modelo es $M$:

    - **Entrenar:** $X_1 = T_1.\text{fit\_transform}(X)$, $X_2 = T_2.\text{fit\_transform}(X_1)$, …, y al final $M.\text{fit}(X_n, y)$.
    - **Predecir:** $X_1 = T_1.\text{transform}(X)$, …, y al final $M.\text{predict}(X_n)$.

    La diferencia es una sola palabra: al entrenar se usa `fit_transform` (aprende y aplica); al predecir, solo `transform` (aplica).

### Cómo está construido por dentro { #pipeline-inside }

La clase `Pipeline` guarda la lista de parejas `(nombre, paso)` que le diste. Antes de entrenar, sus listas `steps_` y `named_steps_` están vacías.

`fit(X, y)`:

1. Hace una copia de `X` para no cambiar tus datos.
2. Recorre los pasos en orden. Si el paso **no es el último**, lo entrena y transforma los datos (`fit_transform`); el resultado pasa al siguiente.
3. Si es **el último**, lo entrena con los datos ya transformados y con `y`.
4. Anota cada paso entrenado en `steps_` y `named_steps_`.

`predict(X)` recorre los mismos pasos: los intermedios hacen `transform` y el último hace `predict`. `transform(X)` hace lo mismo, pero se detiene **antes** del último paso.

### Crear el pipeline: `machine.pipeline(name1, step1, name2, step2, ...)` { #pipeline-create }

**Qué hace:** Crea una línea de montaje con los pasos que le des, en ese orden.

**Cuándo usarla:** Cuando tu modelo necesita datos preparados y quieres que la preparación y el modelo viajen siempre juntos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `name1`, `name2`, … | `STR` | El nombre que le pones a cada paso. Tú lo eliges. |
| `step1`, `step2`, … | `MACHINE` | El paso: un transformador o, al final, un modelo. |

Se escriben **en parejas**: nombre, paso, nombre, paso. Mínimo una pareja. Todos los pasos menos el último deben saber transformar (`fit_transform`, o `fit` y `transform`). El último debe ser un modelo con `fit(X, y)` y `predict`.

**Devuelve:** `MACHINE`: el pipeline, todavía sin entrenar.

### `pipe.fit(X, y)` { #pipeline-fit }

**Qué hace:** Entrena todos los pasos, en orden.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` | La tabla de datos, sin preparar. |
| `y` | `List[FLOAT]` o `List[INT]` | Las respuestas. |

**Devuelve:** El mismo pipeline, ya entrenado.

### `pipe.predict(X)` { #pipeline-predict }

**Qué hace:** Prepara los datos nuevos con los pasos ya entrenados y le pregunta al modelo final.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` | Datos nuevos, **sin preparar**: el pipeline los prepara. |

**Devuelve:** Una lista con una predicción por fila.

### `pipe.score(X, y)` { #pipeline-score }

**Qué hace:** Prepara los datos y le pide al modelo final que se ponga nota.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` | Los datos, sin preparar. |
| `y` | `List[FLOAT]` o `List[INT]` | Las respuestas correctas. |
| `metric` | `FUNC` | Opcional. Una función `(y_true, y_pred)` que devuelve un `FLOAT`, para usar otra forma de poner nota. |

**Devuelve:** `FLOAT`: la nota del modelo final ($R^2$ si es de regresión, aciertos si es de clasificación).

### `pipe.transform(X)` { #pipeline-transform }

**Qué hace:** Aplica solo los pasos de preparación, **sin** el modelo final. Sirve para ver cómo le llegan los datos al modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` | Los datos a preparar. |

**Devuelve:** `List[List[FLOAT]]`: los datos preparados.

### `pipe.fit_transform(X, y)` { #pipeline-fit_transform }

**Qué hace:** Entrena todo el pipeline y devuelve los datos preparados. Es `fit` seguido de `transform`.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` | La tabla de datos. |
| `y` | `List[FLOAT]` o `List[INT]` | Las respuestas. |

**Devuelve:** `List[List[FLOAT]]`: los datos preparados. **No** devuelve predicciones.

### `pipe.get_params()` { #pipeline-get_params }

**Qué hace:** Dice los nombres de los pasos, en orden.

No recibe parámetros.

**Devuelve:** `List[STR]`: los nombres. (No devuelve los ajustes de cada paso.)

### Lo que el pipeline guarda { #pipeline-properties }

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `pipe.named_steps_` | Valor interno | Los pasos entrenados, por nombre. |
| `pipe.steps_` | Valor interno | Las parejas (nombre, paso) ya entrenadas. |
| `pipe.steps` | Valor interno | Las parejas tal como las diste al crearlo. |

Estas tres son **limitadas**: KAFE no tiene un tipo para guardarlas en una variable ni para medirlas (`len(pipe.steps_)` falla). Para saber qué pasos hay, usa `pipe.get_params()`.

**Ejemplo:** Cinco casas con su tamaño en m² y su número de cuartos, y su precio:

```kafe
--8<-- "tests/DocsExamples/machine/pipeline.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/pipeline.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.pipeline("scale", ..., "model", ...)` armó la línea: primero escalar, después una [regresión lineal](linear.md#linearregression).
    2. `pipe.fit(houses, price)` entrenó el escalador, escaló las casas y entrenó la regresión con las casas escaladas.
    3. `get_params()` muestra los nombres: `['scale', 'model']`.
    4. `predict([[90.0, 2.0]])` recibió una casa **sin escalar**. El pipeline la escaló y la regresión respondió `200.0`.
    5. `score` da `1.0`: los precios seguían una regla exacta (2 × m² + 10 × cuartos).
    6. `transform` muestra cómo vio el modelo la primera casa: `-1.47` (el número que calculamos a mano) y `-1.57` para los cuartos.

**Errores comunes:**

??? warning "Predecir antes de entrenar"
    Un pipeline recién creado no ha aprendido nada:

    ```kafe
    --8<-- "tests/DocsExamples/machine/pipeline-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/pipeline-not-fitted.error.stderr.expec"
    ```

Otros errores: escribir un nombre sin su paso (`pipeline: requires an even number of arguments (name, step pairs)`), no dar ninguna pareja, o llamar a `fit` con datos vacíos o de tamaños distintos.

### Ventajas y límites { #pipeline-tradeoffs }

| 👍 Ventajas | 👎 Límites |
|---|---|
| Evita la fuga de datos: la preparación aprende solo con lo que ve `fit`. | El último paso debe ser un modelo con respuestas (`fit(X, y)`). |
| Una sola llamada a `fit` y una a `predict`, en vez de varias. | `steps_` y `named_steps_` no se pueden recorrer desde KAFE. |
| No se te olvida preparar los datos nuevos. | `get_params()` solo da los nombres, no los ajustes. |

!!! note "Pipeline y validación cruzada"
    Un pipeline **sin entrenar** se puede pasar a [`cross_val_score`](#cross_val_score) como si fuera un modelo. Así, en cada ronda el escalador aprende solo con los ejemplos de estudio de esa ronda.

!!! tip "¿Qué aprendiste?"
    - Un pipeline es una línea de montaje: preparar → modelo.
    - Al entrenar, cada paso aprende y aplica; al predecir, solo aplica.
    - Le das datos sin preparar y él se encarga del resto.

## ¿Qué aprendiste?

- Un modelo se examina con datos que **no vio**: `train_test_split` los aparta, y la versión estratificada cuida la proporción de cada clase.
- La **validación cruzada** hace varios exámenes y promedia: `k_fold` reparte los turnos y `cross_val_score` entrena y anota.
- Los **hiperparámetros** se eligen comparando notas de validación cruzada, no notas de entrenamiento. En KAFE, hoy eso se hace con un bucle.
- Un **pipeline** junta la preparación y el modelo para que nunca se separen.

[Siguiente: funciones y métricas :material-arrow-right:](metrics.md){ .md-button .md-button--primary }
[Volver a MACHINE](../machine.md){ .md-button }
