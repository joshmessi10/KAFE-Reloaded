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

Además de las tablas CSV, KafeKAGGLE ofrece:
    - ``load_text_dataset`` — datasets de texto etiquetado sin encabezado
      (frases + etiqueta entera), el formato ``texto<TAB>0|1`` de los
      datasets de sentimiento; columnas ``text`` (STR) y ``label`` (INT).
    - Una API genérica de ingesta de imágenes (`load_image`,
      `load_images`, `load_image_dataset`) que devuelve imágenes en
      formato `[C][H][W]` con píxeles normalizados a `[0,1]`, compatible
      con las capas Conv2D de GESHA.

Dependencias externas opcionales (auto-instaladas bajo demanda):
    - kagglehub — cliente oficial de descarga.
    - Pillow — decodificación PNG/JPEG/BMP y redimensionado.
    - py7zr — extracción de archivos ``.7z`` anidados (``.zip`` usa la
      biblioteca estándar ``zipfile``).
"""

import csv
import importlib
import io
import logging
import os
import random
import subprocess
import sys
import zipfile
from contextlib import contextmanager, redirect_stdout

from global_utils import check_sig
from TypeUtils import integer_type as entero_t
from TypeUtils import string_list_type as lista_cadenas_t
from TypeUtils import string_type as cadena_t


def _directory_has_entries(path):
    with os.scandir(path) as entries:
        return next(entries, None) is not None


try:
    kagglehub = importlib.import_module("kagglehub")

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
    originales = [
        (handler, handler.stream)
        for handler in raiz.handlers
        if isinstance(handler, logging.StreamHandler)
    ]
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
            client = kagglehub
            if client is None:
                raise RuntimeError("kagglehub no está disponible")
            ruta = client.dataset_download(dataset_name)
    except Exception as error:
        mensaje = f"kaggle: Error descargando dataset '{dataset_name}': {error}."
        if not _tiene_credenciales():
            mensaje += (
                " Si el dataset es privado, configura credenciales: "
                "~/.kaggle/kaggle.json o las variables de entorno "
                "KAGGLE_USERNAME y KAGGLE_KEY (los datasets públicos no "
                "las necesitan)."
            )
        raise Exception(mensaje) from error
    if (
        not isinstance(ruta, str)
        or not os.path.isdir(ruta)
        or not _directory_has_entries(ruta)
    ):
        raise Exception(
            f"kaggle: La descarga de '{dataset_name}' no produjo archivos. "
            "Comprueba el nombre del dataset o vuelve a intentarlo."
        )
    return ruta


def _format_list(items, limit=20):
    """Recorta una lista larga para mensajes de error legibles.

    Devuelve la representación de los primeros ``limit`` items seguida
    de un resumen del resto (``… y N más (total M)``) cuando la lista excede
    el límite, evitando volcar miles de rutas en un solo mensaje.
    """
    total = len(items)
    if total <= limit:
        return str(items)
    return f"{items[:limit]} … y {total - limit} más (total {total})"


def _resolve_file(members, selector):
    """Resuelve un nombre de archivo o un selector tipo split.

    Acepta la ruta exacta dentro del dataset ("data/train.csv"), el nombre
    del archivo ("train.csv") o un split sin extensión ("train" -> train.csv).
    """
    objetivo = selector.lower()
    exactos = [m for m in members if m == selector]
    if exactos:
        return exactos[0]
    por_nombre = [m for m in members if os.path.basename(m).lower() == objetivo]
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
        f"Archivos disponibles: {_format_list(members)}"
    )


def _choose_file(members, file_name, split, extensions, description, label):
    """Comparte la selección de archivos: file_name > split > único candidato.

    ``extensions`` limita la selección automática (cuando ni ``file_name``
    ni ``split`` están vacíos), ``description`` redacta los mensajes de error
    y ``label`` nombra a los candidatos listados.
    """
    if file_name:
        elegido = _resolve_file(members, file_name)
    elif split:
        elegido = _resolve_file(members, split)
    else:
        candidatos = [m for m in members if m.lower().endswith(extensions)]
        if len(candidatos) == 1:
            elegido = candidatos[0]
        elif not candidatos:
            raise Exception(
                f"kaggle: El dataset no contiene archivos {description}. "
                f"Archivos disponibles: {_format_list(members)}"
            )
        else:
            raise Exception(
                f"kaggle: El dataset contiene varios archivos {description}; "
                f"especifica 'file_name' o 'split'. {label} disponibles: "
                f"{_format_list(candidatos)}"
            )
    return elegido


_EXTENSIONES_TEXTO = (".txt", ".tsv", ".csv")


def _select_file(members, file_name, split):
    """Elige el archivo del dataset a leer según file_name, split o al azar.

    Prioridad: file_name (si no está vacío), luego split (selector tipo
    split de Hugging Face), y si ambos están vacíos se exige un único CSV.
    """
    elegido = _choose_file(members, file_name, split, (".csv",), "CSV", "CSV")
    if not elegido.lower().endswith(".csv"):
        raise Exception(
            f"kaggle: '{elegido}' no es un archivo CSV; KafeKAGGLE solo admite "
            "archivos CSV."
        )
    return elegido


def _select_file_text(members, file_name, split):
    """Elige un archivo de texto etiquetado: acepta ``.txt``, ``.tsv`` y ``.csv``.

    Misma prioridad de selección que ``_select_file`` (file_name, luego
    split, luego el único candidato), pero sin rechazar por extensión los
    formatos de texto con el que trabaja ``load_text_dataset``.
    """
    elegido = _choose_file(
        members,
        file_name,
        split,
        _EXTENSIONES_TEXTO,
        "de texto (.txt, .tsv, .csv)",
        "Archivos",
    )
    if not elegido.lower().endswith(_EXTENSIONES_TEXTO):
        raise Exception(
            f"kaggle: '{elegido}' no es un archivo de texto; KafeKAGGLE solo "
            "admite archivos .txt, .tsv y .csv."
        )
    return elegido


def _read_rows(handle, delimiter=","):
    """Lee un archivo delimitado y retorna sus filas con celdas STR limpias.

    Cada fila no vacía se devuelve con las celdas recortadas (``strip``);
    las filas vacías (sin celdas o con todas las celdas vacías) se
    descartan. No interpreta encabezados: quien llama decide si la primera
    fila es cabecera (``_parse_csv``) o un registro más
    (``_parse_text_labels``).
    """
    filas = []
    for fila in csv.reader(handle, delimiter=delimiter):
        limpia = [celda.strip() for celda in fila]
        if len(limpia) == 0 or all(celda == "" for celda in limpia):
            continue
        filas.append(limpia)
    return filas


def _parse_csv(handle):
    """Lee un CSV desde un texto y retorna (columnas, filas) con celdas STR.

    La primera fila es el encabezado; las filas vacías se ignoran y las
    filas con más celdas que el encabezado se recortan (mismo criterio que
    pardos.read_csv); las cortas se rellenan con "".
    """
    filas = _read_rows(handle, ",")
    if not filas:
        return [], []
    columnas = filas[0]
    datos = []
    for fila in filas[1:]:
        if len(fila) < len(columnas):
            fila = fila + [""] * (len(columnas) - len(fila))
        datos.append(fila[: len(columnas)])
    return columnas, datos


def _is_integer(cell):
    """Indica si una celda representa un entero ("0", "-3", " 12 ")."""
    try:
        int(cell.strip())
        return True
    except ValueError:
        return False


def _parse_text_labels(handle, delimiter, text_column, label_column):
    """Lee un archivo de texto etiquetado y valida sus columnas.

    No hay encabezado: todas las filas son registros. Valida que cada fila
    tenga celdas suficientes para ``text_column`` y ``label_column`` y que
    la etiqueta sea un entero convertible (0/1 u otro entero). Retorna la
    lista de filas ya limpias; los mensajes de error listan como mucho las
    primeras filas problemáticas (``_format_list``).
    """
    filas = _read_rows(handle, delimiter)
    requeridas = max(text_column, label_column) + 1
    incompletas = [fila for fila in filas if len(fila) < requeridas]
    if incompletas:
        raise Exception(
            f"kaggle: Hay filas con menos de {requeridas} celdas "
            f"(text_column={text_column}, label_column={label_column}); "
            f"filas problemáticas: {_format_list(incompletas)}"
        )
    invalidas = [
        fila[label_column] for fila in filas if not _is_integer(fila[label_column])
    ]
    if invalidas:
        raise Exception(
            f"kaggle: La columna de etiquetas (label_column={label_column}) "
            "debe contener enteros; valores no válidos: "
            f"{_format_list(invalidas)}"
        )
    return filas


def _extract_text_table(
    ruta, file_name, delimiter, text_column, label_column, dataset_name
):
    """Extrae las filas de un archivo de texto etiquetado ya descargado.

    Recorre el directorio en profundidad (mismos criterios que
    ``_extract_table``: sin ``__MACOSX`` ni rutas ocultas), selecciona el
    archivo con ``_select_file_text`` y lo lee con ``delimiter`` indicado.
    """
    if os.path.isdir(ruta):
        miembros = _list_members(ruta)
        if not miembros:
            raise Exception(
                f"kaggle: El dataset '{dataset_name}' no contiene archivos."
            )
        elegido = _select_file_text(miembros, file_name, "")
        destino = os.path.join(ruta, *elegido.split("/"))
    else:
        _select_file_text([os.path.basename(ruta)], file_name, "")
        destino = ruta
    with open(destino, encoding="utf-8-sig", newline="") as flujo:
        return _parse_text_labels(flujo, delimiter, text_column, label_column)


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


def _to_number(cell):
    """Convierte una celda CSV a float; None si es vacía o no numérica."""
    if isinstance(cell, bool):
        return None
    if isinstance(cell, (int, float)):
        return float(cell)
    if not isinstance(cell, str):
        return None
    texto = cell.strip()
    if texto == "":
        return None
    try:
        return float(texto)
    except ValueError:
        return None


def _convert_to_pardos(columns, rows):
    """
    Convierte una tabla CSV leída a un DataFrame de PARDOS.

    Los DataFrames de PARDOS tienen la forma:
        DataFrame(columns: List[str], data: List[List[value]])

    Las celdas se tipan como en pardos.read_csv (inferir_tipo): "30" -> 30,
    "2.5" -> 2.5, "texto" -> "texto", "" -> NaN.

    Argumentos:
        columns (List[STR]): Encabezado del CSV.
        rows (List[List[STR]]): Filas de datos sin el encabezado.

    Retorna:
        DataFrame de PARDOS con los datos convertidos.
    """
    from lib.KafePARDOS.DataFrame import DataFrame
    from lib.KafePARDOS.utils import infer_type

    datos = [[infer_type(celda) for celda in fila] for fila in rows]
    return DataFrame(columns, datos)


def _require_image_dependencies():
    """Obtiene los lectores opcionales para imágenes y archivos 7z.

    KafeKAGGLE mantiene ``kagglehub`` como dependencia diferida. La ingesta
    de imágenes necesita además Pillow para decodificar PNG/JPEG/BMP y
    redimensionar, y py7zr para extraer archivos ``.7z`` anidados. Ambos se
    instalan solo al solicitar esta API y permanecen opcionales.
    Devuelve ``(PIL.Image, py7zr)``.
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
                    f"la ingesta de imágenes. Detalle: {error}"
                ) from error
    return modules[0], modules[1]


