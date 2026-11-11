# ¿Qué es aprender de datos?

## La idea en una frase

**Machine Learning** (aprendizaje automático) es enseñarle a la computadora con **ejemplos** en lugar de escribirle cada regla.

## Una comparación de la vida diaria

Cuando eras pequeño nadie te dio una regla exacta para reconocer a un perro ("cuatro patas, cola, mide entre…"). Viste **muchos perros**, alguien te dijo "eso es un perro" y tu cerebro encontró el patrón solo. Hoy reconoces perros que nunca habías visto.

Un modelo de Machine Learning hace lo mismo:

1. Le das **ejemplos** con su respuesta correcta (los **datos de entrenamiento**).
2. El modelo busca un **patrón** que una los datos con las respuestas. A esto se le llama **entrenar**.
3. Le das un caso nuevo y el modelo **predice** la respuesta usando el patrón.

## Palabras nuevas

| Palabra | Qué significa | Ejemplo |
|---|---|---|
| **Dato** o ejemplo | Una observación | Un estudiante |
| **Característica** | Lo que medimos de cada dato | Horas que estudió |
| **Etiqueta** | La respuesta que queremos predecir | La nota que sacó |
| **Modelo** | La "máquina" que aprende el patrón | Una recta |
| **Entrenar** (`fit`) | Buscar el patrón en los ejemplos | Ajustar la recta |
| **Predecir** (`predict`) | Usar el patrón con datos nuevos | Adivinar la nota |

## Predecir un número: regresión

Queremos saber qué nota sacará alguien según las horas que estudió. Tenemos cinco ejemplos. El modelo **regresión lineal** busca la recta que mejor pasa por los puntos y la usa para predecir.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datos-recta.svg"
<figcaption>Aparecen los ejemplos, el modelo traza la recta que mejor los une y luego la usa para predecir el valor de un caso nuevo (6 horas).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/aprende/datos-regresion.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/datos-regresion.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `import machine;` trae la librería de Machine Learning de KAFE.
    2. `machine.linear_regression()` creó un modelo vacío, que todavía no sabe nada.
    3. `modelo.fit(horas, notas)` lo **entrenó**: encontró que cada hora de estudio suma 0.5 a la nota.
    4. `modelo.predict([6.0])` **predijo** la nota con 6 horas: 4.5.

!!! note "¿Por qué sale 4.500000000000002 y no 4.5?"
    Las computadoras guardan los números decimales en binario, y algunos no se pueden guardar exactos, igual que 1/3 = 0.3333… no se puede escribir exacto en decimal. Esa diferencia minúscula es normal.

## Predecir una categoría: clasificación

A veces la respuesta no es un número sino una **categoría**: ¿uva o sandía?, ¿spam o no spam? El modelo **vecinos más cercanos** (KNN) mira los ejemplos que más se parecen al caso nuevo y elige la categoría que más se repite entre ellos.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datos-vecinos.svg"
<figcaption>Llega un punto nuevo (?). El modelo mira sus 3 vecinos más cercanos: los tres son cuadrados, así que el punto nuevo también es un cuadrado.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/aprende/datos-clasificacion.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/datos-clasificacion.expec"
```

La fruta de 6.5 g se parece a las uvas (0) y la de 3200 g a las sandías (1).

## ¿Cómo sé si mi modelo es bueno?

Así como un profesor no evalúa con las mismas preguntas que usó para enseñar, nosotros **separamos los datos**: unos para entrenar y otros, que el modelo nunca vio, para **probar**. Luego medimos qué tan bien le fue con **métricas** como la exactitud (porcentaje de aciertos). Lo verás en [Selección de modelos](../libraries/machine/selection.md) y [Funciones y métricas](../libraries/machine/metrics.md).

## ¿Qué aprendiste?

- Machine Learning es aprender patrones a partir de **ejemplos**.
- **Regresión** predice números y **clasificación** predice categorías.
- En KAFE: creas el modelo, lo entrenas con `fit` y predices con `predict`.

??? info "Para curiosos 🤓"
    La regresión lineal busca la recta $\hat{y} = w\,x + b$ que hace más pequeño el **error cuadrático medio**:

    $$
    \text{MSE} = \frac{1}{n}\sum_{i=1}^{n} \left(y_i - \hat{y}_i\right)^2
    $$

    Con nuestros datos encuentra $w = 0.5$ y $b = 1.5$, así que para $x = 6$: $\hat{y} = 0.5 \cdot 6 + 1.5 = 4.5$. KNN, en cambio, no aprende una fórmula: guarda los ejemplos y mide **distancias** cuando llega un caso nuevo.

[Siguiente lección: ¿Qué es una neurona? :material-arrow-right:](neuronas.md){ .md-button .md-button--primary }
