"""Reject false success and incomplete parsing in the reference evidence gate."""
import importlib.util
from pathlib import Path
import shutil
import subprocess
from subprocess import CompletedProcess

import pytest


ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("reference_verifier", ROOT / "kafe-vscode/scripts/verify-tutor-references.py")
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)
FIXTURE = {"expectedExitCode": 0, "expectedStream": "stdout", "expectedOutput": "1\n"}


def test_zero_exit_with_runtime_error_is_not_verified():
    assert not verifier.result_matches(FIXTURE, CompletedProcess([], 0, "NameError: undefined function\n", ""))


def test_unexpected_stderr_cannot_be_hidden_by_matching_output():
    assert not verifier.result_matches(FIXTURE, CompletedProcess([], 0, "1\n", "unexpected diagnostic"))


def test_error_fixture_requires_both_complete_streams():
    fixture = {"expectedExitCode": 1, "expectedStream": "stderr", "expectedOutput": "Expected error\n"}
    assert verifier.result_matches(fixture, CompletedProcess([], 1, "", "Expected error\n"))
    assert not verifier.result_matches(fixture, CompletedProcess([], 1, "unexpected prompt", "Expected error\n"))


def test_full_parser_rejects_silently_ignored_conditional_suffix(tmp_path):
    program = tmp_path / "incomplete.kf"
    program.write_text('if (True): show(1); ; else: show(2); ;', encoding="utf-8")
    with pytest.raises(ValueError, match="fully parse"):
        verifier.validate_program(ROOT / "src", program)


def test_full_parser_accepts_joined_conditional_branches(tmp_path):
    program = tmp_path / "complete.kf"
    program.write_text('if (True): show(1); else: show(2); ;', encoding="utf-8")
    verifier.validate_program(ROOT / "src", program)


def test_unknown_runtime_cannot_be_presented_as_pinned(tmp_path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src/Kafe.py").write_text("# different interpreter", encoding="utf-8")
    with pytest.raises(ValueError, match="pinned"):
        verifier.verify(ROOT, tmp_path)


def test_source_fingerprint_matches_javascript_for_nested_and_hidden_files(tmp_path):
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js is required for the cross-language fingerprint check")
    source = tmp_path / "src"
    (source / "nested").mkdir(parents=True)
    (source / "__pycache__").mkdir()
    (source / "Kafe.py").write_bytes(b"# interpreter\r\n")
    (source / "Kafe_GrammarLexer.py").write_text("# generated", encoding="utf-8")
    nested = source / "nested/Kafe_GrammarLexer.py"
    nested.write_text("# ordinary nested source", encoding="utf-8")
    (source / ".hidden.py").write_text("# hidden source", encoding="utf-8")
    (source / "__pycache__/ignored.py").write_text("# cache", encoding="utf-8")
    (source / "Kafe_Grammar.g4").write_bytes(b"grammar Kafe_Grammar;\r\n")
    builder = ROOT / "kafe-vscode/scripts/build-tutor-references.cjs"

    def javascript_fingerprint():
        return subprocess.run(
            [node, "-e", "process.stdout.write(require(process.argv[1]).sourceFingerprint(process.argv[2]))",
             str(builder), str(source)],
            check=True, capture_output=True, text=True, encoding="utf-8", timeout=15,
        ).stdout

    original = javascript_fingerprint()
    assert verifier.source_fingerprint(source) == original
    nested.write_text("# changed ordinary nested source", encoding="utf-8")
    changed = javascript_fingerprint()
    assert changed != original
    assert verifier.source_fingerprint(source) == changed
