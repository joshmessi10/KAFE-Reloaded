# Classification Metrics

## Category

Machine Learning — Evaluation Metrics

## Description

Classification metrics measure the performance of classification models by comparing predicted labels against true labels.

**Core Metrics**:

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Accuracy | $(TP + TN) / (TP + TN + FP + FN)$ | Overall correctness |
| Precision | $TP / (TP + FP)$ per class, macro-averaged | How many predicted positives are actual positives |
| Recall | $TP / (TP + FN)$ per class, macro-averaged | How many actual positives are correctly identified |
| F1 Score | $2 \cdot (Precision \cdot Recall) / (Precision + Recall)$ | Harmonic mean of precision and recall |
| Confusion Matrix | $N \times N$ matrix of actual vs predicted | Detailed error analysis |

**Macro vs Micro Averaging**:
- **Macro**: Compute metric per class, then average (treats all classes equally)
- **Micro**: Aggregate TP/FP/FN across all classes (weighted by class frequency)

KafeMACHINE uses **macro averaging** for precision, recall, and F1.

**When to Use Each**:
- **Accuracy**: Balanced datasets, all classes equally important
- **Precision**: When false positives are costly (spam detection)
- **Recall**: When false negatives are costly (disease detection)
- **F1**: When you need a balance between precision and recall
- **Confusion Matrix**: When you need detailed error analysis

## Motivation

Metrics are essential for evaluating model performance. Implementing them from scratch teaches how each metric is computed and when to use which one.

## Dependencies

- `BaseMachine.py` — models that produce predictions
- `TypeUtils.py` — type validation for input vectors

## Related Concepts

- Regression Metrics (MSE, MAE, R²)
- Precision-Recall Tradeoff
- ROC Curve and AUC

## Usage Examples

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[INT] y_pred = [1, 0, 1, 0, 0];

FLOAT acc = machine.accuracy_score(y_true, y_pred);      -- 0.8
FLOAT prec = machine.precision_score(y_true, y_pred);    -- 1.0
FLOAT rec = machine.recall_score(y_true, y_pred);        -- 0.666...
FLOAT f1 = machine.f1_score(y_true, y_pred);             -- 0.8
```

## Implementation Location

- `src/lib/KafeMACHINE/metrics.py` — all metric functions

## References

- scikit-learn documentation — `sklearn.metrics`
