import io
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeKaggle import funciones as kaggle
from lib.KafePARDOS.DataFrame import DataFrame


@pytest.fixture(autouse=True)
def _kaggle_disponible(monkeypatch):
    """Los tests unitarios nunca deben intentar pip install (sin red)."""
    monkeypatch.setattr(kaggle, "_KAGGLE_AVAILABLE", True)


def _crear_zip(tmp_path, archivos, nombre="dataset.zip"):
    """Crea un ZIP real con {nombre_archivo: contenido} y retorna su ruta."""
    ruta = tmp_path / nombre
    with zipfile.ZipFile(ruta, "w") as zfu:
        for nombre_archivo, contenido in archivos.items():
            zfu.writestr(nombre_archivo, contenido)
    return str(ruta)


def _descarga_simulada(monkeypatch, ruta_zip):
    """Reemplaza el paso de descarga por la devolución de un ZIP ya creado."""
    llamadas = []

    def _download(dataset_name, dest_dir):
        llamadas.append(dataset_name)
        return ruta_zip

    monkeypatch.setattr(kaggle, "_download_dataset", _download)
    return llamadas


class FakeApi:
    """KaggleApi falso: escribe un ZIP real sin tocar red ni credenciales."""

    autenticado = False

    def authenticate(self):
        FakeApi.autenticado = True

    def dataset_download_files(self, dataset, path=None, **kwargs):
        print(f"Dataset URL: https://www.kaggle.com/datasets/{dataset}")
        ruta = Path(path) / "conjunto.zip"
        with zipfile.ZipFile(ruta, "w") as zfu:
            zfu.writestr("data.csv", "x,y\n1,2\n3,4\n")
        return None


class SubprocessFalso:
    """Reemplaza subprocess dentro del módulo para no instalar nada."""

    PIPE = -1

    def __init__(self, error=None):
        self.error = error
        self.llamadas = []

    def run(self, args, **kwargs):
        self.llamadas.append({"args": args, **kwargs})
        if self.error is not None:
            raise self.error


def test_load_dataset_matrix_selects_columns(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"train.csv": "x,y,label\n1,2.5,a\n3,4,b\n"})
    llamadas = _descarga_simulada(monkeypatch, ruta)
    resultado = kaggle.load_dataset_matrix("demo", ["x", "y"], "train", 1)
    assert resultado == [[1.0, 2.5]]
    assert llamadas == ["demo"]


def test_load_dataset_matrix_infers_numeric_columns(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "x,y,label\n1,2.5,a\n"})
    _descarga_simulada(monkeypatch, ruta)
    assert kaggle.load_dataset_matrix("demo") == [[1.0, 2.5]]


def test_load_dataset_matrix_rejects_non_numeric(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "x,y\n1,bad\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no numéricos"):
        kaggle.load_dataset_matrix("demo", ["x", "y"])


def test_load_dataset_matrix_limit_zero_returns_all(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "x,y\n1,2\n3,4\n"})
    _descarga_simulada(monkeypatch, ruta)
    assert kaggle.load_dataset_matrix("demo", ["x", "y"], "", 0) == [
        [1.0, 2.0],
        [3.0, 4.0],
    ]


