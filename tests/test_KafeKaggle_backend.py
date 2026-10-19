import io
import logging
import sys
import zipfile
from pathlib import Path
from typing import Any, cast

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeKaggle import funciones as kaggle
from lib.KafeKaggle.dataset import ImageDataset
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
        cast(Any, kaggle).load_dataset_split("demo")


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


# ---------------------------------------------------------------------------
# Ingesta de imágenes (offline: descarga y dependencias sustituidas)
# ---------------------------------------------------------------------------


@pytest.fixture
def pil():
    """Devuelve PIL.Image o salta los tests si Pillow no está instalado."""
    return pytest.importorskip("PIL.Image")


def _guardar_png(image_module, ruta, tamano, color):
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    image_module.new("RGB", tamano, color).save(ruta)


def _descarga_imagenes(monkeypatch, directorio, image_module):
    """Sustituye require+descarga por un directorio preparado (sin red)."""
    llamadas = []

    def _download(dataset_name):
        llamadas.append(dataset_name)
        return directorio

    monkeypatch.setattr(kaggle, "_require_kagglehub", lambda: None)
    monkeypatch.setattr(kaggle, "_download_dataset", _download)
    monkeypatch.setattr(
        kaggle, "_require_image_dependencies", lambda: (image_module, None)
    )
    return llamadas


def _no_descargar(monkeypatch):
    def _fallar(*args, **kwargs):
        pytest.fail("la validación debe ocurrir antes de descargar")

    monkeypatch.setattr(kaggle, "_download_dataset", _fallar)
    monkeypatch.setattr(kaggle, "_require_kagglehub", lambda: None)


def test_load_image_shape_range_and_resize(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "train" / "1.png", (10, 7), (200, 100, 50))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    imagen = kaggle.load_image("demo", "train/1.png", 4, 5, "rgb")
    assert len(imagen) == 3
    assert len(imagen[0]) == 4
    assert len(imagen[0][0]) == 5
    valores = [valor for canal in imagen for fila in canal for valor in fila]
    assert all(0.0 <= valor <= 1.0 for valor in valores)


