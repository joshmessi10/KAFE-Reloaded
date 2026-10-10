"""Gradientes, lotes y API: pruebas matemáticas además de los fixtures KAFE."""
import copy
import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from lib.KafeGESHA import core, funciones
from lib.KafeGESHA.activations import ReLU, Sigmoide, Softmax
from lib.KafeGESHA.layers import Dense, Dropout, Flatten, Input, Add
from lib.KafeGESHA.losses import MeanSquaredError, CategoricalCrossEntropy, SparseCategoricalCrossEntropy
from lib.KafeGESHA.models import Sequential, Functional
from lib.KafeGESHA.optimizers import SGD, Adam, RMSprop, AdamW
from TypeUtils import obtener_tipo_dato


def leaves(values):
    if isinstance(values, list):
        for value in values:
            yield from leaves(value)
    else:
        yield values


def check_finite_difference(values, expected, objective):
    """Diferencias centrales sin reutilizar el backward ni NUMK."""
    analytic = iter(leaves(expected))

    def visit(items):
        for index, value in enumerate(items):
            if isinstance(value, list):
                visit(value)
                continue
            h = 1e-5
            items[index] = value + h
            plus = objective()
            items[index] = value - h
            minus = objective()
            items[index] = value
            assert next(analytic) == pytest.approx((plus - minus) / (2 * h), rel=2e-5, abs=2e-7)

    visit(values)


@pytest.mark.parametrize("activation", ["linear", "relu", "sigmoid", "tanh", "softmax"])
@pytest.mark.parametrize("batch", [False, True])
def test_dense_parameter_and_input_gradients(activation, batch):
    layer = Dense(2, activation, [2], seed=42)
    layer.w.data = [[0.3, -0.2], [0.4, 0.5]]
    layer.b.data = [0.1, -0.3]
    x = [[0.8, -0.6], [-0.3, 0.7]] if batch else [0.8, -0.6]
    y = [[0.7, 0.3], [0.2, 0.8]] if batch else [0.7, 0.3]
    loss = CategoricalCrossEntropy() if activation == "softmax" else MeanSquaredError()

    def objective():
        return loss.forward(layer.forward(x), y)

    objective()
    dx = copy.deepcopy(layer.backward(loss.backward()))
    dw, db = copy.deepcopy(layer.d_weights), copy.deepcopy(layer.d_biases)
    check_finite_difference(layer.w.data, dw, objective)
    check_finite_difference(layer.b.data, db, objective)
    check_finite_difference(x, dx, objective)


def test_activation_caches_each_component_and_copies_input():
    activation = ReLU()
    values = [-1.0, 0.0, 2.0]
    assert activation.forward(values) == [0, 0, 2]
    values[:] = [9, 9, 9]
    assert activation.backward([1, 2, 3]) == [0, 0, 3]
    sigmoid = Sigmoide()
    probabilities = sigmoid.forward([-2.0, 2.0])
    assert sigmoid.backward([1, 2]) == pytest.approx([probabilities[0] * (1-probabilities[0]),
                                                                   2*probabilities[1]*(1-probabilities[1])])


def test_softmax_extremes_and_cce_gradient():
    softmax = Softmax()
    p = softmax.forward([[1000.0, 1001.0, -1000.0], [-1000.0, -1000.0, -1000.0]])
    assert all(math.isfinite(v) for v in leaves(p))
    assert [sum(row) for row in p] == pytest.approx([1, 1])
    assert p[1] == pytest.approx([1/3]*3)
    loss = CategoricalCrossEntropy(epsilon=0.0)
    p = softmax.forward([0.2, -0.1, 0.4])
    loss.forward(p, [0.0, 1.0, 0.0])
    assert softmax.backward(loss.backward()) == pytest.approx([p[0], p[1]-1, p[2]])


def test_sparse_cce_matches_one_hot_for_sample_and_batch():
    sparse, dense = SparseCategoricalCrossEntropy(), CategoricalCrossEntropy()
    p = [[0.2, 0.8], [0.7, 0.3]]
    y = [[0.0, 1.0], [1.0, 0.0]]
    assert sparse.forward(p, [1, 0]) == dense.forward(p, y)
    assert list(leaves(sparse.backward())) == pytest.approx(list(leaves(dense.backward())))
    assert sparse.compute([1], p[0]) == dense.compute(y[0], p[0])


def test_minibatch_average_and_partial_batch(capsys):
    layer = Dense(1, "linear", [1])
    layer.w.data = [[0.0]]
    layer.b.data = [0.0]
    model = Sequential([layer])
    model.compile(SGD(lr=0.1), "mse")
    model.fit([[1.0], [2.0], [3.0]], [[1.0], [2.0], [3.0]], 1, 2)
    # Primer lote: w=.5, b=.3. Última muestra: error=-1.2, dw=-7.2, db=-2.4.
    assert layer.weights[0] == pytest.approx([1.22])
    assert layer.biases == pytest.approx([0.54])
    assert "Epoch 1/1 — Loss" in capsys.readouterr().out


