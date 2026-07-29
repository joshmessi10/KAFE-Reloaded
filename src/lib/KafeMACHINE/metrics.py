from global_utils import check_sig
from lib.KafeMATH.funciones import sqrt
from TypeUtils import vector_numeros_t


def _validate_inputs(func_name, y_true, y_pred):
    if len(y_true) != len(y_pred):
        raise Exception(f"{func_name}: y_true and y_pred must have same length")
    if len(y_true) == 0:
        raise Exception(f"{func_name}: Input lists cannot be empty")


@check_sig([2], vector_numeros_t, vector_numeros_t)
def accuracy_score(y_true, y_pred):
    _validate_inputs("accuracy_score", y_true, y_pred)
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    return correct / len(y_true)


def _per_class_tp_fp_fn(y_true, y_pred, cls):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p == cls)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t != cls and p == cls)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p != cls)
    return tp, fp, fn


def _precision_recall_f1_macro(y_true, y_pred):
    classes = sorted(set(y_true))
    precisions = []
    recalls = []
    for cls in classes:
        tp, fp, fn = _per_class_tp_fp_fn(y_true, y_pred, cls)
        precisions.append(tp / (tp + fp) if tp + fp > 0 else 0.0)
        recalls.append(tp / (tp + fn) if tp + fn > 0 else 0.0)
    return precisions, recalls, classes


@check_sig([2], vector_numeros_t, vector_numeros_t)
def precision_score(y_true, y_pred):
    _validate_inputs("precision_score", y_true, y_pred)
    precisions, _, _ = _precision_recall_f1_macro(y_true, y_pred)
    return sum(precisions) / len(precisions)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def recall_score(y_true, y_pred):
    _validate_inputs("recall_score", y_true, y_pred)
    _, recalls, _ = _precision_recall_f1_macro(y_true, y_pred)
    return sum(recalls) / len(recalls)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def f1_score(y_true, y_pred):
    _validate_inputs("f1_score", y_true, y_pred)
    p = precision_score(y_true, y_pred)
    r = recall_score(y_true, y_pred)
    if p + r == 0:
        return 0.0
    return 2.0 * p * r / (p + r)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def confusion_matrix(y_true, y_pred):
    _validate_inputs("confusion_matrix", y_true, y_pred)
    classes = sorted(set(y_true) | set(y_pred))
    class_to_idx = {c: i for i, c in enumerate(classes)}
    n = len(classes)
    matrix = [[0] * n for _ in range(n)]
    for t, p in zip(y_true, y_pred):
        matrix[class_to_idx[t]][class_to_idx[p]] += 1
    return matrix


@check_sig([2], vector_numeros_t, vector_numeros_t)
def classification_report(y_true, y_pred):
    _validate_inputs("classification_report", y_true, y_pred)
    classes = sorted(set(y_true))
    lines = []
    lines.append(f"{'':>8} {'precision':>10} {'recall':>8} {'f1-score':>9} {'support':>8}")

    per_class = {}
    for cls in classes:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p == cls)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != cls and p == cls)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p != cls)
        sup = sum(1 for t in y_true if t == cls)
        p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1v = 2.0 * p * r / (p + r) if (p + r) > 0 else 0.0
        per_class[cls] = (p, r, f1v, sup)
        lines.append(f"{cls:>8} {p:>10.2f} {r:>8.2f} {f1v:>9.2f} {sup:>8}")

    acc = accuracy_score(y_true, y_pred)
    total = len(y_true)
    lines.append("")
    lines.append(f"{'accuracy':>8} {acc:>10.2f} {total:>27}")

    macro_p = sum(v[0] for v in per_class.values()) / len(classes)
    macro_r = sum(v[1] for v in per_class.values()) / len(classes)
    macro_f1 = 2.0 * macro_p * macro_r / (macro_p + macro_r) if (macro_p + macro_r) > 0 else 0.0
    lines.append(f"{'macro avg':>8} {macro_p:>10.2f} {macro_r:>8.2f} {macro_f1:>9.2f} {total:>8}")

    weighted_p = sum(v[0] * v[3] for v in per_class.values()) / total
    weighted_r = sum(v[1] * v[3] for v in per_class.values()) / total
    weighted_f1 = 2.0 * weighted_p * weighted_r / (weighted_p + weighted_r) if (weighted_p + weighted_r) > 0 else 0.0
    lines.append(f"{'weighted avg':>8} {weighted_p:>10.2f} {weighted_r:>8.2f} {weighted_f1:>9.2f} {total:>8}")

    return "\n".join(lines)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def mean_squared_error(y_true, y_pred):
    _validate_inputs("mean_squared_error", y_true, y_pred)
    return sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def mean_absolute_error(y_true, y_pred):
    _validate_inputs("mean_absolute_error", y_true, y_pred)
    return sum(abs(t - p) for t, p in zip(y_true, y_pred)) / len(y_true)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def root_mean_squared_error(y_true, y_pred):
    _validate_inputs("root_mean_squared_error", y_true, y_pred)
    mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
    return sqrt(mse)


@check_sig([2], vector_numeros_t, vector_numeros_t)
def r2_score(y_true, y_pred):
    _validate_inputs("r2_score", y_true, y_pred)
    y_mean = sum(y_true) / len(y_true)
    ss_res = sum((t - p) ** 2 for t, p in zip(y_true, y_pred))
    ss_tot = sum((t - y_mean) ** 2 for t in y_true)
    if ss_tot == 0:
        return 1.0 if ss_res == 0 else 0.0
    return 1.0 - ss_res / ss_tot


@check_sig([2], vector_numeros_t, vector_numeros_t)
def max_error(y_true, y_pred):
    _validate_inputs("max_error", y_true, y_pred)
    return float(max(abs(t - p) for t, p in zip(y_true, y_pred)))


@check_sig([2], vector_numeros_t, vector_numeros_t)
def median_absolute_error(y_true, y_pred):
    _validate_inputs("median_absolute_error", y_true, y_pred)
    abs_errors = sorted(abs(t - p) for t, p in zip(y_true, y_pred))
    n = len(abs_errors)
    if n % 2 == 1:
        return float(abs_errors[n // 2])
    return (abs_errors[n // 2 - 1] + abs_errors[n // 2]) / 2.0


@check_sig([2], vector_numeros_t, vector_numeros_t)
def mean_absolute_percentage_error(y_true, y_pred):
    _validate_inputs("mean_absolute_percentage_error", y_true, y_pred)
    for t in y_true:
        if t == 0:
            raise Exception("mean_absolute_percentage_error: y_true contains zero, MAPE is undefined")
    return 100.0 / len(y_true) * sum(abs(t - p) / abs(t) for t, p in zip(y_true, y_pred))


@check_sig([2], vector_numeros_t, vector_numeros_t)
def explained_variance_score(y_true, y_pred):
    _validate_inputs("explained_variance_score", y_true, y_pred)
    y_mean = sum(y_true) / len(y_true)
    err_mean = sum(t - p for t, p in zip(y_true, y_pred)) / len(y_true)
    var_y = sum((t - y_mean) ** 2 for t in y_true) / len(y_true)
    var_err = sum(((t - p) - err_mean) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
    if var_y == 0:
        return 0.0
    return 1.0 - var_err / var_y
