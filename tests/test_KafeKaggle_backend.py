import io
import logging
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeKaggle import funciones as kaggle
from lib.KafePARDOS.DataFrame import DataFrame


@pytest.fixture(autouse=True)
def _kagglehub_disponible(monkeypatch):
    """Los tests unitarios nunca deben intentar pip install (sin red)."""
    monkeypatch.setattr(kaggle, "_KAGGLEHUB_AVAILABLE", True)


def _crear_dataset(tmp_path, archivos, nombre="dataset"):
    """Crea un directorio con {ruta_relativa: contenido} y retorna su ruta."""
    directorio = tmp_path / nombre
    for ruta_relativa, contenido in archivos.items():
        destino = directorio / ruta_relativa
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(contenido, encoding="utf-8")
    return str(directorio)


def _descarga_simulada(monkeypatch, directorio):
    """Reemplaza require+descarga por un directorio ya preparado (sin red)."""
    llamadas = []

    def _download(dataset_name):
        llamadas.append(dataset_name)
        return directorio

    monkeypatch.setattr(kaggle, "_require_kagglehub", lambda: None)
    monkeypatch.setattr(kaggle, "_download_dataset", _download)
    return llamadas


def _sin_credenciales(monkeypatch, tmp_path):
    """Elimina toda fuente de credenciales apuntando a un config inexistente."""
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(tmp_path / "sin_config"))


class KaggleHubFalso:
    """kagglehub falso: imprime como el real y retorna un directorio preparado."""

    def __init__(self, directorio):
        self.directorio = directorio
        self.handle = None

    def dataset_download(self, dataset):
        self.handle = dataset
        print(f"Downloading from {dataset}...")
        print(f"Extracting files to {self.directorio}")
        return self.directorio


class KaggleHubRoto:
    """kagglehub falso cuya descarga siempre falla."""

    def dataset_download(self, dataset):
        raise RuntimeError("404: Not Found")


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


class ImportlibFalso:
    """Reemplaza importlib dentro del módulo para simular el import."""

    def __init__(self, modulo):
        self.modulo = modulo
        self.nombres = []

    def import_module(self, nombre):
        self.nombres.append(nombre)
        return self.modulo


def test_load_dataset_matrix_selects_columns(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"train.csv": "x,y,label\n1,2.5,a\n3,4,b\n"})
    llamadas = _descarga_simulada(monkeypatch, ruta)
    resultado = kaggle.load_dataset_matrix("demo", ["x", "y"], "train", 1)
    assert resultado == [[1.0, 2.5]]
    assert llamadas == ["demo"]


def test_load_dataset_matrix_infers_numeric_columns(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "x,y,label\n1,2.5,a\n"})
    _descarga_simulada(monkeypatch, ruta)
    assert kaggle.load_dataset_matrix("demo") == [[1.0, 2.5]]


def test_load_dataset_matrix_rejects_non_numeric(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "x,y\n1,bad\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no numéricos"):
        kaggle.load_dataset_matrix("demo", ["x", "y"])


def test_load_dataset_matrix_limit_zero_returns_all(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "x,y\n1,2\n3,4\n"})
    _descarga_simulada(monkeypatch, ruta)
    assert kaggle.load_dataset_matrix("demo", ["x", "y"], "", 0) == [
        [1.0, 2.0],
        [3.0, 4.0],
    ]


