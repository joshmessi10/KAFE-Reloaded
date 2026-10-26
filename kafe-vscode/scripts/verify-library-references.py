"""Check reviewed library examples against the actual pinned interpreter in isolation."""
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def helper_module():
    filename = Path(__file__).with_name("verify-tutor-references.py")
    specification = importlib.util.spec_from_file_location("tutor_reference_verifier", filename)
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


USAGE = r'''
import json, sys
sys.path.insert(0, sys.argv[1])
from antlr4 import FileStream, CommonTokenStream
from Kafe_GrammarLexer import Kafe_GrammarLexer
stream = CommonTokenStream(Kafe_GrammarLexer(FileStream(sys.argv[2], encoding="utf-8")))
stream.fill()
tokens = stream.tokens
used = set()
for i in range(len(tokens)-3):
    library = tokens[i].text
    if library in ("machine", "gesha", "geshaDeep", "geshaV2") and tokens[i+1].text == "." and tokens[i+3].text == "(":
        used.add(("machine" if library == "machine" else "gesha") + "." + tokens[i+2].text)
print(json.dumps(sorted(used)))
'''


def example_result(program, result):
    invalid = program.name.endswith(".error.kf")
    base = program.with_suffix("")
    expectation = program.with_suffix(".expec").read_text(encoding="utf-8")
    stdout_file = base.with_suffix(base.suffix + ".stdout.expec")
    stderr_file = base.with_suffix(base.suffix + ".stderr.expec")
    stdout = stdout_file.read_text(encoding="utf-8") if stdout_file.is_file() else ("" if invalid else expectation)
    stderr = stderr_file.read_text(encoding="utf-8") if stderr_file.is_file() else (expectation if invalid else "")
    return (result.returncode, result.stdout, result.stderr) == (1 if invalid else 0, stdout, stderr)


def verify(repository=None, runtime_root=None):
    repository = Path(repository).resolve() if repository else Path(__file__).resolve().parents[2]
    bundle = json.loads((repository / "kafe-vscode/src/tutor/libraryReferences.json").read_text(encoding="utf-8"))
    helper = helper_module()
    runtime = Path(runtime_root or os.environ.get("KAFE_REFERENCE_RUNTIME_ROOT", repository)).resolve()
    if helper.source_fingerprint(runtime / "src") != bundle["runtimeSourceFingerprint"]:
        raise ValueError("Library evidence must execute the actual pinned runtime source")
    names = sorted({example for entry in bundle["entries"] for example in entry["examples"]})
    isolated = {item["path"]: item for item in bundle.get("isolatedFixtures", [])}
    environment = dict(os.environ, PYTHONWARNINGS="error", PYTHONIOENCODING="utf-8", PYTHONDONTWRITEBYTECODE="1")
    outcomes = {}
    with tempfile.TemporaryDirectory(prefix="kafe-library-verification-") as temporary:
        for index, name in enumerate(names):
            program = (repository / name).resolve()
            if not program.is_relative_to(repository / "tests") or not program.is_file():
                raise ValueError(f"Library example is not a repository fixture: {name}")
            case = Path(temporary) / str(index)
            shutil.copytree(runtime / "src", case / "src", ignore=shutil.ignore_patterns("__pycache__"))
            staged = case / name
            staged.parent.mkdir(parents=True, exist_ok=True)
            staged.write_bytes(program.read_bytes())
            for asset in isolated.get(name, {}).get("assets", []):
                source = (repository / asset).resolve()
                if not source.is_relative_to(repository / "tests") or not source.is_file() or source.is_symlink():
                    raise ValueError(f"Unsafe isolated library fixture asset: {asset}")
                destination = case / asset
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, destination)
            helper.validate_program(case / "src", staged)
            usage = subprocess.run([sys.executable, "-c", USAGE, str(case / "src"), str(staged)],
                                   capture_output=True, text=True, encoding="utf-8", timeout=15, env=environment)
            if usage.returncode or usage.stderr:
                raise ValueError(f"Library fixture token inventory failed: {name}")
            stdin = program.with_suffix(".in")
            result = subprocess.run([sys.executable, str(case / "src/Kafe.py"), str(staged)],
                                    input=stdin.read_text(encoding="utf-8") if stdin.is_file() else "",
                                    capture_output=True, text=True, encoding="utf-8", timeout=15,
                                    cwd=case / "src", env=environment)
            if not example_result(program, result):
                raise ValueError(f"Library example output/exit mismatch: {name}\nexit={result.returncode}\nstdout={result.stdout!r}\nstderr={result.stderr!r}")
            outcomes[name] = {"valid": not program.name.endswith(".error.kf"), "calls": set(json.loads(usage.stdout))}
    for entry in bundle["entries"]:
        if entry["kind"] not in {"function", "alias"}:
            continue
        evidence = [outcomes[name] for name in entry["examples"]]
        if entry["status"] != "unsupported" and not any(item["valid"] and entry["id"] in item["calls"] for item in evidence):
            raise ValueError(f"Callable API lacks successful direct KAFE evidence: {entry['id']}")
        if entry["status"] == "unsupported" and not entry["constraints"]:
            raise ValueError(f"Unsupported API must explain its limit: {entry['id']}")
    print(f"Verified {len(names)} isolated KAFE examples and every supported top-level MACHINE/GESHA call against the pinned runtime.")
    return len(names)


if __name__ == "__main__":
    verify()