def test_load_dataset_matrix_missing_column(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "x,y\n1,2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="Columnas inexistentes"):
        kaggle.load_dataset_matrix("demo", ["x", "z"])


def test_load_dataset_matrix_without_numeric_columns(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "nombre,letra\nana,a\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="columnas numéricas"):
        kaggle.load_dataset_matrix("demo")


def test_load_dataset_matrix_null_cell(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data.csv": "x,y\n1,\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no numéricos o nulos"):
        kaggle.load_dataset_matrix("demo", ["x", "y"])


def test_load_dataset_returns_pardos_dataframe(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"personas.csv": "nombre,edad\nAna,30\nLuis,25\n"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo")
    assert isinstance(df, DataFrame)
    assert df.columns == ["nombre", "edad"]
    assert df.data == [["Ana", 30], ["Luis", 25]]


def test_load_dataset_explicit_file(monkeypatch, tmp_path):
    ruta = _crear_zip(
        tmp_path,
        {"train.csv": "a\n1\n", "test.csv": "a\n2\n", "README.md": "hola"},
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo", "test.csv")
    assert df.data == [[2]]


def test_load_dataset_auto_selects_single_csv(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"datos.csv": "x\n7\n", "notas.txt": "texto"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo")
    assert df.columns == ["x"]
    assert df.data == [[7]]


def test_load_dataset_missing_file_lists_candidates(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"train.csv": "a\n1\n", "test.csv": "a\n2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="No se encontró 'nope.csv'"):
        kaggle.load_dataset("demo", "nope.csv")


def test_load_dataset_multiple_csvs_error(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"train.csv": "a\n1\n", "test.csv": "a\n2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="varios archivos CSV"):
        kaggle.load_dataset("demo")


def test_load_dataset_rejects_non_csv_file(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"datos.csv": "x\n1\n", "notas.txt": "texto"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no es un archivo CSV"):
        kaggle.load_dataset("demo", "notas.txt")


def test_load_dataset_nested_file_by_name(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"data/train.csv": "y\n0\n", "data/test.csv": "y\n1\n"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo", "train")
    assert df.data == [[0]]


def test_load_dataset_handles_utf8_bom(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"datos.csv": "\ufeffx,y\n1,2\n"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo")
    assert df.columns == ["x", "y"]
    assert df.data == [[1, 2]]


def test_load_dataset_rejects_empty_name(monkeypatch):
    def _no_descargar(*args, **kwargs):
        pytest.fail("la validación debe ocurrir antes de descargar")

    monkeypatch.setattr(kaggle, "_download_dataset", _no_descargar)
    with pytest.raises(Exception, match="no puede estar vacío"):
        kaggle.load_dataset("")


def test_load_dataset_split_selector_and_precedence(monkeypatch, tmp_path):
    ruta = _crear_zip(tmp_path, {"train.csv": "y\n0\n", "test.csv": "y\n1\n"})
    _descarga_simulada(monkeypatch, ruta)
    por_split = kaggle.load_dataset_split("demo", "", "test")
    assert por_split.data == [[1]]
    por_archivo = kaggle.load_dataset_split("demo", "train.csv", "test")
    assert por_archivo.data == [[0]]
    por_dos_args = kaggle.load_dataset_split("demo", "train")
    assert por_dos_args.data == [[0]]


def test_load_dataset_split_wrong_arity():
    with pytest.raises(Exception, match="expects 2 or 3 args"):
        kaggle.load_dataset_split("demo")


def test_parse_csv_helper():
    columnas, filas = kaggle._parse_csv(io.StringIO(" a , b \n1,2\n\n3,4,extra\n"))
    assert columnas == ["a", "b"]
    assert filas == [["1", "2"], ["3", "4"]]


def test_extract_table_plain_csv(tmp_path):
    ruta = tmp_path / "datos.csv"
    ruta.write_text("x,y\n1,2\n", encoding="utf-8")
    columnas, filas = kaggle._extract_table(str(ruta), "", "", "demo")
    assert columnas == ["x", "y"]
    assert filas == [["1", "2"]]


def test_download_dataset_uses_api_and_quiets_output(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(kaggle, "_check_credentials", lambda: None)
    monkeypatch.setattr(kaggle, "KaggleApi", FakeApi)
    FakeApi.autenticado = False
    destino = tmp_path / "descarga"
    destino.mkdir()
    ruta = kaggle._download_dataset("propietario/conjunto", str(destino))
    assert ruta == str(destino / "conjunto.zip")
    assert FakeApi.autenticado is True
    assert capsys.readouterr().out == ""


def test_download_dataset_wraps_api_error(monkeypatch, tmp_path):
    class ApiRota:
        def authenticate(self):
            raise RuntimeError("401 Unauthorized")

    monkeypatch.setattr(kaggle, "_check_credentials", lambda: None)
    monkeypatch.setattr(kaggle, "KaggleApi", ApiRota)
    destino = tmp_path / "descarga"
    destino.mkdir()
    with pytest.raises(Exception, match="Error descargando dataset 'propietario/conjunto'"):
        kaggle._download_dataset("propietario/conjunto", str(destino))


def test_require_kaggle_already_available(monkeypatch):
    falso = SubprocessFalso(error=AssertionError("no debe instalar"))
    monkeypatch.setattr(kaggle, "subprocess", falso)
    kaggle._require_kaggle()
    assert falso.llamadas == []


def test_require_kaggle_install_failure(monkeypatch):
    falso = SubprocessFalso(error=RuntimeError("sin conexión"))
    monkeypatch.setattr(kaggle, "subprocess", falso)
    monkeypatch.setattr(kaggle, "_KAGGLE_AVAILABLE", False)
    with pytest.raises(Exception) as exc:
        kaggle._require_kaggle()
    assert str(exc.value).startswith("kaggle:")
    assert "pip install kaggle" in str(exc.value)
    assert falso.llamadas[0]["args"] == [
        sys.executable,
        "-m",
        "pip",
        "install",
        "kaggle",
    ]
    assert falso.llamadas[0]["timeout"] == 120


def test_check_credentials_missing_raises(monkeypatch, tmp_path):
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(tmp_path / "sin_config"))
    with pytest.raises(Exception, match="no se encontraron credenciales") as exc:
        kaggle._check_credentials()
    mensaje = str(exc.value)
    assert mensaje.startswith("kaggle:")
    assert "kaggle.json" in mensaje
    assert "KAGGLE_USERNAME" in mensaje
    assert "KAGGLE_KEY" in mensaje


def test_check_credentials_accepts_env_vars(monkeypatch, tmp_path):
    monkeypatch.setenv("KAGGLE_USERNAME", "estudiante")
    monkeypatch.setenv("KAGGLE_KEY", "clave_de_ejemplo")
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(tmp_path / "sin_config"))
    kaggle._check_credentials()


def test_check_credentials_accepts_config_file(monkeypatch, tmp_path):
    config = tmp_path / "config"
    config.mkdir()
    (config / "kaggle.json").write_text("{}", encoding="utf-8")
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(config))
    kaggle._check_credentials()
