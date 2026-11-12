# Reasoning about neural model behavior

[GESHA overview](../gesha.md) · [Models and training](models-training.md)

Treat model outputs and training traces as evidence to interpret. A conceptual explanation should help the learner form a hypothesis and choose a small experiment; it does not replace the learner's architecture, code or final conclusion.

## Scores and predicted labels

A raw numeric output and a predicted class are different. A suitable sigmoid output can represent a binary score. A threshold converts the score into a decision; changing that decision rule changes the balance of errors. A sigmoid output is not automatically a calibrated probability, and arbitrary regression outputs are not probabilities.

`model.predict` supplies numeric outputs; batches can return nested rows. `model.predict_label` uses the fixed half-probability threshold for a single output and selects the largest component for multiple outputs. It exposes no custom-threshold argument. Interpret the output shape and class meaning before considering a small explicit score comparison. Multiclass and regression outputs require their own interpretation.

An optional reflection is to explain what one output position means, then predict how a different decision rule would affect errors before checking held-out labels.

## Representation and nonlinear transformations

A dense layer computes a weighted sum and applies an activation. A single affine score with a monotonic binary decision rule has a linear boundary. Stacking affine layers without nonlinear activations still produces an affine transformation. Nonlinear hidden transformations can change the features available to a later decision.

For patterns such as XOR, ask the learner to sketch the labelled groups and test a proposed boundary. Let that geometry motivate a hypothesis about representation. Epoch count, learning rate and random seed affect optimization within the chosen architecture; they do not enlarge its hypothesis class. Do not replace that reasoning with a finished architecture, solved weights or copied program. Adequate representation also does not guarantee successful training or generalization.

## Learning rate and a changing loss

A gradient step subtracts a learning-rate-scaled gradient from the parameters. Steps too large for the local loss geometry can overshoot or diverge; very small steps can be slow. Mini-batch noise, scaling, initialization and optimizer state also affect the curve, so oscillation is not a unique diagnosis.

Compile before `model.set_lr` or `gesha.set_lr`, and choose a positive rate. Ask the learner to predict one effect, change one condition in a short controlled run and compare a trend rather than one epoch. A smoother training curve cannot repair every loss/target/shape problem and does not by itself establish stronger held-out performance.

## Overfitting and validation

Improving training fit alongside worsening validation behavior can suggest that training is adapting to sample-specific detail. Compare trends and compatible quantities, rather than treating one noisy observation as proof. This runtime may include regularization penalties in training loss while validation reports data loss, so absolute loss values are not always directly comparable.

Early stopping needs an actual monitored quantity, with validation data when monitoring validation loss. Dropout changes training behavior and is disabled for prediction. L2 penalties discourage large weights. These are possible controls to justify and test; they are not guarantees, and too much regularization or too little training can underfit. Keep the final test set separate from validation-driven choices. Ask which new observation would support or weaken the learner's explanation.
