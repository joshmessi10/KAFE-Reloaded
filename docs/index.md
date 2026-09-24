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

## Navigation

| Section | Description |
|---------|-------------|
| [**Getting started**](getting-started/installation.md) | Installation, first steps, and basic examples |
| [**Language**](language/lexical-structure.md) | Complete language reference: types, operators, and functions |
| [**Libraries**](libraries/numk.md) | Documentation for NUMK, MATH, PLOT, FILES, GeshaDeep, PARDOS, and MACHINE |
| [**Specification**](specification/ebnf-grammar.md) | EBNF grammar, operational semantics, and execution pipeline |
| [**Errors**](errors/error-types.md) | Complete reference for the error system |
| [**Examples**](examples/hello-world.kf) | Progressive sample programs |

---

## Project information

- **Version**: v2.0.0
- **License**: GPL-3.0
- **Repository**: [GitHub](https://github.com/joshmessi10/KAFE-Reloaded)
- **Authors**: Josh Sebastián López Murcia, Franklin Julián González Pérez, Karen Yireth Castañeda
- **Co-authors**: Andrés Felipe Sindicue, Luis Felipe Valencia, Emanuel Felipe Molina
- **Advisor**: Joaquín Sánchez — Universidad Sergio Arboleda
