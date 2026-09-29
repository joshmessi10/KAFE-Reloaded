# Installation

## Requirements

- Python 3.10 or later
- Git
- uv, installed using the [official instructions](https://docs.astral.sh/uv/getting-started/installation/)
- Java JDK 11 or later and ANTLR 4.13.2 for parser generation on fresh clones or after grammar changes

---

## Manual setup

### 1. Install Java JDK 11 or later

Install [Java JDK 11 or later](https://www.oracle.com/java/technologies/downloads/) and verify it with `java -version`. Java is required to generate the parser, but not to run KAFE when the generated files are present.

### 2. Clone the repository and install dependencies

```bash
git clone https://github.com/joshmessi10/KAFE-Reloaded.git
cd KAFE-Reloaded
uv sync --locked --group dev
```

KafeHF's Hugging Face integration is optional. Install it only when needed:

```bash
uv sync --locked --extra huggingface
```

### 3. Download ANTLR 4.13.2

Download the [ANTLR 4.13.2 JAR](https://www.antlr.org/download/antlr-4.13.2-complete.jar) into the repository's `src/` directory. If you store it elsewhere, use its path in the generation command below.

### 4. Generate the parser (required on a fresh clone)

From the repository root:

```bash
cd src
java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
cd ..
```

The generated files are ignored by Git. If they are missing, KAFE reports `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`.

---

## Nix development shell

The Nix Flake provides Python, uv, Java, ANTLR, and other system tools. Install Nix and enable flakes using the [official instructions](https://nixos.org/download/). Then enter the shell and install the locked Python dependencies:

```bash
nix develop
uv sync --locked --group dev
```

---

## Run a program

From the repository root:

```bash
uv run --locked python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

## Run tests

Run the complete suite or a focused test from the repository root:

```bash
uv run --locked --group dev pytest tests/
uv run --locked --group dev pytest tests/test_KafeMACHINE.py
```

`src/Makefile` requires a POSIX-compatible Make and shell. On Windows, run pytest directly with the commands above.

## Build the documentation locally

```bash
uv sync --locked --group docs --no-dev
uv run --locked --group docs --no-dev mkdocs serve
```

## Verify the installation

```bash
uv run --locked python --version
uv run --locked python -c "import antlr4"
java -version
java -jar src/antlr-4.13.2-complete.jar -version
```
