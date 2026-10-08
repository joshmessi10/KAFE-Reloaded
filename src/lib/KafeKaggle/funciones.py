"""
KafeKaggle — Librería para cargar datasets desde Kaggle.

Kaggle (https://www.kaggle.com) es la plataforma líder de competiciones y
datasets de Machine Learning. Cada dataset se publica como un conjunto de
archivos (normalmente CSV) descargables mediante la API oficial.

Esta librería permite a los usuarios de KAFE acceder a datasets de Kaggle
directamente desde sus programas, de forma similar a:

    Python:
        from kaggle import KaggleApi
        api = KaggleApi()
        api.authenticate()
        api.dataset_download_files("uciml/iris", path=".")

    KAFE:
        import kaggle;
        PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");

Diferencias con Hugging Face (KafeHF):
    - Kaggle no organiza los datos en splits (train/test/validation); cada
      dataset trae archivos. Por eso el parámetro `split` actúa como un
      selector de archivo con forma de split: "train" busca train.csv.
    - La API de Kaggle requiere credenciales: ~/.kaggle/kaggle.json o las
      variables de entorno KAGGLE_USERNAME y KAGGLE_KEY.

Los archivos se leen con la librería `csv` de la estándar (sin pandas) y se
convierten a DataFrames de PARDOS o a matrices de números para NUMK/GESHA.

Dependencia externa opcional: kaggle.
    pip install kaggle
"""

from global_utils import check_sig
from TypeUtils import cadena_t, lista_cadenas_t, entero_t
import csv
import io
import os
import subprocess
import sys
import tempfile
import zipfile
from contextlib import redirect_stdout

try:
    from kaggle import KaggleApi
    _KAGGLE_AVAILABLE = True
except ImportError:
    KaggleApi = None
    _KAGGLE_AVAILABLE = False


def _require_kaggle():
    """Instala ``kaggle`` bajo demanda cuando no está disponible."""
    global KaggleApi, _KAGGLE_AVAILABLE
    if _KAGGLE_AVAILABLE:
        return
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "kaggle"],
            check=True,
            timeout=120,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        from kaggle import KaggleApi as imported_kaggle_api
        KaggleApi = imported_kaggle_api
        _KAGGLE_AVAILABLE = True
    except Exception as error:
        raise Exception(
            "kaggle: no se pudo instalar automáticamente 'kaggle'. "
            "Comprueba la conexión o ejecuta 'pip install kaggle'. "
            f"Detalle: {error}"
        ) from error


def _check_credentials():
    """Verifica que existan credenciales de Kaggle antes de usar la API.

    La librería `kaggle` autentica con ~/.kaggle/kaggle.json (o con
    KAGGLE_CONFIG_DIR/kaggle.json) o con las variables de entorno
    KAGGLE_USERNAME y KAGGLE_KEY. Sin credenciales la API falla con un
    mensaje poco claro, así que se comprueba antes y en español.
    """
    config_dir = os.environ.get("KAGGLE_CONFIG_DIR") or os.path.join(
        os.path.expanduser("~"), ".kaggle"
    )
    config_path = os.path.join(config_dir, "kaggle.json")
    tiene_archivo = os.path.isfile(config_path)
    tiene_variables = bool(os.environ.get("KAGGLE_USERNAME")) and bool(
        os.environ.get("KAGGLE_KEY")
    )
    if not tiene_archivo and not tiene_variables:
        raise Exception(
            "kaggle: no se encontraron credenciales de Kaggle. "
            "Descarga tu archivo kaggle.json desde https://www.kaggle.com/settings "
            "y colócalo en ~/.kaggle/kaggle.json, o define las variables de entorno "
            "KAGGLE_USERNAME y KAGGLE_KEY con tu usuario y tu clave de API."
        )


def _validate_dataset_name(dataset_name):
    """Valida el identificador del dataset antes de tocar la red."""
    if not dataset_name or not dataset_name.strip():
        raise Exception(
            "kaggle: El nombre del dataset no puede estar vacío. "
            "Usa el formato 'dueño/conjunto' (por ejemplo, 'uciml/iris')."
        )


