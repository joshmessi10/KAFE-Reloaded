"""CLI regression cases; the dedicated reference gate additionally requires full parsing."""
import importlib.util
import json
import shutil
import sys
from pathlib import Path

import pytest
from utils import run_child_process

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "tests/TutorLibraries"


@pytest.mark.parametrize("program", sorted(CASES.glob("*.kf")), ids=lambda program: program.name)
def test_tutor_library_example(program, tmp_path):
    filename = ROOT / "kafe-vscode/scripts/verify-library-references.py"
    specification = importlib.util.spec_from_file_location("library_reference_verifier", filename)
    assert specification is not None and specification.loader is not None
    verifier = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(verifier)
    bundle = json.loads((ROOT / "kafe-vscode/src/tutor/libraryReferences.json").read_text(encoding="utf-8"))
    name = program.relative_to(ROOT).as_posix()
    classifications = {entry["path"]: entry for entry in bundle.get("isolatedFixtures", [])}
    staged = tmp_path / name
    staged.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(program, staged)
    for asset in classifications.get(name, {}).get("assets", []):
        source = (ROOT / asset).resolve()
        assert source.is_relative_to(ROOT / "tests") and source.is_file() and not source.is_symlink()
        target = tmp_path / asset
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    stdin = program.with_suffix(".in")
    # Read the pinned-identical owned src in place for subprocess coverage while
    # all fixture-relative writes remain inside this disposable working directory.
    result = run_child_process([sys.executable, str(ROOT / "src/Kafe.py"), str(staged)], cwd=tmp_path,
                               input_text=stdin.read_text(encoding="utf-8") if stdin.is_file() else "", timeout=15)
    assert verifier.example_result(program, result), (program.name, result.returncode, result.stdout, result.stderr)
