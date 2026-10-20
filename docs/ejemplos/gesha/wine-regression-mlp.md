# Regression MLP: Red Wine Quality

**Dataset:** [Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009)  
**Architecture:** 11 → 32 → 16 → 1  
**Task:** Multivariable regression

## Why this architecture?

Eleven physicochemical measurements feed a ReLU network with a linear output.

## Training and evaluation

Fit the scaler on training data and report test MAE after converting predictions back to quality points.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-7-wine.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-7-wine.kf"
```

[Download the KAFE program](../gesha-nivel-7-wine.kf) · [All Gesha examples](../gesha-examples.md)
