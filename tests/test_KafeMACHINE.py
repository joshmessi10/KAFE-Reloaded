import subprocess
import sys
import pytest
from utils import obtener_parametros, get_programs, get_invalid_programs, get_kafe_path, get_src_dir

SUBDIRS = [
    "linear_models",
    "neighbors",
    "preprocessing",
    "metrics_classification",
    "metrics_regression",
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
    result = subprocess.run(
        [sys.executable, get_kafe_path(), programa],
        capture_output=True,
        text=True,
        input=entrada,
        cwd=get_src_dir(),
    )

    assert result.returncode == 0, f"Non-zero exit for {programa}"
    assert result.stdout == salida_esperada, f"Incorrect output for {programa}"


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(_all_invalid_programs())),
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
    ), f"Incorrect error output for {programa}"
