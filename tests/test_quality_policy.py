import subprocess
import sys
from pathlib import Path


CHECKER = Path(__file__).resolve().parents[1] / "scripts" / "check_quality_policy.py"


def initialize_repository(root: Path, files: dict[str, str]) -> Path:
    subprocess.run(["git", "init", "--quiet"], cwd=root, check=True)

    for relative_path, contents in files.items():
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(contents, encoding="utf-8")

    subprocess.run(["git", "add", "--", *files], cwd=root, check=True)
    return root


def run_checker(root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CHECKER)],
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )


def test_checker_rejects_standalone_and_inline_noqa_comments(tmp_path):
    initialize_repository(
        tmp_path,
        {"sample.py": "# noqa\nvalue = 1  # noqa: F401\n"},
    )

    result = run_checker(tmp_path)

    assert result.returncode != 0
    report = result.stdout + result.stderr
    assert "sample.py:1" in report
    assert "sample.py:2" in report


def test_checker_rejects_standalone_and_inline_pyright_comments(tmp_path):
    initialize_repository(
        tmp_path,
        {
            "sample.py": (
                "# pyright: strict\n"
                "value = 1  # pyright: ignore[reportUnknownMemberType]\n"
            )
        },
    )

    result = run_checker(tmp_path)

    assert result.returncode != 0
    report = result.stdout + result.stderr
    assert "sample.py:1" in report
    assert "sample.py:2" in report


def test_checker_allows_suppression_spellings_in_string_literals(tmp_path):
    initialize_repository(
        tmp_path,
        {
            "sample.py": (
                'noqa_text = "# noqa"\n'
                'pyright_text = "# pyright: strict"\n'
                'combined_text = "# noqa and # pyright: ignore"\n'
            )
        },
    )

    result = run_checker(tmp_path)

    assert result.returncode == 0, result.stdout + result.stderr


def test_checker_fails_on_invalid_tracked_python(tmp_path):
    initialize_repository(tmp_path, {"invalid.py": "def broken(:\n    pass\n"})

    result = run_checker(tmp_path)

    assert result.returncode != 0
    assert "invalid.py" in result.stdout + result.stderr


def test_checker_fails_when_a_tracked_python_file_cannot_be_read(tmp_path):
    initialize_repository(tmp_path, {"missing.py": "value = 1\n"})
    (tmp_path / "missing.py").unlink()

    result = run_checker(tmp_path)

    assert result.returncode != 0
    assert "missing.py" in result.stdout + result.stderr
