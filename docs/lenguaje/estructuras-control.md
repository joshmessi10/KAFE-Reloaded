# Estructuras de Control

---

## Condicionales

Las estructuras condicionales permiten ejecutar distintos bloques de código según condiciones lógicas.

**Sintaxis general:**

```kafe
if (condición):
    // bloque verdadero
; elif (condición):
    // bloque alternativo
; else:
    // bloque por defecto
;
```

| Elemento | Descripción |
|----------|-------------|
| `if (cond) :` | Inicia el bloque. Los dos puntos (`:`) son obligatorios |
| `elif (cond) :` | Condición alternativa evaluada si la anterior fue `False` |
| `else :` | Bloque por defecto si ninguna condición se cumplió |
| `;` | Delimitador de cierre del bloque |

### Reglas de Bloque

- El símbolo `:` marca el comienzo de un bloque
- El símbolo `;` marca el cierre del bloque
- La indentación no es obligatoria pero se recomienda (4 espacios)

### Ejemplo

```kafe
INT edad = 25;
BOOL tieneLicencia = True;

if (edad >= 18):
    if (tieneLicencia):
        show("Puede conducir con normalidad");
    ; else:
        show("No tiene licencia");
    ;
; else:
    show("Es menor de edad");
;
```

---

## Bucle while

Ejecuta un bloque repetidamente mientras la condición sea verdadera.

**Sintaxis:**

```kafe
while (condición):
    // instrucciones
    ;
```

!!! warning "Límite de iteraciones"
    KAFE tiene un límite de **10,000 iteraciones** por bucle `while` para prevenir bucles infinitos.

```kafe
INT i = 0;
while (i < 5):
    show(i);
    i = i + 1;
    ;
```

---

## Bucle for

Itera sobre los elementos de una colección o sobre un rango numérico.

**Sintaxis:**

```kafe
for (elemento in colección):
    // instrucciones
    ;
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `elemento` | variable | Variable que toma el valor de cada elemento |
| `colección` | `List[T]` / `range` | Lista o rango sobre el que se itera |

### Iterar sobre lista

```kafe
List[STR] letras = ['K', 'A', 'F', 'E'];
for (l in letras):
    show(l);
;
```

### Iterar sobre rango

```kafe
for (i in range(0, 10)):
    show(i);
;
```

---

## Función range()

Genera una secuencia de enteros. Puede recibir uno, dos o tres argumentos:

| Forma | Parámetros | Comportamiento | Ejemplo |
|-------|-----------|----------------|---------|
| `range(n)` | `n: INT` | Secuencia de 0 hasta n-1 | `range(4)` → `[0,1,2,3]` |
| `range(a, b)` | `a, b: INT` | Secuencia desde a hasta b-1 | `range(1,4)` → `[1,2,3]` |
| `range(a, b, p)` | `a, b, p: INT` | Secuencia con incremento p | `range(0,5,2)` → `[0,2,4]` |

### Comportamiento y Casos Especiales

- **Límites**: El límite superior (stop) nunca se incluye
- **Paso Negativo**: Si `p < 0`, genera secuencia decreciente (`range(5, 0, -1)`)
- **Paso Nulo**: Si `p = 0`, lanza error de ejecución
- **Retorno**: `range()` retorna un objeto de tipo `List[INT]`

```kafe
show(range(4));        -- [0, 1, 2, 3]
show(range(1, 5));     -- [1, 2, 3, 4]
show(range(0, 10, 2)); -- [0, 2, 4, 6, 8]
show(range(5, 0, -1)); -- [5, 4, 3, 2, 1]
```

---

## break y continue

!!! note "Nota"
    Actualmente KAFE **no soporta** `break` ni `continue` dentro de bucles. Para salir de un bucle, se puede usar una condición de control o `return` dentro de una función.

---

## Ejemplo Completo

```kafe
-- FizzBuzz
for (i in range(1, 21)):
    if (i % 15 == 0):
        show("FizzBuzz");
    ; elif (i % 3 == 0):
        show("Fizz");
    ; elif (i % 5 == 0):
        show("Buzz");
    ; else:
        show(i);
    ;
;
```
