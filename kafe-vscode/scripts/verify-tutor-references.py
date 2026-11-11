"""Verify reviewed fixtures in temporary copies of the pinned runtime."""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

PARSE_CHECK = r'''
import sys
sys.path.insert(0, sys.argv[1])
from antlr4 import FileStream, CommonTokenStream, Token
from antlr4.error.ErrorListener import ErrorListener
from Kafe_GrammarLexer import Kafe_GrammarLexer
from Kafe_GrammarParser import Kafe_GrammarParser
class StrictListener(ErrorListener):
    def syntaxError(self, recognizer, symbol, line, column, message, exception):
        raise SyntaxError(f"{line}:{column}: {message}")
lexer = Kafe_GrammarLexer(FileStream(sys.argv[2], encoding="utf-8"))
lexer.removeErrorListeners()
lexer.addErrorListener(StrictListener())
tokens = CommonTokenStream(lexer)
parser = Kafe_GrammarParser(tokens)
parser.removeErrorListeners()
parser.addErrorListener(StrictListener())
parser.program()
tokens.fill()
if tokens.LA(1) != Token.EOF:
    raise SyntaxError("Unparsed trailing source after program")
'''


def source_fingerprint(source):
    generated = {"Kafe_GrammarLexer.py", "Kafe_GrammarParser.py", "Kafe_GrammarVisitor.py"}
    entries = []
    for filename in sorted(source.rglob("*"), key=lambda p: p.relative_to(source).as_posix()):
        relative = filename.relative_to(source)
        if filename.is_symlink():
            raise ValueError("Reference runtime must not contain symbolic links")
        if (not filename.is_file() or filename.suffix not in {".py", ".g4"} or
                "__pycache__" in relative.parts or relative.as_posix() in generated):
            continue
        text = filename.read_bytes().decode("utf-8").replace("\r\n", "\n")
        entries.append([relative.as_posix(), hashlib.sha256(text.encode()).hexdigest()])
    encoded = json.dumps(entries, ensure_ascii=False, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def validate_program(source, program):
    result = subprocess.run([sys.executable, "-c", PARSE_CHECK, str(source), str(program)],
                            capture_output=True, text=True, encoding="utf-8", timeout=15,
                            env=dict(os.environ, PYTHONWARNINGS="error", PYTHONIOENCODING="utf-8"))
    if result.returncode or result.stdout or result.stderr:
        raise ValueError("Reference must fully parse: " + result.stderr[-2000:])


def result_matches(fixture, result):
    expected_stdout = fixture.get("expectedStdout", fixture["expectedOutput"] if fixture["expectedStream"] == "stdout" else "")
    expected_stderr = fixture.get("expectedStderr", fixture["expectedOutput"] if fixture["expectedStream"] == "stderr" else "")
    return (result.returncode, result.stdout, result.stderr) == (
        fixture["expectedExitCode"], expected_stdout, expected_stderr
    )


def verify(repository=None, runtime_root=None):
    repository = Path(repository).resolve() if repository else Path(__file__).resolve().parents[2]
    bundle = json.loads((repository / "kafe-vscode/src/tutor/kafeReferences.json").read_text(encoding="utf-8"))
    selected_runtime = runtime_root or os.environ.get("KAFE_REFERENCE_RUNTIME_ROOT")
    if not selected_runtime:
        raise ValueError("Set KAFE_REFERENCE_RUNTIME_ROOT to a prepared copy of the pinned runtime revision")
    runtime = Path(selected_runtime).resolve()
    if source_fingerprint(runtime / "src") != bundle["runtimeSourceFingerprint"]:
        raise ValueError("Reference runtime source does not match the pinned revision fingerprint")
    failures = []
    environment = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8", PYTHONWARNINGS="error")
    with tempfile.TemporaryDirectory(prefix="kafe-reference-verification-") as temporary:
        for index, fixture in enumerate(bundle["fixtures"]):
            program = (repository / fixture["path"]).resolve()
            if not program.is_relative_to(repository / "tests") or not program.is_file():
                raise ValueError("Reference fixture must be a repository test program")
            if program.read_text(encoding="utf-8") != fixture["code"]:
                raise ValueError("Reference code is stale; regenerate before verification")
            expectation = program.with_suffix(".expec").read_text(encoding="utf-8")
            stdin = program.with_suffix(".in")
            actual_input = stdin.read_text(encoding="utf-8") if stdin.is_file() else ""
            if expectation != fixture["expectedOutput"] or actual_input != fixture["input"]:
                raise ValueError("Reference expectations are stale; regenerate before verification")
            case = Path(temporary) / str(index)
            shutil.copytree(runtime / "src", case / "src", ignore=shutil.ignore_patterns("__pycache__"))
            staged = case / fixture["path"]
            staged.parent.mkdir(parents=True, exist_ok=True)
            staged.write_text(fixture["code"], encoding="utf-8")
            try:
                validate_program(case / "src", staged)
                result = subprocess.run(
                    [sys.executable, str(case / "src/Kafe.py"), str(staged)],
                    input=actual_input, capture_output=True, text=True, encoding="utf-8",
                    timeout=15, cwd=case / "src", env=environment,
                )
                if not result_matches(fixture, result):
                    failures.append({"fixture": fixture["path"], "exit": result.returncode,
                                     "stdout": result.stdout[:2000], "stderr": result.stderr[:2000]})
            except (subprocess.TimeoutExpired, ValueError) as error:
                failures.append({"fixture": fixture["path"], "error": str(error)[-2000:]})
    if failures:
        print(json.dumps(failures, ensure_ascii=True, indent=2))
        raise SystemExit(1)
    print(f"Verified {len(bundle['fixtures'])} reviewed fixtures against pinned revision {bundle['runtimeSourceRevision']}: full parse, exact stdout/stderr, exit code.")


if __name__ == "__main__":
    verify()
