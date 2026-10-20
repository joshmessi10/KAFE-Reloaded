# KAFE Examples

All neural network examples use `import gesha;`, the single public Gesha API (the deprecated aliases `import geshaDeep;` and `import geshaV2;` still resolve to the same backend).

There are also [eight levels of neural networks with Gesha](gesha-niveles.md) and [18 MACHINE methods with Kaggle datasets](machine-kaggle.md). Each MACHINE workflow displays five predictions or assignments and generates an SVG chart.

Complete, executable `.kf` programs. The canonical versions are located in `src/` (these are the ones executed by `python src/Kafe.py <file>`). The copies in this folder are provided so readers can consult them alongside the documentation without leaving `docs/`.

## Main Examples (Documentation Copies)

| File | Source | What It Teaches | Results |
|---|---|---|---|
| `ejemplo-cnn-cifar10.kf` | `src/Ejemplo.kf` | Complete computer vision pipeline: `kaggle.load_image_folder_dataset` (folder-based labels) → `machine.stratified_train_test_split` → CNN `Conv2D→MaxPooling2D→Conv2D→GlobalAveragePooling2D→Dense(10,softmax)` with `compile/fit/predict_label` and evaluation metrics | 4,000 RGB images (32×32); ~1 h 45 min of training (after ADR-0020); loss and accuracy per epoch |
| `ejemplo-rnn1-series.kf` | `src/EjemploRNN1.kf` | Time series with RNNs: `kaggle.load_dataset` → sliding windows `[7,1]` built using `while` → **chronological** 80/20 split (without shuffling, to prevent temporal data leakage) → min-max scaling based on training data → `SimpleRNN(16,tanh)+Dense(1,linear)` with Adam/MSE | Test MAE ≈ 2.71 °C on Melbourne minimum temperatures; ~2 min |
| `ejemplo-rnn2-sentimiento.kf` | `src/EjemploRNN2.kf` | Text → numbers → RNN: `kaggle.load_text_dataset` (TAB-separated, no header) → stratified split → `machine.tokenizer` (fitted ONLY on training data) → `Embedding+SimpleRNN(8,tanh)+Dense(1,sigmoid)` with Adam/BCE → batch `predict_label` and predictions on new sentences | Test accuracy ≈ 0.58 with ~284 sentences (overfitting documented in the file header); ~1.5 min |

The headers of all three examples explain the *why* behind each decision (not shuffling time series, fitting the tokenizer only on training data, and transparently documenting model limitations).

## Learning Paths

- [MACHINE: Choosing a Dataset and Algorithm](machine-kaggle.md)
- [GESHA: Eight Independent Levels](gesha-niveles.md)
- [MACHINE Reference by Topic](../libraries/machine.md)

The remaining `.kf` programs are available in this folder or in the Examples section of the documentation navigation.
