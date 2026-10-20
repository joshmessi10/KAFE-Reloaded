# CNN: small image classifier

**Data:** Two generated 3 × 3 grayscale images  
**Program:** [`gesha-conv2d.kf`](../gesha-conv2d.kf)

## What the program teaches

Build `Conv2D → Flatten → Dense`, compile with categorical cross-entropy, fit on two labeled images and inspect probability vectors. The tiny dataset illustrates tensor shapes and the API, not generalization.

## Reading the code

Open the [complete KAFE source](../gesha-conv2d.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Convolutional networks](../../libraries/gesha/convolutional-networks.md) · [All Gesha examples](../gesha-examples.md)
