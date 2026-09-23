import random
from global_utils import check_sig
from TypeUtils import integer_type, float_type, boolean_type, numeric_matrix_types, numeric_vector_types, string_type
from ..BaseMachine import BaseMachine


def _validate_non_empty(data, name):
    if not data:
        raise Exception(f"{name}: Empty input data")


def _make_folds(n_samples, n_splits, shuffle=False, random_state=0):
    """Generates indexes for k-fold cross validation without check_sig."""
    rng = random.Random(random_state if random_state != 0 else None)

    if shuffle:
        indices = list(range(n_samples))
        rng.shuffle(indices)
    else:
        indices = list(range(n_samples))

    fold_sizes = [n_samples // n_splits] * n_splits
    for i in range(n_samples % n_splits):
        fold_sizes[i] += 1

    current = 0
    fold_indices = []
    for fold_size in fold_sizes:
        fold_indices.append(indices[current:current + fold_size])
        current += fold_size

    result = []
    for i in range(n_splits):
        test_indices = fold_indices[i]
        train_indices = []
        for j in range(n_splits):
            if j != i:
                train_indices.extend(fold_indices[j])
        result.append([train_indices, test_indices])

    return result


@check_sig({
    2: [numeric_matrix_types, numeric_vector_types],
    3: [numeric_matrix_types, numeric_vector_types, float_type],
    4: [numeric_matrix_types, numeric_vector_types, float_type, integer_type],
    5: [numeric_matrix_types, numeric_vector_types, float_type, integer_type, boolean_type]
})
def train_test_split(X, y, test_size=0.2, random_state=0, shuffle=True):
    """
    Divide arrays into random train and test subsets.

    Splits the data into training and test sets randomly.

    Parameters:
        X: features array (List[List[NUM]])
        y: target vector (List[NUM])
        test_size: proportion from dataset to test (0.0 - 1.0, default 0.2)
        random_state: seed for reproducibility (0 = random, default 0)
        shuffle: whether to shuffle data before splitting (default True)

    Returns:
        (X_train, X_test, y_train, y_test)

    Mathematical foundation:
        Given a dataset of n samples, they are randomly selected
        floor(n * test_size) samples for test, the rest for train.
    """
    _validate_non_empty(X, "train_test_split")
    if len(X) != len(y):
        raise Exception("train_test_split: X and y must have the same number of samples")
    if test_size <= 0 or test_size >= 1:
        raise Exception("train_test_split: test_size must be between 0 and 1 (exclusive)")

    n = len(X)
    rng = random.Random(random_state if random_state != 0 else None)

    if shuffle:
        indices = list(range(n))
        rng.shuffle(indices)
    else:
        indices = list(range(n))

    split_point = int(n * (1 - test_size))
    train_indices = indices[:split_point]
    test_indices = indices[split_point:]

    X_train = [X[i] for i in train_indices]
    X_test = [X[i] for i in test_indices]
    y_train = [y[i] for i in train_indices]
    y_test = [y[i] for i in test_indices]

    return [X_train, X_test, y_train, y_test]


@check_sig({
    1: [integer_type],
    2: [integer_type, integer_type],
    3: [integer_type, integer_type, boolean_type],
    4: [integer_type, integer_type, boolean_type, integer_type]
})
def k_fold(n_samples, n_splits=5, shuffle=False, random_state=0):
    """
    Generate k-fold cross validation splits.

    Generates indexes for k-fold cross validation. Each fold contains
    a subset for test and the rest for train.

    Parameters:
        n_samples: total number of samples
        n_splits: number of folds (default 5)
        shuffle: whether to shuffle data before splitting (default False)
        random_state: seed for reproducibility (0 = random, default 0)

    Returns:
        List of (train_indices, test_indices) tuples

    Mathematical foundation:
        The data is divided into k approximately equal folds.
        In each iteration i, fold i is test and the others are train.
        Test size ≈ floor(n_samples / n_splits)
    """
    if n_samples <= 0:
        raise Exception("k_fold: n_samples must be positive")
    if n_splits <= 1:
        raise Exception("k_fold: n_splits must be greater than 1")
    if n_splits > n_samples:
        raise Exception("k_fold: n_splits cannot be greater than n_samples")

    rng = random.Random(random_state if random_state != 0 else None)

    if shuffle:
        indices = list(range(n_samples))
        rng.shuffle(indices)
    else:
        indices = list(range(n_samples))

    folds = []
    fold_sizes = [n_samples // n_splits] * n_splits
    for i in range(n_samples % n_splits):
        fold_sizes[i] += 1

    current = 0
    fold_indices = []
    for fold_size in fold_sizes:
        fold_indices.append(indices[current:current + fold_size])
        current += fold_size

    result = []
    for i in range(n_splits):
        test_indices = fold_indices[i]
        train_indices = []
        for j in range(n_splits):
            if j != i:
                train_indices.extend(fold_indices[j])
        result.append([train_indices, test_indices])

    return result


class CrossValScore(BaseMachine):
    """
    Wrapper for cross_val_score that can be used as a KAFE object.

    Evaluate a model using k-fold cross validation.
    """

    def __init__(self, cv=5, scoring='accuracy', random_state=0):
        super().__init__()
        self.cv = cv
        self.scoring = scoring
        self.random_state = random_state
        self.scores_ = []
        self.mean_score_ = 0.0
        self.std_score_ = 0.0

    def fit(self, model, X, y):
        """
        Evaluate model using k-fold cross validation.
        """
        if not X or not y:
            raise Exception("cross_val_score: Empty input data")
        if len(X) != len(y):
            raise Exception("cross_val_score: X and y must have the same number of samples")

        folds = k_fold(len(X), self.cv, shuffle=True, random_state=self.random_state)

        scores = []
        for train_indices, test_indices in folds:
            X_train = [X[i] for i in train_indices]
            X_test = [X[i] for i in test_indices]
            y_train = [y[i] for i in train_indices]
            y_test = [y[i] for i in test_indices]

            model.fit(X_train, y_train)

            if self.scoring == 'accuracy':
                preds = model.predict(X_test)
                correct = sum(1 for i in range(len(y_test)) if preds[i] == y_test[i])
                score = correct / len(y_test) if len(y_test) > 0 else 0.0
            elif self.scoring == 'r2':
                preds = model.predict(X_test)
                mean_y = sum(y_test) / len(y_test)
                ss_res = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test)))
                ss_tot = sum((y_test[i] - mean_y) ** 2 for i in range(len(y_test)))
                score = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            elif self.scoring == 'mse':
                preds = model.predict(X_test)
                score = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test))) / len(y_test)
            else:
                score = model.score(X_test, y_test)

            scores.append(score)

        self.scores_ = scores
        self.mean_score_ = sum(scores) / len(scores) if scores else 0.0
        if len(scores) > 1:
            mean = self.mean_score_
            self.std_score_ = (sum((s - mean) ** 2 for s in scores) / (len(scores) - 1)) ** 0.5
        else:
            self.std_score_ = 0.0
        return self

    def __repr__(self):
        return f"CrossValScore(cv={self.cv}, scoring='{self.scoring}', mean={self.mean_score_:.4f})"


