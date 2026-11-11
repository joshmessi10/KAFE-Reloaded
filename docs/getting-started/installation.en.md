# Installation

## The idea in one sentence

To use KAFE you only need **Visual Studio Code** and the **KAFE - Neural Language Suite** extension. The extension prepares everything else for you.

## An everyday comparison

Think about a **rented kitchen that is already equipped**. You arrive, open the door, and the stove, the pots and the ingredients are already there. You do not have to buy or install anything else: you just cook.

- **Visual Studio Code** (VS Code) is the kitchen: a **code editor**, a program for writing and running programs.
- The **KAFE extension** is the kitchen equipment: it teaches VS Code to understand KAFE, color your code and run it.
- The **runtime** is the stove: the engine that makes your programs work. The extension installs it by itself, in a private place.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-start-instalar.svg"
<figcaption>The five steps: 1) install VS Code, 2) search for and install the KAFE extension, 3) open a folder and trust it, 4) wait while the runtime is prepared and 5) create a .kf file and run it.</figcaption>
</figure>

## What you need

- A computer with Windows (x64), macOS (Intel or Apple Silicon) or Linux (x64).
- **Visual Studio Code 1.96.0** or newer.
- An internet connection the first time, so the extension can download its runtime.

You do not need to install Python, Java or any other tool.

## Step 1: install Visual Studio Code

