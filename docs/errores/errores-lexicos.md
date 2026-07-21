# Errores Léxicos

Los errores léxicos ocurren durante la fase de tokenización, cuando el Lexer no puede reconocer un carácter o secuencia.

---

## Errores Comunes

### String sin Cerrar

```
-- Error
show("Hola mundo);

-- Mensaje
SyntaxError: unterminated string literal at line 1:11
```

### String sin Cerrar (comilla simple)

```
-- Error
STR s = 'Hola;

-- Mensaje
SyntaxError: unterminated string literal at line 1:9
```

### Salto de Línea en String

```
-- Error
show("Hola
mundo");

-- Mensaje
SyntaxError: unterminated string literal at line 1:5
```

### Secuencia de Escape Inválida

```
-- Error
show("Hola\qMundo");

-- Mensaje
Invalid escape sequence: \q
```

### Secuencia de Escape Inválida (otro ejemplo)

```
-- Error
show("Hola\uMundo");

-- Mensaje
Invalid escape sequence: \u
```

### Backslash al Final de String

```
-- Error
show("Hola\");

-- Mensaje
Incomplete escape sequence at end of string
```

---

## Secuencias de Escape Válidas

| Secuencia | Descripción |
|-----------|-------------|
| `\n` | Nueva línea |
| `\t` | Tabulación |
| `\r` | Retorno de carro |
| `\\` | Backslash literal |
| `\"` | Comilla doble literal |
| `\'` | Comilla simple literal |

Cualquier otra secuencia (como `\q`, `\u`, `\x`) produce un error.

---

## Errores de Notación Científica

```
-- Error
show(1.23e);

-- Mensaje
Scientific Notation Error [Line 1, Column 8]: <msg>
```

!!! note "Nota"
    La notación científica es válida: `2.5e10`, `1.2e-3`. Solo falla si está incompleta.
