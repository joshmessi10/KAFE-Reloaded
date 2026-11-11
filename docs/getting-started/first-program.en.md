# Your first program

## The idea in one sentence

Making a program always follows four steps: **write** the instructions, **save** them in a file, **run** them and **read** what the computer answers.

## An everyday comparison

Think about **writing a letter**. First you write it, then you put it in an envelope, then you send it, and at the end you read the reply. If the reply says "I did not understand", you fix the letter and send it again.

Programming is the same. And relax: making mistakes and trying again is a normal part of the journey.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-start-ciclo.svg"
<figcaption>The programming cycle: 1) you write the program, 2) you save it as a .kf file, 3) you run it with Ctrl+F5 and 4) you read the result. Then you start again.</figcaption>
</figure>

## Step 1: write

Open VS Code with your programs folder (as in [Installation](installation.md)). Create a new file and type this single line:

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-hola.en.kf"
```

`show` displays on the screen whatever you put between the parentheses. The text goes between quotes and the instruction ends with a semicolon `;`.

## Step 2: save

Save the file with the name `hello.kf` inside your folder (`Ctrl+S`, or `Cmd+S` on macOS). The `.kf` ending tells VS Code it is a KAFE program. KAFE only runs **saved** files.

## Step 3: run

Press `Ctrl+F5` (on macOS, `Cmd+F5`). You can also open the Command Palette (`Ctrl+Shift+P`, or `Cmd+Shift+P` on macOS) and choose **KAFE: Run File**.

The extension asks the KAFE **interpreter** (the program that reads your file and does what it says) to run `hello.kf`.

## Step 4: read the answer

A **terminal** called **KAFE Run** opens: a text window inside VS Code where the results appear. There you will see:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-hola.en.expec"
```

!!! tip "What happened here?"
    1. KAFE opened `hello.kf` and read the line `show("Hello, KAFE!");`.
    2. `show` displayed the text that was between quotes, but **without** the quotes.
    3. There were no more lines, so the program ended. You wrote and ran your first program!

## Asking for data: `pour`

A program gets more fun when it asks you questions. That is what `pour` is for: it shows a question in the **KAFE Run** terminal, waits for you to type something there and press `Enter`, and gives you back what you typed as text (`STR`).

Store your answer in a **variable**: a box with a name so you can use it later.

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-nombre.en.kf"
```

If you type `Ana`, the output is:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-nombre.en.expec"
```

!!! tip "What happened here?"
    1. `pour("What is your name? ")` showed the question and waited.
    2. What you typed (`Ana`) was stored in the `name` box, of type `STR` (text).
    3. `"Hello, " + name` **joined** the two texts and `show` displayed the result.

!!! note "Why don't you see `Ana` in the output?"
    In your terminal you will see `Ana`, because you type it. Here we show only what KAFE writes: the question and the answer. That is why they appear on the same line.

### Asking for a number { #pedir-un-numero }

`pour` always returns **text**. If you want to do math, first turn the text into a number with `int(...)`:

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-edad.en.kf"
```

If you type `12`, the output is:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-edad.en.expec"
```

!!! tip "What happened here?"
    1. `pour` stored the text `"12"` in the `text` box.
    2. `int(text)` turned it into the whole number `12` and stored it in `age`, of type `INT`.
    3. Since `age` is now a number, `age + 1` gives `13`.

## Common errors

When something goes wrong, KAFE tells you **what** happened. Reading the message calmly is the best way to fix it.

### Writing `Show` with a capital letter

KAFE tells uppercase and lowercase apart: `Show` and `show` are different words.

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-mayuscula.en.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-mayuscula.en.error.stderr.expec"
```

The message says there is no function called `Show`. To fix it, write `show` in lowercase.

### Forgetting to close the quotes

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-comillas.en.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-comillas.en.error.stderr.expec"
```

*Unterminated string literal* means "unfinished text": the closing quote `"` is missing. `line 1:5` says where that text starts: line 1, column 5 (columns are counted from 0).

### Using what `pour` gives you as a number

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-sin-convertir.en.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-sin-convertir.en.error.stderr.expec"
```

The `age` box is `INT`, but `pour` delivered a `STR`. To fix it, convert the text with `int(...)`, as in [Asking for a number](#pedir-un-numero).

!!! warning "If `Ctrl+F5` does not run anything"
    Check three things: that the file is **saved** and ends in `.kf`, that the folder is **trusted** (Restricted Mode does not run programs) and that the runtime finished its setup. If it was not prepared, use **KAFE: Install Runtime** from the Command Palette.

## What did you learn?

- Programming is a cycle: write, save, run and read the answer.
- `show(...)` displays things and `pour(...)` asks for data as text; `int(...)` turns that text into a number.
- Error messages say what failed and where. They are clues, not scolding.

[Next: Basic examples :material-arrow-right:](basic-examples.md){ .md-button .md-button--primary }