def _normalize_color_mode(color_mode):
    """Valida y normaliza el modo de color antes de descargar nada.

    Acepta ``"rgb"`` (3 canales, ``convert("RGB")``) y ``"gray"`` /
    ``"grayscale"`` (1 canal, ``convert("L")``), sin distinguir mayúsculas
    ni espacios. Cualquier otro valor produce un error educativo.
    Devuelve ``"rgb"`` o ``"gray"``.
    """
    if not isinstance(color_mode, str):
        raise Exception("kaggle: 'color_mode' debe ser una cadena: 'rgb' o 'gray'.")
    normalizado = color_mode.strip().lower()
    if normalizado == "rgb":
        return "rgb"
    if normalizado in ("gray", "grayscale"):
        return "gray"
    raise Exception(
        f"kaggle: 'color_mode' inválido ('{color_mode}'). Usa 'rgb' o "
        "'gray'/'grayscale'."
    )


def _normalize_dimension(value, name):
    """Valida que ``height``/``width`` sean enteros positivos."""
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise Exception(
            f"kaggle: '{name}' debe ser un entero positivo; se recibió {value!r}."
        )
    return value


def _list_members(root):
    """Lista rutas relativas de todos los archivos de ``root``.

    Aplica la misma política de ``_extract_table``: ignora ``__MACOSX`` y
    cualquier componente que empiece con '.'. Devuelve la lista ordenada.
    """
    miembros = []
    for directorio, _subdirs, archivos in os.walk(root):
        for nombre in archivos:
            absoluto = os.path.join(directorio, nombre)
            relativo = os.path.relpath(absoluto, root)
            if "__MACOSX" in relativo:
                continue
            if any(parte.startswith(".") for parte in relativo.split(os.sep)):
                continue
            miembros.append(relativo.replace(os.sep, "/"))
    return sorted(miembros)


