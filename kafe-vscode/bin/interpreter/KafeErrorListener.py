from antlr4.error.ErrorListener import ErrorListener

class KafeErrorListener(ErrorListener):

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):

        # Error de string sin cerrar
        if "token recognition error" in msg:
            raise Exception(
                f"SyntaxError: unterminated string literal at line {line}:{column}"
            )

        # Error genérico de sintaxis
        raise Exception(
            f"SyntaxError at line {line}:{column} -> {msg}"
        )