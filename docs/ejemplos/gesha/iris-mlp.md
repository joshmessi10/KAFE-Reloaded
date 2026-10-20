# Multiclass MLP: Iris

**Dataset:** [Iris Species](https://www.kaggle.com/datasets/uciml/iris)  
**Architecture:** 4 → 8 → 3  
**Task:** Multiclass classification

## Why this architecture?

Four flower measurements enter a hidden ReLU layer; softmax returns three class scores.

## Training and evaluation

Use a stratified train/test split, fit the scaler on training data, and compare five test predictions.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-5-iris.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-5-iris.kf"
```

[Download the KAFE program](../gesha-nivel-5-iris.kf) · [All Gesha examples](../gesha-examples.md)
