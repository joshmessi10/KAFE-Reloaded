# KAFE technical documentation plan

## Framework
- **MkDocs** with the **Material** theme for GitHub Pages
- Automatic deployment through GitHub Actions

## Site structure

```
docs/
├── index.md
├── getting-started/
│   ├── installation.md
│   ├── first-program.md
│   └── basic-examples.md
├── language/
│   ├── lexical-structure.md
│   ├── type-system.md
│   ├── operators.md
│   ├── control-structures.md
│   ├── functions.md
│   ├── lists.md
│   └── imports.md
├── libraries/
│   ├── numk.md
│   ├── math.md
│   ├── plot.md
│   ├── files.md
│   ├── gesha.md
│   ├── pardos.md
│   └── machine.md
├── specification/
│   ├── ebnf-grammar.md
│   ├── operational-semantics.md
│   ├── lexical-syntactic-semantic-analysis.md
│   └── operator-precedence.md
├── errors/
│   ├── error-types.md
│   ├── lexical-errors.md
│   ├── syntax-errors.md
│   ├── semantic-errors.md
│   └── error-reference.md
├── examples/
│   ├── hello-world.kf
│   ├── fibonacci-currying.kf
│   ├── merge-sort.kf
│   ├── linear-regression.kf
│   ├── neural-network.kf
│   ├── decision-tree.kf
│   └── clustering-plot-example.kf
├── about/
│   ├── credits.md
│   └── license.md
└── migration/
    └── english-repository-migration.md
```

## Content sources
- `src/Kafe_Lexer.g4` and `src/Kafe_Grammar.g4` → EBNF grammar
- `src/errors.py` → Error reference
- `src/lib/KafePARDOS/` → PARDOS documentation
- `src/lib/KafeMACHINE/` → MACHINE documentation
- `src/InterpreterVisitor.py` → Execution pipeline analysis
