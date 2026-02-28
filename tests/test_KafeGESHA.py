import subprocess
import sys
import os
import pytest
from utils import (
    obtener_parametros,
    get_programs,
    get_kafe_path,
    get_src_dir,
    get_invalid_programs,
    get_kafe_path,
    get_src_dir,
)


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_programs("../tests/KafeGESHA"))),
)
def test_valid_programs(programa, entrada, salida_esperada):
    result = subprocess.run(
        [sys.executable, get_kafe_path(), programa],
        capture_output=True,
        text=True,
        input=entrada,
        cwd=get_src_dir(),
    )

    carpeta_destino = os.path.dirname(programa)
    nombre_base = os.path.splitext(os.path.basename(programa))[0]
    svg_prueba_base = f"grafico_{nombre_base}.svg"
    svg_generado_base = f"{nombre_base}.svg"
    svg_generado_path = os.path.join(carpeta_destino, svg_generado_base)
    svg_prueba_path = os.path.join(carpeta_destino, svg_prueba_base)

    try:
        with open(svg_generado_path) as f:
            svg_generado = f.read()
    except FileNotFoundError:
        svg_generado = ""
    else:
        # Try to remove the file, but don't fail if we can't (Windows file locking)
        try:
            os.remove(svg_generado_path)
        except (PermissionError, OSError):
            pass

    try:
        with open(svg_prueba_path) as f:
            svg_prueba = f.read()
    except FileNotFoundError:
        svg_prueba = ""

    assert (
        svg_generado == svg_prueba
    ), f"{svg_prueba_path} doesn't match {svg_generado_path}"
    assert result.returncode == 0, f"Non-zero exit for {programa}"
    assert result.stdout == salida_esperada, f"Incorrect output for {programa}"


@pytest.mark.parametrize(
    "programa, entrada, salida_esperada",
    list(obtener_parametros(get_invalid_programs("../tests/KafeGESHA"))),
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
    # Combine stdout and stderr for error checking (training output goes to stdout, error to stderr)
    combined_output = result.stdout + result.stderr.splitlines()[-1] + "\n"
    assert combined_output == salida_esperada, f"Incorrect output for {programa}"
