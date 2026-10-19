import json
import pytest

from lib.KafeGESHA.initializers import (Zeros, Ones, RandomUniform, RandomNormal,
    GlorotUniform, GlorotNormal, HeUniform, HeNormal, Orthogonal, Constant)
from lib.KafeGESHA.regularizers import L1, L2, L1L2
from lib.KafeGESHA.callbacks import EarlyStopping, ModelCheckpoint
from lib.KafeGESHA.layers import Dense
from lib.KafeGESHA.models import Sequential


def test_constant_initializers_create_requested_shape():
    assert Zeros()([2, 2]) == [[0.0, 0.0], [0.0, 0.0]]
    assert Ones()([2]) == [1.0, 1.0]
    assert Constant(3)([2]) == [3.0, 3.0]

@pytest.mark.parametrize('initializer', [RandomUniform(seed=7), RandomNormal(seed=7),
    GlorotUniform(seed=7), GlorotNormal(seed=7), HeUniform(seed=7), HeNormal(seed=7)])
def test_random_initializers_are_seeded(initializer):
    assert initializer([3, 2]) == initializer([3, 2])

def test_orthogonal_columns_are_orthonormal():
    matrix = Orthogonal(seed=3)([4, 3])
    for a in range(3):
        for b in range(3):
            dot = sum(row[a] * row[b] for row in matrix)
            assert dot == pytest.approx(1.0 if a == b else 0.0, abs=1e-9)

def test_regularizer_penalties_and_gradients():
    weights = [[-2.0, 0.0, 3.0]]
    assert L1(.1).penalty(weights) == pytest.approx(.5)
    assert L2(.1).gradient(weights)[0] == pytest.approx([-.4, 0.0, .6])
    assert L1L2(.1, .1).penalty(weights) == pytest.approx(1.8)

def test_dense_uses_initializer_and_regularizer():
    layer = Dense(2, input_shape=[2], kernel_initializer=Ones(), kernel_regularizer=L2(.1))
    assert layer.weights == [[1.0, 1.0], [1.0, 1.0]]
    assert layer.w.regularizer.penalty(layer.weights) == pytest.approx(.4)

def test_early_stopping_interrupts_constant_training():
    model = Sequential([Dense(1, input_shape=[1], kernel_initializer=Zeros())])
    model.compile(optimizer='sgd', loss='mse')
    history = model.fit([[0.0]], [[0.0]], epochs=10,
                        callbacks=[EarlyStopping('loss', patience=0)])
    assert len(history['loss']) == 2

def test_checkpoint_saves_and_loads_weights(tmp_path):
    path = tmp_path / 'weights.json'
    model = Sequential([Dense(1, input_shape=[1], kernel_initializer=Ones())])
    model.compile(optimizer='sgd', loss='mse')
    model.fit([[1.0]], [[0.0]], epochs=1,
              callbacks=[ModelCheckpoint(str(path), monitor='loss')])
    assert json.loads(path.read_text())[0]['name'].endswith('_w')
    model.layers[0].w.data = [[99.0]]
    model.load_weights(str(path))
    assert model.layers[0].w.data != [[99.0]]

def test_invalid_configuration_errors():
    with pytest.raises(ValueError): RandomNormal(stddev=-1)
    with pytest.raises(ValueError): EarlyStopping(mode='sideways')
