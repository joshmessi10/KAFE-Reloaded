import os
import pytest
from utils import (
    assert_valid_kafe_result,
    get_programs,
    obtener_parametros,
    run_kafe_program,
)


def _get_tensor_programs():
    """Obtiene solo los programas .kf de tensor (test_tensor_*.kf)."""
    all_programs = get_programs("../tests/KafeGESHA")
    return [p for p in all_programs if os.path.basename(p).startswith("test_tensor")]


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(_get_tensor_programs())),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)
    assert_valid_kafe_result(result, programa, salida_esperada)
