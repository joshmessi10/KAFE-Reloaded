"""Small counterexamples for the ML and Gesha logic contracts."""

import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lib.KafeGESHA.layers import Dense, Dropout, SpatialDropout2D
from lib.KafeGESHA.models import Sequential
from lib.KafeGESHA.optimizers import SGD
from lib.KafeMACHINE.clustering.AgglomerativeClustering import AgglomerativeClustering
from lib.KafeMACHINE.ensemble.AdaBoost import AdaBoostClassifier
from lib.KafeMACHINE.ensemble.GradientBoosting import GradientBoostingClassifier
from lib.KafeMACHINE.metrics import classification_report, f1_score, silhouette_score


def test_macro_f1_averages_class_scores():
    actual = [0, 0, 0, 0, 1, 1]
    predicted = [0, 0, 0, 1, 1, 1]
    expected = (6 / 7 + 4 / 5) / 2
    assert f1_score(actual, predicted) == pytest.approx(expected)
    report = classification_report(actual, predicted)
    assert "macro avg" in report
    assert "0.83" in report.split("macro avg")[1].splitlines()[0]
    assert "0.84" in report.split("weighted avg")[1].splitlines()[0]


def test_silhouette_singleton_contributes_zero():
    # Cluster 1 consists of one point; cluster 0 scores 0.888... and 0.9.
    assert silhouette_score([[0.0], [1.0], [10.0]], [0, 0, 1]) == pytest.approx(
        (8 / 9 + 9 / 10) / 3
    )
    with pytest.raises(Exception, match="fewer clusters than samples"):
        silhouette_score([[0.0], [1.0]], [0, 1])


def test_adaboost_learns_both_threshold_orientations():
    x = [[0.0], [1.0], [2.0], [3.0]]
    for targets in ([0, 0, 1, 1], [1, 1, 0, 0]):
        model = AdaBoostClassifier(n_estimators=3)
        model.fit(x, targets)
        assert model.predict(x) == targets


def test_gradient_boosting_starts_with_positive_class_log_odds():
    x = [[0.0]] * 9 + [[1.0]]
    y = [0] * 9 + [1]
    model = GradientBoostingClassifier(n_estimators=1, random_state=7)
    model.fit(x, y)
    assert model.initial_prediction_ == pytest.approx(math.log(1 / 9))
    assert model.predict([[0.0]]) == [0]
    assert model.score(x, y) >= 0.9
    learned = GradientBoostingClassifier(n_estimators=10, learning_rate=0.3, max_depth=1, random_state=7)
    learned.fit(x, y)
    assert learned.predict([[0.0], [1.0]]) == [0, 1]


def test_agglomerative_rejects_more_clusters_than_samples():
    with pytest.raises(ValueError, match="cannot exceed samples"):
        AgglomerativeClustering(n_clusters=3).fit([[0.0], [1.0]])


def test_gesha_l2_penalty_appears_in_training_loss():
    layer = Dense(1, "linear", [1], regularization_lambda=0.2)
    layer.w.data = [[2.0]]
    layer.b.data = [0.0]
    model = Sequential([layer])
    model.compile(SGD(lr=0.1), "mse")
    history = model.fit([[0.0]], [[0.0]], epochs=1)
    assert history["loss"] == pytest.approx([0.4])


def test_gesha_soft_cluster_loss_matches_output_gradient():
    model = Sequential([])
    outputs = [0.2, 0.8]
    centers = [[0.0], [2.0]]
    loss, gradient = model._unsupervised_loss_and_grad([0.5], outputs, centers)
    assert loss >= 0
    for index in range(2):
        h = 1e-6
        plus = outputs.copy()
        minus = outputs.copy()
        plus[index] += h
        minus[index] -= h
        numeric = (
            model._unsupervised_loss_and_grad([0.5], plus, centers)[0]
            - model._unsupervised_loss_and_grad([0.5], minus, centers)[0]
        ) / (2 * h)
        assert gradient[index] == pytest.approx(numeric)


def test_dropout_seed_reproduces_a_sequence_of_distinct_masks():
    left, right = Dropout(0.5, seed=17), Dropout(0.5, seed=17)
    sample = [1.0] * 32
    first, second = left.forward(sample), left.forward(sample)
    assert first == right.forward(sample)
    assert second == right.forward(sample)
    assert first != second
    spatial_left = SpatialDropout2D(0.5, seed=17)
    spatial_right = SpatialDropout2D(0.5, seed=17)
    image = [[[1.0]]] * 32
    first = spatial_left.forward(image)
    second = spatial_left.forward(image)
    assert first == spatial_right.forward(image)
    assert second == spatial_right.forward(image)
    assert first != second
