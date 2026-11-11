# MACHINE: máquinas que aprenden de ejemplos

La librería **MACHINE** tiene los algoritmos clásicos de *Machine Learning*: modelos que **aprenden de ejemplos** en lugar de seguir reglas que tú escribes. Está inspirada en *scikit-learn*, la librería más usada en Python, pero cada algoritmo está escrito desde cero dentro de KAFE para que puedas ver cómo funciona.

Si nunca has oído hablar de aprender de datos, lee primero la lección [¿Qué es aprender de datos?](../aprende/aprender-de-datos.md).

## La idea: enseñar y después preguntar { #idea }

Con un programa normal, tú escribes la regla ("si pesa más de 100 g, es una manzana"). Con MACHINE haces al revés: le das **ejemplos con su respuesta** y el modelo descubre la regla.

Todos los modelos trabajan en dos momentos:

- **`fit` (enseñar):** el modelo mira los ejemplos y guarda lo que aprendió. Es como estudiar con ejercicios resueltos.
- **`predict` (preguntar):** le das datos nuevos, sin respuesta, y el modelo responde con lo que aprendió. Es como el examen.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-fit-predict.svg"
<figcaption>Con `fit`, los ejemplos (pregunta y respuesta) entran al modelo y este guarda unos números: lo que aprendió. Con `predict`, entra una pregunta nueva y sale la respuesta.</figcaption>
</figure>

## Tu primer modelo { #first-model }

Tenemos seis frutas. De cada una sabemos su **peso** en gramos y su **diámetro** en centímetros, y si es una manzana (`0`) o una uva (`1`):

```kafe
--8<-- "tests/DocsExamples/machine/overview-first-model.kf"
```

