# Decision Tree Classifier

## Category

Machine Learning — Supervised Learning (Classification)

## Description

A Decision Tree is a supervised learning algorithm that recursively partitions the feature space into regions by learning simple decision rules from data. At each internal node, the algorithm selects the feature and threshold that best splits the data according to a purity criterion. At leaf nodes, the majority class of training samples becomes the prediction.

## Motivation

Decision Trees are fundamental in machine learning because they are fully interpretable, require no feature scaling, handle non-linear relationships naturally, and support multi-class classification natively. They serve as the building block for ensemble methods like Random Forest and Gradient Boosting.

## Splitting Criteria

### Gini Impurity

`Gini(S) = 1 - Σ(pᵢ²)` where pᵢ is the fraction of elements belonging to class i.

- Ranges from 0 (pure node) to `1 - 1/n_classes` (maximum impurity)
- Computationally simpler (no logarithm)

### Entropy / Information Gain

`Entropy(S) = -Σ(pᵢ · log₂(pᵢ))`

Information Gain = parent entropy - weighted child entropy

- More theoretically grounded in information theory
- Requires log computation

## Dependencies

- `lib.KafeMATH.funciones.log` — for entropy calculation (log base 2)

## Related Concepts

- Gini Impurity
- Entropy (Information Theory)
- Information Gain
- Overfitting and Pruning
- Random Forest (ensemble of decision trees)

## Usage in KAFE

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE model = machine.decision_tree_classifier();
model.fit(X, y);

List[INT] preds = model.predict([[1.0, 2.0], [7.0, 7.0]]);
show(preds);
```

## Implementation Location

- `src/lib/KafeMACHINE/DecisionTree.py` — DecisionTreeClassifier class

## Public API

- `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `model.fit(X, y)` — build the tree
- `model.predict(X)` — predict classes
- `model.score(X, y)` — accuracy

## References

- Breiman, L. et al. (1984). Classification and Regression Trees.
- Quinlan, J.R. (1986). Induction of Decision Trees. Machine Learning.
