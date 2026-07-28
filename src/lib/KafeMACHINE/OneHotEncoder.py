from global_utils import check_sig
from TypeUtils import pardos_t, lista_cadenas_t
from lib.KafePARDOS.DataFrame import DataFrame
from .BaseMachine import BaseMachine


class OneHotEncoder(BaseMachine):
    def __init__(self):
        super().__init__()
        self.categories_ = {}
        self.columns_ = []

    @check_sig([3], [pardos_t], [lista_cadenas_t], is_method=True)
    def fit(self, df, columns):
        self.columns_ = columns
        self.categories_ = {}

        for col in columns:
            if col not in df.columns:
                raise Exception(f"OneHotEncoder: Column '{col}' not found in DataFrame")

            col_data = df.col(col)
            unique_cats = sorted(list(set(str(v) for v in col_data if v is not None)))
            self.categories_[col] = unique_cats

        self._is_fitted = True
        return self

    @check_sig([2], [pardos_t], is_method=True)
    def transform(self, df):
        self._check_fitted("transform")

        new_columns = []
        for col in df.columns:
            if col not in self.columns_:
                new_columns.append(col)

        for col in self.columns_:
            for cat in self.categories_[col]:
                new_columns.append(f"{col}_{cat}")

        new_data = []
        for i in range(len(df.data)):
            row = df.data[i]
            new_row = []

            for j, col_name in enumerate(df.columns):
                if col_name not in self.columns_:
                    new_row.append(row[j])

            for col_name in self.columns_:
                col_idx = df.columns.index(col_name)
                val = str(row[col_idx])
                for cat in self.categories_[col_name]:
                    new_row.append(1 if val == cat else 0)

            new_data.append(new_row)

        return DataFrame(new_columns, new_data)

    def fit_transform(self, df, columns):
        return self.fit(df, columns).transform(df)

    def inverse_transform(self, df):
        self._check_fitted("inverse_transform")

        original_columns = [c for c in df.columns if c not in self.columns_]
        for col in self.columns_:
            original_columns.append(col)

        new_data = []
        for row_idx in range(len(df.data)):
            row = df.data[row_idx]
            new_row = []
            col_idx = 0

            while col_idx < len(df.columns):
                col_name = df.columns[col_idx]
                if col_name not in self.columns_:
                    new_row.append(row[col_idx])
                    col_idx += 1
                elif col_name in self.categories_:
                    cats = self.categories_[col_name]
                    binary_vals = [row[col_idx + k] for k in range(len(cats))]
                    decoded = cats[binary_vals.index(1)] if 1 in binary_vals else cats[0]
                    new_row.append(decoded)
                    col_idx += len(cats)
                else:
                    col_idx += 1

            new_data.append(new_row)

        return DataFrame(original_columns, new_data)

    def __repr__(self):
        return f"OneHotEncoder(encoded_columns={self.columns_})"
