# GESHA: redes convolucionales

Las **redes convolucionales** (CNN) están hechas para **imágenes**. En vez de conectar cada píxel con cada neurona, pasan un **filtro** pequeño por toda la imagen buscando el mismo patrón en todas partes: un borde, una esquina, una línea.

## La convolución: un filtro que recorre la imagen { #convolution }

### La idea en una frase

Un **filtro** (o *kernel*) es una tablita de pesos, por ejemplo de 2 × 2. Se apoya sobre un pedazo de la imagen, multiplica casilla por casilla, suma, y se corre al lado. El resultado es un **mapa** que dice dónde aparece el patrón del filtro.

### Una comparación de la vida diaria

Es como buscar a Wally con una lupa: la mueves por toda la página buscando **lo mismo** (camiseta a rayas) en cada lugar. No necesitas una lupa distinta para cada rincón.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-convolution.svg"
<figcaption>Una imagen de 3 × 3 con los números del 1 al 9. Una ventana de 2 × 2 llena de unos la recorre, una posición a la vez. En cada parada suma los cuatro números de abajo y escribe el resultado en una salida de 2 × 2: 12, 16, 24 y 28.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-filter-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-filter-by-hand.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La primera parada, arriba a la izquierda, suma 1 + 2 + 4 + 5 = `12`.
    2. `gesha.create_conv2d(1, [2, 2], "linear", [1, 3, 3], 1, "valid", 7, gesha.ones_initializer())` crea **1** filtro de **2 × 2**, sin activación, para imágenes de **1 canal de 3 × 3**, que avanza de a **1** casilla, sin relleno (`"valid"`), con semilla 7 y todos sus pesos en 1.
    3. `conv.forward(image)` da la salida completa: `[[12, 16], [24, 28]]`.

En una red real los pesos del filtro **se aprenden**: la red descubre sola qué patrones buscar.

!!! warning "La forma de las imágenes: canal primero"
    En KAFE una imagen es `[canales][alto][ancho]`. Una imagen en blanco y negro de 3 × 3 es `[[[...], [...], [...]]]`: una lista (el canal) de 3 filas de 3 números. Una imagen a color tiene 3 canales (rojo, verde y azul).

??? info "Para curiosos 🤓"
    Con alto $H$, filtro $K$, relleno $P$ y paso $S$, el alto de la salida es $\lfloor (H + 2P - K)/S \rfloor + 1$; el ancho sigue la misma regla. Aquí, $(3 - 2)/1 + 1 = 2$. Un filtro tiene $F \times C \times K_h \times K_w$ pesos más $F$ sesgos, **sin importar el tamaño de la imagen**, porque se reutiliza en cada posición. Una capa densa sobre la misma imagen necesitaría un peso por píxel y por neurona.

## Pooling: achicar sin perder lo importante { #pooling }

### La idea en una frase

El **pooling** divide el mapa en bloques y deja un solo número por bloque: el **mayor** (*max pooling*) o el **promedio** (*average pooling*). La imagen se achica, pero conserva las señales fuertes.

### Una comparación de la vida diaria

Es como resumir un partido por cuartos: de cada cuarto anotas solo la jugada más importante.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-pooling.svg"
<figcaption>Una imagen de 4 × 4 dividida en cuatro bloques de 2 × 2. En cada bloque se enciende el número mayor (4, 2, 2 y 8) y se copia a una salida de 2 × 2: la imagen conserva sus señales más fuertes a la mitad de tamaño.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-pooling.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-pooling.expec"
```

`max_pooling2d([2, 2], 2)` deja el mayor de cada bloque; `average_pooling2d` el promedio (el primer bloque, 1, 3, 4, 2, da `2.5`); y `global_average_pooling2d` resume **todo** el canal en un número: `2.8125`.

## Tu primera red convolucional { #first-cnn }

Imágenes de 3 × 3 con una línea: `0` si es vertical, `1` si es horizontal.

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-lines.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-lines.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La red es **convolución → aplanar → densa**: 2 filtros de 2 × 2 con `"tanh"` buscan patrones, `flatten_layer` convierte los mapas en una lista, y una neurona `"sigmoid"` decide.
    2. La exactitud de cada época se mide **mientras** la red todavía está aprendiendo, por eso la última dice 83 %. Al terminar, `predict_label` acierta las 6 imágenes.
    3. También clasifica bien dos imágenes **con ruido** que nunca vio: una línea vertical (`0`) y una horizontal (`1`).

## Las capas { #layers }

| Función | Qué hace |
|---|---|
| `gesha.create_conv2d(filtros, [kh, kw], activación, [C, H, W], paso, relleno, semilla, inicializador, regularizador)` | Convolución 2D. Relleno `"valid"` (sin relleno) o `"same"` (mismo tamaño). |
| `gesha.create_conv1d(filtros, k, activación, [C, L], paso, relleno, semilla)` | Convolución 1D para señales `[canales][largo]`. |
| `gesha.create_depthwise_conv2d([kh, kw], multiplicador, activación, forma, paso, relleno, semilla)` | Un filtro por canal: más barata. |
| `gesha.create_conv2d_transpose(filtros, [kh, kw], activación, forma, paso, relleno, semilla)` | La "inversa": agranda la imagen. |
| `gesha.max_pooling2d([ph, pw], paso)` / `average_pooling2d` / `max_pooling1d(p, paso)` | Pooling. |
| `gesha.global_average_pooling2d()` / `global_max_pooling2d()` | Un número por canal. |
| `gesha.flatten_layer()` | Aplana para pasar a capas densas. |
| `gesha.zero_padding2d([p, p])` / `up_sampling2d([f, f])` | Agrega bordes de ceros / agranda repitiendo. |
| `gesha.reshape_layer(forma)` / `permute_layer(orden)` | Cambia la forma / reordena los ejes. |
| `gesha.batch_normalization(epsilon, momentum)` | Normaliza cada canal de una imagen. |
| `gesha.spatial_dropout2d(tasa, semilla)` | Mientras entrena, apaga mapas completos al azar. |

??? warning "Error común: tamaño de filtro con decimales"
    El tamaño del filtro son dos **enteros**:

    ```kafe
    --8<-- "tests/DocsExamples/gesha/cnn-kernel-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/cnn-kernel-float.error.stderr.expec"
    ```

## Detalles técnicos { #details }

- Con `"same"`, las convoluciones 2D y depthwise (y la 1D) necesitan un filtro de tamaño **impar**.
- Para predecir **una** imagen, envuélvela: `model.predict([image])`. Sin la lista externa, KAFE toma cada canal como un ejemplo distinto.
- `batch_normalization` normaliza cada canal de **una** imagen `[C][H][W]` sobre sus posiciones; al entrenar actualiza su promedio y varianza internos, y al predecir los usa. `save_weights` no guarda esos dos valores.
- Conv1D usa `[canales][largo]`, pero las [redes recurrentes](recurrent-networks.md) usan `[pasos][rasgos]`: no son intercambiables sin reordenar con `permute_layer([1, 0])`.
- Las CNN sobre listas anidadas son lentas: empieza con pocas imágenes. El [ejemplo de CIFAR-10](../../ejemplos/gesha/cnn-cifar10.md) muestra el flujo completo.

| 👍 Ventajas | 👎 Límites |
|---|---|
| Pocos pesos: el mismo filtro sirve en toda la imagen. | Lentas en KAFE con imágenes grandes. |
| Encuentran un patrón esté donde esté. | Hay que cuidar la forma `[C][H][W]` en cada paso. |