def _download_dataset(dataset_name, dest_dir):
    """Descarga el ZIP completo de un dataset a ``dest_dir`` y retorna su ruta.

    Único punto de contacto con la API de Kaggle: valida credenciales,
    autentica y descarga. Las pruebas unitarias reemplazan esta función
    para no tocar red ni credenciales.
    """
    _check_credentials()
    try:
        api = KaggleApi()
        api.authenticate()
        # La API imprime mensajes informativos (URL del dataset, licencias)
        # que no deben mezclarse con la salida del programa KAFE.
        with redirect_stdout(io.StringIO()):
            api.dataset_download_files(dataset_name, path=dest_dir, unzip=False)
    except Exception as error:
        raise Exception(
            f"kaggle: Error descargando dataset '{dataset_name}': {error}"
        ) from error

    zips = sorted(
        os.path.join(dest_dir, nombre)
        for nombre in os.listdir(dest_dir)
        if nombre.lower().endswith(".zip")
    )
    if len(zips) == 1:
        return zips[0]
    archivos = sorted(os.listdir(dest_dir))
    raise Exception(
        f"kaggle: La descarga de '{dataset_name}' no produjo un único archivo ZIP. "
        f"Archivos obtenidos: {archivos}"
    )


def _resolve_file(members, selector):
    """Resuelve un nombre de archivo o un selector tipo split.

    Acepta la ruta exacta dentro del dataset ("data/train.csv"), el nombre
    del archivo ("train.csv") o un split sin extensión ("train" -> train.csv).
    """
    objetivo = selector.lower()
    exactos = [m for m in members if m == selector]
    if exactos:
        return exactos[0]
    por_nombre = [
        m for m in members if os.path.basename(m).lower() == objetivo
    ]
    if not por_nombre and not objetivo.endswith(".csv"):
        por_nombre = [
            m for m in members if os.path.basename(m).lower() == objetivo + ".csv"
        ]
    if len(por_nombre) == 1:
        return por_nombre[0]
    if len(por_nombre) > 1:
        raise Exception(
            f"kaggle: El selector '{selector}' es ambiguo; coincide con varios "
            f"archivos: {por_nombre}"
        )
    raise Exception(
        f"kaggle: No se encontró '{selector}' en el dataset. "
        f"Archivos disponibles: {members}"
    )


def _select_file(members, file_name, split):
    """Elige el archivo del dataset a leer según file_name, split o al azar.

    Prioridad: file_name (si no está vacío), luego split (selector tipo
    split de Hugging Face), y si ambos están vacíos se exige un único CSV.
    """
    if file_name:
        elegido = _resolve_file(members, file_name)
    elif split:
        elegido = _resolve_file(members, split)
    else:
        csvs = [m for m in members if m.lower().endswith(".csv")]
        if len(csvs) == 1:
            elegido = csvs[0]
        elif not csvs:
            raise Exception(
                "kaggle: El dataset no contiene archivos CSV. "
                f"Archivos disponibles: {members}"
            )
        else:
            raise Exception(
                "kaggle: El dataset contiene varios archivos CSV; especifica "
                f"'file_name' o 'split'. CSV disponibles: {csvs}"
            )
    if not elegido.lower().endswith(".csv"):
        raise Exception(
            f"kaggle: '{elegido}' no es un archivo CSV; KafeKAGGLE solo admite "
            "archivos CSV."
        )
    return elegido


def _parse_csv(handle):
    """Lee un CSV desde un texto y retorna (columnas, filas) con celdas STR.

    La primera fila es el encabezado; las filas vacías se ignoran y las
    filas con más celdas que el encabezado se recortan (mismo criterio que
    pardos.read_csv).
    """
    filas = []
    for fila in csv.reader(handle):
        filas.append([celda.strip() for celda in fila])
    while filas and (len(filas[-1]) == 0 or all(c == "" for c in filas[-1])):
        filas.pop()
    if not filas:
        return [], []
    columnas = filas[0]
    datos = []
    for fila in filas[1:]:
        if len(fila) == 0 or all(c == "" for c in fila):
            continue
        if len(fila) < len(columnas):
            fila = fila + [""] * (len(columnas) - len(fila))
        datos.append(fila[: len(columnas)])
    return columnas, datos


