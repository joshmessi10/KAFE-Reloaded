# Errores Semánticos

Los errores semánticos ocurren durante la ejecución cuando el código es sintácticamente válido pero viola las reglas del lenguaje.

---

## Errores de Tipo

### Asignación de Tipo Incorrecto

```
-- Error
INT x = 5.5;

-- Mensaje
TypeError: Expected INT, obtained FLOAT
```

### Asignación a Lista Incompatible

```
-- Error
List[FLOAT] a = [5.32, 0.234, 3.14, 2.7];
a[3] = 45;  -- 45 es INT, se espera FLOAT

-- Mensaje
TypeError: Expected FLOAT, obtained INT
```

### Void como Tipo de Variable

```
-- Error
VOID a = 5;

-- Mensaje
TypeError: VOID cannot be used as variable type
```

### Void como Parámetro

```
-- Error
drip mostrar(mensaje: VOID) => VOID:
    show(mensaje);
;

-- Mensaje
TypeError: VOID cannot be used as parameter type
```

---

## Errores de Nombre

### Variable No Definida

```
-- Error
show(x);

-- Mensaje
NameError: Variable 'x' not defined
```

### Función No Definida

```
-- Error
drip suma(a: INT, b: INT) => INT:
    return a + b;
;

mostrar(1, 2);  -- Nombre incorrecto

-- Mensaje
NameError: Function 'mostrar' not defined
```

### Redeclaración de Variable

```
-- Error
INT var = 234;
BOOL var = True;

-- Mensaje
NameError: Variable 'var' already defined
```

### Redeclaración de Función

```
-- Error
drip multiplicar(a: INT, b: INT) => INT:
    return a * b;
;

drip multiplicar(a: INT) => INT:
    return a * a;
;

-- Mensaje
NameError: Function 'multiplicar' already defined
```

---

## Errores de Índice

### Índice No Entero

```
-- Error
List[List[INT]] matriz = [[1, 2], [3, 4]];
show(matriz[4.5][2 - 1]);

-- Mensaje
IndexError: Index must be an integer, obtained FLOAT
```

### Índice Fuera de Rango

```
-- Error
STR a = "Hello";
show(a[45]);

-- Mensaje
IndexError: Index 45 out of bounds for collection of size 5
```

---

## Errores de Función

### Número Incorrecto de Argumentos

```
-- Error
drip suma(a: INT, b: INT) => INT:
    return a + b;
;

show(suma(1));  -- Falta un argumento

-- Mensaje
Exception: 'suma' expects 2 args, got 1
```

### Tipo de Argumento Incorrecto

```
-- Error
drip suma(a: INT, b: INT) => INT:
    return a + b;
;

show(suma("hola", 5));  -- "hola" no es INT

-- Mensaje
TypeError: Function suma expects argument of type INT, got type STR
```

### Retorno de Tipo Incorrecto

```
-- Error
drip suma(a: INT, b: INT) => INT:
    return bool(a + b);  -- Retorna BOOL, se espera INT
;

-- Mensaje
TypeError: Expected INT, obtained BOOL
```

### Función VOID Retornando Valor

```
-- Error
drip mostrar(a: INT, b: INT) => VOID:
    return 5;  -- No debería retornar nada
;

-- Mensaje
TypeError: Function declared VOID must not return a value
```

---

## Errores de Listas

### Lista No Homogénea

```
-- Error
List[BOOL] a = [True] + [[False]];

-- Mensaje
Exception: Expected homogeneous list
```

### Modificación de Tipo Incorrecto

```
-- Error
List[List[INT]] a = [[5, 4], [4, 34]];
a[0] = 5;  -- 5 no es List[INT]

-- Mensaje
TypeError: Expected List[INT], obtained INT
```

---

## Errores de Bucles

### Bucle Infinito

```
-- Error
INT i = 0;
while (True):
    i = i + 1;
;

-- Mensaje
RuntimeError: Maximum number of iterations exceeded in while loop
```

### Variable No Iterable en For

```
-- Error
INT x = 5;
for (i in x):
    show(i);
;

-- Mensaje
TypeError: Variable in for must be iterable, got INT
```

### Condición No Booleana

```
-- Error
INT x = 5;
while (x):
    show(x);
;

-- Mensaje
TypeError: Condition in while must be boolean, got INT
```

---

## Errores de Importación

### Módulo No Encontrado

```
-- Error
import inexistente;

-- Mensaje
FileNotFoundError: Module file for 'inexistente' not found. Tried: ...
```

### Biblioteca No Importada

```
-- Error (sin import numk)
show(numk.add([[1]], [[2]]));

-- Mensaje
Exception: library not imported
```

---

## Errores de Archivos

### Archivo No Encontrado

```
-- Error
STR contenido = files.read("no_existe.txt");

-- Mensaje
FileNotFoundError: File 'no_existe.txt' not found at /ruta/
```

### Archivo Ya Existe

```
-- Error
files.create("existente.txt");  -- Ya existe

-- Mensaje
FileExistsError: File 'existente.txt' already exists at /ruta/
```