def _generate_param_grid(param_grid):
    """
    Generates all combinations of a parameter grid.

    param_grid: dict where keys are parameter names and values ​​are lists of values
    Example: {'n_neighbors': [3, 5, 7], 'weights': ['uniform', 'distance']}

    Returns: list of dicts with all combinations
    """
    if not param_grid:
        return [{}]

    keys = list(param_grid.keys())
    values = list(param_grid.values())

    combinations = [{}]
    for key, vals in zip(keys, values):
        new_combinations = []
        for combo in combinations:
            for val in vals:
                new_combo = combo.copy()
                new_combo[key] = val
                new_combinations.append(new_combo)
        combinations = new_combinations

    return combinations


class GridSearchCV(BaseMachine):
    """
    Exhaustive search on a grid of parameters with cross validation.

    Mathematical foundation:
        Given a grid of parameters G = {p1: [v1, v2], p2: [v3, v4]}
        Evaluate all combinations |G| = |p1| × |p2| = 4
        For each combination, calculate the average score using k-fold CV

    Parameters:
        param_grid: dict of parameters to evaluate
                    Example: {'n_neighbors': [3, 5, 7], 'weights': ['uniform', 'distance']}
        cv: number of folds for cross validation (default 5)
        scoring: evaluation metric ('accuracy', 'r2', 'mse') (default 'accuracy')
        random_state: seed for reproducibility (default 0)

    Attributes (after fit):
        best_params_: best parameters found
        best_score_: mejor score obtenido
        cv_results_: detailed results of all combinations
        n_splits_: number of folds used
    """

    def __init__(self, param_grid, cv=5, scoring='accuracy', random_state=0):
        super().__init__()
        if cv <= 1:
            raise Exception("GridSearchCV: cv must be greater than 1")

        self.param_grid = param_grid
        self.cv = cv
        self.scoring = scoring
        self.random_state = random_state
        self.best_params_ = {}
        self.best_score_ = -float('inf')
        self.cv_results_ = []
        self.n_splits_ = cv

    def _evaluate_params(self, model, X, y, params):
        """Evaluates a combination of parameters using k-fold CV."""
        for key, value in params.items():
            setattr(model, key, value)

        folds = _make_folds(len(X), self.cv, shuffle=True, random_state=self.random_state)

        scores = []
        for train_indices, test_indices in folds:
            X_train = [X[i] for i in train_indices]
            X_test = [X[i] for i in test_indices]
            y_train = [y[i] for i in train_indices]
            y_test = [y[i] for i in test_indices]

            model.fit(X_train, y_train)

            if self.scoring == 'accuracy':
                preds = model.predict(X_test)
                correct = sum(1 for i in range(len(y_test)) if preds[i] == y_test[i])
                score = correct / len(y_test) if len(y_test) > 0 else 0.0
            elif self.scoring == 'r2':
                preds = model.predict(X_test)
                mean_y = sum(y_test) / len(y_test)
                ss_res = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test)))
                ss_tot = sum((y_test[i] - mean_y) ** 2 for i in range(len(y_test)))
                score = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            elif self.scoring == 'mse':
                preds = model.predict(X_test)
                score = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test))) / len(y_test)
            else:
                score = model.score(X_test, y_test)

            scores.append(score)

        mean_score = sum(scores) / len(scores) if scores else 0.0
        return mean_score

    def fit(self, model, X, y):
        """
        Evaluates all combinations of the parameter grid.
        """
        if not X or not y:
            raise Exception("GridSearchCV: Empty input data")
        if len(X) != len(y):
            raise Exception("GridSearchCV: X and y must have the same number of samples")

        combinations = _generate_param_grid(self.param_grid)

        self.cv_results_ = []
        self.best_score_ = -float('inf')
        self.best_params_ = {}

        for params in combinations:
            score = self._evaluate_params(model, X, y, params)

            self.cv_results_.append(score)

            if score > self.best_score_:
                self.best_score_ = score
                self.best_params_ = params.copy()

        for key, value in self.best_params_.items():
            setattr(model, key, value)

        return self

    def __repr__(self):
        return f"GridSearchCV(cv={self.cv}, scoring='{self.scoring}', best_score={self.best_score_:.4f})"