def _find_images(root):
    """Recolecta rutas relativas de imágenes ordenadas dentro de ``root``.

    Recorre ``root`` en profundidad y devuelve las rutas relativas (con
    separador '/') de los archivos ``.png/.jpg/.jpeg/.bmp`` (sin distinguir
    mayúsculas), ignorando metadatos de macOS (``__MACOSX``) y archivos u
    ocultos (componentes que empiezan con '.'), igual que ``_extract_table``.
    Ordena la lista para que el resultado sea determinista. Error educativo
    si no hay ninguna imagen.
    """
    extensiones = (".png", ".jpg", ".jpeg", ".bmp")
    imagenes = []
    for directorio, _subdirs, archivos in os.walk(root):
        for nombre in archivos:
            if not nombre.lower().endswith(extensiones):
                continue
            absoluto = os.path.join(directorio, nombre)
            relativo = os.path.relpath(absoluto, root)
            if "__MACOSX" in relativo:
                continue
            if any(parte.startswith(".") for parte in relativo.split(os.sep)):
                continue
            imagenes.append(relativo.replace(os.sep, "/"))
    if not imagenes:
        raise Exception("kaggle: El dataset no contiene imágenes .png/.jpg/.jpeg/.bmp.")
    return sorted(imagenes)


def _resolve_member(members, selector, description):
    """Resuelve una ruta exacta o un basename único dentro de ``members``.

    Primero intenta la coincidencia exacta de la ruta relativa; si no, por
    basename. Un basename que coincide con varios archivos es ambiguo y un
    selector inexistente provoca un error educativo que lista los candidatos.
    """
    exactos = [m for m in members if m == selector]
    if exactos:
        return exactos[0]
    objetivo = os.path.basename(selector).lower()
    por_nombre = [m for m in members if os.path.basename(m).lower() == objetivo]
    if len(por_nombre) == 1:
        return por_nombre[0]
    if len(por_nombre) > 1:
        raise Exception(
            f"kaggle: {description} '{selector}' es ambiguo; coincide con "
            f"varios archivos: {_format_list(por_nombre)}"
        )
    raise Exception(
        f"kaggle: No se encontró {description} '{selector}'. Archivos "
        f"disponibles: {_format_list(members)}"
    )


