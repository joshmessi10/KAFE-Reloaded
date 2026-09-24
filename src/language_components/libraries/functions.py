from errors import (
    raiseFunctionNotDefined,
    raiseLibraryNotImported,
    raiseVariableNotDefined,
)


def check_imported(library):
    was_imported = library[1]
    if not was_imported:
        raiseLibraryNotImported()


def libraryFunctionCall(library, function_name, args):
    check_imported(library)
    library_module = library[0]
    func = getattr(library_module, function_name, None)

    if func is None:
        raiseFunctionNotDefined(function_name)

    result = func(*args)

    return result

def libraryConstant(library, constant_name):
    check_imported(library)
    library_module = library[0]
    const = getattr(library_module, constant_name, None)

    if const is None:
        raiseVariableNotDefined(constant_name)

    return const
