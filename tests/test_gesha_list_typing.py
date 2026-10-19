from global_utils import verify_homogeneity
from lib.KafeGESHA.layers.core.dense import Dense
from lib.KafeGESHA.layers.recurrent.simple_rnn import SimpleRNN


def test_mixed_gesha_layers_share_kafe_type_without_relaxing_primitive_lists():
    layers = [SimpleRNN(2, "tanh", [3, 1]), Dense(1, "sigmoid", [2])]

    assert verify_homogeneity(layers)
    assert not verify_homogeneity([1, "one"])
