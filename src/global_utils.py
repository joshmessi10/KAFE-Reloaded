from errors import raiseTypeMismatch, raiseFunctionIncorrectArgumentType, raiseWrongNumberOfArgs
from TypeUtils import get_data_type, entero_t, flotante_t, booleano_t, cadena_t, funcion_t, lista_t, lista_cualquiera_t

def is_correct_type(value, declared_type):
    value_type = get_data_type(value)

    if declared_type.startswith(funcion_t):
        declared_type = declared_type[:4]

    if value_type.startswith(lista_t) and declared_type.startswith(lista_t):
        possible_inner_types = [entero_t, flotante_t, booleano_t, cadena_t]

        value_has_no_inner_type = not any(t in value_type for t in possible_inner_types)
        declared_has_no_inner_type = not any(t in declared_type for t in possible_inner_types)

        is_empty_list = value_type == get_data_type([])

        if is_empty_list:
            value_type = declared_type
        elif value_has_no_inner_type or declared_has_no_inner_type:
            declared_type = declared_type.replace(entero_t,"").replace(flotante_t,"")
            declared_type = declared_type.replace(cadena_t,"").replace(booleano_t,"")
            value_type = value_type.replace(entero_t,"").replace(flotante_t,"")
            value_type = value_type.replace(cadena_t,"").replace(booleano_t,"")


    if declared_type != value_type:
        return False
    else:
        return True

def assign_variable(self, name, value, data_type):
    if not is_correct_type(value, data_type):
        raiseTypeMismatch(value, data_type)

    self.variables[name] = (data_type, value)

def flatten_list(nested_list):
    flat_list = []
    for item in nested_list:
        if isinstance(item, list):
            flat_list.extend(flatten_list(item))
        else:
            flat_list.append(item)
    return flat_list

def get_nesting_level(items):
    if not isinstance(items, list):
        return 0

    max_depth = 0
    for item in items:
        if isinstance(item, list):
            depth = get_nesting_level(item)
            if depth > max_depth:
                max_depth = depth

    return max_depth + 1

def verify_homogeneity(items):
    if len(items) != 0:
        nesting_level = get_nesting_level(items[0])
        for item in items:
            if get_nesting_level(item) != nesting_level:
                return False

    items = flatten_list(items)
    if (len(items) != 0):
        data_type = type(items[0])
        for item in items:
            if type(item) != data_type:
                return False

    return True

def check_sig(*args, **kwargs):
    """
    Validate a function signature by argument count and type.
    Accept either a fixed argument count and type lists, or a mapping from
    argument counts to their corresponding type lists.

    With is_method=True, include self in the count but skip its type check.
    """
    variable_config = None
    allowed_arg_counts = []
    fixed_type_lists = []

    if isinstance(args[0], dict):
        variable_config = args[0]
        allowed_arg_counts = list(variable_config.keys())
    else:
        allowed_arg_counts = args[0]
        fixed_type_lists = list(args[1:])

    function_name = kwargs.get('func_nombre', "")
    is_method = kwargs.get('is_method', False)

    def decorator(original_function):
        name = function_name if function_name else original_function.__name__

        def new_function(*received_args, **received_kwargs):
            received_count = len(received_args) + len(received_kwargs)
            
            if received_count not in allowed_arg_counts:
                raiseWrongNumberOfArgs(name, allowed_arg_counts, received_count)

            # Select the type lists for the received argument count.
            if variable_config:
                types_to_validate = variable_config[received_count]
            else:
                types_to_validate = fixed_type_lists

            # Skip self when checking method argument types.
            start_idx = 1 if is_method else 0

            # Validate each functional argument.
            for i, arg in enumerate(received_args[start_idx:]):
                # Extra arguments have already failed the argument count check.
                if i >= len(types_to_validate):
                    continue 

                defined_types = types_to_validate[i]
                if isinstance(defined_types, str):
                    defined_types = [defined_types]
                matches = [is_correct_type(arg, declared_type) for declared_type in defined_types]

                if not any(matches):
                    # Display the broad list type as "lists" in diagnostics.
                    if set(lista_cualquiera_t).issubset(defined_types):
                        error_types = list(set(defined_types) - set(lista_cualquiera_t))
                        error_types.append("lists")
                    else:
                        error_types = defined_types

                    raiseFunctionIncorrectArgumentType(name, arg, error_types)

            return original_function(*received_args, **received_kwargs)

        return new_function
    return decorator
