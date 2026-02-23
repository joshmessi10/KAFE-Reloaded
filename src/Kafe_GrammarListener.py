# Generated from Kafe_Grammar.g4 by ANTLR 4.13.2
from antlr4 import *
if "." in __name__:
    from .Kafe_GrammarParser import Kafe_GrammarParser
else:
    from Kafe_GrammarParser import Kafe_GrammarParser

# This class defines a complete listener for a parse tree produced by Kafe_GrammarParser.
class Kafe_GrammarListener(ParseTreeListener):

    # Enter a parse tree produced by Kafe_GrammarParser#program.
    def enterProgram(self, ctx:Kafe_GrammarParser.ProgramContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#program.
    def exitProgram(self, ctx:Kafe_GrammarParser.ProgramContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#simpleImport.
    def enterSimpleImport(self, ctx:Kafe_GrammarParser.SimpleImportContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#simpleImport.
    def exitSimpleImport(self, ctx:Kafe_GrammarParser.SimpleImportContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#stmt.
    def enterStmt(self, ctx:Kafe_GrammarParser.StmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#stmt.
    def exitStmt(self, ctx:Kafe_GrammarParser.StmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#block.
    def enterBlock(self, ctx:Kafe_GrammarParser.BlockContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#block.
    def exitBlock(self, ctx:Kafe_GrammarParser.BlockContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#objectFunctionCall.
    def enterObjectFunctionCall(self, ctx:Kafe_GrammarParser.ObjectFunctionCallContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#objectFunctionCall.
    def exitObjectFunctionCall(self, ctx:Kafe_GrammarParser.ObjectFunctionCallContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#objectConstant.
    def enterObjectConstant(self, ctx:Kafe_GrammarParser.ObjectConstantContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#objectConstant.
    def exitObjectConstant(self, ctx:Kafe_GrammarParser.ObjectConstantContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#varDecl.
    def enterVarDecl(self, ctx:Kafe_GrammarParser.VarDeclContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#varDecl.
    def exitVarDecl(self, ctx:Kafe_GrammarParser.VarDeclContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#assignStmt.
    def enterAssignStmt(self, ctx:Kafe_GrammarParser.AssignStmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#assignStmt.
    def exitAssignStmt(self, ctx:Kafe_GrammarParser.AssignStmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#indexedAssignStmt.
    def enterIndexedAssignStmt(self, ctx:Kafe_GrammarParser.IndexedAssignStmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#indexedAssignStmt.
    def exitIndexedAssignStmt(self, ctx:Kafe_GrammarParser.IndexedAssignStmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#indexing.
    def enterIndexing(self, ctx:Kafe_GrammarParser.IndexingContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#indexing.
    def exitIndexing(self, ctx:Kafe_GrammarParser.IndexingContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#functionDecl.
    def enterFunctionDecl(self, ctx:Kafe_GrammarParser.FunctionDeclContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#functionDecl.
    def exitFunctionDecl(self, ctx:Kafe_GrammarParser.FunctionDeclContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#paramList.
    def enterParamList(self, ctx:Kafe_GrammarParser.ParamListContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#paramList.
    def exitParamList(self, ctx:Kafe_GrammarParser.ParamListContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#simpleParam.
    def enterSimpleParam(self, ctx:Kafe_GrammarParser.SimpleParamContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#simpleParam.
    def exitSimpleParam(self, ctx:Kafe_GrammarParser.SimpleParamContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#functionParam.
    def enterFunctionParam(self, ctx:Kafe_GrammarParser.FunctionParamContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#functionParam.
    def exitFunctionParam(self, ctx:Kafe_GrammarParser.FunctionParamContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#paramList_typeDecl.
    def enterParamList_typeDecl(self, ctx:Kafe_GrammarParser.ParamList_typeDeclContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#paramList_typeDecl.
    def exitParamList_typeDecl(self, ctx:Kafe_GrammarParser.ParamList_typeDeclContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#functionCall.
    def enterFunctionCall(self, ctx:Kafe_GrammarParser.FunctionCallContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#functionCall.
    def exitFunctionCall(self, ctx:Kafe_GrammarParser.FunctionCallContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#argList.
    def enterArgList(self, ctx:Kafe_GrammarParser.ArgListContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#argList.
    def exitArgList(self, ctx:Kafe_GrammarParser.ArgListContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#exprArgument.
    def enterExprArgument(self, ctx:Kafe_GrammarParser.ExprArgumentContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#exprArgument.
    def exitExprArgument(self, ctx:Kafe_GrammarParser.ExprArgumentContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#lambdaArgument.
    def enterLambdaArgument(self, ctx:Kafe_GrammarParser.LambdaArgumentContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#lambdaArgument.
    def exitLambdaArgument(self, ctx:Kafe_GrammarParser.LambdaArgumentContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#lambdaExpr.
    def enterLambdaExpr(self, ctx:Kafe_GrammarParser.LambdaExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#lambdaExpr.
    def exitLambdaExpr(self, ctx:Kafe_GrammarParser.LambdaExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#returnStmt.
    def enterReturnStmt(self, ctx:Kafe_GrammarParser.ReturnStmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#returnStmt.
    def exitReturnStmt(self, ctx:Kafe_GrammarParser.ReturnStmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#showStmt.
    def enterShowStmt(self, ctx:Kafe_GrammarParser.ShowStmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#showStmt.
    def exitShowStmt(self, ctx:Kafe_GrammarParser.ShowStmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#pourStmt.
    def enterPourStmt(self, ctx:Kafe_GrammarParser.PourStmtContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#pourStmt.
    def exitPourStmt(self, ctx:Kafe_GrammarParser.PourStmtContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#appendCall.
    def enterAppendCall(self, ctx:Kafe_GrammarParser.AppendCallContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#appendCall.
    def exitAppendCall(self, ctx:Kafe_GrammarParser.AppendCallContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#removeCall.
    def enterRemoveCall(self, ctx:Kafe_GrammarParser.RemoveCallContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#removeCall.
    def exitRemoveCall(self, ctx:Kafe_GrammarParser.RemoveCallContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#lenCall.
    def enterLenCall(self, ctx:Kafe_GrammarParser.LenCallContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#lenCall.
    def exitLenCall(self, ctx:Kafe_GrammarParser.LenCallContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#ifElseExpr.
    def enterIfElseExpr(self, ctx:Kafe_GrammarParser.IfElseExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#ifElseExpr.
    def exitIfElseExpr(self, ctx:Kafe_GrammarParser.IfElseExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#elifBranch.
    def enterElifBranch(self, ctx:Kafe_GrammarParser.ElifBranchContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#elifBranch.
    def exitElifBranch(self, ctx:Kafe_GrammarParser.ElifBranchContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#whileLoop.
    def enterWhileLoop(self, ctx:Kafe_GrammarParser.WhileLoopContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#whileLoop.
    def exitWhileLoop(self, ctx:Kafe_GrammarParser.WhileLoopContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#forLoop.
    def enterForLoop(self, ctx:Kafe_GrammarParser.ForLoopContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#forLoop.
    def exitForLoop(self, ctx:Kafe_GrammarParser.ForLoopContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#expr.
    def enterExpr(self, ctx:Kafe_GrammarParser.ExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#expr.
    def exitExpr(self, ctx:Kafe_GrammarParser.ExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#logicExpr.
    def enterLogicExpr(self, ctx:Kafe_GrammarParser.LogicExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#logicExpr.
    def exitLogicExpr(self, ctx:Kafe_GrammarParser.LogicExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#equalityExpr.
    def enterEqualityExpr(self, ctx:Kafe_GrammarParser.EqualityExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#equalityExpr.
    def exitEqualityExpr(self, ctx:Kafe_GrammarParser.EqualityExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#relationalExpr.
    def enterRelationalExpr(self, ctx:Kafe_GrammarParser.RelationalExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#relationalExpr.
    def exitRelationalExpr(self, ctx:Kafe_GrammarParser.RelationalExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#additiveExpr.
    def enterAdditiveExpr(self, ctx:Kafe_GrammarParser.AdditiveExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#additiveExpr.
    def exitAdditiveExpr(self, ctx:Kafe_GrammarParser.AdditiveExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#multiplicativeExpr.
    def enterMultiplicativeExpr(self, ctx:Kafe_GrammarParser.MultiplicativeExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#multiplicativeExpr.
    def exitMultiplicativeExpr(self, ctx:Kafe_GrammarParser.MultiplicativeExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#powerExpr.
    def enterPowerExpr(self, ctx:Kafe_GrammarParser.PowerExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#powerExpr.
    def exitPowerExpr(self, ctx:Kafe_GrammarParser.PowerExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#unaryExpresion.
    def enterUnaryExpresion(self, ctx:Kafe_GrammarParser.UnaryExpresionContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#unaryExpresion.
    def exitUnaryExpresion(self, ctx:Kafe_GrammarParser.UnaryExpresionContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#primaryExpresion.
    def enterPrimaryExpresion(self, ctx:Kafe_GrammarParser.PrimaryExpresionContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#primaryExpresion.
    def exitPrimaryExpresion(self, ctx:Kafe_GrammarParser.PrimaryExpresionContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#floatCastExpr.
    def enterFloatCastExpr(self, ctx:Kafe_GrammarParser.FloatCastExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#floatCastExpr.
    def exitFloatCastExpr(self, ctx:Kafe_GrammarParser.FloatCastExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#objectExpr.
    def enterObjectExpr(self, ctx:Kafe_GrammarParser.ObjectExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#objectExpr.
    def exitObjectExpr(self, ctx:Kafe_GrammarParser.ObjectExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#intCastExpr.
    def enterIntCastExpr(self, ctx:Kafe_GrammarParser.IntCastExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#intCastExpr.
    def exitIntCastExpr(self, ctx:Kafe_GrammarParser.IntCastExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#lambdaExpresion.
    def enterLambdaExpresion(self, ctx:Kafe_GrammarParser.LambdaExpresionContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#lambdaExpresion.
    def exitLambdaExpresion(self, ctx:Kafe_GrammarParser.LambdaExpresionContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#indexingExpr.
    def enterIndexingExpr(self, ctx:Kafe_GrammarParser.IndexingExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#indexingExpr.
    def exitIndexingExpr(self, ctx:Kafe_GrammarParser.IndexingExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#strCastExpr.
    def enterStrCastExpr(self, ctx:Kafe_GrammarParser.StrCastExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#strCastExpr.
    def exitStrCastExpr(self, ctx:Kafe_GrammarParser.StrCastExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#lenCallExpr.
    def enterLenCallExpr(self, ctx:Kafe_GrammarParser.LenCallExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#lenCallExpr.
    def exitLenCallExpr(self, ctx:Kafe_GrammarParser.LenCallExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#parenExpr.
    def enterParenExpr(self, ctx:Kafe_GrammarParser.ParenExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#parenExpr.
    def exitParenExpr(self, ctx:Kafe_GrammarParser.ParenExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#boolCastExpr.
    def enterBoolCastExpr(self, ctx:Kafe_GrammarParser.BoolCastExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#boolCastExpr.
    def exitBoolCastExpr(self, ctx:Kafe_GrammarParser.BoolCastExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#pourExpr.
    def enterPourExpr(self, ctx:Kafe_GrammarParser.PourExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#pourExpr.
    def exitPourExpr(self, ctx:Kafe_GrammarParser.PourExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#literalExpr.
    def enterLiteralExpr(self, ctx:Kafe_GrammarParser.LiteralExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#literalExpr.
    def exitLiteralExpr(self, ctx:Kafe_GrammarParser.LiteralExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#functionCallExpr.
    def enterFunctionCallExpr(self, ctx:Kafe_GrammarParser.FunctionCallExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#functionCallExpr.
    def exitFunctionCallExpr(self, ctx:Kafe_GrammarParser.FunctionCallExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#rangeExpr.
    def enterRangeExpr(self, ctx:Kafe_GrammarParser.RangeExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#rangeExpr.
    def exitRangeExpr(self, ctx:Kafe_GrammarParser.RangeExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#idExpr.
    def enterIdExpr(self, ctx:Kafe_GrammarParser.IdExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#idExpr.
    def exitIdExpr(self, ctx:Kafe_GrammarParser.IdExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#intLiteral.
    def enterIntLiteral(self, ctx:Kafe_GrammarParser.IntLiteralContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#intLiteral.
    def exitIntLiteral(self, ctx:Kafe_GrammarParser.IntLiteralContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#floatLiteral.
    def enterFloatLiteral(self, ctx:Kafe_GrammarParser.FloatLiteralContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#floatLiteral.
    def exitFloatLiteral(self, ctx:Kafe_GrammarParser.FloatLiteralContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#stringLiteral.
    def enterStringLiteral(self, ctx:Kafe_GrammarParser.StringLiteralContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#stringLiteral.
    def exitStringLiteral(self, ctx:Kafe_GrammarParser.StringLiteralContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#boolLiteral.
    def enterBoolLiteral(self, ctx:Kafe_GrammarParser.BoolLiteralContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#boolLiteral.
    def exitBoolLiteral(self, ctx:Kafe_GrammarParser.BoolLiteralContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#listLiteralExpr.
    def enterListLiteralExpr(self, ctx:Kafe_GrammarParser.ListLiteralExprContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#listLiteralExpr.
    def exitListLiteralExpr(self, ctx:Kafe_GrammarParser.ListLiteralExprContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#listLiteral.
    def enterListLiteral(self, ctx:Kafe_GrammarParser.ListLiteralContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#listLiteral.
    def exitListLiteral(self, ctx:Kafe_GrammarParser.ListLiteralContext):
        pass


    # Enter a parse tree produced by Kafe_GrammarParser#typeDecl.
    def enterTypeDecl(self, ctx:Kafe_GrammarParser.TypeDeclContext):
        pass

    # Exit a parse tree produced by Kafe_GrammarParser#typeDecl.
    def exitTypeDecl(self, ctx:Kafe_GrammarParser.TypeDeclContext):
        pass



del Kafe_GrammarParser