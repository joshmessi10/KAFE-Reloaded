import pytest
from utils import (
    assert_invalid_kafe_result,
    assert_valid_kafe_result,
    get_invalid_programs,
    get_programs,
    get_parameters,
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
    "program, input_text, expected_stdout",
    list(get_parameters(_all_programs())),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(_all_invalid_programs())),
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