def _extract_table(archivo, file_name, split, dataset_name):
    """Extrae (columnas, filas) del archivo descargado (ZIP o CSV suelto)."""
    if archivo.lower().endswith(".zip"):
        try:
            with zipfile.ZipFile(archivo) as zfu:
                miembros = [
                    nombre
                    for nombre in zfu.namelist()
                    if not nombre.endswith("/")
                    and "__MACOSX" not in nombre
                    and not os.path.basename(nombre).startswith(".")
                ]
                if not miembros:
                    raise Exception(
                        f"kaggle: El archivo ZIP de '{dataset_name}' está vacío."
                    )
                elegido = _select_file(miembros, file_name, split)
                with zfu.open(elegido) as contenido:
                    flujo = io.TextIOWrapper(
                        contenido, encoding="utf-8-sig", newline=""
                    )
                    return _parse_csv(flujo)
        except zipfile.BadZipFile as error:
            raise Exception(
                f"kaggle: El archivo descargado de '{dataset_name}' no es un ZIP "
                f"válido: {error}"
            ) from error
    nombre = os.path.basename(archivo)
    _select_file([nombre], file_name, split)
    with open(archivo, encoding="utf-8-sig", newline="") as flujo:
        return _parse_csv(flujo)


def _load_table(dataset_name, file_name, split):
    """Valida, descarga y lee un dataset; retorna (columnas, filas) en STR."""
    _validate_dataset_name(dataset_name)
    dataset_name = dataset_name.strip()
    file_name = file_name.strip()
    split = split.strip()
    _require_kaggle()
    with tempfile.TemporaryDirectory(prefix="kafe_kaggle_") as destino:
        archivo = _download_dataset(dataset_name, destino)
        return _extract_table(archivo, file_name, split, dataset_name)


def _to_number(celda):
    """Convierte una celda CSV a float; None si es vacía o no numérica."""
    if isinstance(celda, bool):
        return None
    if isinstance(celda, (int, float)):
        return float(celda)
    if not isinstance(celda, str):
        return None
    texto = celda.strip()
    if texto == "":
        return None
    try:
        return float(texto)
    except ValueError:
        return None


def _convert_to_pardos(columnas, filas):
    """
    Convierte una tabla CSV leída a un DataFrame de PARDOS.

    Los DataFrames de PARDOS tienen la forma:
        DataFrame(columns: List[str], data: List[List[value]])

    Las celdas se tipan como en pardos.read_csv (inferir_tipo): "30" -> 30,
    "2.5" -> 2.5, "texto" -> "texto", "" -> NaN.

    Argumentos:
        columnas (List[STR]): Encabezado del CSV.
        filas (List[List[STR]]): Filas de datos sin el encabezado.

    Retorna:
        DataFrame de PARDOS con los datos convertidos.
    """
    from lib.KafePARDOS.DataFrame import DataFrame
    from lib.KafePARDOS.utils import inferir_tipo

    datos = [[inferir_tipo(celda) for celda in fila] for fila in filas]
    return DataFrame(columnas, datos)


@check_sig([1, 2], [cadena_t], [cadena_t])
def load_dataset(dataset_name, file_name=""):
    """
    Descarga un dataset de Kaggle y lo retorna como un DataFrame de PARDOS.

    Un dataset de Kaggle es un conjunto de archivos (normalmente CSV) que la
    comunidad comparte para practicar y competir en Machine Learning. A
    diferencia de Hugging Face, Kaggle no divide los datos en splits: los
    archivos viven dentro de un ZIP descargable.

    Internamente, la función:
    1. Descarga el dataset completo a un directorio temporal (API de Kaggle).
    2. Selecciona el archivo CSV a leer (el indicado, o el único del dataset).
    3. Lee el CSV con la librería estándar `csv` (sin pandas).
    4. Convierte las columnas y filas al formato DataFrame de KafePARDOS.

    Argumentos:
        dataset_name (STR): Identificador del dataset en Kaggle con el
            formato 'dueno/conjunto'. Ejemplos: "uciml/iris", "zillow/zillow-estimate".
        file_name (STR, opcional): Nombre del archivo a leer dentro del
            dataset. También acepta un selector tipo split ("train" busca
            train.csv). Si está vacío, se lee el único CSV del dataset; si
            hay varios CSV, se lanza un error que los lista.

    Retorna:
        PARDOS DataFrame con los datos cargados.

    Ejemplo KAFE:
        import kaggle;
        PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
        show(df.head(5));

    Nota: Requiere conexión a internet, la librería `kaggle` instalada y
    credenciales configuradas (~/.kaggle/kaggle.json o KAGGLE_USERNAME y
    KAGGLE_KEY). El dataset completo se carga en memoria.
    """
    columnas, filas = _load_table(dataset_name, file_name, "")
    return _convert_to_pardos(columnas, filas)


