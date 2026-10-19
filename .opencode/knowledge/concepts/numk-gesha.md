# NUMK como backend numérico de GESHA

## Fundamento y responsabilidad

Un tensor es una colección rectangular de escalares con forma (d₁,…,dₙ).
Su representación mediante listas evita duplicar almacenamiento y tipos del
lenguaje. NUMK valida, copia, crea y recorre datos; GESHA conserva estado de
entrenamiento. Parameter no realiza aritmética ni sustituye un tensor.

Para Dense, X tiene forma B×I, W tiene I×O y b tiene O componentes:

$$Z=XW+b,\quad A=f(Z),\quad dZ=f.backward(dA)$$
$$dW=X^T dZ,\quad db=\sum_{i=1}^B dZ_i,\quad dX=dZW^T.$$

Coste: O(BIO) tiempo y O(BI+BO+IO) espacio. NUMK ejecuta los productos;
Dense no actualiza los parámetros. El optimizador lo hace después de backward.

Softmax resta el máximo por fila para estabilizar exponentes. Su producto
Jacobiano-vector es $dZ=P\odot(G-\sum_j G_jP_j)$, O(BO), sin matriz O(BO²).
CCE usa $L=-\sum Y\log(P+\epsilon)/B$ y
$dL/dP=-Y/(P+\epsilon)/B$. No se aplica dos veces el Jacobiano.

## Algoritmo

1. NUMK valida listas rectangulares y copia la entrada para proteger cachés.
2. Dense construye parámetros si todavía no existen, calcula Z con NUMK.
3. La activación guarda Z completo y produce A; las pérdidas guardan sus datos.
4. Backward calcula gradientes de entrada, pesos y bias mediante NUMK.
5. Fit acumula cada gradiente por muestra manteniendo pesos fijos dentro del lote.
6. Divide por el tamaño real del lote y llama al optimizador una vez.
7. SGD resta lr·grad; Adam conserva momentos por identidad de Parameter.

Las diferencias finitas centrales $(L(\theta+h)-L(\theta-h))/(2h)$ proporcionan
una comprobación independiente de la regla de la cadena. Se prueban dW, db y dX
con MSE y CCE, vectores y matrices, lejos del punto no diferenciable de ReLU.

## Ventajas

- Un único propietario de validación, broadcasting y recorridos ND.
- Datos directamente compatibles con List[...] del intérprete.
- Fórmulas de GESHA legibles y verificables sin clases numéricas adicionales.
- Parámetros conservan identidad estable para los momentos de Adam.

## Límites y uso

Usar para enseñanza y redes pequeñas/tabulares; no como sustituto de kernels
acelerados para grandes modelos. Listas Python implican recorridos y copias;
fit acumula por muestra, aunque Dense admite matrices. No hay autograd.
NUMK pierde la dimensión posterior a un eje vacío porque una lista vacía no
almacena metadatos. Las aproximaciones KafeMATH siguen limitando precisión,
y BCE conserva estabilización histórica por compatibilidad.

Functional comparte nodos de un grafo, pero reutilizar la misma instancia de
capa en distintos nodos necesita un contexto por invocación aún no implementado.

## Ubicación y migración

`src/lib/KafeNUMK/funciones.py`: tensor, map_elements, broadcasting y álgebra.
`src/lib/KafeNUMK/utils.py`: validación estructural y recorridos internos.
`src/lib/KafeGESHA/{layers,activations,losses,optimizers,models}.py`: consumidores.
`core.py` contiene estado, ninguna clase Tensor.
`geshaDeep.tensor*` conserva nombres y devuelve listas: quitar .data/.shape/.ndim
del código cliente y usar numk.shape para inspección Python. Gesha no cambia.

## Referencias

- Goodfellow, Bengio y Courville, Deep Learning (2016), capítulos 6 y 8.
- Rumelhart, Hinton y Williams, Learning representations by back-propagating
  errors (1986).
- Kingma y Ba, Adam: A Method for Stochastic Optimization (2015).
- ADR-0008 y ADR-0010; docs/bibliotecas/gesha.md y numk.md.
