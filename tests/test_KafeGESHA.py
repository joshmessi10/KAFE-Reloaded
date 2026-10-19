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

_VALID_PARAMS = list(get_parameters(get_programs("../tests/KafeGESHA")))
_INVALID_PARAMS = list(get_parameters(get_invalid_programs("../tests/KafeGESHA")))

_SLOW_EXAMPLES = {
    "KafeGESHA/rnn_embedding_sintetico.kf",
    "KafeGESHA/rnn_sintetico.kf",
    "KafeGESHA/Autoencoder/autoencoder_clustering.kf",
    "KafeGESHA/MultiCapa/circle_classification.kf",
}


def _valid_example_param(program, input_text, expected_stdout):
    relative_path = os.path.relpath(program, os.path.dirname(__file__))
    if relative_path.replace(os.sep, "/") in _SLOW_EXAMPLES:
        return pytest.param(
            program,
            input_text,
            expected_stdout,
            id=relative_path,
            marks=pytest.mark.skip(reason="Long training example; protect CI time budget"),
        )
    return pytest.param(program, input_text, expected_stdout, id=relative_path)

@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    [_valid_example_param(*params) for params in _VALID_PARAMS],
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

    assert generated_svg == expected_svg, (
        f"{expected_svg_path} doesn't match {generated_svg_path}"
    )
    assert_valid_kafe_result(result, program, expected_stdout)


@pytest.mark.parametrize(
    "program, input_text, expected_stdout",
    _INVALID_PARAMS,
    ids=[
        os.path.relpath(program, os.path.dirname(__file__))
        for program, _, _ in _INVALID_PARAMS
    ],
)
def test_invalid_programs(program, input_text, expected_stdout):
    result = run_kafe_program(program, input_text=input_text)

    assert_invalid_kafe_result(result, program, expected_stdout)
