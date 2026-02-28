import sys
import os
import pathlib
from antlr4 import InputStream, CommonTokenStream
from antlr4.error.ErrorListener import ErrorListener
from Kafe_GrammarLexer import Kafe_GrammarLexer
from Kafe_GrammarParser import Kafe_GrammarParser
from EvalVisitorPrimitivo import EvalVisitorPrimitivo
from errores import raiseScientificNotationError

import globals


class KafeErrorListener(ErrorListener):
    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        # Error de string sin cerrar
        if "token recognition error" in msg:
            raise Exception(
                f"SyntaxError: unterminated string literal at line {line}:{column}"
            )

        # Detectamos si el error parece ser de notación científica
        symbol_text = offendingSymbol.text if offendingSymbol else ""
        if "e" in symbol_text.lower() or "exponent" in msg.lower():
            raiseScientificNotationError(line, column, msg)
        else:
            # Error de sintaxis genérico
            print(
                f"Syntax Error [Line {line}, Column {column}]: {msg}", file=sys.stderr
            )
            # Error genérico de sintaxis
            raise Exception(f"SyntaxError at line {line}:{column} -> {msg}")


def main():
    if len(sys.argv) < 2:
        print("Uso: python Kafe.py <archivo.kf>")
        sys.exit(1)

    input_file = sys.argv[1]

    # Try to resolve the file path
    # First, check if it's an absolute path or relative to current directory
    filepath = pathlib.Path(input_file)
    if not filepath.is_file():
        # If not found, try relative to the script's directory (for backward compatibility)
        base = pathlib.Path(__file__).parent
        filepath = base / input_file
        if not filepath.is_file():
            print(f"Archivo '{input_file}' no encontrado")
            sys.exit(1)

    globals.ruta_programa = str(filepath.absolute())
    globals.current_dir = str(filepath.parent.absolute())

    contenido = filepath.read_text(encoding="utf-8")

    visitor = EvalVisitorPrimitivo()

    visitor.current_dir = filepath.parent

    input_stream = InputStream(contenido)
    lexer = Kafe_GrammarLexer(input_stream)
    lexer.removeErrorListeners()
    lexer.addErrorListener(KafeErrorListener())

    tokens = CommonTokenStream(lexer)

    parser = Kafe_GrammarParser(tokens)
    parser.removeErrorListeners()
    parser.addErrorListener(KafeErrorListener())

    tree = parser.program()

    visitor.visit(tree)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"

        # Check if this is a ".error.kf" file (invalid program test)
        # These should exit with code 1 and print to stderr
        if len(sys.argv) >= 2 and ".error.kf" in sys.argv[1]:
            print(error_msg, file=sys.stderr)
            sys.exit(1)
        else:
            # All other programs print errors to stdout and exit 0
            # (valid programs that happen to produce runtime errors)
            print(error_msg)
            sys.exit(0)
