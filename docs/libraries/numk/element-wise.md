# NUMK: operaciones casilla por casilla

Imagina dos hojas de cálculo del mismo tamaño, una encima de la otra. Una operación **casilla por casilla** (en inglés, *element-wise*) junta cada casilla con la casilla que tiene justo debajo: la de arriba a la izquierda con la de arriba a la izquierda, y así con todas. Por eso las dos tablas tienen que medir **lo mismo**.

## Sumar y restar tablas { #add-sub }

Piensa en una tienda con dos sucursales. Cada tabla guarda cuántos productos se vendieron. Para saber el total, sumas casilla con casilla.

### `numk.add(a, b)` { #add }

**Qué hace:** Suma dos matrices casilla por casilla.

**Cuándo usarla:** Para juntar dos tablas del mismo tamaño, como las ventas del lunes y del martes.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | La primera matriz. |
| `b` | `List[List[INT | FLOAT]]` | La segunda matriz, del mismo tamaño. |

**Devuelve:** Una matriz nueva con las sumas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/add.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/add.expec"
```

!!! note "Ojo"
    `add` y `sub` solo aceptan **matrices** (listas de listas). Para sumar vectores u otros tensores, usa [`broadcast_add`](broadcasting.md#broadcast_add).

??? warning "Error común"
    Si las tablas no miden lo mismo, no hay pareja para cada casilla:

    ```kafe
    --8<-- "tests/DocsExamples/numk/add-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/add-shape.error.stderr.expec"
    ```

### `numk.sub(a, b)` { #sub }

**Qué hace:** Resta dos matrices casilla por casilla: a cada casilla de `a` le quita la casilla de `b`.

**Cuándo usarla:** Para ver cuánto queda, por ejemplo lo que había en la bodega menos lo que se vendió.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | La matriz de la que restas. |
| `b` | `List[List[INT | FLOAT]]` | La matriz que restas, del mismo tamaño. |

**Devuelve:** Una matriz nueva con las restas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/sub.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/sub.expec"
```

## Multiplicar casilla por casilla { #multiply }

Hay dos maneras de multiplicar tablas. Aquí está la sencilla: cada casilla por su pareja. La otra, "fila por columna", está en [Multiplicar matrices](matrix-multiplication.md).

### `numk.emul(a, b)` { #emul }

**Qué hace:** Multiplica casilla por casilla dos tensores de la misma forma. Funciona con vectores, matrices y tensores.

**Cuándo usarla:** Para calcular cuánto pagas por cada producto: cantidad × precio.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[...]` de números | El primer tensor. |
| `b` | `List[...]` de números | El segundo tensor, de la misma forma. |

**Devuelve:** Un tensor nuevo con los productos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/emul.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/emul.expec"
```

2 cosas de 5 son 10, 1 de 10 son 10 y 3 de 4 son 12.

??? info "Para curiosos 🤓"
    Esta multiplicación se llama **producto de Hadamard** y se escribe $C = A \odot B$, con $C_{ij} = A_{ij} \cdot B_{ij}$.

### `numk.scalar_mul(scalar, data)` { #scalar_mul }

**Qué hace:** Multiplica **todas** las casillas por un mismo número (un **escalar**: un número solo, no una lista).

**Cuándo usarla:** Para duplicar una receta, o para aplicar un descuento del 50 % a todos los precios.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `scalar` | `INT | FLOAT` | El número por el que multiplicas. |
| `data` | `List[...]` de números | El tensor. |

**Devuelve:** Un tensor nuevo de la misma forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/scalar_mul.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/scalar_mul.expec"
```

## Aplicar una función a cada número { #map }

A veces quieres hacerle lo mismo a cada número: elevarlo al cuadrado, quitarle el signo… Es como pasar cada fruta de una canasta por la misma licuadora.

### `numk.map_elements(function, data, ...)` { #map_elements }

**Qué hace:** Aplica tu propia función a cada casilla. Si das varios tensores de la misma forma, la función recibe un número de cada uno.

**Cuándo usarla:** Cuando NUMK no tiene la cuenta que necesitas: la escribes tú como [lambda](../../aprende/funciones.md) y NUMK la aplica en todas partes.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `function` | `FUNC` | La función que recibe uno o más números y devuelve uno. |
| `data, ...` | `List[...]` de números | Uno o más tensores de la misma forma. Debe haber tantos como datos recibe la función. |

**Devuelve:** Un tensor nuevo de la misma forma con los resultados.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/map_elements.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/map_elements.expec"
```

`middle` recibe un número de cada lista: (1 + 5) / 2 = 3.0, (8 + 2) / 2 = 5.0 y (3 + 9) / 2 = 6.0.

### `numk.exp_tensor(data)` { #exp_tensor }

**Qué hace:** Calcula la **exponencial** ($e^x$) de cada casilla, con [`math.exp`](../math/powers.md#exp).

**Cuándo usarla:** En redes neuronales, para funciones como *softmax*, que convierten puntajes en probabilidades.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |

**Devuelve:** Un tensor de `FLOAT` de la misma forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/exp_tensor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/exp_tensor.expec"
```

!!! note "Ojo"
    Los últimos decimales pueden no ser exactos: `math.exp` está escrita desde cero en KAFE y la computadora redondea un poquito.

### `numk.abs_tensor(data)` { #abs_tensor }

**Qué hace:** Quita el signo menos de cada casilla (el **valor absoluto**).

**Cuándo usarla:** Para medir el tamaño de varios errores sin importar si son por arriba o por abajo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |

**Devuelve:** Un tensor nuevo de la misma forma, sin negativos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/abs_tensor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/abs_tensor.expec"
```

## ¿Qué aprendiste?

- Casilla por casilla significa juntar cada número con su pareja en la misma posición.
- `add`, `sub` y `emul` necesitan tablas del mismo tamaño.
- `scalar_mul` multiplica todo por un solo número.
- Con `map_elements` aplicas tu propia función a cada casilla.

[Siguiente: multiplicar matrices :material-arrow-right:](matrix-multiplication.md){ .md-button .md-button--primary }
