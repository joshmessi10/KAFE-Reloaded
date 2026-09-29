# Functions

Functions in KAFE are defined with the `drip` keyword. They encapsulate reusable logic and can take typed parameters and return a value.

---

## Basic definition

**Syntax:**

```kafe
drip functionName(param1: TYPE1, param2: TYPE2) => RETURN_TYPE:
    -- function body
    return value;
    ;
```

| Element | Description |
|----------|-------------|
| `drip` | Keyword used to declare a function |
| `functionName` | Unique identifier |
| `(param1: T1, param2: T2)` | List of required parameters and their types |
| `=> RETURN_TYPE` | Required return type |
| `return value` | Statement that returns the result |
| `;` | Closes the function block |

```kafe
drip add(a: INT, b: INT) => INT:
    return a + b;
;

show(add(9, 6));  -- 15
```

---

## Curried functions

Functions support **currying**: they can be partially applied to return a new function that accepts the remaining arguments.

```kafe
drip add(a: INT, b: INT) => INT:
    return a + b;
;

show(add(10)(5));   -- Currying → 15
show(add(10, 5));   -- Direct call → 15

-- Store a partially applied function
FUNC(INT)=>INT addTen = add(10);
show(addTen(5));   -- 15
show(addTen(100)); -- 110
```

### Formal definition of currying

Given a function `f : (T1 × T2 × ... × Tn) → Tr`, KAFE treats it as a sequence of partial applications:

> `f : T1 → (T2 → (... → (Tn → Tr)...))`

If `k` arguments are provided (`k < n`), a function object is created that captures those values and waits for the remaining `n-k` arguments.

| Benefit | Description |
|---------|-------------|
| **Reusability** | Define base functions and specialize them with partially applied values |
| **Modularity** | Declarative and compositional style |
| **Expressiveness** | Clearer code in functional contexts |

---

## Higher-order functions

They accept other functions as parameters or return them. Declare the type with `FUNC(INPUT_TYPE) => OUTPUT_TYPE`.

### With a named function

```kafe
drip apply(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

drip inc(x: INT) => INT:
    return x + 1;
;

show(apply(inc, 5));  -- 6
```

### With a lambda (anonymous function)

```kafe
FUNC(INT)=>INT square = (y: INT) => y * y;
show(apply(square, 4));  -- 16
```

### Returning functions

```kafe
drip createCounter(initial: INT) => FUNC()=>INT:
    INT c = initial;
    return () => c = c + 1;
;
```

---

## Lambda expressions

```kafe
-- Syntax
(parameters) => expression

-- Examples
(y: INT) => y * y
(x: INT, y: INT) => x + y
(a: INT) => ((b: INT) => a + b)
```

**Features:**

- **Implicit return**: The lambda returns the value of its expression.
- **Typing**: Parameters must have types.
- **Use**: Lambdas are useful with higher-order functions.

---

## Recursive functions

KAFE functions can call themselves. A base case is required.

```kafe
drip factorial(n: INT) => INT:
    if (n <= 1):
        return 1;
    ;
    return n * factorial(n - 1);
;

show(factorial(5));  -- 120
```

### Fibonacci

```kafe
drip fibonacci(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fibonacci(n - 1) + fibonacci(n - 2);
;

show(fibonacci(7));  -- 13
```

!!! warning "Warning"
    Excessively deep recursion can cause a stack overflow. Always define a clear base case.

---

## Scope and shadowing

KAFE manages variable visibility with a scope stack:

- **Global scope**: Variables outside functions are visible throughout the file.
- **Local scope**: Variables inside functions, loops, or conditionals exist only in their block.
- **Shadowing**: A local variable may have the same name as a global variable.

```kafe
INT x = 10;  -- Global

drip example() => VOID:
    INT x = 20;  -- Local (shadows the global)
    show(x);     -- 20
;

example();
show(x);  -- 10 (the global still exists)
```

---

## Closures

Functions can capture and retain the lexical environment in which they were created.

```kafe
drip createCounter(initial: INT) => FUNC()=>INT:
    INT c = initial;
    return () => c = c + 1;
;

FUNC()=>INT counter = createCounter(0);
show(counter());  -- 1
show(counter());  -- 2
show(counter());  -- 3
```

### Capture mechanism

The closure makes a **shallow copy** of the current variable mapping when it is defined, so the captured state persists independently of the parent scope.

---

## Example: Fibonacci with currying

```kafe
drip fib(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fib(n - 1) + fib(n - 2);
;

-- fib takes one argument, so this call returns an integer rather than a function.
INT fibFive = fib(5);
show(fibFive);  -- 5

-- Direct call
show(fib(10));  -- 55
```
