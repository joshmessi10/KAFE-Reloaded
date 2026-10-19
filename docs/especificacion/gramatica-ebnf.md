# Gramática Formal (EBNF)

La siguiente gramática en forma BNF/EBNF describe la sintaxis del lenguaje KAFE.

!!! info "Notación"
    - `::=` para definición
    - `|` para alternativas
    - `[ ]` para opcionales
    - `{ }` para repetición (cero o más veces)

---

## Programa y Declaraciones

```
programa       ::= { declaracion }
declaracion    ::= importacion
               | declaracion_var
               | declaracion_func
               | sentencia

importacion    ::= 'import' IDENTIFICADOR ';'
declaracion_var::= TIPO IDENTIFICADOR '=' expresion ';'
declaracion_func::= 'drip' IDENTIFICADOR '(' params ')' '=>' TIPO ':' cuerpo ';'
params         ::= [ param { ',' param } ]
param          ::= IDENTIFICADOR ':' TIPO
```

---

## Tipos

```
TIPO           ::= 'INT' | 'FLOAT' | 'BOOL' | 'STR' | 'VOID'
               | 'GESHA' | 'PARDOS' | 'MACHINE'
               | 'FUNC' '(' TIPO ')' '=>' TIPO
               | 'List' '[' TIPO ']'
```

---

## Sentencias

```
sentencia      ::= sentencia_if
               | sentencia_while
               | sentencia_for
               | asignacion
               | asignacion_indexada
               | llamada_funcion ';'
               | 'return' expresion ';'
               | show_stmt
               | append_stmt
               | remove_stmt

sentencia_if   ::= 'if' '(' expresion ')' ':' cuerpo
                  { '; elif' '(' expresion ')' ':' cuerpo }
                  [ '; else' ':' cuerpo ] ';'

sentencia_while::= 'while' '(' expresion ')' ':' cuerpo ';'
sentencia_for  ::= 'for' '(' IDENTIFICADOR 'in' expresion ')' ':' cuerpo ';'
asignacion     ::= IDENTIFICADOR '=' expresion ';'
asignacion_indexada ::= IDENTIFICADOR indexacion '=' expresion ';'
indexacion     ::= ( '[' expresion ']' )+
cuerpo         ::= { sentencia | declaracion_var }
show_stmt      ::= 'show' '(' expresion ')'
append_stmt    ::= 'append' '(' expresion ',' expresion ')'
remove_stmt    ::= 'remove' '(' expresion ',' expresion ')'
```

---

## Expresiones

```
expresion      ::= expresion_or
expresion_or   ::= expresion_and { '||' expresion_and }
expresion_and  ::= expresion_igualdad { '&&' expresion_igualdad }
expresion_igualdad ::= expresion_relacional { ('==' | '!=') expresion_relacional }
expresion_relacional ::= expresion_aditiva { ('<' | '<=' | '>' | '>=') expresion_aditiva }
expresion_aditiva ::= expresion_multiplicativa { ('+' | '-') expresion_multiplicativa }
expresion_multiplicativa ::= expresion_potencia { ('*' | '/' | '%') expresion_potencia }
expresion_potencia ::= expresion_unaria { '^' expresion_unaria }
expresion_unaria ::= ('-' | '!') expresion_unaria | expresion_primaria
```

---

## Expresiones Primarias

```
expresion_primaria
    ::= expresion_primaria '[' expresion ']'      -- Indexación
    | IDENTIFICADOR '.' IDENTIFICADOR '(' [ arglist ] ')'  -- Llamada a método
    | IDENTIFICADOR '.' IDENTIFICADOR              -- Acceso a propiedad
    | llamada_funcion                              -- Llamada a función
    | 'pour' '(' expresion ')'                     -- Entrada de datos
    | 'len' '(' expresion ')'                      -- Longitud
    | 'range' '(' expresion [ ',' expresion ] [ ',' expresion ] ')'  -- Rango
    | 'int' '(' expresion ')'                      -- Cast a INT
    | 'float' '(' expresion ')'                    -- Cast a FLOAT
    | 'str' '(' expresion ')'                      -- Cast a STR
    | 'bool' '(' expresion ')'                     -- Cast a BOOL
    | lambda_expr                                  -- Lambda
    | literal                                      -- Literal
    | IDENTIFICADOR                                -- Variable
    | '(' expresion ')'                            -- Agrupación
```

---

## Llamada a Función (Currificable)

```
llamada_funcion ::= IDENTIFICADOR '(' [ arglist ] { '(' [ arglist ] ')' }
arglist         ::= arg { ',' arg }
arg             ::= expresion | lambda_expr
```

---

## Lambdas

```
lambda_expr ::= '(' paramList ')' '=>' expresion
```

---

## Literales

```
literal         ::= INT_LITERAL
               | FLOAT_LITERAL
               | STRING_LITERAL
               | BOOL_LITERAL
               | list_literal

list_literal    ::= '[' [ expresion { ',' expresion } ] ']'

INT_LITERAL     ::= [0-9]+
FLOAT_LITERAL   ::= [0-9]+ '.' [0-9]+ ([eE] [+-]? [0-9]+)?
               | [0-9]+ [eE] [+-]? [0-9]+
STRING_LITERAL  ::= '"' ( ~["\\\r\n] | '\\' . )* '"'
               | '\'' ( ~['\\\r\n] | '\\' . )* '\''
BOOL_LITERAL    ::= 'True' | 'False'
```

---

## Comentarios

```
LINE_COMMENT  ::= '--' ~[\r\n]*        (se ignora)
BLOCK_COMMENT ::= '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' (se ignora)
```
