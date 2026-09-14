import os
import json
from errores import raiseFileNotFound
from global_utils import check_sig
from .utils import inferir_tipo
from .DataFrame import DataFrame
from TypeUtils import cadena_t, pardos_t, lista_cualquiera_t


@check_sig([1], [cadena_t])
def read_csv(path):
    import globals

    if os.path.isfile(path):
        real_path = path
    else:
        candidate = os.path.join(globals.current_dir, path)
        if os.path.isfile(candidate):
            real_path = candidate
        else:
            raiseFileNotFound(path, globals.current_dir)

    with open(real_path, encoding="utf-8") as f:
        lineas = [l.rstrip("\r\n") for l in f]
    while lineas and lineas[-1] == "":
        lineas.pop()
    if len(lineas) == 0:
        return DataFrame([], [])

    header_line = lineas[0]
    semicolons = sum(l.count(";") for l in lineas)
    commas = sum(l.count(",") for l in lineas)
    delim = ";" if semicolons >= commas else ","

    header = [h.strip() for h in header_line.split(delim)]
    data = []
    for fila in lineas[1:]:
        partes = [c.strip() for c in fila.split(delim)]
        if len(partes) < len(header):
            partes += [""] * (len(header) - len(partes))
        fila_convertida = [inferir_tipo(c) for c in partes[: len(header)]]
        data.append(fila_convertida)

    return DataFrame(header, data)


@check_sig([1], [cadena_t])
def read_json(path):
    """
    Read JSON file and return a DataFrame.
    Supports 'records' orient: [{"col1": val1, "col2": val2}, ...]
    """
    import globals

    if os.path.isfile(path):
        real_path = path
    else:
        candidate = os.path.join(globals.current_dir, path)
        if os.path.isfile(candidate):
            real_path = candidate
        else:
            raiseFileNotFound(path, globals.current_dir)

    with open(real_path, encoding="utf-8") as f:
        json_data = json.load(f)

    # Handle empty data
    if not json_data:
        return DataFrame([], [])

    # Support records format: list of dicts
    if isinstance(json_data, list) and len(json_data) > 0:
        if isinstance(json_data[0], dict):
            # Extract column names from first record
            columns = list(json_data[0].keys())
            data = []
            for record in json_data:
                row = [inferir_tipo(record.get(col, "")) for col in columns]
                data.append(row)
            return DataFrame(columns, data)

    raise Exception(
        "pardos: read_json: Unsupported JSON format. Expected list of records."
    )
@check_sig([2], [pardos_t], [pardos_t])
def concat(df1, df2):
    return df1.concat(df2)


@check_sig([3, 4], [pardos_t], [pardos_t], [cadena_t], [cadena_t])
def merge(df1, df2, on, how='inner'):
    return df1.merge(df2, on, how)


@check_sig([1], [pardos_t])
def to_matrix(df):
    """
    Convierte un DataFrame de PARDOS a una matriz (lista de listas de floats).
    Solo se incluyen columnas numéricas (entero y flotante).
    """
    from TypeUtils import entero_t, flotante_t
    dtypes = df.dtypes()
    numeric_indices = []
    for i, (col_name, tipo) in enumerate(dtypes):
        if tipo in (entero_t, flotante_t):
            numeric_indices.append(i)

    if not numeric_indices:
        raise ValueError("pardos: No se encontraron columnas numéricas en el DataFrame")

    matrix = []
    for row in df.data:
        numeric_row = []
        for idx in numeric_indices:
            val = row[idx]
            if isinstance(val, float) and val != val:
                numeric_row.append(0.0)
            else:
                numeric_row.append(float(val))
        matrix.append(numeric_row)

    return matrix


@check_sig([1], lista_cualquiera_t)
def flatten(matriz):
    """
    Convierte una lista anidada (por ejemplo, una matriz) a un arreglo 1D (lista plana).
    """
    def _flatten(nested):
        res = []
        for elem in nested:
            if isinstance(elem, list):
                res.extend(_flatten(elem))
            else:
                res.append(elem)
        return res
    return _flatten(matriz)
