# FILES: reference

Here are the four FILES functions, one for each stage in the life of a file. If this is your first time, read the [entry page](../files.md) first: it explains how to import the library and how it works inside.

## Paths: where the file lives { #paths }

**Where is the file saved?** The name you give each function is a **path**: the way to reach the file. KAFE looks for it **in the same folder as your `.kf` program**, not in the folder you run it from. If your program is `homework/notes.kf` and you write `files.create("list.txt")`, the file ends up in `homework/list.txt`. To reach a subfolder, separate the names with `/`, as in `"data/notebook.txt"`.

!!! tip "The examples clean up after themselves"
    The examples on this page end with `files.delete(...)` so they don't leave files lying around. If you want to keep your file, remove that last line.

## The four functions { #functions }

Each function matches one stage in the life of the notebook: create, write, read and throw away.

### `files.create(path)` { #create }

**What it does:** Creates a **new, empty** file, like opening a brand-new notebook.

**When to use it:** When you want to start a file from scratch and be sure you are not overwriting one that already existed.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The file name (or path), for example `"notes.txt"`. |

**Returns:** `VOID` (nothing). The file appears in the folder.

**Example:**

```kafe
--8<-- "tests/DocsExamples/files/create.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/files/create.expec"
```

The new file is empty: reading it gives the empty text `""`, so the comparison gives `True`.

??? warning "Common mistake: creating a file that already exists"
    `create` does not overwrite: if the file is already there, it stops with an error so it doesn't erase what it had. In this example, `data/notebook.txt` already exists:

    ```kafe
    --8<-- "tests/DocsExamples/files/create-exists.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/create-exists.error.stderr.expec"
    ```

!!! note "Watch out for folders"
    `create` does not create folders. If you write `files.create("new/notes.txt")` and the folder `new` does not exist, KAFE stops with an error that says `No such file or directory`.

### `files.write(path, text)` { #write }

**What it does:** Writes `text` into the file. It **erases what was there before** and puts the new text in, as if you tore out the page and wrote on a clean one. At the end it adds a line break.

**When to use it:** To save a result: a score, a list or a note you want to read later.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The file name (or path). |
| `text` | `STR` | The text you want to save. Use `\n` to move to the next line. |

**Returns:** `VOID` (nothing).

**Example:**

```kafe
--8<-- "tests/DocsExamples/files/write.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/files/write.expec"
```

**What happened here?** The second write **replaced** the first one: only `4 5 6` is left in the file. The empty lines appear because `write` adds a line break at the end of the text, and `show` adds another one.

!!! note "Watch out"
    - `write` **does not append**: it always replaces all the content. To add text, first read what is there, join it with the new text and write it all again.
    - If the file does not exist, `write` creates it. You don't need to call `create` first.

### `files.read(path)` { #read }

**What it does:** Reads **all** the content of the file and gives it to you as text (`STR`), like copying into your own notepad what the notebook says.

**When to use it:** To get back something you saved before, or to use data someone wrote in a file.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The file name (or path). |

**Returns:** `STR` with all the text of the file, line breaks included.

**Example:**

```kafe
--8<-- "tests/DocsExamples/files/read.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/files/read.expec"
```

**What happened here?** The text had `\n` in the middle, so the file holds two lines. `read` also returns the line break that `write` added at the end: that is why the text you read ends in `\n`.

You can also read a file that already exists inside a subfolder. Here, `data/notebook.txt` sits next to the program and contains the word `KAFE`:

```kafe
--8<-- "tests/DocsExamples/files/read-folder.kf"
```

```text
--8<-- "tests/DocsExamples/files/read-folder.expec"
```

??? warning "Common mistake: reading a file that doesn't exist"
    If you misspell the name, or the file has not been created yet, KAFE stops:

    ```kafe
    --8<-- "tests/DocsExamples/files/read-missing.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/read-missing.error.stderr.expec"
    ```

### `files.delete(path)` { #delete }

**What it does:** **Deletes** the file from the folder, like throwing the notebook in the bin. It does not go to the recycle bin: it is really gone.

**When to use it:** To clean up temporary files your program no longer needs.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The file name (or path). |

**Returns:** `VOID` (nothing).

**Example:**

```kafe
--8<-- "tests/DocsExamples/files/delete.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/files/delete.expec"
```

**What happened here?** After the file is deleted, its name is free again, so `create` can use it without an error.

??? warning "Common mistake: deleting a file that doesn't exist"
    ```kafe
    --8<-- "tests/DocsExamples/files/delete-missing.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/delete-missing.error.stderr.expec"
    ```

## Summary of all functions { #summary }

| Function | What it does |
|---|---|
| [`files.create(path)`](#create) | Creates a new, empty file. |
| [`files.write(path, text)`](#write) | Replaces the file's content with `text`. |
| [`files.read(path)`](#read) | Returns all the text of the file. |
| [`files.delete(path)`](#delete) | Deletes the file. |

## What did you learn?

- A file is like a notebook: you create it, write it, read it and throw it away.
- Paths are looked up in the folder of your `.kf` program.
- `write` replaces all the content and adds a line break at the end.
- Reading or deleting a file that doesn't exist stops the program with an error.

[Next library: PLOT :material-arrow-right:](../plot.md){ .md-button .md-button--primary }
