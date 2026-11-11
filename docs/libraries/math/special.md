# Funciones especiales

Estas funciones aparecen en estadística y probabilidad. No las necesitarás al empezar, pero es bueno saber que existen.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.erf(x)` { #erf }

**Qué hace:** **Función de error**: relacionada con la probabilidad en la famosa "campana de Gauss".

**Cuándo usarla:** En estadística, para calcular probabilidades de datos normales.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT` entre -1 y 1

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/erf.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/erf.expec"
```

### `math.erfc(x)` { #erfc }

**Qué hace:** Complemento de la función de error: $1 - \text{erf}(x)$.

**Cuándo usarla:** Para la probabilidad de las "colas" de la campana.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/erfc.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/erfc.expec"
```

### `math.gamma(x)` { #gamma }

**Qué hace:** **Función gamma**. En KAFE, para enteros positivos: $\Gamma(n) = (n-1)!$

**Cuándo usarla:** En probabilidad y combinatoria.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un entero positivo. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/gamma.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/gamma.expec"
```

!!! note "Ojo"
    La versión actual solo acepta enteros positivos; con decimales da error.

??? warning "Error común"
    ```kafe
    --8<-- "tests/DocsExamples/math/gamma-fraction.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/gamma-fraction.error.stderr.expec"
    ```

### `math.lgamma(x)` { #lgamma }

**Qué hace:** Logaritmo natural de `gamma(x)`.

**Cuándo usarla:** Cuando `gamma` daría un número gigantesco.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un entero positivo. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/lgamma.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/lgamma.expec"
```

[Siguiente librería: FILES :material-arrow-right:](../files.md){ .md-button .md-button--primary }
