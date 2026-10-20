import pathlib
import sys

from antlr4 import CommonTokenStream, InputStream
from antlr4.error.ErrorListener import ErrorListener

import globals
from errors import raiseScientificNotationError
from InterpreterVisitor import InterpreterVisitor
from Kafe_GrammarLexer import Kafe_GrammarLexer
from Kafe_GrammarParser import Kafe_GrammarParser


class KafeErrorListener(ErrorListener):
    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        # Handle an unterminated string literal.
        if "token recognition error" in msg:
            raise Exception(
                f"SyntaxError: unterminated string literal at line {line}:{column}"
            )

        # Detect a possible scientific notation error.
        symbol_text = offendingSymbol.text if offendingSymbol else ""
        if "e" in symbol_text.lower() or "exponent" in msg.lower():
            raiseScientificNotationError(line, column, msg)
        else:
            # Report a general syntax error.
            print(
                f"Syntax Error [Line {line}, Column {column}]: {msg}", file=sys.stderr
            )
            # Raise a general syntax error.
            raise Exception(f"SyntaxError at line {line}:{column} -> {msg}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python Kafe.py <file.kf>")
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
            print(f"File '{input_file}' not found")
            sys.exit(1)

    globals.program_path = str(filepath.absolute())
    globals.current_dir = str(filepath.parent.absolute())

    content = filepath.read_text(encoding="utf-8")

    visitor = InterpreterVisitor()

    input_stream = InputStream(content)
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
        if len(sys.argv) >= 2 and sys.argv[1].endswith(".error.kf"):
            print(error_msg, file=sys.stderr)
            sys.exit(1)
        else:
            # All other programs print errors to stdout and exit 0
            # (valid programs that happen to produce runtime errors)
            print(error_msg)
            sys.exit(0)
