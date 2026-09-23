from TypeUtils import get_data_type, void_t

def raiseVoidAsVariableType():
    message = f"{void_t} cannot be used as variable type"
    raise TypeError(message)

def raiseVoidAsParameterType():
    message = f"{void_t} cannot be used as parameter type"
    raise TypeError(message)

def raiseFunctionAlreadyDefined(function_name):
    message = f"Function '{function_name}' already defined"
    raise NameError(message)

def raiseVariableAlreadyDefined(variable_name):
    message = f"Variable '{variable_name}' already defined"
    raise NameError(message)

def raiseFunctionNotDefined(function_name):
    message = f"Function '{function_name}' not defined"
    raise NameError(message)

def raiseVariableNotDefined(variable_name):
    message = f"Variable '{variable_name}' not defined"
    raise NameError(message)

def raiseExpectedHomogeneousList():
    message = "Expected homogeneous list"
    raise Exception(message)

def raiseNonIntegerIndex(value):
    data_type = get_data_type(value)
    message = f"Index must be an integer, got {data_type}"
    raise IndexError(message)

def raiseIndexOutOfBounds(index, length):
    message = f"Index {index} out of bounds for collection of size {length}"
    raise IndexError(message)

def raiseTypeMismatch(variable, declared_type):
    value_type = get_data_type(variable)
    message = f"Expected {declared_type}, obtained {value_type}"
    raise TypeError(message)

def raiseFunctionIncorrectArgumentType(function_name, value, declared_type):
    value_type = get_data_type(value)

    if type(declared_type) == list:
        expected_types = ""
        for i in range(len(declared_type) - 1):
            expected_types += declared_type[i] + " or "
        expected_types += declared_type[len(declared_type) - 1]
    else:
        expected_types = declared_type

    message = f"Function {function_name} expects argument of type {expected_types}, got type {value_type}"
    raise TypeError(message)

def raiseConditionMustBeBoolean(place, variable):
    data_type = get_data_type(variable)

    message = f"Condition in {place} must be boolean, got {data_type}"
    raise TypeError(message)

def raiseExceededIterationCount():
    message = "Maximum number of iterations exceeded in while loop (possible infinite loop)"
    raise RuntimeError(message)

def raiseNonIterableVariable(variable):
    data_type = get_data_type(variable)

    message = f"Variable in for must be iterable (list or string or range), got {data_type}"
    raise TypeError(message)

def raiseWrongNumberOfArgs(function_name, num_args, recv_args):
    if type(num_args) == list:
        arg_counts_text = ""
        for i in range(len(num_args) - 1):
            arg_counts_text += str(num_args[i]) + " or "
        arg_counts_text += str(num_args[len(num_args) - 1])
    else:
        arg_counts_text = str(num_args)

    message = f"'{function_name}' expects {arg_counts_text} args, got {recv_args}"
    raise Exception(message)

def raiseModuleNotFound(module_name, path):
    message = f"Module file for '{module_name}' not found. Tried: {path}"
    raise FileNotFoundError(message)

def raiseFunctionCantReturnVoid():
    message = f"Function declared {void_t} must not return a value"
    raise TypeError(message)

def raiseLibraryNotImported():
    message = "library not imported"
    raise Exception(message)

def raiseVariableIsNotObject():
    message = "variable is not of type object"
    raise Exception(message)

def raiseFileNotFound(name, path):
    message = f"File '{name}' not found at {path}"
    raise FileNotFoundError(message)

def raiseSignatureMismatch(expected_signature, obtained_signature, origin=""):
    message = f"Expected {expected_signature}, obtained {obtained_signature}"
    if origin:
        message = origin + ": " + message
    raise TypeError(message)

def raiseScientificNotationError(line, column, msg):
    raise Exception(
        f"Scientific Notation Error [Line {line}, Column {column}]: {msg}"
    )

def raiseInvalidEscape(escape_char):
    message = f"Invalid escape sequence: \\{escape_char}"
    raise Exception(message)

def raiseIncompleteEscape():
    message = "Incomplete escape sequence at end of string"
    raise Exception(message)