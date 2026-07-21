# Operadores y Expresiones

---

## Operadores Aritméticos

| Operador | Operación | Ejemplo | Resultado |
|----------|-----------|---------|-----------|
| `+` | Suma / Concatenación | `show(5 + 4);` | `9` |
| `-` | Resta | `show(10 - 3);` | `7` |
| `*` | Multiplicación | `show(3 * 4);` | `12` |
| `/` | División | `show(10 / 4);` | `2.5` |
| `^` | Potencia | `show(5 ^ 2);` | `25` |
| `%` | Módulo (residuo) | `show(5 % 4);` | `1` |

```kafe
show(5 + 4 * 2);     -- 13 (multiplicación primero)
show((5 + 4) * 2);   -- 18 (paréntesis cambia precedencia)
show(5 ^ 2 * 2);     -- 50 (potencia primero)
show(-3 - -3);       -- 0
show('asdf' * 5);    -- asdfasdfasdfasdfasdf
```

---

## Operadores de Comparación

| Operador | Significado | Ejemplo |
|----------|-------------|---------|
| `==` | Igual a | `a == b` |
| `!=` | Distinto de | `a != b` |
| `<` | Menor que | `a < b` |
| `<=` | Menor o igual | `a <= b` |
| `>` | Mayor que | `a > b` |
| `>=` | Mayor o igual | `a >= b` |

```kafe
show(4 == 5);   -- False
show(5 == 5);   -- True
show(4 != 5);   -- True
show(4 < 5);    -- True
show(6 <= 6);   -- True
show('asdf' == 'asdf');  -- True
show([12, 1] == [12, 1]); -- True
```

---

## Operadores Lógicos

| Operador | Significado | Ejemplo |
|----------|-------------|---------|
| `&&` | AND lógico | `a > 0 && b > 0` |
| `\|\|` | OR lógico | `a > 0 \|\| b > 0` |
| `!` | NOT unario | `!True` |

```kafe
show(True && False);  -- False
show(True || False);  -- True
show(!False);         -- True
show(!True);          -- False
```

---

## Operador de Asignación

| Sintaxis | Descripción |
|----------|-------------|
| `ID = expresion;` | Asignación simple |
| `ID[idx] = expresion;` | Asignación indexada (para List) |

```kafe
INT x = 10;
x = x + 5;           -- Re-asignación

List[INT] L = [1, 2];
L[0] = 99;           -- Asignación indexada
```

---

## Instrucción de Salida — show()

```kafe
show(5 + 4 * 2);    -- 13
show((5 + 4) * 2);  -- 18
show(5 ^ 2 * 2);    -- 50
show("Hola KAFE");  -- Hola KAFE
show([1, 2, 3]);    -- [1, 2, 3]
show(True);         -- True
```

---

## Precedencia de Operadores

La precedencia determina el orden de evaluación en ausencia de paréntesis (de mayor a menor prioridad):

| Nivel | Operadores | Asociatividad | Descripción |
|-------|-----------|---------------|-------------|
| 1 | `()`, `[]`, `.` | Izquierda | Agrupación, Indexación, Acceso |
| 2 | `f(args)` | Izquierda | Invocación de función |
| 3 | `!`, `-` | Derecha | Unarios (NOT y Negación) |
| 4 | `^` | Derecha | Exponenciación |
| 5 | `*`, `/`, `%` | Izquierda | Multiplicación, División, Módulo |
| 6 | `+`, `-` | Izquierda | Suma/Concatenación y Resta |
| 7 | `<`, `<=`, `>`, `>=` | Izquierda | Comparación relacional |
| 8 | `==`, `!=` | Izquierda | Igualdad |
| 9 | `&&` | Izquierda | Conjunción lógica |
| 10 | `\|\|` | Izquierda | Disyunción lógica |
| 11 | `=`, `+=`, `-=` | Derecha | Asignación |

---

## Expresiones Lambda

Las lambdas permiten definir funciones anónimas compactas:

```kafe
-- Sintaxis
(parámetros) => expresión

-- Ejemplo
FUNC(INT)=>INT cuadrado = (y: INT) => y * y;
show(cuadrado(4));  -- 16

-- Como argumento de función de orden superior
drip aplicar(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

show(aplicar((y: INT) => y * y, 4));  -- 16
```

**Características:**

- **Retorno Implícito**: El resultado de la expresión es lo que devuelve la lambda
- **Tipado**: Los parámetros deben estar tipados igual que en funciones normales
- **Uso**: Ideales para funciones de orden superior

---

## Conversiones de Tipo

```kafe
INT a = int("5");           -- 5
FLOAT b = float("3.14");    -- 3.14
STR c = str(42);            -- "42"
BOOL d = bool(1);           -- True
BOOL e = bool(0);           -- False
```

---

## Resolución de Ambigüedades

KAFE utiliza un motor de parseo **LL(*)** proporcionado por ANTLR4:

- **Precedencia Estática**: Definida por el orden de las reglas en la gramática
- **Máxima Coincidencia (Greedy)**: El lexer siempre construye el token más largo posible
