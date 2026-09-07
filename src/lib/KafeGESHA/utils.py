import warnings
from global_utils import check_sig
from TypeUtils import booleano_t, cadena_t, flotante_t, entero_t, void_t, pardos_t

@check_sig([2], [booleano_t], [cadena_t])
def warn_if(condición, mensaje):
    if condición:
        warnings.warn(mensaje, stacklevel=2)

@check_sig([1], [flotante_t, entero_t, cadena_t, void_t])
def check_regularization(value):
    if value is None:
        return 0.0
    try:
        val = float(value)
    except (ValueError, TypeError):
        raise ValueError("El parámetro de regularización debe ser numérico o None.")
    if val < 0:
        raise ValueError("El parámetro de regularización no puede ser negativo.")
    return val


@check_sig([1], [pardos_t])
def df_to_matrix(df):
    """
    Convierte un DataFrame de PARDOS a una lista de listas de floats.
    Solo se incluyen columnas numéricas (entero y flotante).
    """
    dtypes = df.dtypes()
    numeric_indices = []
    for i, (col_name, tipo) in enumerate(dtypes):
        if tipo in (entero_t, flotante_t):
            numeric_indices.append(i)

    if not numeric_indices:
        raise ValueError("geshaDeep: No se encontraron columnas numéricas en el DataFrame")

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
