# GESHA: modelos y entrenamiento

Un **modelo** es una lista ordenada de capas. Esta página explica cómo armarlo, cómo elegir **cómo aprende** (`compile`), cómo entrenarlo (`fit`), cómo preguntarle (`predict`) y cómo saber si de verdad aprendió.

Si todavía no lo hiciste, lee el [resumen de GESHA](../gesha.md) y las [redes densas](dense-networks.md).

## Armar el modelo { #assembly }

| Función | Qué hace |
|---|---|
| `gesha.sequential([capa1, capa2, ...])` | Apila las capas en ese orden. La salida de una es la entrada de la siguiente. |
| `model.add(capa)` | Agrega una capa al final (solo `sequential`). |
| `gesha.functional(entrada, salida)` | Un grafo con ramas y uniones. Ver la nota al final. |
| `gesha.input_layer(forma)` | El nodo de entrada de un grafo `functional`. |
| `model.summary()` | Imprime la arquitectura. |

## Elegir cómo aprende: `compile` { #compile }

`model.compile(optimizador, pérdida, métricas)` elige **la regla para dar pasos** y **cómo medir el error**. Es obligatorio antes de `fit`. Después, `model.set_lr(tasa)` cambia el tamaño de los pasos.

### Las pérdidas { #losses }

| Pérdida (nombre corto) | Para | Qué mide |
|---|---|---|
| `"binary_crossentropy"` (`"bce"`) | Sí o no, con salida `"sigmoid"` | Castiga mucho estar muy seguro y equivocado. |
| `"sparse_categorical_crossentropy"` (`"scce"`) | Varias clases con `y` como número, salida `"softmax"` | Lo mismo, para varias clases. |
| `"categorical_crossentropy"` (`"cce"`) | Varias clases con `y` como vector one-hot | Lo mismo, con respuestas one-hot. |
| `"mse"` (`"mean_squared_error"`) | Un número, salida `"linear"` | El promedio de los errores al cuadrado. |
| `"mae"` (`"mean_absolute_error"`) | Un número | El promedio de los errores sin signo. |

### Los optimizadores { #optimizers }

Todos mueven los pesos **en contra del gradiente**; cambian en **cómo** eligen el tamaño de cada paso.

| Optimizador | Idea |
|---|---|
| `"sgd"` | El paso es siempre `tasa × gradiente`. Simple y predecible. |
| `"adam"` | Recuerda los gradientes anteriores (un "impulso") y ajusta el paso de cada peso por separado. |
| `"rmsprop"` | Achica el paso de los pesos cuyos gradientes son grandes. |
| `"adamw"` | Adam que además encoge un poco los pesos en cada paso. |

Una comparación con la regresión $y = 2x + 1$ (para $x = 4$ la respuesta exacta es 9), con la misma tasa y 6 épocas:

```kafe
--8<-- "tests/DocsExamples/gesha/training-optimizers.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-optimizers.expec"
```

!!! tip "¿Qué pasó aquí?"
    Con este problema tan pequeño, `"sgd"` llegó más cerca (`9.03`). Adam y RMSprop dan pasos más prudentes al principio y necesitan más épocas. **Ningún optimizador gana siempre**: depende de los datos, de la tasa y de las épocas.

??? info "Para curiosos 🤓"
    SGD: $w \leftarrow w - \eta\,g$. Adam guarda un promedio de los gradientes $m$ y de sus cuadrados $v$: $m \leftarrow \beta_1 m + (1-\beta_1)g$, $v \leftarrow \beta_2 v + (1-\beta_2)g^2$, y da el paso $w \leftarrow w - \eta\,\hat{m}/(\sqrt{\hat{v}} + \varepsilon)$. RMSprop usa solo $v$. Los optimizadores viven en `src/lib/KafeGESHA/optimizers/`.

## Entrenar: `fit` { #fit }

`model.fit(X, y, épocas, tamaño_de_lote, X_val, y_val, lambda, callbacks)`. Los argumentos van **por posición**.

| Argumento | Qué significa |
|---|---|
| `X`, `y` | Los ejemplos y sus respuestas. Con `y` vacío (`[]`) se usa el [clustering suave](soft-clustering.md). |
| `épocas` | Cuántas vueltas a todos los ejemplos. |
| `tamaño_de_lote` | Cuántos ejemplos se miran antes de ajustar los pesos (entero positivo). |
| `X_val`, `y_val` | Datos aparte para **vigilar** el entrenamiento (opcional). |
| `lambda` | Castigo extra a los pesos grandes (opcional). |
| `callbacks` | Herramientas como la [parada temprana](training-tools.md) (opcional). |