class RandomizedSearchCV(BaseMachine):
    """
    Random search on parameter distributions with cross validation.

    Mathematical foundation:
        Instead of evaluating all combinations (exhaustive),
        randomly samples n_iter combinations from the parameter space.
        More efficient than GridSearch when there are many parameters.

    Parameters:
        param_distributions: dict of parameter distributions
                            Example: {'n_neighbors': [3, 5, 7, 9], 'weights': ['uniform', 'distance']}
        n_iter: number of combinations to sample (default 10)
        cv: number of folds for cross validation (default 5)
        scoring: evaluation metric ('accuracy', 'r2', 'mse') (default 'accuracy')
        random_state: seed for reproducibility (default 0)

    Attributes (after fit):
        best_params_: best parameters found
        best_score_: mejor score obtenido
        cv_results_: detailed results of all combinations evaluated
        n_iter_: number of iterations performed
    """

    def __init__(self, param_distributions, n_iter=10, cv=5, scoring='accuracy', random_state=0):
        super().__init__()
        if n_iter <= 0:
            raise Exception("RandomizedSearchCV: n_iter must be positive")
        if cv <= 1:
            raise Exception("RandomizedSearchCV: cv must be greater than 1")

        self.param_distributions = param_distributions
        self.n_iter = n_iter
        self.cv = cv
        self.scoring = scoring
        self.random_state = random_state
        self.best_params_ = {}
        self.best_score_ = -float('inf')
        self.cv_results_ = []
        self.n_iter_ = n_iter
        self.n_splits_ = cv

    def _sample_params(self, rng):
        """Shows random combinations of parameters."""
        params = {}
        for key, values in self.param_distributions.items():
            if isinstance(values, list):
                params[key] = values[rng.randint(0, len(values) - 1)]
            else:
                params[key] = values
        return params

    def _evaluate_params(self, model, X, y, params):
        """Evaluates a combination of parameters using k-fold CV."""
        for key, value in params.items():
            setattr(model, key, value)

        folds = _make_folds(len(X), self.cv, shuffle=True, random_state=self.random_state)

        scores = []
        for train_indices, test_indices in folds:
            X_train = [X[i] for i in train_indices]
            X_test = [X[i] for i in test_indices]
            y_train = [y[i] for i in train_indices]
            y_test = [y[i] for i in test_indices]

            model.fit(X_train, y_train)

            if self.scoring == 'accuracy':
                preds = model.predict(X_test)
                correct = sum(1 for i in range(len(y_test)) if preds[i] == y_test[i])
                score = correct / len(y_test) if len(y_test) > 0 else 0.0
            elif self.scoring == 'r2':
                preds = model.predict(X_test)
                mean_y = sum(y_test) / len(y_test)
                ss_res = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test)))
                ss_tot = sum((y_test[i] - mean_y) ** 2 for i in range(len(y_test)))
                score = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            elif self.scoring == 'mse':
                preds = model.predict(X_test)
                score = sum((y_test[i] - preds[i]) ** 2 for i in range(len(y_test))) / len(y_test)
            else:
                score = model.score(X_test, y_test)

            scores.append(score)

        mean_score = sum(scores) / len(scores) if scores else 0.0
        return mean_score

    def fit(self, model, X, y):
        """
        Evaluates sampled combinations of parameters.
        """
        if not X or not y:
            raise Exception("RandomizedSearchCV: Empty input data")
        if len(X) != len(y):
            raise Exception("RandomizedSearchCV: X and y must have the same number of samples")

        rng = random.Random(self.random_state if self.random_state != 0 else None)

        self.cv_results_ = []
        self.best_score_ = -float('inf')
        self.best_params_ = {}

        for _ in range(self.n_iter):
            params = self._sample_params(rng)

            score = self._evaluate_params(model, X, y, params)

            self.cv_results_.append(score)

            if score > self.best_score_:
                self.best_score_ = score
                self.best_params_ = params.copy()

        for key, value in self.best_params_.items():
            setattr(model, key, value)

        return self

    def __repr__(self):
        return f"RandomizedSearchCV(n_iter={self.n_iter}, cv={self.cv}, scoring='{self.scoring}', best_score={self.best_score_:.4f})"


