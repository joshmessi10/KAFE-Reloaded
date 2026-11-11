# MACHINE: linear models and SVM

A **linear model** learns to give an answer by doing a **weighted sum**: it multiplies each piece of data by a number (its **weight**), adds everything up and adds a fixed number. It is the same calculation [a neuron](../../aprende/neuronas.md) does. Learning means finding the right weights.

This page holds the models that draw **lines**: some to predict a number (regression) and one to separate two groups (SVM).

| Model | What it is for |
|---|---|
| [`LinearRegression`](#linearregression) | Predicting a number with the line that fits the points best. |
| [`RidgeRegression`](#ridgeregression) | The same, but with small weights so it doesn't exaggerate. |
| [`LassoRegression`](#lassoregression) | The same, but it switches off the data that doesn't help. |
| [`ElasticNet`](#elasticnet) | A mix of Ridge and Lasso. |
| [`SVR`](#svr-support-vector-regression) | A line with a "tube" of tolerance around it. |
| [`SVM`](#svm-support-vector-machine-classifier) | Separating two groups with the widest possible street. |

!!! tip "Before you start"
    Every MACHINE model is used the same way: you **create** it, teach it with `fit` and ask it with `predict`. If this is your first time, read [how MACHINE works](../machine.md).

## LinearRegression: the line that fits best { #linearregression }

### The idea in one sentence

**Linear regression** looks for the **line** that passes as close as possible to all your points, and then uses that line to **predict** new numbers.

### An everyday comparison

Imagine hammering several nails into a board and wanting to rest a ruler as close as possible to all of them. It can't touch them all at once, so you turn it and raise it until **no nail is too far away**. That ruler is the model's line.

With it you can answer questions like: "if a 40 m² apartment costs 14 and a 60 m² one costs 21, how much will a 70 m² one cost?".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-recta-errores.svg"
<figcaption>The line starts flat, at the height of the average. The colored dashes are the errors: how far the line is from each point. As it turns, the errors shrink and the bar on the right (the sum of the squared errors) drops from 98 to 1.9.</figcaption>
</figure>

### Your first line

Five students wrote down how many hours they studied and what grade they got. We give those examples to the model:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression.expec"
```

!!! tip "What happened here?"
    1. `machine.linear_regression()` created an **empty** model: it doesn't know anything yet.
    2. `model.fit(hours, grade)` showed it the examples. The model found the line.
    3. `model.coef_` is the **slope**: `2.0`. Each extra hour of study raises the grade by 2 points.
    4. `model.intercept_` is the **starting point**: `1.0`. It is the grade with 0 hours.
    5. `model.predict([6.0, 10.0])` used the line: 2 × 6 + 1 = `13.0` and 2 × 10 + 1 = `21.0`.

### The two pieces of a line { #linearregression-parts }

Every line is described by just **two numbers**:

- The **slope**: how much the line goes up when you move one step to the right. It is how steep a ramp is. In KAFE it is called `coef_`.
- The **starting point** (*intercept*): how high the line is when the data is 0. In KAFE it is called `intercept_`.

To predict, the model does this calculation:

$$\text{prediction} = \text{slope} \times \text{data} + \text{starting point}$$

Learning is finding those two numbers. Nothing else.

### The math with small numbers { #linearregression-math }

How does the model know which line is best? It measures the **error** of each point: the vertical distance between the point and the line (the colored dashes in the drawing). Then it **squares** each error and adds them up. The best line is the one that makes that sum **as small as possible**. That is why the method is called **least squares**.

!!! note "Why squared?"
    For two reasons. An error of −3 (the line ended up above) and one of +3 (it ended up below) are equally bad, and squared both give 9. Also, a big error weighs much more than several small ones: the model prefers to be a little wrong with everyone rather than very wrong with one.

When each example has a single piece of data, the best line comes from a four-step recipe. Let's do it **by hand** with five apartments (size in m² and price):

| Size $x$ | 20 | 30 | 40 | 50 | 60 |
|---|---|---|---|---|---|
| Price $y$ | 9 | 12 | 14 | 19 | 21 |

1. **Find the averages.** The average size is 40 and the average price is 15. The best line **always** passes through that point (40, 15): it is the middle nail the ruler turns around.
2. **See how far each point is from the average.** For example, the first apartment measures 20 − 40 = −20 (20 less than the average) and costs 9 − 15 = −6 (6 less than the average).
3. **Compute the slope.** Multiply the two distances of each point and add everything: it gives 310. Then add up the size distances squared: it gives 1000. The slope is 310 ÷ 1000 = **0.31**.
4. **Compute the starting point.** Since the line passes through (40, 15): 15 − 0.31 × 40 = **2.6**.

This program follows that same recipe with loops, **without using MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-by-hand.expec"
```

And this one asks MACHINE for the same thing. The numbers match:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-noisy.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-noisy.expec"
```

The last number, `0.981`, is the model's **grade** (it is called $R^2$). It compares two sums of squared errors, the same ones in the drawing:

- the one for the flat line that only uses the average: **98**;
- the one for the line the model learned: **1.9**.

$R^2 = 1 - 1.9 \div 98 = 0.981$. A 1 would be perfect; a 0 means the model is no better than always saying the average.

??? info "For the curious 🤓"
    With a single piece of data per example, the recipe above is:

    $$\text{slope} = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{\sum_i (x_i - \bar{x})^2} \qquad \text{starting point} = \bar{y} - \text{slope} \cdot \bar{x}$$

    With several pieces of data per example, the **normal equation** is used. A matrix $X$ is built with a column of ones (for the starting point) and one column per feature, and the system

    $$(X^T X)\,\theta = X^T y$$

    is solved. The result $\theta$ holds the starting point first and then one weight per feature. Solving that system takes on the order of $n \cdot m^2 + m^3$ operations for $n$ examples and $m$ features. The grade is $R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}$.

### How it is built inside { #linearregression-inside }

The model lives in `src/lib/KafeMACHINE/linear/LinearRegression.py`. It is a small class that stores **only two things**: the list `coef_` and the number `intercept_`. When created they are empty (`[]` and `0.0`).

When you call `fit(X, y)`, the model does this, in order:

1. **It checks the data.** If you gave it a plain list like `[1.0, 2.0, 3.0]`, it turns it into a one-column table: `[[1.0], [2.0], [3.0]]`. It checks that every row is the same length and that there are as many answers as rows.
2. **It adds a column of ones** at the start of the table. That `1` is the trick that lets the starting point be computed as if it were one more weight.
3. **It makes two summaries with sums.** It multiplies the table by its own turned version ($X^T X$) and by the answers ($X^T y$). These are [matrix multiplications](../numk/matrix-multiplication.md) done with loops.
4. **It solves the system of equations** with the Gauss-Jordan method, the same one [`numk.inv`](../numk/matrix-multiplication.md#inv) uses: it leaves a 1 in each row and zeros in the others, until each weight stands alone.
5. **It stores the result**: the first number goes to `intercept_` and the rest to `coef_`. It marks the model as trained.

`predict(X)` is much shorter: for each row it computes `intercept_` plus the sum of each value times its weight. It doesn't learn anything again.

!!! note "No laps and no trial and error"
    Other models improve little by little, step by step. KAFE's linear regression doesn't: it solves one equation and gets the exact answer in one go.

### Creating the model: `machine.linear_regression()` { #linear_regression }

**What it does:** Creates an empty linear regression model, ready to learn.

**When to use it:** When you want to predict **a number** (a price, a grade, a temperature) and you think it goes up or down evenly with your data.

It takes no parameters.

**Returns:** `MACHINE`: the untrained model.

### `model.fit(X, y)` { #linearregression-fit }

**What it does:** Teaches the model with examples: it finds the line.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[FLOAT]`, `List[List[FLOAT]]` or `PARDOS` | The data. A plain list if there is one value per example; a table (one row per example) if there are several. |
| `y` | `List[FLOAT]` | The correct answer for each example, in the same order. |

**Returns:** The same model, now trained.

### `model.predict(X)` { #linearregression-predict }

**What it does:** Uses the line to compute the answer for new data.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[FLOAT]` or `List[List[FLOAT]]` | The new data, with the same number of columns you used in `fit`. |

**Returns:** `List[FLOAT]`: one prediction per row.

### `model.score(X, y)` { #linearregression-score }

**What it does:** Grades the model ($R^2$) by comparing its predictions with the correct answers.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[FLOAT]` or `List[List[FLOAT]]` | The data. |
| `y` | `List[FLOAT]` | The correct answers. |

**Returns:** `FLOAT`: 1.0 is perfect; close to 0 is as bad as always saying the average.

### What the model learned { #linearregression-properties }

| Property | Type | What it stores |
|---|---|---|
| `model.coef_` | `List[FLOAT]` | One weight (slope) per data column. |
| `model.intercept_` | `FLOAT` | The starting point. |

They are properties, not functions: you write them **without parentheses**.

### With more than one value per example { #linearregression-many }

If each example has several values, each one gets its own weight. Here each row is `[hours of study, review classes]`:

```kafe
--8<-- "tests/DocsExamples/machine/linear_regression-two-features.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_regression-two-features.expec"
```

The model discovered the rule hidden in the data: grade = **2** × hours + **3** × reviews + **1**. It is no longer a line on paper but a flat surface, yet the idea is the same.

### Common mistakes { #linearregression-errors }

??? warning "Asking before teaching"
    If you call `predict` without having called `fit`, the model has no line:

    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_regression-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_regression-not-fitted.error.stderr.expec"
    ```

??? warning "Changing the number of values"
    If it learned with one value per example, it cannot predict with two:

    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_regression-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_regression-features.error.stderr.expec"
    ```

### Strengths and limits { #linearregression-tradeoffs }

| 👍 Strengths | 👎 Limits |
|---|---|
| It is fast and always gives the same answer. | It only draws lines: it doesn't work if your points form a curve. |
| It is easy to understand: each weight says how much a value matters. | One very odd point (for example, a typo) can tilt the whole line. |
| There are no settings to choose. | If two columns say almost the same thing, it fails with `Singular matrix`. That is what [`RidgeRegression`](#ridgeregression) is for. |

!!! tip "What did you learn?"
    - A line is described by two numbers: the slope (`coef_`) and the starting point (`intercept_`).
    - The best line is the one that makes the sum of squared errors smallest.
    - `fit` finds the line, `predict` uses it and `score` grades it.

## RidgeRegression: a more careful line { #ridgeregression }

### The idea in one sentence

**Ridge** is a linear regression that gets **charged** for using large weights. So it prefers gentler lines that don't overreact to a few data points.

### An everyday comparison

Think of someone who gives advice. If one comment makes them change everything, they're easy to fool. If they're **careful**, they need more evidence before changing their mind. Ridge is the careful version of linear regression: the number `alpha` says **how careful** it is.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-ridge-alpha.svg"
<figcaption>With α = 0 the line goes right through the points (slope 2.0). As α rises to 10 and 30, the line turns around the middle point and flattens: the slope drops to 1.0 and then 0.5. The weight shrinks, but never reaches zero.</figcaption>
</figure>

### Your first Ridge

The same students as before, with a very careful Ridge (`alpha = 10.0`):

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression.expec"
```

!!! tip "What happened here?"
    1. `machine.ridge_regression(10.0)` created a model with carefulness 10.
    2. Plain regression would have found slope `2.0`. Ridge found `1.0`: half, because the weight was charged for.
    3. The starting point rose to `4.0` so the line still passes through the centre of the data (3, 7).
    4. That's why the score dropped to `0.75`: Ridge accepts being a little wrong in exchange for not overreacting.

Watch how the slope changes as `alpha` grows:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-alphas.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-alphas.expec"
```

With `alpha = 0.0` it is exactly a linear regression. With a very large `alpha`, the line is almost flat.

### The maths with small numbers { #ridgeregression-math }

Ridge adds up two things and looks for the slope that makes the total **as small as possible**:

$$\text{total} = \underbrace{\sum \text{errors}^2}_{\text{how badly it predicts}} + \underbrace{\alpha \cdot w^2}_{\text{the charge for the weight}}$$

This program tries four slopes by hand with `alpha = 10` and then uses the short recipe:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-by-hand.expec"
```

- The first four lines are the totals for slopes 0.5, 1.0, 1.5 and 2.0. The lowest (`20.0`) belongs to slope **1.0**.
- The short recipe is LinearRegression's with one change: **`alpha` is added at the bottom**. Instead of 20 ÷ 10 = 2.0, it gives 20 ÷ (10 + 10) = **1.0**.

??? info "For the curious 🤓"
    Ridge solves the normal equation with an extra on the diagonal:

    $$(X^T X + \alpha I)\,w = X^T y$$

    That $+\alpha I$ means the system **always** has a solution, even when two columns are identical. The starting point isn't penalised: KAFE centres the data (subtracts its average) before solving and computes it separately afterwards.

### When two inputs say the same thing { #ridgeregression-twins }

If two columns are **twins** (always equal), LinearRegression fails with `Singular matrix`: there are infinitely many ways to split the weight. Ridge splits it **evenly**:

```kafe
--8<-- "tests/DocsExamples/machine/ridge_regression-twins.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ridge_regression-twins.expec"
```

Each twin gets `0.95`. Together they add up to almost 2, the real weight.

### How it's built inside { #ridgeregression-inside }

The model lives in `src/lib/KafeMACHINE/linear/RidgeRegression.py`. In `fit`:

1. It checks the data, just like LinearRegression.
2. It **centres** each column and the answers: subtracts their average.
3. It builds $X^T X$, **adds `alpha` to the diagonal** and solves the system with Gauss-Jordan.
4. It computes the starting point: the average of `y` minus the sum of each weight times its column's average.

Like LinearRegression, it doesn't loop: it solves the equation once.

### API { #ridge_regression }

| Call | What it does |
|---|---|
| `machine.ridge_regression(alpha)` | Creates the model. `alpha` (`FLOAT`, default `1.0`) is the carefulness; it can't be negative. |
| `model.fit(X, y)` | Learns the weights. |
| `model.predict(X)` | Returns a `List[FLOAT]` with one prediction per row. |
| `model.score(X, y)` | Returns the $R^2$ score. |
| `model.coef_` / `model.intercept_` | The weights and the starting point, as in LinearRegression. |

??? warning "Common mistake: a negative `alpha`"
    A negative carefulness makes no sense: it would reward large weights.

    ```kafe
    --8<-- "tests/DocsExamples/machine/ridge_regression-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ridge_regression-alpha.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Works even with twin or very similar columns. | You have to choose `alpha` (try several with [`cross_val_score`](selection.md)). |
| Predictions change little if a few data points change. | It never sets a weight to zero: it won't tell you which inputs are useless. |

## LassoRegression: switch off what doesn't help { #lassoregression }

### The idea in one sentence

**Lasso** also charges for the weights, but differently: it charges the same for every unit of weight. Because of that, inputs that help little end up with a weight of **exactly zero**: Lasso **switches them off**.

### An everyday comparison

Imagine packing a suitcase with a weight limit. Ridge takes out a bit of **everything**: fewer T-shirts, fewer shoes, fewer books. Lasso leaves **whole items** at home: if the umbrella is barely useful, it doesn't come.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-lasso-zero.svg"
<figcaption>The same weight learned by Ridge (left) and by Lasso (right). With α = 0 both are 2.0, and with α = 10 both are 1.0. With α = 20, Ridge is still 0.67, but Lasso reaches exactly 0: the switch turns off.</figcaption>
</figure>

### Your first Lasso

Each student has two inputs: hours of study and their lucky number (which has nothing to do with the grade):

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression.expec"
```

!!! tip "What happened here?"
    1. Plain regression gave the lucky number a small weight (`0.13`): chance fooled it.
    2. `machine.lasso_regression(3.0)` switched that input off: its weight is `0.0`.
    3. Hours of study still matter (`1.69`). The model predicted `12.15` for someone who studies 6 hours.

With more `alpha`, Lasso switches off more and more. With a single column:

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression-alphas.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression-alphas.expec"
```

### The maths with small numbers { #lassoregression-math }

Lasso changes the charge: instead of $\alpha \cdot w^2$ it charges $\alpha \cdot |w|$ (the weight without its sign). With a single column the recipe becomes: **subtract** `alpha` from the top part (20 for the students), and if the result is negative, set it to **zero**. That trick is called **soft thresholding**.

This program compares the two recipes, Ridge and Lasso, for `alpha` = 0, 10, 20 and 30:

```kafe
--8<-- "tests/DocsExamples/machine/lasso_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/lasso_regression-by-hand.expec"
```

Each pair of lines is (Ridge, Lasso). Ridge **divides** and gets close to zero without reaching it. Lasso **subtracts** and reaches zero.

??? info "For the curious 🤓"
    Lasso minimises

    $$\frac{1}{2}\sum_i (y_i - \hat{y}_i)^2 + \alpha \sum_j |w_j|$$

    There is no one-shot formula because $|w|$ has a corner at zero. KAFE uses **coordinate descent**: it fixes one weight at a time, keeping the others still, applying the soft threshold $S(z, \alpha) = \text{sign}(z)\cdot\max(|z| - \alpha, 0)$. It repeats until the weights barely change.

### How it's built inside { #lassoregression-inside }

The model lives in `src/lib/KafeMACHINE/linear/LassoRegression.py`. In `fit`:

1. It checks and centres the data, like Ridge.
2. It starts with every weight at 0.
3. **It goes through the columns one by one.** For each, it works out how much that column would help with the other weights fixed, and applies the soft threshold. If it helps less than `alpha`, the weight stays at 0.
4. It repeats the pass until no weight changes by more than `0.0001` or the `1000` rounds run out.
5. It computes the starting point from the averages.

### API { #lasso_regression }

| Call | What it does |
|---|---|
| `machine.lasso_regression(alpha)` | Creates the model. `alpha` (`FLOAT`, default `1.0`) can't be negative. |
| `model.fit(X, y)` / `model.predict(X)` / `model.score(X, y)` | Same as in LinearRegression. |
| `model.coef_` | The weights. Those equal to `0.0` are switched-off inputs. |
| `model.intercept_` | The starting point. |

??? warning "Common mistake: a negative `alpha`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/lasso_regression-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/lasso_regression-alpha.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Tells you which inputs are useless: the ones left at zero. | With twin inputs it keeps only one and switches the other off. |
| The final model is simpler to read. | If `alpha` is too large, it switches off useful inputs too. |

## ElasticNet: the best of both { #elasticnet }

### The idea in one sentence

**ElasticNet** charges for the weights **a bit like Ridge and a bit like Lasso**. It can switch off useless inputs and, at the same time, share the weight between inputs that look alike.

### An everyday comparison

Two friends helped you equally with a project. Lasso gives all the credit to one and none to the other. Ridge shares it, but never leaves anyone without credit, even if they did nothing. ElasticNet **shares it among those who helped** and **gives zero to whoever didn't**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-elastic-twins.svg"
<figcaption>Two twin columns, x₁ and x₂. Lasso gives all the weight (1.9) to x₁ and nothing to x₂. ElasticNet shares it: 0.95 and 0.95.</figcaption>
</figure>

### Your first ElasticNet

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net.expec"
```

!!! tip "What happened here?"
    1. The two columns are identical. Lasso picked one (`1.9`) and switched the other off (`0.0`).
    2. `machine.elastic_net(1.0, 0.5)` uses carefulness `1.0` and a half-Ridge, half-Lasso mix (`0.5`).
    3. ElasticNet shared it: `0.95` and `0.95`. For someone with `[6, 6]` it predicts `12.71`.

### The mixing knob { #elasticnet-mix }

The second number, `l1_ratio`, is a knob between 0 and 1:

- `0.0` → pure Ridge (only shrinks);
- `1.0` → pure Lasso (can switch off);
- in between → a mix.

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net-mix.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net-mix.expec"
```

And the same sum by hand. Of the charge, the Lasso part **subtracts** at the top (`alpha × mix`) and the Ridge part **adds** at the bottom (`alpha × (1 − mix)`):

```kafe
--8<-- "tests/DocsExamples/machine/elastic_net-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/elastic_net-by-hand.expec"
```

??? info "For the curious 🤓"
    ElasticNet minimises

    $$\frac{1}{2}\sum_i (y_i - \hat{y}_i)^2 + \alpha\,\rho \sum_j |w_j| + \frac{\alpha\,(1-\rho)}{2} \sum_j w_j^2$$

    with $\rho$ = `l1_ratio`. KAFE uses the same coordinate descent as Lasso; at each step the soft threshold uses $\alpha\rho$ and the denominator adds $\alpha(1-\rho)$. The code is in `src/lib/KafeMACHINE/linear/ElasticNet.py`.

### API { #elastic_net }

| Call | What it does |
|---|---|
| `machine.elastic_net(alpha, l1_ratio)` | Creates the model. `alpha` (`FLOAT`, default `1.0`) is the carefulness; `l1_ratio` (`FLOAT` between 0 and 1, default `0.5`) is the mix. |
| `model.fit` / `predict` / `score`, `coef_`, `intercept_` | Same as in LinearRegression. |

??? warning "Common mistakes"
    The mix must be between 0 and 1:

    ```kafe
    --8<-- "tests/DocsExamples/machine/elastic_net-ratio.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/elastic_net-ratio.error.stderr.expec"
    ```

    And `alpha` must be a `FLOAT`: write `1.0`, not `1`.

    ```kafe
    --8<-- "tests/DocsExamples/machine/elastic_net-int-alpha.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/elastic_net-int-alpha.error.stderr.expec"
    ```

| If your data… | Use |
|---|---|
| has very similar columns | Ridge |
| has columns that aren't needed | Lasso |
| has both | ElasticNet |

## SVR: a line with tolerance { #svr-support-vector-regression }

### The idea in one sentence

**SVR** (*Support Vector Regression*) draws a line with a **tube** around it. Small errors, inside the tube, **don't count**. It only cares about the points that stick out, and charges for them **without squaring**, so one odd data point can't drag it away.

### An everyday comparison

In a darts contest, the board has a **wide bullseye** and every dart inside it scores the same. Outside, you lose points depending on how far off you landed, but one dart that hits the wall doesn't make you lose the whole contest. The width of that bullseye is `epsilon` (ε).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-svr-tube.svg"
<figcaption>Four points on a straight line and one odd point far above (ringed). The SVR tube, of width ε, appears around the line that follows the four regular points. Then the linear regression line (dashed) appears, pulled upwards by the odd point.</figcaption>
</figure>

### Your first SVR

The last student got `20` instead of `11` (someone wrote the grade down wrong):

```kafe
--8<-- "tests/DocsExamples/machine/svr.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr.expec"
```

!!! tip "What happened here?"
    1. Linear regression predicted `20.2` for 6 hours: the typo bent it.
    2. `machine.svr(10.0, 1.0)` created an SVR with `C = 10.0` (how much it cares about points outside the tube) and `epsilon = 1.0` (the width of the tube).
    3. SVR learned almost the real rule: slope `2.02` and starting point `1.94`.
    4. For 6 hours it predicted `14.04`, close to the `13` the real rule gives (2 × 6 + 1).

### The maths with small numbers { #svr-math }

For the real line (2 × hours + 1) and `epsilon = 1`, this program computes what SVR charges for each point: the error **minus** the tube width, or zero if the point is inside:

```kafe
--8<-- "tests/DocsExamples/machine/svr-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr-by-hand.expec"
```

The four good points cost `0.0`. The odd point costs `8.0`, and that's the total. With squared errors, that same point would cost `81.0`. That's why linear regression tries so hard to get close to it, and SVR doesn't.

??? info "For the curious 🤓"
    Linear SVR minimises

    $$\frac{1}{2}\|w\|^2 + C \sum_i \max(0,\ |y_i - \hat{y}_i| - \varepsilon)$$

    In KAFE, with `kernel = "linear"`, it is trained with **subgradient descent**: on each round it looks at which points are outside the tube and moves the weights a tiny step (0.01) towards them. With `"rbf"` or `"poly"` it trains a different way (`_fit_kernel`) and the prediction is a sum of similarities (*kernels*) with the support points.

### Lines that bend: the kernel { #svr-kernel }

A line can't follow a curve. With `kernel = "rbf"`, SVR compares each new input with the training ones and can **bend**. Here the temperature rises and falls again over the week:

```kafe
--8<-- "tests/DocsExamples/machine/svr-kernel.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svr-kernel.expec"
```

The line scores `-0.03`: worse than always guessing the average. The `rbf` kernel scores `0.97` and predicts `6.5` for day 4 (the real value was 7).

### API { #svr }

| Call | What it does |
|---|---|
| `machine.svr(C, epsilon, kernel)` | Creates the model. `C` (`FLOAT`, default `1.0`): how much points outside the tube cost. `epsilon` (`FLOAT`, default `0.1`): tube width. `kernel` (`STR`, default `"linear"`): `"linear"`, `"rbf"` or `"poly"`. |
| `model.fit` / `predict` / `score` | Same as in LinearRegression. |
| `model.coef_` / `model.intercept_` | Weights and starting point (weights only exist with `"linear"`). |

??? warning "Common mistake: writing `1` instead of `1.0`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/svr-int.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/svr-int.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Odd data points barely affect it. | You have to choose `C`, `epsilon` and the kernel. |
| With `"rbf"` it can follow curves. | It learns step by step: slower, and its result is approximate. |

## SVM: the widest street { #svm-support-vector-machine-classifier }

### The idea in one sentence

An **SVM** (*Support Vector Machine*) separates **two groups** with a line, and out of all possible lines it picks the one that leaves the **widest street** between the groups.

### An everyday comparison

There are children from two teams in a playground and you want to paint a line between them. Many lines would work, but the safest one runs **down the middle of the widest street**: if a new child arrives slightly off, they still end up on the right side. The children touching the edge of the street are the **support vectors**: they alone decide where the line goes.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-svm-street.svg"
<figcaption>Circles in the lower left and squares in the upper right. The line turns until it sits between the groups, and the street widens until it touches the closest points of each group (ringed): the support vectors.</figcaption>
</figure>

### Your first SVM

Small fruit (group `0`) and large fruit (group `1`), each with two measurements:

```kafe
--8<-- "tests/DocsExamples/machine/svm.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm.expec"
```

!!! tip "What happened here?"
    1. `model.classes_` shows the two groups it found: `[0, 1]`.
    2. `predict` put `[2, 2]` in group `0` and `[7, 7]` in group `1`.
    3. `score` is `1.0`: it got every training fruit right.
    4. `predict_proba` says how far from the line `[2, 2]` landed: `0.83` for group `0`. It's an approximate confidence, not an exact probability.

### The maths with small numbers { #svm-math }

With a single input per example, the "line" is a point. The SVM computes $f(x) = w \cdot x + b$: if it's **positive** it's one group and if it's **negative** it's the other. The street is the zone where $f(x)$ is between −1 and 1.

For points 1, 2 (one group) and 6, 7 (the other), the best line is $w = -0.5$ and $b = 2$:

```kafe
--8<-- "tests/DocsExamples/machine/svm-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm-by-hand.expec"
```

- For each point it shows $f(x)$ and the charge (zero if the point is outside the street and on the right side). All four cost `0.0`.
- The street width is $2 \div |w|$ = `4.0` and the line is at $-b \div w$ = `4.0`, right in the middle of 2 and 6.

KAFE reaches that street **step by step**, so it ends up very close but not exact:

```kafe
--8<-- "tests/DocsExamples/machine/svm-margin.kf"
```

```text
--8<-- "tests/DocsExamples/machine/svm-margin.expec"
```

The line landed at `4.66` and the street is `4.42` wide. Points 3 and 5 ended up in different groups, as they should.

??? info "For the curious 🤓"
    Linear SVM minimises

    $$\frac{1}{2C}\|w\|^2 + \frac{1}{n}\sum_i \max(0,\ 1 - y_i\,(w \cdot x_i + b))$$

    with $y_i = \pm 1$. Making $\|w\|$ small is the same as making the street ($2/\|w\|$) wide. The second term is the **hinge loss**: it only charges points inside the street or on the wrong side.

### How it's built inside { #svm-inside }

The model lives in `src/lib/KafeMACHINE/svm/SVM.py`. With `kernel = "linear"`, `fit`:

1. Checks there are **exactly two** groups and turns them into +1 and −1.
2. Starts with weights at 0 and runs `max_iter` rounds (1000 by default).
3. On each round it looks at which points are inside the street or misclassified, and moves the weights towards them. The step starts at 1 and gets smaller.
4. At the end it stores the points left on the edge of the street as support vectors.

With `"rbf"` or `"poly"` it uses a simplified version of the SMO algorithm and can separate groups with curved borders.

!!! warning "Use small numbers"
    The first step is large. If your data has values like 50 or 1000, the SVM can jump back and forth and fail to learn well. Scale it first with [`StandardScaler`](preprocessing.md).

### API { #svm }

| Call | What it does |
|---|---|
| `machine.svm(C, kernel, max_iter)` | Creates the model. `C` (`FLOAT`, default `1.0`): how much misplaced points cost. `kernel` (`STR`, default `"linear"`). `max_iter` (`INT`, default `1000`). |
| `model.fit(X, y)` | Learns. `y` is a `List[INT]` with **two** groups. |
| `model.predict(X)` | Returns a `List[INT]`: the group of each row. |
| `model.predict_proba(X)` | Returns an approximate confidence per group, in `classes_` order. |
| `model.score(X, y)` | Returns the accuracy: the fraction it got right. |
| `model.classes_`, `coef_`, `intercept_`, `support_vectors_` | The groups, the weights, the starting point and the support vectors. |

??? warning "Common mistake: more than two groups"
    This SVM only separates two groups. For three or more, use [`LogisticRegression`](classifiers.md) or [`KNeighborsClassifier`](classifiers.md).

    ```kafe
    --8<-- "tests/DocsExamples/machine/svm-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/svm-three-classes.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Picks the safest border, not just any. | Only two groups. |
| With `"rbf"` it separates groups with curved shapes. | Sensitive to the scale of the data. |
| Only the points on the edge matter. | `predict_proba` is approximate. |

!!! tip "What did you learn on this page?"
    - **LinearRegression** finds the line with the least error.
    - **Ridge** shrinks the weights, **Lasso** switches off the useless ones and **ElasticNet** mixes both ideas.
    - **SVR** ignores small errors and resists odd data points.
    - **SVM** separates two groups with the widest street.