def _safe_join(destination, member):
    """Devuelve la ruta absoluta segura de ``member`` bajo ``destination``.

    Retorna ``None`` si la entrada intenta salir del destino (*path
    traversal*), por ejemplo con componentes ``..`` o una ruta absoluta.
    """
    raiz = os.path.realpath(destination)
    candidato = os.path.realpath(os.path.join(destination, member))
    if candidato == raiz:
        return candidato
    if not candidato.startswith(raiz + os.sep):
        return None
    return candidato


def _extract_zip(archive_path, destination):
    """Extrae un ``.zip`` descartando entradas inseguras (path traversal)."""
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if _safe_join(destination, member) is None:
                continue
            archive.extract(member, destination)


def _extract_7z(archive_path, destination, py7zr_module):
    """Extrae un ``.7z`` descartando entradas inseguras (path traversal)."""
    with py7zr_module.SevenZipFile(archive_path, mode="r") as archive:
        seguros = [
            member
            for member in archive.getnames()
            if _safe_join(destination, member) is not None
        ]
        if seguros:
            archive.extract(path=destination, targets=seguros)


def _ensure_images_extracted(root, py7zr_module):
    """Extrae los ``.zip``/``.7z`` anidados de ``root`` una sola vez y seguro.

    Recorre ``root`` buscando archivos ``.zip`` y ``.7z`` y extrae cada uno
    en una carpeta hermana (``<archivo>_extracted``) sólo si no existe o
    está vacía. La extracción valida cada entrada contra *path traversal*
    (descarta las que salgan del destino): los ``.zip`` se abren con
    ``zipfile`` de la biblioteca estándar y los ``.7z`` con ``py7zr``.
    Es idempotente: una segunda llamada no re-extrae. Devuelve ``root``.
    """
    for directorio, _subdirs, archivos in os.walk(root):
        for nombre in archivos:
            extension = os.path.splitext(nombre)[1].lower()
            if extension not in (".zip", ".7z"):
                continue
            archive_path = os.path.join(directorio, nombre)
            destination = archive_path + "_extracted"
            if os.path.isdir(destination) and _directory_has_entries(destination):
                continue
            os.makedirs(destination, exist_ok=True)
            try:
                if extension == ".zip":
                    _extract_zip(archive_path, destination)
                else:
                    _extract_7z(archive_path, destination, py7zr_module)
            except Exception as error:
                raise Exception(
                    f"kaggle: no se pudo extraer "
                    f"'{os.path.basename(archive_path)}': {error}"
                ) from error
    return root


def _load_image_array(path, height, width, color_mode, image_module):
    """Decodifica, reescala y normaliza una imagen al formato GESHA ``[C][H][W]``.

    Fundamento: la imagen se decodifica con Pillow, se convierte al modo de
    color pedido (``convert("RGB")`` o ``convert("L")``), se redimensiona a
    ``(width, height)`` y se normaliza cada píxel a ``[0,1]`` dividiendo por
    255 (:math:`p/255`). El resultado es una lista ``[canal][alto][ancho]``
    (layout CHW que espera Conv2D), con 3 canales en ``"rgb"`` y 1 en
    ``"gray"``. Error educativo en español si la lectura falla.
    """
    try:
        with image_module.open(path) as image:
            convertida = image.convert("RGB" if color_mode == "rgb" else "L")
            redimensionada = convertida.resize((width, height))
            tamano = redimensionada.size
            datos = redimensionada.tobytes()
        canales = 3 if color_mode == "rgb" else 1
    except Exception as error:
        raise Exception(
            f"kaggle: no se pudo leer la imagen '{os.path.basename(path)}': {error}"
        ) from error
    if tamano != (width, height):
        raise Exception(
            f"kaggle: la imagen '{os.path.basename(path)}' tiene tamaño "
            f"{tamano}; se esperaba {(width, height)}."
        )
    if canales == 1:
        return [
            [
                [
                    float(datos[fila * width + columna]) / 255.0
                    for columna in range(width)
                ]
                for fila in range(height)
            ]
        ]
    return [
        [
            [
                float(datos[(fila * width + columna) * 3 + canal]) / 255.0
                for columna in range(width)
            ]
            for fila in range(height)
        ]
        for canal in range(canales)
    ]


def _detect_label_columns(fieldnames):
    """Detecta las columnas de id y de etiqueta del CSV de etiquetas.

    La columna id se busca entre ``id/filename/image/file/img`` y la de
    etiqueta entre ``label/class/category/clase/etiqueta`` (sin distinguir
    mayúsculas). Devuelve ``(columna_id, columna_etiqueta)`` con los nombres
    reales del encabezado; error educativo si no se detectan.
    """
    if not fieldnames:
        raise Exception("kaggle: El archivo de etiquetas no tiene encabezado.")
    campos = {nombre.strip().lower(): nombre for nombre in fieldnames}
    id_columna = None
    for candidato in ("id", "filename", "image", "file", "img"):
        if candidato in campos:
            id_columna = campos[candidato]
            break
    etiqueta_columna = None
    for candidato in ("label", "class", "category", "clase", "etiqueta"):
        if candidato in campos:
            etiqueta_columna = campos[candidato]
            break
    if id_columna is None or etiqueta_columna is None:
        raise Exception(
            "kaggle: no se detectaron las columnas de id y etiqueta en el "
            f"archivo de etiquetas. Encabezado: {list(fieldnames)}. Se "
            "esperaba una columna id ('id', 'filename', 'image', 'file', "
            "'img') y una de etiqueta ('label', 'class', 'category', "
            "'clase', 'etiqueta')."
        )
    return id_columna, etiqueta_columna


