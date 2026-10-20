"""Regression checks for evaluation and neural graph invariants."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lib.KafeGESHA.layers import Dense, Input
from lib.KafeGESHA.models import Functional
from lib.KafeMACHINE.model_selection.model_selection import (
    CrossValScore,
    GridSearchCV,
    RandomizedSearchCV,
)
from lib.KafeMACHINE.neighbors.KNN import KNN
from lib.KafeMACHINE.svm.SVM import SVM


class CountingEstimator:
    def __init__(self):
        self.fit_calls = 0

    def fit(self, X, y):
        self.fit_calls += 1
        return self

    def predict(self, X):
        return [int(self.fit_calls == 1)] * len(X)


class ConstantEstimator:
    def __init__(self, value=0):
        self.value = value
        self.fit_calls = 0

    def fit(self, X, y):
        self.fit_calls += 1
        return self

    def predict(self, X):
        return [self.value] * len(X)


def test_svm_probabilities_follow_class_order():
    X, y = [[-2], [-1], [1], [2]], [0, 0, 1, 1]
    model = SVM(C=10, kernel="linear", max_iter=300).fit(X, y)
    assert model.predict(X) == y
    for label, probs in zip(model.predict(X), model.predict_proba(X), strict=True):
        assert sum(probs) == pytest.approx(1)
        assert model.classes_[probs.index(max(probs))] == label
    extreme = model.predict_proba([[-1_000_000], [1_000_000]])
    assert extreme[0] == pytest.approx([1.0, 0.0])
    assert extreme[1] == pytest.approx([0.0, 1.0])


def test_cross_validation_isolates_folds_and_caller():
    model = CountingEstimator()
    result = CrossValScore(cv=3, random_state=42).fit(
        model, [[i] for i in range(6)], [1] * 6
    )
    assert result.scores_ == [1.0] * 3
    assert model.fit_calls == 0


@pytest.mark.parametrize("search_type", [GridSearchCV, RandomizedSearchCV])
def test_search_minimizes_mse_and_isolates_caller(search_type):
    model = ConstantEstimator()
    if search_type is GridSearchCV:
        search = search_type({"value": [0, 10]}, cv=2, scoring="mse")
    else:
        search = search_type(
            {"value": [0, 10]}, n_iter=30, cv=2, scoring="mse", random_state=42
        )
    search.fit(model, [[i] for i in range(6)], [0] * 6)
    assert search.best_params_ == {"value": 0}
    assert search.best_score_ == 0
    assert model.fit_calls == 0


def test_functional_multi_output_backward_uses_separate_gradients():
    input_node = Input([1])
    left, right = Dense(1, "linear", [1]), Dense(1, "linear", [1])
    left.w.data, right.w.data = [[2.0]], [[3.0]]
    model = Functional(
        input_node, [left.connect(input_node), right.connect(input_node)]
    )
    model.forward([1.0])
    model.backward([[1.0], [2.0]])
    assert left.d_weights == [[1.0]]
    assert right.d_weights == [[2.0]]
    with pytest.raises(ValueError, match="one gradient per output"):
        model.backward([[1.0]])


@pytest.mark.parametrize(
    "search_type", [CrossValScore, GridSearchCV, RandomizedSearchCV]
)
def test_cv_rejects_prefitted_models(search_type):
    X, y = [[i] for i in range(6)], [0, 0, 0, 1, 1, 1]
    model = KNN(k=1).fit(X, y)
    if search_type is CrossValScore:
        search = search_type(cv=2)
    elif search_type is GridSearchCV:
        search = search_type({"k": [1]}, cv=2)
    else:
        search = search_type({"k": [1]}, n_iter=1, cv=2)
    with pytest.raises(ValueError, match="unfitted model"):
        search.fit(model, X, y)
