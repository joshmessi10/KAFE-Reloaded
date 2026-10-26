# Convolutional networks

A convolution shares a small kernel across spatial positions. This reduces the number of parameters compared with connecting every pixel to every output unit, while preserving local structure. For a `C × H × W` image and `F` filters of size `K_h × K_w`, the convolution kernel has approximately `F × C × K_h × K_w` weights. Runtime also depends on output height and width.

KAFE uses **channel-first** image tensors: `[channels][height][width]`. `kaggle.load_image_folder_dataset` returns this layout, and `gesha.create_conv2d` expects it. A common pipeline is convolution → activation → pooling → convolution → global average pooling → dense softmax.

## Convolutional layers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_conv1d` | `(filters, kernel_size, activation, input_shape, stride, padding, seed) -> GESHA` | 1-D convolution for **`[channels, length]`** inputs |
| `gesha.create_conv2d` | `(filters, kernel_size, activation, input_shape, stride, padding, seed, kernel_initializer, kernel_regularizer) -> GESHA` | 2-D convolution for `[channels, height, width]` inputs |
| `gesha.create_conv2d_transpose` | `(filters, kernel_size, activation, input_shape, stride, padding, seed) -> GESHA` | Transposed 2-D convolution (upsampling) |
| `gesha.create_depthwise_conv2d` | `(kernel_size, depth_multiplier, activation, input_shape, stride, padding, seed) -> GESHA` | Depthwise 2-D convolution |


## Pooling and spatial layers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.max_pooling1d` | `(pool_size, stride) -> GESHA` | Max pooling over 1-D inputs |
| `gesha.max_pooling2d` | `(pool_size, stride) -> GESHA` | Max pooling (default `[2, 2]`) |
| `gesha.average_pooling2d` | `(pool_size, stride) -> GESHA` | Average pooling (default `[2, 2]`) |
| `gesha.global_average_pooling2d` | `() -> GESHA` | Global average pooling |
| `gesha.global_max_pooling2d` | `() -> GESHA` | Global max pooling |
| `gesha.zero_padding2d` | `(padding) -> GESHA` | Zero padding (default `[1, 1]`) |
| `gesha.up_sampling2d` | `(size) -> GESHA` | Upsampling (default `[2, 2]`) |
| `gesha.reshape_layer` | `(target_shape) -> GESHA` | Reshapes its input |
| `gesha.permute_layer` | `(dims) -> GESHA` | Reorders the input dimensions |


Pooling reduces spatial resolution, while global average pooling collapses each channel to one value. Flattening creates a vector for a dense layer. Check shapes after every stage: a kernel or stride can make an output dimension invalid when the input is too small.

## Related programs

- [CNN on CIFAR-10](../../ejemplos/ejemplo-cnn-cifar10.kf)
- [Convolution demonstration](../../ejemplos/gesha-conv2d.kf)

## Shapes and parameters

For an input with height `H`, kernel height `K`, padding `P`, and stride `S`, the output height for an ordinary convolution is `floor((H + 2P − K)/S) + 1`; width follows the same rule. Check both dimensions before adding pooling or another convolution. A `valid` convolution uses no padding; padding preserves more border information but adds arithmetic.

The parameter count is `filters × input_channels × kernel_height × kernel_width` plus biases. The same kernel weights are reused at every spatial location. In contrast, flattening the image first and using a dense layer would connect every pixel to every output unit.

Conv2D, DepthwiseConv2D and Conv2DTranspose require `kernel_size` to contain exactly two positive **INTs**; a float shape such as `[3.0, 3.0]` is rejected by their constructors even though the wrapper's broad vector type accepts numeric lists. Conv2D and DepthwiseConv2D additionally require both kernel dimensions to be odd with `"same"` padding. Conv1D likewise requires an odd kernel with `"same"`. Filters, depth multipliers, strides and pooling dimensions are positive integer choices; use nonnegative integer padding and positive integer upsampling factors.

## Spatial dropout

`gesha.spatial_dropout2d(0.5, 42)` drops entire feature maps during training instead of individual scalar activations. These are positional KAFE arguments: rate, then seed. Omitting them uses rate `0.5` and an unseeded generator; `None` is not a KAFE literal. A high rate can underfit a small dataset; compare training and validation behavior. Prediction uses the complete network.

## Conv1D and recurrent layouts differ

Conv1D and MaxPooling1D use `[channels][length]`. RNN/LSTM/GRU use `[timesteps][features]`. For example, a single-channel three-position signal is `[[1.0, 2.0, 3.0]]` for Conv1D. Do not pass that layout directly to an RNN without arranging the axes to match the recurrent feature count. `permute_layer([1, 0])` changes the two-dimensional axis order; `reshape_layer` merely changes shape while preserving element order.

## Normalization and weight files

The implemented `batch_normalization` accepts one **CHW** sample and normalizes each channel over its spatial positions. It is not generic normalization of a dense vector or a statistic computed across the fit minibatch. Training updates running mean/variance; prediction uses that running state. `save_weights` saves trainable gamma/beta parameters but omits running mean/variance, so loading weights alone does not reproduce the complete normalization state.

## A one-image prediction is still a batch

`model.predict([image])` wraps one `[C,H,W]` image in a batch. Calling `model.predict(image)` treats the channel lists as separate samples and does not perform architecture-aware single-image detection. The same outer-batch rule applies to recurrent and token-sequence models.

The bounded `tests/TutorLibraries/gesha-cnn.kf` fixture exercises all convolution/pooling/spatial factories, checks dimensions and predicts one batched image without downloading data or performing long training. Shape evidence establishes these examples' behavior, not the accuracy of arbitrary image models.

## Choosing layers

| Need | Layer or function | Effect |
|---|---|---|
| Detect local patterns | `create_conv2d` | Shared spatial kernels. |
| Reduce resolution | `max_pooling2d` or `average_pooling2d` | Summarizes a local region. |
| Convert feature maps to a compact vector | `global_average_pooling2d` | One value per channel. |
| Connect spatial features to a classifier | `flatten_layer` then `create_dense` | Converts to a vector, then predicts. |
| Enlarge a spatial representation | `up_sampling2d` or `create_conv2d_transpose` | Increases spatial dimensions. |
| Stabilize activations | `batch_normalization` | Normalizes intermediate values. |

## Limits and checks

Channel order is a frequent error: KAFE image examples use `[C][H][W]`, not `[H][W][C]`. Confirm the shape of one loaded image before fitting. Convolutional models can be costly on nested Python lists, so begin with a small sample and inspect loss and predictions before scaling up. The CIFAR-10 example shows the complete pipeline but takes much longer than the dense gate examples.

[Back to Gesha overview](../gesha.md)
