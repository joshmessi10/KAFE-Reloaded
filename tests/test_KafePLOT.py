import os

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
    list(get_parameters(get_programs("../tests/KafePLOT"))),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    output_directory = os.path.dirname(program)
    program_basename = os.path.splitext(os.path.basename(program))[0]
    expected_svg_basename = f"graph_{program_basename}.svg"
    generated_svg_basename = f"{program_basename}.svg"
    generated_svg_path = os.path.join(output_directory, generated_svg_basename)
    expected_svg_path = os.path.join(output_directory, expected_svg_basename)

    with open(generated_svg_path) as f:
        generated_svg = f.read()

    with open(expected_svg_path) as f:
        expected_svg = f.read()

    os.remove(generated_svg_path)

    assert (
        generated_svg == expected_svg
    ), f"{expected_svg_path} doesn't match {generated_svg_path}"
    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_invalid_programs("../tests/KafePLOT"))),
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
