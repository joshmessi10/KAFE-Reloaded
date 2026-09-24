import warnings

from global_utils import check_sig
from TypeUtils import boolean_type, float_type, integer_type, string_type, void_t


@check_sig([2], [boolean_type], [string_type])
def warn_if(condition, message):
    if condition:
        warnings.warn(message, stacklevel=2)

@check_sig([1], [float_type, integer_type, string_type, void_t])
def check_regularization(value):
    if value is None:
        return 0.0
    try:
        val = float(value)
    except (ValueError, TypeError) as e:
        raise ValueError("The regularization parameter must be numeric or None.") from e
    if val < 0:
        raise ValueError("The regularization parameter cannot be negative.")
    return val

