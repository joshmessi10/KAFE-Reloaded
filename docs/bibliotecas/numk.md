# NUMK — Álgebra Lineal

NUMK es la librería de álgebra lineal de KAFE, inspirada en NumPy. Permite operar con matrices y vectores.

**Importación:**

```kafe
import numk;
```

---

## Referencia de Funciones

| Función | Firma Formal | Descripción |
|---------|-------------|-------------|
| `numk.add` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Suma elemento a elemento |
| `numk.sub` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Resta elemento a elemento |
| `numk.mul` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Multiplicación matricial |
| `numk.transpose` | `(List[List[NUM]]) -> List[List[NUM]]` | Transpone la matriz |
| `numk.inv` | `(List[List[FLOAT]]) -> List[List[FLOAT]]` | Calcula la inversa |
| `numk.dot` | `(List[NUM], List[NUM]) -> NUM` | Producto punto |
| `numk.zeros` | `(INT) -> List[NUM]` | Vector de ceros |
| `numk.zeros_matrix` | `(INT, INT) -> List[List[NUM]]` | Matriz de ceros |
| `numk.shape` | `(lista) -> tuple en Python` | Forma rectangular; conserva el retorno histórico |

---

## Ejemplos

### Suma de Matrices

```kafe
import numk;

List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];

show(numk.add(A, B));
-- [[6, 8], [10, 12]]
```

### Transposición

```kafe
List[List[INT]] A = [[1, 2], [3, 4]];
show(numk.transpose(A));
-- [[1, 3], [2, 4]]
```

### Multiplicación Matricial

```kafe
List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];
show(numk.mul(A, B));
-- [[19, 22], [43, 50]]
```

### Inversa

```kafe
List[List[INT]] M = [[2, 1], [7, 4]];
show(numk.inv(M));
-- [[4.0, -1.0], [-7.0, 2.0]]
```

### Vectores y Formas

```kafe
List[INT] v = [1, 2, 3];
show(numk.zeros(3));         -- [0, 0, 0]
show(numk.zeros_matrix(2, 3)); -- [[0,0,0],[0,0,0]]
show(numk.shape([[1,2,3],[4,5,6]])); -- (2, 3)
```

---

## Manejo de Errores

| Error | Causa |
|-------|-------|
| **Dimensión** | Matrices de diferente tamaño en `add`/`sub` |
| **Multiplicación** | Columnas(A) ≠ Filas(B) en `mul` |
| **Inversibilidad** | Determinante = 0 o matriz no cuadrada en `inv` |

!!! note "Tipos soportados"
    NUMK opera con `INT` y `FLOAT`.

## Listas N-dimensionales

NUMK representa tensores con listas KAFE normales, sin clase Tensor.
`tensor(data)` valida que todas las ramas tengan la misma forma y que las
hojas sean números; devuelve una copia independiente. En Python también acepta
un escalar. Las formas con ceros producen listas vacías; las dimensiones
negativas o no enteras se rechazan. `shape` conserva su tuple Python por
compatibilidad: desde KAFE se puede mostrar, pero no asignar a `List[INT]`.

| Operación | Comportamiento |
|---|---|
| `tensor(data)` | Copia numérica validada |
| `zeros_nd(shape)`, `ones(shape)` | Creación ND |
| `random_tensor(shape, low, high, seed)` | Semilla opcional local, sin alterar RNG global |
| `emul(a,b)` | Multiplicación elemento a elemento, formas idénticas |
| `broadcast_add/sub/mul/div(a,b)` | Escalares y listas ND; dimensiones alineadas a la derecha |
| `exp_tensor(data)` | Exponencial por elemento mediante KafeMATH |
| `sum_axis(a,axis)`, `max_axis(a,axis)` | Ejes negativos válidos; fuera de rango produce error |
| `reshape(a,new_shape)` | Reorganiza sin cambiar el número de elementos |
| `scalar_mul(s,a)`, `sum_all(a)`, `abs_tensor(a)` | Operaciones ND |

La API Python `map_elements(operation, *values)` aplica una fórmula escalar
a estructuras de igual forma. Es el único recorrido reutilizado por las
activaciones, pérdidas y optimizadores de GESHA; no realiza broadcasting.

```kafe
import numk;
List[List[List[FLOAT]]] x = numk.tensor([[[1.0, 2.0]], [[3.0, 4.0]]]);
show(numk.broadcast_add(x, [10.0, 20.0]));
show(numk.sum_axis(x, -1));
```

Broadcasting admite `[B,C] + [C]` incluso para B=1, columnas `[B,1]`,
escalares y rangos superiores. La salida es una lista nueva. La división por
cero produce un error; las formas incompatibles no se truncan silenciosamente.
