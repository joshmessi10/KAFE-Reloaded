# Operator precedence

Precedence determines evaluation order when parentheses are absent.

---

## Precedence table

| Level | Operators | Associativity | Formal description |
|-------|-----------|---------------|-------------------|
| 1 | `()`, `[]`, `.` | Left | Grouping, indexing, and member access |
| 2 | `f(args)` | Left | Function calls and currying |
| 3 | `!`, `-` | Right | Unary NOT and negation |
| 4 | `^` | Right | Exponentiation |
| 5 | `*`, `/`, `%` | Left | Multiplication, division, and modulo |
| 6 | `+`, `-` | Left | Addition/concatenation and subtraction |
| 7 | `<`, `<=`, `>`, `>=` | Left | Relational comparison |
| 8 | `==`, `!=` | Left | Equality |
| 9 | `&&`, `\|\|` | Left | Logical conjunction and disjunction (same precedence) |

Assignment is a statement, not an expression, so it is not included in this precedence table. Compound assignment operators such as `+=` and `-=` are not supported.

---

## Precedence examples

```kafe
-- Level 5 vs. 6: multiplication before addition
show(5 + 4 * 2);      -- 13, not 18

-- Level 4 vs. 5: exponentiation before multiplication
show(5 ^ 2 * 2);      -- 50, not 100

-- Level 3: unary operators
show(-3 - -3);        -- 0

-- Parentheses change precedence (level 1)
show((5 + 4) * 2);    -- 18
```

---

## Resolving ambiguities

KAFE uses the **LL(*)** parser provided by ANTLR4. Syntactic ambiguities are resolved through:

1. **Static precedence**: Defined by the order of rules in the grammar.
2. **Maximal munch (greedy)**: The lexer always tries to build the longest possible token.

### Maximal-munch examples

```
-- The lexer recognizes "123" as one INT token, not as 1, 2, and 3
123

-- "==" is recognized as one EQ token, not as two "=" tokens
a == b

-- "->" starts a block comment; it is not '-' followed by '>'
-> comment <-
```

---

## Grammar implementation

In the ANTLR4 grammar, precedence is encoded with chained rules from highest to lowest:

```
expr          : logicExpr ;
logicExpr     : equalityExpr ((OR | AND) equalityExpr)* ;
equalityExpr  : relationalExpr ((EQ | NEQ) relationalExpr)* ;
relationalExpr: additiveExpr ((LT | LE | GT | GE) additiveExpr)* ;
additiveExpr  : multiplicativeExpr ((ADD | SUB) multiplicativeExpr)* ;
multiplicativeExpr: powerExpr ((MUL | DIV | MOD) powerExpr)* ;
powerExpr     : unaryExpr (POW unaryExpr)* ;
unaryExpr     : (SUB | NOT) unaryExpr | primaryExpr ;
```

Each level in the rule hierarchy corresponds to a precedence level in the table.
