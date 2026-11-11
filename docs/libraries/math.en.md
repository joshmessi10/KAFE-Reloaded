# MATH: mathematics

The **MATH** library is your scientific calculator inside KAFE: roots, powers, angles, rounding and much more. Every function is written from scratch in KAFE (without Python's math library), so you can see how each one is computed inside.

## Before you start: import the library

A library is an extra **toolbox**. To use it, first bring it into your program with `import`, then use each tool with `math.` in front, as if you said "from the *math* box, give me the *sqrt* tool":

```kafe
--8<-- "tests/DocsExamples/math/sqrt.kf"
```

```text
--8<-- "tests/DocsExamples/math/sqrt.expec"
```

!!! warning "Common mistake: forgetting the `import`"
    If you use `math.` without writing `import math;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/math/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/no-import.error.stderr.expec"
    ```

!!! tip "INT or FLOAT"
    Where the parameter table says `INT | FLOAT`, you can pass a whole number or a decimal.

## How it works inside { #inside }

### 1. The journey of `math.sqrt(16)`

When you write `math.sqrt(16)`, four things happen, like an order at a coffee shop:

1. **KAFE reads your line.** The interpreter (`src/InterpreterVisitor.py`) sees `math.` and looks for the `math` toolbox in its list of libraries. If you didn't write `import math;`, the box is closed and it tells you.
2. **It finds the tool.** Inside the box (`src/lib/KafeMATH/functions.py`) it looks for a function called `sqrt`.
3. **It checks the ingredients.** Before computing, a "doorkeeper" called `check_sig` checks that you gave the right number and type of values. That is why `math.factorial(3.5)` fails: the doorkeeper only lets `INT` in.
4. **It computes and returns.** The function does the math and the result goes back to your program.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-llamada.svg"
<figcaption>The 16 travels from your program to the interpreter, into the <code>math</code> box, through the type check and into <code>sqrt</code>. The result 4.0 comes back to your program.</figcaption>
</figure>

### 2. Everything is handmade

A computer only knows how to add, subtract, multiply and divide. So how does it compute a root or a sine? MATH **does not use** Python's math library: every function is written step by step with those four operations. Here are three of its tricks.

#### Square root: a rectangle that becomes a square

To find $\sqrt{25}$, KAFE imagines a rectangle with area 25. It starts with a very long one (25 × 1) and, at each step, replaces its width with the **average** of its width and height. The area stays 25, but the rectangle looks more and more like a square. When it is a square, its side is the root: 5. This is **Heron's method** and it is more than 2000 years old. KAFE repeats the step 30 times.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-raiz-heron.svg"
<figcaption>The real steps of <code>math.sqrt(25)</code>: 25 → 13 → 7.46 → 5.41 → 5.02 → 5.</figcaption>
</figure>

#### The number e: adding smaller and smaller pieces

`math.exp` uses a **series**: a sum of many pieces, each smaller than the previous one. For $e^1$ the pieces are 1, 1, 1/2, 1/6, 1/24… With 50 pieces the result is already exact for the computer.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-exp-serie.svg"
<figcaption>Each bar is one piece of the sum. Together they reach e ≈ 2.718.</figcaption>
</figure>

#### Sine: curves that look more and more alike

`math.sin` does the same with another series: $x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots$ Each new term corrects the previous one and the curve gets closer to the sine wave.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-seno-taylor.svg"
<figcaption>In gray, the sine wave. In lime, the sum with 1, 2, 3 and 4 terms: each term brings it closer.</figcaption>
</figure>

!!! note "Why you sometimes get 0.9999999999999999"
    Because everything is computed with sums and approximations, the last decimal can come out slightly different. That is why `math.log(math.e)` gives `0.9999999999999999` and `math.pow(2, 3)` gives `7.999999999999994`. To compare decimals, use [`math.isclose`](math/checks.md#isclose).

??? info "For the curious 🤓"
    - **Heron:** $g_{n+1} = \dfrac{g_n + x / g_n}{2}$, starting with $g_0 = x$.
    - **Exponential:** $e^x = \sum_{n=0}^{\infty} \dfrac{x^n}{n!}$. For large numbers KAFE first halves $x$ several times and squares the result at the end.
    - **Sine:** $\sin x = \sum_{n=0}^{\infty} (-1)^n \dfrac{x^{2n+1}}{(2n+1)!}$, after bringing $x$ into one turn ($x \bmod 2\pi$).
    - **Logarithm:** $\ln x = k \ln 2 + \ln m$, halving $x$ until $m$ is between 1 and 2, then a series for $\ln m$.


## Library sections { #sections }

<div class="grid cards" markdown>

-   **[Constants](math/constants.md)**

    ---

    `pi`, `e`, `tau`, `inf`, `nan`

-   **[Rounding](math/rounding.md)**

    ---

    `abs`, `round`, `floor`, `ceil`, `trunc`, `copysign`

-   **[Powers and roots](math/powers.md)**

    ---

    `pow`, `sqrt`, `cbrt`, `exp`, `exp2`, `expm1`

-   **[Logarithms](math/logarithms.md)**

    ---

    `log`, `log2`, `log10`

-   **[Remainders and divisors](math/division.md)**

    ---

    `fmod`, `remainder`, `gcd`, `lcm`

-   **[Trigonometry](math/trigonometry.md)**

    ---

    `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `degrees`, `radians`

-   **[Hyperbolic](math/hyperbolic.md)**

    ---

    `sinh`, `cosh`, `tanh`

-   **[Combinatorics](math/combinatorics.md)**

    ---

    `factorial`, `comb`, `perm`

-   **[Lists of numbers](math/lists.md)**

    ---

    `sum`, `prod`, `fsum`, `sumprod`, `dist`, `hypot`

-   **[Checking numbers](math/checks.md)**

    ---

    `isclose`, `isinf`, `isnan`, `isfinite`, `ulp`

-   **[Special functions](math/special.md)**

    ---

    `erf`, `erfc`, `gamma`, `lgamma`

</div>

## Summary of every function { #summary }

| Function | Group |
|---|---|
| [`math.pi · math.e · math.tau · math.inf · math.nan`](math/constants.md#constants) | [Constants](math/constants.md) |
| [`math.abs(x)`](math/rounding.md#abs) | [Rounding](math/rounding.md) |
| [`math.round(x, ndigits)`](math/rounding.md#round) | [Rounding](math/rounding.md) |
| [`math.floor(x)`](math/rounding.md#floor) | [Rounding](math/rounding.md) |
| [`math.ceil(x)`](math/rounding.md#ceil) | [Rounding](math/rounding.md) |
| [`math.trunc(x)`](math/rounding.md#trunc) | [Rounding](math/rounding.md) |
| [`math.copysign(x, y)`](math/rounding.md#copysign) | [Rounding](math/rounding.md) |
| [`math.pow(x, y)`](math/powers.md#pow) | [Powers and roots](math/powers.md) |
| [`math.sqrt(x)`](math/powers.md#sqrt) | [Powers and roots](math/powers.md) |
| [`math.cbrt(x)`](math/powers.md#cbrt) | [Powers and roots](math/powers.md) |
| [`math.exp(x)`](math/powers.md#exp) | [Powers and roots](math/powers.md) |
| [`math.exp2(x)`](math/powers.md#exp2) | [Powers and roots](math/powers.md) |
| [`math.expm1(x)`](math/powers.md#expm1) | [Powers and roots](math/powers.md) |
| [`math.log(x, base)`](math/logarithms.md#log) | [Logarithms](math/logarithms.md) |
| [`math.log2(x)`](math/logarithms.md#log2) | [Logarithms](math/logarithms.md) |
| [`math.log10(x)`](math/logarithms.md#log10) | [Logarithms](math/logarithms.md) |
| [`math.fmod(x, y)`](math/division.md#fmod) | [Remainders and divisors](math/division.md) |
| [`math.remainder(x, y)`](math/division.md#remainder) | [Remainders and divisors](math/division.md) |
| [`math.gcd(a, b, ...)`](math/division.md#gcd) | [Remainders and divisors](math/division.md) |
| [`math.lcm(a, b, ...)`](math/division.md#lcm) | [Remainders and divisors](math/division.md) |
| [`math.sin(x)`](math/trigonometry.md#sin) | [Trigonometry](math/trigonometry.md) |
| [`math.cos(x)`](math/trigonometry.md#cos) | [Trigonometry](math/trigonometry.md) |
| [`math.tan(x)`](math/trigonometry.md#tan) | [Trigonometry](math/trigonometry.md) |
| [`math.asin(x)`](math/trigonometry.md#asin) | [Trigonometry](math/trigonometry.md) |
| [`math.acos(x)`](math/trigonometry.md#acos) | [Trigonometry](math/trigonometry.md) |
| [`math.atan(x)`](math/trigonometry.md#atan) | [Trigonometry](math/trigonometry.md) |
| [`math.degrees(x)`](math/trigonometry.md#degrees) | [Trigonometry](math/trigonometry.md) |
| [`math.radians(x)`](math/trigonometry.md#radians) | [Trigonometry](math/trigonometry.md) |
| [`math.sinh(x)`](math/hyperbolic.md#sinh) | [Hyperbolic](math/hyperbolic.md) |
| [`math.cosh(x)`](math/hyperbolic.md#cosh) | [Hyperbolic](math/hyperbolic.md) |
| [`math.tanh(x)`](math/hyperbolic.md#tanh) | [Hyperbolic](math/hyperbolic.md) |
| [`math.factorial(n)`](math/combinatorics.md#factorial) | [Combinatorics](math/combinatorics.md) |
| [`math.comb(n, k)`](math/combinatorics.md#comb) | [Combinatorics](math/combinatorics.md) |
| [`math.perm(n, k)`](math/combinatorics.md#perm) | [Combinatorics](math/combinatorics.md) |
| [`math.sum(list) · math.sum(start, end)`](math/lists.md#sum) | [Lists of numbers](math/lists.md) |
| [`math.prod(list) · math.prod(start, end)`](math/lists.md#prod) | [Lists of numbers](math/lists.md) |
| [`math.fsum(list)`](math/lists.md#fsum) | [Lists of numbers](math/lists.md) |
| [`math.sumprod(p, q)`](math/lists.md#sumprod) | [Lists of numbers](math/lists.md) |
| [`math.dist(p, q)`](math/lists.md#dist) | [Lists of numbers](math/lists.md) |
| [`math.hypot(x, y, ...)`](math/lists.md#hypot) | [Lists of numbers](math/lists.md) |
| [`math.isclose(a, b, rel_tol, abs_tol)`](math/checks.md#isclose) | [Checking numbers](math/checks.md) |
| [`math.isinf(x)`](math/checks.md#isinf) | [Checking numbers](math/checks.md) |
| [`math.isnan(x)`](math/checks.md#isnan) | [Checking numbers](math/checks.md) |
| [`math.isfinite(x)`](math/checks.md#isfinite) | [Checking numbers](math/checks.md) |
| [`math.ulp(x)`](math/checks.md#ulp) | [Checking numbers](math/checks.md) |
| [`math.erf(x)`](math/special.md#erf) | [Special functions](math/special.md) |
| [`math.erfc(x)`](math/special.md#erfc) | [Special functions](math/special.md) |
| [`math.gamma(x)`](math/special.md#gamma) | [Special functions](math/special.md) |
| [`math.lgamma(x)`](math/special.md#lgamma) | [Special functions](math/special.md) |

## What did you learn?

- To use MATH you write `import math;` and then `math.name(...)`.
- Angles are in **radians**: convert with `math.radians`.
- Computer decimals are not exact: compare with `math.isclose`.
- For exact whole powers, the `^` operator is better than `math.pow`.

[Start: Constants :material-arrow-right:](math/constants.md){ .md-button .md-button--primary }