def test_load_image_rgb_has_three_channels(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a.png", (2, 2), (10, 20, 30))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    imagen = kaggle.load_image("demo", "a.png", 2, 2, "rgb")
    assert len(imagen) == 3


@pytest.mark.parametrize("modo", ["gray", "grayscale", "GRAY", " Grayscale "])
def test_load_image_gray_has_one_channel(pil, monkeypatch, tmp_path, modo):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a.png", (2, 2), (255, 0, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    imagen = kaggle.load_image("demo", "a.png", 2, 2, modo)
    assert len(imagen) == 1
    assert len(imagen[0]) == 2
    assert len(imagen[0][0]) == 2


def test_load_images_deterministic_order_and_limit(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a.png", (1, 1), (10, 0, 0))
    _guardar_png(pil, raiz / "b.png", (1, 1), (20, 0, 0))
    _guardar_png(pil, raiz / "c.png", (1, 1), (30, 0, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)

    todas = kaggle.load_images("demo", 1, 1, "rgb", 0)
    assert len(todas) == 3
    assert todas[0][0][0][0] == pytest.approx(10 / 255)
    assert todas[1][0][0][0] == pytest.approx(20 / 255)
    assert todas[2][0][0][0] == pytest.approx(30 / 255)

    limitadas = kaggle.load_images("demo", 1, 1, "rgb", 2)
    assert len(limitadas) == 2
    assert limitadas[0][0][0][0] == pytest.approx(10 / 255)
    assert limitadas[1][0][0][0] == pytest.approx(20 / 255)


def test_load_images_grayscale_single_channel(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a.png", (2, 2), (255, 255, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    imagenes = kaggle.load_images("demo", 2, 2, "gray", 0)
    assert len(imagenes) == 1
    assert len(imagenes[0]) == 1
    assert imagenes[0][0][0][0] == pytest.approx(1.0)


def test_load_image_resolves_exact_relative_path(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "train" / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "test" / "1.png", (1, 1), (0, 0, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    imagen = kaggle.load_image("demo", "test/1.png", 1, 1, "rgb")
    assert imagen[2][0][0] == pytest.approx(1.0)


def test_load_image_ambiguous_basename(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a" / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "b" / "1.png", (1, 1), (0, 0, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception, match="ambiguo"):
        kaggle.load_image("demo", "1.png", 1, 1, "rgb")


def test_load_image_missing_path(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "a.png", (1, 1), (255, 0, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception, match="No se encontró la imagen"):
        kaggle.load_image("demo", "nope.png", 1, 1, "rgb")


def test_load_image_dataset_id_and_label_columns(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "2.png", (1, 1), (0, 255, 0))
    _guardar_png(pil, raiz / "3.png", (1, 1), (0, 0, 255))
    (raiz / "labels.csv").write_text(
        "id,label\n1,cat\n2,dog\n3,cat\n", encoding="utf-8"
    )
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    datos = kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb")
    assert isinstance(datos, ImageDataset)
    X, y = datos[0], datos[1]
    assert len(X) == 3
    assert y == [0, 1, 0]
    assert len(X[0]) == 3


def test_load_image_dataset_alternative_columns(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "img_1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "img_2.png", (1, 1), (0, 255, 0))
    (raiz / "labels.csv").write_text(
        "filename,class\nimg_1.png,perro\nimg_2.png,gato\n", encoding="utf-8"
    )
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb")[:]
    assert len(X) == 2
    assert y == [1, 0]


def test_load_image_dataset_integer_and_padded_ids(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "0002.png", (1, 1), (0, 255, 0))
    (raiz / "labels.csv").write_text("id,label\n1,a\n0002,b\n", encoding="utf-8")
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb")[:]
    assert len(X) == 2
    assert y == [1, 0]


def test_load_image_dataset_missing_labels_reports_counts(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "2.png", (1, 1), (0, 255, 0))
    (raiz / "labels.csv").write_text("id,label\n1,cat\n", encoding="utf-8")
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception) as exc:
        kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb")
    assert "emparejadas=1" in str(exc.value)
    assert "no emparejadas=1" in str(exc.value)


def test_load_image_dataset_limit_skips_unlabeled(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "0.png", (1, 1), (0, 0, 0))
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "2.png", (1, 1), (0, 255, 0))
    (raiz / "labels.csv").write_text("id,label\n1,a\n2,b\n", encoding="utf-8")
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb", 2)[:]
    assert len(X) == 2
    assert y == [0, 1]


def test_load_image_dataset_missing_label_columns(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    (raiz / "labels.csv").write_text("foo,bar\n1,cat\n", encoding="utf-8")
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception, match="no se detectaron las columnas"):
        kaggle.load_image_dataset("demo", "labels.csv", 1, 1, "rgb")


def test_load_image_dataset_missing_labels_file(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "1.png", (1, 1), (255, 0, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception, match="No se encontró el archivo de etiquetas"):
        kaggle.load_image_dataset("demo", "nope.csv", 1, 1, "rgb")


def test_load_images_invalid_color_mode_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'color_mode' inválido"):
        kaggle.load_images("demo", 32, 32, "cmyk")


def test_load_images_invalid_dimension_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'height' debe ser un entero positivo"):
        kaggle.load_images("demo", 0, 32, "rgb")


def test_load_image_dataset_invalid_limit_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'limit' debe ser mayor o igual"):
        kaggle.load_image_dataset("demo", "labels.csv", 32, 32, "rgb", -1)


def test_normalize_color_mode_rejects_invalid():
    with pytest.raises(Exception, match="'color_mode' inválido"):
        kaggle._normalize_color_mode("hsv")


def test_load_image_wrong_arity():
    with pytest.raises(Exception, match="expects 2 or 3 or 4 or 5 args"):
        cast(Any, kaggle).load_image("demo")


def test_load_images_wrong_type():
    with pytest.raises(Exception, match="expects argument of type STR"):
        kaggle.load_images(42)


def test_load_image_dataset_wrong_arity():
    with pytest.raises(Exception, match="expects 2 or 3 or 4 or 5 or 6 args"):
        cast(Any, kaggle).load_image_dataset("demo")


def _escribir_zip(destino, entradas):
    """Escribe un zip real con {nombre: bytes}."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destino, "w") as archive:
        for nombre, contenido in entradas.items():
            archive.writestr(nombre, contenido)


def test_ensure_images_extracted_zip_real(tmp_path):
    raiz = tmp_path / "dataset"
    _escribir_zip(raiz / "imgs.zip", {"train/1.png": b"PNG-bytes", "train/2.png": b"x"})
    kaggle._ensure_images_extracted(str(raiz), None)
    imagenes = kaggle._find_images(str(raiz))
    assert imagenes == [
        "imgs.zip_extracted/train/1.png",
        "imgs.zip_extracted/train/2.png",
    ]
    kaggle._ensure_images_extracted(str(raiz), None)
    assert kaggle._find_images(str(raiz)) == imagenes


def test_ensure_images_extracted_rejects_path_traversal(tmp_path):
    raiz = tmp_path / "dataset"
    _escribir_zip(
        raiz / "imgs.zip",
        {"../evil.png": b"malo", "ok/1.png": b"bueno"},
    )
    kaggle._ensure_images_extracted(str(raiz), None)
    assert not (raiz / "evil.png").exists()
    assert (raiz / "imgs.zip_extracted" / "ok" / "1.png").is_file()


def test_find_images_skips_macosx_and_dotfiles(tmp_path):
    raiz = tmp_path / "dataset"
    raiz.mkdir()
    (raiz / "img.png").write_bytes(b"a")
    (raiz / "__MACOSX").mkdir()
    (raiz / "__MACOSX" / "._img.png").write_bytes(b"a")
    (raiz / ".oculto").mkdir()
    (raiz / ".oculto" / "otra.png").write_bytes(b"a")
    (raiz / ".dot.png").write_bytes(b"a")
    assert kaggle._find_images(str(raiz)) == ["img.png"]


def test_find_images_without_images(tmp_path):
    raiz = tmp_path / "dataset"
    raiz.mkdir()
    (raiz / "notas.txt").write_text("texto", encoding="utf-8")
    with pytest.raises(Exception, match="no contiene imágenes"):
        kaggle._find_images(str(raiz))


# ---------------------------------------------------------------------------
# Ingesta por carpetas (etiquetas derivadas del directorio padre)
# ---------------------------------------------------------------------------


def test_format_list_no_recorta_lista_corta():
    assert kaggle._format_list(["a", "b"]) == "['a', 'b']"


def test_format_list_recorta_lista_larga():
    elementos = [f"f{i}.png" for i in range(100)]
    resumen = kaggle._format_list(elementos, limit=3)
    assert "f0.png" in resumen
    assert "f99.png" not in resumen
    assert "… y 97 más (total 100)" in resumen


def test_load_image_missing_path_caps_long_list(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    for i in range(50):
        _guardar_png(pil, raiz / f"img_{i:03d}.png", (1, 1), (10, 20, 30))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception) as exc:
        kaggle.load_image("demo", "nope.png", 1, 1, "rgb")
    mensaje = str(exc.value)
    assert "No se encontró la imagen" in mensaje
    assert "… y 30 más (total 50)" in mensaje
    assert "img_049.png" not in mensaje


def test_download_dataset_empty_directory_raises(monkeypatch, tmp_path):
    directorio = tmp_path / "vacio"
    directorio.mkdir()
    monkeypatch.setattr(kaggle, "kagglehub", KaggleHubFalso(str(directorio)))
    with pytest.raises(Exception, match="no produjo archivos"):
        kaggle._download_dataset("propietario/conjunto")


def test_load_image_folder_dataset_labels_from_parent_dir(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "cat" / "1.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "cat" / "2.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "dog" / "3.png", (1, 1), (0, 0, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    datos = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 0, "")
    assert isinstance(datos, ImageDataset)
    X, y = datos[0], datos[1]
    assert len(X) == 3
    assert y == [0, 0, 1]
    assert len(X[0]) == 3
    assert len(X[0][0]) == 1


def test_load_image_folder_dataset_split_filters_ancestor(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "train" / "cat" / "a.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "test" / "cat" / "b.png", (1, 1), (0, 255, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)

    solo_train = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 0, "train")
    assert len(solo_train[0]) == 1
    assert solo_train[1] == [0]

    todas = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 0, "")
    assert len(todas[0]) == 2
    assert todas[1] == [0, 0]


def test_load_image_folder_dataset_empty_after_split_raises(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "train" / "cat" / "a.png", (1, 1), (255, 0, 0))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    with pytest.raises(Exception, match="no se encontraron imágenes etiquetadas"):
        kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 0, "test")


def test_load_image_folder_dataset_duplicate_basenames(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "airplane" / "0001.png", (1, 1), (255, 0, 0))
    _guardar_png(pil, raiz / "automobile" / "0001.png", (1, 1), (0, 0, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 0, "")[:]
    assert len(X) == 2
    assert y == [0, 1]
    assert X[0][0][0][0] == pytest.approx(1.0)
    assert X[1][0][0][0] == pytest.approx(0.0)
    assert X[1][2][0][0] == pytest.approx(1.0)


def test_load_image_folder_dataset_limit_representative_and_deterministic(
    pil, monkeypatch, tmp_path
):
    raiz = tmp_path / "dataset"
    for clase in ("a", "b", "c"):
        for i in range(12):
            color = ((i * 20) % 256, 0, 0)
            _guardar_png(pil, raiz / clase / f"{i:02d}.png", (1, 1), color)
    _descarga_imagenes(monkeypatch, str(raiz), pil)

    X_uno, y_uno = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 6, "")[:]
    X_dos, y_dos = kaggle.load_image_folder_dataset("demo", 1, 1, "rgb", 6, "")[:]
    assert len(X_uno) == 6
    assert len(set(y_uno)) >= 2
    assert y_uno == y_dos


def test_load_image_folder_dataset_gray_single_channel(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "cat" / "a.png", (2, 2), (255, 255, 255))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_folder_dataset("demo", 2, 2, "gray", 0, "")[:]
    assert len(X) == 1
    assert len(X[0]) == 1
    assert X[0][0][0][0] == pytest.approx(1.0)
    assert y == [0]


def test_load_image_folder_dataset_e2e_shape_and_range(pil, monkeypatch, tmp_path):
    raiz = tmp_path / "dataset"
    _guardar_png(pil, raiz / "uno" / "1.png", (3, 2), (255, 0, 0))
    _guardar_png(pil, raiz / "uno" / "2.png", (3, 2), (0, 255, 0))
    _guardar_png(pil, raiz / "dos" / "3.png", (3, 2), (0, 0, 255))
    _guardar_png(pil, raiz / "dos" / "4.png", (3, 2), (128, 128, 128))
    _descarga_imagenes(monkeypatch, str(raiz), pil)
    X, y = kaggle.load_image_folder_dataset("demo", 4, 5, "rgb", 0, "")[:]
    assert len(X) == 4
    assert len(X[0]) == 3
    assert len(X[0][0]) == 4
    assert len(X[0][0][0]) == 5
    valores = [v for img in X for canal in img for fila in canal for v in fila]
    assert all(0.0 <= v <= 1.0 for v in valores)
    assert set(y) == {0, 1}


def test_load_image_folder_dataset_invalid_color_mode_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'color_mode' inválido"):
        kaggle.load_image_folder_dataset("demo", 32, 32, "cmyk")


def test_load_image_folder_dataset_invalid_limit_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'limit' debe ser mayor o igual"):
        kaggle.load_image_folder_dataset("demo", 32, 32, "rgb", -1)


def test_load_image_folder_dataset_wrong_arity():
    with pytest.raises(Exception, match="expects 1 or 2 or 3 or 4 or 5 or 6 args"):
        cast(Any, kaggle).load_image_folder_dataset()


def test_load_image_folder_dataset_wrong_type():
    with pytest.raises(Exception, match="expects argument of type STR"):
        kaggle.load_image_folder_dataset(42)


def test_ensure_images_extracted_7z_real(tmp_path):
    py7zr = pytest.importorskip("py7zr")
    origen = tmp_path / "origen" / "1.png"
    origen.parent.mkdir(parents=True)
    origen.write_bytes(b"PNG-bytes")
    raiz = tmp_path / "dataset"
    raiz.mkdir()
    with py7zr.SevenZipFile(str(raiz / "imgs.7z"), "w") as archivo:
        archivo.write(str(origen), "train/cat/1.png")
    kaggle._ensure_images_extracted(str(raiz), py7zr)
    assert kaggle._find_images(str(raiz)) == ["imgs.7z_extracted/train/cat/1.png"]


# ---------------------------------------------------------------------------
# load_text_dataset (texto etiquetado sin encabezado, sin red)
# ---------------------------------------------------------------------------


def test_load_text_dataset_tab_without_header(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {"frases.txt": "me encanta esto\t1\nqué mal está esto\t0\n"},
    )
    llamadas = _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_text_dataset("demo", "frases.txt")
    assert llamadas == ["demo"]
    assert isinstance(df, DataFrame)
    assert df.columns == ["text", "label"]
    assert df.data == [["me encanta esto", 1], ["qué mal está esto", 0]]
    assert all(isinstance(fila[0], str) for fila in df.data)
    assert all(type(fila[1]) is int for fila in df.data)


def test_load_text_dataset_csv_with_comma(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {"datos.csv": "buena relación,1\nmala relación,0\nregular,1\n"},
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_text_dataset("demo", "datos.csv", ",")
    assert df.columns == ["text", "label"]
    assert df.data == [["buena relación", 1], ["mala relación", 0], ["regular", 1]]


def test_load_text_dataset_custom_delimiter_and_columns(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {"notas.txt": "1;excelente\n0;pésimo\n"},
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_text_dataset("demo", "notas.txt", ";", 1, 0)
    assert df.columns == ["text", "label"]
    assert df.data == [["excelente", 1], ["pésimo", 0]]


def test_load_text_dataset_limit(monkeypatch, tmp_path):
    contenido = "".join(f"frase número {i}\t{i % 2}\n" for i in range(10))
    ruta = _crear_dataset(tmp_path, {"frases.txt": contenido})
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_text_dataset("demo", "frases.txt", "\t", 0, 1, 3)
    assert len(df.data) == 3
    assert df.data == [
        ["frase número 0", 0],
        ["frase número 1", 1],
        ["frase número 2", 0],
    ]


def test_load_text_dataset_limit_zero_returns_all(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"frases.txt": "bueno\t1\nmalo\t0\n"})
    _descarga_simulada(monkeypatch, ruta)
    assert len(kaggle.load_text_dataset("demo", "frases.txt", "\t", 0, 1, 0).data) == 2


def test_load_text_dataset_auto_selects_single_text_file(monkeypatch, tmp_path):
    ruta = _crear_dataset(
        tmp_path,
        {"datos.tsv": "excelente\t1\n", "README.md": "hola"},
    )
    _descarga_simulada(monkeypatch, ruta)
    df = kaggle.load_text_dataset("demo")
    assert df.data == [["excelente", 1]]


def test_load_text_dataset_missing_file_lists_candidates_bounded(monkeypatch, tmp_path):
    archivos = {f"frase_{i:03d}.txt": "texto\t1\n" for i in range(50)}
    archivos["nota.md"] = "x"
    ruta = _crear_dataset(tmp_path, archivos)
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception) as exc:
        kaggle.load_text_dataset("demo", "nope.txt")
    mensaje = str(exc.value)
    assert "No se encontró 'nope.txt'" in mensaje
    assert "… y 31 más (total 51)" in mensaje
    assert "frase_049.txt" not in mensaje


def test_load_text_dataset_non_integer_label(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"frases.txt": "bueno\t1\nneutro\tpositivo\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="debe contener enteros"):
        kaggle.load_text_dataset("demo", "frases.txt")


def test_load_text_dataset_column_out_of_range(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"frases.txt": "bueno\t1\nmalo\t0\n"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="menos de 6 celdas"):
        kaggle.load_text_dataset("demo", "frases.txt", "\t", 5, 1)


def test_load_text_dataset_dataset_without_files(monkeypatch, tmp_path):
    vacio = tmp_path / "vacio"
    vacio.mkdir()
    _descarga_simulada(monkeypatch, str(vacio))
    with pytest.raises(Exception, match="no contiene archivos"):
        kaggle.load_text_dataset("demo")


def test_load_text_dataset_without_text_files(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"datos.json": "{}", "imagen.png": "x"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no contiene archivos de texto"):
        kaggle.load_text_dataset("demo")


def test_load_text_dataset_rejects_non_text_extension(monkeypatch, tmp_path):
    ruta = _crear_dataset(tmp_path, {"datos.txt": "bueno\t1\n", "modelo.bin": "x"})
    _descarga_simulada(monkeypatch, ruta)
    with pytest.raises(Exception, match="no es un archivo de texto"):
        kaggle.load_text_dataset("demo", "modelo.bin")


def test_load_text_dataset_rejects_empty_name(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="no puede estar vacío"):
        kaggle.load_text_dataset("")


def test_load_text_dataset_invalid_delimiter_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'delimiter' debe ser un solo carácter"):
        kaggle.load_text_dataset("demo", "frases.txt", "--")


def test_load_text_dataset_invalid_columns_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="deben ser mayores o iguales que 0"):
        kaggle.load_text_dataset("demo", "frases.txt", "\t", -1, 1)


def test_load_text_dataset_invalid_limit_before_download(monkeypatch):
    _no_descargar(monkeypatch)
    with pytest.raises(Exception, match="'limit' debe ser mayor o igual"):
        kaggle.load_text_dataset("demo", "frases.txt", "\t", 0, 1, -1)


def test_load_text_dataset_wrong_arity():
    with pytest.raises(Exception, match="expects 1 or 2 or 3 or 4 or 5 or 6 args"):
        cast(Any, kaggle).load_text_dataset()


def test_load_text_dataset_wrong_type():
    with pytest.raises(Exception, match="expects argument of type STR"):
        kaggle.load_text_dataset(42)


def test_parse_text_labels_helper():
    filas = kaggle._parse_text_labels(
        io.StringIO("  buenísimo \t1\nmalo\t0\n\n"), "\t", 0, 1
    )
    assert filas == [["buenísimo", "1"], ["malo", "0"]]


def test_parse_text_labels_rejects_float_label():
    with pytest.raises(Exception, match="debe contener enteros"):
        kaggle._parse_text_labels(io.StringIO("texto\t1.5\n"), "\t", 0, 1)


def test_read_rows_skips_empty_rows_and_strips():
    filas = kaggle._read_rows(io.StringIO(" a , 1 \n\n,\n b , 0 \n"), ",")
    assert filas == [["a", "1"], ["b", "0"]]


def test_load_dataset_csv_header_truncate_and_pad_unchanged():
    """Regresión: la generalización del lector no cambia load_dataset."""
    columnas, filas = kaggle._parse_csv(io.StringIO("a,b\n1\n\n3,4,extra\n5,6\n\n"))
    assert columnas == ["a", "b"]
    assert filas == [["1", ""], ["3", "4"], ["5", "6"]]
