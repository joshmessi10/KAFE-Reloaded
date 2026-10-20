#!/usr/bin/env python3
"""Build the pinned KAFE runtime and sidecar consumed by the VS Code extension."""

import argparse
import hashlib
import json
import shutil
import subprocess
import tarfile
import tempfile
import zipfile
from pathlib import Path

KNOWLEDGE_SECTIONS = (
    "getting-started",
    "language",
    "libraries",
    "specification",
    "errors",
    "examples",
)
GENERATED_PARSER_FILES = (
    "Kafe_GrammarLexer.py",
    "Kafe_GrammarParser.py",
    "Kafe_GrammarVisitor.py",
)
ZIP_TIMESTAMP = (2020, 1, 1, 0, 0, 0)


def run(*arguments, cwd=None):
    return subprocess.run(
        arguments,
        cwd=cwd,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def checked_revision(repository, revision):
    resolved = run("git", "rev-parse", "--verify", f"{revision}^{{commit}}", cwd=repository).stdout.decode().strip()
    if len(resolved) != 40 or any(character not in "0123456789abcdef" for character in resolved):
        raise ValueError("Runtime source revision must resolve to a full Git commit SHA")
    return resolved


def extract_revision(repository, revision, destination):
    archive = run(
        "git",
        "archive",
        "--format=tar",
        revision,
        "pyproject.toml",
        "uv.lock",
        "src",
        "docs",
        cwd=repository,
    ).stdout
    archive_path = destination / "source.tar"
    archive_path.write_bytes(archive)
    with tarfile.open(archive_path, mode="r:") as source:
        for member in source.getmembers():
            if not (member.isfile() or member.isdir()):
                raise ValueError(f"Unsupported runtime source member: {member.name}")
        source.extractall(destination, filter="data")
    archive_path.unlink()


def generate_parser(stage, antlr_jar):
    run(
        "java",
        "-jar",
        str(antlr_jar),
        "-no-listener",
        "-visitor",
        "-Dlanguage=Python3",
        "Kafe_Grammar.g4",
        cwd=stage / "src",
    )
    missing = [name for name in GENERATED_PARSER_FILES if not (stage / "src" / name).is_file()]
    if missing:
        raise ValueError(f"ANTLR did not generate required parser files: {', '.join(missing)}")


def assemble_knowledge_pack(stage):
    target = stage / "knowledge-pack"
    target.mkdir()
    for section in KNOWLEDGE_SECTIONS:
        source = stage / "docs" / section
        if not source.is_dir():
            raise ValueError(f"Missing required knowledge section: docs/{section}")
        shutil.copytree(source, target / section)
    grammar = target / "grammar"
    grammar.mkdir()
    for name in ("Kafe_Grammar.g4", "Kafe_Lexer.g4"):
        shutil.copy2(stage / "src" / name, grammar / name)
    shutil.rmtree(stage / "docs")


def iter_runtime_files(stage):
    for path in sorted(stage.rglob("*"), key=lambda item: item.relative_to(stage).as_posix()):
        if path.is_symlink():
            raise ValueError(f"Runtime release cannot contain symbolic links: {path}")
        if path.is_file() and "__pycache__" not in path.parts:
            yield path


def write_zip(stage, destination):
    with zipfile.ZipFile(destination, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in iter_runtime_files(stage):
            relative = path.relative_to(stage).as_posix()
            info = zipfile.ZipInfo(relative, date_time=ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100644 & 0xFFFF) << 16
            info.flag_bits |= 0x800
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--antlr-jar", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()

    if not arguments.version or any(part == "" or not part.isdigit() for part in arguments.version.split(".")):
        raise ValueError("Runtime version must contain dot-separated integers")
    if not arguments.antlr_jar.is_file():
        raise ValueError("ANTLR 4.13.2 JAR was not found")

    repository = Path(__file__).resolve().parents[2]
    revision = checked_revision(repository, arguments.revision)
    arguments.output.mkdir(parents=True, exist_ok=True)
    archive_path = arguments.output / f"kafe-runtime-{arguments.version}.zip"
    manifest_path = arguments.output / f"kafe-runtime-{arguments.version}.manifest.json"

    with tempfile.TemporaryDirectory(prefix="kafe-runtime-build-") as temporary:
        stage = Path(temporary)
        extract_revision(repository, revision, stage)
        generate_parser(stage, arguments.antlr_jar.resolve())
        assemble_knowledge_pack(stage)
        write_zip(stage, archive_path)

    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    manifest = {
        "runtime_version": arguments.version,
        "knowledge_pack_version": arguments.version,
        "python_requirement": ">=3.11",
        "antlr_runtime_version": "4.13.2",
        "source_revision": revision,
        "archive_sha256": digest,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"archive": str(archive_path), "manifest": str(manifest_path), **manifest}, indent=2))


if __name__ == "__main__":
    main()
