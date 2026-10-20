# Dense classifier: MNIST digits

**Dataset:** [MNIST as JPG](https://www.kaggle.com/datasets/scolianni/mnistasjpg)  
**Architecture:** 784 → 128 → 64 → 10  
**Task:** Image classification

## Why this architecture?

The example flattens a 28×28 grayscale image to 784 features before two dense ReLU layers and a softmax output.

## Training and evaluation

Only two images per digit are sampled for a quick functional check. Low accuracy is expected; it is not a benchmark of a fully trained classifier.

Run the complete program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-8-mnist.kf
```

```kafe
--8<-- "docs/ejemplos/gesha-nivel-8-mnist.kf"
```

[Download the KAFE program](../gesha-nivel-8-mnist.kf) · [All Gesha examples](../gesha-examples.md)
