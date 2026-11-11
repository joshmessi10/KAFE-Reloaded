# Gramática formal (EBNF)

La siguiente gramática en notación BNF/EBNF describe la sintaxis completa del lenguaje KAFE.

!!! info "Notación"
    - `::=` define una producción gramatical.
    - `|` separa alternativas.
    - `[ ]` indica un elemento opcional.
    - `{ }` indica repetición (cero o más veces).

---

## Programas y declaraciones { #programs-and-declarations }

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

## Tipos { #types }

```
typeDecl       ::= 'INT' | 'FLOAT' | 'BOOL' | 'STR' | 'VOID'
               | 'GESHA' | 'PARDOS' | 'MACHINE'
               | functionParam
               | 'List' '[' typeDecl ']'
functionParam  ::= 'FUNC' '(' paramList_typeDecl? ')' '=>' typeDecl
paramList_typeDecl ::= typeDecl { ',' typeDecl }
```

---

## Estructuras y sentencias { #statements }

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

## Expresiones { #expressions }

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

## Expresiones primarias { #primary-expressions }

```
primaryExpr
    ::= primaryExpr '[' expr ']'                                  -- Indexación
    | object                                                      -- Método o constante de objeto
    | functionCall                                                -- Llamada a función
    | pourStmt                                                    -- Lectura de entrada
    | lenCall                                                     -- Longitud
    | 'range' '(' expr [ ',' expr ] [ ',' expr ] ')'               -- Rango
    | 'int' '(' expr ')'                                          -- Conversión a INT
    | 'float' '(' expr ')'                                        -- Conversión a FLOAT
    | 'str' '(' expr ')'                                          -- Conversión a STR
    | 'bool' '(' expr ')'                                         -- Conversión a BOOL
    | lambdaExpr                                                  -- Expresión lambda
    | literal                                                     -- Literal
    | ID                                                          -- Variable o identificador
    | '(' expr ')'                                                -- Agrupación

object ::= ID '.' ID '(' [ expr { ',' expr } ] ')'
         | ID '.' ID
```

---

## Llamadas a función (currificables) { #function-calls }

```
functionCall ::= ID '(' [ argList ] ')' { '(' [ argList ] ')' }
argList      ::= arg { ',' arg }
arg          ::= expr | lambdaExpr
```

---

## Funciones lambda { #lambdas }

```
lambdaExpr ::= '(' paramList ')' '=>' expr
```

---

## Literales { #literals }

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

## Comentarios { #comments }

```
LINE_COMMENT  ::= '--' ~[\r\n]*        (ignorado)
BLOCK_COMMENT ::= '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' (ignorado)
```
