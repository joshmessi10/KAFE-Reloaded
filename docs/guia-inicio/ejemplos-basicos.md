# Ejemplos Básicos

## Declaración de Variables

```kafe
-- Tipos primitivos
INT a = 5;
BOOL b = True;
STR c = 'Hola';
STR d = "Mundo";
FLOAT e = 3.14;

-- Listas
List[INT] numeros = [1, 2, 3];
List[BOOL] flags = [True, False, True];
List[List[FLOAT]] matriz = [[1.5, 2.5], [3.5, 4.5]];

-- Listas anidadas (matrices)
List[List[INT]] matriz2 = [
    [234, 234],
    [2341, 1234]
];

-- Declaración sin inicialización
INT x;          -- x = 0
List[INT] L;    -- L = []
```

---

## Operadores

### Aritméticos

```kafe
show(5 + 4);      -- 9
show(10 - 3);     -- 7
show(3 * 4);      -- 12
show(10 / 4);     -- 2.5
show(5 ^ 2);      -- 25
show(5 % 4);      -- 1
show(5 + 4 * 2);  -- 13 (precedencia)
show((5 + 4) * 2); -- 18 (paréntesis)
```

### Comparación

```kafe
show(4 == 5);  -- False
show(5 == 5);  -- True
show(4 != 5);  -- True
show(4 < 5);   -- True
show(6 <= 6);  -- True
show(4 > 5);   -- False
show(6 >= 6);  -- True
```

### Lógicos

```kafe
show(True && False);  -- False
show(True || False);  -- True
show(!False);         -- True
show(!True);          -- False
```

### Concatenación

```kafe
show('asdf' + "qwerty");       -- asdfqwerty
show([1, 2] + [3, 4]);         -- [1, 2, 3, 4]
```

---

## Strings y Secuencias de Escape

```kafe
-- Secuencias de escape soportadas
STR s = "Hola\n\tMundo!\" a \"";
show(s);
```

| Secuencia | Descripción |
|-----------|-------------|
| `\n` | Nueva línea |
| `\t` | Tabulación |
| `\r` | Retorno de carro |
| `\\` | Backslash literal |
| `\"` | Comilla doble literal |
| `\'` | Comilla simple literal |

!!! error "Errores comunes"
    - `\q` o `\u` → Error: secuencia de escape inválida
    - `\` al final de string → Error: secuencia incompleta
    - String sin cerrar → Error de sintaxis

---

## Funciones Built-in

```kafe
-- show() - Imprimir
show(5);
show("Hola");
show([1, 2, 3]);

-- pour() - Leer entrada
STR input = pour("Ingresa algo: ");

-- range() - Generar secuencias
show(range(4));        -- [0, 1, 2, 3]
show(range(1, 5));     -- [1, 2, 3, 4]
show(range(0, 10, 2)); -- [0, 2, 4, 6, 8]

-- len() - Longitud
show(len([1, 2, 3]));  -- 3
show(len("Hola"));     -- 4

-- append() - Agregar elemento
List[INT] nums = [1, 2];
append(nums, 3);       -- nums = [1, 2, 3]

-- remove() - Eliminar elemento
remove(nums, 2);       -- nums = [1, 3]

-- Conversiones de tipo
INT a = int("5");      -- 5
FLOAT b = float("3.14"); -- 3.14
STR c = str(42);       -- "42"
BOOL d = bool(1);      -- True
```

---

## Indexación de Listas

```kafe
List[INT] nums = [10, 20, 30];

-- Índice base 0
show(nums[0]);   -- 10

-- Índices negativos
show(nums[-1]);  -- 30 (último elemento)

-- Modificación
nums[0] = 99;
show(nums[0]);   -- 99

-- Matrices (listas anidadas)
List[List[INT]] matriz = [[1, 2], [3, 4]];
show(matriz[1][0]);  -- 3
```

---

## Comentarios

```kafe
-- Comentario de una sola línea

INT x = 10;  -- Comentario al final

->
Este es un
comentario de
múltiples líneas
<-

INT y = 20;
```
