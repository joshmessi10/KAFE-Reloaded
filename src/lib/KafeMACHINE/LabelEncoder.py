from global_utils import check_sig
from TypeUtils import machine_t, lista_cualquiera_t, vector_numeros_t

class LabelEncoder:
    def __init__(self):
        self.classes_ = []
        self._label_to_index = {}

    @check_sig([2], lista_cualquiera_t, is_method=True)
    def fit(self, data):
        """
        Fits the label encoder to the provided data.
        Sorts unique labels and stores them in self.classes_.
        """
        unique_labels = sorted(list(set(data)))
        self.classes_ = unique_labels
        self._label_to_index = {label: i for i, label in enumerate(unique_labels)}
        return self

    @check_sig([2], lista_cualquiera_t, is_method=True)
    def transform(self, data):
        """
        Transforms labels to their corresponding integer indices.
        """
        if not self.classes_:
            raise Exception("LabelEncoder: Must call fit before transform")
            
        result = []
        for item in data:
            if item not in self._label_to_index:
                raise Exception(f"LabelEncoder: Unseen label '{item}'")
            result.append(self._label_to_index[item])
        return result

    @check_sig([2], lista_cualquiera_t, is_method=True)
    def fit_transform(self, data):
        """
        Fits to data, then transforms it.
        """
        return self.fit(data).transform(data)

    @check_sig([2], vector_numeros_t, is_method=True)
    def inverse_transform(self, data):
        """
        Reverts integer indices back to original labels.
        """
        if not self.classes_:
            raise Exception("LabelEncoder: Must call fit before inverse_transform")
            
        result = []
        for idx in data:
            if idx < 0 or idx >= len(self.classes_):
                raise Exception(f"LabelEncoder: Index {idx} out of range")
            result.append(self.classes_[idx])
        return result

    def __repr__(self):
        return f"LabelEncoder(classes={self.classes_})"
