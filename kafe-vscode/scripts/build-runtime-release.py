#!/usr/bin/env python3
"""Build the pinned KAFE runtime and sidecar consumed by the VS Code extension."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
import unicodedata
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
CORPUS_MANIFEST = "kafe-vscode/reference/knowledge-corpus.json"
MAX_KNOWLEDGE_FILES = 512
MAX_KNOWLEDGE_FILE_BYTES = 256 * 1024
MAX_KNOWLEDGE_TOTAL_BYTES = 8 * 1024 * 1024
TEXT_EXTENSIONS = {".md", ".kf", ".g4", ".txt"}
RESERVED_NAME = re.compile(r"^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)", re.IGNORECASE)


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
    # Only use corpus policy committed at the requested source revision. Historical
    # releases without that policy retain the original six-section layout.
    paths = ["pyproject.toml", "uv.lock", "src", "docs"]
    if run("git", "ls-tree", "--name-only", revision, "--", CORPUS_MANIFEST, cwd=repository).stdout.strip():
        paths.append(CORPUS_MANIFEST)
    archive = run(
        "git",
        "archive",
        "--format=tar",
        revision,
        *paths,
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


def safe_segment(name):
    if (not isinstance(name, str) or not name or name in {".", ".."} or
            any(character in '/\\<>:"|?*' or ord(character) < 32 for character in name) or
            name.endswith((".", " ")) or RESERVED_NAME.match(name) or unicodedata.normalize("NFC", name) != name):
        raise ValueError(f"Unsafe KAFE knowledge corpus path segment: {name}")
    return name.lower()


def safe_relative(value):
    if not isinstance(value, str) or not value:
        raise ValueError("Invalid KAFE knowledge corpus path")
    return "/".join(safe_segment(segment) for segment in value.split("/"))


def legacy_corpus_manifest():
    return {"schemaVersion": 1, "sections": [
        {"source": f"docs/{section}", "target": section, "required": True,
         "extensions": [".md", ".kf"] if section == "examples" else [".md"]}
        for section in KNOWLEDGE_SECTIONS
    ], "files": [
        {"source": f"src/{name}", "target": f"grammar/{name}"}
        for name in ("Kafe_Grammar.g4", "Kafe_Lexer.g4")
    ]}


def validate_corpus_manifest(manifest):
    if (not isinstance(manifest, dict) or type(manifest.get("schemaVersion")) is not int or manifest.get("schemaVersion") != 1 or
            not isinstance(manifest.get("sections"), list) or not isinstance(manifest.get("files"), list)):
        raise ValueError("Invalid KAFE knowledge corpus manifest")
    targets = set()
    for entry in manifest["sections"] + manifest["files"]:
        safe_relative(entry["source"])
        target = safe_relative(entry["target"])
        if target in targets:
            raise ValueError("Duplicate KAFE knowledge corpus target")
        targets.add(target)
    for section in manifest["sections"]:
        extensions, excluded = section.get("extensions"), section.get("excludedExtensions", [])
        if (not isinstance(section.get("required"), bool) or not isinstance(extensions, list) or not extensions or
                any(extension not in TEXT_EXTENSIONS for extension in extensions) or not isinstance(excluded, list) or
                any(extension != ".svg" or extension in extensions for extension in excluded)):
            raise ValueError("Invalid KAFE knowledge corpus extension policy")
    for entry in manifest["files"]:
        if Path(entry["source"]).suffix not in TEXT_EXTENSIONS or Path(entry["target"]).suffix not in TEXT_EXTENSIONS:
            raise ValueError("Unsupported fixed KAFE knowledge corpus file")
    return manifest


def collect_knowledge_corpus(stage, manifest):
    """Select the same bounded text corpus as KnowledgeCorpus.js; never copy trees blindly."""
    validate_corpus_manifest(manifest)
    entries, spellings = [], {}
    total_bytes = nodes = 0

    def reserve(relative):
        prefix = ""
        for segment in relative.split("/"):
            safe_segment(segment)
            prefix = f"{prefix}/{segment}" if prefix else segment
            folded = prefix.lower()
            if folded in spellings and spellings[folded] != prefix:
                raise ValueError(f"Duplicate case-insensitive KAFE knowledge corpus path: {prefix}")
            spellings[folded] = prefix

    def check(source, directory):
        nonlocal nodes
        nodes += 1
        if nodes > 4096 or source.is_symlink():
            raise ValueError(f"Unsafe or excessive KAFE knowledge corpus nodes: {source}")
        if not source.exists():
            raise FileNotFoundError(source)
        if not (source.is_dir() if directory else source.is_file()):
            raise ValueError(f"KAFE knowledge input is not a regular file/directory: {source}")

    def check_source(relative, directory):
        parts = relative.split("/")
        for count in range(1, len(parts) + 1):
            check(stage.joinpath(*parts[:count]), count < len(parts) or directory)

    def add(source, relative):
        nonlocal total_bytes
        reserve(relative)
        if any(name.lower() == relative.lower() for name, _ in entries):
            raise ValueError("Duplicate KAFE knowledge corpus file")
        check(source, False)
        size = source.stat().st_size
        if size > MAX_KNOWLEDGE_FILE_BYTES:
            raise ValueError(f"KAFE knowledge file exceeds its size limit: {relative}")
        total_bytes += size
        if len(entries) >= MAX_KNOWLEDGE_FILES or total_bytes > MAX_KNOWLEDGE_TOTAL_BYTES:
            raise ValueError("KAFE knowledge corpus file or total byte limit exceeded")
        entries.append((relative, source))

    def walk(directory, prefix, section):
        for source in sorted(directory.iterdir(), key=lambda item: item.name):
            safe_segment(source.name)
            relative = f"{prefix}/{source.name}"
            reserve(relative)
            check(source, source.is_dir())
            if source.is_dir():
                walk(source, relative, section)
            elif source.suffix.lower() in section["extensions"]:
                add(source, relative)
            elif source.suffix.lower() not in section.get("excludedExtensions", []):
                raise ValueError(f"Unsupported file in KAFE learner documentation: {source}")

    check(stage, True)
    for section in manifest["sections"]:
        try:
            check_source(section["source"], True)
        except FileNotFoundError:
            if not section["required"]:
                continue
            raise
        before = len(entries)
        walk(stage / section["source"], section["target"], section)
        if section["required"] and len(entries) == before:
            raise ValueError(f"Empty required KAFE learner documentation section: {section['source']}")
    for entry in manifest["files"]:
        check_source(entry["source"], False)
        add(stage / entry["source"], entry["target"])
    return sorted(entries)


def assemble_knowledge_pack(stage):
    manifest_path = stage / CORPUS_MANIFEST
    if manifest_path.is_symlink():
        raise ValueError("Knowledge corpus manifest must not be a symbolic link")
    if manifest_path.exists():
        if manifest_path.stat().st_size > 16 * 1024:
            raise ValueError("Knowledge corpus manifest exceeds its size limit")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = legacy_corpus_manifest()
    entries = collect_knowledge_corpus(stage, manifest)
    target = stage / "knowledge-pack"
    target.mkdir()
    for relative, source in entries:
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    shutil.rmtree(stage / "docs")
    if (stage / "kafe-vscode").exists():
        shutil.rmtree(stage / "kafe-vscode")


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
