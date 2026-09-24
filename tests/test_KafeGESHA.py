import os
import pytest
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
    list(get_parameters(get_programs("../tests/KafeGESHA"))),
)
def test_valid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    output_directory = os.path.dirname(program)
    program_basename = os.path.splitext(os.path.basename(program))[0]
    expected_svg_basename = f"graph_{program_basename}.svg"
    generated_svg_basename = f"{program_basename}.svg"
    generated_svg_path = os.path.join(output_directory, generated_svg_basename)
    expected_svg_path = os.path.join(output_directory, expected_svg_basename)

    try:
        with open(generated_svg_path) as f:
            generated_svg = f.read()
    except FileNotFoundError:
        generated_svg = ""
    else:
        # Try to remove the file, but don't fail if we can't (Windows file locking)
        try:
            os.remove(generated_svg_path)
        except (PermissionError, OSError):
            pass

    try:
        with open(expected_svg_path) as f:
            expected_svg = f.read()
    except FileNotFoundError:
        expected_svg = ""

    assert (
        generated_svg == expected_svg
    ), f"{expected_svg_path} doesn't match {generated_svg_path}"
    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    list(get_parameters(get_invalid_programs("../tests/KafeGESHA"))),
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
