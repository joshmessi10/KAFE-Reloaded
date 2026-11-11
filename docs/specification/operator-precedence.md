# Precedencia de operadores

La precedencia determina el orden de evaluación de las operaciones cuando no hay paréntesis explícitos.

---

## Tabla de precedencia { #precedence-table }

| Nivel | Operadores | Asociatividad | Descripción formal |
|---|---|---|---|
| 1 | `()`, `[]`, `.` | Izquierda | Agrupación, indexación y acceso a miembros |
| 2 | `f(args)` | Izquierda | Llamadas a funciones y currificación |
| 3 | `!`, `-` | Derecha | NOT unario y negación |
| 4 | `^` | Derecha | Exponenciación |
| 5 | `*`, `/`, `%` | Izquierda | Multiplicación, división y módulo |
| 6 | `+`, `-` | Izquierda | Suma/concatenación y resta |
| 7 | `<`, `<=`, `>`, `>=` | Izquierda | Comparación relacional |
| 8 | `==`, `!=` | Izquierda | Igualdad y desigualdad |
| 9 | `&&`, `\|\|` | Izquierda | Conjunción y disyunción lógica (misma precedencia) |

La asignación es una sentencia y no una expresión, por lo que no forma parte de esta tabla. Los operadores de asignación compuesta como `+=` y `-=` no están soportados en el lenguaje.

---

## Ejemplos de precedencia { #precedence-examples }

```kafe
-- Nivel 5 frente a 6: la multiplicación precede a la suma
show(5 + 4 * 2);      -- 13, no 18

-- Nivel 4 frente a 5: la exponenciación precede a la multiplicación
show(5 ^ 2 * 2);      -- 50, no 100

-- Nivel 3: operadores unarios
show(-3 - -3);        -- 0

-- Los paréntesis modifican la precedencia (nivel 1)
show((5 + 4) * 2);    -- 18
```

---

## Resolución de ambigüedades { #resolving-ambiguities }

KAFE utiliza el analizador sintáctico **LL(*)** provisto por ANTLR4. Las ambigüedades sintácticas se resuelven mediante:

1. **Precedencia estática**: Definida por el orden secuencial de las reglas en la gramática.
2. **Máxima coincidencia (*maximal munch* o voraz)**: El analizador léxico siempre intenta construir el token más largo posible.

### Ejemplos de máxima coincidencia

```
-- El analizador reconoce "123" como un único token INT, no como 1, 2 y 3
123

-- "==" se reconoce como un token EQ, no como dos tokens "="
a == b

-- "->" inicia un comentario de bloque; no es '-' seguido de '>'
-> comentario <-
```

---

## Implementación en la gramática { #grammar-implementation }

En la gramática ANTLR4 de KAFE, la precedencia se implementa mediante reglas encadenadas de mayor a menor jerarquía:

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

Cada nivel en la jerarquía de reglas corresponde exactamente a un nivel de precedencia en la tabla.
