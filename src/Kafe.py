import sys
import os
import pathlib
from antlr4 import InputStream, CommonTokenStream
from Kafe_GrammarLexer import Kafe_GrammarLexer
from Kafe_GrammarParser import Kafe_GrammarParser
from EvalVisitorPrimitivo import EvalVisitorPrimitivo
from KafeErrorListener import KafeErrorListener

import globals

def main():
    if len(sys.argv) < 2:
        print("Uso: python Kafe.py <archivo.kf>")
        sys.exit(1)

    base = pathlib.Path(__file__).parent
    input_file = sys.argv[1]
    filepath = base / input_file
    if not filepath.is_file():
        print(f"Archivo '{filepath}' no encontrado")
        sys.exit(1)

    globals.ruta_programa = os.path.abspath(input_file)
    globals.current_dir = os.path.dirname(globals.ruta_programa)

    contenido = filepath.read_text(encoding='utf-8')

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

    if parser.getNumberOfSyntaxErrors() > 0:
        raise Exception("Syntax Error detected by parser")

    if tokens.LA(1) != -1: 
        token_name = tokens.LT(1).text
        line = tokens.LT(1).line
        column = tokens.LT(1).column
        raise Exception(f"Syntax Error: Unexpected token '{token_name}' at line {line}:{column}")

    visitor.visit(tree)


if __name__ == "__main__":
    main()
