# Functions

## The idea in one sentence

A **function** is a small program with a name: it takes data, does something with it and gives back a result.

## An everyday comparison

Think of a **blender**. You put fruit in (the **input**), press the button (the **process**) and juice comes out (the **output**). You do not need to know how the motor works to use it, and you can use it as many times as you like with different fruits.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/funciones-licuadora.svg"
<figcaption>Input → process → output. A function takes data, transforms it and gives back a result.</figcaption>
</figure>

## Your first function

In KAFE, functions are created with the word `drip`, like coffee dripping through the filter ☕:

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-doble.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-doble.en.expec"
```

Let's go piece by piece:

| Part | What it means |
|---|---|
| `drip` | "A function starts here" |
| `double` | The name of the function |
| `(n: INT)` | The input: a **parameter** called `n` that must be an `INT` |
| `=> INT` | The output: the function gives back an `INT` |
| `return n * 2;` | What it does: gives back double of `n` |
| `;` (on its own) | "The function ends here" |

!!! tip "What happened here?"
    1. First we **defined** the function `double`. Defining it does not show anything: it is like putting the blender together.
    2. `double(4)` **called** the function with `n = 4`. The function gave back `8` and `show` displayed it.
    3. We used the same function again with `21`. You write the recipe once and use it many times!

## The blender in KAFE

Functions also work with text. The `+` between two texts joins them:

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-licuadora.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-licuadora.en.expec"
```

## Quick functions: lambdas

When a function is very short, you can write it on a single line and store it in a variable of type `FUNC`. This is called a **lambda**:

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-lambda.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-lambda.en.expec"
```

`FUNC(INT)=>INT` reads as "a function that takes an `INT` and gives back an `INT`".

## Common mistake: giving it the wrong ingredient

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-tipo-equivocado.en.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-tipo-equivocado.en.error.stderr.expec"
```

`double` asks for an `INT` and we gave it the text `"four"`. It is like putting a rock in the blender: KAFE stops before something breaks.

## What did you learn?

- A function is defined with `drip name(parameters) => TYPE:` and ends with `;`.
- `return` says what the function gives back.
- You define the function once and **call** it as many times as you want.

??? info "For the curious 🤓"
    In KAFE, functions are **values**: you can store them in variables, pass them to other functions and return them. Also, if you call a function with fewer arguments than it asks for, you get a new function that waits for the rest. This is called **currying**:
    $f(a, b) = a + b \;\Rightarrow\; f(10)$ is a function that adds 10. You will see it in [Functions](../language/functions.md).

[Next lesson: What is learning from data? :material-arrow-right:](aprender-de-datos.md){ .md-button .md-button--primary }
