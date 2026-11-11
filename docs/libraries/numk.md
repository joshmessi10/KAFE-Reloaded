# NUMK: vectores, matrices y tensores

La librería **NUMK** sirve para hacer cuentas con **muchos números a la vez**. En vez de sumar dos números, sumas dos tablas enteras de un solo golpe. Es la base de todo lo que hace una red neuronal: las imágenes, los pesos y los resultados son montones de números ordenados.

Su nombre viene de *NumPy*, la librería famosa de Python, pero NUMK está escrita desde cero para KAFE, para que puedas ver cómo funciona cada cuenta.

## Antes de empezar: importar la librería

Una librería es una **caja de herramientas** extra. Para usarla, primero la traes a tu programa con `import`, y luego usas cada herramienta con `numk.` delante:

```kafe
--8<-- "tests/DocsExamples/numk/tensor.kf"
```

```text
--8<-- "tests/DocsExamples/numk/tensor.expec"
```

!!! warning "Error común: olvidar el `import`"
    Si usas `numk.` sin haber escrito `import numk;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/numk/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/no-import.error.stderr.expec"
    ```

## Vectores, matrices y tensores { #shapes }

Estas tres palabras suenan difíciles, pero son ideas que ya conoces:

- Un **vector** es una lista de números en fila. Como una lista de compras con cantidades: `[3, 5, 2]` son 3 manzanas, 5 peras y 2 limones. También puedes verlo como una flecha que dice "3 pasos a la derecha, 5 hacia arriba…".
- Una **matriz** es una tabla: filas y columnas, como una hoja de cálculo o un cartón de huevos. En KAFE es una lista de listas: `[[1, 2, 3], [4, 5, 6]]` tiene 2 filas y 3 columnas.
- Un **tensor** es una pila de tablas. Una foto a color es un tensor: tiene 3 tablas, una para el rojo, una para el verde y una para el azul.

La **forma** (*shape*) dice cuánto mide cada dirección. Se escribe entre paréntesis: `(3,)` es un vector de 3 números, `(2, 3)` es una tabla de 2 filas y 3 columnas, y `(3, 2, 2)` son 3 tablas de 2 × 2. Cada dirección se llama **eje** (*axis*): el eje 0 es el primero, el eje 1 el segundo, y así.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-formas.svg"
<figcaption>Un vector es una fila, una matriz es una tabla y un tensor es una pila de tablas. Debajo de cada uno está su forma.</figcaption>
</figure>

!!! tip "INT o FLOAT"
    NUMK trabaja con números `INT` y `FLOAT`. Puedes mezclar los dos.

## Cómo funciona por dentro { #inside }

NUMK no esconde nada mágico. Vamos a abrir la caja.

**1. Los tensores son listas de listas.** NUMK no inventa un tipo nuevo de dato. Un vector es una lista normal de KAFE, una matriz es una lista de listas y un tensor es una lista de listas de listas. Por eso puedes mostrarlos con `show` y recorrerlos con `for`, como cualquier lista. Todas las funciones devuelven listas nuevas: nunca cambian la lista que les das.

**2. La forma se calcula bajando por la primera caja.** Para saber la forma, NUMK mira cuántos elementos tiene la lista grande, luego entra en el primer elemento y cuenta otra vez, y así hasta llegar a un número. Además revisa que todas las cajas hermanas midan lo mismo. Si una fila es más corta, la tabla está "chueca" y NUMK avisa con el error `tensor irregular`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-por-dentro-forma.svg"
<figcaption>Para `[[1, 2, 3], [4, 5, 6]]`: la lista grande tiene 2 cajas, la primera tiene 3 números y la segunda también. La forma es (2, 3).</figcaption>
</figure>

**3. Las cuentas son bucles.** Cada función recorre las listas con bucles `for`, casilla por casilla. Por ejemplo, para multiplicar matrices (`mul`), NUMK usa tres bucles: `i` recorre las filas de la primera matriz, `j` las columnas de la segunda y `k` camina a la vez por esa fila y esa columna, sumando productos en una variable `suma`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-por-dentro-bucle.svg"
<figcaption>El bucle `k` de `mul` calculando la primera casilla: empieza en 0, suma 1·5 y luego 2·7. El resultado, 19, se guarda en la casilla de arriba a la izquierda.</figcaption>
</figure>

**4. Antes de calcular, revisa.** Cada función comprueba primero los tipos de lo que le das (por ejemplo, que `add` reciba dos matrices) y las formas (por ejemplo, que las dos tablas midan igual). Si algo no encaja, se detiene con un mensaje que empieza con `numk:`.

??? info "Para curiosos 🤓"
    El código está en `src/lib/KafeNUMK/`. En `functions.py` vive cada función que llamas desde KAFE. En `utils.py` están las ayudas internas: la que calcula la forma, la que recorre dos tensores casilla por casilla y la que hace el *broadcasting*. En `errors.py` están los mensajes de error. Cuando escribes `numk.add(a, b)`, el intérprete busca en ese módulo una función llamada `add` y la llama con tus datos. Para multiplicar una matriz de `n × m` por otra de `m × p`, los tres bucles hacen $n \cdot m \cdot p$ multiplicaciones.

## Mapa de la librería { #map }

