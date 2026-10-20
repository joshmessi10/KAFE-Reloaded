# Gesha examples

These programs teach neural network architectures through complete KAFE workflows. Choose an architecture rather than a numbered level. Every program imports the canonical `gesha` API.

For supervised Kaggle datasets, split the data before fitting the scaler. The first download requires network access. Metrics from these small educational runs are not production performance estimates.

| Architecture | Dataset | Shape | Task |
|---|---|---|---|
| [Single perceptron: AND](gesha/perceptron-and.md) | Truth table (generated in code) | 2 → 1 | Binary classification |
| [Single perceptron: OR](gesha/perceptron-or.md) | Truth table (generated in code) | 2 → 1 | Binary classification |
| [Multilayer perceptron: XOR](gesha/mlp-xor.md) | Truth table (generated in code) | 2 → 4 → 1 | Nonlinear binary classification |
| [Nonlinear function approximation](gesha/function-approximation.md) | Generated quadratic samples | 1 → 16 → 16 → 1 | Regression |
| [Multiclass MLP: Iris](gesha/iris-mlp.md) | Iris Species | 4 → 8 → 3 | Multiclass classification |
| [Binary MLP: Breast Cancer Wisconsin](gesha/breast-cancer-mlp.md) | Breast Cancer Wisconsin | 30 → 16 → 8 → 1 | Experimental binary classification |
| [Regression MLP: Red Wine Quality](gesha/wine-regression-mlp.md) | Red Wine Quality | 11 → 32 → 16 → 1 | Multivariable regression |
| [Dense classifier: MNIST digits](gesha/mnist-dense-classifier.md) | MNIST as JPG | 784 → 128 → 64 → 10 | Image classification |

## Convolutional, recurrent and integrated workflows

The following programs are also Gesha examples. Some train a model; the depthwise CNN and bidirectional LSTM pages demonstrate a forward pass only.

| Example | Data | Focus |
|---|---|---|
| [CNN: CIFAR-10](gesha/cnn-cifar10.md) | Kaggle CIFAR-10 images | Download class-labeled RGB images as `[channels, height, width]`, make a stratified train/test split, then fit a two-convolution classifier with pooling and softmax. |
| [CNN: small image classifier](gesha/cnn-small.md) | Two generated 3 × 3 grayscale images | Build `Conv2D → Flatten → Dense`, compile with categorical cross-entropy, fit on two labeled images and inspect probability vectors. |
| [Depthwise CNN block](gesha/cnn-depthwise.md) | One generated 4 × 4 image | Pass a channel-first image through depthwise convolution, batch normalization, global average pooling and a softmax Dense layer. |
| [RNN: sequence classification](gesha/rnn-sequences.md) | Four generated binary sequences | Build `SimpleRNN → Dense`, fit on short labeled sequences, then compare predictions. |
| [RNN: temperature forecasting](gesha/rnn-temperature.md) | Kaggle daily minimum temperatures in Melbourne | Create seven-day windows, split chronologically so future days stay in the test set, fit preprocessing on training data and use a recurrent network to predict the next day's temperature. |
| [Embedding and RNN: sentiment](gesha/rnn-sentiment.md) | Kaggle Yelp labeled sentences | Load labeled text, make a stratified split, fit the tokenizer on training sentences only, then train an embedding plus recurrent classifier. |
| [Bidirectional LSTM: token vectors](gesha/lstm-embedding.md) | One generated token sequence | Map token IDs to vectors with `embedding`, run a bidirectional LSTM and pass the result to a sigmoid Dense layer. |
| [NUMK and dense classifier](gesha/numk-dense.md) | Three generated numeric vectors | Create numeric lists with NUMK, fit a dense classifier and inspect probabilities. |
| [Autoencoder and K-Means: Iris](gesha/autoencoder-clustering.md) | Hugging Face Iris numeric features | Load four numeric features, train a `4 → 3 → 2 → 3 → 4` autoencoder, use its two-dimensional encoder output as features for MACHINE K-Means, and render a cluster scatterplot with PLOT. |

A dense layer computes `z = Wx + b` and applies an activation. Sigmoid is suitable for a binary output, softmax for multiclass scores, and linear for regression. Backpropagation uses the chain rule to adjust weights. A layer with `n` inputs and `m` units needs `O(nm)` weights and forward arithmetic per sample.

The AND, OR, and XOR programs evaluate all four truth-table rows. The MNIST program uses only one training image per digit for a fast functional exercise; its accuracy should not be compared with a trained MNIST benchmark.

[Gesha library reference](../libraries/gesha.md)
