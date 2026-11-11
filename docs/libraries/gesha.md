# Gesha — deep learning in KAFE

Gesha implements neural networks with KAFE and NUMK tensors. Import it with `gesha` in every new program.

```kafe
import gesha;
```

The architectures supported for training today are multilayer perceptrons (MLP), convolutional networks (CNN), and recurrent networks (RNN), assembled sequentially. Experimental soft clustering remains available as an experimental path with fixtures and its own page below. Functional graph training has a tested branch-and-merge fixture; broader graph configurations remain experimental. All examples here use `gesha.sequential`.

## Choose a topic

| Topic | Read this when you need... |
|---|---|
| [API coverage and limits](gesha/api-coverage.md) | Intended wrappers, receiver contracts, unsupported bindings and weight serialization limits. |
| [Models and training](gesha/models-training.md) | Model assembly, compile, fit, epoch output, shared MACHINE metrics, and errors. |
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
