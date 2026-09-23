import pytest
from utils import (
    assert_invalid_kafe_result,
    assert_valid_kafe_result,
    get_invalid_programs,
    get_programs,
    obtener_parametros,
    run_kafe_program,
)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_programs("../tests/KafeHF"))),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_valid_kafe_result(result, programa, salida_esperada)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_invalid_programs("../tests/KafeHF"))),
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_invalid_kafe_result(result, programa, salida_esperada)
