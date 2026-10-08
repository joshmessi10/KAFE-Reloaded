# SimpleRNN

## Fundamento matemático

Una RNN de Elman actualiza su estado mediante

$$h_t=\phi(x_tW_x+h_{t-1}W_h+b).$$

Puede devolver $h_T$ o toda la secuencia $(h_1,\ldots,h_T)$. BPTT aplica la
regla de la cadena desde $T$ hasta 1. El costo es
$O(T(FU+U^2))$ y el caché de entrenamiento ocupa $O(TU)$.

## Algoritmo KAFE

1. Inicializar $h_0=0$.
2. Recorrer los pasos y guardar estado y contexto de activación.
3. Devolver el último estado o todos los estados.
4. Recorrer hacia atrás, sumar el gradiente futuro y acumular gradientes de
   entrada, pesos de entrada, pesos recurrentes y bias.

## Ventajas y limitaciones

Ventajas: procesa longitudes variables, comparte parámetros en el tiempo y
modela orden temporal. También sirve como base educativa para LSTM/GRU.
Limitaciones: BPTT completo consume memoria lineal en $T$ y puede sufrir
gradientes desvanecidos o explosivos. No tiene masking ni estado persistente.

Se recomienda para secuencias cortas y enseñanza. Para dependencias largas o
producción convienen LSTM, GRU o Transformers.

## Relación con KAFE y referencias

`SimpleRNN` usa matrices NUMK y una activación independiente por timestep. Sus
pesos son parámetros GESHA compatibles con SGD/Adam. Referencias: Elman,
“Finding Structure in Time” (1990); Rumelhart, Hinton y Williams, “Learning
Representations by Back-Propagating Errors” (1986).