@check_sig([2, 3], [cadena_t], [cadena_t], [cadena_t])
def load_dataset_split(dataset_name, file_name, split=""):
    """
    Carga un archivo específico de un dataset de Kaggle como DataFrame de PARDOS.

    Kaggle no tiene splits (train/test/validation) como Hugging Face: cada
    dataset es un conjunto de archivos. Para mantener la misma forma de API
    que KafeHF, el parámetro `split` se interpreta como un **selector de
    archivo con forma de split**: "train" busca train.csv, "test" busca
    test.csv, etc. También se acepta el nombre exacto del archivo
    ("train.csv" o "data/train.csv"). Esta es la semántica elegida para
    KafeKAGGLE: en lugar de rechazar la llamada, el split designa el
    archivo que cumple ese rol en el dataset.

    Reglas de selección:
        1. Si `file_name` no está vacío, tiene prioridad y se usa como
           selector de archivo.
        2. Si `file_name` está vacío, se usa `split` como selector.
        3. Si ambos están vacíos, se selecciona el único CSV del dataset
           (error si hay varios).
        4. Si el archivo no existe, el error lista los archivos disponibles.

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        file_name (STR): Archivo dentro del dataset ("" = usar split o
            selección automática).
        split (STR, opcional): Selector tipo split ("train", "test", ...).

    Retorna:
        PARDOS DataFrame con los datos del archivo seleccionado.

    Ejemplo KAFE:
        import kaggle;
        PARDOS test_df = kaggle.load_dataset_split("dueno/conjunto", "", "test");
        show(test_df.head(5));

    Nota: Requiere conexión a internet, la librería `kaggle` instalada y
    credenciales configuradas.
    """
    columnas, filas = _load_table(dataset_name, file_name, split)
    return _convert_to_pardos(columnas, filas)


@check_sig([1, 2, 3, 4], [cadena_t], [lista_cadenas_t], [cadena_t], [entero_t])
def load_dataset_matrix(dataset_name, columns=None, split="", limit=0):
    """Carga columnas numéricas de Kaggle como matriz para NUMK/GESHA.

    Descarga el dataset, lee el CSV como texto y convierte cada celda a
    número (float). A diferencia de KafeHF, un CSV no trae tipos nativos:
    una celda es numérica si su contenido se puede interpretar como número
    ("30" y "2.5" sí, "texto" y las celdas vacías no).

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        columns (List[STR], opcional): Columnas a extraer. Si está vacío,
            se infieren automáticamente las columnas numéricas a partir de
            la primera fila.
        split (STR, opcional): Selector de archivo (ver
            load_dataset_split); vacío = selección automática del único CSV.
            KafeHF usa "train" por defecto; Kaggle no tiene splits canónicos
            por lo que el defecto aquí es la selección automática.
        limit (INT): Máximo de filas a procesar; 0 = todas las filas.

    Retorna:
        List[List[FLOAT]] con una fila numérica por registro, compatible
        con NUMK/GESHA. No construye un DataFrame de PARDOS intermedio.

    Ejemplo KAFE:
        import kaggle;
        List[List[FLOAT]] X = kaggle.load_dataset_matrix("uciml/iris", ["SepalLengthCm", "PetalLengthCm"], "Iris", 10);

    Nota: Requiere conexión a internet, la librería `kaggle` instalada y
    credenciales configuradas. El dataset completo se descarga en cada
    llamada a un directorio temporal.
    """
    columnas_disponibles, filas = _load_table(dataset_name, "", split)

    if columns is None or len(columns) == 0:
        if not columnas_disponibles:
            raise Exception(
                "kaggle: No se pudieron determinar las columnas del dataset."
            )
        if not filas:
            return []
        primera = dict(zip(columnas_disponibles, filas[0]))
        columns = [
            nombre
            for nombre in columnas_disponibles
            if _to_number(primera.get(nombre)) is not None
        ]
        datos = filas
    else:
        faltantes = [c for c in columns if c not in columnas_disponibles]
        if faltantes:
            raise Exception(f"kaggle: Columnas inexistentes: {faltantes}")
        datos = filas

    if not columns:
        raise Exception("kaggle: No se encontraron columnas numéricas.")

    matriz = []
    for fila in datos:
        valores = dict(zip(columnas_disponibles, fila))
        fila_numerica = []
        for nombre in columns:
            numero = _to_number(valores.get(nombre))
            if numero is None:
                raise Exception(
                    f"kaggle: La columna '{nombre}' contiene valores no "
                    "numéricos o nulos."
                )
            fila_numerica.append(numero)
        matriz.append(fila_numerica)
        if limit > 0 and len(matriz) >= limit:
            break
    return matriz
