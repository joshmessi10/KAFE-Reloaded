"""
KafeHF — Librería para cargar datasets desde Hugging Face Hub.

Hugging Face (https://huggingface.co) es la plataforma líder para compartir
y descargar datasets, modelos y espacios de trabajo de Machine Learning.

Esta librería permite a los usuarios de KAFE acceder a miles de datasets
públicos directamente desde sus programas, de forma similar a:

    Python:
        from datasets import load_dataset
        dataset = load_dataset("squad")

    KAFE:
        import huggingface;
        PARDOS df = huggingface.load_dataset("squad");

Dependencia externa opcional: datasets (Hugging Face).
    uv sync --locked --extra huggingface
"""

from global_utils import check_sig
from TypeUtils import cadena_t

try:
    from datasets import load_dataset as hf_load_dataset
    _HF_AVAILABLE = True
except ImportError:
    _HF_AVAILABLE = False


def _require_hf():
    """Verifica que la librería datasets de Hugging Face esté instalada."""
    if not _HF_AVAILABLE:
        raise Exception(
            "To use huggingface, install the optional extra: "
            "uv sync --locked --extra huggingface"
        )


@check_sig([1], [cadena_t])
def load_dataset(dataset_name):
    """
    Carga un dataset desde Hugging Face Hub y lo retorna como un DataFrame de PARDOS.

    Un dataset de Hugging Face es una colección de datos estructurados (texto,
    imágenes, audio, etc.) que la comunidad comparte para entrenar y evaluar
    modelos de Machine Learning.

    Internamente, la función:
    1. Descarga el dataset usando la librería `datasets` de Hugging Face.
    2. Extrae el split "train" por defecto (si existe).
    3. Convierte las columnas y filas al formato DataFrame de KafePARDOS.

    Argumentos:
        dataset_name (STR): Nombre del dataset en Hugging Face Hub.
            Ejemplos: "squad", "imdb", "mnli", "daily_dialog".

    Retorna:
        PARDOS DataFrame con los datos cargados.

    Ejemplo KAFE:
        import huggingface;
        PARDOS df = huggingface.load_dataset("squad");
        show(df.head(5));

    Nota: Requiere conexión a internet y la librería `datasets` instalada.
    """
    _require_hf()

    try:
        dataset_dict = hf_load_dataset(dataset_name)
    except Exception as e:
        raise Exception(
            f"huggingface: Error cargando dataset '{dataset_name}': {e}"
        )

    if hasattr(dataset_dict, "keys"):
        splits = list(dataset_dict.keys())
        if len(splits) == 0:
            raise Exception(
                f"huggingface: El dataset '{dataset_name}' no tiene splits."
            )
        split_name = "train" if "train" in splits else splits[0]
        ds = dataset_dict[split_name]
    else:
        ds = dataset_dict

    return _convert_to_pardos(ds, dataset_name)


@check_sig([2], [cadena_t], [cadena_t])
def load_dataset_split(dataset_name, split):
    """
    Carga un split específico de un dataset desde Hugging Face Hub.

    Los splits son particiones del dataset: "train" (entrenamiento),
    "test" (prueba), "validation" (validación). Cada split contiene
    una porción diferente de los datos.

    Argumentos:
        dataset_name (STR): Nombre del dataset en Hugging Face Hub.
        split (STR): Nombre del split a cargar ("train", "test", "validation", etc.).

    Retorna:
        PARDOS DataFrame con los datos del split seleccionado.

    Ejemplo KAFE:
        import huggingface;
        PARDOS test_df = huggingface.load_dataset_split("squad", "test");
        show(test_df.head(5));
    """
    _require_hf()

    try:
        dataset_dict = hf_load_dataset(dataset_name, split=split)
    except Exception as e:
        raise Exception(
            f"huggingface: Error cargando split '{split}' del dataset '{dataset_name}': {e}"
        )

    return _convert_to_pardos(dataset_dict, dataset_name)


def _convert_to_pardos(ds, dataset_name):
    """
    Convierte un dataset de Hugging Face a un DataFrame de PARDOS.

    Los DataFrames de PARDOS tienen la forma:
        DataFrame(columns: List[str], data: List[List[value]])

    Argumentos:
        ds: Dataset de Hugging Face (objeto datasets.Dataset).
        dataset_name (STR): Nombre del dataset (para mensajes de error).

    Retorna:
        DataFrame de PARDOS con los datos convertidos.
    """
    from lib.KafePARDOS.DataFrame import DataFrame

    column_names = list(ds.column_names)

    num_rows = len(ds)

    all_rows = []
    for i in range(num_rows):
        row_dict = ds[i]
        row = [row_dict[col] for col in column_names]

        converted_row = []
        for val in row:
            if isinstance(val, (int, float, str, bool)):
                converted_row.append(val)
            elif val is None:
                converted_row.append("")
            elif isinstance(val, list):
                converted_row.append(str(val))
            elif isinstance(val, dict):
                converted_row.append(str(val))
            else:
                converted_row.append(str(val))
        all_rows.append(converted_row)

    return DataFrame(column_names, all_rows)
