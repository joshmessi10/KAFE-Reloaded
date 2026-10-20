"""Probabilistic models must retain information beyond floating-point density range."""

import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lib.KafeMACHINE.clustering.GaussianMixture import GaussianMixture
from lib.KafeMACHINE.naive_bayes.GaussianNB import GaussianNB


def test_gmm_high_dimensional_responsibilities_do_not_collapse():
    X = [[float(i + j % 3) for j in range(800)] for i in range(6)]
    model = GaussianMixture(n_components=2, random_state=42, max_iter=8).fit(X)
    assert model.means_[0] != model.means_[1]
    assert model.score(X) != 0
    assert max(model.predict_proba(X[:1])[0]) > 0.99


def test_gmm_outlier_has_worse_likelihood_and_bic_uses_natural_log():
    model = GaussianMixture(n_components=1, random_state=2, max_iter=5).fit(
        [[0.0], [1.0], [2.0]]
    )
    assert model.score([[1000.0]]) > model.score([[1.0]])
    X = [[0.0], [1.0], [2.0]]
    n_params = 2
    assert model.bic(X) == pytest.approx(
        n_params * math.log(len(X)) + 2 * model.score(X)
    )


def test_gaussian_nb_extreme_sample_keeps_class_order():
    model = GaussianNB().fit([[0.0], [1.0], [10.0], [11.0]], [0, 0, 1, 1])
    assert model.predict([[1000.0]]) == [1]
    assert model.predict_proba([[1000.0]])[0] == pytest.approx([0.0, 1.0])
