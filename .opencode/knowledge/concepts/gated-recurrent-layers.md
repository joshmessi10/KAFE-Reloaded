# LSTM, GRU, Bidirectional y Embedding

## Fundamento

LSTM mantiene memoria $c_t$ mediante compuertas $i_t,f_t,o_t$:
$c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t$ y
$h_t=o_t\odot\tanh(c_t)$. GRU combina memoria y salida mediante update/reset:
$h_t=(1-z_t)\odot\tilde h_t+z_t\odot h_{t-1}$. Bidirectional concatena estados
de recorridos directo e inverso. Embedding aprende una matriz $E\in R^{V\times
D}$ y selecciona $E[token]$.

## Algoritmo y complejidad

1. Convertir cada timestep junto al estado previo en logits de compuertas.
2. Actualizar memoria/estado y conservar el contexto.
3. Devolver el estado final o toda la secuencia.
4. Aplicar BPTT desde el último paso y acumular gradientes compartidos.
5. En Embedding, sumar gradientes de índices repetidos en la misma fila.

LSTM cuesta $O(T(F+U)4U)$, GRU $O(T(F+U)3U)$ y el caché cuesta $O(TU)$.

## Ventajas, límites y uso

Ventajas: LSTM aprende dependencias más largas que SimpleRNN, GRU usa menos
parámetros, Bidirectional incorpora contexto pasado/futuro y Embedding evita
one-hot disperso. Limitaciones: BPTT crece con la secuencia, no hay masking ni
estado persistente, y Bidirectional no sirve para inferencia causal estricta.
Úselas en secuencias pequeñas, texto educativo y series temporales; para
secuencias masivas convienen implementaciones aceleradas o Transformers.

## KAFE y referencias

Todas conservan parámetros GESHA y matrices NUMK. Referencias: Hochreiter y
Schmidhuber, *Long Short-Term Memory* (1997); Cho et al., *Learning Phrase
Representations using RNN Encoder-Decoder* (2014); Schuster y Paliwal,
*Bidirectional Recurrent Neural Networks* (1997); Bengio et al., *A Neural
Probabilistic Language Model* (2003).
