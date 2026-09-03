from lib.KafePARDOS.DataFrame import DataFrame


class BaseMachine:
    def __init__(self):
        self._is_fitted = False

    def _check_fitted(self, method_name):
        if not getattr(self, '_is_fitted', False):
            raise Exception(f"{type(self).__name__}: Must call fit before {method_name}")

    def _unwrap_data(self, data):
        if isinstance(data, DataFrame):
            return data.data, data.columns, True
        return data, [], False

    def fit(self, X, y=None):
        self._is_fitted = True
        return self

    def predict(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support predict()"
        )

    def fit_transform(self, X):
        return self.fit(X).transform(X)

    def transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support transform()"
        )

    def inverse_transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support inverse_transform()"
        )
