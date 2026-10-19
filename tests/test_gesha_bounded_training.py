"""Short behavioral checks for the long KafeGESHA teaching examples."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from lib.KafeGESHA.layers import Dense
from lib.KafeGESHA.losses import BinaryCrossEntropy
from lib.KafeGESHA.models import Sequential
from lib.KafeGESHA.optimizers import SGD


@pytest.mark.parametrize(
    ("name", "labels", "hidden"),
    [
        ("AND", [0, 0, 0, 1], False),
        ("OR", [0, 1, 1, 1], False),
        ("XOR", [0, 1, 1, 0], True),
    ],
)
def test_gate_training_reduces_loss(name, labels, hidden, capsys):
    """Exercise forward, backward and updates without convergence-length runs."""
    inputs = [[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]]
    layers = [Dense(4, "tanh", [2], seed=42)] if hidden else []
    layers.append(Dense(1, "sigmoid", [4 if hidden else 2], seed=43))
    model = Sequential(layers)
    model.compile(SGD(lr=0.1), "binary_crossentropy")
    loss = BinaryCrossEntropy()
    before = loss.compute([[label] for label in labels], model.predict(inputs))

    history = model.fit(inputs, labels, 2, 4)

    after = loss.compute([[label] for label in labels], model.predict(inputs))
    assert len(history["loss"]) == 2, name
    assert after < before, name
    assert all(0.0 < prediction[0] < 1.0 for prediction in model.predict(inputs))
    capsys.readouterr()
