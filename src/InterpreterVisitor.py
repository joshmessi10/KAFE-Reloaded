from Kafe_GrammarVisitor import Kafe_GrammarVisitor

from language_components.libraries.functions import (
    libraryFunctionCall,
    libraryConstant,
)
from language_components.base.functions import (
    additiveExpr,
    assignStmt,
    equalityExpr,
    expr,
    idExpr,
    indexedAssignStmt,
    indexingExpr,
    logicExpr,
    multiplicativeExpr,
    powerExpr,
    relationalExpr,
    unaryExpression,
    varDecl,
)
from language_components.loops.functions import forLoop, whileLoop
from language_components.conditionals.functions import ifElseExpr
from language_components.functions.functions import (
    functionDecl,
    lambdaExpr,
    returnStmt,
    visitAppendCall,
    functionCall,
    visitRemoveCall,
    visitLenCall,
    rangeExpr,
    pourStmt,
    showStmt,
)
from language_components.imports.functions import importStmt
from language_components.method_calling.functions import (
    objectConstant,
    objectFunctionCall,
)

from errors import raiseVariableNotDefined

import lib.KafeNUMK.functions as numk_funcs_module
import lib.KafeMATH.functions as math_funcs_module
import lib.KafeFILES.functions as files_funcs_module
import lib.KafePLOT.functions as plot_funcs_module
import lib.KafeGESHA.functions as gesha_funcs_module
import lib.KafePARDOS.functions as pardos_funcs_module
import lib.KafeMACHINE.functions as machine_funcs_module
import lib.KafeHF.functions as hf_funcs_module


