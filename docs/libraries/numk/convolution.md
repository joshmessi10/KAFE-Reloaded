# NUMK: convolución

Imagina que miras una foto con una **lupa pequeña**. Pones la lupa en la esquina de arriba, miras ese pedacito, anotas lo que ves y la mueves un paso a la derecha. Cuando llegas al final de la fila, bajas un paso y empiezas otra vez. Eso es una **convolución**: una ventanita que se desliza sobre una imagen.

La ventanita se llama **kernel** (o **filtro**). Es una tabla pequeña de números. En cada posición, NUMK multiplica cada número de la imagen por el número del kernel que tiene encima, y suma todo (¡un [producto punto](matrix-multiplication.md#dot)!). Ese total va a una casilla de la imagen de salida.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-conv.svg"
<figcaption>Un kernel de 2 × 2 se desliza por una imagen de 3 × 3. En cada lugar multiplica y suma, y llena una casilla de la salida de 2 × 2.</figcaption>
</figure>

Distintos kernels encuentran cosas distintas: bordes, esquinas, manchas… Las [redes convolucionales de GESHA](../gesha/convolutional-networks.md) aprenden solas qué números poner en sus kernels, y por dentro usan estas dos funciones.

## Cómo se guarda una imagen { #chw }

NUMK guarda las imágenes en el orden **CHW**: primero los **canales** (*channels*, por ejemplo rojo, verde y azul), luego el **alto** (*height*) y luego el **ancho** (*width*). Una imagen en blanco y negro de 3 × 3 tiene 1 canal, así que su forma es `(1, 3, 3)`.

Los kernels tienen 4 ejes: `(filtros, canales, alto, ancho)`. Cada **filtro** produce un canal de la salida.

Dos palabras más:

- **stride** (paso): cuántas casillas salta la ventana cada vez. Con `1` avanza de una en una.
- **padding** (relleno): `"valid"` solo mira donde la ventana cabe completa, así que la salida es más chica. `"same"` pone ceros alrededor de la imagen para que la salida mida lo mismo que la entrada.

### `numk.conv2d_chw(image, kernels, bias, stride, padding)` { #conv2d_chw }

**Qué hace:** Desliza cada kernel sobre la imagen y calcula la imagen de salida.

**Cuándo usarla:** Para ver cómo un filtro transforma una imagen, por ejemplo para desenfocarla o encontrar bordes.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `image` | `List[List[List[INT | FLOAT]]]` | La imagen, de forma `(C, H, W)`. |
| `kernels` | `List[List[List[List[INT | FLOAT]]]]` | Los kernels, de forma `(F, C, KH, KW)`. |
| `bias` | `List[INT | FLOAT]` | Un número que se suma al final, uno por filtro (`F` números). |
| `stride` | `INT` | Opcional. El paso de la ventana. Si no lo das, es `1`. |
| `padding` | `STR` | Opcional. `"valid"` o `"same"`. Si no lo das, es `"valid"`. |

**Devuelve:** Un tensor de forma `(F, alto de salida, ancho de salida)`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/conv2d_chw.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/conv2d_chw.expec"
```

¿Qué pasó aquí?

1. El kernel `[[1, 0], [0, 1]]` suma el número de arriba a la izquierda y el de abajo a la derecha: 1 + 5 = 6, 2 + 6 = 8, 4 + 8 = 12 y 5 + 9 = 14.
2. Con `bias` igual a `[100]`, a cada casilla se le suma 100.
3. El kernel `blur` de 3 × 3, lleno de unos, suma cada número con todos sus vecinos. Con `"same"` la salida sigue midiendo 3 × 3: el centro es 1 + 2 + … + 9 = 45.

!!! note "Ojo"
    `"same"` funciona bien con kernels de tamaño impar (3 × 3, 5 × 5). Con un kernel de 2 × 2 no agrega relleno, así que da lo mismo que `"valid"`.

??? info "Para curiosos 🤓"
    Con paso $s$, para el filtro $f$ y la casilla $(i, j)$:

    $$y_{f,i,j} = b_f + \sum_{c} \sum_{u} \sum_{v} x_{c,\, i s + u,\, j s + v} \; k_{f,c,u,v}$$

    El tamaño de salida con `"valid"` es $\left\lfloor \frac{H - K_H}{s} \right\rfloor + 1$ por $\left\lfloor \frac{W - K_W}{s} \right\rfloor + 1$.

### `numk.conv2d_chw_backward(image, kernels, grad_output, stride, padding)` { #conv2d_chw_backward }

**Qué hace:** Hace el camino **de regreso** de una convolución. Si le dices cuánto se equivocó cada casilla de la salida (`grad_output`), calcula cuánta culpa tiene cada número de la imagen, de los kernels y del `bias`. A esas "culpas" se les llama **gradientes**.

**Cuándo usarla:** Al entrenar una red convolucional: los gradientes dicen cómo cambiar cada número del kernel para equivocarse menos. GESHA la usa por dentro; tú puedes usarla para ver ese cálculo paso a paso.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `image` | `List[List[List[INT | FLOAT]]]` | La misma imagen de la ida, `(C, H, W)`. |
| `kernels` | `List[List[List[List[INT | FLOAT]]]]` | Los mismos kernels, `(F, C, KH, KW)`. |
| `grad_output` | `List[List[List[INT | FLOAT]]]` | El error de cada casilla de la salida. Tiene la forma de la salida. |
| `stride` | `INT` | Opcional. El mismo paso de la ida. Si no lo das, es `1`. |
| `padding` | `STR` | Opcional. El mismo relleno de la ida. Si no lo das, es `"valid"`. |

**Devuelve:** Tres cosas entre paréntesis: el gradiente de la imagen (forma de `image`), el de los kernels (forma de `kernels`) y el del `bias` (un número por filtro).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/conv2d_chw_backward.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/conv2d_chw_backward.expec"
```

¿Qué pasó aquí? Cada casilla de la salida tuvo un error de 1. El `bias` participa en las 4 casillas, así que su gradiente es 4. El número del centro de la imagen (el 5) fue usado dos veces por los unos del kernel, así que su gradiente es 2.

!!! note "Ojo"
    El resultado sale entre paréntesis porque son tres cosas juntas. Por ahora úsalo con `show`: guardarlo en una variable todavía no funciona.

??? info "Para curiosos 🤓"
    Con la regla de la cadena: $\frac{\partial L}{\partial b_f} = \sum_{i,j} g_{f,i,j}$, $\frac{\partial L}{\partial k_{f,c,u,v}} = \sum_{i,j} g_{f,i,j}\, x_{c,\, i s + u,\, j s + v}$ y $\frac{\partial L}{\partial x_{c,\, i s + u,\, j s + v}} \mathrel{+}= g_{f,i,j}\, k_{f,c,u,v}$.

## ¿Qué aprendiste?

- Una **convolución** desliza un kernel pequeño sobre una imagen y en cada lugar multiplica y suma.
- NUMK guarda las imágenes como `(canales, alto, ancho)`.
- `conv2d_chw` va de ida y `conv2d_chw_backward` calcula los gradientes de regreso, que sirven para aprender.

[Volver a NUMK :material-arrow-left:](../numk.md){ .md-button }
[Siguiente librería: PARDOS :material-arrow-right:](../pardos.md){ .md-button .md-button--primary }
