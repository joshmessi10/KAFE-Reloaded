# MACHINE: classification and trees

**Classifying** means deciding which **group** something belongs to: is this email spam or not? Is this fruit an apple, an orange or a watermelon? This page also has models that predict **numbers** with the same idea (the ones ending in *Regressor*).

| Model | What it's for | How it thinks |
|---|---|---|
| [`LogisticRegression`](#logisticregression) | Choosing between **two** groups and giving a probability. | An S-shaped curve. |
| [`KNN`](#knn) | Classifying by copying the nearest neighbours. | "Birds of a feather…" |
| [`KNNRegressor`](#knnregressor) | Predicting a number by averaging the neighbours. | Like KNN, but with an average. |
| [`DecisionTreeClassifier`](#decisiontreeclassifier) | Classifying with yes/no questions. | A tree of questions. |
| [`DecisionTreeRegressor`](#decisiontreeregressor) | Predicting a number with yes/no questions. | Steps. |
| [`GaussianNB`](#gaussiannb) | Classifying by comparing probability bells. | "How typical is this value in each group?" |
| [`RandomForestClassifier`](#randomforestclassifier) | Classifying with many trees that vote. | The majority wins. |
| [`RandomForestRegressor`](#randomforestregressor) | Predicting a number with many trees. | The average of them all. |

!!! tip "Before you start"
    They're all used the same way: you **create** them, teach them with `fit(X, y)` and ask them with `predict(X)`. In classification, `y` is a list of integers (`List[INT]`) with each example's group, and `score` gives the **accuracy**: the fraction it got right. If this is your first time, read [how MACHINE works](../machine.md).

## LogisticRegression: the S curve { #logisticregression }

### The idea in one sentence

**Logistic regression** turns your data into a **probability** between 0 and 1 with an S-shaped curve. If the probability is above 0.5, it says "group 1"; otherwise, "group 0".

### An everyday comparison

Think of a light switch with a dimmer. With little power the bulb is off (0) and with a lot it's on (1), but in between there's a stretch where it slowly brightens. The S curve is that dimmer: near the middle the model **hesitates**; far from it, it's **sure**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-logistic-curve.svg"
<figcaption>Students who studied 1 to 3 hours failed (bottom) and 4 to 6 hours passed (top). The S curve goes from 0 to 1, the dashed line marks one half and, at 3.5 hours, the curve gives a probability of 0.54: a pass, but only just.</figcaption>
</figure>

### Your first logistic regression

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression.expec"
```

!!! tip "What happened here?"
    1. `machine.logistic_regression(0.5, 2000)` created the model with a **learning step** of `0.5` and `2000` practice rounds.
    2. `fit` learned from 6 students: `0` = failed, `1` = passed.
    3. `predict` said: with 2.5 hours you fail; with 3.5 and 5.5, you pass.
    4. `predict_proba` gives the confidence of passing: `0.02`, `0.54` and `1.0`. At 3.5 hours the model almost hesitates.

### The maths with small numbers { #logisticregression-math }

The model does two calculations:

1. A **weighted sum**, like linear regression: $z = w \cdot x + b$.
2. It squashes $z$ between 0 and 1 with the **sigmoid function**: $p = \dfrac{1}{1 + e^{-z}}$.

To know whether it's doing well, it measures the **log loss**: it heavily punishes being **very sure and wrong**. This program computes it by hand with $w = 2$ and $b = -7$:

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression-by-hand.expec"
```

The three probabilities (`0.05`, `0.27`, `0.95`) match the answers (failed, failed, passed), so the average loss is small: `0.137`. And this check shows that `predict_proba` does exactly that calculation with the weights it learned:

```kafe
--8<-- "tests/DocsExamples/machine/logistic_regression-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/logistic_regression-check.expec"
```

??? info "For the curious 🤓"
    The model minimises the average log loss

    $$L = -\frac{1}{n}\sum_i \big[y_i \log p_i + (1-y_i)\log(1-p_i)\big]$$

    Its gradient is very simple: $\frac{\partial L}{\partial w} = \frac{1}{n}\sum_i (p_i - y_i)\,x_i$. KAFE uses **gradient descent**: on each round it computes every $p_i$, looks at how wrong it was and moves $w$ and $b$ one step (`learning_rate`) against the error.

### How it's built inside { #logisticregression-inside }

The model lives in `src/lib/KafeMACHINE/linear/LogisticRegression.py`. In `fit`:

1. It checks that `y` contains **only 0 and 1**.
2. It starts with weights at 0.
3. It runs `max_iter` rounds. On each one it computes the probability of every example, the error $p - y$, and moves the weights one step of size `learning_rate`.
4. It stores `coef_` and `intercept_`.

!!! note "Why `0.5` and `2000`?"
    The defaults are `0.01` and `1000`: small steps and few rounds. With such short data the model doesn't get far enough, so the examples use bigger steps and more rounds.

### API { #logistic_regression }

| Call | What it does |
|---|---|
| `machine.logistic_regression()` or `machine.logistic_regression(learning_rate, max_iter)` | Creates the model. Pass **both** numbers or neither: `learning_rate` (`FLOAT`, `0.01`) and `max_iter` (`INT`, `1000`). |
| `model.fit(X, y)` | Learns. `y` may only contain `0` and `1`. |
| `model.predict(X)` | Returns a `List[INT]` of `0` or `1`. |
| `model.predict_proba(X)` | Returns, per row, `[prob. of 0, prob. of 1]`. |
| `model.score(X, y)` | The accuracy. |
| `model.coef_` / `model.intercept_` | The weights and the starting point. |

??? warning "Common mistakes"
    It only accepts groups `0` and `1`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/logistic_regression-labels.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/logistic_regression-labels.error.stderr.expec"
    ```

    And it takes both settings or neither:

    ```kafe
    --8<-- "tests/DocsExamples/machine/logistic_regression-one-arg.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/logistic_regression-one-arg.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Gives a probability, not just a yes or a no. | Only two groups. |
| Each weight tells which group an input pushes towards. | The border between groups is a straight line. |
| Fast at predicting. | You have to choose the step and the rounds. |

## KNN: copy your neighbours { #knn }

### The idea in one sentence

**KNN** (*K-Nearest Neighbors*) doesn't learn any formula: it **remembers** every example and, for a new one, finds the `k` most similar and picks the group that **appears most** among them.

### An everyday comparison

You move to a new neighbourhood and want to know which team your neighbours support. You ask the **3 nearest houses**: if two support one team and one the other, you bet on the first. That's KNN with `k = 3`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-knn-vote.svg"
<figcaption>Circles and squares on a grid and a new point marked "?". A circle grows around it until it holds its 3 nearest neighbours: two circles and one square. The new point becomes a circle, 2 votes to 1.</figcaption>
</figure>

### Your first KNN

Pets measured by height (cm) and weight (kg). Group `0` = cat, `1` = dog:

```kafe
--8<-- "tests/DocsExamples/machine/knn.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn.expec"
```

!!! tip "What happened here?"
    1. `machine.knn(3)` created a KNN that asks **3** neighbours.
    2. `fit` only **stored** the 6 pets. It did no maths.
    3. The pet `[45, 14]` sits between the two groups. Of its 3 neighbours, 2 are dogs: `predict_proba` gives `0.33` cat and `0.67` dog.

### The maths with small numbers { #knn-math }

"Nearest" is measured with the **straight-line distance** (Euclidean distance), Pythagoras' theorem:

$$d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

This program measures the distance from the new point `[3, 3]` to the five points in the picture:

```kafe
--8<-- "tests/DocsExamples/machine/knn-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn-by-hand.expec"
```

The three nearest are `1.0` (square), `2.0` (circle) and `2.24` (circle). Circle wins, 2 to 1. MACHINE gets the same:

```kafe
--8<-- "tests/DocsExamples/machine/knn-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn-check.expec"
```

### How it's built inside { #knn-inside }

The model lives in `src/lib/KafeMACHINE/neighbors/KNN.py`.

- `fit` copies `X` and `y`. That's all: that's why KNN is called a **lazy learner**.
- `predict`, for each new row, measures the distance to **every** stored example, sorts them, takes the first `k` and counts votes. On a tie, the smallest label wins.
- `predict_proba` returns the fraction of votes for each group.

!!! warning "Scale matters"
    If one column goes from 0 to 1000 and another from 0 to 1, the first alone decides who's close. Scale your data with [`StandardScaler`](preprocessing.md) before using KNN.

### API { #knn-api }

| Call | What it does |
|---|---|
| `machine.knn(k)` | Creates the model. `k` (`INT`, default `3`) is how many neighbours vote. |
| `model.fit(X, y)` | Stores the examples. |
| `model.predict(X)` / `model.predict_proba(X)` / `model.score(X, y)` | Group, fraction of votes per group, and accuracy. |
| `model.k` | The number of neighbours. |

??? warning "Common mistake: more neighbours than examples"
    ```kafe
    --8<-- "tests/DocsExamples/machine/knn-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/knn-too-many.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Very easy to understand. | Slow to predict with lots of data: it measures every distance. |
| Works with any number of groups. | Sensitive to the scale of the data. |
| Borders can take any shape. | You have to choose `k`: too small copies the noise, too large flattens everything. |

## KNNRegressor: the neighbours' average { #knnregressor }

### The idea in one sentence

Like KNN, but instead of voting for a group it **averages the numbers** of the `k` nearest neighbours.

### An everyday comparison

To decide how much to charge for your flat, you look at the price of the **2 flats most similar** in size and take the average.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-knn-regressor.svg"
<figcaption>Five flats by size and price. A line marks a new 42 m² flat. Its two nearest neighbours (40 and 50 m²) get rings, and the prediction appears right between their prices: 15.5.</figcaption>
</figure>

### Your first KNNRegressor

```kafe
--8<-- "tests/DocsExamples/machine/knn_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn_regressor.expec"
```

!!! tip "What happened here?"
    1. `machine.knn_regressor(2)` averages **2** neighbours.
    2. For 45 m², the neighbours are 40 (14) and 50 (17): (14 + 17) ÷ 2 = `15.5`.
    3. For 70 m², they're 60 (21) and 80 (28): `24.5`.

### Neighbours that weigh differently { #knnregressor-distance }

With `"distance"`, the **nearer neighbour weighs more** in the average. For 42 m², the 40 m² flat is 2 away and the 50 m² flat is 8 away: the first counts 4 times as much.

```kafe
--8<-- "tests/DocsExamples/machine/knn_regressor-distance.kf"
```

```text
--8<-- "tests/DocsExamples/machine/knn_regressor-distance.expec"
```

The plain average gives `15.5`; the distance-weighted one gives `14.6`, closer to the 40 m² flat's price. The sum is $(14 \cdot \tfrac12 + 17 \cdot \tfrac18) \div (\tfrac12 + \tfrac18) = 14.6$.

### API { #knn_regressor }

| Call | What it does |
|---|---|
| `machine.knn_regressor(k, weights)` | Creates the model. `k` (`INT`, default `5`); `weights` (`STR`): `"uniform"` (all equal, default) or `"distance"` (the nearest weighs more). |
| `model.fit` / `predict` / `score` | Store, average, and the $R^2$ score. |
| `model.k` / `model.weights` | The chosen settings. |

??? warning "Common mistake: a `weights` value that doesn't exist"
    ```kafe
    --8<-- "tests/DocsExamples/machine/knn_regressor-weights.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/knn_regressor-weights.error.stderr.expec"
    ```

!!! note "It can't leave the map"
    A KNNRegressor never predicts something higher than its largest example or lower than its smallest: it only averages what it has already seen.

## DecisionTreeClassifier: a tree of questions { #decisiontreeclassifier }

### The idea in one sentence

A **decision tree** learns a list of **yes/no questions** ("does it weigh less than 125 g?") that keep splitting the examples until each group is clean.

### An everyday comparison

It's the **guess-who game**: "is it human?", "does it wear a hat?", "does it have a beard?". Each answer rules out many. A good player first asks the question that **rules out the most**. The tree does the same with your data.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tree-split.svg"
<figcaption>Six mixed points on a line. A trial cut moves to 4.5, 3.5 and 2.5, showing how much each one tidies up (0.25, 0.056 and 0.25). It keeps 2.5 and the tree appears: the question "x ≤ 2.5" with a circle leaf on the left and a square leaf on the right.</figcaption>
</figure>

### Your first tree

Fruit measured by weight (g) and diameter (cm): `0` = lemon, `1` = apple, `2` = mango.

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier.expec"
```

!!! tip "What happened here?"
    1. The tree got every fruit right (`1.0`).
    2. `model.tree_` shows the questions it learned. Read it like this: "is input 0 (weight) ≤ 125? If yes → lemon. If not: weight ≤ 220? If yes → apple; if not → mango".
    3. It only needed the weight: the diameter didn't help separate them further.

### The maths with small numbers { #decisiontreeclassifier-math }

How does it know which question is best? It measures how **mixed** each group is with the **Gini index**: 0 if they're all the same and 0.5 if it's half and half (with two classes).

$$\text{Gini} = 1 - p_0^2 - p_1^2$$

For each possible cut it computes the average Gini of the two sides and how much it **dropped** from the start (0.5). That's called the **gain**. This program tries three cuts on the line in the picture:

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-gini.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-gini.expec"
```

Cuts 2.5 and 4.5 tie at `0.25`; 3.5 barely tidies anything (`0.056`). The tree keeps the first one it found, 2.5. A tree with **a single question** (`max_depth = 1`) shows exactly that:

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_classifier-check.expec"
```

The one-question tree gets 5 out of 6 (`0.83`). The tree with no limit keeps asking until it gets them all (`1.0`).

??? info "For the curious 🤓"
    With $k$ classes, $\text{Gini} = 1 - \sum_c p_c^2$. The other option, `"entropy"`, uses $H = -\sum_c p_c \log_2 p_c$. A cut's gain is the parent's impurity minus the weighted average of the children's:

    $$\Delta = I(\text{parent}) - \frac{n_L}{n} I(L) - \frac{n_R}{n} I(R)$$

    For each column, the tree sorts the values and tries the **midpoint** between two consecutive values as a cut.

### How it's built inside { #decisiontreeclassifier-inside }

The model lives in `src/lib/KafeMACHINE/tree/DecisionTree.py`. `fit` calls a **recursive** function (one that calls itself):

1. If all examples are in the same group, if `max_depth` has been reached, or if fewer than `min_samples_split` examples remain, it creates a **leaf** with the most common group.
2. Otherwise it tries every cut of every column and picks the one with the highest gain, respecting `min_samples_leaf` on each side.
3. It splits the examples into left (≤ cut) and right (> cut) and repeats on each side.

The result is a nested dictionary: `model.tree_`. `predict` walks it from the top, answering the questions, until it reaches a leaf.

### API { #decision_tree_classifier }

| Call | What it does |
|---|---|
| `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | Creates the tree. All optional: `criterion` (`"gini"` or `"entropy"`), `max_depth` (`INT`, `0` = no limit), `min_samples_split` (`2`), `min_samples_leaf` (`1`). |
| `model.fit` / `predict` / `score` | Learn, classify, and accuracy. |
| `model.tree_` | The learned questions. |
| `model.classes_` / `model.n_features_` | The groups and how many columns each example has. |

??? warning "Common mistake: a regression criterion"
    ```kafe
    --8<-- "tests/DocsExamples/machine/decision_tree_classifier-criterion.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/decision_tree_classifier-criterion.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| You can read its questions and understand every decision. | With no limit, it memorises the data (it **overfits**). |
| It doesn't care about the scale of the data. | A small change in the data can change the whole tree. |
| Works with several groups. | Its borders are always straight and stair-shaped. |

## DecisionTreeRegressor: predicting with steps { #decisiontreeregressor }

### The idea in one sentence

The same tree of questions, but each leaf stores a **number**: the **average** of the examples that reached it. That's why its predictions look like **steps**.

### An everyday comparison

An ice-cream shop records how many ice creams it sells by temperature. Instead of a formula, the manager uses a rule: "below 21.5 °C we sell about 21; above it, about 48".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-tree-regressor.svg"
<figcaption>Ice-cream sales by temperature. First, a flat line at the overall average (37.2). Then the tree cuts at 21.5 °C and the line becomes two steps: 21 on the cold side and 48 on the warm side.</figcaption>
</figure>

### Your first regression tree

```kafe
--8<-- "tests/DocsExamples/machine/decision_tree_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/decision_tree_regressor.expec"
```

!!! tip "What happened here?"
    1. `machine.decision_tree_regressor("mse", 1)` creates a **one-question** tree. Its `tree_` says: "temperature ≤ 21.5? → 21; otherwise → 48". 21 is the average of 20 and 22; 48, of 40, 44 and 60.
    2. It scores `0.79`: good for a single question.
    3. The tree with no limit keeps cutting until each leaf holds a single example: score `1.0`, but it has **memorised** the data.

Instead of Gini, the regression tree measures the **mean squared error** (`"mse"`) on each side: the best cut leaves the numbers on each side **most alike**.

### API { #decision_tree_regressor }

| Call | What it does |
|---|---|
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | Same as the classifier, but `criterion` can only be `"mse"`. |
| `model.fit` / `predict` / `score` | Learn, predict numbers, and the $R^2$ score. |
| `model.tree_` | The questions; each leaf has a `value`. |

??? warning "Common mistake: a classification criterion"
    ```kafe
    --8<-- "tests/DocsExamples/machine/decision_tree_regressor-criterion.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/decision_tree_regressor-criterion.error.stderr.expec"
    ```

!!! note "It can't leave the map either"
    Since every leaf is an average of seen examples, the tree doesn't predict beyond the data: at 40 °C it would say 60, the same as at 32 °C.

## GaussianNB: how typical is it? { #gaussiannb }

### The idea in one sentence

**Gaussian Naive Bayes** describes each group with a **bell** (its average and how spread out its values are). For a new value it asks: in which bell does it sit **highest**? That's its group.

### An everyday comparison

If you see someone who is 2.10 m tall, you think "probably a basketball player": that height is **rare** among people in general but **typical** among basketball players. Naive Bayes compares how typical the value is in each group, and also how many there are of each group.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-naive-bayes-bells.svg"
<figcaption>A narrow bell centred at 4 kg for cats and a wide, low one centred at 10 kg for dogs. At 6 kg, the dogs' bell is taller (0.052) than the cats' (0.024), even though 6 is closer to 4.</figcaption>
</figure>

### Your first Naive Bayes

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb.expec"
```

!!! tip "What happened here?"
    1. `fit` computed each group's average, `theta_`: 100 and 150.
    2. `class_prior_` says how many there are of each group: half and half.
    3. For 122 (closer to 100 than to 150) it gave `0.9` to group `0`.

### The maths with small numbers { #gaussiannb-math }

Now the case in the picture: 3 cats (3, 4 and 5 kg) and 5 dogs (6, 8, 10, 12 and 14 kg). Is a 6 kg animal a cat or a dog? The program computes:

1. Each group's **variance** (how spread out it is): cats `0.667`, dogs `8.0`.
2. The height of each bell at 6: cats `0.0243`, dogs `0.0519`.
3. It multiplies each height by the group's share (3/8 and 5/8) and splits the total.

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb-by-hand.expec"
```

Result: `0.22` cat and `0.78` dog. Cats are **very alike**, so 6 kg is unusual for a cat. MACHINE gives the same:

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_nb-check.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_nb-check.expec"
```

??? info "For the curious 🤓"
    It's **Bayes' theorem**: $P(c \mid x) \propto P(c)\,P(x \mid c)$. Each $P(x_j \mid c)$ is a normal bell

    $$P(x_j \mid c) = \frac{1}{\sqrt{2\pi\sigma_{c,j}^2}}\exp\!\left(-\frac{(x_j - \mu_{c,j})^2}{2\sigma_{c,j}^2}\right)$$

    It's called **naive** because, with several columns, it multiplies their bells as if they were **independent**. They almost never are, but it works surprisingly well. KAFE adds logarithms instead of multiplying, so it doesn't lose precision with very small numbers.

### How it's built inside { #gaussiannb-inside }

The model lives in `src/lib/KafeMACHINE/naive_bayes/GaussianNB.py`. `fit` doesn't loop: for each group it computes once its share (`class_prior_`), the average of each column (`theta_`) and its variance (`var_`). `predict` evaluates the bells and picks the largest.

### API { #gaussian_nb }

| Call | What it does |
|---|---|
| `machine.gaussian_nb()` | Creates the model. It takes no parameters. |
| `model.fit` / `predict` / `predict_proba` / `score` | Learn, classify, probability per group, and accuracy. |
| `model.classes_`, `class_prior_`, `theta_`, `var_`, `n_features_in_` | The groups, their share, their averages, their variances and the number of columns. |

??? warning "Common mistake: a single group"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gaussian_nb-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gaussian_nb-one-class.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Learns instantly and with little data. | Assumes each group is bell-shaped. |
| Gives probabilities. | Assumes the columns are unrelated to each other. |

## RandomForestClassifier: many trees vote { #randomforestclassifier }

### The idea in one sentence

A **random forest** trains **many trees**, each on a slightly different version of the data, and lets them **vote**. The group with the most votes wins.

### An everyday comparison

In a quiz show, the audience votes. Each person is sometimes wrong, but not all about the same things, so **the majority is usually right**. It's the "wisdom of the crowd".

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-forest-vote.svg"
<figcaption>Five small trees vote one by one: square, circle, square, square, circle. The tally is 2 circles to 3 squares, so the forest answers square.</figcaption>
</figure>

### Your first forest

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_classifier.expec"
```

!!! tip "What happened here?"
    1. `machine.random_forest_classifier(25)` created a forest of **25 trees**.
    2. Each tree learned from a different draw of the examples. Together they classified all 8 correctly.

The vote is a very simple sum. With five trees that voted `1, 0, 1, 1, 0`:

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_classifier-vote.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_classifier-vote.expec"
```

2 votes for `0`, 3 for `1`: `1` wins.

### Why are the trees different? { #randomforestclassifier-inside }

If every tree saw the same thing, they'd all vote alike and it would be useless. The forest uses two random draws (that's why it's *random*):

1. **Drawing examples (*bootstrap*).** Each tree gets a list the same size as the original, drawn **with replacement**: some examples appear twice and others don't appear at all.
2. **Drawing columns.** At each question, the tree may only look at a few random columns: the square root of the total.

The code is in `src/lib/KafeMACHINE/tree/RandomForest.py`. `predict` asks every tree and counts the votes.

??? info "For the curious 🤓"
    This technique is called ***bagging*** (*bootstrap aggregating*). If each tree is right more than half the time and their mistakes don't all happen together, the vote of many trees is right more often than any one of them. A single tree has high **variance** (it changes a lot with the data); averaging many reduces it.

### API { #random_forest_classifier }

| Call | What it does |
|---|---|
| `machine.random_forest_classifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Creates the forest. All optional `INT`s: `n_estimators` (how many trees, `10`), `max_depth` (`0` = no limit), `min_samples_split` (`2`), `min_samples_leaf` (`1`). |
| `model.fit` / `predict` / `score` | Learn, vote, and accuracy. |
| `model.classes_`, `n_estimators`, `n_features_` | The groups, the number of trees and of columns. |

??? warning "Common mistake: predicting before training"
    ```kafe
    --8<-- "tests/DocsExamples/machine/random_forest_classifier-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/random_forest_classifier-not-fitted.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Overfits much less than a single tree. | It no longer reads like a tree of questions. |
| Works well with almost no tuning. | More trees = slower. |

## RandomForestRegressor: the forest's average { #randomforestregressor }

### The idea in one sentence

The same as the classifier forest, but each tree predicts a **number** and the forest gives the **average**.

### An everyday comparison

To guess how many sweets are in a jar, the average of many people's guesses is usually closer than any single guess.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-forest-average.svg"
<figcaption>The ice-cream sales again. Three thin step lines appear, one per tree, each trained on a different draw of the data. Then their average appears: a thicker line with smaller, smoother steps.</figcaption>
</figure>

### Your first regression forest

```kafe
--8<-- "tests/DocsExamples/machine/random_forest_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/random_forest_regressor.expec"
```

!!! tip "What happened here?"
    1. With 20 trees, it predicted `21.5` for 16 °C and `45.3` for 30 °C.
    2. Compare with the one-question tree above (21 and 48): the average of many trees gives smoother steps.
    3. `max_depth` is `0`: the trees have no depth limit.

### API { #random_forest_regressor }

| Call | What it does |
|---|---|
| `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Same as the classifier. |
| `model.fit` / `predict` / `score` | Learn, average, and the $R^2$ score. |
| `model.n_estimators` / `model.max_depth` | The chosen settings. |

??? warning "Common mistake: changing the number of columns"
    ```kafe
    --8<-- "tests/DocsExamples/machine/random_forest_regressor-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/random_forest_regressor-features.error.stderr.expec"
    ```

!!! tip "What did you learn on this page?"
    - **LogisticRegression** uses an S curve to give probabilities between two groups.
    - **KNN** copies the nearest neighbours: it votes or averages.
    - A **decision tree** learns yes/no questions and picks the one that tidies up most.
    - **GaussianNB** compares how typical a value is in each group's bell.
    - A **random forest** combines many different trees: they vote or average.