Download VS Code from [code.visualstudio.com](https://code.visualstudio.com/) and install it like any other program. If you already have it, check that it is version 1.96.0 or newer.

## Step 2: install the KAFE extension

1. Open VS Code.
2. Open the **Extensions** view with `Ctrl+Shift+X` (on macOS, `Cmd+Shift+X`). You can also click the icon with the little squares in the side bar.
3. Type **KAFE** in the search box.
4. Choose **KAFE - Neural Language Suite**, by **KAFEGROUP**, and click **Install**.

You can also open the [extension's Marketplace page](https://marketplace.visualstudio.com/items?itemName=KAFEGROUP.kafe-neural-suite) and install it from there. Its identifier is `KAFEGROUP.kafe-neural-suite`.

## Step 3: open a folder and trust it

Create a folder for your programs, for example `my-kafe-programs`. In VS Code, use **File → Open Folder…** and choose it.

VS Code will ask whether you **trust** the authors of the files in that folder. Since the folder is yours, answer yes (*Yes, I trust the authors*).

!!! note "Why do you have to trust the folder?"
    Running a program is powerful: it can read and write files. That is why VS Code only lets you run programs in trusted folders. In **Restricted Mode** (a folder you do not trust), the extension does not run programs.

## Step 4: wait while the runtime is prepared

When you open a trusted folder, the extension **automatically** prepares its private runtime. You will see a progress notice. Wait until it finishes; it can take a few minutes the first time.

!!! tip "If something goes wrong"
    - If setup fails, the extension offers to **retry**. Check your internet connection and try again.
    - You can also prepare it by hand: open the **Command Palette** with `Ctrl+Shift+P` (on macOS, `Cmd+Shift+P`), type **KAFE: Install Runtime** and press `Enter`.
    - Hiding the progress notice does not cancel setup: it keeps working in the background.

## Step 5: create your first file and run it

1. In VS Code, create a new file inside your folder and save it as `test.kf`. The `.kf` ending tells VS Code it is a KAFE program.
2. Type this program and **save** the file:

    ```kafe
    --8<-- "tests/DocsExamples/tutorial/installation-prueba.en.kf"
    ```

3. Run it with `Ctrl+F5` (on macOS, `Cmd+F5`), or with the **KAFE: Run File** command from the Command Palette.

A **terminal** called **KAFE Run** opens: a text window inside VS Code where the results appear. If everything is fine, you will see:

```text
--8<-- "tests/DocsExamples/tutorial/installation-prueba.en.expec"
```

!!! tip "What happened here?"
    1. The first line starts with `--`: it is a **comment**, a note for people that KAFE ignores.
    2. `show` displayed the text and then the result of `2 + 3`.
    3. The results appeared in the **KAFE Run** terminal. Your kitchen is ready!

## Optional extras

You do not need them to get started. Install them only when you use them.

| For… | Command Palette command |
|---|---|
| Programs that use `import huggingface;` (Hugging Face datasets) | **KAFE: Install Hugging Face Pack** |
| Programs that use `import kaggle;` (Kaggle datasets) | **KAFE: Install Kaggle Pack** |
| Talking to the **Tutor**, an assistant that answers questions about KAFE | **KAFE: Open Tutor** |

If a program imports `huggingface` or `kaggle` without the pack installed, KAFE stops with a message that names the command to use.

!!! note "The Tutor needs a key"
    The Tutor uses the DeepSeek service, so you need a DeepSeek **API key**. Set it with **KAFE: Configure Provider Key**. VS Code stores it securely. When you send a question, your message and the context you authorize are shared with DeepSeek. You can read more in the [extension guide](../extension/vscode.md).

## What did you learn?

- To use KAFE you install VS Code and the **KAFE - Neural Language Suite** extension; you need nothing else.
- The extension prepares its runtime by itself when you open a trusted folder.
- A saved `.kf` program runs with `Ctrl+F5` (`Cmd+F5` on macOS) and its output appears in the **KAFE Run** terminal.

??? note "For people who work on KAFE's code"
    This part is only for people who want to **modify** KAFE (its interpreter, its libraries or this documentation). You do not need it to learn programming.

    **Requirements:** Python 3.11 or newer, Git, uv (installed with the [official instructions](https://docs.astral.sh/uv/getting-started/installation/)), and Java JDK 11 or newer with ANTLR 4.13.2 to generate the *parser* on a fresh clone or after grammar changes.

    **1. Java.** Install [Java JDK 11 or newer](https://www.oracle.com/java/technologies/downloads/) and check it with `java -version`. Java is only needed to generate the parser, not to run KAFE when the generated files are present.

    **2. Clone the repository and install the dependencies:**

    ```bash
    git clone https://github.com/joshmessi10/KAFE-Reloaded.git
    cd KAFE-Reloaded
    uv sync --locked --group dev
    ```

    The Hugging Face integration (`KafeHF`) is optional: `uv sync --locked --extra huggingface`.

    **3. ANTLR.** Download the [ANTLR 4.13.2 JAR](https://www.antlr.org/download/antlr-4.13.2-complete.jar) into the repository's `src/` folder. If you store it elsewhere, use that path in the next order.

    **4. Generate the parser** (required on a fresh clone), from the repository root:

    ```bash
    cd src
    java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
    cd ..
    ```

    The generated files are not stored in Git. If they are missing, KAFE reports `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`.

    **With Nix:** the *Nix Flake* provides Python, uv, Java, ANTLR and other tools. Install Nix and enable *flakes* with the [official instructions](https://nixos.org/download/), then:

    ```bash
    nix develop
    uv sync --locked --group dev
    ```

    **Run a program** from the repository root:

    ```bash
    uv run --locked python src/Kafe.py tests/DocsExamples/tutorial/installation-prueba.en.kf
    ```

    **Run the tests:**

    ```bash
    uv run --locked --group dev pytest tests/
    uv run --locked --group dev pytest tests/test_KafeMACHINE.py
    ```

    `src/Makefile` needs Make and a POSIX-compatible shell. On Windows, run pytest directly.

    **View the documentation on your computer:**

    ```bash
    uv sync --locked --group docs --no-dev
    uv run --locked --group docs --no-dev mkdocs serve
    ```

    **Check the installation:**

    ```bash
    uv run --locked python --version
    uv run --locked python -c "import antlr4"
    java -version
    java -jar src/antlr-4.13.2-complete.jar -version
    ```

[Next: Your first program :material-arrow-right:](first-program.md){ .md-button .md-button--primary }
