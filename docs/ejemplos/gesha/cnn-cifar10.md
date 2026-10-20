# CNN: CIFAR-10

**Data:** Kaggle CIFAR-10 images  
**Program:** [`ejemplo-cnn-cifar10.kf`](../ejemplo-cnn-cifar10.kf)

## What the program teaches

Download class-labeled RGB images as `[channels, height, width]`, make a stratified train/test split, then fit a two-convolution classifier with pooling and softmax. Inspect held-out predictions. This is the full image workflow; the first download and training can take time.

## Reading the code

Open the [complete KAFE source](../ejemplo-cnn-cifar10.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Convolutional networks](../../libraries/gesha/convolutional-networks.md) · [All Gesha examples](../gesha-examples.md)
