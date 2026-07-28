class BaseMachine:
    def __init__(self):
        self._is_fitted = False

    def fit(self, X, y=None):
        self._is_fitted = True
        return self

    def predict(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support predict()"
        )

    def transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support transform()"
        )

    def inverse_transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support inverse_transform()"
        )
