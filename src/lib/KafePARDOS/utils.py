def infer_type(cell):
    if cell is None:
        return None
    if isinstance(cell, bool):
        return cell
    if isinstance(cell, (int, float)):
        return cell
    if cell == "":
        return float("nan")
    try:
        return int(cell)
    except ValueError:
        try:
            return float(cell)
        except ValueError:
            return cell
