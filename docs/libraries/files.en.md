# FILES: files

The **FILES** library lets you save text in **files** and read it later. A file is like a **notebook** that lives on your computer: what you write in it is not erased when the program ends.

**What is it for?** To remember things from one run to the next: a score, a to-do list or the results of an experiment.

## Before you start: import the library

A library is an extra **toolbox**. To use it, first bring it into your program with `import`, then use each tool with `files.` in front. This program uses all four FILES tools:

```kafe
--8<-- "tests/DocsExamples/files/notebook.kf"
```

```text
--8<-- "tests/DocsExamples/files/notebook.expec"
```

!!! warning "Common mistake: forgetting the `import`"
    If you use `files.` without writing `import files;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/files/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/no-import.error.stderr.expec"
    ```

## The life of a file

Think of a real notebook. First you **buy** it (it is empty). Then you **write** in it. Later you **read** it. And when you no longer need it, you **throw it away**. FILES has one function for each stage:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/files-notebook.svg"
<figcaption>`create` makes an empty page, `write` writes on it, `read` copies what is written into your program and `delete` throws the page away.</figcaption>
</figure>

## How it works inside { #inside }

FILES is a small library. All its code is in a single Python file: `src/lib/KafeFILES/functions.py`. It has four short functions, one per stage, and they all follow the same steps:

1. **Check what you give it.** Before doing anything, KAFE checks that the file name is a `STR`. If you pass a number, it stops with an error.
2. **Build the full path.** KAFE keeps the folder where your `.kf` program lives in a variable called `current_dir`. Then it **joins** that folder with the name you gave (using `os.path.join`, a Python tool that glues folders and names together). That is why `"a.txt"` is always looked for next to your program, no matter where you run it from.
3. **Ask Python to do the work.** With the path ready, Python opens the file in the right **mode**: `"x"` to create (fails if it already exists), `"w"` to write (erases what was there) and `"r"` to read. To delete it uses `os.remove`.
4. **Report problems.** If the file does not exist or already exists, KAFE turns the problem into a clear message, like `read: File a.txt doesn't exist`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/files-inside.svg"
<figcaption>Step by step of `files.read("a.txt")`: KAFE joins your program's folder with the name, Python opens the file and the text comes back to your program as a `STR`.</figcaption>
</figure>

??? info "For the curious 🤓"
    - Text is saved with the **UTF-8** encoding, so you can write accents and letters like ñ.
    - `write` adds `"\n"` (a line break) at the end of what you write. That is why, when you read it back, the text ends in `\n`.

## Library map

| Page | What you will find |
|---|---|
| [Reference](files/reference.md) | The four functions: [`create`](files/reference.md#create), [`write`](files/reference.md#write), [`read`](files/reference.md#read) and [`delete`](files/reference.md#delete), with examples and common mistakes. |

## What did you learn?

- To use FILES you write `import files;` and then `files.name(...)`.
- A file is like a notebook: you create it, write it, read it and throw it away.
- KAFE looks for files in the folder of your `.kf` program.

[See the functions :material-arrow-right:](files/reference.md){ .md-button .md-button--primary }
