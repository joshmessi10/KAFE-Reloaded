# Manejo de Listas

Las listas son la principal estructura de datos de KAFE. Almacenan colecciones de elementos del mismo tipo.

---

## Declaración

```kafe
-- Lista vacía
List[INT] numeros = [];

-- Lista inicializada
List[BOOL] flags = [True, False, True];

-- Lista de listas (matriz)
List[List[INT]] matriz = [[1, 2], [3, 4]];

-- Matriz 3D
List[List[List[BOOL]]] cubo = [[[True, False]]];
```

---

## Funciones Built-in

| Función | Firma | Descripción |
|---------|-------|-------------|
| `append` | `append(lista, elem)` | Agrega `elem` al final de la lista |
| `remove` | `remove(lista, elem)` | Elimina la primera ocurrencia de `elem` |
| `len` | `len(lista) => INT` | Retorna el número de elementos |
| `range` | `range(n)` / `range(a,b)` / `range(a,b,p)` | Genera una lista de enteros |

```kafe
List[INT] nums = [1, 2, 3];

append(nums, 4);    -- nums = [1, 2, 3, 4]
remove(nums, 2);    -- nums = [1, 3, 4]
show(len(nums));    -- 3
show(range(5));     -- [0, 1, 2, 3, 4]
```

---

## Acceso por Índice

Los elementos se acceden mediante índice **base 0**:

```kafe
List[INT] nums = [10, 20, 30];

show(nums[0]);   -- 10 (primer elemento)
show(nums[1]);   -- 20 (segundo elemento)
show(nums[-1]);  -- 30 (último elemento, negativo)
show(nums[-2]);  -- 20 (penúltimo)
```

### Modificación por Índice

```kafe
List[INT] nums = [10, 20, 30];
nums[0] = 99;
show(nums[0]);  -- 99
```

### Indexación Anidada (Matrices)

```kafe
List[List[INT]] matriz = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

show(matriz[0][0]);  -- 1
show(matriz[1][2]);  -- 6
show(matriz[-1][-1]); -- 9
```

---

## Reglas de Indexación

| Regla | Descripción |
|-------|-------------|
| **Base Cero** | El primer elemento siempre tiene índice 0 |
| **Índices Negativos** | `lista[-1]` es el último, `lista[-2]` el penúltimo |
| **Error de Rango** | Acceder a un índice inexistente lanza `IndexError` |
| **Tipo de Índice** | El índice debe ser un `INT` |

---

## Concatenación de Listas

El operador `+` permite concatenar listas del mismo tipo:

```kafe
List[INT] a = [1, 2];
List[INT] b = [3, 4];
List[INT] c = a + b;  -- [1, 2, 3, 4]

-- Agregar un elemento como lista
List[INT] d = a + [5];  -- [1, 2, 5]
```

---

## Homogeneidad

Todas las listas deben ser **homogéneas** (mismo tipo de elementos):

```kafe
-- Válido
List[INT] nums = [1, 2, 3];
List[List[INT]] mat = [[1, 2], [3, 4]];

-- Inválido (lanza error)
List[BOOL] invalida = [True] + [[False]];  -- Error: tipos mixtos
```

---

## Listas como Matrices

Las listas anidadas se usan como matrices para operaciones de álgebra lineal:

```kafe
-- Matriz 2x3
List[List[INT]] matriz = [
    [1, 2, 3],
    [4, 5, 6]
];

-- Acceder a una fila
show(matriz[0]);  -- [1, 2, 3]

-- Acceder a un elemento
show(matriz[1][2]);  -- 6

-- Obtener dimensiones
show(len(matriz));      -- 2 filas
show(len(matriz[0]));   -- 3 columnas
```

---

## Ejemplo Completo

```kafe
-- Operaciones con listas
List[INT] numeros = [1, 2, 3];
List[STR] letras = ["a", "b"];
List[BOOL] flags = [True];
List[List[List[STR]]] cadenas = [];

show(numeros);   -- [1, 2, 3]
show(cadenas);   -- []

append(numeros, 99);
append(letras, "z");
append(flags, False);
append(cadenas, [[["asdf"]]]);

show(numeros);   -- [1, 2, 3, 99]
show(letras);    -- [a, b, z]

remove(numeros, 2);
remove(letras, "a");

show(numeros);   -- [1, 99]
show(letras);    -- [b, z]

show(len(numeros));  -- 2
```
