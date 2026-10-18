"""Executable evidence for the small bundled Tutor fundamentals."""
from pathlib import Path
import subprocess
import sys

import pytest


CASES = Path(__file__).parent / "TutorReferences"


@pytest.mark.parametrize("program", sorted(CASES.glob("*.kf")), ids=lambda p: p.name)
def test_tutor_reference(program):
    root = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        [sys.executable, str(root / "src" / "Kafe.py"), str(program.resolve())],
        input=program.with_suffix(".in").read_text(encoding="utf-8") if program.with_suffix(".in").is_file() else "",
        capture_output=True, text=True, timeout=15, cwd=root,
    )
    expected = program.with_suffix(".expec").read_text(encoding="utf-8")
    invalid = program.name.endswith(".error.kf")
    assert result.returncode == (1 if invalid else 0)
    assert result.stdout == ("" if invalid else expected)
    assert result.stderr == (expected if invalid else "")
