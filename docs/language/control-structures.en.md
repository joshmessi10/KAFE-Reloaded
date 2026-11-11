# Control structures

Until now your programs ran from top to bottom, one line after another. **Control structures** change that path: they let you **choose** which lines run (`if`) and **repeat** lines several times (`while` and `for`).

!!! tip "Before you start"
    This page uses variables, types and lists. If you do not know them yet, read [Variables](../aprende/variables.md) first.

## Blocks: where they start and where they end

A **block** is a group of lines that belong together, like the small steps inside one step of a recipe.

- A colon `:` says "the block starts here".
- A `;` on its own line says "the block ends here".
- Spaces at the start of a line (the **indentation**) are not required, but they make code much easier to read. Use four spaces.

## Choosing with `if`, `elif` and `else`

### The idea in one sentence

`if` runs a block **only if** a condition is true.

### An everyday comparison

Think of a **fork in the road**. Before going out you check the weather: *if* it is hot, you bring water; *else if* it is nice, you bring nothing; *else*, you bring a coat. You take **only one road**: the first one that fits.

- `if (condition):` is the first question.
- `elif (condition):` (*else if*) is another question, asked only when the earlier ones were `False`.
- `else:` is the default road, used when no condition was true.

The **condition** goes in parentheses and must be a `BOOL` value: `True` or `False`.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-clima.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-clima.en.expec"
```

!!! tip "What happened here?"
    1. `temperature > 25` is `True` (30 is greater than 25), so KAFE ran the first block.
    2. Since it already chose a road, it **skipped** the `elif` and the `else`, even though `30 > 15` is also true.
    3. The single `;` after the `else` closes the whole `if`. Then the program went on with `show("End of the forecast")`.

The full syntax is:

```kafe
if (condition):
    -- block when true
elif (other_condition):
    -- alternative block
else:
    -- default block
;
```

You can write as many `elif` branches as you want, and both `elif` and `else` are optional.

!!! warning "Do not put `;` before `elif` or `else`"
    `elif` and `else` come **right after** the previous block, with no `;` in between. There is only one `;`, at the end of the whole `if`. If you write `; else:`, KAFE closes the `if` too early and **stops running the rest of the program without any message**. If your program ends "silently" sooner than expected, check this first.

### An `if` inside another

You can put an `if` inside another block. Each `if` needs its own closing `;`:

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-anidado.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-anidado.en.expec"
```

## Repeating with `while`

### The idea in one sentence

`while` repeats a block **as long as** its condition is true.

### An everyday comparison

Picture a runner on a **track**. Before each lap she asks herself: "have I run 3 laps yet?". As long as the answer is no, she keeps running and adds one lap to her count. When she asks the fourth time, the answer changes and she stops.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang2-vueltas.svg"
<figcaption>A <code>while</code> loop keeps going around as long as the condition is true. The counter goes up on every lap.</figcaption>
</figure>

Each repetition is called an **iteration**, and the block that repeats is called a **loop**.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-vueltas.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-vueltas.en.expec"
```

!!! tip "What happened here?"
    1. `lap` starts at 1. The condition `lap <= 3` is `True`, so the block runs: it shows 1 and adds 1.
    2. The same happens with 2 and 3.
    3. When `lap` is 4, the condition is `False`. The loop ends and the program goes on with `show("Finish line!")`.

!!! warning "Iteration limit"
    If the condition never becomes `False`, the loop would never end (an **infinite loop**). To protect you, KAFE stops any `while` loop that goes past **10,000 iterations** and shows an error.

## Going through items with `for`

### The idea in one sentence

`for` runs a block **once for each element** of a list.

### An everyday comparison

You have a **basket of fruit**. You take one fruit, say whether you like it, and repeat with the next one until the basket is empty. You do not need to count: the basket tells you when you are done.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-frutas.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-frutas.en.expec"
```

The syntax is `for (element in collection):`.

| Part | What it means |
|---|---|
| `element` | A new variable that receives, on each lap, the next value of the collection. You do not write its type. |
| `collection` | A `List[T]` list or the result of `range(...)`. |

A `for` loop can also build up a result in a variable created **before** the loop:

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-suma.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-suma.expec"
```

## Counting with `range()`

### The idea in one sentence

`range` creates a list of whole numbers in a row, ready to use in a `for` loop.

### An everyday comparison

It is like the **marks on a ruler**: you say where to start, where to stop and how far apart the marks are.

| Form | What it creates | Example |
|---|---|---|
| `range(n)` | From 0 up to n-1 | `range(4)` → `[0, 1, 2, 3]` |
| `range(a, b)` | From a up to b-1 | `range(1, 5)` → `[1, 2, 3, 4]` |
| `range(a, b, p)` | From a up to b-1, jumping by p | `range(0, 10, 2)` → `[0, 2, 4, 6, 8]` |

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-range.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-range.expec"
```

- The final number (`b`) is **never** included.
- If the step `p` is negative, the list goes down: `range(5, 0, -1)`.
- `range()` returns a `List[INT]`, so you can also show it or store it.
- Every argument must be an `INT`, and the step cannot be 0.

## All together: FizzBuzz

FizzBuzz is a classic game: count from 1 to 15, but say "Fizz" if the number divides by 3, "Buzz" if it divides by 5 and "FizzBuzz" if it divides by both. The `%` operator gives the **remainder** of a division: if `i % 3 == 0`, dividing by 3 is exact.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-fizzbuzz.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-fizzbuzz.expec"
```

Why does the 15 case come first? Because `if` picks the **first** road that fits. If `i % 3 == 0` came first, 15 would say "Fizz".

## `break` and `continue`

In other languages, `break` leaves a loop and `continue` jumps to the next lap. **KAFE does not have them yet.** To end a loop early, use a condition in the `while`, or a `return` inside a function.

## Common errors

### The condition is not a `BOOL`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-condicion-no-bool.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-condicion-no-bool.error.stderr.expec"
```

KAFE does not guess whether `1` means "yes". Write a comparison that gives `True` or `False`, for example `if (n == 1):`.

### Forgetting to move forward in a `while`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-bucle-infinito.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-bucle-infinito.error.stderr.expec"
```

`i` never changes, so `i < 5` is always `True`. It is the runner who never counts her laps. Fix it with `i = i + 1;` inside the loop.

### A step of 0 in `range`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-paso-cero.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-paso-cero.error.stderr.expec"
```

With a step of 0 you would never reach the end. Use a positive step to go up or a negative one to go down.

### Using `break`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-break.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-break.error.stderr.expec"
```

KAFE does not know `break`, so it thinks it is the name of a variable.

### Using a variable created inside the block

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-variable-del-bloque.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-variable-del-bloque.error.stderr.expec"
```

A variable **created** inside a block (`if`, `while` or `for`) only exists inside it. The `for` variable (here `i`) does not exist after the loop either. If you need the value outside, create the variable **before** the block and change it inside, like `total` in the sum example.

## What did you learn?

- `if` / `elif` / `else` choose **one** road; there is only one `;`, at the very end.
- `while` repeats while the condition is `True`; `for` repeats once for each element.
- `range(a, b, p)` creates a list of whole numbers that does not include `b`.

[Next: Functions :material-arrow-right:](functions.md){ .md-button .md-button--primary }
