# MACHINE: funciones y métricas

Una **métrica** es una **nota** para tu modelo: un número que dice qué tan bien respondió. Para calcularla comparas dos listas: las **respuestas correctas** (`y_true`) y las **respuestas del modelo** (`y_pred`).

En esta página están todas las métricas de MACHINE. Son **funciones**, no modelos: no tienen `fit` ni `predict`. Les das las dos listas y te devuelven la nota.

| Grupo | Para qué sirve |
|---|---|
| [Métricas de clasificación](#classification-metrics) | Poner nota cuando el modelo elige una **etiqueta** (spam o no spam). |
| [Métricas de regresión](#regression-metrics) | Poner nota cuando el modelo predice un **número** (un precio, una nota). |
| [Métrica de clustering](#clustering-metrics) | Poner nota a unos **grupos** cuando no hay respuestas correctas. |
| [Las mismas métricas para GESHA](#one-metric-api-for-machine-and-gesha) | Usar estas funciones con redes neuronales. |
| [¿Qué métrica uso?](#which-metric) | Una tabla para elegir rápido. |

!!! tip "Antes de empezar"
    Si todavía no sabes qué son `fit` y `predict`, lee primero [cómo funciona MACHINE](../machine.md).

## Todas las funciones de un vistazo { #main-functions }

Todas se llaman con `machine.` delante y reciben sus argumentos **en orden**.

| Función | Devuelve | En una frase |
|---|---|---|
| [`accuracy_score(y_true, y_pred)`](#accuracy_score) | `FLOAT` | Qué parte de las respuestas acertó. |
| [`precision_score(y_true, y_pred)`](#precision_score) | `FLOAT` | Cuando el modelo dice "es de esta clase", ¿cuántas veces tiene razón? |
| [`recall_score(y_true, y_pred)`](#recall_score) | `FLOAT` | De los que sí eran de esa clase, ¿cuántos encontró? |
| [`f1_score(y_true, y_pred)`](#f1_score) | `FLOAT` | Una sola nota que mezcla precisión y recall. |
| [`confusion_matrix(y_true, y_pred)`](#confusion_matrix) | `List[List[INT]]` | La tabla de aciertos y confusiones. |
| [`classification_report(y_true, y_pred)`](#classification_report) | `STR` | Un informe con todo lo anterior. |
| [`roc_auc_score(y_true, y_score)`](#roc_auc_score) | `FLOAT` | Qué tan bien ordena el modelo: positivos arriba, negativos abajo. |
| [`mean_absolute_error(y_true, y_pred)`](#mean_absolute_error) | `FLOAT` | El error promedio. |
| [`mean_squared_error(y_true, y_pred)`](#mean_squared_error) | `FLOAT` | El promedio de los errores al cuadrado. |
| [`root_mean_squared_error(y_true, y_pred)`](#root_mean_squared_error) | `FLOAT` | La raíz del anterior. |
| [`max_error(y_true, y_pred)`](#max_error) | `FLOAT` | El peor error. |
| [`median_absolute_error(y_true, y_pred)`](#median_absolute_error) | `FLOAT` | El error "del medio". |
| [`mean_absolute_percentage_error(y_true, y_pred)`](#mean_absolute_percentage_error) | `FLOAT` | El error promedio en porcentaje. |
| [`r2_score(y_true, y_pred)`](#r2_score) | `FLOAT` | Cuánto mejor es el modelo que decir siempre el promedio. |
| [`explained_variance_score(y_true, y_pred)`](#explained_variance_score) | `FLOAT` | Parecida a $R^2$, pero perdona un error fijo. |
| [`silhouette_score(X, labels)`](#silhouette_score) | `FLOAT` | Qué tan bien separados quedaron los grupos. |

Las funciones que **crean modelos** (`machine.knn`, `machine.linear_regression`…) están en la página de cada modelo. Empieza por la [página de entrada de MACHINE](../machine.md).

## Métricas de clasificación { #classification-metrics }

### La idea en una frase

Un modelo de clasificación puede equivocarse de **dos maneras distintas**, y las métricas de clasificación cuentan cuántas veces pasó cada una.

### Una comparación de la vida diaria

Piensa en un **filtro de spam** (correo basura). Mira cada correo y decide: "es spam" (`1`) o "es normal" (`0`). Hay cuatro cosas que pueden pasar:

| | El filtro dijo **spam** | El filtro dijo **normal** |
|---|---|---|
| **Era spam** | ✅ Acertó. Se llama **verdadero positivo** (TP). | ❌ Se le escapó un spam. **Falso negativo** (FN). |
| **Era normal** | ❌ Mandó un correo bueno a la basura. **Falso positivo** (FP). | ✅ Acertó. **Verdadero negativo** (TN). |

"Positivo" significa que el filtro dijo "sí, es spam". "Verdadero" o "falso" dice si tenía razón.

Los dos errores **no duelen igual**. Un falso negativo es una molestia: ves un spam en tu bandeja. Un falso positivo puede ser grave: pierdes un correo importante. Por eso una sola nota no alcanza.

<!-- figura pendiente: 10 correos caen uno a uno en las 4 casillas de la matriz de confusión (TN 4, FP 2, FN 1, TP 3); luego se resalta la columna "dijo spam" (precisión 3/5) y la fila "era spam" (recall 3/4) -->

### Tu primera matriz de confusión { #classification-first }

Llegaron **10 correos**. Cuatro eran spam y seis eran normales. `real` es la verdad y `guess` es lo que dijo el filtro:

```kafe
--8<-- "tests/DocsExamples/machine/confusion_matrix.kf"
```

```text
--8<-- "tests/DocsExamples/machine/confusion_matrix.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `machine.confusion_matrix(real, guess)` comparó las dos listas, correo por correo.
    2. Devolvió una tabla. Cada **fila** es lo que el correo **era**; cada **columna** es lo que el filtro **dijo**. Las clases van en orden: primero `0`, luego `1`.
    3. Fila `[4, 2]`: de los 6 correos normales, 4 quedaron bien (TN) y 2 fueron a la basura por error (FP).
    4. Fila `[1, 3]`: de los 4 spam, 1 se escapó (FN) y 3 fueron atrapados (TP).
    5. Los aciertos están en la **diagonal**: 4 y 3.

Esa tabla se llama **matriz de confusión** porque muestra con qué confunde el modelo cada clase.

### Las matemáticas con números pequeños { #classification-math }

Todas las métricas de clasificación salen de esos cuatro números. Usaremos siempre la misma tabla:

| | Dijo spam | Dijo normal | Total |
|---|---|---|---|
| **Era spam** | TP = 3 | FN = 1 | 4 |
| **Era normal** | FP = 2 | TN = 4 | 6 |

**Exactitud (*accuracy*):** de todos los correos, ¿qué parte acertó?

$$\text{exactitud} = \frac{\text{aciertos}}{\text{total}} = \frac{3 + 4}{10} = 0.7$$

**Precisión (*precision*):** cuando el filtro dijo "spam", ¿cuántas veces tenía razón? Dijo "spam" 5 veces (3 + 2) y acertó 3.

$$\text{precisión} = \frac{TP}{TP + FP} = \frac{3}{3 + 2} = 0.6$$

**Recall (sensibilidad):** de los spam que había de verdad, ¿cuántos atrapó? Había 4 y atrapó 3.

$$\text{recall} = \frac{TP}{TP + FN} = \frac{3}{3 + 1} = 0.75$$

**F1:** una sola nota que mezcla las dos anteriores. Solo es alta si **las dos** son altas.

$$F1 = \frac{2 \times \text{precisión} \times \text{recall}}{\text{precisión} + \text{recall}} = \frac{2 \times 0.6 \times 0.75}{0.6 + 0.75} = \frac{0.9}{1.35} \approx 0.667$$

Este programa cuenta los cuatro casos con un bucle y saca las tres primeras notas, **sin usar MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/confusion_matrix-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/confusion_matrix-by-hand.expec"
```

Las cuatro primeras líneas son TP, FP, FN y TN. Las tres últimas son la exactitud, la precisión y el recall del spam.

!!! note "KAFE promedia las dos clases"
    Arriba calculamos precisión, recall y F1 **mirando solo el spam**. Pero también puedes hacer las mismas preguntas sobre los correos **normales**. `precision_score`, `recall_score` y `f1_score` calculan la nota de **cada clase** y devuelven el **promedio**. A eso se le llama promedio *macro*.

    | Clase | Precisión | Recall | F1 |
    |---|---|---|---|
    | Normal (`0`) | 4 ÷ (4 + 1) = 0.8 | 4 ÷ (4 + 2) ≈ 0.667 | ≈ 0.727 |
    | Spam (`1`) | 3 ÷ (3 + 2) = 0.6 | 3 ÷ (3 + 1) = 0.75 | ≈ 0.667 |
    | **Promedio (lo que devuelve KAFE)** | **0.7** | **≈ 0.708** | **≈ 0.697** |

    Las notas de cada clase por separado las ves con [`classification_report`](#classification_report).

??? info "Para curiosos 🤓"
    Para una clase $c$, con sus conteos $TP_c$, $FP_c$ y $FN_c$:

    $$P_c = \frac{TP_c}{TP_c + FP_c} \qquad R_c = \frac{TP_c}{TP_c + FN_c} \qquad F1_c = \frac{2\,P_c\,R_c}{P_c + R_c}$$

    Si un denominador es 0, KAFE usa 0 para esa nota. El promedio macro sobre las $K$ clases que aparecen en `y_true` es $\frac{1}{K}\sum_c P_c$ (igual para recall y F1). El F1 es la **media armónica** de precisión y recall: castiga que una de las dos sea baja. Todas estas funciones recorren las listas una vez por clase: cuestan del orden de $n \cdot K$ operaciones.

### `machine.accuracy_score(y_true, y_pred)` { #accuracy_score }

**Qué hace:** Calcula la exactitud: la parte de las respuestas que el modelo acertó.

**Cuándo usarla:** Como primera nota, cuando las clases están **parejas** (más o menos la misma cantidad de cada una).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo, en el mismo orden. |

**Devuelve:** `FLOAT` entre 0 y 1. Un `1.0` es acertar todo. Multiplica por 100 si quieres un porcentaje.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/accuracy_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/accuracy_score.expec"
```

!!! warning "La exactitud puede engañar"
    Si de 100 correos solo 2 son spam, un filtro que **nunca** dice "spam" acierta 98 de 100: exactitud 0.98. Y no atrapó ni uno. Con clases desparejas mira también la precisión y el recall.

??? warning "Error común: listas de distinto tamaño"
    Las dos listas deben medir lo mismo. Este error es igual en todas las métricas:

    ```kafe
    --8<-- "tests/DocsExamples/machine/accuracy_score-length.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/accuracy_score-length.error.stderr.expec"
    ```

### `machine.confusion_matrix(y_true, y_pred)` { #confusion_matrix }

**Qué hace:** Arma la tabla que cuenta cuántas veces cada clase real recibió cada respuesta.

**Cuándo usarla:** Cuando quieres ver **en qué** se equivoca el modelo, no solo cuánto.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo. |

**Devuelve:** `List[List[INT]]`: una tabla cuadrada. La fila es la clase real y la columna es la clase que dijo el modelo. Las clases van ordenadas de menor a mayor. Con dos clases `0` y `1` queda `[[TN, FP], [FN, TP]]`. También funciona con tres clases o más.

**Ejemplo y resultado:** el de [Tu primera matriz de confusión](#classification-first).

### `machine.precision_score(y_true, y_pred)` { #precision_score }

**Qué hace:** Calcula la precisión de cada clase y devuelve el promedio.

**Cuándo usarla:** Cuando una **falsa alarma** sale cara. Por ejemplo, mandar a la basura un correo importante.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo. |

**Devuelve:** `FLOAT` entre 0 y 1: el promedio de la precisión de todas las clases.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/precision_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/precision_score.expec"
```

Es el promedio de 0.8 (normales) y 0.6 (spam). Que coincida con la exactitud es casualidad.

### `machine.recall_score(y_true, y_pred)` { #recall_score }

**Qué hace:** Calcula el recall de cada clase y devuelve el promedio.

**Cuándo usarla:** Cuando **dejar pasar** un caso sale caro. Por ejemplo, una prueba médica que no detecta a un enfermo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo. |

**Devuelve:** `FLOAT` entre 0 y 1: el promedio del recall de todas las clases.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/recall_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/recall_score.expec"
```

Es el promedio de 0.667 (normales) y 0.75 (spam).

### `machine.f1_score(y_true, y_pred)` { #f1_score }

**Qué hace:** Calcula el F1 de cada clase y devuelve el promedio.

**Cuándo usarla:** Cuando quieres **una sola nota** y las clases están desparejas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo. |

**Devuelve:** `FLOAT` entre 0 y 1: el promedio del F1 de todas las clases.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/f1_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/f1_score.expec"
```

Es el promedio de 0.727 (normales) y 0.667 (spam).

### `machine.classification_report(y_true, y_pred)` { #classification_report }

**Qué hace:** Escribe un informe con la precisión, el recall y el F1 de **cada clase**, más los promedios.

**Cuándo usarla:** Cuando quieres ver todas las notas juntas, clase por clase.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. |
| `y_pred` | `List[INT]` o `List[FLOAT]` | Las etiquetas que dijo el modelo. |

**Devuelve:** `STR`: un texto de varias líneas, listo para `show`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/classification_report.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/classification_report.expec"
```

!!! tip "Cómo leer el informe"
    - Hay una fila por clase (`0` y `1`). Son los mismos números que calculamos a mano.
    - `support` es cuántos ejemplos había de esa clase: 6 normales y 4 spam.
    - `macro avg` es el promedio simple de las clases: lo que devuelven `precision_score`, `recall_score` y `f1_score`.
    - `weighted avg` es un promedio donde la clase con más ejemplos pesa más.

### `machine.roc_auc_score(y_true, y_score)` { #roc_auc_score }

**La idea.** Muchos modelos no responden "spam" o "normal" directamente. Dan un **puntaje** entre 0 y 1: "estoy 0.9 seguro de que es spam". Después alguien elige un **umbral** (una raya): por encima de la raya es spam, por debajo es normal.

Si mueves la raya, cambian los errores:

- Raya **alta** (muy exigente): casi nada es spam. Pocas falsas alarmas, pero se escapan muchos spam.
- Raya **baja** (muy desconfiada): casi todo es spam. Atrapas todos, pero con muchas falsas alarmas.

<!-- figura pendiente: 10 puntos sobre una regla de 0 a 1 (4 spam rellenos, 6 normales huecos); una raya vertical (umbral) baja de 0.95 a 0.05 y, al lado, un punto dibuja la curva ROC (falsas alarmas → derecha, spam atrapados → arriba) -->

Estos son los puntajes de nuestros 10 correos. El programa mueve la raya por cinco valores. Para cada uno muestra: la raya, la parte de los spam atrapados y la parte de los normales que fueron falsa alarma:

```kafe
--8<-- "tests/DocsExamples/machine/roc_auc_score-threshold.kf"
```

```text
--8<-- "tests/DocsExamples/machine/roc_auc_score-threshold.expec"
```

Con la raya en 0.5 el filtro atrapa 3 de 4 spam (0.75) y da 2 falsas alarmas de 6 (0.33): es justo la matriz de confusión de arriba. Si dibujas esos pares en un papel (falsas alarmas hacia la derecha, spam atrapados hacia arriba) obtienes la **curva ROC**. El **AUC** es el área que queda debajo de esa curva.

**Las matemáticas a mano.** Hay otra forma de calcular el AUC, sin dibujar nada. Arma todas las **parejas** de un spam con un normal y pregunta: ¿el spam tiene el puntaje más alto?

- Hay 4 spam y 6 normales: 4 × 6 = **24 parejas**.
- Los spam con 0.9, 0.8 y 0.7 les ganan a los 6 normales: 6 + 6 + 6 = 18.
- El spam con 0.3 solo les gana a los cuatro normales con 0.2 y 0.1: 4.
- Parejas ganadas: 18 + 4 = **22**.

$$AUC = \frac{\text{parejas ganadas}}{\text{parejas totales}} = \frac{22}{24} \approx 0.917$$

**Qué hace:** Mide qué tan bien el modelo **ordena** los ejemplos: los positivos con puntaje alto y los negativos con puntaje bajo.

**Cuándo usarla:** Cuando tu modelo da puntajes o probabilidades y quieres una nota que **no dependa** de dónde pongas la raya.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Las etiquetas correctas. Debe haber **exactamente dos** clases. La mayor (por ejemplo `1`) es la positiva. |
| `y_score` | `List[FLOAT]` o una tabla de **una** columna | El puntaje de la clase positiva para cada ejemplo. No pases etiquetas ya decididas. |

**Devuelve:** `FLOAT` entre 0 y 1. Un `1.0` es un orden perfecto; `0.5` es como lanzar una moneda; menos de `0.5` es ordenar al revés.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/roc_auc_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/roc_auc_score.expec"
```

??? warning "Error común: más de dos clases"
    `roc_auc_score` solo sirve para dos clases:

    ```kafe
    --8<-- "tests/DocsExamples/machine/roc_auc_score-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/roc_auc_score-three-classes.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    La curva ROC dibuja la tasa de verdaderos positivos $TPR = \frac{TP}{TP + FN}$ contra la tasa de falsos positivos $FPR = \frac{FP}{FP + TN}$ para todos los umbrales. KAFE no dibuja la curva: usa la fórmula de las parejas (estadístico U de Mann-Whitney), que da la misma área:

    $$AUC = \frac{1}{n_+ \, n_-} \sum_{i \in +} \sum_{j \in -} \left[ \mathbb{1}(s_i > s_j) + \tfrac{1}{2}\,\mathbb{1}(s_i = s_j) \right]$$

    Un empate cuenta medio punto. Compara cada positivo con cada negativo: cuesta $n_+ \cdot n_-$ operaciones.

!!! tip "¿Qué aprendiste?"
    - La matriz de confusión cuenta aciertos y los dos tipos de error: falsas alarmas (FP) y casos que se escapan (FN).
    - Exactitud, precisión, recall y F1 salen todas de esa tabla.
    - El AUC pone nota a los puntajes del modelo, sin elegir una raya.

## Métricas de regresión { #regression-metrics }

### La idea en una frase

Cuando el modelo predice **números**, casi nunca acierta exacto; las métricas de regresión resumen **qué tan lejos** quedó.

### Una comparación de la vida diaria

Juegas a adivinar cuántos caramelos hay en un frasco. Si hay 50 y dices 48, te equivocaste por 2. Ese "por cuánto me equivoqué" es el **error** (también se llama *residuo*):

$$\text{error} = \text{valor real} - \text{predicción}$$

Si juegas varias veces tienes varios errores. Cada métrica es una manera distinta de **resumirlos en un solo número**.

<!-- figura pendiente: 4 puntos reales (4, 6, 8, 10) y sus 4 predicciones (3, 7, 6, 10) unidos por rayitas de error; las rayitas bajan a una fila |e| = 1, 1, 2, 0 y luego se convierten en cuadrados e² = 1, 1, 4, 0 -->

### Las matemáticas con números pequeños { #regression-math }

Un puesto de limonada vendió 4, 6, 8 y 10 vasos en cuatro días. Un modelo había predicho 3, 7, 6 y 10. Hagamos la tabla de errores:

| Día | Real $y$ | Predicción $\hat{y}$ | Error $e = y - \hat{y}$ | Sin signo $\lvert e \rvert$ | Al cuadrado $e^2$ | En porcentaje $\lvert e \rvert \div y$ |
|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 1 | 1 | 1 | 25 % |
| 2 | 6 | 7 | −1 | 1 | 1 | 16.67 % |
| 3 | 8 | 6 | 2 | 2 | 4 | 25 % |
| 4 | 10 | 10 | 0 | 0 | 0 | 0 % |
| **Suma** | | | **2** | **4** | **6** | **66.67 %** |

Con esa misma tabla salen **todas** las métricas:

| Métrica | La cuenta | Resultado |
|---|---|---|
| Error absoluto medio (MAE) | promedio de $\lvert e \rvert$: 4 ÷ 4 | **1** vaso |
| Error cuadrático medio (MSE) | promedio de $e^2$: 6 ÷ 4 | **1.5** vasos² |
| Raíz del MSE (RMSE) | $\sqrt{1.5}$ | **≈ 1.22** vasos |
| Error máximo | el mayor $\lvert e \rvert$ | **2** vasos |
| Error absoluto mediano | ordena 0, 1, 1, 2 y toma el del medio: (1 + 1) ÷ 2 | **1** vaso |
| Error porcentual medio (MAPE) | promedio de los porcentajes: 66.67 ÷ 4 | **≈ 16.67 %** |
| $R^2$ | 1 − 6 ÷ 20 (se explica abajo) | **0.7** |
| Varianza explicada | 1 − 1.25 ÷ 5 (se explica abajo) | **0.75** |

!!! note "¿Por qué quitar el signo o elevar al cuadrado?"
    Si sumas los errores tal cual, los positivos y los negativos **se cancelan**: 1 y −1 dan 0, como si no hubiera error. Por eso se quita el signo ($\lvert e \rvert$) o se eleva al cuadrado ($e^2$). Al cuadrado, además, un error grande pesa mucho más: el error de 2 se convierte en 4.

**¿De dónde sale el 20 de $R^2$?** $R^2$ compara tu modelo con el modelo más flojo posible: uno que **siempre dice el promedio**. El promedio de ventas es (4 + 6 + 8 + 10) ÷ 4 = 7. Los errores de decir siempre 7 serían −3, −1, 1 y 3; al cuadrado suman 9 + 1 + 1 + 9 = **20**. Los errores al cuadrado de nuestro modelo suman **6**.

$$R^2 = 1 - \frac{6}{20} = 0.7$$

El modelo eliminó el 70 % del error que tendría el "modelo del promedio".

Este programa calcula los errores, el MAE, el MSE y el RMSE con un bucle, **sin usar MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error-by-hand.expec"
```

Las cuatro primeras líneas son los errores. Las tres últimas son el MAE, el MSE y el RMSE: los mismos números de la tabla.

??? info "Para curiosos 🤓"
    Con $n$ ejemplos, valores reales $y_i$, predicciones $\hat{y}_i$, errores $e_i = y_i - \hat{y}_i$ y promedios $\bar{y}$ y $\bar{e}$:

    $$MAE = \frac{1}{n}\sum_i \lvert e_i \rvert \qquad MSE = \frac{1}{n}\sum_i e_i^2 \qquad RMSE = \sqrt{MSE}$$

    $$\text{error máximo} = \max_i \lvert e_i \rvert \qquad \text{error mediano} = \operatorname{mediana}(\lvert e_i \rvert) \qquad MAPE = \frac{100}{n}\sum_i \frac{\lvert e_i \rvert}{\lvert y_i \rvert}$$

    $$R^2 = 1 - \frac{\sum_i e_i^2}{\sum_i (y_i - \bar{y})^2} \qquad \text{varianza explicada} = 1 - \frac{\frac{1}{n}\sum_i (e_i - \bar{e})^2}{\frac{1}{n}\sum_i (y_i - \bar{y})^2}$$

    Todas recorren las listas una vez ($n$ operaciones), menos el error mediano, que primero ordena ($n \log n$). Si todos los valores reales son iguales, el denominador es 0: `r2_score` devuelve `1.0` si las predicciones son perfectas y `0.0` si no; `explained_variance_score` devuelve `0.0`.

Todas las funciones de regresión reciben los mismos dos parámetros:

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `y_true` | `List[INT]` o `List[FLOAT]` | Los valores reales. |
| `y_pred` | `List[INT]`, `List[FLOAT]` o una tabla de **una** columna como `[[3.0], [7.0]]` | Las predicciones del modelo, en el mismo orden. |

En todos los ejemplos, `real` son las ventas de limonada y `guess` las predicciones.

### `machine.mean_absolute_error(y_true, y_pred)` { #mean_absolute_error }

**Qué hace:** Calcula el promedio de los errores sin signo (MAE).

**Cuándo usarla:** Cuando quieres decir en palabras sencillas "en promedio, el modelo se equivoca por tanto".

**Devuelve:** `FLOAT`, en las **mismas unidades** que tus datos (vasos, pesos, grados). `0.0` es perfecto.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_absolute_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/mean_absolute_error.expec"
```

### `machine.mean_squared_error(y_true, y_pred)` { #mean_squared_error }

**Qué hace:** Calcula el promedio de los errores al cuadrado (MSE).

**Cuándo usarla:** Cuando un error grande es **mucho peor** que varios pequeños. Es la nota que muchos modelos intentan bajar mientras aprenden.

**Devuelve:** `FLOAT`, en unidades **al cuadrado** (vasos²). `0.0` es perfecto.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error.expec"
```

### `machine.root_mean_squared_error(y_true, y_pred)` { #root_mean_squared_error }

**Qué hace:** Calcula la raíz cuadrada del MSE (RMSE).

**Cuándo usarla:** Cuando quieres castigar los errores grandes como el MSE, pero leer el resultado en las unidades originales.

**Devuelve:** `FLOAT`, en las mismas unidades que tus datos. `0.0` es perfecto.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/root_mean_squared_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/root_mean_squared_error.expec"
```

El RMSE (1.22) es mayor que el MAE (1.0) porque el error de 2 vasos pesa más.

### `machine.max_error(y_true, y_pred)` { #max_error }

**Qué hace:** Devuelve el error más grande, sin signo.

**Cuándo usarla:** Cuando te importa el **peor caso**. Por ejemplo, "¿cuánto es lo máximo que puede fallar mi báscula?".

**Devuelve:** `FLOAT`, en las mismas unidades que tus datos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/max_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/max_error.expec"
```

### `machine.median_absolute_error(y_true, y_pred)` { #median_absolute_error }

**Qué hace:** Ordena los errores sin signo y devuelve el **del medio** (la mediana). Si hay dos en el medio, devuelve su promedio.

**Cuándo usarla:** Cuando tus datos tienen algún valor muy raro y no quieres que un solo error enorme dañe la nota.

**Devuelve:** `FLOAT`, en las mismas unidades que tus datos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/median_absolute_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/median_absolute_error.expec"
```

### `machine.mean_absolute_percentage_error(y_true, y_pred)` { #mean_absolute_percentage_error }

**Qué hace:** Calcula el error promedio como **porcentaje** del valor real (MAPE).

**Cuándo usarla:** Cuando quieres comparar errores de cosas de tamaños muy distintos. Fallar por 1 vaso es mucho si vendiste 4 y poco si vendiste 100.

**Devuelve:** `FLOAT`: un **porcentaje** (16.67 significa 16.67 %), no una fracción entre 0 y 1.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error.expec"
```

??? warning "Error común: un valor real igual a cero"
    Para sacar el porcentaje hay que dividir por el valor real, y no se puede dividir por cero:

    ```kafe
    --8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error-zero.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error-zero.error.stderr.expec"
    ```

    Si tus datos tienen ceros, usa `mean_absolute_error`.

### `machine.r2_score(y_true, y_pred)` { #r2_score }

**Qué hace:** Compara tu modelo con uno que siempre dice el promedio ($R^2$).

**Cuándo usarla:** Cuando quieres una nota **sin unidades**, fácil de comparar entre problemas distintos. Es la misma nota que da `model.score(X, y)` en los modelos de regresión.

**Devuelve:** `FLOAT`. `1.0` es perfecto. `0.0` es igual de bueno que decir siempre el promedio. Puede ser **negativo**: el modelo es peor que decir el promedio.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/r2_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/r2_score.expec"
```

### `machine.explained_variance_score(y_true, y_pred)` { #explained_variance_score }

**Qué hace:** Mide qué parte de los "sube y baja" de los datos sigue el modelo. Se parece a $R^2$, pero **perdona** un error fijo: si el modelo siempre se queda corto por lo mismo, no lo castiga.

**Cuándo usarla:** Junto con `r2_score`. Si las dos notas son distintas, tu modelo tiene un **sesgo**: tiende a quedarse corto o a pasarse.

**Devuelve:** `FLOAT`. `1.0` es lo mejor.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/explained_variance_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/explained_variance_score.expec"
```

!!! tip "La cuenta a mano"
    1. El error promedio es (1 − 1 + 2 + 0) ÷ 4 = **0.5**: el modelo se queda corto medio vaso, en promedio.
    2. Réstale ese 0.5 a cada error: 0.5, −1.5, 1.5 y −0.5. Al cuadrado: 0.25 + 2.25 + 2.25 + 0.25 = 5. El promedio es 5 ÷ 4 = **1.25**.
    3. Los valores reales se alejan de su promedio (7) en −3, −1, 1 y 3. Al cuadrado suman 20; el promedio es 20 ÷ 4 = **5**.
    4. 1 − 1.25 ÷ 5 = **0.75**.

    Da 0.75 y no 0.7 (el $R^2$) justamente por ese medio vaso de sesgo.

!!! tip "¿Qué aprendiste?"
    - El error es el valor real menos la predicción.
    - MAE, MSE, RMSE, error máximo y error mediano son formas distintas de resumir los mismos errores.
    - $R^2$ compara tu modelo con decir siempre el promedio: 1 es perfecto, 0 es igual, negativo es peor.

## Métrica de clustering { #clustering-metrics }

### La idea en una frase

Cuando un modelo arma **grupos** sin que nadie le diga la respuesta, la **silueta** mide si cada punto quedó cerca de su grupo y lejos de los demás.

### Una comparación de la vida diaria

En el recreo los niños se juntan en grupos. Un niño está "bien ubicado" si sus amigos del grupo están **cerca** y los del otro grupo están **lejos**. Si está a la misma distancia de los dos grupos, no queda claro a cuál pertenece.

<!-- figura pendiente: 5 casas sobre una calle (posiciones 1, 2, 3 | 6, 8); desde la casa 2 salen flechas cortas a su grupo (a = 1) y flechas largas al otro (b = 5); aparece s = (5 − 1) / 5 = 0.8 -->

### Las matemáticas con números pequeños { #clustering-math }

Hay cinco casas en una calle, en las posiciones 1, 2, 3, 6 y 8. Un modelo de [clustering](clustering.md) hizo dos grupos: {1, 2, 3} y {6, 8}. Miremos la casa que está en **2**:

1. **$a$: qué tan cerca está de su grupo.** Sus vecinas están en 1 y 3. Las distancias son 1 y 1. Promedio: $a = 1$.
2. **$b$: qué tan lejos está del otro grupo.** Las otras están en 6 y 8. Las distancias son 4 y 6. Promedio: $b = 5$.
3. **$s$: la silueta de esa casa.**

$$s = \frac{b - a}{\max(a, b)} = \frac{5 - 1}{5} = 0.8$$

Cómo leer $s$:

- Cerca de **1**: el punto está en el grupo correcto.
- Cerca de **0**: está en la frontera entre dos grupos.
- **Negativo**: está más cerca de otro grupo que del suyo.

Este programa hace esa cuenta para la casa 2, **sin usar MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/silhouette_score-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/silhouette_score-by-hand.expec"
```

`silhouette_score` repite la cuenta para **cada** casa y devuelve el promedio:

| Casa | $a$ | $b$ | $s$ |
|---|---|---|---|
| 1 | 1.5 | 6 | 0.75 |
| 2 | 1 | 5 | 0.8 |
| 3 | 1.5 | 4 | 0.625 |
| 6 | 2 | 4 | 0.5 |
| 8 | 2 | 6 | ≈ 0.667 |
| **Promedio** | | | **≈ 0.668** |

??? info "Para curiosos 🤓"
    Para cada punto $i$, $a(i)$ es la distancia promedio a los demás puntos de su grupo y $b(i)$ es la menor distancia promedio a los puntos de otro grupo:

    $$s(i) = \frac{b(i) - a(i)}{\max(a(i),\, b(i))} \qquad \text{silueta} = \frac{1}{n}\sum_i s(i)$$

    KAFE usa la distancia euclidiana, $d(p, q) = \sqrt{\sum_k (p_k - q_k)^2}$. Un punto que está solo en su grupo cuenta como $s = 0$. La función calcula la distancia entre **todos** los pares de puntos: cuesta del orden de $n^2 \cdot m$ operaciones para $n$ puntos con $m$ columnas, así que es lenta con muchos datos.

### `machine.silhouette_score(X, labels)` { #silhouette_score }

**Qué hace:** Calcula la silueta promedio de todos los puntos.

**Cuándo usarla:** Después de [`KMeans`, `DBSCAN` u otro modelo de clustering](clustering.md), para saber si los grupos quedaron bien separados o para comparar distintas cantidades de grupos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `X` | `List[List[FLOAT]]` o `List[List[INT]]` | Los puntos: una fila por punto. |
| `labels` | `List[INT]` | El número de grupo de cada punto, en el mismo orden. |

**Devuelve:** `FLOAT` entre −1 y 1. Más cerca de 1 es mejor.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/machine/silhouette_score.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/machine/silhouette_score.expec"
```

??? warning "Error común: un solo grupo"
    La silueta necesita comparar con **otro** grupo. Hacen falta al menos 2 grupos, y menos grupos que puntos:

    ```kafe
    --8<-- "tests/DocsExamples/machine/silhouette_score-one-group.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/silhouette_score-one-group.error.stderr.expec"
    ```

!!! tip "¿Qué aprendiste?"
    - La silueta no necesita respuestas correctas: solo los puntos y sus grupos.
    - Para cada punto compara $a$ (distancia a su grupo) con $b$ (distancia al grupo vecino).
    - Cerca de 1 es un buen grupo; cerca de 0 o negativo, no.

## Las mismas métricas para MACHINE y GESHA { #one-metric-api-for-machine-and-gesha }

Las métricas solo necesitan **dos listas**. No les importa quién hizo las predicciones. Por eso sirven igual para un modelo de MACHINE y para una red neuronal de [GESHA](../gesha.md): entrenas con la librería que quieras y pones la nota con `machine.<métrica>(...)`.

| Tarea | Predicción con MACHINE | Predicción con GESHA | Métrica |
|---|---|---|---|
| Clasificación | `model.predict(X)` | `network.predict_label(X)` | Etiquetas → `machine.accuracy_score` y las demás. |
| ROC AUC con dos clases | Puntajes del modelo | `network.predict(X)` | Puntajes sin redondear → `machine.roc_auc_score`. |
| Regresión con una salida | `model.predict(X)` | `network.predict(X)` | Números → `machine.mean_squared_error`, `machine.r2_score`… |

Un detalle de GESHA: `network.predict(X)` devuelve una **tabla** con una fila por ejemplo, como `[[0.2], [0.9]]`. Las métricas de regresión y `roc_auc_score` aceptan esa tabla de **una columna** además de una lista simple. Las métricas de clasificación necesitan **etiquetas** en una lista simple: usa `predict_label`. Si la red tiene varias salidas por ejemplo (`[[0.1, 0.9], ...]`), las métricas no pueden elegir una sola por ti y dan error.

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error-gesha.kf"
```

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error-gesha.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Se creó una red de GESHA con una sola neurona y se entrenó 5 vueltas (por eso ves 5 líneas `Epoch`).
    2. `network.predict(X)` devolvió una tabla de una columna.
    3. `machine.mean_squared_error(y, p)` aceptó esa tabla y calculó el MSE. Sale alto (2.52) porque 5 vueltas son muy pocas para aprender.

En un trabajo real, primero [separa los datos](selection.md) en entrenamiento y prueba, y calcula la métrica con los de **prueba**.

## ¿Qué métrica uso? { #which-metric }

| Tu situación | Usa |
|---|---|
| Clasifico y mis clases están parejas | `accuracy_score` |
| Una falsa alarma sale cara (borrar un correo bueno) | `precision_score` |
| Dejar pasar un caso sale caro (no detectar una enfermedad) | `recall_score` |
| Clases desparejas y quiero una sola nota | `f1_score` |
| Quiero ver con qué se confunde el modelo | `confusion_matrix` |
| Quiero todas las notas, clase por clase | `classification_report` |
| Mi modelo da puntajes o probabilidades (dos clases) | `roc_auc_score` |
| Predigo números y quiero el error típico, fácil de explicar | `mean_absolute_error` |
| Predigo números y los errores grandes son muy graves | `mean_squared_error` o `root_mean_squared_error` |
| Me importa el peor caso | `max_error` |
| Hay datos muy raros que no quiero que dañen la nota | `median_absolute_error` |
| Quiero el error en porcentaje (sin ceros en los valores reales) | `mean_absolute_percentage_error` |
| Quiero una nota sin unidades, donde 1 es perfecto | `r2_score` |
| Quiero saber si el modelo tiene un sesgo fijo | `explained_variance_score` junto con `r2_score` |
| Hice grupos y no tengo respuestas correctas | `silhouette_score` |

## ¿Qué aprendiste?

- Una métrica compara las respuestas correctas con las del modelo y devuelve una nota.
- En clasificación todo sale de la matriz de confusión; en regresión, de la lista de errores; en clustering, de las distancias.
- No hay una métrica "mejor": eliges según qué error te duele más.

[Volver a MACHINE :material-arrow-left:](../machine.md){ .md-button }
[Siguiente librería: GESHA :material-arrow-right:](../gesha.md){ .md-button .md-button--primary }
