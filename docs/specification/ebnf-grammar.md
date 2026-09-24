# Formal grammar (EBNF)

The following BNF/EBNF grammar describes the syntax of the KAFE language.

!!! info "Notation"
    - `::=` defines a production.
    - `|` separates alternatives.
    - `[ ]` marks an optional item.
    - `{ }` marks repetition (zero or more times).

---

## Programs and declarations

```
program         ::= { simpleImport ';' } { stmt ';' }
simpleImport    ::= 'import' ID
stmt            ::= varDecl
                  | assignStmt
                  | indexedAssignStmt
                  | functionDecl
                  | ifElseExpr
                  | whileLoop
                  | forLoop
                  | returnStmt
                  | showStmt
                  | appendCall
                  | removeCall
                  | expr
block           ::= { stmt ';' }

varDecl         ::= typeDecl ID [ '=' expr ]
assignStmt      ::= ID '=' expr
indexedAssignStmt ::= ID indexing '=' expr
indexing        ::= { '[' expr ']' }+
functionDecl    ::= 'drip' ID '(' [ paramList ] ')' '=>' typeDecl ':' block
paramList       ::= paramDecl { ',' paramDecl }
paramDecl       ::= ID ':' typeDecl
```

---

## Types

```
typeDecl       ::= 'INT' | 'FLOAT' | 'BOOL' | 'STR' | 'VOID'
               | 'GESHA' | 'PARDOS' | 'MACHINE'
               | functionParam
               | 'List' '[' typeDecl ']'
functionParam  ::= 'FUNC' '(' paramList_typeDecl? ')' '=>' typeDecl
paramList_typeDecl ::= typeDecl { ',' typeDecl }
```

---

## Statements

```
ifElseExpr     ::= 'if' '(' expr ')' ':' block
                   { 'elif' '(' expr ')' ':' block }
                   [ 'else' ':' block ]
whileLoop      ::= 'while' '(' expr ')' ':' block
forLoop        ::= 'for' '(' ID 'in' expr ')' ':' block
returnStmt     ::= 'return' expr
showStmt       ::= 'show' '(' expr ')'
pourStmt       ::= 'pour' '(' expr ')'
appendCall     ::= 'append' '(' expr ',' expr ')'
removeCall     ::= 'remove' '(' expr ',' expr ')'
lenCall        ::= 'len' '(' expr ')'
```

---

## Expressions

```
expr              ::= logicExpr
logicExpr         ::= equalityExpr { ('||' | '&&') equalityExpr }
equalityExpr      ::= relationalExpr { ('==' | '!=') relationalExpr }
relationalExpr    ::= additiveExpr { ('<' | '<=' | '>' | '>=') additiveExpr }
additiveExpr      ::= multiplicativeExpr { ('+' | '-') multiplicativeExpr }
multiplicativeExpr ::= powerExpr { ('*' | '/' | '%') powerExpr }
powerExpr         ::= unaryExpr { '^' unaryExpr }
unaryExpr         ::= ('-' | '!') unaryExpr | primaryExpr
```

---

## Primary expressions

```
primaryExpr
    ::= primaryExpr '[' expr ']'                                  -- Indexing
    | object                                                      -- Object method or constant
    | functionCall                                                -- Function call
    | pourStmt                                                    -- Read input
    | lenCall                                                     -- Length
    | 'range' '(' expr [ ',' expr ] [ ',' expr ] ')'               -- Range
    | 'int' '(' expr ')'                                          -- Cast to INT
    | 'float' '(' expr ')'                                        -- Cast to FLOAT
    | 'str' '(' expr ')'                                          -- Cast to STR
    | 'bool' '(' expr ')'                                         -- Cast to BOOL
    | lambdaExpr                                                  -- Lambda
    | literal                                                     -- Literal
    | ID                                                          -- Variable
    | '(' expr ')'                                                -- Grouping

object ::= ID '.' ID '(' [ expr { ',' expr } ] ')'
         | ID '.' ID
```

---

## Function calls (curriable)

```
functionCall ::= ID '(' [ argList ] ')' { '(' [ argList ] ')' }
argList      ::= arg { ',' arg }
arg          ::= expr | lambdaExpr
```

---

## Lambdas

```
lambdaExpr ::= '(' paramList ')' '=>' expr
```

---

## Literals

```
literal         ::= INT_LITERAL
               | FLOAT_LITERAL
               | STRING_LITERAL
               | BOOL_LITERAL
               | list_literal

listLiteral     ::= '[' [ expr { ',' expr } ] ']'

INT_LITERAL     ::= [0-9]+
FLOAT_LITERAL   ::= [0-9]+ '.' [0-9]+ ([eE] [+-]? [0-9]+)?
               | [0-9]+ [eE] [+-]? [0-9]+
STRING_LITERAL  ::= '"' ( ~["\\\r\n] | '\\' . )* '"'
               | '\'' ( ~['\\\r\n] | '\\' . )* '\''
BOOL_LITERAL    ::= 'True' | 'False'
```

---

## Comments

```
LINE_COMMENT  ::= '--' ~[\r\n]*        (ignored)
BLOCK_COMMENT ::= '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' (ignored)
```
