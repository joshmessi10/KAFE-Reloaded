# ROC-AUC

## Category

Machine Learning — Classification Metrics

## Description

ROC-AUC (Area Under the Receiver Operating Characteristic Curve) is a threshold-independent metric that evaluates binary classification models by measuring the trade-off between True Positive Rate and False Positive Rate across all possible classification thresholds.

## Mathematical Foundation

### ROC Curve

The ROC curve plots **TPR (True Positive Rate)** vs **FPR (False Positive Rate)** at various threshold settings:

$$TPR = \frac{TP}{TP + FN}$$

$$FPR = \frac{FP}{FP + TN}$$

- **TPR** (Sensitivity/Recall): proportion of actual positives correctly identified.
- **FPR**: proportion of actual negatives incorrectly identified as positive.

### AUC (Area Under Curve)

AUC is computed using the **Mann-Whitney U statistic** (equivalent to the Wilcoxon rank-sum test):

$$AUC = \frac{\sum_{i \in Pos} \sum_{j \in Neg} \mathbb{1}(s_i > s_j) + 0.5 \cdot \mathbb{1}(s_i = s_j)}{n_{pos} \cdot n_{neg}}$$

This represents the probability that a randomly chosen positive example has a higher score than a randomly chosen negative example.

**Geometric interpretation**: AUC = $\int_0^1 TPR(FPR^{-1}(t)) \, dt$, the area under the ROC curve.

### Complexity

- **Time**: $O(n \cdot m)$ where $n$ = number of positive samples, $m$ = number of negative samples (pairwise comparison).
- **Space**: $O(1)$ additional (no curve storage needed).

### Interpretation

| AUC Value | Interpretation |
|-----------|----------------|
| 1.0 | Perfect classifier |
| 0.8 - 1.0 | Excellent |
| 0.6 - 0.8 | Good |
| 0.5 - 0.6 | Fair |
| 0.5 | Random classifier (no discrimination) |
| < 0.5 | Worse than random (inverted predictions) |

## Step-by-Step Algorithm

1. Identify the two classes from `y_true` (binary required).
2. Count total positive samples ($n_{pos}$) and negative samples ($n_{neg}$).
3. For each positive sample $i$ and each negative sample $j$:
   - If $s_i > s_j$: concordant (+1.0)
   - If $s_i = s_j$: tied (+0.5)
   - If $s_i < s_j$: discordant (+0.0)
4. Sum concordant pairs and divide by total pairs ($n_{pos} \cdot n_{neg}$).
5. Return the resulting ratio.

## Motivation

Classification models often output probabilities or scores rather than hard labels. Accuracy and F1 require choosing a fixed threshold, which can be misleading when the threshold choice is arbitrary. ROC-AUC evaluates the model's ability to rank positive examples higher than negative examples regardless of threshold, making it ideal for comparing models and handling class imbalance.

## Advantages

- **Threshold-independent**: Evaluates the full range of operating points without requiring a fixed decision threshold.
- **Class imbalance friendly**: Uses rates (TPR, FPR) rather than counts, so performance is not dominated by the majority class.
- **Interpretable**: AUC directly represents the probability that a random positive is ranked above a random negative.
- **Model comparison**: Single scalar allows direct comparison of different classifiers.

## Limitations

- **Binary only**: The KAFE implementation supports only binary classification (two classes).
- **Does not calibrate probabilities**: AUC measures ranking quality, not probability calibration. A model can have high AUC but poorly calibrated probabilities.
- **Sensitive to class imbalance in scoring**: While robust to moderate imbalance, extreme imbalance can cause large confidence intervals.
- **Does not capture threshold-specific behavior**: Two models with the same AUC can have very different performance at specific operating points.

## When to Use

- Comparing binary classifiers (especially when threshold is not fixed).
- Evaluating models on imbalanced datasets.
- When you need a single summary statistic of discriminative ability.
- When the relative cost of false positives vs false negatives is unknown.

## When NOT to Use

- Multi-class problems (use macro/micro AUC extensions or other metrics).
- When probability calibration matters (use Brier score or log-loss).
- When you need threshold-specific metrics (use precision, recall, F1 at a specific threshold).

## Dependencies

- No external dependencies (computed from `y_true` and `y_score` vectors).

## Related Concepts

- Classification Metrics (accuracy, precision, recall, F1)
- Precision-Recall Curve and AUC
- Confusion Matrix

## Relationship with KAFE

Implemented in `src/lib/KafeMACHINE/metrics.py` as `roc_auc_score(y_true, y_score)`. Uses the Mann-Whitney U statistic for efficient computation without explicitly constructing the ROC curve. The KAFE implementation enforces binary classification and validates that both classes are present.

## Usage Examples

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[FLOAT] y_score = [0.9, 0.1, 0.8, 0.7, 0.2];

FLOAT auc = machine.roc_auc_score(y_true, y_score);
show(auc);  -- 1.0 (perfect separation)
```

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 0, 1];
List[FLOAT] y_score = [0.6, 0.4, 0.55, 0.45, 0.7];

FLOAT auc = machine.roc_auc_score(y_true, y_score);
show(auc);  -- 0.8333...
```

## Implementation Location

- `src/lib/KafeMACHINE/metrics.py` — `roc_auc_score()` function

## Public API

```kafe
machine.roc_auc_score(y_true, y_score) -> FLOAT
```

- `y_true`: `List[NUM]` — true binary labels (0 or 1)
- `y_score`: `List[NUM]` — target scores (probabilities or decision function values)
- Returns: `FLOAT` — AUC value in [0, 1]

## References

- Hanley, J. A., & McNeil, B. J. (1982). The meaning and use of the area under a receiver operating characteristic (ROC) curve. *Radiology*, 143(1), 29-36.
- Fawcett, T. (2006). An introduction to ROC analysis. *Pattern Recognition Letters*, 27(8), 861-874.
- scikit-learn documentation — `sklearn.metrics.roc_auc_score`
