from lib.KafeMACHINE.model_selection.model_selection import stratified_train_test_split


def test_stratified_split_preserves_iris_class_counts_and_seed():
    X = [[float(index)] for index in range(150)]
    y = [0] * 50 + [1] * 50 + [2] * 50

    first = stratified_train_test_split(X, y, 0.2, 42)
    second = stratified_train_test_split(X, y, 0.2, 42)

    X_train, X_test, y_train, y_test = first
    assert first == second
    assert len(first) == 4
    assert len(X_train) == 120
    assert len(X_test) == 30
    assert [y_train.count(label) for label in [0, 1, 2]] == [40, 40, 40]
    assert [y_test.count(label) for label in [0, 1, 2]] == [10, 10, 10]
