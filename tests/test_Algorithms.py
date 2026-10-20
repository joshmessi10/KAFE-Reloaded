import pytest
from utils import (
    assert_invalid_kafe_result,
    assert_valid_kafe_result,
    get_invalid_programs,
    get_parameters,
    get_programs,
    run_kafe_program,
)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_programs("../tests/Algorithms"))),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_invalid_programs("../tests/Algorithms"))),
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