class InterpreterVisitor(Kafe_GrammarVisitor):
    def __init__(self):
        self.variables = {}
        self.scope_stack = [{}]  # Stack of scopes for proper variable isolation
        self.libraries = {
            "numk": [numk_funcs_module, False],
            "math": [math_funcs_module, False],
            "files": [files_funcs_module, False],
            "plot": [plot_funcs_module, False],
            "geshaDeep": [gesha_funcs_module, False],
            "pardos": [pardos_funcs_module, False],
            "machine": [machine_funcs_module, False],
            "huggingface": [hf_funcs_module, False],
        }
        self.imported = set()
        import globals
        globals.current_visitor = self

    def push_scope(self):
        """Enter a new scope (for loops, conditionals)"""
        self.scope_stack.append({})

    def pop_scope(self):
        """Exit current scope and remove local variables"""
        if len(self.scope_stack) > 1:
            local_vars = self.scope_stack.pop()
            # Remove variables that were declared in this scope
            for var_name in local_vars:
                if var_name in self.variables:
                    del self.variables[var_name]

    def is_in_local_scope(self, var_name):
        """Check if variable was declared in current scope"""
        return len(self.scope_stack) > 1 and var_name in self.scope_stack[-1]

    def mark_variable_in_scope(self, var_name):
        """Mark that a variable was declared in the current scope"""
        if len(self.scope_stack) > 0:
            self.scope_stack[-1][var_name] = True

    def visitSimpleImport(self, ctx):
        importStmt(self, ctx)

    def visitVarDecl(self, ctx):
        varDecl(self, ctx)

    def visitAssignStmt(self, ctx):
        assignStmt(self, ctx)

    def visitIndexedAssignStmt(self, ctx):
        indexedAssignStmt(self, ctx)

    def visitIndexing(self, ctx):
        indexes = [self.visit(expr) for expr in ctx.expr()]
        return indexes

    def visitFunctionDecl(self, ctx):
        return functionDecl(self, ctx)

    def visitFunctionCall(self, ctx):
        return functionCall(self, ctx)

    def visitAppendCall(self, ctx):
        items = self.visit(ctx.expr(0))
        element = self.visit(ctx.expr(1))
        return visitAppendCall(items, element)

    def visitRemoveCall(self, ctx):
        items = self.visit(ctx.expr(0))
        element = self.visit(ctx.expr(1))
        return visitRemoveCall(items, element)

    def visitLenCall(self, ctx):
        items = self.visit(ctx.expr())
        return visitLenCall(items)

    def visitLambdaExpr(self, ctx):
        return lambdaExpr(self, ctx)

    def visitLambdaExpression(self, ctx):
        return self.visit(ctx.lambdaExpr())

    def visitReturnStmt(self, ctx):
        return returnStmt(self, ctx)

    def visitShowStmt(self, ctx):
        showStmt(self, ctx)

    def visitPourStmt(self, ctx):
        return pourStmt(self, ctx)

    def visitRangeExpr(self, ctx):
        range_values = [self.visit(expr) for expr in ctx.expr()]
        return rangeExpr(*range_values)

    def visitIfElseExpr(self, ctx):
        return ifElseExpr(self, ctx)

    def visitWhileLoop(self, ctx):
        whileLoop(self, ctx)

    def visitForLoop(self, ctx):
        forLoop(self, ctx)

    def visitExpr(self, ctx):
        return expr(self, ctx)

    def visitIndexingExpr(self, ctx):
        return indexingExpr(self, ctx)

    def visitLogicExpr(self, ctx):
        return logicExpr(self, ctx)

    def visitEqualityExpr(self, ctx):
        return equalityExpr(self, ctx)

    def visitRelationalExpr(self, ctx):
        return relationalExpr(self, ctx)

    def visitAdditiveExpr(self, ctx):
        return additiveExpr(self, ctx)

    def visitMultiplicativeExpr(self, ctx):
        return multiplicativeExpr(self, ctx)

    def visitPowerExpr(self, ctx):
        return powerExpr(self, ctx)

    def visitUnaryExpression(self, ctx):
        return unaryExpression(self, ctx)

    def visitParenExpr(self, ctx):
        return self.visitChildren(ctx.expr())

    def visitIdExpr(self, ctx):
        return idExpr(self, ctx)

    def visitIntLiteral(self, ctx):
        return int(ctx.getText())

    def visitFloatLiteral(self, ctx):
        return float(ctx.getText())



    def visitInterpretEscapes(self, raw):
        escapes = {'n':'\n','t':'\t','r':'\r','\\':'\\','"':'"',"'" : "'"}
        result = []
        it = iter(raw)
        for c in it:
            if c == '\\':
                try:
                    esc = next(it)
                    if esc not in escapes:
                        from errors import raiseInvalidEscape
                        raiseInvalidEscape(esc)
                    result.append(escapes[esc])
                except StopIteration:
                    from errors import raiseIncompleteEscape
                    raiseIncompleteEscape()
            else:
                result.append(c)
        return ''.join(result)

    def visitStringLiteral(self, ctx):
        return self.visitInterpretEscapes(ctx.getText()[1:-1])

    def visitBoolLiteral(self, ctx):
        if ctx.getText() == "False":
            return False
        else:
            return True

    def visitListLiteral(self, ctx):
        items = []

        for expr in ctx.expr():
            value = self.visit(expr)
            items.append(value)

        return items

    def visitStrCastExpr(self, ctx):
        return str(self.visit(ctx.expr()))

    def visitBoolCastExpr(self, ctx):
        return bool(self.visit(ctx.expr()))

    def visitFloatCastExpr(self, ctx):
        return float(self.visit(ctx.expr()))

    def visitIntCastExpr(self, ctx):
        return int(self.visit(ctx.expr()))

    def visitObjectFunctionCall(self, ctx):
        object_name = ctx.ID(0).getText()
        function_name = ctx.ID(1).getText()
        args = [self.visit(e) for e in ctx.expr()]

        is_library = self.libraries.get(object_name) != None
        is_variable = self.variables.get(object_name) != None
        try:
            if is_library:
                return libraryFunctionCall(
                    self.libraries.get(object_name), function_name, args
                )
            elif is_variable:
                return objectFunctionCall(
                    self.variables[object_name][1], function_name, args
                )
            else:
                raiseVariableNotDefined(object_name)
        except Exception as e:
            raise Exception(f"{object_name}: {str(e)}") from e

    def visitObjectConstant(self, ctx):
        object_name = ctx.ID(0).getText()
        constant_name = ctx.ID(1).getText()

        is_library = self.libraries.get(object_name) != None
        is_variable = self.variables.get(object_name) != None
        if is_library:
            return libraryConstant(self.libraries.get(object_name), constant_name)
        elif is_variable:
            return objectConstant(self.variables[object_name][1], constant_name)
        else:
            raiseVariableNotDefined(object_name)
