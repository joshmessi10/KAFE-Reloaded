"""
KafeKaggle — Librería para cargar datasets desde Kaggle.

Kaggle (https://www.kaggle.com) es la plataforma líder de competiciones y
datasets de Machine Learning. Cada dataset se publica como un conjunto de
archivos (normalmente CSV) descargables mediante la API oficial.

Esta librería permite a los usuarios de KAFE acceder a datasets de Kaggle
directamente desde sus programas, de forma similar a:

    Python:
        import kagglehub
        ruta = kagglehub.dataset_download("uciml/iris")

    KAFE:
        import kaggle;
        PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");

Diferencias con Hugging Face (KafeHF):
    - Kaggle no organiza los datos en splits (train/test/validation); cada
      dataset trae archivos. Por eso el parámetro `split` actúa como un
      selector de archivo con forma de split: "train" busca train.csv.
    - Los datasets públicos se descargan sin ninguna credencial
      (descarga anónima). Las credenciales son opcionales y solo se
      necesitan para datasets privados: ~/.kaggle/kaggle.json o las
      variables de entorno KAGGLE_USERNAME y KAGGLE_KEY.
    - Las descargas quedan cacheadas por kagglehub en ~/.cache/kagglehub,
      por lo que un segundo acceso al mismo dataset es instantáneo.

Los archivos se leen con la librería `csv` de la estándar (sin pandas) y se
convierten a DataFrames de PARDOS o a matrices de números para NUMK/GESHA.

Dependencia externa opcional: kagglehub.
    pip install kagglehub
"""

from global_utils import check_sig
from TypeUtils import cadena_t, lista_cadenas_t, entero_t
import csv
import importlib
import io
import logging
import os
import subprocess
import sys
from contextlib import contextmanager, redirect_stdout
import random

try:
    import kagglehub
    _KAGGLEHUB_AVAILABLE = True
except ImportError:
    kagglehub = None
    _KAGGLEHUB_AVAILABLE = False


def _require_kagglehub():
    """Instala ``kagglehub`` bajo demanda cuando no está disponible."""
    global kagglehub, _KAGGLEHUB_AVAILABLE
    if _KAGGLEHUB_AVAILABLE:
        return
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "kagglehub"],
            check=True,
            timeout=120,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        kagglehub = importlib.import_module("kagglehub")
        _KAGGLEHUB_AVAILABLE = True
    except Exception as error:
        raise Exception(
            "kaggle: no se pudo instalar automáticamente 'kagglehub'. "
            "Comprueba la conexión o ejecuta 'pip install kagglehub'. "
            f"Detalle: {error}"
        ) from error


def _tiene_credenciales():
    """Indica si hay credenciales de Kaggle disponibles (opcionales).

    Fuentes de credenciales: ~/.kaggle/kaggle.json (o
    KAGGLE_CONFIG_DIR/kaggle.json) o las variables de entorno
    KAGGLE_USERNAME y KAGGLE_KEY. Los datasets públicos se descargan
    sin credenciales; las privadas las necesitan, por lo que esta
    función solo se usa para enriquecer los mensajes de error.
    """
    config_dir = os.environ.get("KAGGLE_CONFIG_DIR") or os.path.join(
        os.path.expanduser("~"), ".kaggle"
    )
    config_path = os.path.join(config_dir, "kaggle.json")
    tiene_archivo = os.path.isfile(config_path)
    tiene_variables = bool(os.environ.get("KAGGLE_USERNAME")) and bool(
        os.environ.get("KAGGLE_KEY")
    )
    return tiene_archivo or tiene_variables


def _validate_dataset_name(dataset_name):
    """Valida el identificador del dataset antes de tocar la red."""
    if not dataset_name or not dataset_name.strip():
        raise Exception(
            "kaggle: El nombre del dataset no puede estar vacío. "
            "Usa el formato 'dueño/conjunto' (por ejemplo, 'uciml/iris')."
        )


