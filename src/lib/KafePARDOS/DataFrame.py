import lib.KafeMATH.funciones as math
from global_utils import check_sig
from TypeUtils import (
    pardos_t,
    lista_cadenas_t,
    matriz_cualquiera_t,
    entero_t,
    cadena_t,
    flotante_t,
    booleano_t,
)

# Alias built-in sum to avoid shadowing by DataFrame.sum method
builtins_sum = sum


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
    def value_counts(self, column_name):
        """Count occurrences of each unique value in a column."""
        if column_name not in self.columns:
            raise Exception(f"Column '{column_name}' doesn't exist")
        idx = self.columns.index(column_name)
        counts = {}
        for row in self.data:
            val = row[idx]
            if isinstance(val, float) and math.isnan(val):
                continue
            key = str(val) if not isinstance(val, (int, float, str, bool)) else val
            counts[key] = counts.get(key, 0) + 1
        # Sort by count descending (same default as pandas)
        sorted_items = sorted(counts.items(), key=lambda x: -x[1])
        result_cols = ["value", "count"]
        result_rows = [[str(k), v] for k, v in sorted_items]
        return DataFrame(result_cols, result_rows)

    @check_sig([2], [pardos_t], [cadena_t])
    def mean(self, column_name):
        """Calculate the arithmetic mean of a numeric column."""
        if column_name not in self.columns:
            raise Exception(f"Column '{column_name}' doesn't exist")
        idx = self.columns.index(column_name)
        nums = [
            row[idx]
            for row in self.data
            if isinstance(row[idx], (int, float))
            and not (isinstance(row[idx], float) and math.isnan(row[idx]))
        ]
        if not nums:
            raise Exception(f"Column '{column_name}' has no numeric values")
        return builtins_sum(nums) / len(nums)

    @check_sig([2], [pardos_t], [cadena_t])
    def sum(self, column_name):
        """Calculate the sum of a numeric column."""
        if column_name not in self.columns:
            raise Exception(f"Column '{column_name}' doesn't exist")
        idx = self.columns.index(column_name)
        nums = [
            row[idx]
            for row in self.data
            if isinstance(row[idx], (int, float))
            and not (isinstance(row[idx], float) and math.isnan(row[idx]))
        ]
        if not nums:
            raise Exception(f"Column '{column_name}' has no numeric values")
        return builtins_sum(nums)

    @check_sig([3], [pardos_t], [cadena_t], [cadena_t])
    def agg(self, column_name, func_name):
        """Apply a single aggregation function to a column.
        
        Supported functions: 'sum', 'mean', 'min', 'max', 'count'
        """
        if column_name not in self.columns:
            raise Exception(f"Column '{column_name}' doesn't exist")
        idx = self.columns.index(column_name)
        nums = [
            row[idx]
            for row in self.data
            if isinstance(row[idx], (int, float))
            and not (isinstance(row[idx], float) and math.isnan(row[idx]))
        ]
        supported = ["sum", "mean", "min", "max", "count"]
        if func_name not in supported:
            raise Exception(
                f"Unsupported aggregation '{func_name}'. "
                f"Supported: {supported}"
            )
        if func_name == "count":
            return len(nums)
        if not nums:
            raise Exception(f"Column '{column_name}' has no numeric values")
        if func_name == "sum":
            return builtins_sum(nums)
        elif func_name == "mean":
            return builtins_sum(nums) / len(nums)
        elif func_name == "min":
            return min(nums)
        elif func_name == "max":
            return max(nums)

    @check_sig([1, 2], [pardos_t], [entero_t])
    def round(self, *args):
        """Round all floating-point numbers in the DataFrame to n decimal places."""
        decimals = 4
        if len(args) == 1:
            decimals = args[0]
        
        rounded_data = []
        for row in self.data:
            new_row = []
            for val in row:
                if isinstance(val, float) and not math.isnan(val):
                    new_row.append(math.math_round(val, decimals))
                else:
                    new_row.append(val)
            rounded_data.append(new_row)
        return DataFrame(self.columns, rounded_data)

    @check_sig([2], [pardos_t], [cadena_t])
    def query(self, query_str):
        import globals
        visitor = globals.current_visitor
        if visitor is None:
            raise Exception("Pardos: No active interpreter visitor found")

        # Lazy import to avoid crashes if antlr4 is missing in some environments
        try:
            from antlr4 import InputStream, CommonTokenStream
            from Kafe_GrammarLexer import Kafe_GrammarLexer
            from Kafe_GrammarParser import Kafe_GrammarParser
        except ImportError:
            raise Exception("Pardos: antlr4-python3-runtime is not installed")

        # Parse the query string as an expression
        input_stream = InputStream(query_str)
        lexer = Kafe_GrammarLexer(input_stream)
        stream = CommonTokenStream(lexer)
        parser = Kafe_GrammarParser(stream)

        # Use a flag-based error listener — BailErrorStrategy doesn't always work
        # as expected when exceptions are swallowed inside ANTLR's error recovery
        from antlr4.error.ErrorListener import ErrorListener
        class QueryErrorListener(ErrorListener):
            def __init__(self):
                super().__init__()
                self.errors = []
            def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
                self.errors.append(f"Syntax error in query: {msg}")

        error_listener = QueryErrorListener()
        parser.removeErrorListeners()
        parser.addErrorListener(error_listener)

        tree = parser.expr()

        # Now check if there were any errors recorded
        if error_listener.errors:
            raise Exception(error_listener.errors[0])

        filtered_data = []

        for row in self.data:
            # Push a temporary scope with row values
            visitor.push_scope()
            try:
                for i, col_name in enumerate(self.columns):
                    val = row[i]
                    if isinstance(val, bool):
                        tipo = booleano_t
                    elif isinstance(val, int):
                        tipo = entero_t
                    elif isinstance(val, float):
                        tipo = flotante_t
                    else:
                        tipo = cadena_t
                    
                    from global_utils import asignar_variable
                    asignar_variable(visitor, col_name, val, tipo)
                
                # Evaluate expression
                result = visitor.visit(tree)
                if result is True:
                    filtered_data.append(row)
            finally:
                # Always pop scope
                visitor.pop_scope()

        return DataFrame(self.columns, filtered_data)
