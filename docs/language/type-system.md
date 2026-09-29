# Type system

KAFE uses **explicit static typing**: every variable must be declared with its type before it is used.

**Declaration syntax:**

```kafe
INT variableName = 42;
```

!!! info "Convention"
    Every statement must end with a semicolon (`;`).

---

## Primitive types

| Type | Description | Example | Valid values |
|------|-------------|---------|-----------------|
| `INT` | Integer (64-bit) | `INT a = 5;` | …, -1, 0, 1, … |
| `FLOAT` | Floating-point number | `FLOAT e = 2.5;` | 3.14, -0.5 |
| `BOOL` | Boolean | `BOOL b = True;` | `True`, `False` |
| `STR` | String | `STR s = 'Hello';` | Quoted text |
| `VOID` | Unit (no value) | `=> VOID` (functions only) | Not assignable |

### Unit type — VOID

The `VOID` type represents the absence of a meaningful value. It is used only in function signatures that do not return a result.

```kafe
drip greet(name: STR) => VOID:
    show("Hello " + name);
;
```

!!! warning "Restriction"
    Variables of type VOID cannot be declared: `VOID x;` is invalid.

---

## Formal type system specification

The type system is formalized using typing judgments in the context Γ (Gamma):

**Typing judgment:**

> Γ ⊢ e : τ — "In context Γ, expression 'e' has type 'τ'."

**Coercion rule:**

> Γ ⊢ e1 : INT, Γ ⊢ e2 : FLOAT ⟹ Γ ⊢ e1 + e2 : FLOAT

---

## Compatibility and coercion rules

KAFE is strict for assignments but flexible for arithmetic operations:

- **Automatic coercion**: In operations between INT and FLOAT, INT is promoted to FLOAT (`5 + 2.0 = 7.0`).
- **Strict assignment**: Assignment does not use implicit coercion. `INT x = 5.5;` raises `TypeError`.
- **Valid operations**: Arithmetic operators (`+`, `-`, `*`, `/`, `^`, `%`) work with INT and FLOAT.

### Compatibility matrix

| L \ R | INT | FLOAT | STR | BOOL |
|-------|-----|-------|-----|------|
| **INT** | `+, -, *, /, %, ^` | FLOAT (`+, -, *, /, ^`) | STR (concat) | Error |
| **FLOAT** | FLOAT (`+, -, *, /, ^`) | `+, -, *, /, ^` | STR (concat) | Error |
| **STR** | STR (concat) | STR (concat) | STR (concat) | STR (concat) |
| **BOOL** | Error | Error | STR (concat) | `&&, \|\|, ==, !=` |

!!! note "Note"
    Any operation not listed produces a `TypeError` at runtime.

---

## Compound types — lists

Lists store collections of elements of the same type, including other lists (matrices).

```kafe
-- Empty list
List[INT] numbers = [];

-- Initialized list
List[BOOL] flags = [True, False, True];

-- List of lists (2×2 matrix)
List[List[INT]] matrix = [[1, 2], [3, 4]];

-- 3D matrix
List[List[List[BOOL]]] cube = [[[True, False]]];
```

### Homogeneity rules

- All elements in a list must have the same type.
- Empty lists (`[]`) are compatible with any list type.
- Nested lists must have consistent dimensions.

---

## Function type — FUNC

The `FUNC` type describes first-class functions that can be passed as arguments or stored in variables.

**Syntax:**

```kafe
FUNC(TIPO_ENTRADA) => TIPO_SALIDA
```

**Example:**

```kafe
drip add(a: INT, b: INT) => INT:
    return a + b;
;

FUNC(INT)=>INT addFifteen = add(15);
addFifteen(5);   -- Prints 20
```

### FUNC type properties

KAFE implements **invariance** for function types:

- **Exact signature**: A `FUNC(T1)=>T2` variable accepts only functions with those exact types.
- **Invariance**: Function types have no subtyping (`FUNC(INT)=>INT` is not compatible with `FUNC(FLOAT)=>FLOAT`).

```kafe
-- Higher-order function
drip apply(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

drip double(x: INT) => INT:
    return x * 2;
;

show(apply(double, 5));  -- 10
```

---

## Model types

### GESHA

Type for neural network models and layers:

```kafe
GESHA model = geshaDeep.binary();
```

### PARDOS

Type for DataFrames (tabular data structures):

```kafe
PARDOS df = pardos.read_csv("data.csv");
```

### MACHINE

Type for machine learning objects:

```kafe
MACHINE lr = machine.linear_regression();
```

---

## Mutability

| Element | Mutability |
|----------|-------------|
| **Variables** | Mutable in value, immutable in type |
| **Lists** | Mutable (elements can be changed, added, or removed) |
| **Strings (STR)** | Immutable (operations return a new string) |

```kafe
-- Mutable variable
INT x = 10;
x = 20;     -- Valid

-- Mutable list
List[INT] L = [1, 2, 3];
L[0] = 99;  -- Valid
append(L, 4); -- Valid

-- Immutable STR (creates a new string)
STR s = "Hello";
STR s2 = s + " World";  -- s remains "Hello"
```