def _read_image_labels(labels_path):
    """Lee el CSV de etiquetas y devuelve ``({id: clase}, clases ordenadas)``.

    La clave se normaliza a la CADENA del id sin extensión (``str(...)``),
    de modo que emparejan tanto ids enteros ("1") como nombres con ceros a
    la izquierda ("0001"). Las clases se devuelven ordenadas alfabéticamente.
    """
    with open(labels_path, encoding="utf-8-sig", newline="") as flujo:
        reader = csv.DictReader(flujo)
        id_columna, etiqueta_columna = _detect_label_columns(reader.fieldnames)
        registros = {}
        for fila in reader:
            if fila is None:
                continue
            id_crudo = fila.get(id_columna)
            etiqueta = fila.get(etiqueta_columna)
            if id_crudo is None or etiqueta is None:
                continue
            clave = os.path.splitext(str(id_crudo).strip())[0]
            if clave == "":
                continue
            registros[clave] = str(etiqueta).strip()
    clases = sorted(set(registros.values()))
    return registros, clases


def _encode_labels(records):
    """Codifica etiquetas crudas como enteros ``0..N-1`` (clases ordenadas).

    El orden de las clases es alfabético, de modo que dos ejecuciones sobre
    los mismos datos producen la misma codificación.
    """
    clases = sorted(set(records))
    indices = {clase: indice for indice, clase in enumerate(clases)}
    return [indices[clase] for clase in records]


@check_sig([2, 3, 4, 5], [cadena_t], [cadena_t], [entero_t], [entero_t], [cadena_t])
def load_image(dataset_name, image_path, height=32, width=32, color_mode="rgb"):
    """
    Carga una sola imagen de un dataset de Kaggle como tensor ``[C][H][W]``.

    Abre la imagen indicada por ``image_path`` dentro del dataset, la
    redimensiona a ``height × width`` y devuelve sus píxeles normalizados a
    ``[0,1]`` con layout ``[canal][alto][ancho]`` (CHW), el que esperan las
    capas Conv2D de GESHA.

    Fundamento: la imagen se decodifica (Pillow), se convierte al modo de
    color pedido (``convert("RGB")`` o ``convert("L")``), se reescala a
    ``(width, height)`` y se normaliza cada píxel dividiendo por 255
    (:math:`p/255`), pasando de ``[0,255]`` a ``[0,1]``.

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        image_path (STR): Ruta relativa de la imagen dentro del dataset
            (p. ej. "train/12.png"). Si no existe como ruta exacta, se
            resuelve por nombre de archivo; si hay homónimos, se lanza un
            error de ambigüedad que los lista.
        height (INT, opcional): Alto de salida en píxeles (default 32).
        width (INT, opcional): Ancho de salida en píxeles (default 32).
        color_mode (STR, opcional): "rgb" (3 canales) o "gray"/"grayscale"
            (1 canal). Default "rgb".

    Retorna:
        List[List[List[FLOAT]]] con forma ``[canales][alto][ancho]`` en
        ``[0,1]``.

    Ejemplo KAFE:
        import kaggle;
        List[List[List[FLOAT]]] img = kaggle.load_image("dueno/conjunto", "train/12.png", 32, 32, "rgb");

    Nota: Requiere conexión a internet, `kagglehub` y las dependencias
    opcionales `Pillow`/`py7zr` (se instalan automáticamente bajo demanda).
    """
    _validate_dataset_name(dataset_name)
    if not image_path or not str(image_path).strip():
        raise Exception(
            "kaggle: 'image_path' no puede estar vacío; indica la ruta "
            "relativa de una imagen dentro del dataset."
        )
    color_mode = _normalize_color_mode(color_mode)
    height = _normalize_dimension(height, "height")
    width = _normalize_dimension(width, "width")

    image_module, py7zr_module = _require_image_dependencies()
    _require_kagglehub()
    root = _download_dataset(dataset_name.strip())
    _ensure_images_extracted(root, py7zr_module)
    imagenes = _find_images(root)
    elegida = _resolve_member(imagenes, str(image_path).strip(), "la imagen")
    return _load_image_array(
        os.path.join(root, *elegida.split("/")),
        height,
        width,
        color_mode,
        image_module,
    )


