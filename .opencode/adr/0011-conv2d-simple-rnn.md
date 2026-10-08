# ADR-0011: Conv2D y SimpleRNN sobre NUMK

## Decisión

GESHA incorpora `Conv2D` y `SimpleRNN` como subclases de `Layer`. Conv2D usa
formato CHW/FCHW y SimpleRNN usa `[timesteps, features]`. NUMK implementa las
primitivas de convolución; GESHA conserva parámetros, activaciones y cachés.

## Razones

Un único formato explícito evita heurísticas de ejes. El contrato
`forward/backward/parameters` permite usar optimizadores y modelos existentes.

## Consecuencias

La implementación es portable y educativa, pero basada en CPU. SimpleRNN usa
BPTT completo. Conv2D `same` limita kernels a dimensiones impares.