```text
--8<-- "tests/DocsExamples/machine/overview-first-model.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `import machine;` trajo la librería.
    2. `machine.knn(3)` creó un modelo vacío. Su tipo en KAFE es `MACHINE`.
    3. `model.fit(fruits, kind)` le enseñó las seis frutas con su respuesta.
    4. `model.predict(...)` le preguntó por dos frutas nuevas: una de 155 g (respondió `0`, manzana) y una de 22 g (respondió `1`, uva).
    5. `model.score(...)` le puso nota: `1.0` significa que acertó todas.

## Las palabras que vas a ver { #words }

| Palabra | Qué significa |
|---|---|
| **Ejemplo** (o muestra) | Una fila de datos: una fruta, una casa, un estudiante. |
| **Característica** (*feature*) | Un dato que sabes de cada ejemplo: el peso, el tamaño. Es una columna. |
| `X` | La tabla con las características: una fila por ejemplo. |
| `y` | La lista con la respuesta correcta de cada ejemplo. |
| **Regresión** | Predecir **un número**: un precio, una nota. |
| **Clasificación** | Predecir **un grupo**: manzana o uva, sí o no. |
| **Clustering** | Encontrar grupos cuando **nadie te dio las respuestas**. |
| **Entrenar** | Lo que hace `fit`: aprender de los ejemplos. |

## Tres familias, tres formas de usarlas { #families }

| Familia | Qué hace | Cómo se usa |
|---|---|---|
| **Modelos con respuestas** (regresión y clasificación) | Aprenden de ejemplos que traen la respuesta. | `fit(X, y)` → `predict(X)` → `score(X, y)` |
| **Modelos sin respuestas** (clustering) | Buscan grupos por su cuenta. | `fit(X)` → `predict(X)` o `fit_predict(X)` |
| **Transformadores** (preparar datos) | Cambian los datos para que el modelo aprenda mejor. | `fit(X)` → `transform(X)` o `fit_transform(X)` |

## Cómo funciona por dentro { #inside }

MACHINE vive en la carpeta `src/lib/KafeMACHINE/`. No hay magia: son clases de Python con bucles y sumas.

| Archivo o carpeta | Qué guarda |
|---|---|
| `functions.py` | Las funciones que llamas con `machine.`: una por cada modelo (`linear_regression`, `knn`, `kmeans`…). Cada una solo **crea** el modelo y te lo devuelve. |
| `BaseMachine.py` | La clase `BaseMachine`, el "molde" del que salen todos los modelos. |
| `linear/`, `tree/`, `neighbors/`, `clustering/`… | Una carpeta por familia, con un archivo por algoritmo. |
| `metrics.py` | Las funciones que ponen nota: `accuracy_score`, `r2_score`… |

Esto es lo que pasa cuando escribes `model.fit(X, y)`:

1. **El intérprete busca el método.** `model` guarda un objeto de Python (por ejemplo, un `KNN`). KAFE busca en ese objeto un método llamado `fit`.
2. **Un "portero" revisa los tipos.** Antes de calcular, comprueba que `X` sea una lista o una tabla de números y que `y` sea una lista. Si no, se detiene con un mensaje.
3. **El modelo revisa la forma de los datos.** Si le diste una lista simple, la convierte en una tabla de una columna. Comprueba que todas las filas midan lo mismo.
4. **El algoritmo aprende** y guarda el resultado dentro del objeto, en propiedades que terminan en guion bajo, como `coef_` o `cluster_centers_`.
5. **Se marca como entrenado.** Todos los modelos tienen un interruptor interno. `fit` lo enciende.

Cuando después llamas a `predict`, lo primero que hace el modelo es mirar ese interruptor. Si está apagado, responde `Must call fit before predict`.

!!! note "El guion bajo al final"
    Las propiedades que el modelo **aprendió** terminan en `_` (`coef_`, `intercept_`, `labels_`). Así las distingues de los ajustes que tú elegiste al crearlo. Se leen sin paréntesis: `model.coef_`.

??? info "Para curiosos 🤓"
    `BaseMachine` da tres cosas a todos los modelos: el interruptor `_is_fitted`, una función que saca los datos de una tabla `PARDOS` y una que valida la forma de la matriz. Si llamas un método que el modelo no tiene (por ejemplo `transform` en una regresión), el molde responde `does not support transform()`.

## Mapa de la librería { #map }

| Página | Qué aprendes |
|---|---|
| [Modelos lineales y SVM](machine/linear.md) | Rectas para predecir números y para separar grupos. |
| [Clasificación y árboles](machine/classifiers.md) | Vecinos cercanos, árboles de decisión, bosques y más. |
| [Clustering y ensambles](machine/clustering.md) | Encontrar grupos sin respuestas, y juntar muchos modelos débiles en uno fuerte. |
| [Preprocesamiento y reducción](machine/preprocessing.md) | Preparar los datos: escalar, rellenar huecos, convertir textos en números. |
| [Selección de modelos](machine/selection.md) | Separar datos para el examen, probar varios ajustes y encadenar pasos. |
| [Funciones y métricas](machine/metrics.md) | Ponerle nota a un modelo. |

Para quien necesita el detalle técnico exacto (en inglés): [contratos y límites de la API](machine/contracts.md) y [conceptos de aprendizaje](machine/learning-concepts.md). También hay [ejemplos completos por algoritmo](../ejemplos/machine-kaggle.md).

## Errores comunes { #errors }

??? warning "Olvidar el `import`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/overview-no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/overview-no-import.error.stderr.expec"
    ```

??? warning "Pedirle a un modelo algo que no sabe hacer"
    Una regresión predice; no transforma datos:

    ```kafe
    --8<-- "tests/DocsExamples/machine/overview-unknown-method.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/overview-unknown-method.error.stderr.expec"
    ```

!!! note "Los argumentos van en orden"
    En KAFE los argumentos se escriben **en orden y sin nombre**: `machine.knn(3)`, no `machine.knn(k=3)`.

## ¿Qué aprendiste?

- Un modelo de MACHINE aprende de ejemplos con `fit` y responde con `predict`.
- `X` es la tabla de características y `y` es la lista de respuestas.
- Por dentro, cada modelo es una clase que guarda lo que aprendió en propiedades que terminan en `_`.

[Empezar: la recta que mejor pasa :material-arrow-right:](machine/linear.md){ .md-button .md-button--primary }
[Siguiente librería: GESHA :material-arrow-right:](gesha.md){ .md-button }
