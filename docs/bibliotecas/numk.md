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
| `numk.shape` | `(List[List[NUM]]) -> List[INT]` | Dimensiones de la matriz |

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
show(numk.shape([[1,2,3],[4,5,6]])); -- [2, 3]
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
