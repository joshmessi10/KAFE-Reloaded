from global_utils import check_sig
from TypeUtils import pardos_t, lista_cadenas_t
from lib.KafePARDOS.DataFrame import DataFrame

class OneHotEncoder:
    def __init__(self):
        self.categories_ = {}
        self.columns_ = []

    @check_sig([3], [pardos_t], [lista_cadenas_t], is_method=True)
    def fit(self, df, columns):
        """
        Fits the encoder by discovering unique categories for each specified column.
        """
        self.columns_ = columns
        self.categories_ = {}
        
        for col in columns:
            if col not in df.columns:
                raise Exception(f"OneHotEncoder: Column '{col}' not found in DataFrame")
            
            col_data = df.col(col)
            # Use sorted set to ensure consistent column ordering
            unique_cats = sorted(list(set(str(v) for v in col_data if v is not None)))
            self.categories_[col] = unique_cats
            
        return self

    @check_sig([2], [pardos_t], is_method=True)
    def transform(self, df):
        """
        Transforms the DataFrame into a one-hot encoded representation.
        """
        if not self.categories_:
            raise Exception("OneHotEncoder: Must call fit before transform")
            
        new_columns = []
        # Add columns that are NOT being encoded first
        for col in df.columns:
            if col not in self.columns_:
                new_columns.append(col)
        
        # Add the new binary columns
        for col in self.columns_:
            for cat in self.categories_[col]:
                new_columns.append(f"{col}_{cat}")
                
        new_data = []
        for i in range(len(df.data)):
            row = df.data[i]
            new_row = []
            
            # Add original values for columns not being encoded
            for j, col_name in enumerate(df.columns):
                if col_name not in self.columns_:
                    new_row.append(row[j])
            
            # Add binary values for encoded columns
            for col_name in self.columns_:
                col_idx = df.columns.index(col_name)
                val = str(row[col_idx])
                for cat in self.categories_[col_name]:
                    new_row.append(1 if val == cat else 0)
                    
            new_data.append(new_row)
            
        return DataFrame(new_columns, new_data)

    @check_sig([3], [pardos_t], [lista_cadenas_t], is_method=True)
    def fit_transform(self, df, columns):
        """
        Fits to data, then transforms it.
        """
        return self.fit(df, columns).transform(df)

    def __repr__(self):
        return f"OneHotEncoder(encoded_columns={self.columns_})"
