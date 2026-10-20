# Gesha — deep learning in KAFE

Gesha implements neural networks with KAFE and NUMK tensors. Import it with `gesha` in every new program.

```kafe
import gesha;
```

The current public path supports sequential multilayer perceptrons, convolutional networks, recurrent networks, and experimental soft clustering. The Functional API has backend components but is not yet a fully documented training path. All examples here use `gesha.sequential`.

## Choose a topic

| Topic | Read this when you need... |
|---|---|
| [Models and training](gesha/models-training.md) | Model assembly, compile, fit, prediction, evaluation, and errors. |
| [Dense networks](gesha/dense-networks.md) | Perceptrons, multilayer networks, activations, and losses. |
| [Convolutional networks](gesha/convolutional-networks.md) | Image shapes, convolution, pooling, and spatial layers. |
| [Recurrent networks](gesha/recurrent-networks.md) | Sequences, SimpleRNN, LSTM, GRU, and embeddings. |
| [Training tools](gesha/training-tools.md) | Initializers, regularizers, callbacks, and tensor helpers. |
| [Soft clustering](gesha/soft-clustering.md) | Unsupervised soft assignments and their limits. |
| [Runnable examples](../ejemplos/gesha-examples.md) | Complete KAFE programs for each architecture. |

## A complete workflow

1. Prepare numeric inputs and labels. Split supervised datasets before fitting a scaler.
2. Create layers with `gesha.create_dense`, `gesha.create_conv2d`, or a recurrent factory.
3. Assemble the layers with `gesha.sequential([...])`.
4. Compile the model with an optimizer and a task-appropriate loss.
5. Fit on training data, then predict on held-out data and inspect several results.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-1-and.kf"
```

**Cost model:** a dense layer with `n` inputs and `m` units stores roughly `n × m` weights and uses `O(nm)` arithmetic per sample in its forward pass. Larger image and sequence layers require more memory and compute. The examples are teaching exercises, not deployment models.