def test_binary_training_reports_accuracy_and_history(capsys):
    layer = Dense(1, "sigmoid", [1])
    layer.w.data = [[0.0]]
    layer.b.data = [0.0]
    model = Sequential([layer])
    model.compile(SGD(lr=0.1), "binary_crossentropy")

    history = model.fit([[0.0], [1.0]], [[0.0], [1.0]], 1, 1)

    assert history['accuracy'] == [pytest.approx(0.0)]
    assert "Accuracy 0.00%" in capsys.readouterr().out


def test_lazy_parameters_are_updated_in_first_epoch():
    layer = Dense(1, "linear", seed=42)
    assert layer.parameters() == []
    reference = Dense(1, "linear", [1], seed=42)
    model = Sequential([layer])
    model.compile("sgd", "mse")
    model.fit([[1.0]], [[2.0]], 1, 1)
    assert layer.weights != reference.weights
    assert layer.biases != [0.0]


def test_multiclass_adam_learns_with_lazy_output():
    x = [[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]]
    labels = [0, 1, 2]
    model = Sequential([Dense(3, "softmax", seed=42)])
    model.compile(Adam(lr=0.05), "sparse_categorical_crossentropy")
    loss = SparseCategoricalCrossEntropy()
    before = loss.compute(labels, model.predict(x))
    model.fit(x, labels, 40, 2)
    after = loss.compute(labels, model.predict(x))
    assert after < before * 0.5
    assert model.predict_label(x) == labels
    assert isinstance(model.predict_label([x[0]]), list)


def test_validation_restores_training_mode():
    dropout = Dropout(0.0)
    model = Sequential([Dense(1, "linear", [1]), dropout])
    model.compile("sgd", "mse")
    model.fit([[1.0]], [[2.0]], 2, 1, ([[1.0]], [[2.0]]))
    assert dropout._training is True


def test_fit_rejects_invalid_batches_and_empty_data():
    model = Sequential([Dense(1)])
    model.compile()
    for x, y, size in [([], [], 1), ([[1]], [], 1), ([[1]], [[1]], 0), ([[1]], [[1]], 1.5)]:
        with pytest.raises(ValueError):
            model.fit(x, y, batch_size=size)


def test_tensor_factories_return_kafe_lists_and_no_wrapper():
    assert not hasattr(core, "Tensor")
    assert not hasattr(core, "tensor_zeros")
    value = funciones.tensor([[[1.0, 2.0]]])
    assert obtener_tipo_dato(value) == "List[List[List[FLOAT]]]"
    assert funciones.tensor_zeros([1, 2]) == [[0.0, 0.0]]
    assert funciones.tensor_ones([1, 2]) == [[1.0, 1.0]]
    assert len(funciones.tensor_random([1, 2])[0]) == 2
    assert obtener_tipo_dato(funciones.create_dense(1, "linear", [2])) == "GESHA"


def test_nd_flatten_and_dropout():
    flatten = Flatten()
    assert flatten.forward([[[1.0, 2.0]], [[3.0, 4.0]]]) == [1, 2, 3, 4]
    assert flatten.backward([4, 3, 2, 1]) == [[[4, 3]], [[2, 1]]]
    dropout = Dropout(0.0)
    assert dropout.forward([[1, 2], [3, 4]]) == [[1, 2], [3, 4]]
    assert dropout.backward([[1, 2], [3, 4]]) == [[1, 2], [3, 4]]


@pytest.mark.parametrize("optimizer_class", [SGD, Adam, RMSprop, AdamW])
def test_optimizer_updates_shared_parameter_once(optimizer_class):
    layer = Dense(1, "linear", [2])
    layer.w.data = [[1.0], [2.0]]
    layer.w.grad = [[0.5], [0.25]]
    layer.b.grad = [0.1]
    reference = copy.deepcopy(layer)
    optimizer_class().update([layer, layer])
    optimizer_class().update([reference])
    assert layer.weights == reference.weights
    assert layer.biases == reference.biases
    assert layer.weights != [[1.0], [2.0]]


def test_adam_first_step_matches_formula():
    parameter = core.Parameter([[1.0, -2.0]])
    parameter.grad = [[0.5, -0.25]]
    adam = Adam(lr=0.1)
    adam.step([parameter])
    assert parameter.data[0] == pytest.approx([1-0.1*0.5/(0.5+1e-8), -2+0.1*0.25/(0.25+1e-8)])
    assert adam.t == 1


def test_functional_branch_accumulates_gradients():
    inputs = Input([1])
    trunk = Dense(1, "linear", [1])
    left, right = Dense(1, "linear", [1]), Dense(1, "linear", [1])
    trunk.w.data, left.w.data, right.w.data = [[2.0]], [[3.0]], [[5.0]]
    shared_node = trunk.connect(inputs)
    merged = Add().connect([left.connect(shared_node), right.connect(shared_node)])
    model = Functional(inputs, merged)
    assert model.forward([1.0]) == [16.0]
    model.backward([1.0])
    assert trunk.d_weights == [[8.0]]


@pytest.mark.parametrize("operation", [
    lambda: Dense(0),
    lambda: Dense(1, input_shape=[2]).forward([1.0]),
    lambda: Dense(1).backward([1.0]),
    lambda: ReLU().backward([1.0]),
    lambda: Softmax().forward([]),
    lambda: MeanSquaredError().forward([1, 2], [1]),
])
def test_invalid_inputs_raise(operation):
    with pytest.raises((ValueError, RuntimeError)):
        operation()