def test_load_dataset_matrix_missing_column(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "x,y\n1,2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="Columnas inexistentes"):
        kaggle.load_dataset_matrix("demo", ["x", "z"])


def test_load_dataset_matrix_without_numeric_columns(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "nombre,letra\nana,a\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="columnas numéricas"):
        kaggle.load_dataset_matrix("demo")


def test_load_dataset_matrix_null_cell(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"data.csv": "x,y\n1,\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no numéricos o nulos"):
        kaggle.load_dataset_matrix("demo", ["x", "y"])


def test_load_dataset_returns_pardos_dataframe(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"personas.csv": "nombre,edad\nAna,30\nLuis,25\n"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo")
    assert isinstance(df, DataFrame)
    assert df.columns == ["nombre", "edad"]
    assert df.data == [["Ana", 30], ["Luis", 25]]


def test_load_dataset_explicit_file(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {"train.csv": "a\n1\n", "test.csv": "a\n2\n", "README.md": "hola"},
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo", "test.csv")
    assert df.data == [[2]]


def test_load_dataset_auto_selects_single_csv(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"datos.csv": "x\n7\n", "notas.txt": "texto"})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo")
    assert df.columns == ["x"]
    assert df.data == [[7]]


def test_load_dataset_missing_file_lists_candidates(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"train.csv": "a\n1\n", "test.csv": "a\n2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="No se encontró 'nope.csv'"):
        kaggle.load_dataset("demo", "nope.csv")


def test_load_dataset_multiple_csvs_error(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"train.csv": "a\n1\n", "test.csv": "a\n2\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="varios archivos CSV"):
        kaggle.load_dataset("demo")


def test_load_dataset_rejects_non_csv_file(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"datos.csv": "x\n1\n", "notas.txt": "texto"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no es un archivo CSV"):
        kaggle.load_dataset("demo", "notas.txt")


def test_load_dataset_nested_file_by_name(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path, {"data/train.csv": "y\n0\n", "data/test.csv": "y\n1\n"}
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_dataset("demo", "train")
    assert df.data == [[0]]


def test_load_dataset_handles_utf8_bom(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"datos.csv": "\ufeffx,y\n1,2\n"})
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
    ruta = _crear_dataset(tmp_path, {"train.csv": "y\n0\n", "test.csv": "y\n1\n"})
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


def test_extract_table_walks_subdirectories(tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {
            "data/train.csv": "y\n0\n",
            "data/test.csv": "y\n1\n",
            "README.md": "hola",
        },
    )
    columnas, filas = kaggle._extract_table(ruta, "data/train.csv", "", "demo")
    assert columnas == ["y"]
    assert filas == [["0"]]


def test_extract_table_skips_macosx_and_dotfiles(tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {
            "Iris.csv": "x\n1\n",
            "__MACOSX/._Iris.csv": "junk",
            "._Iris.csv": "junk",
            ".oculto/secret.csv": "z\n9\n",
        },
    )
    columnas, filas = kaggle._extract_table(ruta, "", "", "demo")
    assert columnas == ["x"]
    assert filas == [["1"]]


def test_extract_table_empty_directory(tmp_path):
    ruta = tmp_path / "vacio"
    ruta.mkdir()
    with pytest.raises(Exception, match="no contiene archivos"):
        kaggle._extract_table(str(ruta), "", "", "demo")


def test_download_dataset_uses_client_and_quiets_output(monkeypatch, tmp_path, capsys):
    directorio = _crear_dataset(tmp_path, {"data.csv": "x\n1\n"})
    cliente = KaggleHubFalso(directorio)
    monkeypatch.setattr(kaggle, "kagglehub", cliente)
    ruta = kaggle._download_dataset("propietario/conjunto")
    assert ruta == directorio
    assert cliente.handle == "propietario/conjunto"
    assert capsys.readouterr().out == ""


def test_download_dataset_wraps_client_error(monkeypatch, tmp_path):
    _sin_credenciales(monkeypatch, tmp_path)
    monkeypatch.setattr(kaggle, "kagglehub", KaggleHubRoto())
    with pytest.raises(
        Exception, match="Error descargando dataset 'propietario/conjunto'"
    ):
        kaggle._download_dataset("propietario/conjunto")


def test_download_dataset_hint_when_no_credentials(monkeypatch, tmp_path):
    _sin_credenciales(monkeypatch, tmp_path)
    monkeypatch.setattr(kaggle, "kagglehub", KaggleHubRoto())
    with pytest.raises(Exception) as exc:
        kaggle._download_dataset("propietario/conjunto")
    mensaje = str(exc.value)
    assert "Si el dataset es privado" in mensaje
    assert "kaggle.json" in mensaje
    assert "KAGGLE_USERNAME" in mensaje
    assert "KAGGLE_KEY" in mensaje


def test_download_dataset_no_hint_when_credentials(monkeypatch, tmp_path):
    config = tmp_path / "config"
    config.mkdir()
    (config / "kaggle.json").write_text("{}", encoding="utf-8")
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(config))
    monkeypatch.setattr(kaggle, "kagglehub", KaggleHubRoto())
    with pytest.raises(Exception) as exc:
        kaggle._download_dataset("propietario/conjunto")
    assert "Si el dataset es privado" not in str(exc.value)


def test_download_dataset_no_filtra_logs_del_cliente(monkeypatch, tmp_path, capsys):
    directorio = _crear_dataset(tmp_path, {"data.csv": "x\n1\n"})
    salida_original = io.StringIO()
    handler = logging.StreamHandler(salida_original)
    raiz = logging.getLogger("kagglehub")
    nivel_anterior = raiz.level
    raiz.addHandler(handler)
    raiz.setLevel(logging.INFO)

    class HubConLogs:
        def dataset_download(self, dataset):
            logging.getLogger("kagglehub.clients").info("Downloading to fake...")
            print("fake stdout")
            return directorio

    monkeypatch.setattr(kaggle, "kagglehub", HubConLogs())
    try:
        ruta = kaggle._download_dataset("dueno/conjunto")
    finally:
        raiz.removeHandler(handler)
        raiz.setLevel(nivel_anterior)
    assert ruta == directorio
    assert handler.stream is salida_original
    assert salida_original.getvalue() == ""
    assert capsys.readouterr().out == ""


def test_tiene_credenciales_true_with_config_file(monkeypatch, tmp_path):
    config = tmp_path / "config"
    config.mkdir()
    (config / "kaggle.json").write_text("{}", encoding="utf-8")
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(config))
    assert kaggle._tiene_credenciales() is True


def test_tiene_credenciales_true_with_env_vars(monkeypatch, tmp_path):
    monkeypatch.setenv("KAGGLE_USERNAME", "estudiante")
    monkeypatch.setenv("KAGGLE_KEY", "clave_de_ejemplo")
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(tmp_path / "sin_config"))
    assert kaggle._tiene_credenciales() is True


def test_tiene_credenciales_false_with_neither(monkeypatch, tmp_path):
    _sin_credenciales(monkeypatch, tmp_path)
    assert kaggle._tiene_credenciales() is False


def test_tiene_credenciales_false_with_only_one_env_var(monkeypatch, tmp_path):
    monkeypatch.setenv("KAGGLE_USERNAME", "estudiante")
    monkeypatch.delenv("KAGGLE_KEY", raising=False)
    monkeypatch.setenv("KAGGLE_CONFIG_DIR", str(tmp_path / "sin_config"))
    assert kaggle._tiene_credenciales() is False


def test_require_kagglehub_already_available(monkeypatch):
    falso = SubprocessFalso(error=AssertionError("no debe instalar"))
    monkeypatch.setattr(kaggle, "subprocess", falso)
    kaggle._require_kagglehub()
    assert falso.llamadas == []


def test_require_kagglehub_install_success(monkeypatch):
    falso_subprocess = SubprocessFalso()
    cliente = object()
    falso_import = ImportlibFalso(cliente)
    monkeypatch.setattr(kaggle, "subprocess", falso_subprocess)
    monkeypatch.setattr(kaggle, "importlib", falso_import)
    monkeypatch.setattr(kaggle, "_KAGGLEHUB_AVAILABLE", False)
    kaggle._require_kagglehub()
    assert kaggle._KAGGLEHUB_AVAILABLE is True
    assert kaggle.kagglehub is cliente
    assert falso_import.nombres == ["kagglehub"]
    assert falso_subprocess.llamadas[0]["args"] == [
        sys.executable,
        "-m",
        "pip",
        "install",
        "kagglehub",
    ]
    assert falso_subprocess.llamadas[0]["timeout"] == 120


def test_require_kagglehub_install_failure(monkeypatch):
    falso = SubprocessFalso(error=RuntimeError("sin conexión"))
    monkeypatch.setattr(kaggle, "subprocess", falso)
    monkeypatch.setattr(kaggle, "_KAGGLEHUB_AVAILABLE", False)
    with pytest.raises(Exception) as exc:
        kaggle._require_kagglehub()
    assert str(exc.value).startswith("kaggle:")
    assert "no se pudo instalar" in str(exc.value)
    assert "pip install kagglehub" in str(exc.value)
    assert falso.llamadas[0]["args"] == [
        sys.executable,
        "-m",
        "pip",
        "install",
        "kagglehub",
    ]
