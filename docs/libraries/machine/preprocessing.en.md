# MACHINE: preprocessing and reduction

Before teaching a model, you almost always need to **prepare the data**: put it on the same scale, fill gaps, turn words into numbers or keep only the useful columns. The tools on this page **don't predict anything**: they transform the data so models learn better.

| Tool | What it does |
|---|---|
| [`StandardScaler`](#standardscaler) | Centres each column on 0 and measures it in "deviations". |
| [`MinMaxScaler`](#minmaxscaler) | Stretches each column between 0 and 1. |
| [`RobustScaler`](#robustscaler) | Scales without being fooled by odd values. |
| [`SimpleImputer`](#simpleimputer) | Fills in missing data. |
| [`LabelEncoder`](#labelencoder) | Swaps text labels for numbers. |
| [`OneHotEncoder`](#onehotencoder) | Opens a column of 0s and 1s per category. |
| [`OrdinalEncoder`](#ordinalencoder) | Swaps a column's categories for numbers. |
| [`PCA`](#pca) | Summarises many columns in a few while losing almost nothing. |
| [`LinearDiscriminantAnalysis`](#lineardiscriminantanalysis) | Summarises columns so the groups stay apart. |
| [`PolynomialFeatures`](#polynomialfeatures) | Adds columns such as $x^2$ to draw curves. |
| [`VarianceThreshold`](#variancethreshold) | Removes columns that barely change. |
| [`RecursiveFeatureElimination`](#recursivefeatureelimination) | Removes, one by one, the columns that help least. |
| [`Tokenizer`](#tokenizer) | Turns text into lists of numbers. |

!!! tip "Before you start: `fit`, `transform` and `fit_transform`"
    Every tool follows the same recipe:

    - `fit(X)` **looks** at the data and learns what it needs (averages, minimums, categories…).
    - `transform(X)` **applies** what it learned, to that data or to new data.
    - `fit_transform(X)` does both at once.
    - Many have `inverse_transform`, which undoes the transformation.

    Learn (`fit`) **only from the training data** and apply (`transform`) those same numbers to the test data. Otherwise the model "peeks" at the exam. [`Pipeline`](selection.md#pipeline) does this for you.

## StandardScaler: centre and measure in deviations { #standardscaler }

### The idea in one sentence

**StandardScaler** subtracts each column's **average** and divides by its **standard deviation**. Each column ends up centred on 0, and a value of 1 means "one deviation above normal".

### An everyday comparison

You got 15 out of 20 in one exam and 70 out of 100 in another. Which was better? It depends on **how everyone else did**. If the first exam's average was 10 and almost everyone scored between 7 and 13, your 15 is excellent. Standardising means comparing against the group's average.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-standard-scaler.svg"
<figcaption>Pet weights of 7, 9, 9 and 15 kg on the top ruler. They drop to a ruler measured in deviations: the average, 10, lands on 0, and the points land on −1, −0.33, −0.33 and 1.67.</figcaption>
</figure>

### Your first StandardScaler

```kafe
--8<-- "tests/DocsExamples/machine/standard_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/standard_scaler.expec"
```

!!! tip "What happened here?"
    1. `mean_` stores each column's average: `10.0` and `4.0`.
    2. `scale_` stores the deviation: `3.0` and `2.24`.
    3. The first pet weighs 7: (7 − 10) ÷ 3 = `-1.0`.
    4. `inverse_transform` undoes everything: back to `[15.0, 7.0]`.

### The maths with small numbers { #standardscaler-math }

$$z = \frac{x - \text{average}}{\text{deviation}}$$

```kafe
--8<-- "tests/DocsExamples/machine/standard_scaler-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/standard_scaler-by-hand.expec"
```

The **variance** (`9.0`) is the average of the squared distances to the average. The **deviation** is its square root: `3.0`.

| Call | What it does |
|---|---|
| `machine.standard_scaler()` | Creates the tool. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Learn, apply and undo. |
| `mean_` / `scale_` | Each column's average and deviation. |

??? warning "Common mistake: transforming before learning"
    ```kafe
    --8<-- "tests/DocsExamples/machine/standard_scaler-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/standard_scaler-not-fitted.error.stderr.expec"
    ```

!!! note "When to use it?"
    With models that **measure distances or take gradient steps**: [KNN](classifiers.md#knn), [SVM](linear.md#svm-support-vector-machine-classifier), [K-Means](clustering.md#kmeans), logistic regression and PCA. Trees don't care about scale.

## MinMaxScaler: everything between 0 and 1 { #minmaxscaler }

### The idea in one sentence

**MinMaxScaler** stretches each column so its smallest value is **0** and its largest is **1**.

### An everyday comparison

It's like turning scores from different exams into percentages: the group's worst result becomes 0 % and the best 100 %.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-minmax-scaler.svg"
<figcaption>Weights of 7, 9, 9 and 15 kg drop to a ruler from 0 to 1: the lightest lands on 0, the heaviest on 1 and the two 9 kg pets on 0.25.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/minmax_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/minmax_scaler.expec"
```

!!! tip "What happened here?"
    The formula is $x' = \dfrac{x - \text{min}}{\text{max} - \text{min}}$. For 9 kg: (9 − 7) ÷ (15 − 7) = `0.25`. `scale_` is $1 \div (\text{max} - \text{min})$ = `0.125`. A new value of 11 kg lands on `0.5`.

| Call | What it does |
|---|---|
| `machine.minmax_scaler()` | Creates the tool. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Learn, apply and undo. |
| `data_min_` / `data_max_` / `scale_` | Each column's minimum, maximum and scale. |

??? warning "Common mistake: changing the number of columns"
    ```kafe
    --8<-- "tests/DocsExamples/machine/minmax_scaler-columns.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/minmax_scaler-columns.error.stderr.expec"
    ```

## RobustScaler: proof against odd values { #robustscaler }

### The idea in one sentence

**RobustScaler** uses the **median** (the middle value) instead of the average, and the **interquartile range** (the width of the middle half of the data) instead of the deviation. That way one very odd value doesn't ruin everyone else's scale.

### An everyday comparison

In a neighbourhood, nine houses are worth about 100 and one mansion is worth 10 000. The average says a "typical" house is worth 1 090, which describes nobody. The median says 100.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-robust-scaler.svg"
<figcaption>Coins of 1, 2, 3 and 4, and an odd value of 100. With StandardScaler the four normal coins are squashed between −0.54 and −0.46, and the odd one sits at 2. With RobustScaler they stay apart at −1, −0.5, 0 and 0.5, and only the odd one flies off to 48.5.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/robust_scaler.kf"
```

```text
--8<-- "tests/DocsExamples/machine/robust_scaler.expec"
```

!!! tip "What happened here?"
    The median of 1, 2, 3, 4, 100 is `3` (`center_`). The 25th percentile is 2 and the 75th is 4, so the interquartile range is `2` (`scale_`). The formula is $(x - \text{median}) \div \text{IQR}$: the coin of 1 lands on (1 − 3) ÷ 2 = `-1.0`.

### Settings { #robustscaler-options }

```kafe
--8<-- "tests/DocsExamples/machine/robust_scaler-options.kf"
```

```text
--8<-- "tests/DocsExamples/machine/robust_scaler-options.expec"
```

- `machine.robust_scaler(1, 0)` only **centres** (subtracts the median) and doesn't scale.
- `machine.robust_scaler(1, 1, 0)` uses the range from the 0th to the 75th percentile: from 1 to 4, width `3.0`.

| Call | What it does |
|---|---|
| `machine.robust_scaler(with_centering, with_scaling, quantile_low, quantile_high)` | All optional `INT`s: `1`/`0` to centre and scale, and the range percentiles (default `25` and `75`). |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Learn, apply and undo. |
| `center_` / `scale_` | Each column's median and range. |

??? warning "Common mistake: percentiles with decimals"
    In KAFE the percentiles are written as integers:

    ```kafe
    --8<-- "tests/DocsExamples/machine/robust_scaler-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/robust_scaler-float.error.stderr.expec"
    ```

## SimpleImputer: fill the gaps { #simpleimputer }

### The idea in one sentence

When a value is missing (`math.nan`), **SimpleImputer** fills it with a typical value from its column: the average, the median, the most frequent value or a fixed number.

### An everyday comparison

If a thermometer failed one day, you don't throw away the whole week: you write down that week's typical temperature for that day.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-simple-imputer.svg"
<figcaption>A table of four days with two columns and two gaps marked "?". Each column's average appears below, 22 and 8, and the gaps are filled with those averages.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer.expec"
```

!!! tip "What happened here?"
    1. With `"mean"`, the first column's average without the gap is (20 + 22 + 24) ÷ 3 = `22`, and the second's is (4 + 6 + 14) ÷ 3 = `8`.
    2. With `"median"`, the second column gives `6`: the median isn't dragged by the 14.

For text, use `"most_frequent"`, the value that repeats most:

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer-most-frequent.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer-most-frequent.expec"
```

And to fill with a fixed number there's a separate function:

```kafe
--8<-- "tests/DocsExamples/machine/simple_imputer_constant.kf"
```

```text
--8<-- "tests/DocsExamples/machine/simple_imputer_constant.expec"
```

| Call | What it does |
|---|---|
| `machine.simple_imputer(strategy)` | `strategy`: `"mean"`, `"median"` or `"most_frequent"`. |
| `machine.simple_imputer_constant(fill_value)` | Always fills with `fill_value`. |
| `fit` / `transform` / `fit_transform` | Learn and fill. |
| `statistics_` / `strategy` / `fill_value` | Each column's fill value and the settings. |

??? warning "Common mistake: asking `simple_imputer` for `\"constant\"`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/simple_imputer-constant.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/simple_imputer-constant.error.stderr.expec"
    ```

## LabelEncoder: words to numbers { #labelencoder }

### The idea in one sentence

Models only understand numbers. **LabelEncoder** sorts the labels alphabetically and gives each one a number: 0, 1, 2…

### An everyday comparison

It's a class register: instead of "Ana", "Ben", "Carla", the teacher says "number 0, number 1, number 2".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-label-encoder.svg"
<figcaption>Four words: pear, apple, pear, kiwi. A dictionary appears in alphabetical order (apple 0, kiwi 1, pear 2) and each word turns into its number: 2, 0, 2, 1.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/label_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/label_encoder.expec"
```

| Call | What it does |
|---|---|
| `machine.label_encoder()` | Creates the tool. It works with a **list** of labels (`List[STR]`). |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Learn, encode and decode. |
| `classes_` | The labels in order: the position is their number. |

??? warning "Common mistake: a label it never saw"
    ```kafe
    --8<-- "tests/DocsExamples/machine/label_encoder-unseen.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/label_encoder-unseen.error.stderr.expec"
    ```

!!! note "Use it for `y`, not for `X`"
    If you turn "red, green, blue" into 0, 1, 2 inside `X`, the model will think blue is "twice" green. For data columns, use [`OneHotEncoder`](#onehotencoder).

## OneHotEncoder: one column per category { #onehotencoder }

### The idea in one sentence

**OneHotEncoder** replaces a column of categories with **one column per category**, with a `1` where it applies and `0` in the rest. That way no category looks "bigger" than another.

### An everyday comparison

On a form, instead of writing your pet, you tick a box: ☑ cat ☐ dog ☐ fish.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-one-hot-encoder.svg"
<figcaption>A "pet" column with cat, dog, fish and cat. Three new columns appear (pet_cat, pet_dog and pet_fish) and each row lights up a 1 in its pet's column and 0 in the others.</figcaption>
</figure>

It works with [PARDOS](../pardos.md) tables and you tell it which columns to convert:

```kafe
--8<-- "tests/DocsExamples/machine/one_hot_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/one_hot_encoder.expec"
```

| Call | What it does |
|---|---|
| `machine.one_hot_encoder()` | Creates the tool. |
| `fit(df, columns)` / `fit_transform(df, columns)` | Learns the categories of those columns (and converts them). |
| `transform(df)` / `inverse_transform(df)` | Convert and undo. |
| `columns_` / `handle_unknown` | The converted columns and what to do with new categories (`"error"`). |

??? warning "Common mistake: a category it never saw"
    ```kafe
    --8<-- "tests/DocsExamples/machine/one_hot_encoder-unseen.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/one_hot_encoder-unseen.error.stderr.expec"
    ```

## OrdinalEncoder: categories to numbers, in a table { #ordinalencoder }

### The idea in one sentence

**OrdinalEncoder** does the same as LabelEncoder, but on **columns of a table**: it swaps each category for its position in **alphabetical order**.

```kafe
--8<-- "tests/DocsExamples/machine/ordinal_encoder.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ordinal_encoder.expec"
```

!!! warning "Alphabetical order, not size order"
    The sizes became `large = 0`, `medium = 1`, `small = 2`: alphabetical, **not** small to large. If the order matters to your model, check that the alphabetical one makes sense, or use `OneHotEncoder`.

| Call | What it does |
|---|---|
| `machine.ordinal_encoder()` | Creates the tool. |
| `fit(df, columns)` / `fit_transform(df, columns)` / `transform` / `inverse_transform` | Same as `OneHotEncoder`. |
| `columns_` | The converted columns. |

??? warning "Common mistake: a column that doesn't exist"
    ```kafe
    --8<-- "tests/DocsExamples/machine/ordinal_encoder-column.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ordinal_encoder-column.error.stderr.expec"
    ```

## PCA: the best shadow { #pca }

### The idea in one sentence

**PCA** (*Principal Component Analysis*) finds the **direction in which the data is most spread out** and projects it onto that direction. That way it summarises many columns in a few, losing as little as possible.

### An everyday comparison

If you shine a torch at a pencil, its shadow can be a dot (lit end-on) or a long line (lit from the side). PCA looks for the angle with the **longest shadow**: the one that keeps the most information.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-pca-shadow.svg"
<figcaption>Four points on a grid. A line turns until it points along the diagonal, where the points are most spread out. Each point drops its shadow onto the line, and the shadows become a single row of numbers: −2.12, 0, 0 and 2.12.</figcaption>
</figure>

### Your first PCA

```kafe
--8<-- "tests/DocsExamples/machine/pca.kf"
```

```text
--8<-- "tests/DocsExamples/machine/pca.expec"
```

!!! tip "What happened here?"
    1. `machine.pca(1)` summarises **2 columns in 1**.
    2. `components_` is the direction: `[0.707, 0.707]`, the diagonal.
    3. `explained_variance_` (`3.0`) says how much spread there is in that direction.
    4. The shadows are `-2.12`, `0.0`, `0.0` and `2.12`.
    5. `inverse_transform` goes back to 2 columns, but only recovers what was in the shadow: points (2, 3) and (3, 2) both end up at (2.5, 2.5). That's the information that's lost.

### The maths with small numbers { #pca-math }

PCA looks at the **covariance matrix**: how much each column varies and how much they vary together.

```kafe
--8<-- "tests/DocsExamples/machine/pca-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/pca-by-hand.expec"
```

1. The two columns' variances are `1.667` and their covariance is `1.333`: they grow together.
2. A 2 × 2 matrix has a direct formula for its **eigenvalues**: `3.0` (the diagonal direction) and `0.333` (the perpendicular one). The large one is what PCA keeps.
3. The shadows are each point (minus the average) times the direction $(\sqrt{0.5}, \sqrt{0.5})$.

??? info "For the curious 🤓"
    With $X$ centred, the covariance is $C = \frac{1}{n-1}X^T X$. The principal components are the **eigenvectors** of $C$ sorted by their **eigenvalue** $\lambda$; each $\lambda$ is the variance in that direction. Keeping $k$ components keeps the fraction $\sum_{i \le k}\lambda_i \big/ \sum_i \lambda_i$ of the total variance: here $3 \div 3.333 = 90\%$.

| Call | What it does |
|---|---|
| `machine.pca(n_components)` | Creates the tool; `n_components` (`INT`) is how many columns remain. |
| `fit` / `transform` / `fit_transform` / `inverse_transform` | Learn, project and go back (approximately). |
| `components_` / `explained_variance_` / `mean_` | The directions, their variance and the average. |
| `pca.round(decimals)` | Rounds the stored numbers for display. |

??? warning "Common mistake: asking for more components than columns"
    ```kafe
    --8<-- "tests/DocsExamples/machine/pca-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/pca-too-many.error.stderr.expec"
    ```

## LinearDiscriminantAnalysis: separate while summarising { #lineardiscriminantanalysis }

### The idea in one sentence

**LDA** also summarises columns by projecting, but it **knows the groups** and picks the direction in which the groups are **farthest apart** from each other and **tightest** inside. It can also classify.

### An everyday comparison

To photograph two football teams, PCA looks for the angle where you see the most people; LDA looks for the angle where **the shirts don't mix**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-lda-direction.svg"
<figcaption>Circles in the lower left and squares in the upper right. A line turns towards the direction where the two groups are farthest apart, compared with how spread out each one is. Their shadows on that line form a row where circles and squares don't mix.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/linear_discriminant_analysis.kf"
```

```text
--8<-- "tests/DocsExamples/machine/linear_discriminant_analysis.expec"
```

!!! tip "What happened here?"
    1. With 2 groups, LDA keeps **1** direction: `n_components` is `1`.
    2. `prior_` and `means_` are each group's share and centre.
    3. `predict` puts `[3, 3]` in group 0 and `[7, 6]` in group 1. The accuracy is `1.0`.
    4. `transform` gives each pet's shadow: cats land between 1.7 and 3.93 and dogs between 7.47 and 10.09, without mixing.

??? info "For the curious 🤓"
    LDA maximises **Fisher's ratio**: the distance between the group centres over the spread within each group. With two groups, the best direction is $w \propto S_W^{-1}(\mu_1 - \mu_0)$, where $S_W$ adds up each group's spread. With $k$ groups you can get at most $k - 1$ directions.

| Call | What it does |
|---|---|
| `machine.linear_discriminant_analysis()` | Creates the tool. |
| `fit(X, y)` | Learns, **with** the answers. |
| `transform` / `predict` / `score` | Project, classify, and accuracy. |
| `classes_`, `prior_`, `means_`, `n_components` | The groups, their share, their centres and how many directions it keeps. |

??? warning "Common mistake: a single group"
    ```kafe
    --8<-- "tests/DocsExamples/machine/linear_discriminant_analysis-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/linear_discriminant_analysis-one-class.error.stderr.expec"
    ```

## PolynomialFeatures: curves with a straight-line model { #polynomialfeatures }

### The idea in one sentence

**PolynomialFeatures** adds new columns built from the ones you have: squares ($x^2$), products ($x \cdot y$)… With them, a **linear** model can draw **curves**.

### An everyday comparison

A square's area doesn't grow in a straight line with its side: side 2 gives area 4, side 3 gives area 9. A straight ruler can't follow those points. But if you give the model the column "side²", the relationship is straight again: area = 1 × side².

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-polynomial-features.svg"
<figcaption>Squares of side 1 to 4 with areas 1, 4, 9 and 16 form a curve. A straight line (dashed) can't follow them. When the x² column is added, the same linear model draws a curve through every point.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/polynomial_features-curve.kf"
```

```text
--8<-- "tests/DocsExamples/machine/polynomial_features-curve.expec"
```

Linear regression predicted `25.0` for side 5: exactly 5². With two columns and degree 2, every combination appears:

```kafe
--8<-- "tests/DocsExamples/machine/polynomial_features.kf"
```

```text
--8<-- "tests/DocsExamples/machine/polynomial_features.expec"
```

For `[2, 3]` you get 6 columns: `1` (the bias), `3`, `9` (3²), `2`, `6` (2 × 3) and `4` (2²).

| Call | What it does |
|---|---|
| `machine.polynomial_features(degree, include_bias)` | `degree` (`INT`, default `2`); `include_bias` (`BOOL`, default `True`) adds the column of ones. |
| `fit` / `transform` / `fit_transform` | Learn and add columns. |
| `n_features_in_` / `n_features_out_` | How many columns go in and how many come out. |

??? warning "Common mistake: trying to undo it"
    ```kafe
    --8<-- "tests/DocsExamples/machine/polynomial_features-inverse.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/polynomial_features-inverse.error.stderr.expec"
    ```

!!! note "Careful with the degree"
    The columns grow very fast: with 10 columns and degree 3 you get 286. With a high degree, the model can memorise the data.

## VarianceThreshold: out with what doesn't change { #variancethreshold }

### The idea in one sentence

A column that **always has the same value** doesn't help tell anything apart. **VarianceThreshold** removes the columns whose variance doesn't exceed a threshold.

### An everyday comparison

If everyone in a survey answered "yes" to a question, that question can't help you separate anyone.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-variance-threshold.svg"
<figcaption>Three bars show the variance of three columns: 0, 0.125 and 5. A threshold at 0 crosses out the first, which never changes. Then the threshold rises to 0.5 and crosses out the second too; only the third remains.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/variance_threshold.kf"
```

```text
--8<-- "tests/DocsExamples/machine/variance_threshold.expec"
```

!!! tip "What happened here?"
    The variances are `0.0`, `0.125` and `5.0`. With the default threshold (`0.0`) the first column goes and positions `[1, 2]` remain. With `0.5` the second goes too and only `[2]` remains.

| Call | What it does |
|---|---|
| `machine.variance_threshold(threshold)` | `threshold` (`FLOAT`, default `0.0`). |
| `fit` / `transform` / `fit_transform` | Measure and remove columns. |
| `variances_` / `selected_indices_` | Each column's variance and the ones that remain. |

??? warning "Common mistake: a negative threshold"
    ```kafe
    --8<-- "tests/DocsExamples/machine/variance_threshold-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/variance_threshold-negative.error.stderr.expec"
    ```

## RecursiveFeatureElimination: remove what helps least { #recursivefeatureelimination }

### The idea in one sentence

**RFE** trains a linear regression, looks at which column has the **smallest weight**, removes it and trains again, until the number of columns you asked for remains.

### An everyday comparison

A coach wants a team of 2. They watch all 3 play, drop the one who contributed least, and if there are still too many, watch them play again.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-rfe.svg"
<figcaption>Three bars show how much a linear model relies on each column: 2.00, 0.00 and 3.00. The one with the smallest weight, x1, is crossed out, and the ranking marks the kept columns with 1 and the dropped one with 3.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/recursive_feature_elimination.kf"
```

```text
--8<-- "tests/DocsExamples/machine/recursive_feature_elimination.expec"
```

!!! tip "What happened here?"
    These houses' price is exactly 2 × column 0 + 3 × column 2: column 1 is pure noise. RFE removed it: `support_` is `[True, False, True]` and `ranking_` is `[1, 3, 1]` (1 = kept).

| Call | What it does |
|---|---|
| `machine.recursive_feature_elimination(n_features)` | `n_features` (`INT`, default `1`): how many columns remain. |
| `fit(X, y)` / `transform(X)` | Choose columns (with the answers) and keep them. |
| `support_`, `ranking_`, `selected_indices_` | Which columns remain, their elimination order and their positions. |

??? warning "Common mistake: asking for more columns than there are"
    ```kafe
    --8<-- "tests/DocsExamples/machine/recursive_feature_elimination-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/recursive_feature_elimination-too-many.error.stderr.expec"
    ```

!!! warning "Weights depend on scale"
    RFE compares weights. If one column is in metres and another in millimetres, their weights aren't comparable: scale first with [`StandardScaler`](#standardscaler).

## Tokenizer: text to numbers { #tokenizer }

### The idea in one sentence

**Tokenizer** lowercases the text, **splits it into words** and gives each word a number according to how frequent it is. That way a sentence becomes a list of numbers that a model (for example, a [GESHA](../gesha.md) network) can read.

### An everyday comparison

It's a numbered dictionary: the most used word gets the smallest number. Instead of sending "the dog eats the bone", you send "2 5 3 2 6".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tokenizer.svg"
<figcaption>The sentence "the dog eats the bone" splits into five words, and each becomes its vocabulary number: 2, 5, 3, 2, 6. Index 0 is reserved for padding and 1 for unknown words.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/machine/tokenizer.kf"
```

```text
--8<-- "tests/DocsExamples/machine/tokenizer.expec"
```

!!! tip "What happened here?"
    1. `machine.tokenizer(0, "<?>")`: no word limit (`0`) and `"<?>"` for unknown words, which takes number `1`.
    2. "the" appears 3 times: it gets `2`. "eats" appears twice: `3`. Then come cat `4`, dog `5` and bone `6`.
    3. "bird" wasn't in the vocabulary: it becomes `1`.
    4. `vocabulary_size` is `7`: numbers 0 to 6.
    5. With `machine.tokenizer(2)` only the **2 most frequent words** are kept, with no unknown-word marker: "the bird eats" becomes `[1, 2]` and "bird" disappears.

| Call | What it does |
|---|---|
| `machine.tokenizer(num_words, oov_token)` | `num_words` (`INT`, `0` = no limit); `oov_token` (`STR`, empty by default): the marker for unknown words. |
| `fit(texts)` / `transform(texts)` / `fit_transform(texts)` | Build the vocabulary and convert. They take a `List[STR]`. |
| `vocabulary_size`, `num_words`, `oov_token` | The vocabulary size (counting 0) and the settings. |

??? warning "Common mistake: converting without a vocabulary"
    ```kafe
    --8<-- "tests/DocsExamples/machine/tokenizer-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/tokenizer-not-fitted.error.stderr.expec"
    ```

!!! tip "What did you learn on this page?"
    - **Scalers** put columns on a similar scale: StandardScaler (average and deviation), MinMaxScaler (0 to 1) and RobustScaler (median, proof against odd values).
    - **SimpleImputer** fills gaps; **encoders** turn categories into numbers.
    - **PCA** and **LDA** summarise columns by projecting; **PolynomialFeatures** adds columns to draw curves.
    - **VarianceThreshold** and **RFE** remove columns that don't help; **Tokenizer** turns text into numbers.
    - Learn with `fit` only on the training data and apply with `transform` everywhere else.
