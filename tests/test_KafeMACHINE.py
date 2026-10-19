import subprocess
import sys
from pathlib import Path

import pytest
from utils import obtener_parametros, get_programs, get_invalid_programs, get_kafe_path, get_src_dir

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeMACHINE.funciones import tokenizer as _fabrica_tokenizer
from lib.KafeMACHINE.preprocessing.Tokenizer import Tokenizer, _tokenize

SUBDIRS = [
    "linear",
    "neighbors",
    "tree",
    "preprocessing",
    "metrics/classification",
    "metrics/regression",
    "clustering",
    "naive_bayes",
    "model_selection",
    "svm",
    "ensemble",
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


# ---------------------------------------------------------------------------
# Tokenizer (backend) — texto -> List[List[INT]]
# ---------------------------------------------------------------------------


def test_tokenize_divide_por_no_alfanumericos():
    """Fundamento: minúsculas + split por [^a-z0-9]+, sin stemming ni stop-words."""
    assert _tokenize("¡Qué bueno, Mundo!") == ["qu", "bueno", "mundo"]
    assert _tokenize("   ") == []
    assert _tokenize("123 456") == ["123", "456"]


def test_tokenizer_fit_word_index_determinista():
    """Index 0 reservado; orden por (-frecuencia, primera aparición)."""
    tok = Tokenizer()
    tok.fit(["b a a", "c a b", "d"])
    assert tok.word_index == {"a": 1, "b": 2, "c": 3, "d": 4}
    assert tok.index_word == {1: "a", 2: "b", 3: "c", 4: "d"}
    assert tok.vocabulary_size == 5  # índices 0..4


def test_tokenizer_fit_es_determinista_entre_instancias():
    tok1 = Tokenizer()
    tok2 = Tokenizer()
    corpus = ["hola mundo hola", "mundo cruel mundo hola"]
    assert tok1.fit(corpus).word_index == tok2.fit(corpus).word_index


def test_tokenizer_oov_ocupa_indice_1():
    tok = Tokenizer(0, "<OOV>")
    tok.fit(["b a a", "c a b"])
    assert tok.word_index["<OOV>"] == 1
    assert tok.word_index["a"] == 2
    assert tok.transform(["a desconocida b"]) == [[2, 1, 3]]
    assert tok.vocabulary_size == 5  # índices 0..4


def test_tokenizer_sin_oov_ignora_desconocidas():
    tok = Tokenizer()
    tok.fit(["b a a"])
    assert tok.transform(["a zzz"]) == [[1]]


def test_tokenizer_num_words_acota_vocabulario():
    tok = Tokenizer(2)
    tok.fit(["a b c", "b c d", "c d e"])
    assert tok.word_index == {"c": 1, "b": 2}
    assert tok.vocabulary_size == 3


def test_tokenizer_transform_vacio_retorna_vacio():
    tok = Tokenizer()
    tok.fit(["a b"])
    assert tok.transform([]) == []


def test_tokenizer_transform_sin_fit_lanza_error():
    tok = Tokenizer()
    with pytest.raises(Exception, match="Must call fit before transform"):
        tok.transform(["a"])


def test_tokenizer_fit_vacio_lanza_error():
    tok = Tokenizer()
    with pytest.raises(Exception, match="necesita al menos un texto"):
        tok.fit([])


def test_tokenizer_fit_no_string_lanza_error():
    tok = Tokenizer()
    with pytest.raises(Exception, match="cada texto debe ser STR; el elemento 1 es INT"):
        tok.fit(["bien", 42])


def test_tokenizer_reajusta_vocabulario_sin_estado_residual():
    tok = Tokenizer()
    tok.fit(["a b c"])
    tok.fit(["x y"])
    assert tok.word_index == {"x": 1, "y": 2}
    assert "a" not in tok.word_index


def test_tokenizer_num_words_invalido():
    with pytest.raises(Exception, match="num_words' debe ser un entero mayor o igual"):
        Tokenizer(-1)


def test_tokenizer_fabrica_con_argumentos():
    tok = _fabrica_tokenizer(5, "<UNK>")
    assert isinstance(tok, Tokenizer)
    assert tok.num_words == 5
    assert tok.oov_token == "<UNK>"


def test_tokenizer_fabrica_sin_argumentos():
    tok = _fabrica_tokenizer()
    assert tok.num_words == 0
    assert tok.oov_token == ""


def test_tokenizer_fabrica_arity_invalida():
    with pytest.raises(Exception, match="expects 0 or 1 or 2 args"):
        _fabrica_tokenizer(1, "x", 3)


def test_tokenizer_fabrica_tipo_invalido():
    with pytest.raises(Exception, match="expects argument of type STR"):
        _fabrica_tokenizer(0, 42)