@contextmanager
def _silenciar_logs_kagglehub():
    """Redirige temporalmente los logs del logger "kagglehub" a un buffer.

    kagglehub no imprime sus mensajes de progreso ("Downloading to…",
    "Extracting files…") con print: usa logging y su handler de stdout
    captura el objeto sys.stdout al importar, por lo que un
    redirect_stdout no los intercepta. Este gestor reubica el stream de
    cada handler del logger "kagglehub" (los loggers hijos propagan hacia
    él) en un buffer descartable y restaura los streams originales al
    salir, incluso si la descarga lanza una excepción. El progreso de
    tqdm va a stderr y no se toca.
    """
    captura = io.StringIO()
    raiz = logging.getLogger("kagglehub")
    originales = [(handler, handler.stream) for handler in raiz.handlers]
    for handler, _stream in originales:
        handler.setStream(captura)
    try:
        yield
    finally:
        for handler, stream in originales:
            handler.setStream(stream)


def _download_dataset(dataset_name):
    """Descarga un dataset con kagglehub y retorna el directorio extraído.

    Único punto de contacto con Kaggle: kagglehub descarga (sin
    credenciales si el dataset es público), extrae y cachea el dataset en
    ~/.cache/kagglehub, y retorna el directorio ya extraído. La salida
    del cliente (print y logs de progreso) se silencia para no contaminar
    la salida del programa KAFE. Las pruebas unitarias y los benchmarks
    reemplazan esta función para no tocar red.
    """
    try:
        with redirect_stdout(io.StringIO()), _silenciar_logs_kagglehub():
            return kagglehub.dataset_download(dataset_name)
    except Exception as error:
        mensaje = (
            f"kaggle: Error descargando dataset '{dataset_name}': {error}."
        )
        if not _tiene_credenciales():
            mensaje += (
                " Si el dataset es privado, configura credenciales: "
                "~/.kaggle/kaggle.json o las variables de entorno "
                "KAGGLE_USERNAME y KAGGLE_KEY (los datasets públicos no "
                "las necesitan)."
            )
        raise Exception(mensaje) from error


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


def _extract_table(ruta, file_name, split, dataset_name):
    """Extrae (columnas, filas) de un directorio descargado o un CSV suelto.

    kagglehub siempre retorna un directorio extraído; se recorre en
    profundidad recolectando rutas relativas con separador '/', ignorando
    metadatos de macOS (__MACOSX) y archivos u ocultos (cualquier
    componente de la ruta que empiece con '.').
    """
    if os.path.isdir(ruta):
        miembros = []
        for directorio, _subdirs, archivos in os.walk(ruta):
            for nombre in archivos:
                absoluto = os.path.join(directorio, nombre)
                relativo = os.path.relpath(absoluto, ruta)
                if "__MACOSX" in relativo:
                    continue
                if any(parte.startswith(".") for parte in relativo.split(os.sep)):
                    continue
                miembros.append(relativo.replace(os.sep, "/"))
        if not miembros:
            raise Exception(
                f"kaggle: El dataset '{dataset_name}' no contiene archivos."
            )
        miembros = sorted(miembros)
        elegido = _select_file(miembros, file_name, split)
        destino = os.path.join(ruta, *elegido.split("/"))
        with open(destino, encoding="utf-8-sig", newline="") as flujo:
            return _parse_csv(flujo)
    nombre = os.path.basename(ruta)
    _select_file([nombre], file_name, split)
    with open(ruta, encoding="utf-8-sig", newline="") as flujo:
        return _parse_csv(flujo)


def _load_table(dataset_name, file_name, split):
    """Valida, descarga y lee un dataset; retorna (columnas, filas) en STR."""
    _validate_dataset_name(dataset_name)
    dataset_name = dataset_name.strip()
    file_name = file_name.strip()
    split = split.strip()
    _require_kagglehub()
    ruta = _download_dataset(dataset_name)
    return _extract_table(ruta, file_name, split, dataset_name)


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