@check_sig([1, 2, 3, 4, 5], [cadena_t], [entero_t], [entero_t], [cadena_t], [entero_t])
def load_images(dataset_name, height=32, width=32, color_mode="rgb", limit=0):
    """
    Carga todas las imágenes de un dataset de Kaggle como lista de tensores.

    Descubre recursivamente las imágenes ``.png/.jpg/.jpeg/.bmp`` del
    dataset (ignorando ``__MACOSX`` y archivos ocultos), las ordena por
    ruta relativa para un resultado determinista y devuelve cada una como
    ``[C][H][W]`` con píxeles en ``[0,1]``.

    Fundamento: cada imagen se decodifica, se convierte al modo de color,
    se reescala a ``(width, height)`` y se normaliza (:math:`p/255`), igual
    que en ``load_image``.

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        height (INT, opcional): Alto de salida (default 32).
        width (INT, opcional): Ancho de salida (default 32).
        color_mode (STR, opcional): "rgb" o "gray"/"grayscale" (default "rgb").
        limit (INT, opcional): Máximo de imágenes a cargar; 0 = todas.

    Retorna:
        List[List[List[List[FLOAT]]]] con una imagen ``[C][H][W]`` por
        elemento, en orden determinista.

    Ejemplo KAFE:
        import kaggle;
        List[List[List[List[FLOAT]]]] imgs = kaggle.load_images("dueno/conjunto", 32, 32, "rgb", 100);

    Nota: Requiere conexión a internet y las dependencias opcionales
    `Pillow`/`py7zr` (auto-instaladas). Materializa en memoria
    O(N·C·H·W); usa `limit` en conjuntos grandes.
    """
    _validate_dataset_name(dataset_name)
    color_mode = _normalize_color_mode(color_mode)
    height = _normalize_dimension(height, "height")
    width = _normalize_dimension(width, "width")
    if limit < 0:
        raise Exception(
            f"kaggle: 'limit' debe ser mayor o igual que 0; se recibió {limit}."
        )

    image_module, py7zr_module = _require_image_dependencies()
    _require_kagglehub()
    root = _download_dataset(dataset_name.strip())
    _ensure_images_extracted(root, py7zr_module)
    imagenes = _find_images(root)
    if limit > 0:
        imagenes = imagenes[:limit]
    return [
        _load_image_array(
            os.path.join(root, *relativa.split("/")),
            height,
            width,
            color_mode,
            image_module,
        )
        for relativa in imagenes
    ]


@check_sig(
    [2, 3, 4, 5, 6],
    [cadena_t],
    [cadena_t],
    [entero_t],
    [entero_t],
    [cadena_t],
    [entero_t],
)
def load_image_dataset(
    dataset_name, labels_file, height=32, width=32, color_mode="rgb", limit=0
):
    """
    Carga un dataset de imágenes etiquetadas de Kaggle como contenedor ``[X, y]``.

    Descarga el dataset, extrae los archivos comprimidos anidados, lee el CSV
    de etiquetas, empareja cada imagen con su etiqueta por el *stem* del
    nombre de archivo (normalizado a cadena) y devuelve un ``ImageDataset``
    indexable ``[X, y]``: ``X`` son las imágenes ``[C][H][W]`` en ``[0,1]`` y
    ``y`` son las etiquetas codificadas ``0..N-1`` (clases ordenadas
    alfabéticamente), alineadas y en el MISMO orden determinista.

    Fundamento: las etiquetas (texto) se codifican a enteros para poder
    usarse con la pérdida *sparse categorical crossentropy*; el orden
    alfabético de las clases garantiza una codificación reproducible. El
    contenedor no realiza ninguna división train/test: esa responsabilidad
    queda en KafeMACHINE (``machine.stratified_train_test_split``).

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        labels_file (STR): CSV de etiquetas dentro del dataset (columna id:
            id/filename/image/file/img; columna etiqueta:
            label/class/category/clase/etiqueta).
        height (INT, opcional): Alto de salida (default 32).
        width (INT, opcional): Ancho de salida (default 32).
        color_mode (STR, opcional): "rgb" o "gray"/"grayscale" (default "rgb").
        limit (INT, opcional): Máximo de imágenes etiquetadas a cargar; 0 =
            todas. Con ``limit=0`` se exige que cada imagen encontrada tenga
            etiqueta; con ``limit>0`` se cargan las primeras ``limit`` imágenes
            etiquetadas (las imágenes sin etiqueta se ignoran).

    Retorna:
        ImageDataset (tipo KAFE ``MACHINE``): ``datos[0]`` = X (imágenes
        ``[C][H][W]``), ``datos[1]`` = y (List[INT] codificadas).

    Ejemplo KAFE:
        import kaggle;
        MACHINE datos = kaggle.load_image_dataset("dueno/conjunto", "trainLabels.csv", 32, 32, "rgb", 1000);
        List[List[List[List[FLOAT]]]] X = datos[0];
        List[INT] y = datos[1];

    Nota: Requiere conexión a internet y las dependencias opcionales
    `Pillow`/`py7zr` (auto-instaladas). Errores educativos si el archivo de
    etiquetas no existe, si no se detectan sus columnas o si hay desajustes
    entre imágenes y etiquetas.
    """
    _validate_dataset_name(dataset_name)
    if not labels_file or not str(labels_file).strip():
        raise Exception(
            "kaggle: 'labels_file' no puede estar vacío; indica la ruta del "
            "CSV de etiquetas dentro del dataset."
        )
    color_mode = _normalize_color_mode(color_mode)
    height = _normalize_dimension(height, "height")
    width = _normalize_dimension(width, "width")
    if limit < 0:
        raise Exception(
            f"kaggle: 'limit' debe ser mayor o igual que 0; se recibió {limit}."
        )

    image_module, py7zr_module = _require_image_dependencies()
    _require_kagglehub()
    root = _download_dataset(dataset_name.strip())
    _ensure_images_extracted(root, py7zr_module)
    imagenes = _find_images(root)
    etiquetas_elegidas = _resolve_member(
        _list_members(root), str(labels_file).strip(), "el archivo de etiquetas"
    )
    registros, _clases = _read_image_labels(
        os.path.join(root, *etiquetas_elegidas.split("/"))
    )

    rutas = []
    etiquetas_crudas = []
    no_emparejadas = 0
    for relativa in imagenes:
        clave = os.path.splitext(os.path.basename(relativa))[0]
        etiqueta = registros.get(clave)
        if etiqueta is None:
            no_emparejadas += 1
            continue
        rutas.append(relativa)
        etiquetas_crudas.append(etiqueta)
        if limit > 0 and len(rutas) >= limit:
            break

    if not rutas:
        raise Exception(
            f"kaggle: ninguna de las {len(imagenes)} imágenes del dataset "
            f"coincide con las etiquetas de '{labels_file}' "
            f"(emparejadas=0, no emparejadas={no_emparejadas})."
        )
    if limit == 0 and no_emparejadas:
        raise Exception(
            f"kaggle: hay imágenes sin etiqueta en '{labels_file}' "
            f"(emparejadas={len(rutas)}, no emparejadas={no_emparejadas}). "
            "Usa 'limit' para cargar sólo una muestra o revisa el archivo de "
            "etiquetas."
        )

    X = [
        _load_image_array(
            os.path.join(root, *relativa.split("/")),
            height,
            width,
            color_mode,
            image_module,
        )
        for relativa in rutas
    ]
    y = _encode_labels(etiquetas_crudas)

    from lib.KafeKaggle.dataset import ImageDataset

    return ImageDataset(X, y)


