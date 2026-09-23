type_names = { int:"INT", float:"FLOAT", str:"STR", bool:"BOOL", list:"List", "void": "VOID", "func": "FUNC",  "gesha": "GESHA", "pardos": "PARDOS", "machine": "MACHINE" }

def get_inner_list_type(items):
    list_type = get_list_type(items)
    if list_type.startswith("List[") and list_type.endswith("]"):
        return list_type[5:-1]
    return list_type

def build_list_type(nesting_level, data_type=None):
    built_type = "List["
    if nesting_level == 1:
        built_type += type_names[data_type] if data_type != None else ""
    else:
        built_type += build_list_type(nesting_level - 1, data_type=data_type)
    built_type += "]"
    return built_type

def get_list_type(items):
    data_type = "List["
    if len(items) != 0:
        if type(items[0]) is list:
            data_type += get_list_type(items[0])
        else:
            data_type += get_data_type(items[0])
    data_type += ']'
    return data_type

def get_data_type(value):
    from lib.KafePARDOS.DataFrame import DataFrame
    from lib.KafeGESHA.core.model import Gesha
    from lib.KafeGESHA.layers.layer import Layer
    from lib.KafeGESHA.core.node import Node
    from lib.KafeGESHA.layers.input_layer import Input
    from lib.KafeMACHINE.BaseMachine import BaseMachine

    if type(value) is list:
        return get_list_type(value)
    elif callable(value):
        return type_names["func"]
    elif isinstance(value, (Gesha, Layer, Node, Input)):
        return type_names["gesha"]
    elif isinstance(value, DataFrame) or "GroupBy" in str(type(value)):
        return type_names["pardos"]
    elif isinstance(value, BaseMachine):
        return type_names["machine"]
    elif value is None:
        return type_names["void"]
    else:
        return type_names[type(value)]

numeric_vector_types      = [build_list_type(1, int), build_list_type(1, float)]
numeric_matrix_types      = [build_list_type(2, int), build_list_type(2, float)]
any_matrix_type   = build_list_type(2)
string_list_type         = build_list_type(1, str)
number_types             = [type_names[int], type_names[float]]
integer_type              = type_names[int]
float_type            = type_names[float]
boolean_type            = type_names[bool]
string_type              = type_names[str]
list_type               = type_names[list]
gesha_type               = type_names["gesha"]
pardos_type              = type_names["pardos"]
machine_type             = type_names["machine"]
void_t                = type_names['void']
function_type             = type_names["func"]
any_list_types    = [build_list_type(i) for i in range(1, 100)]
all_types               = number_types + [string_type, boolean_type] + any_list_types
