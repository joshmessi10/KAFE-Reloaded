# Nonlinear function approximation

**Dataset:** Generated quadratic samples  
**Architecture:** 1 → 16 → 16 → 1  
**Task:** Regression

## Why this architecture?

Two hidden tanh layers approximate the curve y = x²; the linear output preserves continuous values.

## Training and evaluation

Hold out sample positions and report mean absolute error on those points.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-4-funcion.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-4-funcion.kf"
```

[Download the KAFE program](../gesha-nivel-4-funcion.kf) · [All Gesha examples](../gesha-examples.md)
