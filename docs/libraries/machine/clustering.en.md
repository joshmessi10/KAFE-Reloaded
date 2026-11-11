# MACHINE: clustering and ensembles

This page has two families of models:

- **Clustering** (grouping): you give it data **without answers** and the model discovers on its own which groups exist. It's **unsupervised** learning: nobody tells it the correct group.
- **Boosting ensembles**: they combine many small models, and each one **fixes the mistakes** of the previous one.

| Model | What it's for | How it thinks |
|---|---|---|
| [`KMeans`](#kmeans) | Splitting the data into `k` groups. | Centres that move to the middle of their group. |
| [`DBSCAN`](#dbscan) | Finding crowded areas and flagging lone points. | "Do you have enough neighbours nearby?" |
| [`AgglomerativeClustering`](#agglomerativeclustering) | Grouping by joining the closest first. | A family tree of groups. |
| [`GaussianMixture`](#gaussianmixture) | Grouping with bells and giving probabilities. | Bells that fit themselves to the data. |
| [`AdaBoostClassifier`](#adaboostclassifier) | Classifying into two groups with many tiny trees. | Insisting on what it got wrong. |
| [`GradientBoostingRegressor`](#gradientboostingregressor) | Predicting numbers with trees that correct. | Fixing what's left, a little at a time. |
| [`GradientBoostingClassifier`](#gradientboostingclassifier) | The same for two groups. | Nudging the probabilities. |

!!! tip "Before you start"
    Clustering models are trained with `fit(X)`, **without** `y`, because there are no answers. `fit_predict(X)` trains and returns each row's group in one step. The **group numbers mean nothing** by themselves: group `0` isn't "better" or "first", it's just a name.

## KMeans: centres that move { #kmeans }

### The idea in one sentence

**K-Means** places `k` **centres** on the data and repeats two steps until nothing changes: each point joins its nearest centre, and each centre moves to the **middle** of its points.

### An everyday comparison

Two ice-cream sellers arrive at a beach and set up anywhere. Each swimmer goes to the nearest seller. Seeing where their customers come from, each seller moves to the centre of their group. The swimmers choose the nearest one again, the sellers move again… until nobody switches sellers any more.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-kmeans-centers.svg"
<figcaption>Six fruits in two clumps. Two centres (the crosses) start in arbitrary places. Each fruit takes the colour of its nearest centre and each centre moves to the middle of its fruits. In 3 rounds the centres sit in the middle of each clump and stop moving.</figcaption>
</figure>

### Your first K-Means

Six fruits measured with two numbers. We don't tell it which fruit is which:

```kafe
--8<-- "tests/DocsExamples/machine/kmeans.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans.expec"
```

!!! tip "What happened here?"
    1. `machine.kmeans(2, 100, 42)` asks for **2** groups, at most **100** rounds and the **seed** `42` so the initial draw is always the same.
    2. `fit(fruits)` found the groups: the first three fruits in group `1` and the last three in group `0`.
    3. The centres ended up at (8.33, 8.33) and (1.33, 1.33): the middle of each clump.
    4. `inertia_` (`2.67`) measures how tight the groups are: the sum of each point's squared distance to its centre.
    5. `predict` uses the centres for new data: `[2, 2]` goes to group `1` and `[7, 9]` to group `0`.

### The maths with small numbers { #kmeans-math }

This program does **one round** by hand, with the centres starting at (1, 1) and (8, 8):

```kafe
--8<-- "tests/DocsExamples/machine/kmeans-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans-by-hand.expec"
```

1. **Assign:** each fruit goes to the nearest centre. The first three to centre 0 and the last three to centre 1.
2. **Move:** each centre moves to the average of its fruits: (1 + 1 + 2) ÷ 3 = **1.33**.
3. **Measure:** the inertia is `2.67`.

How many groups should you ask for? Inertia **always drops** when you ask for more groups (with one group per point it would be 0), so look for where it stops dropping much:

```kafe
--8<-- "tests/DocsExamples/machine/kmeans-score.kf"
```

```text
--8<-- "tests/DocsExamples/machine/kmeans-score.expec"
```

With 1 group the inertia is `149.67`; with 2, `2.67`. That huge jump says the data has **2 groups**. `score` returns the inertia with a minus sign (`-2.67`), so that "higher" means "better". Another way to choose is [`silhouette_score`](metrics.md#silhouette_score).

??? info "For the curious 🤓"
    K-Means minimises the inertia $J = \sum_i \lVert x_i - \mu_{c(i)} \rVert^2$. Each step (assign or move) never makes it go up, so the algorithm always finishes. But it can get stuck in a **local minimum**: a good solution but not the best, depending on where the centres started. That's why KAFE uses **K-Means++** to pick the initial centres: the first at random and each next one more likely the **farther** it is from the existing ones.

### How it's built inside { #kmeans-inside }

The model lives in `src/lib/KafeMACHINE/clustering/KMeans.py`. `fit`:

1. Picks the initial centres with K-Means++, using the seed.
2. Repeats up to `max_iter` times: assigns each point to its nearest centre and moves each centre to the average of its points.
3. Stops early if the centres no longer move.
4. Stores `labels_`, `cluster_centers_` and `inertia_`.

### API { #kmeans-api }

| Call | What it does |
|---|---|
| `machine.kmeans(n_clusters, max_iter, random_state)` | Creates the model. `n_clusters` (`INT`, default `3`), `max_iter` (`100`), `random_state` (the seed; use a fixed number such as `42` to always get the same result). |
| `model.fit(X)` / `model.fit_predict(X)` | Groups; the second also returns the groups. |
| `model.predict(X)` | Group of the nearest centre for new data. |
| `model.score(X)` | The inertia with a minus sign: higher is better. |
| `model.labels_` or `model.labels()` | Each row's group. |
| `model.cluster_centers_` | The centres. |
| `model.inertia_` or `model.inertia()` | The inertia. |

??? warning "Common mistake: more groups than data points"
    ```kafe
    --8<-- "tests/DocsExamples/machine/kmeans-too-many.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/kmeans-too-many.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Simple and fast. | You have to tell it how many groups to look for. |
| The centres summarise each group. | It only finds round groups of similar size. |
| | A far-away point drags its centre. |

## DBSCAN: crowded areas { #dbscan }

### The idea in one sentence

**DBSCAN** joins the points in **crowded areas** (with many neighbours nearby) and marks the lonely ones as **noise**. You don't have to tell it how many groups to look for.

### An everyday comparison

You look at a city at night from a plane. Where there are many lights together you see **neighbourhoods**; a single house in the countryside isn't a neighbourhood, it's a stray light. DBSCAN looks at how many lights are within a certain distance of each one.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-dbscan-density.svg"
<figcaption>Nine houses. A circle of radius ε appears around each one. Those with at least 3 houses inside their circle (counting themselves) are core points (coloured). The crowded areas form groups 1 and 2, and the lonely house in the middle is noise: −1.</figcaption>
</figure>

### Your first DBSCAN

```kafe
--8<-- "tests/DocsExamples/machine/dbscan.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan.expec"
```

!!! tip "What happened here?"
    1. `machine.dbscan(1.0, 3)`: the radius `eps` is `1.0` and a house is **core** if it has at least `3` houses in its circle, counting itself.
    2. It found **2** groups. In KAFE, DBSCAN groups are numbered from `1`.
    3. House 5, at (6, 6), was left alone: `-1` means **noise**.
    4. `core_sample_indices()` lists the core points: houses 0, 1, 2, 3 and 6. House 4 is in group 1 without being core: it's a **border** point, because it's near a core.

### The maths with small numbers { #dbscan-math }

This program counts, for each house, how many houses are at a distance of `1.0` or less:

```kafe
--8<-- "tests/DocsExamples/machine/dbscan-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan-by-hand.expec"
```

Those that reach 3 are core. DBSCAN joins core points that are close to each other and adds their borders. Whatever doesn't reach any core is noise.

### The radius changes everything { #dbscan-eps }

```kafe
--8<-- "tests/DocsExamples/machine/dbscan-eps.kf"
```

```text
--8<-- "tests/DocsExamples/machine/dbscan-eps.expec"
```

With `eps = 0.5` no house has neighbours: **everything is noise** and there are 0 groups. With `eps = 5.0` they all touch: **a single group**. The right radius depends on the scale of your data.

??? info "For the curious 🤓"
    DBSCAN stands for *Density-Based Spatial Clustering of Applications with Noise*. A point is **core** if $|N_\varepsilon(p)| \ge$ `min_samples`, where $N_\varepsilon(p)$ are the points at distance $\le \varepsilon$ (itself included). Each group grows from a core point by adding everything reachable by hopping from core to core. With KAFE's simple method it costs on the order of $n^2$ distances.

### How it's built inside { #dbscan-inside }

The model lives in `src/lib/KafeMACHINE/clustering/DBSCAN.py`. `fit` walks through the points. When it finds a core point with no group, it opens a new group and **expands** it with a to-do list: it adds its neighbours and, if a neighbour is also core, adds that neighbour's neighbours too.

### API { #dbscan-api }

| Call | What it does |
|---|---|
| `machine.dbscan(eps, min_samples)` | Creates the model. `eps` (`FLOAT`, default `0.5`) is the radius; `min_samples` (`INT`, default `5`) is how many points a core needs. |
| `model.fit(X)` / `model.fit_predict(X)` | Groups. |
| `model.labels_` or `model.labels()` | Each row's group; `-1` is noise. |
| `model.n_clusters_` or `model.n_clusters()` | How many groups it found, not counting noise. |
| `model.core_sample_indices()` | The positions of the core points. |

??? warning "Common mistake: asking for `predict`"
    DBSCAN has no centres or bells: it can't place new data. For that, call `fit_predict` again with all the data.

    ```kafe
    --8<-- "tests/DocsExamples/machine/dbscan-predict.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/dbscan-predict.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| You don't have to say how many groups there are. | Choosing `eps` can be hard. |
| Finds groups of any shape. | If areas have very different densities, one `eps` won't fit them all. |
| Points out odd data (noise). | It doesn't predict new data. |

## AgglomerativeClustering: join the closest { #agglomerativeclustering }

### The idea in one sentence

**Agglomerative** starts with **each point as its own group** and, again and again, **joins the two closest groups**, until the number you asked for is left.

### An everyday comparison

At a party, best-friend pairs get together first. Then those pairs join other nearby pairs, and bigger and bigger groups form. If you write down when each group joined, you get a **family tree** (a *dendrogram*).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-agglomerative-merge.svg"
<figcaption>Five houses on a street, at 1, 2, 6, 7 and 15. First 1 and 2 join (distance 1), then 6 and 7 (distance 1), and then the two pairs (distance 4). Cutting the tree above that level leaves two groups: the four houses together and the house at 15 alone.</figcaption>
</figure>

### Your first Agglomerative

Pets by weight and height:

```kafe
--8<-- "tests/DocsExamples/machine/agglomerative_clustering.kf"
```

```text
--8<-- "tests/DocsExamples/machine/agglomerative_clustering.expec"
```

!!! tip "What happened here?"
    1. `machine.agglomerative_clustering(2, "ward")` asks for **2** groups, joining with the `"ward"` rule.
    2. The two small pets ended up in group `0` and the three large ones in group `1`.
    3. `children_` is the history of joins, in order: first pets 0 and 1 joined, then 2 and 4, and so on.

### The street in the picture { #agglomerativeclustering-street }

```kafe
--8<-- "tests/DocsExamples/machine/agglomerative_clustering-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/agglomerative_clustering-by-hand.expec"
```

`distances_` says at what distance each join happened: `1.0`, `1.0` and `4.0`, just like in the picture. The house at 15 stayed alone because it was 8 away from its nearest neighbour.

### What is "closest" between two groups? { #agglomerativeclustering-linkage }

Between two points it's easy, but between two **groups** there are several ways to measure. That's the `linkage`:

| `linkage` | Distance between two groups |
|---|---|
| `"single"` | That of their two **closest** points. Forms long chains. |
| `"complete"` | That of their two **farthest** points. Forms compact groups. |
| `"average"` | The **average** of all distances between their points. |
| `"ward"` | Joins the two groups that **least increase** the inner spread. It's the default. |

??? info "For the curious 🤓"
    With `"ward"`, the cost of joining groups $A$ and $B$ is the increase in the sum of squared distances to their centre: $\Delta = \frac{|A||B|}{|A|+|B|}\lVert \mu_A - \mu_B \rVert^2$. KAFE's implementation (`src/lib/KafeMACHINE/clustering/AgglomerativeClustering.py`) compares every pair of groups at every join, so it costs on the order of $n^3$: it's fine with little data.

### API { #agglomerative_clustering }

| Call | What it does |
|---|---|
| `machine.agglomerative_clustering(n_clusters, linkage)` | Creates the model. `n_clusters` (`INT`, default `2`); `linkage` (`STR`, default `"ward"`). |
| `model.fit(X)` / `model.fit_predict(X)` | Groups. |
| `model.labels_` | Each row's group. |
| `model.children_` / `model.distances_` | The history of joins and at what distance each happened. |
| `model.n_clusters_` | How many groups are left. |

??? warning "Common mistake: a `linkage` that doesn't exist"
    ```kafe
    --8<-- "tests/DocsExamples/machine/agglomerative_clustering-linkage.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/agglomerative_clustering-linkage.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Keeps the whole history of joins. | Slow with lots of data. |
| You can change the joining rule. | A join, once made, can't be undone. |

## GaussianMixture: bell-shaped groups { #gaussianmixture }

### The idea in one sentence

A **Gaussian mixture** assumes the data comes from several mixed **bells**, and finds each one's centre, width and size. For each value it gives a **probability** of belonging to each bell, not an all-or-nothing answer.

### An everyday comparison

In a park there are small dogs and large dogs. A medium one could be either type. Instead of forcing it to choose, you say: "79 % small, 21 % large". That's **soft** clustering.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gaussian-mixture.svg"
<figcaption>Weights 1, 2 and 3 and weights 10, 11 and 12 on a line. A bell grows over each clump. The line at 6.4 shows a split bar: 0.79 for the first bell and 0.21 for the second. The model isn't completely sure.</figcaption>
</figure>

### Your first mixture

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture.expec"
```

!!! tip "What happened here?"
    1. `machine.gaussian_mixture(2, 100, 0.001, 1)` asks for **2** bells, at most **100** rounds, to stop when it improves by less than **0.001**, and seed **1**.
    2. It found bells centred (`means_`) at `2.0` and `11.0`, with width (`covariances_`, the variance) `0.67` and weight (`weights_`) `0.5` each.
    3. `predict` says 2.5 belongs to bell `0` and 9 to bell `1`.
    4. For 6.4, almost in the middle, `predict_proba` splits it: `0.79` and `0.21`.

### The maths with small numbers { #gaussianmixture-math }

Each bell is described by an **average** and a **variance**. For weights 1, 2 and 3:

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture-by-hand.expec"
```

Average `2.0` and variance `0.67`: the same numbers the model found for its first bell.

### How many bells? { #gaussianmixture-choose }

```kafe
--8<-- "tests/DocsExamples/machine/gaussian_mixture-choose.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gaussian_mixture-choose.expec"
```

!!! warning "Here `score` is an error: lower is better"
    In `GaussianMixture`, `score` returns the model's **error** (the *negative log-likelihood*): with 1 bell it's `17.64` and with 2, `11.46`. `aic` and `bic` are that same error plus a **penalty for using more bells**. With 2 bells both drop (from `39.27` to `32.91` and from `38.85` to `31.87`), so 2 bells is better even though the model is more complex. `converged_` says it finished before the limit, in `2` rounds.

??? info "For the curious 🤓"
    The model is $p(x) = \sum_k \pi_k\,\mathcal{N}(x \mid \mu_k, \sigma_k^2)$. It's trained with the **EM** algorithm (*Expectation–Maximization*), which repeats two steps:

    - **E:** with the current bells, compute for each value the probability of each bell (the *responsibility*).
    - **M:** recompute each bell from those values, weighted by their responsibility.

    It stops when the log-likelihood improves by less than `tol`. $\text{AIC} = 2p - 2\log L$ and $\text{BIC} = p\log n - 2\log L$, with $p$ = number of parameters. The code is in `src/lib/KafeMACHINE/clustering/GaussianMixture.py`.

!!! note "It's like K-Means, but soft"
    K-Means assigns each point to **one** centre. GaussianMixture assigns each point to **every** bell, with different probabilities, and also learns each group's width.

### API { #gaussian_mixture }

| Call | What it does |
|---|---|
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | Creates the model. Defaults: `3` bells, `100` rounds, `tol = 0.001`, seed `0`. |
| `model.fit(X)` / `model.fit_predict(X)` / `model.predict(X)` | Learn and place data. |
| `model.predict_proba(X)` | The probability of each bell, per row. |
| `model.score(X)` / `model.aic(X)` / `model.bic(X)` | Error, and error with a penalty. **Lower is better.** |
| `model.means_`, `covariances_`, `weights_` | Each bell's centre, variance and weight. |
| `model.converged_` / `model.n_iter_` | Whether it finished before the limit and in how many rounds. |

??? warning "Common mistake: changing the number of columns"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gaussian_mixture-features.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gaussian_mixture-features.error.stderr.expec"
    ```

## AdaBoostClassifier: insist on what you got wrong { #adaboostclassifier }

### The idea in one sentence

**AdaBoost** trains, one after another, **single-question** trees (very weak ones). After each one, it **enlarges** the examples that tree got wrong, so the next one pays more attention to them. At the end they all vote, and the best trees vote more strongly.

### An everyday comparison

You study for an exam with flashcards. The ones you answer correctly go to the bottom of the deck; the ones you miss go **on top**, so you see them more. After a few rounds, you've mastered exactly what was hard for you.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-adaboost-weights.svg"
<figcaption>Five students with 1 to 5 hours of study: circles failed and squares passed. The first tree cuts at 2.5 and gets student 4 wrong. That student grows: its weight rises from 0.2 to 0.5, while the four it got right drop to 0.125. So the next tree pays more attention to it.</figcaption>
</figure>

### Your first AdaBoost

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier.expec"
```

!!! tip "What happened here?"
    `machine.ada_boost_classifier(10, 1.0)` created a team of **10** single-question trees with a **learning rate** of `1.0`. Together they classified every fruit correctly.

### The maths with small numbers { #adaboostclassifier-math }

If a tree gets 1 of 5 examples wrong, its error is $e = 0.2$ and its **voting strength** is

$$\alpha = \tfrac12 \ln\frac{1-e}{e} = \tfrac12 \ln 4 = 0.69$$

Then each wrong example's weight is multiplied by $e^{\alpha}$ and each right one's by $e^{-\alpha}$, and they're rescaled to add up to 1:

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-by-hand.expec"
```

The wrong example now weighs `0.5`, **half of everything**, and the right ones `0.125` each. And MACHINE shows each tree's error and strength:

```kafe
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-weights.kf"
```

```text
--8<-- "tests/DocsExamples/machine/ada_boost_classifier-weights.expec"
```

The first tree has error `0.2` and strength `0.69`, as in the hand calculation. The second, with the new weights, only gets `0.125` wrong and votes with strength `0.97`. Together, the 3 trees get all 5 students right, though none of them managed it alone.

??? info "For the curious 🤓"
    The final prediction is $\text{sign}\big(\sum_t \alpha_t\,h_t(x)\big)$, with each $h_t(x) = \pm 1$. The learning rate multiplies each $\alpha_t$. Each tree is a **stump**: KAFE tries every cut of every column and keeps the one with the lowest error **weighted** by the current weights. The code is in `src/lib/KafeMACHINE/ensemble/AdaBoost.py`.

### API { #ada_boost_classifier }

| Call | What it does |
|---|---|
| `machine.ada_boost_classifier(n_estimators, learning_rate)` | Creates the model. `n_estimators` (`INT`, default `50`); `learning_rate` (`FLOAT`, default `1.0`). |
| `model.fit` / `predict` / `score` | Learn, classify, and accuracy. |
| `model.estimator_errors_` / `model.estimator_weights_` | Each tree's error and voting strength. |
| `model.classes_` | The two groups. |

??? warning "Common mistake: more than two groups"
    ```kafe
    --8<-- "tests/DocsExamples/machine/ada_boost_classifier-three-classes.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/ada_boost_classifier-three-classes.error.stderr.expec"
    ```

| 👍 Strengths | 👎 Limits |
|---|---|
| Turns very weak models into a strong one. | Only two groups. |
| Tells you how good each tree was. | A mislabelled example gets enlarged again and again. |

## GradientBoostingRegressor: fix what's left { #gradientboostingregressor }

### The idea in one sentence

**Gradient Boosting** starts with a simple prediction (the average) and adds trees **one by one**. Each new tree learns to predict **what's still missing** (the *residual*), and only **a bit** of its answer is added.

### An everyday comparison

A sculptor doesn't make a statue in one blow. First they rough out the general shape; then, with each pass, they remove a little of what's **left over**. Each pass is finer than the last, until the figure appears.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gradient-boosting.svg"
<figcaption>Four flats priced 10, 20, 30 and 40. The prediction bars start flat at the average (25). With 1, 2, 5 and 50 trees they move step by step towards each point: 20 and 30; then 15 and 31.67; then 11.46 and 38.4; and finally they land on 10, 20, 30 and 40.</figcaption>
</figure>

### Your first Gradient Boosting

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor.expec"
```

!!! tip "What happened here?"
    1. `machine.gradient_boosting_regressor(50, 0.5, 1)`: **50** trees, each adds **half** (`0.5`) of what it says, and each tree has **one question** (`max_depth = 1`).
    2. `initial_prediction_` is the starting point: the average, `25.0`.
    3. In the end it predicts exactly `10.0` and `40.0`: score `1.0`.

### The maths with small numbers { #gradientboostingregressor-math }

The first tree, by hand:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-by-hand.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-by-hand.expec"
```

1. It starts at the average: `25`.
2. The **residuals** are what's missing: on the left `-15` and `-5`, on the right `5` and `15`.
3. A single-question tree predicts each side's average: `-10` and `10`.
4. **Half** is added: 25 + 0.5 × (−10) = `20` and 25 + 0.5 × 10 = `30`.

And how the prediction for the first flat (real price 10) improves as trees are added:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-steps.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-steps.expec"
```

??? info "For the curious 🤓"
    With $F_0 = \bar{y}$, each step computes $r_i = y_i - F_{t-1}(x_i)$, trains a tree $h_t$ on the $r_i$ and updates $F_t = F_{t-1} + \eta\,h_t$. It's called *gradient* because, with squared error, the residual $r_i$ is exactly the direction in which the error drops fastest: it's **gradient descent** in the space of functions. A small $\eta$ (`learning_rate`) needs more trees but usually generalises better. The code is in `src/lib/KafeMACHINE/ensemble/GradientBoosting.py`.

### API { #gradient_boosting_regressor }

| Call | What it does |
|---|---|
| `machine.gradient_boosting_regressor(n_estimators, learning_rate, max_depth)` | Creates the model. Defaults: `100` trees, `learning_rate = 0.1`, `max_depth = 3`. |
| `model.fit` / `predict` / `score` | Learn, predict, and the $R^2$ score. |
| `model.initial_prediction_` | The starting point (the average). |

??? warning "Common mistake: predicting before training"
    ```kafe
    --8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-not-fitted.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gradient_boosting_regressor-not-fitted.error.stderr.expec"
    ```

## GradientBoostingClassifier: nudge the probabilities { #gradientboostingclassifier }

### The idea in one sentence

The same fix-what's-left idea, but for **two groups**: the model keeps a score that goes through the S curve of [logistic regression](classifiers.md#logisticregression), and each tree **nudges** each example's probability towards its correct answer.

### An everyday comparison

A weather forecaster starts by saying "33 % chance of rain" for every day, because it rained on 2 out of 6. Then they look at temperature and humidity and adjust: dry days go down, humid days go up.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/machine-gradient-boosting-classifier.svg"
<figcaption>Six days on a probability-of-rain axis. They all start at 0.33. With 1, 3 and 20 trees, the four dry days (circles) drift left, to between 0.11 and 0.18, and the two rainy days (squares) cross one half and reach 0.82 and 0.76.</figcaption>
</figure>

### Your first classification Gradient Boosting

Each day has `[temperature, humidity]`; `1` = it rained:

```kafe
--8<-- "tests/DocsExamples/machine/gradient_boosting_classifier.kf"
```

```text
--8<-- "tests/DocsExamples/machine/gradient_boosting_classifier.expec"
```

!!! tip "What happened here?"
    1. `machine.gradient_boosting_classifier(20, 0.5, 2)`: 20 trees of up to 2 questions, each adding half.
    2. `initial_prediction_` is `-0.69`: the starting point on the S-curve scale. Since it rained on 2 of 6 days, $\ln(2/4) = -0.69$, which the curve turns into **0.33**.
    3. It classified all 6 days and the two new days correctly.

At each step, an example's residual is $y - p$: the answer (0 or 1) minus the current probability. In the end, the model says `1` if the probability is 0.5 or more.

### API { #gradient_boosting_classifier }

| Call | What it does |
|---|---|
| `machine.gradient_boosting_classifier(n_estimators, learning_rate, max_depth)` | Same as the regressor. |
| `model.fit` / `predict` / `score` | Learn, classify, and accuracy. |
| `model.classes_` / `model.initial_prediction_` | The two groups and the starting point. |

??? warning "Common mistake: a single group"
    It needs exactly two groups in `y`:

    ```kafe
    --8<-- "tests/DocsExamples/machine/gradient_boosting_classifier-one-class.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/machine/gradient_boosting_classifier-one-class.error.stderr.expec"
    ```

| | Random Forest | AdaBoost | Gradient Boosting |
|---|---|---|---|
| Trees | Large, in parallel | Single-question, in a row | Small, in a row |
| Each new tree… | Knows nothing of the others | Focuses on the missed examples | Predicts what's left |
| Combined by | Vote or average | Weighted vote | Sum of small steps |

!!! tip "What did you learn on this page?"
    - **K-Means** moves centres; **DBSCAN** looks for crowded areas; **Agglomerative** joins the closest; **GaussianMixture** shares probabilities among bells.
    - In clustering, group numbers are just names.
    - **AdaBoost** insists on what it got wrong and **Gradient Boosting** fixes what's left, tree after tree.