@check_sig(
    [1, 2, 3, 4, 5, 6],
    [cadena_t],
    [entero_t],
    [entero_t],
    [cadena_t],
    [entero_t],
    [cadena_t],
)
def load_image_folder_dataset(
    dataset_name, height=32, width=32, color_mode="rgb", limit=0, split="train"
):
    """
    Carga un dataset de Kaggle con etiquetas derivadas de las carpetas.

    Pensada para datasets organizados en el layout canónico de clasificación
    de imágenes, donde la clase es el nombre de la carpeta que contiene cada
    imagen (``.../<split>/<clase>/<imagen>.png``). Es el caso de datasets
    como CIFAR-10, que no incluyen un CSV de etiquetas: la etiqueta vive en
    el nombre del directorio padre.

    Fundamento: la etiqueta de cada imagen es el nombre del directorio
    inmediatamente padre; ``split`` filtra por un subdirectorio ancestro
    (por ejemplo ``"train"``) y, si está vacío, se usan todas las imágenes.
    Las etiquetas de texto se codifican a enteros ``0..N-1`` en orden
    alfabético para que la codificación sea reproducible y compatible con
    *sparse categorical crossentropy*. Cuando ``limit > 0`` se aplica un
    muestreo aleatorio determinista (semilla fija) ANTES de decodificar, de
    modo que la muestra contenga varias clases (sin él, tomar las primeras
    rutas ordenadas daría una sola clase).

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        height (INT, opcional): Alto de salida (default 32).
        width (INT, opcional): Ancho de salida (default 32).
        color_mode (STR, opcional): "rgb" o "gray"/"grayscale" (default "rgb").
        limit (INT, opcional): Máximo de imágenes a cargar; 0 = todas.
        split (STR, opcional): Subdirectorio ancestro a usar ("train", "test",
            …); "" o None = todas las imágenes.

    Retorna:
        ImageDataset (tipo KAFE ``MACHINE``): ``datos[0]`` = X (imágenes
        ``[C][H][W]``), ``datos[1]`` = y (List[INT] codificadas).

    Ejemplo KAFE:
        import kaggle;
        MACHINE datos = kaggle.load_image_folder_dataset("ayush1220/cifar10", 32, 32, "rgb", 4000, "train");
        List[List[List[List[FLOAT]]]] X = datos[0];
        List[INT] y = datos[1];

    Nota: Requiere conexión a internet y las dependencias opcionales
    `Pillow`/`py7zr` (auto-instaladas). Materializa en memoria O(N·C·H·W);
    usa `limit` en conjuntos grandes.
    """
    _validate_dataset_name(dataset_name)
    color_mode = _normalize_color_mode(color_mode)
    height = _normalize_dimension(height, "height")
    width = _normalize_dimension(width, "width")
    if limit < 0:
        raise Exception(
            f"kaggle: 'limit' debe ser mayor o igual que 0; se recibió {limit}."
        )
    split = "" if split is None else str(split).strip()

    image_module, py7zr_module = _require_image_dependencies()
    _require_kagglehub()
    root = _download_dataset(dataset_name.strip())
    _ensure_images_extracted(root, py7zr_module)
    imagenes = _find_images(root)

    seleccionadas = []
    for relativa in imagenes:
        partes = relativa.split("/")
        if len(partes) < 2:
            continue
        etiqueta = partes[-2]
        if split and split not in partes[:-1]:
            continue
        seleccionadas.append((relativa, etiqueta))

    if not seleccionadas:
        raise Exception(
            "kaggle: no se encontraron imágenes etiquetadas por carpeta en "
            f"'{dataset_name}' (split='{split}'). Revisa la estructura del "
            "dataset."
        )

    if limit > 0 and len(seleccionadas) > limit:
        random.Random(42).shuffle(seleccionadas)
        seleccionadas = seleccionadas[:limit]

    rutas = [relativa for relativa, _ in seleccionadas]
    etiquetas = [etiqueta for _, etiqueta in seleccionadas]

    X = [
        _load_image_array(
            os.path.join(root, *relativa.split("/")),
            height,
            width,
            color_mode,
            image_module,
        )
        for relativa in rutas
    ]
    y = _encode_labels(etiquetas)

    from lib.KafeKaggle.dataset import ImageDataset

    return ImageDataset(X, y)


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


