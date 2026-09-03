from global_utils import check_sig
from TypeUtils import pardos_t, lista_cadenas_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class OneHotEncoder(BaseMachine):
    def __init__(self):
        super().__init__()
        self.categories_ = {}
        self.columns_ = []
        self._ohe_column_map_ = {}
        self._original_columns_ = []

    @check_sig([3], [pardos_t], [lista_cadenas_t], is_method=True)
    def fit(self, df, columns):
        self.columns_ = columns
        self.categories_ = {}
        self._ohe_column_map_ = {}
        self._original_columns_ = list(df.columns)

        for col in columns:
            if col not in df.columns:
                raise Exception(f"OneHotEncoder: Column '{col}' not found in DataFrame")

            col_data = df.col(col)
            unique_cats = sorted(list(set(str(v) for v in col_data if v is not None)))
            self.categories_[col] = unique_cats
            self._ohe_column_map_[col] = [f"{col}_{cat}" for cat in unique_cats]

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

        ohe_to_orig = {}
        for orig_col, ohe_cols in self._ohe_column_map_.items():
            for ohe_col in ohe_cols:
                ohe_to_orig[ohe_col] = orig_col

        all_ohe_cols = set(ohe_to_orig.keys())

        new_data = []
        for row in df.data:
            new_row = []
            for col_name in self._original_columns_:
                if col_name in self.columns_:
                    ohe_group = self._ohe_column_map_[col_name]
                    binary_vals = [row[df.columns.index(ohe)] for ohe in ohe_group]
                    decoded = self.categories_[col_name][binary_vals.index(1)] if 1 in binary_vals else self.categories_[col_name][0]
                    new_row.append(decoded)
                else:
                    new_row.append(row[df.columns.index(col_name)])
            new_data.append(new_row)

        return DataFrame(list(self._original_columns_), new_data)

    def __repr__(self):
        return f"OneHotEncoder(encoded_columns={self.columns_})"
