import os

import pytest
from utils import (
    assert_valid_kafe_result,
    get_parameters,
    get_programs,
    run_kafe_program,
)


def _get_tensor_programs():
    """Find only tensor .kf programs (test_tensor_*.kf)."""
    all_programs = get_programs("../tests/KafeGESHA")
    return [p for p in all_programs if os.path.basename(p).startswith("test_tensor")]


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(_get_tensor_programs())),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)
    assert_valid_kafe_result(result, program, expected_stdout)
