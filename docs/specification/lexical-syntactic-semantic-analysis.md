# Lexical, syntactic, and semantic analysis

KAFE is technically a **hybrid interpreted language based on the Visitor pattern**. Its execution model follows a sequential three-phase pipeline.

---

## Execution pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    Source code (.kf)                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 1: LEXICAL ANALYSIS (Lexer - Kafe_Lexer.g4)     │
│  Converts the character stream into tokens               │
│  Input: "INT x = 5;" → Tokens: [INT, x, =, 5, ;]    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 2: SYNTAX ANALYSIS (Parser - Kafe_Grammar.g4)   │
│  Builds an abstract syntax tree (AST)                    │
│  Validates the language grammar                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 3: SEMANTIC ANALYSIS AND EXECUTION                │
│  (Visitor - InterpreterVisitor.py)                       │
│  Traverses the AST, checks types, and evaluates expressions│
│  Result: Direct program execution                         │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 1: Lexical analysis

**File**: `Kafe_Lexer.g4`

The lexer converts source code into a sequence of tokens using ANTLR4.

### Token definitions

```
-- Keywords
DRIP        : 'drip';
SHOW        : 'show';
RETURN      : 'return';
IF          : 'if';
ELIF        : 'elif';
ELSE        : 'else';
FUNC        : 'FUNC';
IMPORT      : 'import';

-- Operators
ADD         : '+';
SUB         : '-';
MUL         : '*';
DIV         : '/';
MOD         : '%';
POW         : '^';
AND         : '&&';
OR          : '||';
EQ          : '==';
NEQ         : '!=';
ASSIGN      : '=';
NOT         : '!';

-- Types
INT_TYPE    : 'INT';
FLOAT_TYPE  : 'FLOAT';
BOOL_TYPE   : 'BOOL';
STRING_TYPE : 'STR';
VOID_TYPE   : 'VOID';
LIST        : 'List';

-- Literals
INT         : [0-9]+;
FLOAT       : [0-9]+ '.' [0-9]+ ([eE] [+-]? [0-9]+)?;
BOOL        : 'True' | 'False';
STRING      : '"' ( ~["\\\r\n] | '\\' . )* '"';

-- Identifiers
ID          : [a-zA-Z_] [a-zA-Z0-9_]*;

-- Comments (ignored)
LINE_COMMENT  : '--' ~[\r\n]* -> skip;
BLOCK_COMMENT : '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' -> skip;
```

### Tokenization example

```
Source: INT x = 5 + 3;
Tokens: [INT_TYPE, ID("x"), ASSIGN, INT("5"), ADD, INT("3"), SEMI]
```

---

## Phase 2: Syntax analysis

**File**: `Kafe_Grammar.g4`

The parser validates the code structure against the grammar and builds an AST.

### Main rules

```
program   : (simpleImport SEMI)* (stmt SEMI)*;

stmt      : varDecl | assignStmt | functionDecl
          | ifElseExpr | whileLoop | forLoop
          | returnStmt | showStmt | expr;

varDecl   : typeDecl ID (ASSIGN expr)?;
expr      : logicExpr;
logicExpr : equalityExpr ((OR | AND) equalityExpr)*;
-- ... (operator precedence is encoded in chained rules)
```

### AST generation

```python
# In Kafe.py (entry point)
input_stream = InputStream(source_text)
lexer = Kafe_GrammarLexer(input_stream)
tokens = CommonTokenStream(lexer)
parser = Kafe_GrammarParser(tokens)
tree = parser.program()  # AST root
```

---

## Phase 3: Semantic analysis and execution

**File**: `InterpreterVisitor.py`

The visitor traverses the AST to perform:

1. **Dynamic type checking** (at runtime)
2. **Expression evaluation**
3. **Statement execution**

### Visitor Pattern

```python
class InterpreterVisitor(Kafe_GrammarVisitor):
    def __init__(self):
        self.variables = {}           # Variable store
        self.scope_stack = [{}]       # Scope stack
        self.libraries = {            # Available libraries
            "numk": [...], "math": [...], ...
        }

    def visitVarDecl(self, ctx):
        # Declare a typed variable
        ...

    def visitFunctionCall(self, ctx):
        # Call a function with currying support
        ...
```

### Scope management

```python
def push_scope(self):
    self.scope_stack.append({})

def pop_scope(self):
    local_vars = self.scope_stack.pop()
    for var_name in local_vars:
        if var_name in self.variables:
            del self.variables[var_name]
```

---

## ANTLR4 parser

KAFE uses an **LL(*)** parser that resolves ambiguity through:

1. **Static precedence**: Defined by the order of rules in the grammar.
2. **Maximal munch (greedy)**: The lexer builds the longest possible token.
3. **Limited backtracking**: ANTLR4 uses adaptive lookahead.

---

## Pipeline error handling

| Phase | Error type | Example |
|------|---------------|---------|
| **Lexical** | Unrecognized token | Invalid character in code |
| **Syntactic** | Invalid structure | `INT = 5;` (identifier is missing) |
| **Semantic** | Incorrect type | `INT x = "hello";` |
| **Runtime** | Execution error | `x / 0`, index out of range |

### Custom error listener

```python
class KafeErrorListener(ErrorListener):
    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        if "token recognition error" in msg:
            raise Exception(f"SyntaxError: unterminated string at {line}:{column}")
        raise Exception(f"SyntaxError at {line}:{column} -> {msg}")
```
