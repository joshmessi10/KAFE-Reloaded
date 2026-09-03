from global_utils import check_sig
from TypeUtils import pardos_t, lista_cadenas_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class OrdinalEncoder(BaseMachine):
    def __init__(self):
        super().__init__()
        self.categories_ = {}
        self.columns_ = []
        self._category_to_index_ = {}
        self._original_columns_ = []

    @check_sig([3], [pardos_t], [lista_cadenas_t], is_method=True)
    def fit(self, df, columns):
        """
        Fit the OrdinalEncoder on the specified columns.

        Args:
            df: PARDOS DataFrame
            columns: List of column names to encode
        """
        self.columns_ = columns
        self.categories_ = {}
        self._category_to_index_ = {}
        self._original_columns_ = list(df.columns)

        for col in columns:
            if col not in df.columns:
                raise Exception(f"OrdinalEncoder: Column '{col}' not found in DataFrame")

            col_data = df.col(col)
            unique_cats = sorted(list(set(str(v) for v in col_data if v is not None)))
            self.categories_[col] = unique_cats
            self._category_to_index_[col] = {cat: i for i, cat in enumerate(unique_cats)}

        self._is_fitted = True
        return self

    @check_sig([2], [pardos_t], is_method=True)
    def transform(self, df):
        """
        Transform the specified columns using ordinal encoding.

        Args:
            df: PARDOS DataFrame
        Returns:
            New DataFrame with encoded columns
        """
        self._check_fitted("transform")

        new_columns = list(df.columns)
        new_data = []

        for i in range(len(df.data)):
            row = df.data[i]
            new_row = []

            for j, col_name in enumerate(df.columns):
                if col_name in self.columns_:
                    val = str(row[j])
                    if val in self._category_to_index_[col_name]:
                        new_row.append(self._category_to_index_[col_name][val])
                    else:
                        raise Exception(f"OrdinalEncoder: Unseen category '{val}' in column '{col_name}'")
                else:
                    new_row.append(row[j])

            new_data.append(new_row)

        return DataFrame(new_columns, new_data)

    def fit_transform(self, df, columns):
        """
        Fit and transform in one step.
        """
        return self.fit(df, columns).transform(df)

    def inverse_transform(self, df):
        """
        Convert ordinal encoded values back to original categories.

        Args:
            df: PARDOS DataFrame with encoded values
        Returns:
            New DataFrame with original categories restored
        """
        self._check_fitted("inverse_transform")

        new_columns = list(df.columns)
        new_data = []

        for i in range(len(df.data)):
            row = df.data[i]
            new_row = []

            for j, col_name in enumerate(df.columns):
                if col_name in self.columns_:
                    idx = int(row[j])
                    if idx < 0 or idx >= len(self.categories_[col_name]):
                        raise Exception(f"OrdinalEncoder: Index {idx} out of range for column '{col_name}'")
                    new_row.append(self.categories_[col_name][idx])
                else:
                    new_row.append(row[j])

            new_data.append(new_row)

        return DataFrame(new_columns, new_data)

    def __repr__(self):
        return f"OrdinalEncoder(encoded_columns={self.columns_})"
