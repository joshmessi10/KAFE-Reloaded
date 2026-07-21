# MATH — Funciones Matemáticas

La librería MATH provee funciones y constantes matemáticas avanzadas.

**Importación:**

```kafe
import math;
```

---

## Constantes

| Constante | Valor Aproximado | Descripción |
|-----------|-----------------|-------------|
| `math.pi` | 3.14159… | Número π |
| `math.e` | 2.71828… | Número de Euler |
| `math.tau` | 6.28318… | τ = 2π |
| `math.inf` | ∞ | Infinito positivo |
| `math.nan` | NaN | Not a Number |

```kafe
show(math.pi);   -- 3.141592653589793
show(math.e);    -- 2.718281828459045
show(math.tau);  -- 6.283185307179586
```

---

## Referencia de Funciones

### Trigonometría

| Función | Descripción |
|---------|-------------|
| `math.sin(x)` | Seno (radianes) |
| `math.cos(x)` | Coseno (radianes) |
| `math.tan(x)` | Tangente (radianes) |
| `math.asin(x)` | Arco seno |
| `math.acos(x)` | Arco coseno |
| `math.atan(x)` | Arco tangente |

### Hiperbólicas

| Función | Descripción |
|---------|-------------|
| `math.sinh(x)` | Seno hiperbólico |
| `math.cosh(x)` | Coseno hiperbólico |
| `math.tanh(x)` | Tangente hiperbólica |

### Exponencial y Logaritmos

| Función | Descripción |
|---------|-------------|
| `math.exp(x)` | e^x |
| `math.log(x)` | Logaritmo natural |
| `math.log2(x)` | Logaritmo base 2 |
| `math.log10(x)` | Logaritmo base 10 |

### Potencias y Raíces

| Función | Descripción |
|---------|-------------|
| `math.sqrt(x)` | Raíz cuadrada |
| `math.pow(x, y)` | Potencia (x^y) |
| `math.cbrt(x)` | Raíz cúbica |

### Combinatoria

| Función | Descripción |
|---------|-------------|
| `math.factorial(n)` | Factorial n! |
| `math.comb(n, k)` | Combinaciones C(n,k) |
| `math.perm(n, k)` | Permutaciones P(n,k) |

### Teoría de Números

| Función | Descripción |
|---------|-------------|
| `math.gcd(a, b)` | Máximo común divisor |
| `math.lcm(a, b)` | Mínimo común múltiplo |

### Precisión Flotante

| Función | Descripción |
|---------|-------------|
| `math.abs(x)` | Valor absoluto |
| `math.floor(x)` | Redondeo hacia abajo |
| `math.ceil(x)` | Redondeo hacia arriba |
| `math.round(x)` | Redondeo al entero más cercano |
| `math.trunc(x)` | Truncado |
| `math.fsum(lst)` | Suma precisa de lista |

### Verificación

| Función | Descripción |
|---------|-------------|
| `math.isfinite(x)` | ¿Es finito? |
| `math.isinf(x)` | ¿Es infinito? |
| `math.isnan(x)` | ¿Es NaN? |

### Distancia

| Función | Descripción |
|---------|-------------|
| `math.dist(p1, p2)` | Distancia euclidiana |
| `math.hypot(a, b)` | Hipotenusa √(a²+b²) |

### Otras

| Función | Descripción |
|---------|-------------|
| `math.erf(x)` | Función de error |
| `math.gamma(x)` | Función gamma |

---

## Ejemplos

```kafe
import math;

-- Trigonometría
show(math.sin(math.pi / 2));  -- 1.0
show(math.cos(0));             -- 1.0

-- Logaritmos
show(math.log(math.e));        -- 1.0
show(math.log2(8));            -- 3.0
show(math.log10(100));         -- 2.0

-- Combinatoria
show(math.factorial(5));       -- 120
show(math.comb(10, 3));        -- 120
show(math.perm(10, 3));        -- 720

-- Teoría de números
show(math.gcd(12, 8));         -- 4
show(math.lcm(4, 6));          -- 12

-- Precisión
show(math.abs(-42));           -- 42
show(math.floor(3.7));         -- 3
show(math.ceil(3.2));          -- 4
show(math.sqrt(16));           -- 4.0
```
