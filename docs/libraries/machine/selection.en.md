# MACHINE: model selection

Training a model is only half the job. The other half is knowing **how good it is** and **picking the best version**. This page has the tools for that: setting data aside for a fair exam, repeating the exam several times, trying different settings and chaining steps.

None of these tools is a new model. They are **helpers** that work with the models you already know.

| Tool | What it is for |
|---|---|
| [`train_test_split`](#train_test_split) | Setting part of the data aside for the exam. |
| [`stratified_train_test_split`](#stratified_train_test_split) | The same, while keeping every group fairly represented. |
| [`k_fold`](#k_fold) | Dividing the data into several exam turns. |
| [`cross_val_score`](#cross_val_score) | Running several exams and averaging the grades. |
| [`grid_search_cv`](#grid_search_cv) | Trying settings in order, one by one. |
| [`randomized_search_cv`](#randomized_search_cv) | Trying settings picked by a draw. |
| [`pipeline`](#pipeline) | Joining several steps (prepare data → model) into one object. |

!!! tip "Before you start"
    We use `fit`, `predict` and `score` here. If you don't know them, read [how MACHINE works](../machine.md) first. The exact signature of every call is in the [MACHINE contracts](contracts.md).

## Setting data aside for the exam { #model-selection }

### The idea in one sentence

To know whether a model really learned, you have to test it with data it has **never seen**.

### An everyday comparison

Imagine a teacher gives you ten solved exercises to study and then puts **those same ten** on the exam. You would get the top grade even if you had only memorized them. That exam says nothing.

A good teacher **keeps** some exercises and does not show them to you. Those become the exam. If you solve them well, it is because you understood.

Models work the same way. We divide the data into two piles:

- **Training** (*train*): the examples the model studies with (`fit`).
- **Test** (*test*): the examples kept for the exam (`score`).

<!-- figura pendiente: diez fichas se barajan y dos se apartan a una caja "test"; las otras ocho entran al modelo -->

### The math with small numbers { #model-selection-math }

There is only one calculation: **how many examples go to each pile**. You choose `test_size`, the fraction kept for the exam.

$$\text{training} = \lfloor n \times (1 - \text{test\_size}) \rfloor \qquad \text{test} = n - \text{training}$$

The little bars $\lfloor\ \rfloor$ mean "drop the decimals".

With $n = 10$ examples and `test_size = 0.2`:

- training: 10 × (1 − 0.2) = 10 × 0.8 = **8**
- test: 10 − 8 = **2**

With $n = 5$ and `test_size = 0.4`: 5 × 0.6 = **3** to train and **2** for the exam.

### `machine.train_test_split(X, y, test_size, random_state, shuffle)` { #train_test_split }

**What it does:** Shuffles the examples and divides them into two piles: training and test.

**When to use it:** Whenever you want to give a model an honest grade.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` or `List[List[INT]]` | The data table: one row per example. |
| `y` | `List[FLOAT]` or `List[INT]` | The answer for each example, in the same order. |
| `test_size` | `FLOAT` | Fraction for the exam, between 0 and 1 (not touching them). If you leave it out it is `0.2`. |
| `random_state` | `INT` | The **seed** for shuffling. With the same number, the split is always the same. If you leave it out it is `0`, which means "shuffle differently every time". |
| `shuffle` | `BOOL` | `True` shuffles before splitting (the usual choice). `False` keeps the order. |

KAFE has no named arguments: parameters are written **in this order**. You may leave out the last ones.

**Returns:** `MACHINE`: a small box with four parts that you take out with square brackets.

| Part | What it holds |
|---|---|
| `split[0]` | Training `X` |
| `split[1]` | Test `X` |
| `split[2]` | Training `y` |
| `split[3]` | Test `y` |

**Example:** Ten students wrote down their study hours and their grade. We keep two for the exam:

```kafe
--8<-- "tests/DocsExamples/machine/train_test_split.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/train_test_split.expec"
```

!!! tip "What happened here?"
    1. `train_test_split(hours, grade, 0.2, 42)` shuffled the ten examples with seed `42` and set 20% aside.
    2. That left `8` to train and `2` for the exam, just like the calculation above.
    3. The students with 1 and 2 hours went to the exam, with their grades `3.0` and `5.0`. Each piece of data travels with its answer.
    4. The model studied only with the other eight (`fit`).
    5. `score` tested it with the two it never saw and it got `1.0`: it learned the rule instead of memorizing it.

If you set `shuffle` to `False`, nothing is shuffled: the **last** examples go to the exam.

```kafe
--8<-- "tests/DocsExamples/machine/train_test_split-no-shuffle.kf"
```

```text
--8<-- "tests/DocsExamples/machine/train_test_split-no-shuffle.expec"
```

!!! warning "Seed 0 is not fixed"
    `random_state = 0` means "no seed": the split changes every time you run the program. To repeat the same result every time, use another number, such as `42`.

**Common mistakes:**

??? warning "A `test_size` out of range"
    `test_size` is a fraction, not a percentage. For 20% you write `0.2`, not `20.0`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/train_test_split-test-size.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/train_test_split-test-size.error.stderr.expec"
    ```

It also fails if `X` is empty or if `X` and `y` do not have the same number of examples. And remember that KAFE cannot unpack one result into four variables at once: take each part out with `split[0]`, `split[1]`, `split[2]` and `split[3]`.

### Stratifying: every group reaches the exam { #stratified-idea }

Shuffling has a risk. Imagine 12 fruits: 8 apples and 4 grapes. If you set 3 aside at random, you could get **3 apples**. The exam would have no grapes at all and you would never know whether the model recognizes them.

**Stratifying** means splitting **group by group**, so the exam has the same proportion of each class as the whole set. It is like building a team that represents the whole school: you take a few students from each grade, not all from the same one.

<!-- figura pendiente: 8 fichas de un color y 4 de otro; de cada fila se aparta la cuarta parte hacia la caja "test" -->

The calculation is done **for each class**, with `test_size = 0.25`:

| Class | There are | Go to the exam | Stay to train |
|---|---|---|---|
| Apple (`0`) | 8 | 8 × 0.25 = **2** | 6 |
| Grape (`1`) | 4 | 4 × 0.25 = **1** | 3 |
| Total | 12 | **3** | **9** |

In the whole set, 4 out of 12 fruits are grapes (one third). In the exam, 1 out of 3 is a grape (one third). The proportion was kept.

### `machine.stratified_train_test_split(X, y, test_size, random_state)` { #stratified_train_test_split }

**What it does:** Splits into training and test while keeping the proportion of each class.

**When to use it:** In **classification**, especially if you have little data or one group is much smaller than another.

| Parameter | Type | What it means |
|---|---|---|
| `X` | A list with one example per position | The data. Each example can be a row of numbers or something bigger, such as an image (lists inside lists). |
| `y` | `List[INT]` or `List[FLOAT]` | The class of each example. |
| `test_size` | `FLOAT` | Fraction for the exam, between 0 and 1. If you leave it out it is `0.2`. |
| `random_state` | `INT` | The seed. `0` (the value if you leave it out) means "different every time". |

This function **always shuffles**; it has no `shuffle` parameter.

**Returns:** `MACHINE`: the same four-part box as `train_test_split`.

**Example:** The 12 fruits from the table (each one with its weight):

```kafe
--8<-- "tests/DocsExamples/machine/stratified_train_test_split.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/stratified_train_test_split.expec"
```

!!! tip "What happened here?"
    1. `9` fruits were left to train and `3` for the exam.
    2. The exam holds `[1, 0, 0]`: one grape and two apples, exactly what we worked out by hand.
    3. The loop adds up the exam labels. Since grapes are worth `1`, the sum (`1`) is the number of grapes.

??? info "For the curious 🤓"
    For each class with $n_c$ examples, $\lfloor n_c \times \text{test\_size} \rfloor$ go to the exam. If the class has more than one example, the function makes sure at least **one** goes to the exam and at least **one** stays to train. A class with a single example stays entirely in training. That is why, with very little data, the proportion may not come out exact. At the end both piles are shuffled so the classes are not lined up.

**Common mistakes:** The same as `train_test_split`: `test_size` out of range, an empty `X`, or different sizes for `X` and `y`. The messages start with `stratified_train_test_split:`.

!!! tip "What did you learn?"
    - A model is tested with data it did not see while training.
    - `test_size` says what fraction is kept; `random_state` (other than 0) makes the split repeatable.
    - Stratifying keeps the proportion of each class in the exam.

## Cross-validation: several exams instead of one { #crossvalscore }

### The idea in one sentence

Instead of a single exam, we run **several**, each time with a different part of the data, and **average** the grades.

### An everyday comparison

A single exam can go well or badly by luck: they asked exactly what you knew, or exactly what you didn't. That is why teachers give several exams during the year and take the **average**. The average is fairer than one grade.

In **cross-validation** we cut the data into equal parts called **folds**. With 5 folds there are 5 rounds. In each round, a different fold is the exam and the other four are for studying. In the end, **every** example was in the exam exactly once.

<!-- figura pendiente: fila de 5 bloques; el bloque "examen" (color acento) se mueve de izquierda a derecha en 5 rondas y debajo aparece la nota de cada ronda y su promedio -->

| Round | Fold 1 | Fold 2 | Fold 3 | Fold 4 | Fold 5 |
|---|---|---|---|---|---|
| 1 | **exam** | study | study | study | study |
| 2 | study | **exam** | study | study | study |
| 3 | study | study | **exam** | study | study |
| 4 | study | study | study | **exam** | study |
| 5 | study | study | study | study | **exam** |

### The math with small numbers { #crossvalscore-math }

Suppose the five rounds gave these grades (1.0 is getting everything right; 0.5 is getting half right):

| Round | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Grade | 0.5 | 1.0 | 1.0 | 1.0 | 1.0 |

**The average** is adding everything and dividing by how many grades there are:

$$\text{average} = \frac{0.5 + 1.0 + 1.0 + 1.0 + 1.0}{5} = \frac{4.5}{5} = 0.9$$

**The deviation** says how **similar** the grades were to each other. If it is small, the model is steady. If it is large, sometimes it does well and sometimes badly. It is calculated like this:

1. Subtract the average from each grade: −0.4, 0.1, 0.1, 0.1, 0.1.
2. Square each result: 0.16, 0.01, 0.01, 0.01, 0.01.
3. Add them: **0.20**.
4. Divide by the number of grades **minus one**: 0.20 ÷ 4 = **0.05**.
5. Take the square root: √0.05 ≈ **0.22**.

So the model scores **0.9 ± 0.22**. You will see these same numbers below, calculated by KAFE.

??? info "For the curious 🤓"
    With $k$ folds and grades $s_1, \dots, s_k$:

    $$\bar{s} = \frac{1}{k}\sum_{i=1}^{k} s_i \qquad \text{deviation} = \sqrt{\frac{1}{k-1}\sum_{i=1}^{k}(s_i - \bar{s})^2}$$

    If $n$ does not divide evenly by $k$, the first folds get one extra example. With $n = 7$ and $k = 3$ the sizes are 3, 2 and 2. Cross-validation trains the model $k$ times, so it costs $k$ times more than a single `train_test_split`. In exchange, it uses all the data for testing and the grade depends less on luck.

### How it is built inside { #crossvalscore-inside }

Everything lives in `src/lib/KafeMACHINE/model_selection/model_selection.py`.

`k_fold` does not touch your data: it works only with **position numbers** (indices).

1. It makes the list `0, 1, 2, …, n − 1`. If `shuffle` is `True`, it shuffles it with the seed.
2. It cuts it into `n_splits` nearly equal pieces.
3. For each piece it builds a pair: `[the other indices, this piece]`.

`CrossValScore` (the object `cross_val_score` creates) stores `cv`, `scoring`, `random_state` and three empty results. Its `fit(model, X, y)`:

1. Checks that the model is **not trained**.
2. Asks `k_fold` for the folds, **always shuffling**, with your seed.
3. In each round it makes a **fresh copy** of the model, trains it with the study examples and grades it with the exam examples.
4. Stores the grades in `scores_`, their average in `mean_score_` and their deviation in `std_score_`.

Your original model stays **untrained**: only the copies were used.

### `machine.k_fold(n_samples, n_splits, shuffle, random_state)` { #k_fold }

**What it does:** Divides the indices `0 … n_samples − 1` into folds and tells you, for each round, who studies and who is the exam.

**When to use it:** When you want to build cross-validation **yourself**, step by step. It trains nothing.

| Parameter | Type | What it means |
|---|---|---|
| `n_samples` | `INT` | How many examples you have. |
| `n_splits` | `INT` | How many folds (rounds). At least 2 and no more than `n_samples`. If you leave it out it is `5`. |
| `shuffle` | `BOOL` | `True` shuffles the indices before cutting. If you leave it out it is `False`. |
| `random_state` | `INT` | The seed for shuffling. `0` means "different every time". |

**Returns:** `List[List[List[INT]]]`: a list with one pair per round. `folds[i][0]` are the indices to study with and `folds[i][1]` the exam ones.

**Example:** Ten examples in five folds, without shuffling:

```kafe
--8<-- "tests/DocsExamples/machine/k_fold.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/k_fold.expec"
```

!!! tip "What happened here?"
    1. There are `5` rounds.
    2. The exams are `[0, 1]`, `[2, 3]`, `[4, 5]`, `[6, 7]` and `[8, 9]`: each example appears only once. This is the block that keeps moving.
    3. In the first round everyone else studies: from `2` to `9`.

With `shuffle` set to `True` and a seed, the indices are shuffled before cutting:

```kafe
--8<-- "tests/DocsExamples/machine/k_fold-shuffle.kf"
```

```text
--8<-- "tests/DocsExamples/machine/k_fold-shuffle.expec"
```

**Common mistakes:**

??? warning "More folds than examples"
    You cannot cut 3 examples into 5 parts:

    ```kafe
    --8<-- "tests/DocsExamples/machine/k_fold-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/k_fold-too-many.error.stderr.expec"
    ```

It also fails if `n_samples` is not positive or if `n_splits` is less than 2.

### `machine.cross_val_score(cv, scoring, random_state)` { #cross_val_score }

**What it does:** Creates an **evaluator** that runs the whole cross-validation for you.

**When to use it:** When you want a reliable grade for a model, especially with little data.

| Parameter | Type | What it means |
|---|---|---|
| `cv` | `INT` | How many folds. If you leave it out it is `5`. |
| `scoring` | `STR` | How the grade is given (see the table below). If you leave it out it is `"accuracy"`. |
| `random_state` | `INT` | The seed for shuffling the folds. `0` means "different every time". |

| `scoring` | What it measures | Better high or low? |
|---|---|---|
| `"accuracy"` | Fraction of right answers. For classification. | High |
| `"r2"` | The $R^2$ grade from [regression](linear.md#linearregression-math). | High |
| `"mse"` | The average of the squared errors. For regression. | **Low** |

The metrics are explained in [Functions and metrics](metrics.md). With any other text, the model's own `score` is used.

**Returns:** `MACHINE`: the evaluator, with no results yet.

### `cv.fit(model, X, y)` { #crossvalscore-fit }

**What it does:** Runs the rounds: trains a copy of the model in each one and stores the grades.

| Parameter | Type | What it means |
|---|---|---|
| `model` | `MACHINE` | An **untrained** (freshly created) model. |
| `X` | `List[List[FLOAT]]` | The data table. |
| `y` | `List[INT]` or `List[FLOAT]` | The answers. |

**Returns:** The same evaluator, now with results.

Watch the order: here `fit` takes **the model first** and the data after.

### What the evaluator stores { #crossvalscore-properties }

| Property | Type | What it stores |
|---|---|---|
| `cv.scores_` | `List[FLOAT]` | The grade of each round. |
| `cv.mean_score_` | `FLOAT` | The average of the grades. |
| `cv.std_score_` | `FLOAT` | The deviation: how different the grades were. |
| `cv.cv` | `INT` | The folds you asked for. |
| `cv.scoring` | `STR` | The grading method you asked for. |
| `cv.random_state` | `INT` | The seed you asked for. |

They are properties: written **without parentheses**, and read-only.

**Example:** Ten fruits with their weight and diameter: five apples (`0`) and five grapes (`1`). Careful: there is a very small apple (`[40.0, 3.0]`) and a very large grape (`[45.0, 3.2]`), which look alike.

```kafe
--8<-- "tests/DocsExamples/machine/cross_val_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/cross_val_score.expec"
```

!!! tip "What happened here?"
    1. `cross_val_score(5, "accuracy", 7)` created a 5-round evaluator that measures right answers.
    2. `cv.fit(machine.knn(3), fruits, kind)` ran the 5 rounds with copies of a 3-neighbor [KNN](classifiers.md).
    3. In the first round the grade was `0.5`: the small apple landed in the exam, and its nearest neighbors were grapes. It missed one out of two.
    4. In the other four it got everything right: `1.0`.
    5. The average is `0.9` and the deviation `0.22`: the same numbers we worked out by hand.

With a single `train_test_split`, the grade would have been `0.5` or `1.0` depending on the luck of the split. The `0.9` average tells the whole story.

This program does the same thing **by hand**: it asks `k_fold` for the folds, builds the lists for each round, trains, grades and averages.

```kafe
--8<-- "tests/DocsExamples/machine/cross_val_score-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/cross_val_score-by-hand.expec"
```

The five grades and the average match. That is all `cross_val_score` does inside.

**Common mistakes:**

??? warning "Passing an already trained model"
    The evaluator needs a fresh model, because it will train it itself in each round:

    ```kafe
    --8<-- "tests/DocsExamples/machine/cross_val_score-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/cross_val_score-fitted.error.stderr.expec"
    ```

    Remove the `model.fit(...)` line and it works.

It also fails if the data is empty or if `X` and `y` have different sizes. And remember: after `cv.fit(...)` your model is still **untrained**. If you want to use it to predict, call its own `fit`.

### Strengths and limits { #crossvalscore-tradeoffs }

| | A single split (`train_test_split`) | Cross-validation |
|---|---|---|
| Exams | 1 | `cv` |
| Trainings | 1 | `cv` (slower) |
| Depends on luck? | Quite a lot | Little |
| Data used as exam | Only one part | All of it, once each |
| Works best with | Lots of data | Little or medium data |

!!! tip "What did you learn?"
    - Cross-validation runs several exams by moving the test block.
    - The final grade is the average; the deviation says whether the model is steady.
    - `k_fold` only divides indices; `cross_val_score` trains and gives the grades.

## GridSearchCV: trying every setting in order { #gridsearchcv }

### The idea in one sentence

Many models have **knobs** you choose before training. Grid search means **trying every combination** of knobs and keeping the one with the best grade.

### An everyday comparison

You want to bake the best cookie. You can change the temperature (160°, 180°, 200°) and the time (10 or 15 minutes). To be sure, you bake **one batch for each combination**, taste them all and pick the best. That is a **grid**: a table with every combination.

<!-- figura pendiente: rejilla 3×2 de casillas; se iluminan una por una con su nota y la mejor queda marcada -->

Those knobs are called **hyperparameters**. They are not what the model learns from the data: they are what **you decide beforehand**. For example, the `k` in [KNN](classifiers.md) (how many neighbors to look at) or the `alpha` in [`RidgeRegression`](linear.md#ridgeregression).

### Choosing settings without cheating { #gridsearchcv-overfitting }

An **overfitted** model is one that memorized the examples: it gets a perfect grade on what it already saw and fails on anything new.

If you choose hyperparameters by looking at the grade on the **same training data**, you will reward exactly the ones that memorize the most. With KNN and `k = 1`, each example is its own nearest neighbor, so the training grade is always perfect. That says nothing.

The solution is the one from this whole page: **each combination is graded with cross-validation**, that is, with data that copy of the model did not see.

!!! note "A separate final exam"
    If you try many combinations, one of them may win by pure luck. So the cleanest way is: first set a test set aside with `train_test_split`, search for settings using only the training set, and use the test set **only once**, at the end.

### The math with small numbers { #gridsearchcv-math }

**How many combinations are there?** Multiply the number of options of each knob:

$$\text{combinations} = 3 \text{ temperatures} \times 2 \text{ times} = 6$$

**How many trainings?** Each combination is tested with `cv` rounds. With 5 folds: 6 × 5 = **30** trainings.

**Who wins?** The combination with the best average. These are the real grades of a KNN with four values of `k` (the program further down calculates them):

| `k` | 1 | 3 | 5 | 7 |
|---|---|---|---|---|
| Average of 5 rounds | 0.8 | **0.9** | 0.9 | 0.5 |

`k = 3` wins. It ties with `k = 5`, but the first one to reach the best grade stays.

??? info "For the curious 🤓"
    If knob $i$ has $|G_i|$ options, there are $\prod_i |G_i|$ combinations and the total cost is $\prod_i |G_i| \times k \times T$, where $k$ is the number of folds and $T$ the time of one training. Each new knob **multiplies** the work: with 4 knobs of 5 options there are already 625 combinations. With `"mse"` the **lowest** grade wins; with `"accuracy"` and `"r2"`, the highest.

### How it is built inside { #gridsearchcv-inside }

The `GridSearchCV` class stores a grid (`param_grid`), the folds, the grading method and the seed. Its `fit(model, X, y)`:

1. Checks that the model is not trained.
2. Builds the list of every combination in the grid.
3. For each combination it runs cross-validation (copies of the model with those settings) and stores the average in `cv_results_`.
4. Keeps the best average (`best_score_`) and its settings (`best_params_`).
5. Puts those settings on your model, **without training it**.

!!! warning "Current KAFE limit: the grid is empty"
    The `machine.grid_search_cv(...)` function **has no parameter for giving it the grid** yet. It always creates the search with an empty grid, so it evaluates **a single combination**: the model exactly as you created it. That is why `best_params_` is `{}`. In practice, today it does the same as `cross_val_score`. To really search, use the loop in [the grid by hand](#gridsearchcv-by-hand).

### `machine.grid_search_cv(cv, scoring, random_state)` { #grid_search_cv }

**What it does:** Creates a grid search. Today, with the empty grid, it grades the model with cross-validation.

**When to use it:** To understand the idea. To really choose settings, use the loop further down.

| Parameter | Type | What it means |
|---|---|---|
| `cv` | `INT` | How many folds (at least 2). If you leave it out it is `5`. |
| `scoring` | `STR` | `"accuracy"`, `"r2"` or `"mse"`. If you leave it out it is `"accuracy"`. |
| `random_state` | `INT` | The seed for the folds. `0` means "different every time". |

**Returns:** `MACHINE`: the search, with no results yet.

### `search.fit(model, X, y)` { #gridsearchcv-fit }

**What it does:** Evaluates each combination of the grid with cross-validation.

| Parameter | Type | What it means |
|---|---|---|
| `model` | `MACHINE` | An **untrained** model. |
| `X` | `List[List[FLOAT]]` | The data table. |
| `y` | `List[INT]` or `List[FLOAT]` | The answers. |

**Returns:** The same search, now with results. The model you passed stays **untrained**.

### What the search stores { #gridsearchcv-properties }

| Property | Type | What it stores |
|---|---|---|
| `search.best_score_` | `FLOAT` | The best average grade. |
| `search.cv_results_` | `List[FLOAT]` | The average grade of each combination tried. |
| `search.n_splits_` | `INT` | The folds used. |
| `search.cv`, `search.scoring`, `search.random_state` | `INT`, `STR`, `INT` | What you asked for when creating it. |
| `search.best_params_` | Internal value | The best settings. Today it is always `{}`. You can display it with `show`, but KAFE has no type for storing it in a variable. |
| `search.param_grid` | Internal value | The grid. Today it is always empty. |

The search has **no** `predict` and no "best model already trained". To predict, train the model yourself with the winning settings.

**Example:** The same ten fruits as before:

```kafe
--8<-- "tests/DocsExamples/machine/grid_search_cv.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/grid_search_cv.expec"
```

!!! tip "What happened here?"
    1. `best_params_` is `{}`: there were no knobs to turn.
    2. A single combination was tried, so `cv_results_` has a single grade: `[0.9]`.
    3. That grade is the same `0.9` that `cross_val_score` gave with the same seed.

### The grid by hand { #gridsearchcv-by-hand }

A grid is, deep down, a **loop**. This program tries `k = 1, 3, 5, 7`, grades each one with cross-validation and keeps the best:

```kafe
--8<-- "tests/DocsExamples/machine/grid_search_cv-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/grid_search_cv-by-hand.expec"
```

!!! tip "What happened here?"
    1. The four grades are the ones in the table: `0.8`, `0.9`, `0.9` and `0.5`.
    2. With `k = 7` the model looks at too many neighbors and gets confused: it is too simple for this data.
    3. The winner is `3`. Now you can create `machine.knn(3)`, train it with all the data and use it.

With two knobs you would put one loop inside another: that is the full grid.

**Common mistakes:** Passing an already trained model gives `Cross-validation requires an unfitted model`, just like in [`cross_val_score`](#cross_val_score). A `cv` below 2 gives `GridSearchCV: cv must be greater than 1`. Empty data or data of different sizes also fails.

!!! tip "What did you learn?"
    - Hyperparameters are the knobs you choose before training.
    - They are chosen with cross-validation, never with the training grade.
    - In KAFE, today the grid is written as a loop over `cross_val_score`.

## RandomizedSearchCV: trying settings by a draw { #randomizedsearchcv }

### The idea in one sentence

When there are too many combinations to try them all, a few are **drawn at random** and the best of those is chosen.

### An everyday comparison

An ice cream shop has 100 flavors. Tasting them all would take the whole day. Instead, you ask for **10 random spoonfuls**. You may not find the very best flavor, but you will almost surely find a very good one, and you are done in ten minutes.

<!-- figura pendiente: rejilla grande de casillas; solo algunas, elegidas al azar, se iluminan con su nota -->

### The math with small numbers { #randomizedsearchcv-math }

Suppose three knobs with 10 options each:

- **Full grid:** 10 × 10 × 10 = **1000** combinations. With 5 folds: **5000** trainings.
- **Draw with `n_iter = 20`:** 20 combinations. With 5 folds: 20 × 5 = **100** trainings.

The draw costs what **you decide** (`n_iter`), no matter how many knobs there are.

??? info "For the curious 🤓"
    The cost is $n_{iter} \times k \times T$. How likely is it to find something good? If 5% of the combinations are "very good", the probability that **none** of 20 draws lands there is $0.95^{20} \approx 0.36$. So with 20 tries there is a 64% chance of hitting one of the best; with 60 tries, 95%. The grid guarantees finding the best one **in the grid**; the draw guarantees nothing, but it usually gets close with much less work.

### How it is built inside { #randomizedsearchcv-inside }

The `RandomizedSearchCV` class looks a lot like `GridSearchCV`. It stores the options of each knob (`param_distributions`) and how many draws to make (`n_iter`). Its `fit(model, X, y)` repeats `n_iter` times:

1. Draws a value for each knob.
2. Grades that combination with cross-validation and stores the average in `cv_results_`.
3. If it is the best so far, remembers it in `best_score_` and `best_params_`.

!!! warning "Current KAFE limit: there is nothing to draw"
    As with the grid, `machine.randomized_search_cv(...)` **has no parameter for giving it the options**. It creates them empty, so the `n_iter` tries evaluate **the same** configuration and get the same grade. `best_params_` is `{}`.

### `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` { #randomized_search_cv }

**What it does:** Creates a random search. Today, with no options to draw, it repeats the same cross-validation `n_iter` times.

**When to use it:** To understand the idea. To really search, use a loop like the one in [the grid by hand](#gridsearchcv-by-hand) with fewer options.

| Parameter | Type | What it means |
|---|---|---|
| `n_iter` | `INT` | How many combinations to draw (at least 1). If you leave it out it is `10`. |
| `cv` | `INT` | How many folds (at least 2). If you leave it out it is `5`. |
| `scoring` | `STR` | `"accuracy"`, `"r2"` or `"mse"`. If you leave it out it is `"accuracy"`. |
| `random_state` | `INT` | The seed. `0` means "different every time". |

Watch the order: here `n_iter` goes **first**, before `cv`.

**Returns:** `MACHINE`: the search, with no results yet.

### `search.fit(model, X, y)` { #randomizedsearchcv-fit }

**What it does:** Makes the `n_iter` draws and grades each one with cross-validation.

| Parameter | Type | What it means |
|---|---|---|
| `model` | `MACHINE` | An **untrained** model. |
| `X` | `List[List[FLOAT]]` | The data table. |
| `y` | `List[INT]` or `List[FLOAT]` | The answers. |

**Returns:** The same search, now with results. The model stays **untrained**.

### What the search stores { #randomizedsearchcv-properties }

| Property | Type | What it stores |
|---|---|---|
| `search.best_score_` | `FLOAT` | The best average grade. |
| `search.cv_results_` | `List[FLOAT]` | The average grade of each draw. |
| `search.n_iter_` | `INT` | The draws made. |
| `search.n_splits_` | `INT` | The folds used. |
| `search.n_iter`, `search.cv`, `search.scoring`, `search.random_state` | `INT`, `INT`, `STR`, `INT` | What you asked for when creating it. |
| `search.best_params_` | Internal value | The best settings. Today it is always `{}`. |
| `search.param_distributions` | Internal value | The options of each knob. Today it is always empty. |

It has no `predict` and no trained winning model either.

**Example:** Three "draws" with the ten fruits:

```kafe
--8<-- "tests/DocsExamples/machine/randomized_search_cv.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/randomized_search_cv.expec"
```

!!! tip "What happened here?"
    1. `cv_results_` has `3` grades, one per draw.
    2. All three are `0.9`: since there were no knobs, the three tries tested the same thing.
    3. `best_params_` is `{}`.

**Common mistakes:** An `n_iter` of `0` gives `RandomizedSearchCV: n_iter must be positive`. A `cv` below 2 gives `RandomizedSearchCV: cv must be greater than 1`. An already trained model gives `Cross-validation requires an unfitted model`.

### Grid or draw { #randomizedsearchcv-tradeoffs }

| | Grid (`GridSearchCV`) | Draw (`RandomizedSearchCV`) |
|---|---|---|
| What it tries | Every combination | `n_iter` random combinations |
| Cost | Grows with each knob | You decide |
| Finds the best? | Yes, within the grid | Not always, but usually gets close |
| Works best with | Few knobs and few options | Many knobs |
| In KAFE today | Empty grid: one combination | Empty options: the same combination `n_iter` times |

!!! tip "What did you learn?"
    - The draw tries only some combinations, and you decide how many.
    - It costs `n_iter × cv` trainings, however many knobs there are.
    - In KAFE, today both searches evaluate the model exactly as you created it.

## Pipeline: an assembly line { #pipeline }

### The idea in one sentence

A **pipeline** joins several steps, one after another, so they behave like **a single model**.

### An everyday comparison

In a juice factory, fruit goes through stations in a row: first it is **washed**, then **squeezed**, and finally **bottled**. You only put the fruit in at the start and pick up the bottle at the end. Nobody has to carry the fruit from one station to the next.

In MACHINE there are almost always two stations:

1. **Preparing the data**, for example with [`standard_scaler`](preprocessing.md), which puts every column on the same scale.
2. **The model**, which learns from the prepared data.

<!-- figura pendiente: una fila de datos entra por la izquierda, pasa por la caja "scale", luego por la caja "model" y sale una predicción -->

### Why not do it step by step? { #pipeline-leakage }

You can do it by hand, but there is a trap that is easy to step on. The scaler also **learns** things from the data (the average and the spread of each column). If you let it learn from **all** the data, including the exam data, the model gets a hint about the exam before taking it. That is called **data leakage**.

The pipeline avoids it on its own: in `fit`, each step learns **only** from what you gave `fit`. In `predict`, the preparation steps only **apply** what they learned; they do not learn again.

### The math with small numbers { #pipeline-math }

Let's follow one column down the assembly line. Five houses measure 50, 80, 100, 120 and 150 m².

**Station 1: scaling.** The scaler calculates two numbers and then transforms each value:

$$z = \frac{x - \text{average}}{\text{spread}}$$

1. Average: (50 + 80 + 100 + 120 + 150) ÷ 5 = **100**.
2. Distances to the average: −50, −20, 0, 20, 50. Squared: 2500, 400, 0, 400, 2500. Sum: 5800.
3. Spread: √(5800 ÷ 5) = √1160 ≈ **34.06**.
4. The first house becomes (50 − 100) ÷ 34.06 ≈ **−1.47**.

That −1.47 means "this house is 1.47 steps below the average".

**Station 2: the model.** It receives −1.47 (not 50) and learns from that. When a new 90 m² house arrives, the line will use **the same** average and the same spread: (90 − 100) ÷ 34.06 ≈ −0.29, and that is what the model will see.

??? info "For the curious 🤓"
    If the preparation steps are $T_1, \dots, T_n$ and the model is $M$:

    - **Training:** $X_1 = T_1.\text{fit\_transform}(X)$, $X_2 = T_2.\text{fit\_transform}(X_1)$, …, and finally $M.\text{fit}(X_n, y)$.
    - **Predicting:** $X_1 = T_1.\text{transform}(X)$, …, and finally $M.\text{predict}(X_n)$.

    The difference is a single word: training uses `fit_transform` (learn and apply); predicting uses only `transform` (apply).

### How it is built inside { #pipeline-inside }

The `Pipeline` class stores the list of `(name, step)` pairs you gave it. Before training, its `steps_` and `named_steps_` are empty.

`fit(X, y)`:

1. Makes a copy of `X` so your data is not changed.
2. Goes through the steps in order. If the step is **not the last one**, it trains it and transforms the data (`fit_transform`); the result goes on to the next step.
3. If it is **the last one**, it trains it with the already transformed data and with `y`.
4. Records each trained step in `steps_` and `named_steps_`.

`predict(X)` goes through the same steps: the middle ones do `transform` and the last one does `predict`. `transform(X)` does the same but stops **before** the last step.

### Creating the pipeline: `machine.pipeline(name1, step1, name2, step2, ...)` { #pipeline-create }

**What it does:** Creates an assembly line with the steps you give it, in that order.

**When to use it:** When your model needs prepared data and you want the preparation and the model to always travel together.

| Parameter | Type | What it means |
|---|---|---|
| `name1`, `name2`, … | `STR` | The name you give each step. You choose it. |
| `step1`, `step2`, … | `MACHINE` | The step: a transformer or, at the end, a model. |

They are written **in pairs**: name, step, name, step. At least one pair. Every step except the last must know how to transform (`fit_transform`, or `fit` and `transform`). The last must be a model with `fit(X, y)` and `predict`.

**Returns:** `MACHINE`: the pipeline, not trained yet.

### `pipe.fit(X, y)` { #pipeline-fit }

**What it does:** Trains every step, in order.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` | The data table, unprepared. |
| `y` | `List[FLOAT]` or `List[INT]` | The answers. |

**Returns:** The same pipeline, now trained.

### `pipe.predict(X)` { #pipeline-predict }

**What it does:** Prepares the new data with the already trained steps and asks the final model.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` | New data, **unprepared**: the pipeline prepares it. |

**Returns:** A list with one prediction per row.

### `pipe.score(X, y)` { #pipeline-score }

**What it does:** Prepares the data and asks the final model to grade itself.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` | The data, unprepared. |
| `y` | `List[FLOAT]` or `List[INT]` | The right answers. |
| `metric` | `FUNC` | Optional. A function `(y_true, y_pred)` that returns a `FLOAT`, to grade in a different way. |

**Returns:** `FLOAT`: the final model's grade ($R^2$ for regression, right answers for classification).

### `pipe.transform(X)` { #pipeline-transform }

**What it does:** Applies only the preparation steps, **without** the final model. Useful for seeing how the data reaches the model.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` | The data to prepare. |

**Returns:** `List[List[FLOAT]]`: the prepared data.

### `pipe.fit_transform(X, y)` { #pipeline-fit_transform }

**What it does:** Trains the whole pipeline and returns the prepared data. It is `fit` followed by `transform`.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` | The data table. |
| `y` | `List[FLOAT]` or `List[INT]` | The answers. |

**Returns:** `List[List[FLOAT]]`: the prepared data. It does **not** return predictions.

### `pipe.get_params()` { #pipeline-get_params }

**What it does:** Tells you the names of the steps, in order.

It takes no parameters.

**Returns:** `List[STR]`: the names. (It does not return each step's settings.)

### What the pipeline stores { #pipeline-properties }

| Property | Type | What it stores |
|---|---|---|
| `pipe.named_steps_` | Internal value | The trained steps, by name. |
| `pipe.steps_` | Internal value | The (name, step) pairs, already trained. |
| `pipe.steps` | Internal value | The pairs exactly as you gave them when creating it. |

These three are **limited**: KAFE has no type for storing them in a variable or for measuring them (`len(pipe.steps_)` fails). To find out which steps there are, use `pipe.get_params()`.

**Example:** Five houses with their size in m² and their number of rooms, and their price:

```kafe
--8<-- "tests/DocsExamples/machine/pipeline.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/pipeline.expec"
```

!!! tip "What happened here?"
    1. `machine.pipeline("scale", ..., "model", ...)` built the line: first scale, then a [linear regression](linear.md#linearregression).
    2. `pipe.fit(houses, price)` trained the scaler, scaled the houses and trained the regression with the scaled houses.
    3. `get_params()` shows the names: `['scale', 'model']`.
    4. `predict([[90.0, 2.0]])` received an **unscaled** house. The pipeline scaled it and the regression answered `200.0`.
    5. `score` gives `1.0`: the prices followed an exact rule (2 × m² + 10 × rooms).
    6. `transform` shows how the model saw the first house: `-1.47` (the number we worked out by hand) and `-1.57` for the rooms.

**Common mistakes:**

??? warning "Predicting before training"
    A freshly created pipeline has learned nothing:

    ```kafe
    --8<-- "tests/DocsExamples/machine/pipeline-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/pipeline-not-fitted.error.stderr.expec"
    ```

Other errors: writing a name without its step (`pipeline: requires an even number of arguments (name, step pairs)`), giving no pair at all, or calling `fit` with empty data or data of different sizes.

### Strengths and limits { #pipeline-tradeoffs }

| 👍 Strengths | 👎 Limits |
|---|---|
| Avoids data leakage: the preparation learns only from what `fit` sees. | The last step must be a model with answers (`fit(X, y)`). |
| One call to `fit` and one to `predict`, instead of several. | `steps_` and `named_steps_` cannot be walked through from KAFE. |
| You never forget to prepare new data. | `get_params()` gives only the names, not the settings. |

!!! note "Pipeline and cross-validation"
    An **untrained** pipeline can be passed to [`cross_val_score`](#cross_val_score) as if it were a model. That way, in each round the scaler learns only from that round's study examples.

!!! tip "What did you learn?"
    - A pipeline is an assembly line: prepare → model.
    - When training, each step learns and applies; when predicting, it only applies.
    - You give it unprepared data and it takes care of the rest.

## What did you learn?

- A model is tested with data it **did not see**: `train_test_split` sets it aside, and the stratified version keeps the proportion of each class.
- **Cross-validation** runs several exams and averages them: `k_fold` hands out the turns and `cross_val_score` trains and grades.
- **Hyperparameters** are chosen by comparing cross-validation grades, not training grades. In KAFE, today that is done with a loop.
- A **pipeline** joins the preparation and the model so they are never separated.

[Next: functions and metrics :material-arrow-right:](metrics.md){ .md-button .md-button--primary }
[Back to MACHINE](../machine.md){ .md-button }
