# Initializers, regularization, and callbacks

Initialization controls the starting scale of weights. Very small weights can weaken signals; very large weights can destabilize gradients. Glorot initialization balances variance for many symmetric activations. He initialization is often a better starting point for ReLU. A fixed seed makes a teaching run reproducible, though it does not turn one train/test split into a robust estimate.

## Initializers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.zeros_initializer` | `() -> initializer` | All zeros |
| `gesha.ones_initializer` | `() -> initializer` | All ones |
| `gesha.constant_initializer` | `(value) -> initializer` | Constant value |
| `gesha.random_uniform` | `(minval, maxval, seed) -> initializer` | Uniform random |
| `gesha.random_normal` | `(mean, stddev, seed) -> initializer` | Gaussian random |
| `gesha.glorot_uniform` | `(seed) -> initializer` | Glorot/Xavier uniform |
| `gesha.glorot_normal` | `(seed) -> initializer` | Glorot/Xavier normal |
| `gesha.he_uniform` | `(seed) -> initializer` | He uniform (ReLU networks) |
| `gesha.he_normal` | `(seed) -> initializer` | He normal (ReLU networks) |
| `gesha.orthogonal` | `(gain, seed) -> initializer` | Orthogonal matrix (recurrent weights) |

Initializers are passed to layer factories through the `kernel_initializer` argument, e.g. `gesha.create_dense(16, "relu", [8], 0.0, 42, gesha.he_normal(42))`.


## Regularizers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.l1_regularizer` | `(value) -> regularizer` | L1 penalty |
| `gesha.l2_regularizer` | `(value) -> regularizer` | L2 penalty |
| `gesha.l1_l2_regularizer` | `(l1, l2) -> regularizer` | Combined L1 + L2 penalty |

Regularizers are passed to layer factories through the `kernel_regularizer` argument. The scalar `regularization_lambda` argument of `create_dense`/`create_conv2d` is a simpler per-layer L2 penalty.


L1 penalizes the absolute weight magnitude and can encourage sparse weights. L2 penalizes squared magnitude and shrinks large weights. Dropout randomly suppresses activations during training. These tools can reduce overfitting but do not replace held-out evaluation.

## Callbacks


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.early_stopping` | `(monitor, patience, min_delta, mode, restore_best_weights) -> callback` | Stops training when the monitored metric stops improving |
| `gesha.model_checkpoint` | `(filepath, monitor, save_best_only, mode) -> callback` | Saves weights at epoch end |
| `gesha.add_callback` | `(model, callback) -> VOID` | Attaches a callback to a model |

Callbacks can also be passed directly to `model.fit(..., callbacks=[...])`.


Early stopping monitors a validation metric and can stop after a patience window. A checkpoint saves weights for later reuse. Supply validation data when monitoring `val_loss`; otherwise choose a metric that the run actually computes.

## Tensor helpers


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.tensor` | `(data) -> List` | Validated numeric copy of a nested list |
| `gesha.tensor_zeros` | `(shape) -> List` | Zero-filled tensor |
| `gesha.tensor_ones` | `(shape) -> List` | One-filled tensor |
| `gesha.tensor_random` | `(shape) -> List` | Random-filled tensor |

These return NUMK numeric lists; Gesha does not define a separate Tensor type.

---


## Choosing an initializer

| Hidden activation or purpose | Useful starting choice | Why |
|---|---|---|
| ReLU hidden layer | `he_normal` or `he_uniform` | Scales variance for rectified activations. |
| Tanh or balanced dense layer | `glorot_uniform` or `glorot_normal` | Balances input and output variance. |
| Recurrent matrix | `orthogonal` | Helps preserve signal directions initially. |
| Reproducible teaching example | Any seeded random initializer | Makes comparisons repeatable. |

An initializer affects the start of training, not the final objective. It cannot compensate for a wrong target encoding or data leakage.

## Regularization tradeoffs

L1 adds a penalty proportional to the sum of absolute weights; L2 adds one proportional to squared weights. Strong penalties can underfit, while weak penalties may leave overfitting unchanged. Dropout applies random masking during training and is disabled for prediction. Compare training and validation behavior when choosing a strength.

## Callbacks and monitoring

Early stopping prevents further epochs after a monitored quantity stops improving for the configured patience. Restoring best weights can keep the strongest observed validation state. Model checkpointing writes weights during training. A `val_loss` monitor requires validation data; otherwise there is no validation loss to monitor. Keep a final test set untouched by this selection process.

## Tensor representation

NUMK lists carry numeric arrays; a GESHA model owns the layer graph and trainable parameters. `tensor_zeros`, `tensor_ones`, and `tensor_random` help create numeric inputs, but they do not replace `gesha.sequential` or determine the task loss.

[Back to Gesha overview](../gesha.md)
