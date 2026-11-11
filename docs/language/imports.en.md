# Imports

KAFE carries little "in its pocket": variables, lists, functions and `show`. For math, charts, data tables or artificial intelligence you need **libraries**. An `import` tells KAFE which library you are going to use.

## The idea in one sentence

`import name;` brings a library or a `.kf` file into your program so you can use what it contains.

## An everyday comparison

Think of a **toolbox**. You do not carry every tool in the world: before starting, you take out the ones you will need. If you are hanging a picture, you take out the hammer. If you later try to use a drill you did not take out, you will not find it.

## Your first import

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-math.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-math.expec"
```

!!! tip "What happened here?"
    1. `import math;` took out the math toolbox.
    2. `math.sqrt(16)` used the `sqrt` (square root) function **from** the `math` library. Read the dot `.` as "from": "`sqrt` from `math`".
    3. `math.pi` has no parentheses: it is a **constant**, a value stored in the library.

## Import rules

- Write one `import` per line, each with its own `;`. You cannot import several libraries separated by commas.
- Imports go **at the beginning** of the file, before any other line.
- An import works for the **whole** file.
- There are no aliases: you cannot write `import math as m;`.
- Keys are case-sensitive: `math` works, `Math` does not.

!!! warning "An import in the middle of the program silently stops everything"
    If you write an `import` after another line (for example, after a `show`), KAFE runs what came before and then **stops without showing any message**. Always put all the imports at the top.

## KAFE's libraries

Each library has a **key**: the exact word you write after `import`.

| Key | Library | What it is for |
|---|---|---|
| `math` | KafeMATH | Math functions and constants: roots, powers, `pi`… [See page](../libraries/math.md) |
| `numk` | KafeNUMK | Vectors and matrices, NumPy style. [See page](../libraries/numk.md) |
| `plot` | KafePLOT | Drawing charts (lines, points, bars) as SVG images. [See page](../libraries/plot.md) |
| `files` | KafeFILES | Reading and writing text files. [See page](../libraries/files.md) |
| `pardos` | KafePARDOS | Data tables (DataFrames) and CSV files, Pandas style. [See page](../libraries/pardos.md) |
| `machine` | KafeMACHINE | Machine learning: models, preprocessing and metrics. [See page](../libraries/machine.md) |
| `gesha` | KafeGESHA | Neural networks and deep learning. [See page](../libraries/gesha.md) |
| `huggingface` | KafeHF | Loading Hugging Face datasets. Needs an optional package. [See page](../bibliotecas/huggingface.md) |
| `kaggle` | KafeKAGGLE | Downloading public Kaggle datasets. Needs an optional package. [See page](../bibliotecas/kaggle.md) |

!!! note "`geshaDeep` and `geshaV2` are old names"
    The official key for deep learning is `gesha`. The keys `geshaDeep` and `geshaV2` still work and lead to the same library, but they are **deprecated**: they are kept only so that old programs keep working, and they will be removed later. In new programs, use `gesha`.

## Importing your own files

You can also save functions in a `.kf` file and use them from another one. Suppose you have these two files in the same folder:

```kafe
-- utilities.kf
drip add(a: INT, b: INT) => INT:
    return a + b;
;

drip isEven(n: INT) => BOOL:
    return n % 2 == 0;
;
```

```kafe
-- program.kf
import utilities;

show(add(3, 4));
show(isEven(4));
```

When you run `program.kf` you will see `7` and `True`.

!!! warning "No prefix"
    The functions from your file are used **by their name**, without `utilities.` in front: `add(3, 4)`, not `utilities.add(3, 4)`. The dotted prefix only works with the libraries in the table above. Writing `utilities.add(3, 4)` gives the error `Variable 'utilities' not defined`.

What does KAFE do with `import utilities;`?

1. It checks whether `utilities` is one of the libraries in the table. If it is, it turns it on and that is all.
2. If not, it looks for the file `utilities.kf` in this order:
    1. The folder of the file you are running.
    2. `src/language_components/imports/` inside the KAFE installation.
    3. `src/language_components/` inside the KAFE installation.
3. It runs the whole file only once. Everything it defines (functions and variables) becomes available in your program, and if the file has a `show`, you will see its output too.

??? info "For the curious 🤓: repeated and circular imports"
    KAFE remembers which files it already imported. If you import the same file twice, the second time does nothing. This also prevents **cycles**: if `module_a.kf` imports `module_b.kf` and `module_b.kf` imports `module_a.kf`, the second import is ignored and the program does not go around in circles.

## Common errors

### Using a library without importing it

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-not-imported.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-not-imported.error.stderr.expec"
```

It is the drill you did not take out of the box. Add `import math;` on the first line.

### Writing the key with a different capital letter

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-wrong-case.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-wrong-case.error.stderr.expec"
```

`Math` is not a KAFE library, so KAFE looks for it as a file named `Math.kf` and does not find it (`<REPO>` is the folder where KAFE lives). Write the key exactly as in the table: `math`.

## What did you learn?

- `import key;` goes at the start of the file, one library per line.
- What a library brings is used with a dot: `math.sqrt(16)`.
- You can also import your own `.kf` files and use their functions by name.

[Next: Libraries: MATH :material-arrow-right:](../libraries/math.md){ .md-button .md-button--primary }
