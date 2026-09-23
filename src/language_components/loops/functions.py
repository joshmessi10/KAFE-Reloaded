from TypeUtils import get_data_type, get_inner_list_type, cadena_t
from errors import (
    raiseConditionMustBeBoolean,
    raiseExceededIterationCount,
    raiseNonIterableVariable,
)
from language_components.functions.utils import ReturnValue


def whileLoop(self, ctx):
    cond = self.visit(ctx.expr())

    if not isinstance(cond, bool):
        raiseConditionMustBeBoolean("while", cond)
    max_iterations = 10000
    iteration_count = 0
    while cond:
        self.push_scope()
        try:
            self.visit(ctx.block())
        except ReturnValue as ret:
            raise ret
        finally:
            self.pop_scope()
        iteration_count += 1
        if iteration_count > max_iterations:
            raiseExceededIterationCount()
        cond = self.visit(ctx.expr())
        if not isinstance(cond, bool):
            raiseConditionMustBeBoolean("while", cond)


def forLoop(self, ctx):
    var_name = ctx.ID().getText()
    iterable = self.visit(ctx.expr())

    iterable_type = get_data_type(iterable)

    if type(iterable) == list:
        item_type = get_inner_list_type(iterable)
    elif iterable_type == cadena_t:
        item_type = cadena_t
    else:
        raiseNonIterableVariable(iterable)

    for item in iterable:
        self.push_scope()
        from global_utils import assign_variable

        assign_variable(self, var_name, item, item_type)
        self.mark_variable_in_scope(var_name)
        try:
            self.visit(ctx.block())
        except ReturnValue as ret:
            raise ret
        finally:
            self.pop_scope()