Cada época imprime una línea con la **pérdida** y, si es clasificación, la **exactitud** sobre los ejemplos de entrenamiento. `fit` no mezcla los ejemplos ni separa datos por ti.

### Vigilar con datos de validación { #validation }

La pérdida de entrenamiento casi siempre baja. La pregunta importante es si el modelo funciona con **datos que no vio**. Para eso se pasan datos de validación:

```kafe
--8<-- "tests/DocsExamples/gesha/training-validation.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-validation.expec"
```

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-validation-loss.svg"
<figcaption>Las dos curvas de este ejemplo. La pérdida de entrenamiento baja de 1.05 a 0.37. La de validación baja de 0.45 a 0.06 y en la época 6 sube un poco; el anillo marca la época 5, su punto más bajo.</figcaption>
</figure>

!!! tip "¿Qué pasó aquí?"
    `val_loss` bajó hasta la época 5 y en la 6 subió un poco (`0.0619` → `0.0651`). Si siguiera subiendo mientras la de entrenamiento baja, el modelo estaría **memorizando** en vez de aprender (*sobreajuste*). La [parada temprana](training-tools.md) detiene el entrenamiento justo ahí.

## Preguntar: `predict` { #predict }

| Método | Devuelve |
|---|---|
| `model.predict(x)` | Los números de la salida: una probabilidad, un vector softmax o un número. |
| `model.predict_label(x)` | La clase: corta en 0.5 si hay una salida, o elige la mayor si hay varias. |
| `model.predict_proba(x)` | Lo mismo que `predict` (no convierte una regresión en probabilidad). |

Puedes pasar un ejemplo o una lista. Para **una sola imagen o secuencia**, envuélvela en una lista: `model.predict([imagen])`.

## Medir de verdad: métricas de MACHINE { #metrics }

GESHA no tiene `evaluate`: para medir con datos de prueba se usan las [métricas de MACHINE](../machine/metrics.md).

```kafe
--8<-- "tests/DocsExamples/gesha/training-metrics.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-metrics.expec"
```

La red se entrenó con 4 ejemplos y acertó los 4 de prueba, que nunca vio: exactitud `1.0` y una matriz de confusión sin errores. Para regresión usa, por ejemplo, `machine.mean_squared_error(y, model.predict(X))`.

## Guardar y cargar pesos { #weights }

`model.save_weights("archivo.json")` guarda los pesos y `model.load_weights("archivo.json")` los recupera. Antes de cargar hay que construir **la misma arquitectura**. El archivo no guarda la arquitectura, el estado del optimizador, ni el promedio y la varianza internos de `batch_normalization`, ni tu preprocesamiento: guarda también la escala que usaste en tus datos.

## Errores comunes { #errors }

??? warning "`X` e `y` con distinta cantidad"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/training-mismatch.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/training-mismatch.error.stderr.expec"
    ```

| Síntoma | Causa probable |
|---|---|
| Error de forma en la primera capa | El `input_shape` no coincide con cada ejemplo. |
| "Modelo no compilado" | Llamaste a `fit` o `set_lr` antes de `compile`. |
| La pérdida no baja | Tasa muy pequeña, muy pocas épocas, o datos sin escalar. |
| La pérdida sube y baja mucho | Tasa demasiado grande. |

## Detalles técnicos { #details }

- `gesha.compile(model, opt, pérdida, métricas)` y `gesha.set_lr(model, tasa)` son formas alternativas de `model.compile` y `model.set_lr`; la primera exige los cuatro argumentos.
- El argumento `métricas` se acepta, pero lo que realmente se informa es la exactitud de las pérdidas de entropía cruzada y la `val_loss` si hay validación.
- Para pasar callbacks sin validación: `model.fit(X, y, épocas, lote, [], [], 0.0, [callback])`.
- Con 0 épocas no hay aprendizaje: sirve solo para comprobar la configuración.
- `gesha.functional` acepta un nodo de entrada y uno de salida; hay un ejemplo probado de una rama que se une con `add_layer`. Otras formas de grafo son experimentales.
- `model.forward`, `model.backward` y `model.parameters()` existen para inspección avanzada; los parámetros crudos son objetos de Python que KAFE no puede guardar como `List[GESHA]`.
- Un lote acumula los gradientes de sus ejemplos y ajusta una vez. Una capa densa cuesta del orden de $n \cdot m$ operaciones por ejemplo, en la ida y en la vuelta.
- Ver [cobertura y límites de la API](api-coverage.md) para todo lo soportado.
