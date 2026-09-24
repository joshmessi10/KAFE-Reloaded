from typing import cast

from errors import raiseFunctionCantReturnVoid, raiseTypeMismatch
from global_utils import is_correct_type
from TypeUtils import void_t


class ReturnValue(Exception):
    def __init__(self, value):
        super().__init__()
        self.value = value

def _parse_signature(sig: str):
    s = sig.replace(" ", "")
    def helper(s):
        if not s.startswith("FUNC("):
            return [], s
        idx, depth = 5, 0
        while idx < len(s):
            if s[idx] == '(':
                depth += 1
            elif s[idx] == ')':
                if depth == 0:
                    break
                depth -= 1
            idx += 1
        params_str = s[5:idx]
        params = params_str.split(',') if params_str else []
        rest = s[idx+3:]
        if rest.startswith("FUNC("):
            sub_p, sub_r = helper(rest)
            return params + sub_p, sub_r
        else:
            return params, rest
    return helper(s)

def check_value_type(value, declared_type: str):
    decl = declared_type.replace(" ", "")

    if declared_type == void_t:
        if value is not None:
            raiseFunctionCantReturnVoid()
        return

    if decl.startswith("FUNC"):
        obtained_signature = getattr(value, "signature", None)
        if obtained_signature is None:
            raiseTypeMismatch(value, declared_type)

        act_params, act_ret = _parse_signature(cast(str, obtained_signature))
        exp_params, exp_ret = _parse_signature(decl)

        if not (
            act_params == exp_params
            or (len(act_params) < len(exp_params) and act_ret == "ANY")
        ):
            raiseTypeMismatch(value, declared_type)

        if exp_ret != act_ret and exp_ret != "ANY" and act_ret != "ANY":
            raiseTypeMismatch(value, declared_type)

        return

    if not is_correct_type(value, decl):
        raiseTypeMismatch(value, declared_type)
