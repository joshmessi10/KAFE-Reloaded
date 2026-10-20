# Binary MLP: Breast Cancer Wisconsin

**Dataset:** [Breast Cancer Wisconsin](https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data)  
**Architecture:** 30 → 16 → 8 → 1  
**Task:** Experimental binary classification

## Why this architecture?

Thirty numeric measurements feed a ReLU network with a sigmoid output.

## Training and evaluation

Use a stratified train/test split and compare five held-out predictions. This educational example is not a diagnostic tool.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-6-breast-cancer.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-6-breast-cancer.kf"
```

[Download the KAFE program](../gesha-nivel-6-breast-cancer.kf) · [All Gesha examples](../gesha-examples.md)
