# Cuentas con listas de números

Estas funciones trabajan con **listas** de números (lo viste en [Variables y tipos](../../aprende/variables.md)). Sirven para sumar notas, multiplicar factores o medir distancias entre puntos. Para medir distancias usan el **teorema de Pitágoras**: si caminas 4 pasos a la derecha y 3 hacia arriba, la línea recta de regreso mide 5.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-triangulo.svg"
<figcaption>De (0, 0) a (4, 3): 4 a la derecha, 3 hacia arriba y una línea recta de 5. Eso calculan `hypot` y `dist`.</figcaption>
</figure>

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.sum(list) · math.sum(start, end)` { #sum }

**Qué hace:** Con una lista, **suma** todos sus elementos. Con dos enteros, suma todos los enteros desde `start` hasta `end`.

**Cuándo usarla:** Para totales: puntos de un juego, gastos de la semana.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | Los números a sumar. |
| `start, end` | `INT` | O bien dos enteros: el rango a sumar. |

**Devuelve:** `INT` o `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/sum.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/sum.expec"
```

!!! note "Ojo"
    Con un solo entero (`math.sum(5)`) la versión actual falla: pasa una lista o dos enteros.

*También existe con el nombre `math.sum_range`.*

### `math.prod(list) · math.prod(start, end)` { #prod }

**Qué hace:** Como `sum`, pero **multiplica**.

**Cuándo usarla:** Para combinar factores: `prod(1, 5)` es lo mismo que `factorial(5)`.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | Los números a multiplicar. |
| `start, end` | `INT` | O bien dos enteros: el rango. |

**Devuelve:** `INT` o `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/prod.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/prod.expec"
```

*También existe con el nombre `math.prod_range`.*

### `math.fsum(list)` { #fsum }

**Qué hace:** Suma una lista de decimales **con máxima precisión**, sin acumular errores.

**Cuándo usarla:** Cuando sumas muchos decimales: diez veces 0.1 con `+` no da exactamente 1, pero con `fsum` sí.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | Los números a sumar. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/fsum.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/fsum.expec"
```

### `math.sumprod(p, q)` { #sumprod }

**Qué hace:** Multiplica los elementos de dos listas por parejas y suma los resultados: $p_1 q_1 + p_2 q_2 + \dots$

**Cuándo usarla:** Es exactamente lo que hace una **neurona** con sus entradas y pesos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `p` | `List[INT] | List[FLOAT]` | Primera lista (por ejemplo, entradas). |
| `q` | `List[INT] | List[FLOAT]` | Segunda lista, del mismo tamaño (por ejemplo, pesos). |

**Devuelve:** `INT` o `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/sumprod.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/sumprod.expec"
```

### `math.dist(p, q)` { #dist }

**Qué hace:** Mide la **distancia en línea recta** entre dos puntos.

**Cuándo usarla:** Para saber qué tan lejos están dos lugares, o qué tan parecidos son dos datos (así funciona KNN).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `p` | `List[INT] | List[FLOAT]` | Coordenadas del primer punto. |
| `q` | `List[INT] | List[FLOAT]` | Coordenadas del segundo punto. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/dist.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/dist.expec"
```

??? info "Para curiosos 🤓"
    $d(p, q) = \sqrt{\sum_i (p_i - q_i)^2}$

### `math.hypot(x, y, ...)` { #hypot }

**Qué hace:** Calcula la **hipotenusa**: la distancia desde el origen hasta el punto `(x, y, ...)`.

**Cuándo usarla:** Para el lado largo de un triángulo rectángulo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x, y, ...` | `INT | FLOAT` | Las coordenadas. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/hypot.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/hypot.expec"
```

??? info "Para curiosos 🤓"
    $\text{hypot}(x, y) = \sqrt{x^2 + y^2}$

[Siguiente: Comprobar números :material-arrow-right:](checks.md){ .md-button .md-button--primary }
