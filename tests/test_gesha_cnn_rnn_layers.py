import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeNUMK import funciones as numk
from lib.KafeGESHA.layers import SimpleRNN
from lib.KafeGESHA.layers import (
    Conv1D, DepthwiseConv2D, Conv2DTranspose, MaxPooling1D, MaxPooling2D,
    AveragePooling2D, GlobalAveragePooling2D, GlobalMaxPooling2D,
    BatchNormalization, ZeroPadding2D, UpSampling2D, Reshape, Permute,
    Concatenate, Multiply, SpatialDropout2D, LSTM, GRU, Bidirectional,
    Embedding,
)


IMAGE = [[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]]


def test_convolution_family_forward_backward_shapes():
    cases = [
        (Conv1D(2, 3, input_shape=[1, 5], seed=1), [[1.0, 2.0, 3.0, 4.0, 5.0]], (2, 3), (1, 5)),
        (DepthwiseConv2D([3, 3], 2, input_shape=[1, 3, 3], padding="same", seed=1), IMAGE, (2, 3, 3), (1, 3, 3)),
        (Conv2DTranspose(2, [3, 3], input_shape=[1, 3, 3], stride=2, seed=1), IMAGE, (2, 7, 7), (1, 3, 3)),
    ]
    for layer, value, output_shape, input_shape in cases:
        output = layer.forward(value)
        assert numk.shape(output) == output_shape
        assert numk.shape(layer.backward(numk.ones(list(output_shape)))) == input_shape


def test_pooling_family_values_and_shapes():
    assert MaxPooling1D().forward([[1.0, 3.0, 2.0, 4.0]]) == [[3.0, 4.0]]
    assert MaxPooling2D().forward(IMAGE) == [[[5.0]]]
    assert AveragePooling2D().forward(IMAGE) == [[[3.0]]]
    assert GlobalAveragePooling2D().forward(IMAGE) == [5.0]
    assert GlobalMaxPooling2D().forward(IMAGE) == [9.0]


def test_spatial_transform_family_is_invertible_in_backward():
    for layer, expected in [
        (ZeroPadding2D([1, 2]), (1, 5, 7)),
        (UpSampling2D([2, 3]), (1, 6, 9)),
        (Reshape([1, 9]), (1, 9)),
        (Permute([1, 2, 0]), (3, 3, 1)),
    ]:
        output = layer.forward(IMAGE)
        assert numk.shape(output) == expected
        assert numk.shape(layer.backward(numk.ones(list(expected)))) == (1, 3, 3)


def test_merge_layers_forward_backward():
    concat = Concatenate(1)
    output = concat.forward([[[1.0], [2.0]], [[3.0], [4.0]]])
    assert output == [[1.0, 3.0], [2.0, 4.0]]
    assert [numk.shape(v) for v in concat.backward(output)] == [(2, 1), (2, 1)]
    multiply = Multiply()
    assert multiply.forward([[1.0, 2.0], [3.0, 4.0]]) == [3.0, 8.0]
    assert multiply.backward([1.0, 1.0]) == [[3.0, 4.0], [1.0, 2.0]]


def test_normalization_dropout_and_embedding():
    batchnorm = BatchNormalization()
    normalized = batchnorm.forward(IMAGE)
    assert numk.shape(batchnorm.backward(numk.ones([1, 3, 3]))) == (1, 3, 3)
    assert abs(sum(v for row in normalized[0] for v in row)) < 1e-9
    dropout = SpatialDropout2D(0.5, seed=2)
    assert numk.shape(dropout.forward(IMAGE)) == (1, 3, 3)
    embedding = Embedding(8, 4, seed=3)
    assert numk.shape(embedding.forward([1, 2, 1])) == (3, 4)
    embedding.backward(numk.ones([3, 4]))
    assert embedding.embeddings.grad[1] == [2.0, 2.0, 2.0, 2.0]


def test_gated_recurrent_family_forward_backward_shapes():
    sequence = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
    for layer in [LSTM(3, [3, 2], seed=1), GRU(3, [3, 2], seed=1)]:
        assert numk.shape(layer.forward(sequence)) == (3,)
        assert numk.shape(layer.backward([1.0, 1.0, 1.0])) == (3, 2)
        assert all(parameter.grad is not None for parameter in layer.parameters())
    bidirectional = Bidirectional(SimpleRNN(2, input_shape=[3, 2], return_sequences=True, seed=1))
    assert numk.shape(bidirectional.forward(sequence)) == (3, 4)
    assert numk.shape(bidirectional.backward(numk.ones([3, 4]))) == (3, 2)
