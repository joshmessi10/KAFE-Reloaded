# MACHINE: machines that learn from examples

The **MACHINE** library holds the classic *Machine Learning* algorithms: models that **learn from examples** instead of following rules you write. It is inspired by *scikit-learn*, the most widely used Python library, but every algorithm is written from scratch inside KAFE so you can see how it works.

If you have never heard of learning from data, read the lesson [What is learning from data?](../aprende/aprender-de-datos.md) first.

## The idea: teach, then ask { #idea }

In a normal program, you write the rule ("if it weighs more than 100 g, it is an apple"). With MACHINE you do the opposite: you give it **examples with their answer** and the model discovers the rule.

Every model works in two moments:

- **`fit` (teach):** the model looks at the examples and stores what it learned. It is like studying with solved exercises.
- **`predict` (ask):** you give it new data, with no answer, and the model answers using what it learned. It is like the exam.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-fit-predict.svg"
<figcaption>With `fit`, the examples (question and answer) go into the model and it stores some numbers: what it learned. With `predict`, a new question goes in and the answer comes out.</figcaption>
</figure>

## Your first model { #first-model }

We have six fruits. For each one we know its **weight** in grams and its **diameter** in centimeters, and whether it is an apple (`0`) or a grape (`1`):

```kafe
--8<-- "tests/DocsExamples/machine/overview-first-model.kf"
```

```text
--8<-- "tests/DocsExamples/machine/overview-first-model.expec"
```

!!! tip "What happened here?"
    1. `import machine;` brought in the library.
    2. `machine.knn(3)` created an empty model. Its type in KAFE is `MACHINE`.
    3. `model.fit(fruits, kind)` taught it the six fruits with their answer.
    4. `model.predict(...)` asked about two new fruits: one of 155 g (it answered `0`, apple) and one of 22 g (it answered `1`, grape).
    5. `model.score(...)` graded it: `1.0` means it got them all right.

## The words you will see { #words }

| Word | What it means |
|---|---|
| **Example** (or sample) | One row of data: one fruit, one house, one student. |
| **Feature** | One thing you know about each example: the weight, the size. It is a column. |
| `X` | The table with the features: one row per example. |
| `y` | The list with the correct answer for each example. |
| **Regression** | Predicting **a number**: a price, a grade. |
| **Classification** | Predicting **a group**: apple or grape, yes or no. |
| **Clustering** | Finding groups when **nobody gave you the answers**. |
| **Training** | What `fit` does: learning from the examples. |

## Three families, three ways to use them { #families }

| Family | What it does | How you use it |
|---|---|---|
| **Models with answers** (regression and classification) | They learn from examples that come with the answer. | `fit(X, y)` → `predict(X)` → `score(X, y)` |
| **Models without answers** (clustering) | They look for groups on their own. | `fit(X)` → `predict(X)` or `fit_predict(X)` |
| **Transformers** (preparing data) | They change the data so the model learns better. | `fit(X)` → `transform(X)` or `fit_transform(X)` |

## How it works inside { #inside }

MACHINE lives in the `src/lib/KafeMACHINE/` folder. There is no magic: these are Python classes with loops and sums.

| File or folder | What it holds |
|---|---|
| `functions.py` | The functions you call with `machine.`: one per model (`linear_regression`, `knn`, `kmeans`…). Each one only **creates** the model and gives it back to you. |
| `BaseMachine.py` | The `BaseMachine` class, the "mold" every model comes from. |
| `linear/`, `tree/`, `neighbors/`, `clustering/`… | One folder per family, with one file per algorithm. |
| `metrics.py` | The functions that grade: `accuracy_score`, `r2_score`… |

This is what happens when you write `model.fit(X, y)`:

1. **The interpreter finds the method.** `model` holds a Python object (for example, a `KNN`). KAFE looks inside that object for a method called `fit`.
2. **A "doorkeeper" checks the types.** Before any calculation, it checks that `X` is a list or a table of numbers and that `y` is a list. If not, it stops with a message.
3. **The model checks the shape of the data.** If you gave it a plain list, it turns it into a one-column table. It checks that every row is the same length.
4. **The algorithm learns** and stores the result inside the object, in properties that end with an underscore, like `coef_` or `cluster_centers_`.
5. **It is marked as trained.** Every model has an internal switch. `fit` turns it on.

When you later call `predict`, the first thing the model does is look at that switch. If it is off, it answers `Must call fit before predict`.

!!! note "The underscore at the end"
    The properties the model **learned** end in `_` (`coef_`, `intercept_`, `labels_`). That is how you tell them apart from the settings you chose when creating it. You read them without parentheses: `model.coef_`.

??? info "For the curious 🤓"
    `BaseMachine` gives every model three things: the `_is_fitted` switch, a function that takes the data out of a `PARDOS` table and one that validates the shape of the matrix. If you call a method the model doesn't have (for example `transform` on a regression), the mold answers `does not support transform()`.

## Library map { #map }

| Page | What you learn |
|---|---|
| [Linear models and SVM](machine/linear.md) | Lines to predict numbers and to separate groups. |
| [Classification and trees](machine/classifiers.md) | Nearest neighbors, decision trees, forests and more. |
| [Clustering and ensembles](machine/clustering.md) | Finding groups without answers, and joining many weak models into a strong one. |
| [Preprocessing and reduction](machine/preprocessing.md) | Preparing the data: scaling, filling gaps, turning text into numbers. |
| [Model selection](machine/selection.md) | Setting data aside for the exam, trying several settings and chaining steps. |
| [Functions and metrics](machine/metrics.md) | Grading a model. |

For those who need the exact technical detail: [API contracts and limits](machine/contracts.md) and [learning concepts](machine/learning-concepts.md). There are also [complete examples by algorithm](../ejemplos/machine-kaggle.md).

## Common mistakes { #errors }

??? warning "Forgetting the `import`"
    ```kafe
    --8<-- "tests/DocsExamples/machine/overview-no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/overview-no-import.error.stderr.expec"
    ```

??? warning "Asking a model for something it cannot do"
    A regression predicts; it does not transform data:

    ```kafe
    --8<-- "tests/DocsExamples/machine/overview-unknown-method.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/overview-unknown-method.error.stderr.expec"
    ```

!!! note "Arguments go in order"
    In KAFE, arguments are written **in order and without a name**: `machine.knn(3)`, not `machine.knn(k=3)`.

## What did you learn?

- A MACHINE model learns from examples with `fit` and answers with `predict`.
- `X` is the table of features and `y` is the list of answers.
- Inside, each model is a class that stores what it learned in properties ending in `_`.

[Start: the line that fits best :material-arrow-right:](machine/linear.md){ .md-button .md-button--primary }
[Next library: GESHA :material-arrow-right:](gesha.md){ .md-button }
