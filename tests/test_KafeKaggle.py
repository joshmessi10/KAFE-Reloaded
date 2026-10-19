import os
import subprocess
import sys
import pytest
from utils import obtener_parametros, get_programs, get_invalid_programs, get_kafe_path, get_src_dir


_VALID_PARAMS = list(obtener_parametros(get_programs("../tests/KafeKaggle")))


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    _VALID_PARAMS,
    ids=[os.path.relpath(programa, os.path.dirname(__file__)) for programa, _, _ in _VALID_PARAMS],
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = subprocess.run(
        [sys.executable, get_kafe_path(), programa],
        capture_output=True,
        text=True,
        input=entrada,
        cwd=get_src_dir(),
    )

    assert result.returncode == 0, f"Non-zero exit for {programa}"
    assert result.stdout == salida_esperada, f"Incorrect output for {programa}"


_INVALID_PARAMS = list(obtener_parametros(get_invalid_programs("../tests/KafeKaggle")))


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    _INVALID_PARAMS,
    ids=[os.path.relpath(programa, os.path.dirname(__file__)) for programa, _, _ in _INVALID_PARAMS],
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = subprocess.run(
        [sys.executable, get_kafe_path(), programa],
        capture_output=True,
        text=True,
        input=entrada,
        cwd=get_src_dir(),
    )

    assert result.returncode == 1, f"Zero exit for {programa}"
    assert (
        result.stderr.splitlines()[-1] + "\n" == salida_esperada
    ), f"Incorrect output for {programa}"
