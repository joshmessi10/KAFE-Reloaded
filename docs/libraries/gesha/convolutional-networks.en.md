# GESHA: convolutional networks

**Convolutional networks** (CNNs) are made for **images**. Instead of connecting every pixel to every neuron, they slide a small **filter** over the whole image looking for the same pattern everywhere: an edge, a corner, a line.

## Convolution: a filter that slides over the image { #convolution }

### The idea in one sentence

A **filter** (or *kernel*) is a small table of weights, for example 2 × 2. It rests on a patch of the image, multiplies cell by cell, adds up, and moves along. The result is a **map** saying where the filter's pattern appears.

### An everyday comparison

It's like looking for Wally with a magnifying glass: you move it over the whole page looking for **the same thing** (a striped shirt) everywhere. You don't need a different glass for each corner.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-convolution.svg"
<figcaption>A 3 × 3 image with the numbers 1 to 9. A 2 × 2 window of ones slides over it, one position at a time. At each stop it adds the four numbers underneath and writes the result into a 2 × 2 output: 12, 16, 24 and 28.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-filter-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-filter-by-hand.expec"
```

!!! tip "What happened here?"
    1. The first stop, top left, adds 1 + 2 + 4 + 5 = `12`.
    2. `gesha.create_conv2d(1, [2, 2], "linear", [1, 3, 3], 1, "valid", 7, gesha.ones_initializer())` creates **1** filter of **2 × 2**, no activation, for **1-channel 3 × 3** images, moving **1** cell at a time, with no padding (`"valid"`), seed 7 and all its weights set to 1.
    3. `conv.forward(image)` gives the full output: `[[12, 16], [24, 28]]`.

In a real network the filter's weights **are learned**: the network discovers on its own which patterns to look for.

!!! warning "Image shape: channel first"
    In KAFE an image is `[channels][height][width]`. A black-and-white 3 × 3 image is `[[[...], [...], [...]]]`: a list (the channel) of 3 rows of 3 numbers. A colour image has 3 channels (red, green and blue).

??? info "For the curious 🤓"
    With height $H$, filter $K$, padding $P$ and stride $S$, the output height is $\lfloor (H + 2P - K)/S \rfloor + 1$; the width follows the same rule. Here, $(3 - 2)/1 + 1 = 2$. A filter has $F \times C \times K_h \times K_w$ weights plus $F$ biases, **regardless of the image size**, because it's reused at every position. A dense layer on the same image would need one weight per pixel per neuron.

## Pooling: shrink without losing what matters { #pooling }

### The idea in one sentence

**Pooling** splits the map into blocks and keeps a single number per block: the **largest** (*max pooling*) or the **average** (*average pooling*). The image shrinks but keeps the strong signals.

### An everyday comparison

It's like summarising a match by quarters: from each quarter you note only the most important play.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-pooling.svg"
<figcaption>A 4 × 4 image split into four 2 × 2 blocks. In each block the largest number lights up (4, 2, 2 and 8) and is copied into a 2 × 2 output: the image keeps its strongest signals at half the size.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-pooling.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-pooling.expec"
```

`max_pooling2d([2, 2], 2)` keeps each block's largest; `average_pooling2d` its average (the first block, 1, 3, 4, 2, gives `2.5`); and `global_average_pooling2d` summarises the **whole** channel in one number: `2.8125`.

## Your first convolutional network { #first-cnn }

3 × 3 images with a line: `0` if vertical, `1` if horizontal.

```kafe
--8<-- "tests/DocsExamples/gesha/cnn-lines.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/cnn-lines.expec"
```

!!! tip "What happened here?"
    1. The network is **convolution → flatten → dense**: 2 filters of 2 × 2 with `"tanh"` look for patterns, `flatten_layer` turns the maps into a list, and a `"sigmoid"` neuron decides.
    2. Each epoch's accuracy is measured **while** the network is still learning, which is why the last one says 83 %. Once finished, `predict_label` gets all 6 images right.
    3. It also correctly classifies two **noisy** images it never saw: a vertical line (`0`) and a horizontal one (`1`).

## The layers { #layers }

| Function | What it does |
|---|---|
| `gesha.create_conv2d(filters, [kh, kw], activation, [C, H, W], stride, padding, seed, initializer, regularizer)` | 2-D convolution. Padding `"valid"` (none) or `"same"` (same size). |
| `gesha.create_conv1d(filters, k, activation, [C, L], stride, padding, seed)` | 1-D convolution for `[channels][length]` signals. |
| `gesha.create_depthwise_conv2d([kh, kw], multiplier, activation, shape, stride, padding, seed)` | One filter per channel: cheaper. |
| `gesha.create_conv2d_transpose(filters, [kh, kw], activation, shape, stride, padding, seed)` | The "inverse": enlarges the image. |
| `gesha.max_pooling2d([ph, pw], stride)` / `average_pooling2d` / `max_pooling1d(p, stride)` | Pooling. |
| `gesha.global_average_pooling2d()` / `global_max_pooling2d()` | One number per channel. |
| `gesha.flatten_layer()` | Flattens before dense layers. |
| `gesha.zero_padding2d([p, p])` / `up_sampling2d([f, f])` | Adds borders of zeros / enlarges by repeating. |
| `gesha.reshape_layer(shape)` / `permute_layer(order)` | Changes the shape / reorders the axes. |
| `gesha.batch_normalization(epsilon, momentum)` | Normalizes each channel of an image. |
| `gesha.spatial_dropout2d(rate, seed)` | While training, randomly switches off whole maps. |

??? warning "Common mistake: a filter size with decimals"
    The filter size is two **integers**:

    ```kafe
    --8<-- "tests/DocsExamples/gesha/cnn-kernel-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/cnn-kernel-float.error.stderr.expec"
    ```

## Technical details { #details }

- With `"same"`, the 2-D and depthwise convolutions (and the 1-D one) need an **odd** filter size.
- To predict **one** image, wrap it: `model.predict([image])`. Without the outer list, KAFE treats each channel as a separate example.
- `batch_normalization` normalizes each channel of **one** `[C][H][W]` image over its positions; while training it updates its internal mean and variance, and when predicting it uses them. `save_weights` doesn't store those two values.
- Conv1D uses `[channels][length]`, but [recurrent networks](recurrent-networks.md) use `[steps][features]`: they're not interchangeable without reordering with `permute_layer([1, 0])`.
- CNNs on nested lists are slow: start with few images. The [CIFAR-10 example](../../ejemplos/gesha/cnn-cifar10.md) shows the full workflow.

| 👍 Strengths | 👎 Limits |
|---|---|
| Few weights: the same filter works across the whole image. | Slow in KAFE with large images. |
| They find a pattern wherever it is. | You have to watch the `[C][H][W]` shape at every step. |
