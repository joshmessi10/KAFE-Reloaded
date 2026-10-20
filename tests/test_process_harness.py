import importlib
import os
import subprocess
import sys
import warnings

import pytest
import utils


def test_interpreter_entrypoint_can_be_imported_without_running_cli(
    monkeypatch, capsys
):
    monkeypatch.syspath_prepend(utils.get_src_dir())

    kafe = importlib.import_module("Kafe")

    assert callable(kafe.main)
    assert kafe.__file__ == utils.get_kafe_path()
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == ""


def test_pytest_warning_policy_raises_on_python_warning():
    with pytest.raises(UserWarning, match="parent warning"):
        warnings.warn("controlled parent warning", UserWarning, stacklevel=2)


def test_build_child_environment_copies_parent_and_promotes_warnings(monkeypatch):
    monkeypatch.setenv("KAFE_HARNESS_SENTINEL", "keep-me")
    monkeypatch.setenv("PYTHONWARNINGS", "default")
    monkeypatch.setenv("PYTHONIOENCODING", "ascii")

    child_env = utils.build_child_environment()

    assert child_env is not os.environ
    assert child_env["KAFE_HARNESS_SENTINEL"] == "keep-me"
    assert child_env["PYTHONWARNINGS"] == "error"
    assert child_env["PYTHONIOENCODING"] == "utf-8"
    assert os.environ["PYTHONWARNINGS"] == "default"
    assert os.environ["PYTHONIOENCODING"] == "ascii"


def test_run_child_process_captures_complete_streams_input_and_exit_code(tmp_path):
    code = (
        "import sys\n"
        "print('stdout first')\n"
        "print('stdout second')\n"
        "print('input=' + sys.stdin.read(), end='')\n"
        "print('stderr first', file=sys.stderr)\n"
        "print('stderr second', file=sys.stderr)\n"
        "sys.exit(7)\n"
    )

    result = utils.run_child_process(
        [sys.executable, "-c", code],
        cwd=str(tmp_path),
        input_text="payload\n",
    )

    assert result.returncode == 7
    assert result.stdout == "stdout first\nstdout second\ninput=payload\n"
    assert result.stderr == "stderr first\nstderr second\n"


def test_run_child_process_turns_child_warning_into_failure(tmp_path):
    code = "import warnings; warnings.warn('controlled child warning', UserWarning)"

    result = utils.run_child_process(
        [sys.executable, "-c", code],
        cwd=str(tmp_path),
    )

    assert result.returncode != 0
    assert "UserWarning: controlled child warning" in result.stderr


def test_run_child_process_decodes_utf8_child_output(tmp_path, monkeypatch):
    monkeypatch.setenv("PYTHONUTF8", "1")

    result = utils.run_child_process(
        [sys.executable, "-c", "print('UTF-8 — output')"],
        cwd=str(tmp_path),
    )

    assert result.stdout == "UTF-8 — output\n"


def test_normalize_child_output_replaces_repo_root_and_preserves_other_paths(tmp_path):
    repo_root = str(tmp_path)
    inside_path = os.path.join(repo_root, "fixtures", "case.kf")
    adjacent_checkout = repo_root + "-copy" + os.sep + "fixtures" + os.sep + "case.kf"
    outside_path = str(tmp_path.parent / "other-checkout" / "case.kf")
    output = f"{repo_root}\n{inside_path}\n{adjacent_checkout}\n{outside_path}\n"

    normalized = utils.normalize_child_output(output, repo_root=repo_root)

    assert normalized == (
        f"<REPO>\n"
        f"<REPO>{os.sep}fixtures{os.sep}case.kf\n"
        f"{adjacent_checkout}\n"
        f"{outside_path}\n"
    )


