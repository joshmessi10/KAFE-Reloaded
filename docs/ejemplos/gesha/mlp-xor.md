# Multilayer perceptron: XOR

**Dataset:** Truth table (generated in code)  
**Architecture:** 2 → 4 → 1  
**Task:** Nonlinear binary classification

## Why this architecture?

XOR cannot be separated by one line. A hidden tanh layer creates a nonlinear representation before the sigmoid output.

## Training and evaluation

Check all four binary inputs after training.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-3-xor.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-3-xor.kf"
```

[Download the KAFE program](../gesha-nivel-3-xor.kf) · [All Gesha examples](../gesha-examples.md)
