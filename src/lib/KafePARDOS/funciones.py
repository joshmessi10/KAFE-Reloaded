import os
import json
from errores import raiseFileNotFound
from global_utils import check_sig
from .utils import inferir_tipo
from .DataFrame import DataFrame
from TypeUtils import cadena_t, pardos_t


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
        lineas = [l.rstrip("\n") for l in f if l.strip() != ""]
    if len(lineas) == 0:
        return DataFrame([], [])

    header_line = lineas[0]
    if ";" in header_line and header_line.count(";") >= header_line.count(","):
        delim = ";"
    else:
        delim = ","

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
                row = [inferir_tipo(str(record.get(col, ""))) for col in columns]
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
