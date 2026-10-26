# GESHA teaching contracts and evidence

The Tutor's reviewed GESHA contracts distinguish intended KAFE calls from Python backend implementation details. The pinned runtime surface contains **56 wrapper functions and five compatibility activation aliases**. Reviewed object contracts cover model/layer operations, safe numerical properties and explicit backend-only boundaries. Function names appearing in Python imports do not automatically become supported learner APIs.

## Choose a learning topic

| Topic | Reviewed scope |
|---|---|
| [Models and training](models-training.md) | Sequential/Functional assembly, positional compile/fit, validation, prediction, metrics, summaries and weights. |
| [Dense networks](dense-networks.md) | Perceptrons, MLPs, activation/output/loss choices, gradient properties and legacy aliases. |
| [Convolution](convolutional-networks.md) | Conv1D/Conv2D/depthwise/transposed convolution, pooling, CHW shapes, transforms and normalization limits. |
| [Sequences](recurrent-networks.md) | SimpleRNN/LSTM/GRU, bidirectional outputs, embeddings and batched prediction. |
| [Training tools](training-tools.md) | Initializers, regularizers, callbacks, tensor lists and isolated parameter serialization. |
| [Soft clustering](soft-clustering.md) | Empty-target experimental training and the interpretation of arbitrary cluster IDs. |

## What support means

A supported contract describes an available intended KAFE operation with reviewed usage evidence. Limited contracts identify restrictions such as prediction rank, Python-only training-history values or incomplete weight serialization. Functional graph construction remains experimental beyond its reviewed single-input branch-and-merge example. Compatibility aliases remain usable while canonical names are preferred. Unsupported contracts explain real backend boundaries rather than encourage invented KAFE APIs.

The L1L2 factory is a known unavailable GESHA binding in runtime 0.3.0, even though its Python penalty implementation exists. Direct mixed INT/FLOAT ReLU outputs, raw parameter handles and `len(List[GESHA])` have additional DSL restrictions. The individual topic pages give supported alternatives and negative-case evidence.

## Bounded runnable evidence

Small seeded fixtures under `tests/TutorLibraries/gesha-*.kf` exercise every usable wrapper and all five activation aliases through actual KAFE calls. The unavailable L1L2 factory has an explicit expected-error fixture. The grouped positive cases cover constructors, numerical dimensions, a short training/early-stopping workflow and property inspection. Negative cases also record unsupported dictionary history, parameter handles, lazy weight loading, multiple Functional inputs and an unbatched recurrent sample.

The weight/checkpoint fixture is isolated-only because it writes a local JSON parameter file. It is staged into a disposable runtime during validation. Ordinary Tutor reference lookup does not execute code or grant access to learner files.

Strict parsing through the end of each program, exact outputs/exit codes and repeated seeded runs establish bounded fixture behavior. Separate Python backend tests check further numerical/gradient properties. Neither evidence source proves arbitrary architecture combinations, learning efficacy, calibrated probabilities or a current learner execution. The Tutor should explain that distinction and use the exact contract for the requested API.

[Back to Gesha overview](../gesha.md)
