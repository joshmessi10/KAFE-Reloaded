from TypeUtils import obtener_tipo_dato, obtener_tipo_dentro_lista, cadena_t
from errores import (
    raiseConditionMustBeBoolean,
    raiseExceededIterationCount,
    raiseNonIterableVariable,
)
from componentes_lenguaje.funciones.utils import ReturnValue


def whileLoop(self, ctx):
    cond = self.visit(ctx.expr())

    if not isinstance(cond, bool):
        raiseConditionMustBeBoolean("while", cond)
    max_iteraciones = 10000
    contador = 0
    while cond:
        self.push_scope()
        try:
            self.visit(ctx.block())
        except ReturnValue as ret:
            self.pop_scope()
            raise ret
        finally:
            self.pop_scope()
        contador += 1
        if contador > max_iteraciones:
            raiseExceededIterationCount()
        cond = self.visit(ctx.expr())
        if not isinstance(cond, bool):
            raiseConditionMustBeBoolean("while", cond)


def forLoop(self, ctx):
    var_name = ctx.ID().getText()
    iterable = self.visit(ctx.expr())

    tipo_iterable = obtener_tipo_dato(iterable)

    if type(iterable) == list:
        tipo_elemento = obtener_tipo_dentro_lista(iterable)
    elif tipo_iterable == cadena_t:
        tipo_elemento = cadena_t
    else:
        raiseNonIterableVariable(iterable)

    for item in iterable:
        self.push_scope()
        self.variables[var_name] = (tipo_elemento, item)
        self.mark_variable_in_scope(var_name)
        try:
            self.visit(ctx.block())
        except ReturnValue as ret:
            self.pop_scope()
            raise ret
        finally:
            self.pop_scope()
