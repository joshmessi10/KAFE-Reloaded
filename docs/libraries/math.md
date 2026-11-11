# MATH: matemáticas

La librería **MATH** es tu calculadora científica dentro de KAFE: raíces, potencias, ángulos, redondeos y mucho más. Todas sus funciones están escritas desde cero en KAFE (sin usar la librería de matemáticas de Python), para que puedas ver cómo se calculan por dentro.

## Antes de empezar: importar la librería

Una librería es una **caja de herramientas** extra. Para usarla, primero la traes a tu programa con `import`, y luego usas cada herramienta con `math.` delante, como si dijeras "de la caja *math*, dame la herramienta *sqrt*":

```kafe
--8<-- "tests/DocsExamples/math/sqrt.kf"
```

```text
--8<-- "tests/DocsExamples/math/sqrt.expec"
```

!!! warning "Error común: olvidar el `import`"
    Si usas `math.` sin haber escrito `import math;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/math/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/no-import.error.stderr.expec"
    ```

!!! tip "INT o FLOAT"
    Donde la tabla de parámetros dice `INT | FLOAT`, puedes pasar un entero o un decimal.

## Cómo funciona por dentro { #inside }

### 1. El viaje de `math.sqrt(16)`

Cuando escribes `math.sqrt(16)`, pasan cuatro cosas, como un pedido en una cafetería:

1. **KAFE lee tu línea.** El intérprete (`src/InterpreterVisitor.py`) ve `math.` y busca la caja de herramientas `math` en su lista de librerías. Si no hiciste `import math;`, la caja está cerrada y te avisa.
2. **Busca la herramienta.** Dentro de la caja (`src/lib/KafeMATH/functions.py`) busca una función llamada `sqrt`.
3. **Revisa los ingredientes.** Antes de calcular, un "portero" llamado `check_sig` comprueba que le diste la cantidad y el tipo de datos correctos. Por eso `math.factorial(3.5)` da error: el portero solo deja pasar `INT`.
4. **Calcula y devuelve.** La función hace la cuenta y el resultado vuelve a tu programa.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-llamada.svg"
<figcaption>El 16 viaja de tu programa al intérprete, a la caja <code>math</code>, pasa el control de tipos y entra en <code>sqrt</code>. El resultado 4.0 regresa a tu programa.</figcaption>
</figure>

### 2. Todo está hecho a mano

Una computadora solo sabe sumar, restar, multiplicar y dividir. ¿Cómo calcula entonces una raíz o un seno? MATH **no usa** la librería de matemáticas de Python: cada función está escrita paso a paso con esas cuatro operaciones. Aquí tienes tres de sus trucos.

#### La raíz cuadrada: un rectángulo que se vuelve cuadrado

Para encontrar $\sqrt{25}$, KAFE imagina un rectángulo de área 25. Empieza con uno muy alargado (25 × 1) y, en cada paso, cambia su ancho por el **promedio** entre el ancho y el alto. El área sigue siendo 25, pero el rectángulo se parece cada vez más a un cuadrado. Cuando es un cuadrado, su lado es la raíz: 5. Esto se llama **método de Herón** y tiene más de 2000 años. KAFE repite el paso 30 veces.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-raiz-heron.svg"
<figcaption>Pasos reales de <code>math.sqrt(25)</code>: 25 → 13 → 7.46 → 5.41 → 5.02 → 5.</figcaption>
</figure>

#### El número e: sumar pedacitos cada vez más pequeños

`math.exp` usa una **serie**: una suma de muchos pedacitos, cada uno más pequeño que el anterior. Para $e^1$ los pedacitos son 1, 1, 1/2, 1/6, 1/24… Con 50 pedacitos el resultado ya es exacto para la computadora.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-exp-serie.svg"
<figcaption>Cada barra es un pedacito de la suma. Juntas llegan a e ≈ 2.718.</figcaption>
</figure>

#### El seno: curvas que se parecen cada vez más

`math.sin` hace lo mismo con otra serie: $x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots$ Cada término nuevo corrige al anterior y la curva se acerca más a la onda del seno.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-seno-taylor.svg"
<figcaption>En gris, la onda del seno. En lima, la suma con 1, 2, 3 y 4 términos: cada término la acerca más.</figcaption>
</figure>

