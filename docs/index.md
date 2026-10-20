# KAFE — Deep Learning Language

**KAFE** is a domain-specific programming language (DSL) designed for the academic community and focused on learning about and developing artificial neural networks. Its functional paradigm supports curried functions, function composition, and declarative structures, helping learners understand how neural models work internally.

---

## Key features

- **Functional paradigm**: First-class functions, native currying, lambdas, and closures
- **Explicit static typing**: Primitive types, generic lists, and typed functions
- **Built-in libraries**: Linear algebra, visualization, deep learning, DataFrames, and ML
- **Clear syntax**: Designed to be readable and expressive in educational settings

---

## Quick example

```kafe
-- Recursive Fibonacci
drip fibonacci(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fibonacci(n - 1) + fibonacci(n - 2);
;

show(fibonacci(7));  -- 13
```

---

## Learn KAFE step by step

1. [Install KAFE](getting-started/installation.md) and [write your first program](getting-started/first-program.md).
2. Learn [types](language/type-system.md), [control flow](language/control-structures.md), [functions](language/functions.md), and [imports](language/imports.md).
3. Choose a [library](libraries/numk.md) for the task: [PARDOS](libraries/pardos.md) for tables, [MACHINE](libraries/machine.md) for classical ML, or [Gesha](libraries/gesha.md) for neural networks.
4. Follow a complete [MACHINE example](ejemplos/machine-kaggle.md) or [Gesha example](ejemplos/gesha-examples.md), then adapt its input data and inspect predictions.

## Navigation

| Section | Description |
|---------|-------------|
| [**Getting started**](getting-started/installation.md) | Installation, first steps, and basic examples |
| [**Language**](language/lexical-structure.md) | Learn syntax, types, control flow, functions, lists, and imports |
| [**Libraries**](libraries/numk.md) | Choose built-in functions for math, tensors, data, visualization, ML, and deep learning |
| [**Specification**](specification/ebnf-grammar.md) | EBNF grammar, operational semantics, and execution pipeline |
| [**Errors**](errors/error-types.md) | Complete reference for the error system |
| [**Examples**](examples/hello-world.kf) | Complete programs for language features, MACHINE methods, and Gesha architectures |

---

## Project information

- **Version**: v2.0.0
- **License**: GPL-3.0
- **Repository**: [GitHub](https://github.com/joshmessi10/KAFE-Reloaded)
- **Authors**: Josh Sebastián López Murcia, Franklin Julián González Pérez, Karen Yireth Castañeda
- **Co-authors**: Andrés Felipe Sindicue, Luis Felipe Valencia, Emanuel Felipe Molina
- **Advisor**: Joaquín Sánchez — Universidad Sergio Arboleda
