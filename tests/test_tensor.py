import subprocess
import sys
import os
import pytest
from utils import obtener_parametros, get_programs, get_kafe_path, get_src_dir


def _get_tensor_programs():
    """Obtiene solo los programas .kf de tensor (test_tensor_*.kf)."""
    all_programs = get_programs("../tests/KafeGESHA")
    return [p for p in all_programs if os.path.basename(p).startswith("test_tensor")]


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(_get_tensor_programs())),
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
