# Reasoning about classifier evaluation

[MACHINE overview](../machine.md) · [Metric contracts](metrics.md)

Start with the question a result should answer. A function call supplies a calculation; interpreting it requires a positive-class definition, suitable data and an explicit criterion.

## Sensitivity and the positive class

Sensitivity is `TP / (TP + FN)`: the fraction of actual positives detected. A false negative was positive in the reference labels but predicted negative. Name the positive class before counting.

In `machine.confusion_matrix`, rows are actual classes, columns are predicted classes and labels follow the sorted union of labels in truth or predictions. Locate the positive label rather than assume a matrix position. `machine.recall_score` is a macro average over classes present in the true labels; it is not automatically the sensitivity of the chosen positive class. If a split has no actual positives, it cannot estimate that sensitivity. Keep this absence of evidence separate from the metric helper's zero-denominator reporting convention.

An explanation can begin by asking which observed cases belong in the denominator. Let the learner identify true positives and missed positives before doing arithmetic. High sensitivity alone says little about false alarms.

## Comparing classifiers when errors matter differently

Use comparable held-out examples and a consistent positive-class meaning. Identify which error has the more serious consequence and why. An agreed cost model can weight false-negative and false-positive counts differently, but its costs are assumptions that need justification.

The confusion matrix helps explain those trade-offs. Neither logistic regression nor Gaussian Naive Bayes is universally preferable. Ask the learner to select a criterion, compare their own observations and explain a conclusion. A larger accuracy value alone does not settle the choice, and repeatedly selecting against the final test set contaminates its role.

## Accuracy with imbalanced labels

Accuracy counts the fraction of matching labels. A classifier that always chooses the common class can appear accurate while missing every rare positive. Compare that baseline with the learner's actual predictions; inspect class counts and per-class behavior through the confusion matrix or classification report.

Macro summaries, positive-class sensitivity and the cost of errors answer different questions. A small minority count also makes estimates uncertain. Stratification preserves proportions where possible; it does not create more observations or guarantee an appropriate evaluation.

## Learning from held-out observations

Training data fits parameters. Validation data helps choose settings. A final test set estimates behavior after those choices. Fit preprocessing on training data and apply the learned transformation to other sets without refitting it there.

`machine.train_test_split` returns an indexable MACHINE container, not Python tuple destructuring, and does not stratify automatically. The stratified splitter can preserve class proportions, while cross-validation uses independent copies of an unfitted model for its supported scorers. Random splitting may be unsuitable for time-ordered or grouped observations.

A useful next step is to have the learner label each data set's role and identify which information has influenced the model or its selection. A successful training run alone cannot establish generalization.
