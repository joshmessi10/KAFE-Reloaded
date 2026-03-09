import lib.KafeMATH.funciones as math
import json
import os
from global_utils import check_sig
from TypeUtils import (
    pardos_t,
    lista_cadenas_t,
    matriz_cualquiera_t,
    entero_t,
    cadena_t,
    flotante_t,
)


class DataFrame:
    @check_sig([3], [pardos_t], [lista_cadenas_t], [matriz_cualquiera_t])
    def __init__(self, columns, data):
        for row in data:
            if len(row) != len(columns):
                raise Exception(f"Inconsistent dimensions")

        self.columns = columns
        self.data = data

    def __repr__(self):
        contenido = f"cols: {self.columns}, rows: {self.data}"
        return repr(contenido)

    @check_sig([1, 2], [pardos_t], [entero_t])
    def head(self, *args):
        n = 5
        if len(args) == 1:
            n = args[0]

        return DataFrame(self.columns, self.data[:n])

    @check_sig([1, 2], [pardos_t], [entero_t])
    def tail(self, *args):
        n = 5
        if len(args) == 1:
            n = args[0]

        if n <= len(self.data):
            return DataFrame(self.columns, self.data[-n:])
        else:
            return DataFrame(self.columns, self.data[:])

    @check_sig([1], [pardos_t])
    def shape(self):
        n_filas = len(self.data)
        n_cols = len(self.columns)
        return [n_filas, n_cols]

    @check_sig([2], [pardos_t], [cadena_t])
    def col(self, column_name):
        if column_name not in self.columns:
            raise Exception(f"Column '{column_name}' doesn't exist")
        idx = self.columns.index(column_name)

        raw = [row[idx] for row in self.data]

        dtypes_rows = self.dtypes()

        tipo_col = None
        for col, tipo in dtypes_rows:
            if col == column_name:
                tipo_col = tipo
                break

        result_rows = []
        if tipo_col == cadena_t:
            for v in raw:
                if isinstance(v, float) and math.isnan(v):
                    result_rows.append("")
                else:
                    result_rows.append(str(v))

        elif tipo_col == entero_t:
            for v in raw:
                result_rows.append(int(v))

        elif tipo_col == flotante_t:
            for v in raw:
                if isinstance(v, float) and math.isnan(v):
                    result_rows.append(float("nan"))
                else:
                    result_rows.append(float(v))
        else:
            for v in raw:
                result_rows.append(str(v))

        return result_rows

    @check_sig([1], [pardos_t])
    def dtypes(self):
        filas = []
        for j, col_name in enumerate(self.columns):
            vals = [
                row[j]
                for row in self.data
                if not (isinstance(row[j], float) and math.isnan(row[j]))
                and row[j] is not None
            ]
            tipo_col = cadena_t
            if len(vals) > 0 and all(isinstance(v, int) for v in vals):
                tipo_col = entero_t
            elif len(vals) > 0 and all(isinstance(v, (int, float)) for v in vals):
                tipo_col = flotante_t
            filas.append([col_name, tipo_col])

        return filas

    @check_sig([1], [pardos_t])
    def info(self):
        n_filas = len(self.data)
        n_cols = len(self.columns)

        cols_str = ", ".join(self.columns)
        dtypes_rows = self.dtypes()
        dtypes_str = ", ".join(f"{c}:{t}" for c, t in dtypes_rows)

        filas = [
            ["Rows", n_filas],
            ["Columns", n_cols],
            ["Column_Names", cols_str],
            ["Dtypes", dtypes_str],
        ]
        return f"{filas}"

    @check_sig([1], [pardos_t])
    def describe(self):
        cols = ["column", "count", "mean", "std", "min", "max"]
        filas = []

        tipo_df = self.dtypes()
        for i, tipo in enumerate(tipo_df):
            col_name = self.columns[i]
            if tipo[1] in (entero_t, flotante_t):
                idx = self.columns.index(col_name)
                nums = [
                    row[idx]
                    for row in self.data
                    if isinstance(row[idx], (int, float))
                    and not (isinstance(row[idx], float) and math.isnan(row[idx]))
                ]
                if not nums:
                    continue
                count = len(nums)
                mean = sum(nums) / count
                var = sum((x - mean) ** 2 for x in nums) / count
                std = var**0.5
                min_val = min(nums)
                max_val = max(nums)
                filas.append(
                    [
                        col_name,
                        str(count),
                        str(mean),
                        str(std),
                        str(min_val),
                        str(max_val),
                    ]
                )

        return DataFrame(cols, filas)

    @check_sig([2], [pardos_t], [cadena_t])
    def to_csv(self, path):
        """
        Export DataFrame to CSV file.
        """
        import globals

        # Resolve path relative to current directory
        if os.path.isabs(path):
            real_path = path
        else:
            real_path = os.path.join(globals.current_dir, path)

        with open(real_path, "w", encoding="utf-8") as f:
            # Write header
            f.write(",".join(self.columns) + "\n")

            # Write data rows
            for row in self.data:
                row_str = []
                for val in row:
                    if isinstance(val, float) and math.isnan(val):
                        row_str.append("")
                    else:
                        row_str.append(str(val))
                f.write(",".join(row_str) + "\n")

    @check_sig([2], [pardos_t], [cadena_t])
    def to_json(self, path):
        """
        Export DataFrame to JSON file in 'records' orient.
        Format: [{"col1": val1, "col2": val2}, ...]
        """
        import globals

        # Resolve path relative to current directory
        if os.path.isabs(path):
            real_path = path
        else:
            real_path = os.path.join(globals.current_dir, path)

        # Build records format
        records = []
        for row in self.data:
            record = {}
            for i, col_name in enumerate(self.columns):
                val = row[i]
                # Handle NaN values
                if isinstance(val, float) and math.isnan(val):
                    record[col_name] = None
                else:
                    record[col_name] = val
            records.append(record)

        with open(real_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)

    @check_sig([3], [pardos_t], [cadena_t], [cadena_t])
    def rename(self, old_name, new_name):
        """
        Rename a column.
        Returns a new DataFrame with the renamed column.
        """
        if old_name not in self.columns:
            raise Exception(f"pardos: Column '{old_name}' doesn't exist")

        if new_name in self.columns:
            raise Exception(f"pardos: Column '{new_name}' already exists")

        # Create new column list with renamed column
        new_columns = [new_name if col == old_name else col for col in self.columns]

        # Return new DataFrame with same data but renamed columns
        return DataFrame(new_columns, self.data)

    @check_sig([2], [pardos_t], [cadena_t])
    def drop(self, column_name):
        """
        Drop a column from the DataFrame.
        Returns a new DataFrame without the specified column.
        """
        if column_name not in self.columns:
            raise Exception(f"pardos: Column '{column_name}' doesn't exist")

        # Find the index of the column to drop
        col_idx = self.columns.index(column_name)

        # Create new column list without the dropped column
        new_columns = [col for col in self.columns if col != column_name]

        # Create new data without the dropped column
        new_data = []
        for row in self.data:
            new_row = [row[i] for i in range(len(row)) if i != col_idx]
            new_data.append(new_row)

        return DataFrame(new_columns, new_data)

    @check_sig([2], [pardos_t], [entero_t, flotante_t, cadena_t])
    def fillna(self, value):
        """
        Fill NaN values with a specified value.
        Returns a new DataFrame with NaN values replaced.
        """
        new_data = []
        for row in self.data:
            new_row = []
            for val in row:
                if isinstance(val, float) and math.isnan(val):
                    new_row.append(value)
                else:
                    new_row.append(val)
            new_data.append(new_row)

        return DataFrame(self.columns, new_data)

    @check_sig([1], [pardos_t])
    def dropna(self):
        """
        Drop rows that contain any NaN values.
        Returns a new DataFrame without rows containing NaN.
        """
        new_data = []
        for row in self.data:
            has_nan = False
            for val in row:
                if isinstance(val, float) and math.isnan(val):
                    has_nan = True
                    break
            if not has_nan:
                new_data.append(row)

        return DataFrame(self.columns, new_data)

    @check_sig([1], [pardos_t])
    def ffill(self):
        """
        Forward fill - propagate last valid observation forward to fill NaN values.
        Fills down each column (row-wise propagation).
        Returns a new DataFrame with NaN values filled using forward fill.
        """
        new_data = []

        # Process column by column
        for col_idx in range(len(self.columns)):
            last_valid = None
            for row_idx in range(len(self.data)):
                val = self.data[row_idx][col_idx]
                if isinstance(val, float) and math.isnan(val):
                    # Use last valid value if available
                    if last_valid is not None:
                        if row_idx >= len(new_data):
                            new_data.append([None] * len(self.columns))
                        new_data[row_idx][col_idx] = last_valid
                    else:
                        # Keep NaN if no previous valid value
                        if row_idx >= len(new_data):
                            new_data.append([None] * len(self.columns))
                        new_data[row_idx][col_idx] = val
                else:
                    if row_idx >= len(new_data):
                        new_data.append([None] * len(self.columns))
                    new_data[row_idx][col_idx] = val
                    last_valid = val

        return DataFrame(self.columns, new_data)

    @check_sig([1], [pardos_t])
    def bfill(self):
        """
        Backward fill - propagate next valid observation backward to fill NaN values.
        Fills up each column (reverse row-wise propagation).
        Returns a new DataFrame with NaN values filled using backward fill.
        """
        # Initialize new_data with same structure
        new_data = [[None] * len(self.columns) for _ in range(len(self.data))]

        # Process column by column
        for col_idx in range(len(self.columns)):
            next_valid = None
            # Iterate backwards through rows
            for row_idx in range(len(self.data) - 1, -1, -1):
                val = self.data[row_idx][col_idx]
                if isinstance(val, float) and math.isnan(val):
                    # Use next valid value if available
                    if next_valid is not None:
                        new_data[row_idx][col_idx] = next_valid
                    else:
                        # Keep NaN if no next valid value
                        new_data[row_idx][col_idx] = val
                else:
                    new_data[row_idx][col_idx] = val
                    next_valid = val

        return DataFrame(self.columns, new_data)
