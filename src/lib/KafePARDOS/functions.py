import json
import os

from errors import raiseFileNotFound
from global_utils import check_sig
from TypeUtils import any_list_types, pardos_type, string_type

from .DataFrame import DataFrame
from .utils import infer_type


@check_sig([1], [string_type])
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
        lines = [line.rstrip("\r\n") for line in f]
    while lines and lines[-1] == "":
        lines.pop()
    if len(lines) == 0:
        return DataFrame([], [])

    header_line = lines[0]
    semicolons = sum(line.count(";") for line in lines)
    commas = sum(line.count(",") for line in lines)
    delim = ";" if semicolons >= commas else ","

    header = [h.strip() for h in header_line.split(delim)]
    data = []
    for row in lines[1:]:
        parts = [c.strip() for c in row.split(delim)]
        if len(parts) < len(header):
            parts += [""] * (len(header) - len(parts))
        converted_row = [infer_type(c) for c in parts[: len(header)]]
        data.append(converted_row)

    return DataFrame(header, data)


@check_sig([1], [string_type])
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
                row = [infer_type(record.get(col, "")) for col in columns]
                data.append(row)
            return DataFrame(columns, data)

    raise Exception(
        "pardos: read_json: Unsupported JSON format. Expected list of records."
    )
@check_sig([2], [pardos_type], [pardos_type])
def concat(df1, df2):
    return df1.concat(df2)


@check_sig([3, 4], [pardos_type], [pardos_type], [string_type], [string_type])
def merge(df1, df2, on, how='inner'):
    return df1.merge(df2, on, how)


@check_sig([1], [pardos_type])
def to_matrix(df):
    """
    Converts a PARDOS DataFrame to an array (list of lists of floats).
    Only numeric columns (integer and float) are included.
    """
    from TypeUtils import float_type, integer_type
    dtypes = df.dtypes()
    numeric_indices = []
    for i, (_col_name, type_name) in enumerate(dtypes):
        if type_name in (integer_type, float_type):
            numeric_indices.append(i)

    if not numeric_indices:
        raise ValueError("pardos: No numeric columns were found in the DataFrame")

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


@check_sig([1], [pardos_type])
def df_to_matrix(df):
    """
    Alias ​​of to_matrix in KafePARDOS. Converts a DataFrame to an array.
    """
    return to_matrix(df)



@check_sig([1], any_list_types)
def flatten(matrix):
    """
    Converts a nested list (for example, an array) to a 1D array (flat list).
    """
    def _flatten(nested):
        res = []
        for elem in nested:
            if isinstance(elem, list):
                res.extend(_flatten(elem))
            else:
                res.append(elem)
        return res
    return _flatten(matrix)
