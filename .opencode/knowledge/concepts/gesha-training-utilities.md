# Inicialización, regularización y callbacks en GESHA

## Fundamento matemático

Una inicialización adecuada mantiene estable la varianza de las activaciones. Xavier usa
$\operatorname{Var}(W)=2/(fan_{in}+fan_{out})$; He usa $2/fan_{in}$ y resulta adecuada para ReLU. La inicialización ortogonal construye $Q$ con $Q^TQ=I$, lo que ayuda a conservar la norma del gradiente recurrente.

L1 añade $\lambda_1\sum_i|w_i|$ y gradiente $\lambda_1\operatorname{sign}(w)$; L2 añade $\lambda_2\sum_iw_i^2$ y gradiente $2\lambda_2w$. L1 favorece dispersión y L2 limita magnitudes. Ambas cuestan $O(P)$ para $P$ parámetros.

Early stopping observa una métrica después de cada época y termina tras `patience + 1` épocas sin una mejora mayor que `min_delta`. Model checkpoint serializa los mejores pesos según la misma comparación.

## Algoritmo paso a paso

1. La capa calcula `fan_in` y `fan_out` y pide a NUMK el tensor uniforme o normal.
2. `Parameter` conserva el regularizador asociado al peso.
3. Después de backpropagation, `fit` suma el gradiente y la penalización regularizadora.
4. Al terminar cada época, `fit` entrega `loss` y `val_loss` a los callbacks.
5. EarlyStopping puede restaurar una copia NUMK de los mejores parámetros; ModelCheckpoint escribe JSON validable y recargable.

## Ventajas y limitaciones

Las semillas hacen reproducibles los experimentos; Xavier y He evitan saturación temprana; Orthogonal es útil en recurrencia. Ninguna inicialización elimina gradientes explosivos, y una penalización excesiva causa subajuste. El checkpoint guarda pesos, no la topología ni el estado del optimizador.

## Relación con KAFE

GESHA conserva modelos y parámetros; NUMK crea y transforma todos los arreglos N-dimensionales. Los objetos nuevos usan el tipo existente `GESHA`, por lo que no se agrega un tipo Tensor ni se cambia la gramática.

## Referencias

- Glorot & Bengio, *Understanding the difficulty of training deep feedforward neural networks*, 2010.
- He et al., *Delving Deep into Rectifiers*, 2015.
- Goodfellow, Bengio & Courville, *Deep Learning*, MIT Press, 2016.
