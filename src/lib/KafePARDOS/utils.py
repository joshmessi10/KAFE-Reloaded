def inferir_tipo(celda):
    if celda is None:
        return None
    if isinstance(celda, bool):
        return celda
    if isinstance(celda, (int, float)):
        return celda
    if celda == "":
        return float("nan")
    try:
        return int(celda)
    except ValueError:
        try:
            return float(celda)
        except ValueError:
            return celda
