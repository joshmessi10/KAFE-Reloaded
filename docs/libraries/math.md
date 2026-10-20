# MATH — Mathematical functions

The MATH library provides advanced mathematical functions and constants.

**Import:**

```kafe
import math;
```

---

## Constants

| Constant | Approximate value | Description |
|-----------|-----------------|-------------|
| `math.pi` | 3.14159… | The number π |
| `math.e` | 2.71828… | Euler's number |
| `math.tau` | 6.28318… | τ = 2π |
| `math.inf` | ∞ | Positive infinity |
| `math.nan` | NaN | Not a Number |

```kafe
show(math.pi);   -- 3.141592653589793
show(math.e);    -- 2.718281828459045
show(math.tau);  -- 6.283185307179586
```

---

## Function reference

### Trigonometry

| Function | Description |
|---------|-------------|
| `math.sin(x)` | Sine (radians) |
| `math.cos(x)` | Cosine (radians) |
| `math.tan(x)` | Tangent (radians) |
| `math.asin(x)` | Arcsine |
| `math.acos(x)` | Arccosine |
| `math.atan(x)` | Arctangent |

### Hyperbolic functions

| Function | Description |
|---------|-------------|
| `math.sinh(x)` | Hyperbolic sine |
| `math.cosh(x)` | Hyperbolic cosine |
| `math.tanh(x)` | Hyperbolic tangent |

### Exponentials and logarithms

| Function | Description |
|---------|-------------|
| `math.exp(x)` | e^x |
| `math.log(x)` | Natural logarithm |
| `math.log2(x)` | Base-2 logarithm |
| `math.log10(x)` | Base-10 logarithm |

### Powers and roots

| Function | Description |
|---------|-------------|
| `math.sqrt(x)` | Square root |
| `math.pow(x, y)` | Power (x^y) |
| `math.cbrt(x)` | Cube root |

### Combinatorics

| Function | Description |
|---------|-------------|
| `math.factorial(n)` | Factorial n! |
| `math.comb(n, k)` | Combinations C(n,k) |
| `math.perm(n, k)` | Permutations P(n,k) |

### Number theory

| Function | Description |
|---------|-------------|
| `math.gcd(a, b, ...)` | Greatest common divisor (one or more integers) |
| `math.lcm(a, b, ...)` | Least common multiple (one or more integers) |

### Floating-point functions

| Function | Description |
|---------|-------------|
| `math.abs(x)` | Absolute value |
| `math.floor(x)` | Round down |
| `math.ceil(x)` | Round up |
| `math.round(x)` | Round to the nearest integer |
| `math.trunc(x)` | Truncate |
| `math.fsum(lst)` | Accurate sum of a list |

### Predicates

| Function | Description |
|---------|-------------|
| `math.isfinite(x)` | Is the value finite? |
| `math.isinf(x)` | Is the value infinite? |
| `math.isnan(x)` | Is the value NaN? |

### Distance

| Function | Description |
|---------|-------------|
| `math.dist(p1, p2)` | Euclidean distance |
| `math.hypot(a, b)` | Hypotenuse √(a²+b²) |

### Other functions

| Function | Description |
|---------|-------------|
| `math.erf(x)` | Error function |
| `math.gamma(x)` | Gamma function (positive integers only) |

---

## Examples

```kafe
import math;

-- Trigonometry
show(math.sin(math.pi / 2));  -- 1.0
show(math.cos(0));             -- 1.0

-- Logarithms
show(math.log(math.e));        -- 1.0
show(math.log2(8));            -- 3.0
show(math.log10(100));         -- 2.0

-- Combinatorics
show(math.factorial(5));       -- 120
show(math.comb(10, 3));        -- 120
show(math.perm(10, 3));        -- 720

-- Number theory
show(math.gcd(12, 8));         -- 4
show(math.lcm(4, 6));          -- 12

-- Floating-point functions
show(math.abs(-42));           -- 42
show(math.floor(3.7));         -- 3
show(math.ceil(3.2));          -- 4
show(math.sqrt(16));           -- 4.0
```

## Choosing the right function

MATH works on scalar numbers; use [NUMK](numk.md) for arrays. Trigonometric inputs use radians. `math.log(x)` is the natural logarithm; `math.log2` and `math.log10` use fixed bases. Logarithms need a positive argument, and `sqrt` needs a nonnegative argument.

| Task | Functions |
|---|---|
| Convert angles | `degrees(radians)`, `radians(degrees)` |
| Stable exponent calculations | `exp2(x)` for 2^x; `expm1(x)` for e^x − 1 near zero |
| Compare and inspect floats | `isclose(a, b)`, `isfinite(x)`, `isinf(x)`, `isnan(x)`, `ulp(x)` |
| Remainders and signs | `fmod(x, y)`, `remainder(x, y)`, `copysign(x, y)` |
| Aggregate numbers | `fsum(values)`, `sum(values)`, `prod(values)`, `sumprod(a, b)` |
| Distance and magnitude | `dist(a, b)`, `hypot(x, y, ...)` |
| Special functions | `erf(x)`, `erfc(x)`, `gamma(x)`, `lgamma(x)` |

```kafe
import math;
show(math.sin(math.radians(90)));  -- approximately 1.0
show(math.isclose(math.sqrt(2) * math.sqrt(2), 2.0));
show(math.dist([0.0, 0.0], [3.0, 4.0]));  -- 5.0
```

For model training, see [MACHINE metrics](machine/metrics.md), which take collections of predictions and targets rather than individual scalar values.
