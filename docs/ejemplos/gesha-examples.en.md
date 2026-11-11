# GESHA examples

In this section you will find complete KAFE programs to build and train different neural network architectures using the canonical `gesha` library. Rather than following rigid numbered levels, you can choose the architecture that best fits what you want to learn or build.

If this is your first time exploring neural networks, we recommend reading the lesson [What is a neuron?](../aprende/neuronas.md) and the [GESHA overview](../libraries/gesha.md) first.

## How to run the examples { #how-to-run }

All `.kf` programs are complete and can be run directly from your terminal at the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-1-and.kf
```

!!! note "Kaggle and Hugging Face datasets"
    The first time you run an example that uses Kaggle or Hugging Face datasets, you will need an internet connection to download them. On subsequent runs, KAFE uses the local copy saved in your cache.

!!! tip "Data preparation tip"
    When working with supervised datasets, always split your data into training and test sets before fitting the scaler (`scaler`). This prevents test set information from leaking into training.

## Dense networks and perceptrons { #dense-networks }

Dense layers connect every input to every neuron. They are ideal for learning logic tables, approximating mathematical functions, and classifying tabular data or small images.

| Architecture | Dataset | Shape | Task |
|---|---|---|---|
| [Single perceptron: AND](gesha/perceptron-and.md) | Truth table (generated in code) | 2 → 1 | Linear binary classification |
| [Single perceptron: OR](gesha/perceptron-or.md) | Truth table (generated in code) | 2 → 1 | Linear binary classification |
| [Multilayer perceptron: XOR](gesha/mlp-xor.md) | Truth table (generated in code) | 2 → 4 → 1 | Nonlinear binary classification |
| [Nonlinear function approximation](gesha/function-approximation.md) | Generated quadratic samples | 1 → 16 → 16 → 1 | Continuous regression |
| [Multiclass MLP: Iris](gesha/iris-mlp.md) | Iris Species (Kaggle) | 4 → 8 → 3 | Multiclass classification |
| [Binary MLP: Breast Cancer Wisconsin](gesha/breast-cancer-mlp.md) | Breast Cancer Wisconsin (Kaggle) | 30 → 16 → 8 → 1 | Binary classification |
| [Regression MLP: Red Wine Quality](gesha/wine-regression-mlp.md) | Red Wine Quality (Kaggle) | 11 → 32 → 16 → 1 | Multivariable regression |
| [Dense classifier: MNIST digits](gesha/mnist-dense-classifier.md) | MNIST as JPG images | 784 → 128 → 64 → 10 | Image classification |

## Convolutional, recurrent and integrated workflows { #workflows }

These examples show more advanced workflows. Some train complete models for computer vision or sequence processing; others demonstrate how data moves in a forward pass to inspect tensor shapes.

| Example | Data | Focus |
|---|---|---|
| [CNN: CIFAR-10](gesha/cnn-cifar10.md) | Kaggle CIFAR-10 images | Download RGB images with labels as `[channels, height, width]`, make a stratified train/test split, and train a two-convolution classifier with pooling and softmax. |
| [CNN: small image classifier](gesha/cnn-small.md) | Two generated 3 × 3 grayscale images | Build `Conv2D → Flatten → Dense`, compile with categorical cross-entropy, fit on two labeled images, and inspect probability vectors. |
| [Depthwise CNN block](gesha/cnn-depthwise.md) | One generated 4 × 4 image | Pass a channel-first image through depthwise convolution, batch normalization, global average pooling, and a softmax Dense layer. |
| [RNN: sequence classification](gesha/rnn-sequences.md) | Four generated binary sequences | Build `SimpleRNN → Dense`, fit on short labeled sequences, and compare predictions. |
| [RNN: temperature forecasting](gesha/rnn-temperature.md) | Kaggle daily minimum temperatures in Melbourne | Create seven-day windows, split chronologically so future days remain in the test set, fit preprocessing on training data, and predict the next day's temperature. |
| [Embedding and RNN: sentiment](gesha/rnn-sentiment.md) | Kaggle Yelp labeled sentences | Load labeled text, make a stratified split, fit the tokenizer on training sentences only, and train an embedding plus recurrent classifier. |
| [Bidirectional LSTM: token vectors](gesha/lstm-embedding.md) | One generated token sequence | Map token IDs to continuous vectors with `embedding`, process with a bidirectional LSTM, and pass the result to a sigmoid Dense layer. |
| [NUMK and dense classifier](gesha/numk-dense.md) | Three generated numeric vectors | Create numeric tensors with NUMK, fit a dense classifier, and inspect predicted probabilities. |
| [Autoencoder and K-Means: Iris](gesha/autoencoder-clustering.md) | Hugging Face Iris numeric features | Load four numeric features, train a `4 → 3 → 2 → 3 → 4` autoencoder, use its two-dimensional latent space as features for MACHINE K-Means, and render a cluster scatterplot with PLOT. |

??? info "For the curious 🤓"
    A dense layer computes $z = Wx + b$ and applies an activation function to each output:
    
    - **Sigmoid** is used for binary outputs (producing a probability between 0 and 1).
    - **Softmax** turns raw scores into a probability distribution for multiclass tasks (outputs sum to 1).
    - **Linear** preserves continuous real values for regression tasks.
    
    During training, backpropagation applies the chain rule to compute gradients and adjust weights. A layer with $n$ inputs and $m$ units requires $O(nm)$ weights and multiplications per sample.
    
    The AND, OR, and XOR examples evaluate all truth-table rows. The MNIST classifier intentionally uses a small training sample so the exercise runs quickly on any educational computer; its accuracy should not be compared with a full production training benchmark.

!!! tip "What did you learn?"
    - You can build any network in KAFE by stacking layers with `gesha.sequential`.
    - Each architecture matches a data format: truth tables and numbers with dense layers, images with convolutional layers (CNN), and text or time series with recurrent layers (RNN and LSTM).
    - KAFE libraries work together: you can use PARDOS to read tables, NUMK to manipulate tensors, GESHA to extract deep representations, MACHINE to cluster or classify, and PLOT to chart results.

## Continue exploring { #continue }

- [GESHA library reference](../libraries/gesha.md)
- [Dense networks and activations](../libraries/gesha/dense-networks.md)
- [Convolutional networks](../libraries/gesha/convolutional-networks.md)
- [Recurrent networks](../libraries/gesha/recurrent-networks.md)

