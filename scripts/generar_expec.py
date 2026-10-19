"""Genera .expec desde el intérprete real, dos corridas byte-idénticas.

Regla: los .expec SIEMPRE salen de ejecutar el intérprete real (nunca se
inventan). Para fixtures de KafeGESHA se aplica el mismo filtrado de
métricas de progreso que aplica tests/test_KafeGESHA.py al comparar.
"""
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SRC = RAIZ / "src"
KAFE = SRC / "Kafe.py"

FIXTURES = [
    "tests/KafeMACHINE/preprocessing/test_tokenizer_basic.kf",
    "tests/KafeMACHINE/preprocessing/test_tokenizer_oov.kf",
    "tests/KafeMACHINE/preprocessing/test_tokenizer_num_words.kf",
    "tests/KafeMACHINE/preprocessing/test_tok_not_fitted.error.kf",
    "tests/KafeMACHINE/preprocessing/test_tok_empty.error.kf",
    "tests/KafeMACHINE/preprocessing/test_tok_not_string.error.kf",
    "tests/KafeGESHA/rnn_sintetico.kf",
    "tests/KafeGESHA/rnn_embedding_sintetico.kf",
    "tests/KafeKaggle/kaggle_load_dataset_temperaturas.kf.example",
    "tests/KafeKaggle/kaggle_load_text_dataset.kf.example",
]


def quitar_metricas_progreso(salida):
    """Mismo filtro que tests/test_KafeGESHA.py al comparar."""
    return re.sub(r" — Accuracy \d+\.\d{2}%", "", salida)


for rel in FIXTURES:
    base = RAIZ / rel
    if base.name.endswith(".kf.example"):
        salida = base.with_name(base.name.replace(".kf.example", ".expec.example"))
    else:
        salida = base.with_suffix(".expec")
    es_error = base.name.endswith(".error.kf")
    es_gesha = "KafeGESHA" in rel
    corridas = []
    for _ in range(2):
        proc = subprocess.run(
            [sys.executable, str(KAFE), str(base)],
            capture_output=True,
            text=True,
            cwd=str(SRC),
        )
        if es_error:
            assert proc.returncode == 1, proc.stderr
            contenido = proc.stderr.splitlines()[-1] + "\n"
        else:
            assert proc.returncode == 0, proc.stderr
            contenido = proc.stdout
            if es_gesha:
                contenido = quitar_metricas_progreso(contenido)
        corridas.append(contenido.encode("utf-8"))
    if corridas[0] != corridas[1]:
        print(f"NON-DETERMINISTIC: {rel}")
        continue
    salida.write_bytes(corridas[0])
    print(f"OK {salida.name} ({len(corridas[0])} bytes)")
