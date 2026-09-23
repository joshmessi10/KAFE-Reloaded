nombre_tipos = { int:"INT", float:"FLOAT", str:"STR", bool:"BOOL", list:"List", "void": "VOID", "func": "FUNC",  "gesha": "GESHA", "pardos": "PARDOS", "machine": "MACHINE" }

def get_inner_list_type(items):
    list_type = get_list_type(items)
    if list_type.startswith("List[") and list_type.endswith("]"):
        return list_type[5:-1]
    return list_type

def build_list_type(nesting_level, data_type=None):
    built_type = "List["
    if nesting_level == 1:
        built_type += nombre_tipos[data_type] if data_type != None else ""
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
        return nombre_tipos["func"]
    elif isinstance(value, (Gesha, Layer, Node, Input)):
        return nombre_tipos["gesha"]
    elif isinstance(value, DataFrame) or "GroupBy" in str(type(value)):
        return nombre_tipos["pardos"]
    elif isinstance(value, BaseMachine):
        return nombre_tipos["machine"]
    elif value is None:
        return nombre_tipos["void"]
    else:
        return nombre_tipos[type(value)]

vector_numeros_t      = [build_list_type(1, int), build_list_type(1, float)]
matriz_numeros_t      = [build_list_type(2, int), build_list_type(2, float)]
matriz_cualquiera_t   = build_list_type(2)
lista_cadenas_t         = build_list_type(1, str)
numeros_t             = [nombre_tipos[int], nombre_tipos[float]]
entero_t              = nombre_tipos[int]
flotante_t            = nombre_tipos[float]
booleano_t            = nombre_tipos[bool]
cadena_t              = nombre_tipos[str]
lista_t               = nombre_tipos[list]
gesha_t               = nombre_tipos["gesha"]
pardos_t              = nombre_tipos["pardos"]
machine_t             = nombre_tipos["machine"]
void_t                = nombre_tipos['void']
funcion_t             = nombre_tipos["func"]
lista_cualquiera_t    = [build_list_type(i) for i in range(1, 100)]
todos_t               = numeros_t + [cadena_t, booleano_t] + lista_cualquiera_t
