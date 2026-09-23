import pytest
import os
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
    list(obtener_parametros(get_programs("../tests/KafeFiles"))),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    carpeta_destino = os.path.dirname(programa)
    nombre_base = os.path.splitext(os.path.basename(programa))[0]
    txt_generado_base = f"archivo_{nombre_base}.txt"
    txt_prueba_base = f"{nombre_base}.txt"
    txt_generado_path = os.path.join(carpeta_destino, txt_generado_base)
    txt_prueba_path = os.path.join(carpeta_destino, txt_prueba_base)

    try:
        with open(txt_generado_path) as f:
            txt_generado = f.read()
        os.remove(txt_generado_path)
    except FileNotFoundError:
        txt_generado = ""

    try:
        with open(txt_prueba_path) as f:
            txt_prueba = f.read()
    except FileNotFoundError:
        txt_prueba = ""

    assert (
        txt_generado == txt_prueba
    ), f"{txt_prueba_path} doesn't match {txt_generado_path}"
    assert_valid_kafe_result(result, programa, salida_esperada)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_invalid_programs("../tests/KafeFiles"))),
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_invalid_kafe_result(result, programa, salida_esperada)