def test_valid_result_requires_success_exact_stdout_and_empty_stderr(tmp_path):
    program = tmp_path / "valid.kf"
    program.write_text("", encoding="utf-8")
    result = subprocess.CompletedProcess(["kafe"], 0, "expected output\n", "")

    utils.assert_valid_kafe_result(result, str(program), "expected output\n")

    noisy_result = subprocess.CompletedProcess(
        ["kafe"],
        0,
        "expected output\n",
        "unexpected warning\n",
    )
    with pytest.raises(AssertionError) as exc_info:
        utils.assert_valid_kafe_result(noisy_result, str(program), "expected output\n")

    message = str(exc_info.value)
    assert str(program) in message
    assert "unexpected warning" in message


def test_valid_result_rejects_nonzero_exit_with_matching_streams(tmp_path):
    program = tmp_path / "valid.kf"
    program.write_text("", encoding="utf-8")
    result = subprocess.CompletedProcess(["kafe"], 1, "expected output\n", "")

    with pytest.raises(AssertionError) as exc_info:
        utils.assert_valid_kafe_result(result, str(program), "expected output\n")

    message = str(exc_info.value)
    assert "Expected return code: 0" in message
    assert "Actual return code: 1" in message


def _write_invalid_fixture(directory, *, expected_stderr, expected_error, expected_stdout=None):
    program = directory / "case.error.kf"
    program.write_text("", encoding="utf-8")
    (directory / "case.error.stderr.expec").write_text(expected_stderr, encoding="utf-8")
    (directory / "case.error.expec").write_text(expected_error, encoding="utf-8")
    if expected_stdout is not None:
        (directory / "case.error.stdout.expec").write_text(expected_stdout, encoding="utf-8")
    return str(program)


def test_invalid_result_checks_complete_streams_and_semantic_final_diagnostic(tmp_path):
    program = _write_invalid_fixture(
        tmp_path,
        expected_stderr="earlier diagnostic\nsemantic error\n",
        expected_error="semantic error\n",
        expected_stdout="training output\n",
    )
    result = subprocess.CompletedProcess(
        ["kafe"],
        1,
        "training output\n",
        "earlier diagnostic\nsemantic error\n",
    )

    utils.assert_invalid_kafe_result(result, program, "semantic error\n")


def test_invalid_result_requires_full_stderr_sidecar(tmp_path):
    program = tmp_path / "missing.error.kf"
    program.write_text("", encoding="utf-8")
    (tmp_path / "missing.error.expec").write_text("semantic error\n", encoding="utf-8")
    result = subprocess.CompletedProcess(["kafe"], 1, "", "semantic error\n")

    with pytest.raises(FileNotFoundError, match="error.stderr.expec"):
        utils.assert_invalid_kafe_result(result, str(program), "semantic error\n")


def test_invalid_result_rejects_stream_mismatch_and_reports_full_values(tmp_path):
    program = _write_invalid_fixture(
        tmp_path,
        expected_stderr="earlier diagnostic\nsemantic error\n",
        expected_error="semantic error\n",
    )
    result = subprocess.CompletedProcess(
        ["kafe"],
        1,
        "unexpected stdout\n",
        "earlier diagnostic\nsemantic error\n",
    )

    with pytest.raises(AssertionError) as exc_info:
        utils.assert_invalid_kafe_result(result, program, "semantic error\n")

    message = str(exc_info.value)
    assert program in message
    assert "expected stdout" in message
    assert "unexpected stdout" in message
    assert repr("earlier diagnostic\nsemantic error\n") in message


def test_invalid_result_checks_semantic_error_even_when_full_stream_matches(tmp_path):
    program = _write_invalid_fixture(
        tmp_path,
        expected_stderr="earlier diagnostic\nactual final line\n",
        expected_error="expected semantic error\n",
    )
    result = subprocess.CompletedProcess(
        ["kafe"],
        1,
        "",
        "earlier diagnostic\nactual final line\n",
    )

    with pytest.raises(AssertionError, match="final KAFE diagnostic"):
        utils.assert_invalid_kafe_result(result, program, "expected semantic error\n")