@check_sig(
    [1, 2, 3, 4, 5, 6],
    [cadena_t],
    [cadena_t],
    [cadena_t],
    [entero_t],
    [entero_t],
    [entero_t],
)
def load_text_dataset(
    dataset_name, file_name="", delimiter="\t", text_column=0, label_column=1, limit=0
):
    """
    Descarga un dataset de Kaggle con texto etiquetado y lo retorna como DataFrame.

    Pensada para datasets de clasificación de texto en los que cada fila es
    un registro ``texto<TAB>etiqueta`` (o separado por cualquier otro
    carácter) **sin encabezado**: a diferencia de ``load_dataset``, aquí
    TODAS las filas son datos, porque los archivos de texto etiquetado
    (p. ej. los de la colección *sentiment labelled sentences*) no traen
    cabecera.

    Internamente, la función:
    1. Valida nombre, delimitador, columnas y límite ANTES de tocar la red.
    2. Descarga el dataset con kagglehub (cacheado en ~/.cache/kagglehub).
    3. Selecciona el archivo de texto (``.txt``, ``.tsv`` o ``.csv``): el
       indicado en ``file_name`` con prioridad; si está vacío, el único
       archivo de texto del dataset.
    4. Lee las filas con la librería estándar `csv` y valida que cada fila
       tenga ambas columnas y que la etiqueta sea un entero.
    5. Construye un DataFrame de PARDOS con las columnas ``text`` (STR) y
       ``label`` (INT), tipadas de forma explícita (sin inferencia) para
       que ``df.col("text")`` siempre retorne List[STR] y
       ``df.col("label")`` siempre List[INT].

    Argumentos:
        dataset_name (STR): Identificador 'dueno/conjunto' del dataset.
        file_name (STR, opcional): Archivo dentro del dataset ("data.txt").
            Si está vacío, se lee el único archivo .txt/.tsv/.csv.
        delimiter (STR, opcional): Un solo carácter separador; default "\\t"
            (TAB), el formato de los datasets de frases etiquetadas.
        text_column (INT, opcional): Índice de la columna de texto (default 0).
        label_column (INT, opcional): Índice de la columna de etiqueta
            entera, p. ej. 0/1 (default 1).
        limit (INT, opcional): Máximo de filas a cargar; 0 = todas.

    Retorna:
        PARDOS DataFrame con las columnas ``text`` (STR) y ``label`` (INT).

    Ejemplo KAFE:
        import kaggle;
        PARDOS df = kaggle.load_text_dataset("marklvl/sentiment-labelled-sentences-data-set", "sentiment labelled sentences/yelp_labelled.txt");
        List[STR] textos = df.col("text");
        List[INT] etiquetas = df.col("label");

    Nota: Requiere conexión a internet y la librería `kagglehub` (se instala
    automáticamente bajo demanda). Los datasets públicos no necesitan
    credenciales y las descargas quedan cacheadas. El archivo completo se
    carga en memoria; usa `limit` en conjuntos grandes.
    """
    _validate_dataset_name(dataset_name)
    if len(delimiter) != 1:
        raise Exception(
            "kaggle: 'delimiter' debe ser un solo carácter (p. ej. \"\\t\" o "
            f'","); se recibió {delimiter!r}.'
        )
    if text_column < 0 or label_column < 0:
        raise Exception(
            "kaggle: 'text_column' y 'label_column' deben ser mayores o "
            f"iguales que 0; se recibieron text_column={text_column}, "
            f"label_column={label_column}."
        )
    if limit < 0:
        raise Exception(
            f"kaggle: 'limit' debe ser mayor o igual que 0; se recibió {limit}."
        )

    _require_kagglehub()
    ruta = _download_dataset(dataset_name.strip())
    filas = _extract_text_table(
        ruta, file_name.strip(), delimiter, text_column, label_column, dataset_name
    )

    textos = [fila[text_column] for fila in filas]
    etiquetas = [int(fila[label_column]) for fila in filas]
    if limit > 0:
        textos = textos[:limit]
        etiquetas = etiquetas[:limit]

    from lib.KafePARDOS.DataFrame import DataFrame

    return DataFrame(
        ["text", "label"],
        [[texto, etiqueta] for texto, etiqueta in zip(textos, etiquetas, strict=False)],
    )


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
        primera = dict(zip(columnas_disponibles, filas[0], strict=False))
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
        valores = dict(zip(columnas_disponibles, fila, strict=False))
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
