# Conv2D

## Fundamento matemático

Para una entrada $X\in\mathbb{R}^{C\times H\times W}$ y kernels
$K\in\mathbb{R}^{F\times C\times K_h\times K_w}$, la correlación usada por
las CNN modernas es

$$Z_{f,i,j}=b_f+\sum_c\sum_u\sum_v X_{c,i s+u-p_h,j s+v-p_w}K_{f,c,u,v}.$$

La activación produce $Y=\phi(Z)$. El backward acumula $\partial L/\partial
X$, $\partial L/\partial K$ y $\partial L/\partial b$. El costo temporal es
$O(FCH_oW_oK_hK_w)$ y la memoria de salida $O(FH_oW_o)$.

## Algoritmo KAFE

1. Validar la imagen CHW y construir kernels FCHW.
2. Calcular padding y dimensiones de salida.
3. Deslizar cada kernel sobre cada canal.
4. Sumar bias y aplicar la activación.
5. En backward, recorrer las mismas posiciones y acumular los tres gradientes.

## Ventajas y limitaciones

Ventajas: comparte pesos espacialmente, preserva estructura local y requiere
menos parámetros que Dense para imágenes. Además admite `valid`, `same` y
stride configurable. Limitaciones: la implementación educativa usa CPU y
bucles; acepta CHW sin batch dentro de la capa; `same` exige kernels impares.

Se recomienda para imágenes y rejillas con patrones locales. No se recomienda
para tablas sin estructura espacial ni cuando se necesita aceleración GPU.

## Relación con KAFE y referencias

`Conv2D` conserva parámetros en GESHA y delega la aritmética a
`numk.conv2d_chw`/`conv2d_chw_backward`. Referencias: LeCun et al., “Gradient-
Based Learning Applied to Document Recognition” (1998); Goodfellow, Bengio y
Courville, *Deep Learning*, capítulo 9 (2016).
