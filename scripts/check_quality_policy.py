"""Reject authored type-checker and linter suppression comments."""

from __future__ import annotations

import io
import os
import re
import subprocess
import sys
import tokenize
from pathlib import Path


FORBIDDEN_COMMENT_PATTERNS = (
    re.compile(r"#\s*noqa\b", re.IGNORECASE),
    re.compile(r"#\s*pyright\s*:", re.IGNORECASE),
)


def tracked_python_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--", "*.py"],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        message = result.stderr.decode(errors="replace").strip()
        raise RuntimeError(message or "git ls-files failed")

    return [os.fsdecode(path) for path in result.stdout.split(b"\0") if path]


def inspect_python_file(filename: str) -> list[str]:
    path = Path(filename)
    try:
        with tokenize.open(path) as source_file:
            source = source_file.read()
    except (OSError, SyntaxError, UnicodeError) as error:
        return [f"{filename}:1: cannot read Python source: {error}"]

    try:
        compile(source, filename, "exec", dont_inherit=True)
    except SyntaxError as error:
        line = error.lineno or 1
        return [f"{filename}:{line}: invalid Python source: {error.msg}"]
    except ValueError as error:
        return [f"{filename}:1: invalid Python source: {error}"]

    try:
        comment_tokens = (
            token
            for token in tokenize.generate_tokens(io.StringIO(source).readline)
            if token.type == tokenize.COMMENT
        )
        findings = []
        for token in comment_tokens:
            if any(pattern.search(token.string) for pattern in FORBIDDEN_COMMENT_PATTERNS):
                findings.append(
                    f"{filename}:{token.start[0]}: forbidden noqa or pyright comment"
                )
        return findings
    except (IndentationError, SyntaxError, tokenize.TokenError) as error:
        line = error.args[1][0] if isinstance(error, tokenize.TokenError) else 1
        return [f"{filename}:{line}: cannot tokenize Python source: {error}"]


def main() -> int:
    try:
        filenames = tracked_python_files()
    except (OSError, RuntimeError) as error:
        print(f"quality policy checker: cannot list tracked Python files: {error}", file=sys.stderr)
        return 1

    findings = [finding for filename in filenames for finding in inspect_python_file(filename)]
    for finding in findings:
        print(finding, file=sys.stderr)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
