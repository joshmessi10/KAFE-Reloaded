# MACHINE: functions and metrics

A **metric** is a **grade** for your model: one number that says how well it answered. To compute it you compare two lists: the **right answers** (`y_true`) and the **model's answers** (`y_pred`).

This page has every metric in MACHINE. They are **functions**, not models: they have no `fit` or `predict`. You give them the two lists and they give you the grade.

| Group | What it is for |
|---|---|
| [Classification metrics](#classification-metrics) | Grading a model that picks a **label** (spam or not spam). |
| [Regression metrics](#regression-metrics) | Grading a model that predicts a **number** (a price, a grade). |
| [Clustering metric](#clustering-metrics) | Grading **groups** when there are no right answers. |
| [The same metrics for GESHA](#one-metric-api-for-machine-and-gesha) | Using these functions with neural networks. |
| [Which metric do I use?](#which-metric) | A table to choose quickly. |

!!! tip "Before you start"
    If you do not know what `fit` and `predict` are yet, first read [how MACHINE works](../machine.md).

## All the functions at a glance { #main-functions }

All of them are called with `machine.` in front and take their arguments **in order**.

| Function | Returns | In one sentence |
|---|---|---|
| [`accuracy_score(y_true, y_pred)`](#accuracy_score) | `FLOAT` | What share of the answers it got right. |
| [`precision_score(y_true, y_pred)`](#precision_score) | `FLOAT` | When the model says "it is this class", how often is it right? |
| [`recall_score(y_true, y_pred)`](#recall_score) | `FLOAT` | Of the ones that really were that class, how many did it find? |
| [`f1_score(y_true, y_pred)`](#f1_score) | `FLOAT` | One grade that mixes precision and recall. |
| [`confusion_matrix(y_true, y_pred)`](#confusion_matrix) | `List[List[INT]]` | The table of hits and mix-ups. |
| [`classification_report(y_true, y_pred)`](#classification_report) | `STR` | A report with all of the above. |
| [`roc_auc_score(y_true, y_score)`](#roc_auc_score) | `FLOAT` | How well the model ranks: positives on top, negatives below. |
| [`mean_absolute_error(y_true, y_pred)`](#mean_absolute_error) | `FLOAT` | The average error. |
| [`mean_squared_error(y_true, y_pred)`](#mean_squared_error) | `FLOAT` | The average of the squared errors. |
| [`root_mean_squared_error(y_true, y_pred)`](#root_mean_squared_error) | `FLOAT` | The square root of the previous one. |
| [`max_error(y_true, y_pred)`](#max_error) | `FLOAT` | The worst error. |
| [`median_absolute_error(y_true, y_pred)`](#median_absolute_error) | `FLOAT` | The error "in the middle". |
| [`mean_absolute_percentage_error(y_true, y_pred)`](#mean_absolute_percentage_error) | `FLOAT` | The average error as a percentage. |
| [`r2_score(y_true, y_pred)`](#r2_score) | `FLOAT` | How much better the model is than always saying the average. |
| [`explained_variance_score(y_true, y_pred)`](#explained_variance_score) | `FLOAT` | Like $R^2$, but it forgives a constant error. |
| [`silhouette_score(X, labels)`](#silhouette_score) | `FLOAT` | How well separated the groups are. |

The functions that **create models** (`machine.knn`, `machine.linear_regression`…) live on each model's page. Start at the [MACHINE landing page](../machine.md).

## Classification metrics { #classification-metrics }

### The idea in one sentence

A classification model can be wrong in **two different ways**, and classification metrics count how many times each one happened.

### An everyday comparison

Think of a **spam filter** (junk mail). It looks at each email and decides: "it is spam" (`1`) or "it is normal" (`0`). Four things can happen:

| | The filter said **spam** | The filter said **normal** |
|---|---|---|
| **It was spam** | ✅ Right. This is a **true positive** (TP). | ❌ A spam got through. **False negative** (FN). |
| **It was normal** | ❌ A good email went to the junk folder. **False positive** (FP). | ✅ Right. **True negative** (TN). |

"Positive" means the filter said "yes, it is spam". "True" or "false" says whether it was right.

The two mistakes **do not hurt the same**. A false negative is a nuisance: you see one spam in your inbox. A false positive can be serious: you lose an important email. That is why a single grade is not enough.

<!-- figura pendiente: 10 emails drop one by one into the 4 cells of the confusion matrix (TN 4, FP 2, FN 1, TP 3); then the "said spam" column is highlighted (precision 3/5) and the "was spam" row (recall 3/4) -->

### Your first confusion matrix { #classification-first }

**10 emails** arrived. Four were spam and six were normal. `real` is the truth and `guess` is what the filter said:

```kafe
--8<-- "tests/DocsExamples/machine/confusion_matrix.kf"
```

```text
--8<-- "tests/DocsExamples/machine/confusion_matrix.expec"
```

!!! tip "What happened here?"
    1. `machine.confusion_matrix(real, guess)` compared the two lists, email by email.
    2. It returned a table. Each **row** is what the email **was**; each **column** is what the filter **said**. Classes go in order: first `0`, then `1`.
    3. Row `[4, 2]`: of the 6 normal emails, 4 were fine (TN) and 2 went to junk by mistake (FP).
    4. Row `[1, 3]`: of the 4 spam emails, 1 got through (FN) and 3 were caught (TP).
    5. The hits are on the **diagonal**: 4 and 3.

This table is called a **confusion matrix** because it shows what the model confuses each class with.

### The math with small numbers { #classification-math }

Every classification metric comes from those four numbers. We will always use the same table:

| | Said spam | Said normal | Total |
|---|---|---|---|
| **Was spam** | TP = 3 | FN = 1 | 4 |
| **Was normal** | FP = 2 | TN = 4 | 6 |

**Accuracy:** of all the emails, what share did it get right?

$$\text{accuracy} = \frac{\text{hits}}{\text{total}} = \frac{3 + 4}{10} = 0.7$$

**Precision:** when the filter said "spam", how often was it right? It said "spam" 5 times (3 + 2) and was right 3 times.

$$\text{precision} = \frac{TP}{TP + FP} = \frac{3}{3 + 2} = 0.6$$

**Recall (sensitivity):** of the spam that was really there, how much did it catch? There were 4 and it caught 3.

$$\text{recall} = \frac{TP}{TP + FN} = \frac{3}{3 + 1} = 0.75$$

**F1:** one grade that mixes the previous two. It is only high when **both** are high.

$$F1 = \frac{2 \times \text{precision} \times \text{recall}}{\text{precision} + \text{recall}} = \frac{2 \times 0.6 \times 0.75}{0.6 + 0.75} = \frac{0.9}{1.35} \approx 0.667$$

This program counts the four cases with a loop and computes the first three grades, **without MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/confusion_matrix-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/confusion_matrix-by-hand.expec"
```

The first four lines are TP, FP, FN and TN. The last three are the accuracy, and the precision and recall for spam.

!!! note "KAFE averages the two classes"
    Above we computed precision, recall and F1 **looking only at spam**. But you can ask the same questions about the **normal** emails. `precision_score`, `recall_score` and `f1_score` compute the grade for **each class** and return the **average**. This is called the *macro* average.

    | Class | Precision | Recall | F1 |
    |---|---|---|---|
    | Normal (`0`) | 4 ÷ (4 + 1) = 0.8 | 4 ÷ (4 + 2) ≈ 0.667 | ≈ 0.727 |
    | Spam (`1`) | 3 ÷ (3 + 2) = 0.6 | 3 ÷ (3 + 1) = 0.75 | ≈ 0.667 |
    | **Average (what KAFE returns)** | **0.7** | **≈ 0.708** | **≈ 0.697** |

    You can see each class's grades separately with [`classification_report`](#classification_report).

??? info "For the curious 🤓"
    For a class $c$, with its counts $TP_c$, $FP_c$ and $FN_c$:

    $$P_c = \frac{TP_c}{TP_c + FP_c} \qquad R_c = \frac{TP_c}{TP_c + FN_c} \qquad F1_c = \frac{2\,P_c\,R_c}{P_c + R_c}$$

    If a denominator is 0, KAFE uses 0 for that grade. The macro average over the $K$ classes that appear in `y_true` is $\frac{1}{K}\sum_c P_c$ (the same for recall and F1). F1 is the **harmonic mean** of precision and recall: it punishes either one being low. All these functions walk the lists once per class: they cost about $n \cdot K$ operations.

### `machine.accuracy_score(y_true, y_pred)` { #accuracy_score }

**What it does:** Computes accuracy: the share of answers the model got right.

**When to use it:** As a first grade, when the classes are **balanced** (about the same number of each).

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said, in the same order. |

**Returns:** `FLOAT` between 0 and 1. `1.0` means everything right. Multiply by 100 if you want a percentage.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/accuracy_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/accuracy_score.expec"
```

!!! warning "Accuracy can fool you"
    If only 2 of 100 emails are spam, a filter that **never** says "spam" gets 98 of 100 right: accuracy 0.98. And it caught none. With unbalanced classes, look at precision and recall too.

??? warning "Common mistake: lists of different sizes"
    The two lists must have the same length. This error is the same in every metric:

    ```kafe
    --8<-- "tests/DocsExamples/machine/accuracy_score-length.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/accuracy_score-length.error.stderr.expec"
    ```

### `machine.confusion_matrix(y_true, y_pred)` { #confusion_matrix }

**What it does:** Builds the table that counts how many times each real class got each answer.

**When to use it:** When you want to see **where** the model goes wrong, not only how much.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said. |

**Returns:** `List[List[INT]]`: a square table. The row is the real class and the column is the class the model said. Classes are sorted from smallest to largest. With two classes `0` and `1` it is `[[TN, FP], [FN, TP]]`. It also works with three classes or more.

**Example and result:** the one in [Your first confusion matrix](#classification-first).

### `machine.precision_score(y_true, y_pred)` { #precision_score }

**What it does:** Computes the precision of each class and returns the average.

**When to use it:** When a **false alarm** is expensive. For example, sending an important email to junk.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said. |

**Returns:** `FLOAT` between 0 and 1: the average precision over all classes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/precision_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/precision_score.expec"
```

It is the average of 0.8 (normal) and 0.6 (spam). Matching the accuracy is a coincidence.

### `machine.recall_score(y_true, y_pred)` { #recall_score }

**What it does:** Computes the recall of each class and returns the average.

**When to use it:** When **missing** a case is expensive. For example, a medical test that fails to detect a sick person.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said. |

**Returns:** `FLOAT` between 0 and 1: the average recall over all classes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/recall_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/recall_score.expec"
```

It is the average of 0.667 (normal) and 0.75 (spam).

### `machine.f1_score(y_true, y_pred)` { #f1_score }

**What it does:** Computes the F1 of each class and returns the average.

**When to use it:** When you want **a single grade** and the classes are unbalanced.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said. |

**Returns:** `FLOAT` between 0 and 1: the average F1 over all classes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/f1_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/f1_score.expec"
```

It is the average of 0.727 (normal) and 0.667 (spam).

### `machine.classification_report(y_true, y_pred)` { #classification_report }

**What it does:** Writes a report with the precision, recall and F1 of **each class**, plus the averages.

**When to use it:** When you want to see all the grades together, class by class.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. |
| `y_pred` | `List[INT]` or `List[FLOAT]` | The labels the model said. |

**Returns:** `STR`: a text with several lines, ready for `show`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/classification_report.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/classification_report.expec"
```

!!! tip "How to read the report"
    - There is one row per class (`0` and `1`). They are the same numbers we computed by hand.
    - `support` is how many examples of that class there were: 6 normal and 4 spam.
    - `macro avg` is the plain average of the classes: what `precision_score`, `recall_score` and `f1_score` return.
    - `weighted avg` is an average where the class with more examples counts more.

### `machine.roc_auc_score(y_true, y_score)` { #roc_auc_score }

**The idea.** Many models do not answer "spam" or "normal" directly. They give a **score** between 0 and 1: "I am 0.9 sure this is spam". Then someone picks a **threshold** (a cut line): above the line is spam, below is normal.

If you move the line, the mistakes change:

- A **high** line (very strict): almost nothing is spam. Few false alarms, but a lot of spam gets through.
- A **low** line (very suspicious): almost everything is spam. You catch it all, but with many false alarms.

<!-- figura pendiente: 10 dots on a ruler from 0 to 1 (4 filled spam, 6 hollow normal); a vertical line (threshold) slides from 0.95 down to 0.05 and, next to it, a dot draws the ROC curve (false alarms → right, spam caught → up) -->

These are the scores of our 10 emails. The program moves the line through five values. For each one it shows: the line, the share of spam caught, and the share of normal emails that were a false alarm:

```kafe
--8<-- "tests/DocsExamples/machine/roc_auc_score-threshold.kf"
```

```text
--8<-- "tests/DocsExamples/machine/roc_auc_score-threshold.expec"
```

With the line at 0.5 the filter catches 3 of 4 spam (0.75) and raises 2 false alarms out of 6 (0.33): exactly the confusion matrix above. If you plot those pairs on paper (false alarms to the right, spam caught upward) you get the **ROC curve**. The **AUC** is the area under that curve.

**The math by hand.** There is another way to compute the AUC, without drawing anything. Make every **pair** of one spam and one normal email and ask: does the spam have the higher score?

- There are 4 spam and 6 normal: 4 × 6 = **24 pairs**.
- The spam emails with 0.9, 0.8 and 0.7 beat all 6 normal ones: 6 + 6 + 6 = 18.
- The spam with 0.3 only beats the four normal ones with 0.2 and 0.1: 4.
- Pairs won: 18 + 4 = **22**.

$$AUC = \frac{\text{pairs won}}{\text{all pairs}} = \frac{22}{24} \approx 0.917$$

**What it does:** Measures how well the model **ranks** the examples: positives with a high score and negatives with a low score.

**When to use it:** When your model gives scores or probabilities and you want a grade that **does not depend** on where you put the line.

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The right labels. There must be **exactly two** classes. The larger one (for example `1`) is the positive one. |
| `y_score` | `List[FLOAT]` or a table with **one** column | The positive-class score of each example. Do not pass labels that were already decided. |

**Returns:** `FLOAT` between 0 and 1. `1.0` is a perfect ranking; `0.5` is like flipping a coin; below `0.5` is ranking backwards.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/roc_auc_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/roc_auc_score.expec"
```

??? warning "Common mistake: more than two classes"
    `roc_auc_score` only works with two classes:

    ```kafe
    --8<-- "tests/DocsExamples/machine/roc_auc_score-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/roc_auc_score-three-classes.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    The ROC curve plots the true positive rate $TPR = \frac{TP}{TP + FN}$ against the false positive rate $FPR = \frac{FP}{FP + TN}$ for every threshold. KAFE does not draw the curve: it uses the pairs formula (the Mann-Whitney U statistic), which gives the same area:

    $$AUC = \frac{1}{n_+ \, n_-} \sum_{i \in +} \sum_{j \in -} \left[ \mathbb{1}(s_i > s_j) + \tfrac{1}{2}\,\mathbb{1}(s_i = s_j) \right]$$

    A tie counts half a point. It compares every positive with every negative: it costs $n_+ \cdot n_-$ operations.

!!! tip "What did you learn?"
    - The confusion matrix counts hits and the two kinds of mistake: false alarms (FP) and missed cases (FN).
    - Accuracy, precision, recall and F1 all come from that table.
    - The AUC grades the model's scores, without choosing a line.

## Regression metrics { #regression-metrics }

### The idea in one sentence

When a model predicts **numbers**, it is almost never exactly right; regression metrics sum up **how far off** it was.

### An everyday comparison

You play at guessing how many candies are in a jar. If there are 50 and you say 48, you were off by 2. That "how far off was I" is the **error** (also called the *residual*):

$$\text{error} = \text{real value} - \text{prediction}$$

If you play several times you have several errors. Each metric is a different way to **sum them up in one number**.

<!-- figura pendiente: 4 real points (4, 6, 8, 10) and their 4 predictions (3, 7, 6, 10) joined by error bars; the bars drop into a row |e| = 1, 1, 2, 0 and then turn into squares e² = 1, 1, 4, 0 -->

### The math with small numbers { #regression-math }

A lemonade stand sold 4, 6, 8 and 10 cups over four days. A model had predicted 3, 7, 6 and 10. Let's build the table of errors:

| Day | Real $y$ | Prediction $\hat{y}$ | Error $e = y - \hat{y}$ | No sign $\lvert e \rvert$ | Squared $e^2$ | As a percentage $\lvert e \rvert \div y$ |
|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 1 | 1 | 1 | 25 % |
| 2 | 6 | 7 | −1 | 1 | 1 | 16.67 % |
| 3 | 8 | 6 | 2 | 2 | 4 | 25 % |
| 4 | 10 | 10 | 0 | 0 | 0 | 0 % |
| **Sum** | | | **2** | **4** | **6** | **66.67 %** |

**Every** metric comes out of that same table:

| Metric | The sum | Result |
|---|---|---|
| Mean absolute error (MAE) | average of $\lvert e \rvert$: 4 ÷ 4 | **1** cup |
| Mean squared error (MSE) | average of $e^2$: 6 ÷ 4 | **1.5** cups² |
| Root of the MSE (RMSE) | $\sqrt{1.5}$ | **≈ 1.22** cups |
| Max error | the largest $\lvert e \rvert$ | **2** cups |
| Median absolute error | sort 0, 1, 1, 2 and take the middle: (1 + 1) ÷ 2 | **1** cup |
| Mean percentage error (MAPE) | average of the percentages: 66.67 ÷ 4 | **≈ 16.67 %** |
| $R^2$ | 1 − 6 ÷ 20 (explained below) | **0.7** |
| Explained variance | 1 − 1.25 ÷ 5 (explained below) | **0.75** |

!!! note "Why drop the sign or square?"
    If you add the errors as they are, the positive and negative ones **cancel out**: 1 and −1 give 0, as if there were no error. That is why we drop the sign ($\lvert e \rvert$) or square it ($e^2$). Squaring also makes a big error count much more: the error of 2 becomes 4.

**Where does the 20 in $R^2$ come from?** $R^2$ compares your model with the laziest model possible: one that **always says the average**. The average sale is (4 + 6 + 8 + 10) ÷ 4 = 7. The errors of always saying 7 would be −3, −1, 1 and 3; squared they add up to 9 + 1 + 1 + 9 = **20**. Our model's squared errors add up to **6**.

$$R^2 = 1 - \frac{6}{20} = 0.7$$

The model removed 70 % of the error the "average model" would have.

This program computes the errors, the MAE, the MSE and the RMSE with a loop, **without MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error-by-hand.expec"
```

The first four lines are the errors. The last three are the MAE, the MSE and the RMSE: the same numbers as in the table.

??? info "For the curious 🤓"
    With $n$ examples, real values $y_i$, predictions $\hat{y}_i$, errors $e_i = y_i - \hat{y}_i$ and averages $\bar{y}$ and $\bar{e}$:

    $$MAE = \frac{1}{n}\sum_i \lvert e_i \rvert \qquad MSE = \frac{1}{n}\sum_i e_i^2 \qquad RMSE = \sqrt{MSE}$$

    $$\text{max error} = \max_i \lvert e_i \rvert \qquad \text{median error} = \operatorname{median}(\lvert e_i \rvert) \qquad MAPE = \frac{100}{n}\sum_i \frac{\lvert e_i \rvert}{\lvert y_i \rvert}$$

    $$R^2 = 1 - \frac{\sum_i e_i^2}{\sum_i (y_i - \bar{y})^2} \qquad \text{explained variance} = 1 - \frac{\frac{1}{n}\sum_i (e_i - \bar{e})^2}{\frac{1}{n}\sum_i (y_i - \bar{y})^2}$$

    All of them walk the lists once ($n$ operations), except the median error, which sorts first ($n \log n$). If all real values are equal, the denominator is 0: `r2_score` returns `1.0` if the predictions are perfect and `0.0` otherwise; `explained_variance_score` returns `0.0`.

Every regression function takes the same two parameters:

| Parameter | Type | What it means |
|---|---|---|
| `y_true` | `List[INT]` or `List[FLOAT]` | The real values. |
| `y_pred` | `List[INT]`, `List[FLOAT]` or a table with **one** column such as `[[3.0], [7.0]]` | The model's predictions, in the same order. |

In every example, `real` is the lemonade sales and `guess` is the predictions.

### `machine.mean_absolute_error(y_true, y_pred)` { #mean_absolute_error }

**What it does:** Computes the average of the errors without sign (MAE).

**When to use it:** When you want to say in plain words "on average, the model is off by this much".

**Returns:** `FLOAT`, in the **same units** as your data (cups, dollars, degrees). `0.0` is perfect.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_absolute_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/mean_absolute_error.expec"
```

### `machine.mean_squared_error(y_true, y_pred)` { #mean_squared_error }

**What it does:** Computes the average of the squared errors (MSE).

**When to use it:** When one big error is **much worse** than several small ones. It is the grade many models try to lower while they learn.

**Returns:** `FLOAT`, in **squared** units (cups²). `0.0` is perfect.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error.expec"
```

### `machine.root_mean_squared_error(y_true, y_pred)` { #root_mean_squared_error }

**What it does:** Computes the square root of the MSE (RMSE).

**When to use it:** When you want to punish big errors like the MSE does, but read the result in the original units.

**Returns:** `FLOAT`, in the same units as your data. `0.0` is perfect.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/root_mean_squared_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/root_mean_squared_error.expec"
```

The RMSE (1.22) is larger than the MAE (1.0) because the 2-cup error counts more.

### `machine.max_error(y_true, y_pred)` { #max_error }

**What it does:** Returns the largest error, without sign.

**When to use it:** When you care about the **worst case**. For example, "what is the most my scale can be off by?".

**Returns:** `FLOAT`, in the same units as your data.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/max_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/max_error.expec"
```

### `machine.median_absolute_error(y_true, y_pred)` { #median_absolute_error }

**What it does:** Sorts the errors without sign and returns the one **in the middle** (the median). If two are in the middle, it returns their average.

**When to use it:** When your data has a very odd value and you do not want one huge error to ruin the grade.

**Returns:** `FLOAT`, in the same units as your data.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/median_absolute_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/median_absolute_error.expec"
```

### `machine.mean_absolute_percentage_error(y_true, y_pred)` { #mean_absolute_percentage_error }

**What it does:** Computes the average error as a **percentage** of the real value (MAPE).

**When to use it:** When you want to compare errors of things with very different sizes. Being off by 1 cup is a lot if you sold 4 and little if you sold 100.

**Returns:** `FLOAT`: a **percentage** (16.67 means 16.67 %), not a fraction between 0 and 1.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error.expec"
```

??? warning "Common mistake: a real value equal to zero"
    To get the percentage you divide by the real value, and you cannot divide by zero:

    ```kafe
    --8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error-zero.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/mean_absolute_percentage_error-zero.error.stderr.expec"
    ```

    If your data has zeros, use `mean_absolute_error`.

### `machine.r2_score(y_true, y_pred)` { #r2_score }

**What it does:** Compares your model with one that always says the average ($R^2$).

**When to use it:** When you want a grade **without units**, easy to compare across different problems. It is the same grade `model.score(X, y)` gives for regression models.

**Returns:** `FLOAT`. `1.0` is perfect. `0.0` is as good as always saying the average. It can be **negative**: the model is worse than saying the average.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/r2_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/r2_score.expec"
```

### `machine.explained_variance_score(y_true, y_pred)` { #explained_variance_score }

**What it does:** Measures how much of the "ups and downs" of the data the model follows. It is like $R^2$, but it **forgives** a constant error: if the model always falls short by the same amount, it is not punished.

**When to use it:** Together with `r2_score`. If the two grades differ, your model has a **bias**: it tends to fall short or to overshoot.

**Returns:** `FLOAT`. `1.0` is the best.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/explained_variance_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/explained_variance_score.expec"
```

!!! tip "The sum by hand"
    1. The average error is (1 − 1 + 2 + 0) ÷ 4 = **0.5**: the model falls short by half a cup, on average.
    2. Subtract that 0.5 from each error: 0.5, −1.5, 1.5 and −0.5. Squared: 0.25 + 2.25 + 2.25 + 0.25 = 5. The average is 5 ÷ 4 = **1.25**.
    3. The real values are −3, −1, 1 and 3 away from their average (7). Squared they add up to 20; the average is 20 ÷ 4 = **5**.
    4. 1 − 1.25 ÷ 5 = **0.75**.

    It gives 0.75 and not 0.7 (the $R^2$) exactly because of that half cup of bias.

!!! tip "What did you learn?"
    - The error is the real value minus the prediction.
    - MAE, MSE, RMSE, max error and median error are different ways to sum up the same errors.
    - $R^2$ compares your model with always saying the average: 1 is perfect, 0 is the same, negative is worse.

## Clustering metric { #clustering-metrics }

### The idea in one sentence

When a model makes **groups** without anyone telling it the answer, the **silhouette** measures whether each point ended up close to its own group and far from the others.

### An everyday comparison

At recess, children gather in groups. A child is "well placed" if the friends in their group are **close** and the other group is **far**. If the child is the same distance from both groups, it is not clear which one they belong to.

<!-- figura pendiente: 5 houses on a street (positions 1, 2, 3 | 6, 8); from house 2, short arrows go to its own group (a = 1) and long arrows to the other (b = 5); then s = (5 − 1) / 5 = 0.8 appears -->

### The math with small numbers { #clustering-math }

There are five houses on a street, at positions 1, 2, 3, 6 and 8. A [clustering](clustering.md) model made two groups: {1, 2, 3} and {6, 8}. Let's look at the house at **2**:

1. **$a$: how close it is to its own group.** Its neighbors are at 1 and 3. The distances are 1 and 1. Average: $a = 1$.
2. **$b$: how far it is from the other group.** The others are at 6 and 8. The distances are 4 and 6. Average: $b = 5$.
3. **$s$: the silhouette of that house.**

$$s = \frac{b - a}{\max(a, b)} = \frac{5 - 1}{5} = 0.8$$

How to read $s$:

- Close to **1**: the point is in the right group.
- Close to **0**: it is on the border between two groups.
- **Negative**: it is closer to another group than to its own.

This program does that sum for house 2, **without MACHINE**:

```kafe
--8<-- "tests/DocsExamples/machine/silhouette_score-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/silhouette_score-by-hand.expec"
```

`silhouette_score` repeats the sum for **every** house and returns the average:

| House | $a$ | $b$ | $s$ |
|---|---|---|---|
| 1 | 1.5 | 6 | 0.75 |
| 2 | 1 | 5 | 0.8 |
| 3 | 1.5 | 4 | 0.625 |
| 6 | 2 | 4 | 0.5 |
| 8 | 2 | 6 | ≈ 0.667 |
| **Average** | | | **≈ 0.668** |

??? info "For the curious 🤓"
    For each point $i$, $a(i)$ is the average distance to the other points in its group and $b(i)$ is the smallest average distance to the points of another group:

    $$s(i) = \frac{b(i) - a(i)}{\max(a(i),\, b(i))} \qquad \text{silhouette} = \frac{1}{n}\sum_i s(i)$$

    KAFE uses the Euclidean distance, $d(p, q) = \sqrt{\sum_k (p_k - q_k)^2}$. A point that is alone in its group counts as $s = 0$. The function computes the distance between **all** pairs of points: it costs about $n^2 \cdot m$ operations for $n$ points with $m$ columns, so it is slow with a lot of data.

### `machine.silhouette_score(X, labels)` { #silhouette_score }

**What it does:** Computes the average silhouette of all the points.

**When to use it:** After [`KMeans`, `DBSCAN` or another clustering model](clustering.md), to know whether the groups are well separated or to compare different numbers of groups.

| Parameter | Type | What it means |
|---|---|---|
| `X` | `List[List[FLOAT]]` or `List[List[INT]]` | The points: one row per point. |
| `labels` | `List[INT]` | The group number of each point, in the same order. |

**Returns:** `FLOAT` between −1 and 1. Closer to 1 is better.

**Example:**

```kafe
--8<-- "tests/DocsExamples/machine/silhouette_score.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/machine/silhouette_score.expec"
```

??? warning "Common mistake: a single group"
    The silhouette needs **another** group to compare with. You need at least 2 groups, and fewer groups than points:

    ```kafe
    --8<-- "tests/DocsExamples/machine/silhouette_score-one-group.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/silhouette_score-one-group.error.stderr.expec"
    ```

!!! tip "What did you learn?"
    - The silhouette needs no right answers: only the points and their groups.
    - For each point it compares $a$ (distance to its own group) with $b$ (distance to the neighboring group).
    - Close to 1 is a good group; close to 0 or negative is not.

## The same metrics for MACHINE and GESHA { #one-metric-api-for-machine-and-gesha }

Metrics only need **two lists**. They do not care who made the predictions. That is why they work the same for a MACHINE model and for a [GESHA](../gesha.md) neural network: you train with the library you like and grade with `machine.<metric>(...)`.

| Task | Prediction with MACHINE | Prediction with GESHA | Metric |
|---|---|---|---|
| Classification | `model.predict(X)` | `network.predict_label(X)` | Labels → `machine.accuracy_score` and the rest. |
| ROC AUC with two classes | The model's scores | `network.predict(X)` | Unrounded scores → `machine.roc_auc_score`. |
| Regression with one output | `model.predict(X)` | `network.predict(X)` | Numbers → `machine.mean_squared_error`, `machine.r2_score`… |

One GESHA detail: `network.predict(X)` returns a **table** with one row per example, such as `[[0.2], [0.9]]`. Regression metrics and `roc_auc_score` accept that **one-column** table as well as a plain list. Classification metrics need **labels** in a plain list: use `predict_label`. If the network has several outputs per example (`[[0.1, 0.9], ...]`), the metrics cannot pick one for you and raise an error.

```kafe
--8<-- "tests/DocsExamples/machine/mean_squared_error-gesha.kf"
```

```text
--8<-- "tests/DocsExamples/machine/mean_squared_error-gesha.expec"
```

!!! tip "What happened here?"
    1. A GESHA network with a single neuron was created and trained for 5 rounds (that is why you see 5 `Epoch` lines).
    2. `network.predict(X)` returned a one-column table.
    3. `machine.mean_squared_error(y, p)` accepted that table and computed the MSE. It is high (2.52) because 5 rounds are far too few to learn.

In real work, first [split the data](selection.md) into training and test sets, and compute the metric on the **test** set.

## Which metric do I use? { #which-metric }

| Your situation | Use |
|---|---|
| I classify and my classes are balanced | `accuracy_score` |
| A false alarm is expensive (deleting a good email) | `precision_score` |
| Missing a case is expensive (not detecting an illness) | `recall_score` |
| Unbalanced classes and I want a single grade | `f1_score` |
| I want to see what the model mixes up | `confusion_matrix` |
| I want every grade, class by class | `classification_report` |
| My model gives scores or probabilities (two classes) | `roc_auc_score` |
| I predict numbers and want the typical error, easy to explain | `mean_absolute_error` |
| I predict numbers and big errors are very serious | `mean_squared_error` or `root_mean_squared_error` |
| I care about the worst case | `max_error` |
| There are odd values I do not want to ruin the grade | `median_absolute_error` |
| I want the error as a percentage (no zeros in the real values) | `mean_absolute_percentage_error` |
| I want a grade without units, where 1 is perfect | `r2_score` |
| I want to know whether the model has a constant bias | `explained_variance_score` together with `r2_score` |
| I made groups and have no right answers | `silhouette_score` |

## What did you learn?

- A metric compares the right answers with the model's answers and returns a grade.
- In classification everything comes from the confusion matrix; in regression, from the list of errors; in clustering, from the distances.
- There is no "best" metric: you choose by which mistake hurts you most.

[Back to MACHINE :material-arrow-left:](../machine.md){ .md-button }
[Next library: GESHA :material-arrow-right:](../gesha.md){ .md-button .md-button--primary }
