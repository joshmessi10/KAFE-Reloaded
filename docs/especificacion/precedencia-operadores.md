# Precedencia de Operadores

La precedencia determina el orden de evaluación en ausencia de paréntesis.

---

## Tabla de Precedencia

| Nivel | Operadores | Asociatividad | Descripción Formal |
|-------|-----------|---------------|-------------------|
| 1 | `()`, `[]`, `.` | Izquierda | Agrupación, Indexación, Acceso a Módulos |
| 2 | `f(args)` | Izquierda | Invocación de función y currificación |
| 3 | `!`, `-` | Derecha | Operadores unarios (NOT y Negación) |
| 4 | `^` | Derecha | Exponenciación |
| 5 | `*`, `/`, `%` | Izquierda | Multiplicación, División y Módulo |
| 6 | `+`, `-` | Izquierda | Suma/Concatenación y Resta |
| 7 | `<`, `<=`, `>`, `>=` | Izquierda | Comparación relacional |
| 8 | `==`, `!=` | Izquierda | Igualdad |
| 9 | `&&` | Izquierda | Conjunción lógica |
| 10 | `\|\|` | Izquierda | Disyunción lógica |
| 11 | `=`, `+=`, `-=` | Derecha | Asignación simple y compuesta |

---

## Ejemplos de Precedencia

```kafe
-- Nivel 5 vs 6: Multiplicación antes que Suma
show(5 + 4 * 2);      -- 13, no 18

-- Nivel 4 vs 5: Potencia antes que Multiplicación
show(5 ^ 2 * 2);      -- 50, no 100

-- Nivel 3: Unarios
show(-3 - -3);        -- 0

-- Paréntesis cambia precedencia (Nivel 1)
show((5 + 4) * 2);    -- 18
```

---

## Resolución de Ambigüedades

KAFE utiliza un motor de parseo **LL(*)** proporcionado por ANTLR4. Las ambigüedades sintácticas se resuelven mediante:

1. **Precedencia Estática**: Definida por el orden de las reglas en la gramática
2. **Máxima Coincidencia (Greedy)**: El lexer siempre intenta construir el token más largo posible

### Ejemplo de Greedy

```
-- El lexer reconoce "123" como un solo token INT, no como 1, 2, 3
123

-- "==" se reconoce como un solo token EQ, no como dos "="
a == b

-- "->" inicia comentario de bloque, no es '-' seguido de '>'
-> comentario <-
```

---

## Implementación en la Gramática

En la gramática ANTLR4, la precedencia se codifica mediante reglas encadenadas de mayor a menor precedencia:

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

Cada nivel de la jerarquía de reglas corresponde a un nivel de precedencia en la tabla.
