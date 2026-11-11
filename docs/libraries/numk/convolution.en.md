# NUMK: convolution

Imagine looking at a photo through a **small magnifying glass**. You place it in the top corner, look at that little piece, write down what you see and move it one step to the right. When you reach the end of the row, you move down one step and start again. That is a **convolution**: a little window that slides over an image.

The little window is called a **kernel** (or **filter**). It is a small table of numbers. At each position, NUMK multiplies every number of the image by the kernel number sitting on top of it, and adds everything up (a [dot product](matrix-multiplication.md#dot)!). That total goes into one cell of the output image.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-conv.svg"
<figcaption>A 2 × 2 kernel slides over a 3 × 3 image. At each spot it multiplies and adds, filling one cell of the 2 × 2 output.</figcaption>
</figure>

Different kernels find different things: edges, corners, blobs… [GESHA's convolutional networks](../gesha/convolutional-networks.md) learn by themselves which numbers to put in their kernels, and inside they use these two functions.

## How an image is stored { #chw }

NUMK stores images in **CHW** order: first the **channels** (for example red, green and blue), then the **height** and then the **width**. A 3 × 3 black-and-white image has 1 channel, so its shape is `(1, 3, 3)`.

Kernels have 4 axes: `(filters, channels, height, width)`. Each **filter** produces one channel of the output.

Two more words:

- **stride**: how many cells the window jumps each time. With `1` it moves one by one.
- **padding**: `"valid"` only looks where the whole window fits, so the output is smaller. `"same"` puts zeros around the image so the output is the same size as the input.

### `numk.conv2d_chw(image, kernels, bias, stride, padding)` { #conv2d_chw }

**What it does:** Slides each kernel over the image and computes the output image.

**When to use it:** To see how a filter transforms an image, for example to blur it or to find edges.

| Parameter | Type | What it means |
|---|---|---|
| `image` | `List[List[List[INT | FLOAT]]]` | The image, of shape `(C, H, W)`. |
| `kernels` | `List[List[List[List[INT | FLOAT]]]]` | The kernels, of shape `(F, C, KH, KW)`. |
| `bias` | `List[INT | FLOAT]` | A number added at the end, one per filter (`F` numbers). |
| `stride` | `INT` | Optional. The window's step. If you leave it out, it is `1`. |
| `padding` | `STR` | Optional. `"valid"` or `"same"`. If you leave it out, it is `"valid"`. |

**Returns:** A tensor of shape `(F, output height, output width)`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/conv2d_chw.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/conv2d_chw.expec"
```

What happened here?

1. The kernel `[[1, 0], [0, 1]]` adds the top-left number and the bottom-right one: 1 + 5 = 6, 2 + 6 = 8, 4 + 8 = 12 and 5 + 9 = 14.
2. With `bias` equal to `[100]`, 100 is added to every cell.
3. The 3 × 3 `blur` kernel, full of ones, adds each number to all its neighbors. With `"same"` the output is still 3 × 3: the center is 1 + 2 + … + 9 = 45.

!!! note "Watch out"
    `"same"` works well with odd-sized kernels (3 × 3, 5 × 5). With a 2 × 2 kernel it adds no padding, so it gives the same as `"valid"`.

??? info "For the curious 🤓"
    With stride $s$, for filter $f$ and cell $(i, j)$:

    $$y_{f,i,j} = b_f + \sum_{c} \sum_{u} \sum_{v} x_{c,\, i s + u,\, j s + v} \; k_{f,c,u,v}$$

    The output size with `"valid"` is $\left\lfloor \frac{H - K_H}{s} \right\rfloor + 1$ by $\left\lfloor \frac{W - K_W}{s} \right\rfloor + 1$.

### `numk.conv2d_chw_backward(image, kernels, grad_output, stride, padding)` { #conv2d_chw_backward }

**What it does:** Walks a convolution **backward**. If you tell it how wrong each output cell was (`grad_output`), it works out how much of the blame belongs to each number of the image, of the kernels and of the `bias`. These "blames" are called **gradients**.

**When to use it:** When training a convolutional network: the gradients say how to change each kernel number to make fewer mistakes. GESHA uses it inside; you can use it to watch that calculation step by step.

| Parameter | Type | What it means |
|---|---|---|
| `image` | `List[List[List[INT | FLOAT]]]` | The same image as the forward pass, `(C, H, W)`. |
| `kernels` | `List[List[List[List[INT | FLOAT]]]]` | The same kernels, `(F, C, KH, KW)`. |
| `grad_output` | `List[List[List[INT | FLOAT]]]` | The error of each output cell. It has the shape of the output. |
| `stride` | `INT` | Optional. The same step as the forward pass. If you leave it out, it is `1`. |
| `padding` | `STR` | Optional. The same padding as the forward pass. If you leave it out, it is `"valid"`. |

**Returns:** Three things in parentheses: the image gradient (shape of `image`), the kernel gradient (shape of `kernels`) and the `bias` gradient (one number per filter).

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/conv2d_chw_backward.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/conv2d_chw_backward.expec"
```

What happened here? Every output cell had an error of 1. The `bias` takes part in all 4 cells, so its gradient is 4. The number in the center of the image (the 5) was used twice by the kernel's ones, so its gradient is 2.

!!! note "Watch out"
    The result comes out in parentheses because it is three things together. For now, use it with `show`: storing it in a variable does not work yet.

??? info "For the curious 🤓"
    With the chain rule: $\frac{\partial L}{\partial b_f} = \sum_{i,j} g_{f,i,j}$, $\frac{\partial L}{\partial k_{f,c,u,v}} = \sum_{i,j} g_{f,i,j}\, x_{c,\, i s + u,\, j s + v}$ and $\frac{\partial L}{\partial x_{c,\, i s + u,\, j s + v}} \mathrel{+}= g_{f,i,j}\, k_{f,c,u,v}$.

## What did you learn?

- A **convolution** slides a small kernel over an image and, at each spot, multiplies and adds.
- NUMK stores images as `(channels, height, width)`.
- `conv2d_chw` goes forward and `conv2d_chw_backward` computes the gradients on the way back, which are used for learning.

[Back to NUMK :material-arrow-left:](../numk.md){ .md-button }
[Next library: PARDOS :material-arrow-right:](../pardos.md){ .md-button .md-button--primary }
