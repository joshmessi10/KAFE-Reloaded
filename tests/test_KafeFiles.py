import pytest
import os
from utils import (
    assert_invalid_kafe_result,
    assert_valid_kafe_result,
    get_invalid_programs,
    get_programs,
    get_parameters,
    run_kafe_program,
)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_programs("../tests/KafeFiles"))),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    output_directory = os.path.dirname(program)
    program_basename = os.path.splitext(os.path.basename(program))[0]
    generated_text_basename = f"file_{program_basename}.txt"
    expected_text_basename = f"{program_basename}.txt"
    generated_text_path = os.path.join(output_directory, generated_text_basename)
    expected_text_path = os.path.join(output_directory, expected_text_basename)

    try:
        with open(generated_text_path) as f:
            generated_text = f.read()
        os.remove(generated_text_path)
    except FileNotFoundError:
        generated_text = ""

    try:
        with open(expected_text_path) as f:
            expected_text = f.read()
    except FileNotFoundError:
        expected_text = ""

    assert (
        generated_text == expected_text
    ), f"{expected_text_path} doesn't match {generated_text_path}"
    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_invalid_programs("../tests/KafeFiles"))),
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
