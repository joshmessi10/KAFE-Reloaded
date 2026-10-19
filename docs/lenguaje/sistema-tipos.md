# Sistema de Tipos

KAFE es un lenguaje de **tipado estático explícito**: toda variable debe declararse con su tipo antes de usarse.

**Sintaxis de declaración:**

```kafe
TIPO nombre_variable = valor;
```

!!! info "Convención"
    Todas las instrucciones deben terminar con punto y coma (`;`).

---

## Tipos Primitivos

| Tipo | Descripción | Ejemplo | Valores Válidos |
|------|-------------|---------|-----------------|
| `INT` | Entero (64-bit) | `INT a = 5;` | …, -1, 0, 1, … |
| `FLOAT` | Punto flotante | `FLOAT e = 2.5;` | 3.14, -0.5 |
| `BOOL` | Booleano | `BOOL b = True;` | `True`, `False` |
| `STR` | Cadena de texto | `STR s = 'Hola';` | Texto entre comillas |
| `VOID` | Unitario (sin valor) | `=> VOID` (solo en funciones) | No asignable |

### Tipo Unitario — VOID

El tipo `VOID` representa la ausencia de un valor significativo. Se utiliza exclusivamente en firmas de funciones que no retornan un resultado.

```kafe
drip saludar(nombre: STR) => VOID:
    show("Hola " + nombre);
;
```

!!! warning "Restricción"
    No es posible declarar variables de tipo VOID: `VOID x;` es inválido.

---

## Especificación Formal del Sistema de Tipos

El sistema de tipos se formaliza mediante juicios de tipado basados en el contexto Γ (Gamma):

**Juicio de Tipado:**

> Γ ⊢ e : τ — "Bajo el contexto Γ, la expresión 'e' tiene el tipo 'τ'"

**Regla de Coerción:**

> Γ ⊢ e1 : INT, Γ ⊢ e2 : FLOAT ⟹ Γ ⊢ e1 + e2 : FLOAT

---

## Reglas de Compatibilidad y Coerción

KAFE es estricto en asignaciones, pero flexible en operaciones aritméticas:

- **Coerción Automática**: En operaciones entre INT y FLOAT, el INT se promueve a FLOAT (`5 + 2.0 = 7.0`)
- **Asignación Estricta**: No existe coerción implícita en la asignación. `INT x = 5.5;` lanza `TypeError`
- **Operaciones Válidas**: Aritméticas (`+`, `-`, `*`, `/`, `^`, `%`) válidas para INT y FLOAT

### Matriz de Compatibilidad

| L \ R | INT | FLOAT | STR | BOOL |
|-------|-----|-------|-----|------|
| **INT** | `+, -, *, /, %, ^` | FLOAT (`+, -, *, /, ^`) | STR (concat) | Error |
| **FLOAT** | FLOAT (`+, -, *, /, ^`) | `+, -, *, /, ^` | STR (concat) | Error |
| **STR** | STR (concat) | STR (concat) | STR (concat) | STR (concat) |
| **BOOL** | Error | Error | STR (concat) | `&&, \|\|, ==, !=` |

!!! note "Nota"
    Cualquier operación no listada producirá un `TypeError` en tiempo de ejecución.

---

## Tipos Compuestos — Listas

Las listas almacenan colecciones de elementos del mismo tipo, incluyendo otras listas (matrices).

```kafe
-- Lista vacía
List[INT] numeros = [];

-- Lista inicializada
List[BOOL] flags = [True, False, True];

-- Lista de listas (matriz 2×2)
List[List[INT]] matriz = [[1, 2], [3, 4]];

-- Matriz 3D
List[List[List[BOOL]]] cubo = [[[True, False]]];
```

### Reglas de Homogeneidad

- Todos los elementos de una lista deben tener el mismo tipo
- Las listas vacías (`[]`) son compatibles con cualquier tipo de lista
- Las listas anidadas deben mantener consistencia dimensional

---

## Tipo Funcional — FUNC

El tipo `FUNC` describe funciones de primer orden que pueden ser pasadas como argumentos o almacenadas en variables.

**Sintaxis:**

```kafe
FUNC(TIPO_ENTRADA) => TIPO_SALIDA
```

**Ejemplo:**

```kafe
drip sumar(a: INT, b: INT) => INT:
    return a + b;
;

FUNC(INT)=>INT sumarQuince = sumar(15);
sumarQuince(5);   -- Imprime 20
```

### Propiedades del tipo FUNC

KAFE implementa **Invariancia** para los tipos de función:

- **Firma Exacta**: Una variable `FUNC(T1)=>T2` solo acepta funciones con esos tipos exactos
- **Invariancia**: No existe subtipado entre funciones (`FUNC(INT)=>INT` no es compatible con `FUNC(FLOAT)=>FLOAT`)

```kafe
-- Función de orden superior
drip aplicar(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

drip duplicar(x: INT) => INT:
    return x * 2;
;

show(aplicar(duplicar, 5));  -- 10
```

---

## Tipos de Modelos

### GESHA

Tipo para modelos y capas de redes neuronales:

```kafe
GESHA model = geshaDeep.binary();
```

### PARDOS

Tipo para DataFrames (estructuras de datos tabulares):

```kafe
PARDOS df = pardos.read_csv("datos.csv");
```

### MACHINE

Tipo para objetos de Machine Learning:

```kafe
MACHINE lr = machine.linear_regression();
```

---

## Mutabilidad

| Elemento | Mutabilidad |
|----------|-------------|
| **Variables** | Mutables en valor, inmutables en tipo |
| **Listas** | Mutables (cambiar, agregar, eliminar elementos) |
| **Cadenas (STR)** | Inmutables (operaciones retornan nueva cadena) |

```kafe
-- Variable mutable
INT x = 10;
x = 20;     -- Válido

-- Lista mutable
List[INT] L = [1, 2, 3];
L[0] = 99;  -- Válido
append(L, 4); -- Válido

-- STR inmutable (crea nueva cadena)
STR s = "Hola";
STR s2 = s + " Mundo";  -- s sigue siendo "Hola"
```
