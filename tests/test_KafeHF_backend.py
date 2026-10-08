import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeHF import funciones as hf


class FakeDataset:
    column_names = ["x", "y", "label"]

    def __init__(self, rows):
        self.rows = rows

    def __iter__(self):
        return iter(self.rows)

    def select_columns(self, columns):
        return FakeDataset([{name: row[name] for name in columns} for row in self.rows])


def test_load_dataset_matrix_selects_numeric_columns(monkeypatch):
    calls = {}
    dataset = FakeDataset([{"x": 1, "y": 2.5, "label": "a"}, {"x": 3, "y": 4, "label": "b"}])

    def fake_load(name, **kwargs):
        calls.update(name=name, kwargs=kwargs)
        return dataset

    monkeypatch.setattr(hf, "_HF_AVAILABLE", True)
    monkeypatch.setattr(hf, "hf_load_dataset", fake_load)
    result = hf.load_dataset_matrix("demo", ["x", "y"], "train", 1)
    assert result == [[1.0, 2.5]]
    assert calls == {"name": "demo", "kwargs": {"split": "train"}}


def test_load_dataset_matrix_infers_numeric_columns(monkeypatch):
    dataset = FakeDataset([{"x": 1, "y": 2.5, "label": "a"}])
    monkeypatch.setattr(hf, "_HF_AVAILABLE", True)
    monkeypatch.setattr(hf, "hf_load_dataset", lambda *a, **k: dataset)
    assert hf.load_dataset_matrix("demo") == [[1.0, 2.5]]


def test_load_dataset_matrix_rejects_non_numeric(monkeypatch):
    dataset = FakeDataset([{"x": 1, "y": "bad", "label": "a"}])
    monkeypatch.setattr(hf, "_HF_AVAILABLE", True)
    monkeypatch.setattr(hf, "hf_load_dataset", lambda *a, **k: dataset)
    with pytest.raises(Exception, match="no numéricos"):
        hf.load_dataset_matrix("demo", ["x", "y"])
