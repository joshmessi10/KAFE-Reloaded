from lib.KafeGESHA.core.model import Gesha
from errors import (
    raiseVariableAlreadyDefined,
    raiseVariableNotDefined,
    raiseVoidAsVariableType,
    raiseExpectedHomogeneousList,
    raiseNonIntegerIndex,
    raiseIndexOutOfBounds,
    raiseTypeMismatch,
)
from TypeUtils import (
    get_data_type,
    entero_t,
    flotante_t,
    cadena_t,
    booleano_t,
    lista_t,
    void_t,
    gesha_t,
    pardos_t,
)
from global_utils import is_correct_type, verify_homogeneity, assign_variable


def varDecl(self, ctx):
    data_type = ctx.typeDecl().getText()
    if data_type == void_t:
        raiseVoidAsVariableType()

    name = ctx.ID().getText()
    val = None

    if ctx.expr():
        val = self.visit(ctx.expr())

    # Check if variable is already declared in the CURRENT scope only
    # (allows shadowing variables from outer scopes)
    if len(self.scope_stack) > 0 and name in self.scope_stack[-1]:
        raiseVariableAlreadyDefined(name)

    if val is None:
        if data_type == entero_t:
            val = 0
        elif data_type == flotante_t:
            val = 0.0
        elif data_type == cadena_t:
            val = ""
        elif data_type == booleano_t:
            val = False
        elif data_type == gesha_t:
            val = Gesha()
        elif data_type == pardos_t:
            from lib.KafePARDOS.DataFrame import DataFrame
            val = DataFrame([], [])
        elif data_type.startswith(lista_t):
            val = []

    assign_variable(self, name, val, data_type)
    # Mark variable as declared in current scope
    self.mark_variable_in_scope(name)


def assignStmt(self, ctx):
    id_text = ctx.ID().getText()
    value = self.visit(ctx.expr())

    if id_text not in self.variables:
        raiseVariableNotDefined(id_text)

    data_type = self.variables[id_text][0]

    assign_variable(self, id_text, value, data_type)


def expr(self, ctx):
    result = self.visitChildren(ctx)

    if type(result) == list:
        if verify_homogeneity(result) == False:
            raiseExpectedHomogeneousList()

    return result


def logicExpr(self, ctx):
    result = self.visit(ctx.equalityExpr(0))
    for i in range(1, len(ctx.equalityExpr())):
        op = ctx.getChild(2 * i - 1).getText()
        if (op == "&&" and not result) or (op == "||" and result):
            continue
        right = self.visit(ctx.equalityExpr(i))
        if op == "&&":
            result = result and right
        elif op == "||":
            result = result or right
    return result


def equalityExpr(self, ctx):
    result = self.visit(ctx.relationalExpr(0))
    for i in range(1, len(ctx.relationalExpr())):
        op = ctx.getChild(2 * i - 1).getText()
        right = self.visit(ctx.relationalExpr(i))
        if op == "==":
            result = result == right
        elif op == "!=":
            result = result != right
    return result


def relationalExpr(self, ctx):
    result = self.visit(ctx.additiveExpr(0))
    for i in range(1, len(ctx.additiveExpr())):
        op = ctx.getChild(2 * i - 1).getText()
        right = self.visit(ctx.additiveExpr(i))
        if op == "<":
            result = result < right
        elif op == "<=":
            result = result <= right
        elif op == ">":
            result = result > right
        elif op == ">=":
            result = result >= right
    return result


def additiveExpr(self, ctx):
    result = self.visit(ctx.multiplicativeExpr(0))
    for i in range(1, len(ctx.multiplicativeExpr())):
        op = ctx.getChild(2 * i - 1).getText()
        right = self.visit(ctx.multiplicativeExpr(i))
        if op == "+":
            result += right
        elif op == "-":
            result -= right
    return result


def multiplicativeExpr(self, ctx):
    result = self.visit(ctx.powerExpr(0))
    for i in range(1, len(ctx.powerExpr())):
        op = ctx.getChild(2 * i - 1).getText()
        right = self.visit(ctx.powerExpr(i))
        if op == "*":
            result *= right
        elif op == "/":
            result /= right
        elif op == "%":
            result %= right
    return result


def powerExpr(self, ctx):
    exprs = [self.visit(ctx.unaryExpr(i)) for i in range(len(ctx.unaryExpr()))]
    result = exprs[-1]
    for i in range(len(exprs) - 2, -1, -1):
        result = exprs[i] ** result
    return result


def unaryExpression(self, ctx):
    op = ctx.getChild(0).getText()
    value = self.visit(ctx.unaryExpr())
    if op == "-":
        return -value
    elif op == "!":
        return not value


def indexingExpr(self, ctx):
    collection = self.visit(ctx.primaryExpr())
    index = self.visit(ctx.expr())

    if type(index) != int:
        raiseNonIntegerIndex(index)

    if type(collection) == str or type(collection) == list:
        try:
            return collection[index]
        except IndexError:
            raiseIndexOutOfBounds(index, len(collection))


def idExpr(self, ctx):
    id_text = ctx.ID().getText()

    if id_text in self.variables:
        return self.variables[id_text][1]

    raiseVariableNotDefined(id_text)


def indexedAssignStmt(self, ctx):
    list_name = ctx.ID().getText()
    indexes = self.visit(ctx.indexing())

    for index in indexes:
        if type(index) != int:
            raiseNonIntegerIndex(index)

    if list_name not in self.variables:
        raiseVariableNotDefined(list_name)

    _, items = self.variables[list_name]

    new_value = self.visit(ctx.expr())

    indexed_list = items
    for i in range(len(indexes) - 1):
        try:
            indexed_list = indexed_list[indexes[i]]
        except IndexError:
            raiseIndexOutOfBounds(indexes[i], len(indexed_list))

    last_index = indexes[len(indexes) - 1]
    try:
        previous_value = indexed_list[last_index]
        previous_value_type = get_data_type(previous_value)

        if not is_correct_type(new_value, previous_value_type):
            raiseTypeMismatch(new_value, previous_value_type)

        indexed_list[last_index] = new_value
    except IndexError:
        raiseIndexOutOfBounds(last_index, len(indexed_list))
