import pytest
from utils import (
    assert_invalid_kafe_result,
    assert_valid_kafe_result,
    get_invalid_programs,
    get_programs,
    obtener_parametros,
    run_kafe_program,
)

SUBDIRS = [
    "linear",
    "neighbors",
    "tree",
    "preprocessing",
    "metrics/classification",
    "metrics/regression",
    "clustering",
    "naive_bayes",
    "model_selection",
    "svm",
    "ensemble",
]


def _all_programs():
    paths = []
    for d in SUBDIRS:
        paths.extend(get_programs(f"../tests/KafeMACHINE/{d}"))
    return paths


def _all_invalid_programs():
    paths = []
    for d in SUBDIRS:
        paths.extend(get_invalid_programs(f"../tests/KafeMACHINE/{d}"))
    return paths


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(_all_programs())),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_valid_kafe_result(result, programa, salida_esperada)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(_all_invalid_programs())),
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_invalid_kafe_result(result, programa, salida_esperada)
