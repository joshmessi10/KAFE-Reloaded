# Recurrent networks and sequences

Recurrent layers process a sequence one step at a time and carry a hidden state forward. A simple recurrent step can be written `h_t = activation(W_x x_t + W_h h_(t−1) + b)`. Backpropagation through time propagates gradients across the unrolled sequence. Long sequences may suffer vanishing or exploding gradients; LSTM and GRU add gates to regulate memory.

Input samples use `[timesteps][features]`. Set `return_sequences=True` when the next layer needs every time step; otherwise the layer returns its final representation. `Embedding` maps integer token IDs to dense vectors before a recurrent text model.

## Recurrent layer factories


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_rnn` | `(units, activation, input_shape, return_sequences, seed) -> GESHA` | SimpleRNN for `[timesteps, features]` inputs |
| `gesha.create_lstm` | `(units, input_shape, return_sequences, seed) -> GESHA` | Long Short-Term Memory layer |
| `gesha.create_gru` | `(units, input_shape, return_sequences, seed) -> GESHA` | Gated Recurrent Unit layer |
| `gesha.embedding` | `(input_dim, output_dim, seed) -> GESHA` | Learns a dense vector per token index |
| `gesha.bidirectional` | `(layer) -> GESHA` | Wraps a recurrent layer to run in both directions |


## Merge layers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.add_layer` | `() -> GESHA` | Element-wise sum (skip connections) |
| `gesha.concatenate_layer` | `(axis) -> GESHA` | Concatenates multiple inputs |
| `gesha.multiply_layer` | `() -> GESHA` | Element-wise product |

---


## Data preparation

Time-series windows must preserve temporal order. Fit a scaler on the training period only, then apply it to later observations. For text, fit the tokenizer vocabulary only on training text to avoid leakage. Both workflows are demonstrated in runnable programs:

- [Temperature series with SimpleRNN](../../ejemplos/ejemplo-rnn1-series.kf)
- [Sentiment classification with Embedding and SimpleRNN](../../ejemplos/ejemplo-rnn2-sentimiento.kf)

## Recurrent outputs

With `return_sequences=False`, a recurrent layer returns its final hidden representation for the whole sample. With `return_sequences=True`, it returns one output for each time step so another recurrent or temporal layer can consume the sequence. Choose this flag based on the input shape required by the next layer.

| Layer | Memory mechanism | Typical teaching use |
|---|---|
| `create_rnn` | Repeated hidden-state update. | Short numeric windows. |
| `create_lstm` | Input, forget, and output gates. | Longer dependencies. |
| `create_gru` | Update and reset gates. | Gated sequence modeling with fewer gates than LSTM. |
| `embedding` | Learned vector for each token ID. | Text input before an RNN. |
| `bidirectional` | Forward and backward sequence passes. | Classification when the entire sequence is available. |

## Sequence workflow

1. Form windows with a fixed number of time steps and features.
2. Split by time for forecasting, or stratify labeled text samples when appropriate.
3. Fit preprocessing only on the training partition.
4. Feed `[timesteps][features]` samples to the first recurrent layer.
5. Compare predictions on held-out sequences and report a task-appropriate metric.

For forecasting, a random split can expose future information during training. For text, fitting a vocabulary on test sentences similarly leaks information. Recurrent training cost grows with sequence length; LSTM and GRU use more gates and parameters than a SimpleRNN. Use bounded sequences while learning the API.

[Back to Gesha overview](../gesha.md)
