# Referencia de Errores

Tabla completa de todos los errores del sistema KAFE, con su tipo, categoría y mensaje.

---

## Errores de Tipos

| Error | Tipo | Mensaje |
|-------|------|---------|
| Void como tipo de variable | `TypeError` | `VOID cannot be used as variable type` |
| Void como parámetro | `TypeError` | `VOID cannot be used as parameter type` |
| Tipo incorrecto en asignación | `TypeError` | `Expected {tipo}, obtained {tipo_real}` |
| Argumento de tipo incorrecto | `TypeError` | `Function {nombre} expects argument of type {tipo}, got type {tipo_real}` |
| Condición no booleana | `TypeError` | `Condition in {lugar} must be boolean, got {tipo}` |
| Variable no iterable | `TypeError` | `Variable in for must be iterable, got {tipo}` |
| Void retornando valor | `TypeError` | `Function declared VOID must not return a value` |
| Firma incompatible | `TypeError` | `Expected {firma}, obtained {firma}` |

---

## Errores de Nombre

| Error | Tipo | Mensaje |
|-------|------|---------|
| Función ya definida | `NameError` | `Function '{nombre}' already defined` |
| Variable ya definida | `NameError` | `Variable '{nombre}' already defined` |
| Función no definida | `NameError` | `Function '{nombre}' not defined` |
| Variable no definida | `NameError` | `Variable '{nombre}' not defined` |

---

## Errores de Índice

| Error | Tipo | Mensaje |
|-------|------|---------|
| Índice no entero | `IndexError` | `Index must be an integer, obtained {tipo}` |
| Índice fuera de rango | `IndexError` | `Index {idx} out of bounds for collection of size {len}` |

---

## Errores de Runtime

| Error | Tipo | Mensaje |
|-------|------|---------|
| Lista no homogénea | `Exception` | `Expected homogeneous list` |
| Número incorrecto de args | `Exception` | `'{nombre}' expects {n} args, got {m}` |
| Bucle infinito | `RuntimeError` | `Maximum number of iterations exceeded in while loop` |
| Módulo no encontrado | `FileNotFoundError` | `Module file for '{nombre}' not found. Tried: {path}` |
| Error en bloque | `RuntimeError` | `Error in {lugar} block: {excepcion}` |

---

## Errores de Archivos

| Error | Tipo | Mensaje |
|-------|------|---------|
| Archivo no encontrado | `FileNotFoundError` | `File '{nombre}' not found at {ruta}` |
| Archivo ya existe | `FileExistsError` | `File '{nombre}' already exists at {ruta}` |

---

## Errores de Firma

| Error | Tipo | Mensaje |
|-------|------|---------|
| Firma incompatível | `TypeError` | `Expected {firma_esperada}, obtained {firma_obtenida}` |
| Número de params incorrecto | `TypeError` | `Function parameter '{nombre}' must accept {n} parameter(s), but got {m}` |

---

## Errores de Strings

| Error | Tipo | Mensaje |
|-------|------|---------|
| Escape inválido | `Exception` | `Invalid escape sequence: \{char}` |
| Escape incompleto | `Exception` | `Incomplete escape sequence at end of string` |
| String sin cerrar | `Exception` | `SyntaxError: unterminated string literal at line {n}:{col}` |

---

## Errores de Notación Científica

| Error | Tipo | Mensaje |
|-------|------|---------|
| Notación científica inválida | `Exception` | `Scientific Notation Error [Line {n}, Column {col}]: {msg}` |

---

## Errores de Sintaxis (ANTLR)

| Error | Tipo | Mensaje |
|-------|------|---------|
| Error de sintaxis general | `Exception` | `SyntaxError at line {n}:{col} -> {msg}` |
| Variable no es objeto | `Exception` | `variable is not of type object` |
| Biblioteca no importada | `Exception` | `library not imported` |
