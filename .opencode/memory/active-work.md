# Active Work

## Current Feature

Test Perceptron Simple OR gate (KafeGESHA)

## Status

in_progress

## Current Step

Builder: crear tests/KafeGESHA/PerceptronSimple/or_gate.kf + .expec determinista (seed 42)

## Next Step

Tester: validar pytest; Reviewer: /dod; Historian: history

## Summary

Compuerta OR = problema linealmente separable resuelto con perceptron simple (1 neurona sigmoid, SGD, binary_crossentropy, 1000 epocas). A diferencia del and_gate existente (no determinista y con .expec corrupto), or_gate usa semilla fija 42 en create_dense para que el .expec sea reproducible.