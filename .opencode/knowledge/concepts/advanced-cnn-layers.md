# Capas CNN avanzadas

## Fundamento

Conv1D aplica $y_{f,t}=b_f+\sum_{c,k}x_{c,ts+k}w_{f,c,k}$.
DepthwiseConv2D elimina la suma entre canales y aprende uno o más kernels por
canal. Conv2DTranspose distribuye cada entrada sobre una región de salida y su
costo es $O(CFHWK_hK_w)$. Pooling reemplaza ventanas por máximo o promedio;
pooling global reduce cada canal a un escalar.

Batch normalization calcula $\hat x=(x-\mu)/\sqrt{\sigma^2+\epsilon}$ y luego
$y=\gamma\hat x+\beta$. SpatialDropout2D usa una máscara por canal. Padding,
upsampling, reshape y permute cambian la geometría; concatenate y multiply
combinan ramas de un grafo.

## Algoritmo y complejidad

1. Validar rangos y formato channels-first.
2. Construir parámetros cuando la capa es entrenable.
3. Recorrer ventanas o transformar índices en forward.
4. Guardar posiciones, máscaras o estadísticas requeridas.
5. Invertir la transformación o acumular gradientes en backward.

Convoluciones dominan el costo; pooling y transformaciones son lineales en el
número de elementos. Reshape evita cambiar valores, aunque las listas requieren
reconstrucción en la implementación educativa.

## Ventajas, límites y uso

Ventajas: composición suficiente para arquitecturas encoder-decoder, soporte de
ramas residuales y separación clara entre geometría y aprendizaje. Depthwise
reduce parámetros y pooling global evita Dense grandes. Limitaciones: CPU sin
kernels vectorizados, formato CHW único y BatchNormalization por muestra
espacial. Úselas para aprendizaje y modelos pequeños; no para entrenamiento de
ImageNet ni cargas que exijan GPU.

## KAFE y referencias

Las capas heredan `Layer`, exponen `forward/backward/parameters` y consumen
listas NUMK. Referencias: LeCun et al. (1998); Ioffe y Szegedy, *Batch
Normalization* (2015); Chollet, *Xception* (2017); Dumoulin y Visin, *A Guide to
Convolution Arithmetic for Deep Learning* (2016).