!!! note "Por qué a veces sale 0.9999999999999999"
    Como todo se calcula con sumas y aproximaciones, el último decimal puede salir un poquito distinto. Por eso `math.log(math.e)` da `0.9999999999999999` y `math.pow(2, 3)` da `7.999999999999994`. Para comparar decimales usa [`math.isclose`](math/checks.md#isclose).

??? info "Para curiosos 🤓"
    - **Herón:** $g_{n+1} = \dfrac{g_n + x / g_n}{2}$, empezando con $g_0 = x$.
    - **Exponencial:** $e^x = \sum_{n=0}^{\infty} \dfrac{x^n}{n!}$. Para números grandes KAFE primero divide $x$ entre 2 varias veces y al final eleva al cuadrado el resultado.
    - **Seno:** $\sin x = \sum_{n=0}^{\infty} (-1)^n \dfrac{x^{2n+1}}{(2n+1)!}$, después de llevar $x$ a una vuelta ($x \bmod 2\pi$).
    - **Logaritmo:** $\ln x = k \ln 2 + \ln m$, partiendo $x$ por 2 hasta que $m$ queda entre 1 y 2, y luego una serie para $\ln m$.


## Secciones de la librería { #sections }

<div class="grid cards" markdown>

-   **[Constantes](math/constants.md)**

    ---

    `pi`, `e`, `tau`, `inf`, `nan`

-   **[Redondeo](math/rounding.md)**

    ---

    `abs`, `round`, `floor`, `ceil`, `trunc`, `copysign`

-   **[Potencias y raíces](math/powers.md)**

    ---

    `pow`, `sqrt`, `cbrt`, `exp`, `exp2`, `expm1`

-   **[Logaritmos](math/logarithms.md)**

    ---

    `log`, `log2`, `log10`

-   **[Restos y divisores](math/division.md)**

    ---

    `fmod`, `remainder`, `gcd`, `lcm`

-   **[Trigonometría](math/trigonometry.md)**

    ---

    `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `degrees`, `radians`

-   **[Hiperbólicas](math/hyperbolic.md)**

    ---

    `sinh`, `cosh`, `tanh`

-   **[Combinatoria](math/combinatorics.md)**

    ---

    `factorial`, `comb`, `perm`

-   **[Listas de números](math/lists.md)**

    ---

    `sum`, `prod`, `fsum`, `sumprod`, `dist`, `hypot`

-   **[Comprobar números](math/checks.md)**

    ---

    `isclose`, `isinf`, `isnan`, `isfinite`, `ulp`

-   **[Funciones especiales](math/special.md)**

    ---

    `erf`, `erfc`, `gamma`, `lgamma`

</div>

## Resumen de todas las funciones { #summary }

| Función | Grupo |
|---|---|
| [`math.pi · math.e · math.tau · math.inf · math.nan`](math/constants.md#constants) | [Constantes](math/constants.md) |
| [`math.abs(x)`](math/rounding.md#abs) | [Redondeo](math/rounding.md) |
| [`math.round(x, ndigits)`](math/rounding.md#round) | [Redondeo](math/rounding.md) |
| [`math.floor(x)`](math/rounding.md#floor) | [Redondeo](math/rounding.md) |
| [`math.ceil(x)`](math/rounding.md#ceil) | [Redondeo](math/rounding.md) |
| [`math.trunc(x)`](math/rounding.md#trunc) | [Redondeo](math/rounding.md) |
| [`math.copysign(x, y)`](math/rounding.md#copysign) | [Redondeo](math/rounding.md) |
| [`math.pow(x, y)`](math/powers.md#pow) | [Potencias y raíces](math/powers.md) |
| [`math.sqrt(x)`](math/powers.md#sqrt) | [Potencias y raíces](math/powers.md) |
| [`math.cbrt(x)`](math/powers.md#cbrt) | [Potencias y raíces](math/powers.md) |
| [`math.exp(x)`](math/powers.md#exp) | [Potencias y raíces](math/powers.md) |
| [`math.exp2(x)`](math/powers.md#exp2) | [Potencias y raíces](math/powers.md) |
| [`math.expm1(x)`](math/powers.md#expm1) | [Potencias y raíces](math/powers.md) |
| [`math.log(x, base)`](math/logarithms.md#log) | [Logaritmos](math/logarithms.md) |
| [`math.log2(x)`](math/logarithms.md#log2) | [Logaritmos](math/logarithms.md) |
| [`math.log10(x)`](math/logarithms.md#log10) | [Logaritmos](math/logarithms.md) |
| [`math.fmod(x, y)`](math/division.md#fmod) | [Restos y divisores](math/division.md) |
| [`math.remainder(x, y)`](math/division.md#remainder) | [Restos y divisores](math/division.md) |
| [`math.gcd(a, b, ...)`](math/division.md#gcd) | [Restos y divisores](math/division.md) |
| [`math.lcm(a, b, ...)`](math/division.md#lcm) | [Restos y divisores](math/division.md) |
| [`math.sin(x)`](math/trigonometry.md#sin) | [Trigonometría](math/trigonometry.md) |
| [`math.cos(x)`](math/trigonometry.md#cos) | [Trigonometría](math/trigonometry.md) |
| [`math.tan(x)`](math/trigonometry.md#tan) | [Trigonometría](math/trigonometry.md) |
| [`math.asin(x)`](math/trigonometry.md#asin) | [Trigonometría](math/trigonometry.md) |
| [`math.acos(x)`](math/trigonometry.md#acos) | [Trigonometría](math/trigonometry.md) |
| [`math.atan(x)`](math/trigonometry.md#atan) | [Trigonometría](math/trigonometry.md) |
| [`math.degrees(x)`](math/trigonometry.md#degrees) | [Trigonometría](math/trigonometry.md) |
| [`math.radians(x)`](math/trigonometry.md#radians) | [Trigonometría](math/trigonometry.md) |
| [`math.sinh(x)`](math/hyperbolic.md#sinh) | [Hiperbólicas](math/hyperbolic.md) |
| [`math.cosh(x)`](math/hyperbolic.md#cosh) | [Hiperbólicas](math/hyperbolic.md) |
| [`math.tanh(x)`](math/hyperbolic.md#tanh) | [Hiperbólicas](math/hyperbolic.md) |
| [`math.factorial(n)`](math/combinatorics.md#factorial) | [Combinatoria](math/combinatorics.md) |
| [`math.comb(n, k)`](math/combinatorics.md#comb) | [Combinatoria](math/combinatorics.md) |
| [`math.perm(n, k)`](math/combinatorics.md#perm) | [Combinatoria](math/combinatorics.md) |
| [`math.sum(list) · math.sum(start, end)`](math/lists.md#sum) | [Listas de números](math/lists.md) |
| [`math.prod(list) · math.prod(start, end)`](math/lists.md#prod) | [Listas de números](math/lists.md) |
| [`math.fsum(list)`](math/lists.md#fsum) | [Listas de números](math/lists.md) |
| [`math.sumprod(p, q)`](math/lists.md#sumprod) | [Listas de números](math/lists.md) |
| [`math.dist(p, q)`](math/lists.md#dist) | [Listas de números](math/lists.md) |
| [`math.hypot(x, y, ...)`](math/lists.md#hypot) | [Listas de números](math/lists.md) |
| [`math.isclose(a, b, rel_tol, abs_tol)`](math/checks.md#isclose) | [Comprobar números](math/checks.md) |
| [`math.isinf(x)`](math/checks.md#isinf) | [Comprobar números](math/checks.md) |
| [`math.isnan(x)`](math/checks.md#isnan) | [Comprobar números](math/checks.md) |
| [`math.isfinite(x)`](math/checks.md#isfinite) | [Comprobar números](math/checks.md) |
| [`math.ulp(x)`](math/checks.md#ulp) | [Comprobar números](math/checks.md) |
| [`math.erf(x)`](math/special.md#erf) | [Funciones especiales](math/special.md) |
| [`math.erfc(x)`](math/special.md#erfc) | [Funciones especiales](math/special.md) |
| [`math.gamma(x)`](math/special.md#gamma) | [Funciones especiales](math/special.md) |
| [`math.lgamma(x)`](math/special.md#lgamma) | [Funciones especiales](math/special.md) |

## ¿Qué aprendiste?

- Para usar MATH escribes `import math;` y luego `math.nombre(...)`.
- Los ángulos van en **radianes**: convierte con `math.radians`.
- Los decimales de la computadora no son exactos: compara con `math.isclose`.
- Para potencias enteras exactas, el operador `^` es mejor que `math.pow`.

[Empieza: Constantes :material-arrow-right:](math/constants.md){ .md-button .md-button--primary }