class Pipeline(BaseMachine):
    """
    Chain multiple preprocessing steps and a final model.

    Pipeline allows you to sequence preprocessing transformations with a model,
    avoiding data leakage by adjusting each step only in the training data.

    Mathematical foundation:
        Given a pipeline P = [T1, T2, ..., Tn, M]
        For training:
            X' = T1.fit_transform(X)
            X'' = T2.fit_transform(X')
            ...
            M.fit(X''', y)

        For prediction:
            X' = T1.transform(X)
            X'' = T2.transform(X')
            ...
            return M.predict(X''')

    Parameters:
        names: list of names of each step (List[STRING])
               Example: ['scaler', 'model']
        steps: list of transformers or models (List[MACHINE])
               Example: [scaler, model]

    Attributes (after fit):
        steps_: adjusted steps list
        named_steps_: dict of steps by name
    """

    def __init__(self, names, steps):
        super().__init__()
        if not names or not steps:
            raise Exception("Pipeline: steps cannot be empty")
        if len(names) != len(steps):
            raise Exception("Pipeline: names and steps must have the same length")

        self.steps = list(zip(names, steps))
        self.steps_ = []
        self.named_steps_ = {}

    def fit(self, X, y):
        """
        Tune the entire pipeline: train each transformer and the final model.
        """
        if not X or not y:
            raise Exception("Pipeline: Empty input data")
        if len(X) != len(y):
            raise Exception("Pipeline: X and y must have the same number of samples")

        self.steps_ = []
        self.named_steps_ = {}

        current_X = [row[:] for row in X]

        for name, step in self.steps:
            is_last = (step == self.steps[-1][1])

            if is_last:
                step.fit(current_X, y)
            else:
                if hasattr(step, 'fit_transform'):
                    current_X = step.fit_transform(current_X)
                else:
                    step.fit(current_X)
                    current_X = step.transform(current_X)

            self.steps_.append((name, step))
            self.named_steps_[name] = step

        return self

    def predict(self, X):
        """
        Predict by applying all the transformations and then the model.
        """
        if not self.steps_:
            raise Exception("Pipeline: Pipeline not fitted. Call fit() first.")
        if not X:
            return []

        current_X = [row[:] for row in X]

        for name, step in self.steps_:
            is_last = (step == self.steps_[-1][1])

            if is_last:
                return step.predict(current_X)
            else:
                current_X = step.transform(current_X)

        return []

    def score(self, X, y, metric=None):
        """
        Score using the final pipeline model.
        """
        if not self.steps_:
            raise Exception("Pipeline: Pipeline not fitted. Call fit() first.")

        model = self.steps_[-1][1]

        current_X = [row[:] for row in X]
        for name, step in self.steps_[:-1]:
            current_X = step.transform(current_X)

        return model.score(current_X, y, metric)

    def transform(self, X):
        """
        Applies all pipeline transformations (without the final model).
        """
        if not self.steps_:
            raise Exception("Pipeline: Pipeline not fitted. Call fit() first.")
        if not X:
            return []

        current_X = [row[:] for row in X]

        for name, step in self.steps_:
            is_last = (step == self.steps_[-1][1])
            if not is_last:
                current_X = step.transform(current_X)

        return current_X

    def fit_transform(self, X, y):
        """
        Fit and transform in one step (for transformers).
        """
        self.fit(X, y)
        return self.transform(X)

    def get_params(self):
        """
        Returns the names of the pipeline steps.
        """
        return [name for name, _ in self.steps]

    def __repr__(self):
        step_names = [name for name, _ in self.steps]
        return f"Pipeline(steps={step_names})"
