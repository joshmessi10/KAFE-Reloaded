"""Importaciones agrupadas de capas convolucionales."""
from .conv1d import Conv1D
from .conv2d import Conv2D
from .depthwise_conv2d import DepthwiseConv2D
from .conv2d_transpose import Conv2DTranspose
__all__ = ["Conv1D", "Conv2D", "DepthwiseConv2D", "Conv2DTranspose"]
