# Functions

A **function** is a small program with a name: it receives data, does something with it and gives back a result. If you have never written one, start with the [Functions](../aprende/funciones.md) lesson: it has the blender, your first `drip` and your first lambda. This page goes one step further.

## Quick review: how to write a function

```kafe
drip functionName(param1: TYPE1, param2: TYPE2) => RETURN_TYPE:
    -- function body
    return value;
;
```

| Part | What it means |
|---|---|
| `drip` | The word that creates a function |
| `functionName` | The name you will call it by |
| `(param1: TYPE1, ...)` | The **parameters**: the inputs, each with its type |
| `=> RETURN_TYPE` | The type of the result. It is required. Use `VOID` if the function returns nothing |
| `return value;` | Hands back the result and ends the function |
| `;` (alone) | Closes the function block |

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-add.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-add.expec"
```

KAFE checks the types on the way in and on the way out: if a parameter or the `return` value does not have the promised type, it stops with an error (you will see this in [Common errors](#errores-comunes)).

## Currying: giving the ingredients little by little

### The idea in one sentence

If you call a function with **fewer** arguments than it asks for, KAFE does not complain: it gives you back a **new function** that waits for the missing ones.

### An everyday comparison

Picture a **blender that already has one fruit inside**. You added a banana and put it away. Every time you want a smoothie, you only add the second ingredient: milk, strawberries… The first fruit is already "loaded".

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-currying.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-currying.expec"
```

!!! tip "What happened here?"
    1. `add(10, 5)` is the normal call: both arguments at once.
    2. `add(10)` returns a function that "already has" the 10. With `(5)` we give it the rest: `add(10)(5)` also gives 15.
    3. `addTen` stores that preloaded blender. Its type is `FUNC(INT)=>INT`: it takes an `INT` and returns an `INT`.

??? info "For the curious 🤓"
    A function $f : (T_1 \times T_2 \times \dots \times T_n) \to T_r$ is treated as a chain of one-argument functions:
    $f : T_1 \to (T_2 \to (\dots \to (T_n \to T_r)))$.
    If you give $k < n$ arguments, you get a function that stores those $k$ values and waits for the remaining $n - k$. This lets you **reuse** general functions by creating specialized versions.

## Functions that take functions

### The idea in one sentence

A **higher-order function** is a function that receives another function as a parameter (or returns one).

### An everyday comparison

A **stamping machine** does not decide which picture to print: you give it the stamp. The machine always does the same thing (press down), but the result depends on the stamp you gave it.

The type of a parameter that is a function is written `FUNC(INPUT_TYPES)=>OUTPUT_TYPE`:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-higher-order.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-higher-order.expec"
```

`apply` is the machine; `inc`, `square` and the lambda `(z: INT) => z * 3` are the stamps. Notice that you can pass a named function (`inc`), a lambda stored in a variable (`square`) or a lambda written right there.

## Lambdas: functions without a name

A **lambda** is a short function written as a single expression: `(parameters) => expression`. You already saw it in the [functions lesson](../aprende/funciones.md). Here are a few more details:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-lambdas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-lambdas.expec"
```

- **Implicit return:** the lambda returns the value of its expression, without writing `return`.
- **Typed parameters:** each parameter needs its type, just like in `drip`.
- **At least one parameter:** KAFE does not accept lambdas without parameters such as `() => 5`.
- Lambdas also support currying: `multiply(3)(4)` gives 12.
- A lambda can return another lambda: `addTo(2)` is a function that adds 2.

## Functions that return functions

A `drip` function can also **create** and return a function. Its return type is a `FUNC` type:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-make-adder.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-make-adder.expec"
```

`makeAdder` is a **blender factory**: every time you call it, it builds a new blender with a different ingredient already loaded.

## Closures: functions with memory

### The idea in one sentence

A **closure** is a function that **remembers** the variables that existed where it was created.

### An everyday comparison

It is like a **photo**: it keeps how everything looked at the moment you took it. If something changes later, the photo stays the same.

In the previous example, the lambda `(b: INT) => a + b` remembers the value of `a` even though `makeAdder` has already finished. See what happens if the variable changes **after** the function is created:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-snapshot.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-snapshot.expec"
```

`addBonus` keeps adding 10 even though `bonus` is now 100. In KAFE a function keeps a **copy** of the variables visible at the moment it is created (a lambda or a `drip` function). If you want the new value, create the function after the change or pass the value as a parameter.

## Recursion: a function that calls itself

### The idea in one sentence

A **recursive** function solves a big problem by calling itself with a smaller problem.

### An everyday comparison

Think of **nesting dolls**: you open one and there is a smaller one inside, and so on until you reach the tiniest one, which does not open. That last one is the **base case**: the point where the function stops calling itself.

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-recursion.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-recursion.expec"
```

!!! tip "What happened here?"
    `factorial(5)` computes `5 * factorial(4)`, which computes `4 * factorial(3)`… down to `factorial(1)`, which returns 1 without calling itself again (the base case). In the end: $5 \times 4 \times 3 \times 2 \times 1 = 120$.

## Scope: where each variable lives

The **scope** of a variable is the part of the program where it exists.

- A variable created **outside** functions is **global**: functions can read it.
- A variable created **inside** a function is **local**: it only exists inside it.
- If a local variable has the same name as a global one, the local one **hides** it inside the function (*shadowing*). The global one does not change.

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-scope.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-scope.expec"
```

!!! warning "A function does not change outside variables"
    `tryToChange` does `x = 50`, but the global `x` is still 10. What happens inside a function stays inside. If you want a new value, **return** it with `return` and store it outside: `x = compute(x);`.

## Common errors { #errores-comunes }

### Giving more arguments than it asks for

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-too-many-args.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-too-many-args.error.stderr.expec"
```

Giving **fewer** arguments is allowed (that is currying), but giving **more** is an error.

### Returning a different type than promised

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-wrong-return.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-wrong-return.error.stderr.expec"
```

Division `/` always gives a `FLOAT`, and `half` promised an `INT`. Change the return type to `FLOAT` or use `int(n / 2)` to convert it (it gives 2).

### Forgetting the `return`

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.stdout.expec"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.stderr.expec"
```

`greet` shows the name, but it does not **return** anything (`VOID`), and it promised a `STR`. `show` prints on the screen; `return` hands back the value. They are different things.

### Recursion without a base case

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-no-base-case.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-no-base-case.error.stderr.expec"
```

`countUp` calls itself forever: nesting dolls without the tiniest one. Always add an `if` with a case that does **not** call itself again.

## What did you learn?

- If you give fewer arguments, you get a function that waits for the rest (**currying**).
- Functions are values: you can pass them, return them and store them in `FUNC` variables.
- A function remembers the variables from the moment it is created, and it cannot change outside variables.

[Next: Lists :material-arrow-right:](lists.md){ .md-button .md-button--primary }