| Sección | Qué aprendes |
|---|---|
| [Crear y medir tensores](numk/creating.md) | Crear vectores, tablas y tensores llenos de ceros, unos o números al azar, y ver su forma. |
| [Operaciones casilla por casilla](numk/element-wise.md) | Sumar, restar y multiplicar tablas del mismo tamaño, y aplicar tu propia función a cada número. |
| [Multiplicar matrices](numk/matrix-multiplication.md) | El producto punto, la multiplicación fila por columna y la matriz inversa. |
| [Broadcasting](numk/broadcasting.md) | Combinar una tabla con algo más pequeño que se "estira" para encajar. |
| [Reducir: sumas y máximos](numk/reductions.md) | Sumar todo, o sumar y buscar el mayor a lo largo de un eje. |
| [Cambiar la forma](numk/reshaping.md) | Reacomodar, girar, unir y partir tensores. |
| [Convolución](numk/convolution.md) | Una ventanita que se desliza sobre una imagen: la base de las redes convolucionales. |

## Resumen de todas las funciones { #summary }

| Función | Sección |
|---|---|
| [`numk.tensor(data)`](numk/creating.md#tensor) | Crear y medir tensores |
| [`numk.zeros(n)`](numk/creating.md#zeros) | Crear y medir tensores |
| [`numk.zeros_matrix(rows, cols)`](numk/creating.md#zeros_matrix) | Crear y medir tensores |
| [`numk.zeros_nd(shape)`](numk/creating.md#zeros_nd) | Crear y medir tensores |
| [`numk.ones(shape)`](numk/creating.md#ones) | Crear y medir tensores |
| [`numk.random_tensor(shape, low, high, seed)`](numk/creating.md#random_tensor) | Crear y medir tensores |
| [`numk.normal_tensor(shape, mean, stddev, seed)`](numk/creating.md#normal_tensor) | Crear y medir tensores |
| [`numk.shape(data)`](numk/creating.md#shape) | Crear y medir tensores |
| [`numk.add(a, b)`](numk/element-wise.md#add) | Operaciones casilla por casilla |
| [`numk.sub(a, b)`](numk/element-wise.md#sub) | Operaciones casilla por casilla |
| [`numk.emul(a, b)`](numk/element-wise.md#emul) | Operaciones casilla por casilla |
| [`numk.scalar_mul(scalar, data)`](numk/element-wise.md#scalar_mul) | Operaciones casilla por casilla |
| [`numk.map_elements(function, data, ...)`](numk/element-wise.md#map_elements) | Operaciones casilla por casilla |
| [`numk.exp_tensor(data)`](numk/element-wise.md#exp_tensor) | Operaciones casilla por casilla |
| [`numk.abs_tensor(data)`](numk/element-wise.md#abs_tensor) | Operaciones casilla por casilla |
| [`numk.dot(a, b)`](numk/matrix-multiplication.md#dot) | Multiplicar matrices |
| [`numk.mul(a, b)`](numk/matrix-multiplication.md#mul) | Multiplicar matrices |
| [`numk.dot_matrix(a, b)`](numk/matrix-multiplication.md#dot_matrix) | Multiplicar matrices |
| [`numk.inv(m)`](numk/matrix-multiplication.md#inv) | Multiplicar matrices |
| [`numk.broadcast_add(a, b)`](numk/broadcasting.md#broadcast_add) | Broadcasting |
| [`numk.broadcast_sub(a, b)`](numk/broadcasting.md#broadcast_sub) | Broadcasting |
| [`numk.broadcast_mul(a, b)`](numk/broadcasting.md#broadcast_mul) | Broadcasting |
| [`numk.broadcast_div(a, b)`](numk/broadcasting.md#broadcast_div) | Broadcasting |
| [`numk.sum_all(data)`](numk/reductions.md#sum_all) | Reducir: sumas y máximos |
| [`numk.sum_axis(data, axis)`](numk/reductions.md#sum_axis) | Reducir: sumas y máximos |
| [`numk.max_axis(data, axis)`](numk/reductions.md#max_axis) | Reducir: sumas y máximos |
| [`numk.reshape(data, new_shape)`](numk/reshaping.md#reshape) | Cambiar la forma |
| [`numk.transpose(m)`](numk/reshaping.md#transpose) | Cambiar la forma |
| [`numk.transpose_axes(data, axes)`](numk/reshaping.md#transpose_axes) | Cambiar la forma |
| [`numk.concatenate(values, axis)`](numk/reshaping.md#concatenate) | Cambiar la forma |
| [`numk.split_sizes(data, sizes, axis)`](numk/reshaping.md#split_sizes) | Cambiar la forma |
| [`numk.conv2d_chw(image, kernels, bias, stride, padding)`](numk/convolution.md#conv2d_chw) | Convolución |
| [`numk.conv2d_chw_backward(image, kernels, grad_output, stride, padding)`](numk/convolution.md#conv2d_chw_backward) | Convolución |

## ¿Qué aprendiste?

- Para usar NUMK escribes `import numk;` y luego `numk.nombre(...)`.
- Un vector es una lista, una matriz es una lista de listas y un tensor es una pila de tablas.
- La **forma** dice cuánto mide cada eje, y NUMK la calcula contando cajas.
- Por dentro, cada cuenta es un bucle que recorre las listas casilla por casilla.

[Empieza: crear y medir tensores :material-arrow-right:](numk/creating.md){ .md-button .md-button--primary }
[Siguiente librería: PARDOS :material-arrow-right:](pardos.md){ .md-button }
