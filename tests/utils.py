import os
import re
import subprocess
import sys
from typing import Sequence


def get_kafe_path():
    """Get the path to Kafe.py relative to the tests directory."""
    return os.path.join(os.path.dirname(__file__), "..", "src", "Kafe.py")


def get_src_dir():
    """Get the src directory path."""
    return os.path.join(os.path.dirname(__file__), "..", "src")


def build_child_environment():
    """Copy the current environment and promote all Python warnings to errors."""
    child_environment = os.environ.copy()
    child_environment["PYTHONWARNINGS"] = "error"
    return child_environment


def run_child_process(command: Sequence[str], *, cwd, input_text=""):
    """Run a child Python process while retaining its complete text result."""
    return subprocess.run(
        list(command),
        capture_output=True,
        text=True,
        input=input_text,
        cwd=cwd,
        env=build_child_environment(),
    )


def run_kafe_program(program, input_text=""):
    """Run a KAFE fixture with the existing CLI and src working directory."""
    return run_child_process(
        [sys.executable, get_kafe_path(), program],
        cwd=get_src_dir(),
        input_text=input_text,
    )


def normalize_child_output(output, repo_root=None):
    """Replace only the absolute checkout root in captured child output."""
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    else:
        repo_root = os.path.abspath(repo_root)
    root_pattern = re.escape(repo_root) + r"(?=$|[\\/]|[^\w.-])"
    return re.sub(root_pattern, "<REPO>", output)


def _process_failure_message(
    program,
    expected_returncode,
    expected_stdout,
    expected_stderr,
    result,
):
    return (
        f"Unexpected child result for {program}\n"
        f"Expected return code: {expected_returncode}\n"
        f"Actual return code: {result.returncode}\n"
        f"Expected stdout: {expected_stdout!r}\n"
        f"Actual stdout: {normalize_child_output(result.stdout)!r}\n"
        f"Expected stderr: {expected_stderr!r}\n"
        f"Actual stderr: {normalize_child_output(result.stderr)!r}"
    )


def assert_valid_kafe_result(result, program, expected_stdout):
    """Require a valid fixture to exit cleanly with exact stdout and no stderr."""
    expected_stdout = normalize_child_output(expected_stdout)
    actual_stdout = normalize_child_output(result.stdout)
    actual_stderr = normalize_child_output(result.stderr)
    if result.returncode != 0 or actual_stdout != expected_stdout or actual_stderr:
        raise AssertionError(
            _process_failure_message(program, 0, expected_stdout, "", result)
        )


def assert_invalid_kafe_result(result, program, expected_final_error):
    """Require exact invalid-fixture streams and the existing semantic error line."""
    program_base = program[:-3]
    stdout_path = program_base + ".stdout.expec"
    stderr_path = program_base + ".stderr.expec"
    semantic_error = normalize_child_output(expected_final_error)

    expected_stdout = ""
    if os.path.isfile(stdout_path):
        with open(stdout_path, encoding="utf-8") as expected_file:
            expected_stdout = expected_file.read()
    with open(stderr_path, encoding="utf-8") as expected_file:
        expected_stderr = expected_file.read()

    expected_stdout = normalize_child_output(expected_stdout)
    expected_stderr = normalize_child_output(expected_stderr)
    actual_stdout = normalize_child_output(result.stdout)
    actual_stderr = normalize_child_output(result.stderr)
    expected_error_lines = semantic_error.splitlines()
    actual_error_lines = actual_stderr.splitlines()
    expected_final_line = expected_error_lines[-1] if expected_error_lines else ""
    actual_final_line = actual_error_lines[-1] if actual_error_lines else ""

    if (
        result.returncode != 1
        or actual_stdout != expected_stdout
        or actual_stderr != expected_stderr
        or actual_final_line != expected_final_line
    ):
        message = _process_failure_message(
            program, 1, expected_stdout, expected_stderr, result
        )
        message += (
            f"\nExpected final KAFE diagnostic: {expected_final_line!r}"
            f"\nActual final KAFE diagnostic: {actual_final_line!r}"
        )
        raise AssertionError(message)


def get_programs(directory_path):
    """Find valid .kf programs recursively, excluding .error.kf cases."""
    if directory_path.startswith("../tests/"):
        directory_path = os.path.join(os.path.dirname(__file__), directory_path[len("../tests/"):])
    program_paths = []
    for root, dirs, files in os.walk(directory_path):
        for filename in files:
            if filename.endswith(".kf") and not filename.endswith(".error.kf"):
                base = filename[:-3]
                program_paths.append(os.path.join(root, base))
    return program_paths


def get_invalid_programs(directory_path):
    """Find invalid .error.kf programs recursively."""
    if directory_path.startswith("../tests/"):
        directory_path = os.path.join(os.path.dirname(__file__), directory_path[len("../tests/"):])
    program_paths = []
    for root, dirs, files in os.walk(directory_path):
        for filename in files:
            if filename.endswith(".error.kf"):
                base = filename[:-3]
                program_paths.append(os.path.join(root, base))
    return program_paths


def get_parameters(program_bases):
    for base in program_bases:
        program = base + ".kf"
        input_path = base + ".in"
        expected_output_path = base + ".expec"

        input_text = ""
        if os.path.isfile(input_path):
            with open(input_path, encoding="utf-8") as f:
                input_text = f.read()

        expected_stdout = ""
        if os.path.isfile(expected_output_path):
            with open(expected_output_path, encoding="utf-8") as f:
                expected_stdout = f.read()

        yield program, input_text, expected_stdout
