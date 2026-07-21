# Errores Sintácticos

Los errores sintácticos ocurren cuando el código no cumple con la gramática del lenguaje.

---

## Errores Comunes

### Falta Identificador en Declaración

```
-- Error
INT = 5;

-- Mensaje
SyntaxError at line 1:4 -> ...
```

### Falta Punto y Coma

```
-- Error
INT x = 5
show(x);

-- Mensaje
SyntaxError at line 2:0 -> ...
```

### Falta Dos Puntos en Bloque

```
-- Error
if (True)
    show("hola");
;

-- Mensaje
SyntaxError at line 1:8 -> ...
```

### Paréntesis Sin Cerrar

```
-- Error
show((5 + 3);

-- Mensaje
SyntaxError at line 1:11 -> ...
```

### Operador Inválido

```
-- Error
INT x = 5 ++ 3;

-- Mensaje
SyntaxError at line 1:10 -> ...
```

### Tipo Inválido

```
-- Error
LISTO x = 5;

-- Mensaje
SyntaxError at line 1:5 -> ...
```

---

## Errores en Expresiones

### Indexación en No-Lista

```
-- Error (esto es válido sintácticamente pero falla en runtime)
STR a = "Hola";
a[0] = 'd';

-- Mensaje
TypeError: variable is not of type object
```

### Lambdas Mal Formadas

```
-- Error
FUNC(INT)=>INT f = (x) => x + 1;

-- Mensaje (falta tipo del parámetro)
SyntaxError at line 1:22 -> ...
```

---

## Diagnóstico

Los errores de ANTLR4 incluyen:

- **Número de línea**: `at line X`
- **Columna**: `:Y`
- **Mensaje descriptivo**: Descripción del problema

```bash
# Ejemplo de salida
Syntax Error [Line 3, Column 15]: mismatched input ';' expecting '=>' 
```
