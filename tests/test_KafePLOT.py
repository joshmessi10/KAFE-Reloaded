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
    list(obtener_parametros(get_programs("../tests/KafePLOT"))),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    carpeta_destino = os.path.dirname(programa)
    nombre_base = os.path.splitext(os.path.basename(programa))[0]
    svg_prueba_base = f"grafico_{nombre_base}.svg"
    svg_generado_base = f"{nombre_base}.svg"
    svg_generado_path = os.path.join(carpeta_destino, svg_generado_base)
    svg_prueba_path = os.path.join(carpeta_destino, svg_prueba_base)

    with open(svg_generado_path) as f:
        svg_generado = f.read()

    with open(svg_prueba_path) as f:
        svg_prueba = f.read()

    os.remove(svg_generado_path)

    assert (
        svg_generado == svg_prueba
    ), f"{svg_prueba_path} doesn't match {svg_generado_path}"
    assert_valid_kafe_result(result, programa, salida_esperada)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_invalid_programs("../tests/KafePLOT"))),
)
def test_invalid_programs(programa, entrada, salida_esperada):
    result = run_kafe_program(programa, input_text=entrada)

    assert_invalid_kafe_result(result, programa, salida_esperada)