def _require_cifar_image_dependencies():
    """Obtiene los lectores opcionales para PNG y archivos 7z de CIFAR-10.

    KafeKAGGLE mantiene ``kagglehub`` como dependencia diferida. CIFAR-10
    necesita además Pillow para decodificar PNG y py7zr para extraer el
    archivo publicado por Kaggle; se instalan solo al solicitar este loader.
    """
    modules = []
    for package, module_name in (("Pillow", "PIL.Image"), ("py7zr", "py7zr")):
        try:
            modules.append(importlib.import_module(module_name))
        except ImportError:
            try:
                subprocess.run(
                    [sys.executable, "-m", "pip", "install", package],
                    check=True,
                    timeout=180,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                modules.append(importlib.import_module(module_name))
            except Exception as error:
                raise Exception(
                    f"kaggle: no se pudo instalar '{package}', necesario para "
                    f"leer CIFAR-10. Detalle: {error}"
                ) from error
    return modules[0], modules[1]


def _find_file_by_name(root, name):
    """Busca un archivo por nombre sin depender de una ruta interna fija."""
    target = name.lower()
    matches = []
    for directory, _subdirs, files in os.walk(root):
        for filename in files:
            if filename.lower() == target:
                matches.append(os.path.join(directory, filename))
    if not matches:
        return None
    return sorted(matches)[0]


def _extract_7z_if_needed(archive_path, py7zr_module):
    """Extrae un 7z una sola vez junto al archivo y devuelve su carpeta."""
    destination = archive_path[:-3]
    if os.path.isdir(destination) and any(os.scandir(destination)):
        return destination
    os.makedirs(destination, exist_ok=True)
    try:
        with py7zr_module.SevenZipFile(archive_path, mode="r") as archive:
            archive.extractall(path=destination)
    except Exception as error:
        raise Exception(f"kaggle: no se pudo extraer '{os.path.basename(archive_path)}': {error}") from error
    return destination


def _find_cifar_train_directory(dataset_path, py7zr_module):
    """Localiza o extrae el directorio de PNG etiquetados de CIFAR-10."""
    for directory, _subdirs, files in os.walk(dataset_path):
        if any(filename.lower().endswith(".png") for filename in files):
            return directory
    archive = _find_file_by_name(dataset_path, "train.7z")
    if archive is None:
        raise Exception(
            "kaggle: CIFAR-10 requiere imágenes de entrenamiento PNG o el archivo train.7z."
        )
    extracted = _extract_7z_if_needed(archive, py7zr_module)
    for directory, _subdirs, files in os.walk(extracted):
        if any(filename.lower().endswith(".png") for filename in files):
            return directory
    raise Exception("kaggle: train.7z no contiene imágenes PNG.")


def _read_cifar_labels(labels_path):
    """Lee ``trainLabels.csv`` y codifica sus diez clases en 0..9."""
    with open(labels_path, encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames or "id" not in reader.fieldnames or "label" not in reader.fieldnames:
            raise Exception("kaggle: trainLabels.csv debe contener las columnas 'id' y 'label'.")
        raw_labels = {}
        for row in reader:
            raw_labels[int(row["id"])] = row["label"].strip()
    classes = sorted(set(raw_labels.values()))
    if len(classes) != 10:
        raise Exception(f"kaggle: CIFAR-10 debe tener 10 clases, se encontraron {len(classes)}.")
    encoded = {image_id: classes.index(label) for image_id, label in raw_labels.items()}
    return encoded


def _load_cifar_image(path, image_module):
    """Convierte un PNG RGB de 32×32 al formato GESHA [canal, alto, ancho]."""
    try:
        with image_module.open(path) as image:
            rgb = image.convert("RGB")
            if rgb.size != (32, 32):
                raise Exception(f"se esperaba 32x32 y se obtuvo {rgb.size[0]}x{rgb.size[1]}")
            pixels = list(rgb.getdata())
    except Exception as error:
        raise Exception(f"kaggle: no se pudo leer la imagen '{os.path.basename(path)}': {error}") from error
    return [
        [[float(pixels[row * 32 + column][channel]) / 255.0 for column in range(32)] for row in range(32)]
        for channel in range(3)
    ]


@check_sig([4], [cadena_t], [entero_t], [entero_t], [entero_t])
def load_cifar10(dataset_name, train_samples, test_samples, seed):
    """Carga una muestra estratificada de CIFAR-10 para GESHA.

    Descarga el dataset de Kaggle, lee los PNG etiquetados y retorna un
    ``TrainTestSplit`` indexable: ``[X_train, X_test, y_train, y_test]``.
    Las muestras se seleccionan por clase sin solapamiento; ``X_test`` es una
    partición de evaluación extraída del conjunto etiquetado de entrenamiento,
    pues el test de la competición no publica etiquetas.
    """
    if train_samples <= 0 or test_samples <= 0:
        raise Exception("kaggle: train_samples y test_samples deben ser positivos.")
    if train_samples % 10 != 0 or test_samples % 10 != 0:
        raise Exception("kaggle: las cantidades de CIFAR-10 deben ser múltiplos de 10 para conservar el balance.")

    image_module, py7zr_module = _require_cifar_image_dependencies()
    _validate_dataset_name(dataset_name)
    _require_kagglehub()
    dataset_path = _download_dataset(dataset_name.strip())
    labels_path = _find_file_by_name(dataset_path, "trainLabels.csv")
    if labels_path is None:
        raise Exception("kaggle: no se encontró trainLabels.csv en el dataset CIFAR-10.")
    image_directory = _find_cifar_train_directory(dataset_path, py7zr_module)
    labels = _read_cifar_labels(labels_path)

    by_class = {class_id: [] for class_id in range(10)}
    for directory, _subdirs, files in os.walk(image_directory):
        for filename in files:
            if not filename.lower().endswith(".png"):
                continue
            stem = os.path.splitext(filename)[0]
            if stem.isdigit() and int(stem) in labels:
                image_id = int(stem)
                by_class[labels[image_id]].append((image_id, os.path.join(directory, filename)))

    per_class_train = train_samples // 10
    per_class_test = test_samples // 10
    rng = random.Random(seed)
    train_records, test_records = [], []
    for class_id in range(10):
        records = sorted(by_class[class_id])
        rng.shuffle(records)
        required = per_class_train + per_class_test
        if len(records) < required:
            raise Exception(
                f"kaggle: la clase {class_id} solo tiene {len(records)} imágenes; se requieren {required}."
            )
        train_records.extend((path, class_id) for _id, path in records[:per_class_train])
        test_records.extend((path, class_id) for _id, path in records[per_class_train:required])
    rng.shuffle(train_records)
    rng.shuffle(test_records)

    X_train = [_load_cifar_image(path, image_module) for path, _label in train_records]
    X_test = [_load_cifar_image(path, image_module) for path, _label in test_records]
    y_train = [label for _path, label in train_records]
    y_test = [label for _path, label in test_records]

    from lib.KafeMACHINE.model_selection.model_selection import TrainTestSplit
    return TrainTestSplit(X_train, X_test, y_train, y_test)


@check_sig([1, 2], [cadena_t], [cadena_t])
def load_dataset(dataset_name, file_name=""):
    """
    Descarga un dataset de Kaggle y lo retorna como un DataFrame de PARDOS.

    Un dataset de Kaggle es un conjunto de archivos (normalmente CSV) que la
    comunidad comparte para practicar y competir en Machine Learning. A
    diferencia de Hugging Face, Kaggle no divide los datos en splits: los
    archivos viven dentro del dataset descargable.

    Internamente, la función:
    1. Descarga el dataset con kagglehub (cacheado en ~/.cache/kagglehub).
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

    Nota: Requiere conexión a internet y la librería `kagglehub` instalada
    (se instala automáticamente bajo demanda). Los datasets públicos no
    requieren ninguna credencial; para datasets privados, las credenciales
    son opcionales (~/.kaggle/kaggle.json, KAGGLE_USERNAME y KAGGLE_KEY, o
    los secretos de Colab). Las descargas quedan cacheadas por kagglehub y
    el dataset completo se carga en memoria.
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

    Nota: Requiere conexión a internet y la librería `kagglehub` instalada.
    Los datasets públicos no requieren credenciales; las privadas las
    necesitan de forma opcional (kaggle.json o variables de entorno).
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

    Nota: Requiere conexión a internet y la librería `kagglehub` instalada.
    Los datasets públicos no requieren credenciales y las descargas quedan
    cacheadas por kagglehub; el dataset completo se carga en memoria.
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
