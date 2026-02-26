import subprocess
import pytest
import sys
from utils import obtener_parametros, get_programs, get_invalid_programs

# Use the current Python interpreter (should be from venv when running pytest from venv)
PYTHON_EXE = sys.executable


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_programs("../tests/funciones"))),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = subprocess.run(
        [PYTHON_EXE, "../src/Kafe.py", programa],
        capture_output=True,
        text=True,
        input=entrada,
    )

    assert result.returncode == 0, f"Non-zero exit for {programa}"
    assert result.stdout == salida_esperada, f"Incorrect output for {programa}"


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_invalid_programs("../tests/funciones"))),
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = subprocess.run(
        [PYTHON_EXE, "../src/Kafe.py", programa],
        capture_output=True,
        text=True,
        input=entrada,
    )

    assert result.returncode == 1, f"Zero exit for {programa}"
    assert (
        result.stderr.splitlines()[-1] + "\n" == salida_esperada
    ), f"Incorrect output for {programa}"
