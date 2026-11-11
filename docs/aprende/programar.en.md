# What is programming?

## The idea in one sentence

**Programming** means writing a list of instructions, in order, so the computer does something for you.

## An everyday comparison

Think of a **cooking recipe**. A recipe does not cook by itself: someone reads it step by step and does exactly what it says. If the steps are clear and in the right order, the hot chocolate comes out perfect.

A **program** is a recipe for the computer:

- The **recipe** is your `.kf` file (that is how KAFE programs end).
- **The cook** is KAFE: it reads your program from top to bottom, one line at a time.
- **The dish** is what shows up on the screen.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/programar-receta.svg"
<figcaption>KAFE reads your program line by line, from top to bottom. Each line produces its result before moving on to the next one.</figcaption>
</figure>

## Your first recipe in KAFE

To show something on the screen we use the instruction `show`. What you want to show goes inside parentheses, and every instruction ends with a semicolon `;`.

```kafe
--8<-- "tests/DocsExamples/aprende/programar-receta.en.kf"
```

When you run it, KAFE shows:

```text
--8<-- "tests/DocsExamples/aprende/programar-receta.en.expec"
```

!!! tip "What happened here?"
    1. The first line starts with `--`. That is a **comment**: a note for people that KAFE ignores.
    2. Each `show` displayed its text. The text goes inside quotes `"…"` so KAFE knows where it starts and where it ends.
    3. The texts came out **in the same order** we wrote the lines.

## The computer is also a calculator

`show` can also display the result of a calculation. KAFE follows the math order of operations: first it multiplies and then it adds, unless you use parentheses.

```kafe
--8<-- "tests/DocsExamples/aprende/programar-calculadora.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/programar-calculadora.expec"
```

Look at the last line: the parentheses make KAFE add first (`2 + 3 = 5`) and then multiply (`5 × 4 = 20`).

## Common mistake: forgetting the semicolon

The semicolon tells KAFE "this instruction ends here". If you forget it, KAFE does not know where one instruction ends and the next one begins:

```kafe
--8<-- "tests/DocsExamples/aprende/programar-falta-punto-y-coma.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/programar-falta-punto-y-coma.error.stderr.expec"
```

!!! warning "How to read the error"
    `Line 2, Column 0` tells you **where** KAFE noticed the problem: at the start of line 2. `missing ';'` tells you **what** is missing. The mistake is right before that: at the end of line 1.

## What did you learn?

- A program is a list of instructions that KAFE runs **in order**.
- `show(...)` displays text and numbers on the screen.
- Every instruction ends with `;` and comments start with `--`.

??? info "For the curious 🤓"
    Before running your program, KAFE reads it in three steps, just like you read a sentence: first it splits it into words (**lexical analysis**), then it checks that they are in a valid order (**syntactic analysis**) and finally it checks that they make sense (**semantic analysis**). You can see it in detail in [Lexical, syntactic and semantic analysis](../specification/lexical-syntactic-semantic-analysis.md).

[Next lesson: Variables and types :material-arrow-right:](variables.md){ .md-button .md-button--primary }
