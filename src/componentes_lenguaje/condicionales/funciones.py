from errores import raiseConditionMustBeBoolean
from componentes_lenguaje.funciones.utils import ReturnValue


def ifElseExpr(self, ctx):
    cond_principal = self.visit(ctx.expr())
    if not isinstance(cond_principal, bool):
        raiseConditionMustBeBoolean("if", cond_principal)

    if cond_principal:
        self.push_scope()
        try:
            self.visit(ctx.block(0))
        except ReturnValue as rv:
            self.pop_scope()
            raise rv
        finally:
            self.pop_scope()
        return
    else:
        for elif_branch in ctx.elifBranch():
            cond_elif = self.visit(elif_branch.expr())
            if not isinstance(cond_elif, bool):
                raiseConditionMustBeBoolean("elif", cond_elif)
            if cond_elif:
                self.push_scope()
                try:
                    self.visit(elif_branch.block())
                except ReturnValue as rv:
                    self.pop_scope()
                    raise rv
                finally:
                    self.pop_scope()
                return

    if ctx.ELSE() and len(ctx.block()) > 0:
        self.push_scope()
        try:
            self.visit(ctx.block(len(ctx.block()) - 1))
        except ReturnValue as rv:
            self.pop_scope()
            raise rv
        finally:
            self.pop_scope()
