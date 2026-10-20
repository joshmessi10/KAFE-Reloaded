# Single perceptron: AND

**Dataset:** Truth table (generated in code)  
**Architecture:** 2 → 1  
**Task:** Binary classification

## Why this architecture?

A single sigmoid unit can separate the AND truth table with one linear boundary.

## Training and evaluation

Check all four binary inputs. Training and evaluation use the full truth table because only four cases exist.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-1-and.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-1-and.kf"
```

[Download the KAFE program](../gesha-nivel-1-and.kf) · [All Gesha examples](../gesha-examples.md)
