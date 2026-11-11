# What is learning from data?

## The idea in one sentence

**Machine Learning** means teaching the computer with **examples** instead of writing every rule for it.

## An everyday comparison

When you were little, nobody gave you an exact rule to recognize a dog ("four legs, a tail, between this tall and that tall…"). You saw **lots of dogs**, someone told you "that is a dog" and your brain found the pattern on its own. Today you recognize dogs you have never seen before.

A Machine Learning model does the same thing:

1. You give it **examples** with their correct answer (the **training data**).
2. The model looks for a **pattern** that connects the data with the answers. This is called **training**.
3. You give it a new case and the model **predicts** the answer using the pattern.

## New words

| Word | What it means | Example |
|---|---|---|
| **Data point** or example | One observation | A student |
| **Feature** | What we measure for each data point | Hours they studied |
| **Label** | The answer we want to predict | The grade they got |
| **Model** | The "machine" that learns the pattern | A straight line |
| **Train** (`fit`) | Find the pattern in the examples | Adjust the line |
| **Predict** (`predict`) | Use the pattern with new data | Guess the grade |

## Predicting a number: regression

We want to know what grade someone will get based on the hours they studied. We have five examples. The **linear regression** model looks for the straight line that best goes through the points and uses it to predict.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datos-recta.svg"
<figcaption>The examples appear, the model draws the line that best connects them and then uses it to predict the value for a new case (6 hours).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/aprende/datos-regresion.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/datos-regresion.en.expec"
```

!!! tip "What happened here?"
    1. `import machine;` brings in KAFE's Machine Learning library.
    2. `machine.linear_regression()` created an empty model that does not know anything yet.
    3. `model.fit(hours, grades)` **trained** it: it found that each hour of study adds 0.5 to the grade.
    4. `model.predict([6.0])` **predicted** the grade for 6 hours: 4.5.

!!! note "Why does it print 4.500000000000002 and not 4.5?"
    Computers store decimal numbers in binary, and some of them cannot be stored exactly, just like 1/3 = 0.3333… cannot be written exactly in decimal. That tiny difference is normal.

## Predicting a category: classification

Sometimes the answer is not a number but a **category**: grape or watermelon? spam or not spam? The **nearest neighbors** model (KNN) looks at the examples that are most similar to the new case and picks the category that appears most often among them.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datos-vecinos.svg"
<figcaption>A new point arrives (?). The model looks at its 3 nearest neighbors: all three are squares, so the new point is a square too.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/aprende/datos-clasificacion.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/datos-clasificacion.en.expec"
```

The 6.5 g fruit looks like the grapes (0) and the 3200 g one looks like the watermelons (1).

## How do I know if my model is good?

Just like a teacher does not test you with the same questions used to teach, we **split the data**: some to train and some, which the model has never seen, to **test**. Then we measure how well it did with **metrics** such as accuracy (the percentage of right answers). You will see it in [Model selection](../libraries/machine/selection.md) and [Functions and metrics](../libraries/machine/metrics.md).

## What did you learn?

- Machine Learning is learning patterns from **examples**.
- **Regression** predicts numbers and **classification** predicts categories.
- In KAFE: you create the model, train it with `fit` and predict with `predict`.

??? info "For the curious 🤓"
    Linear regression looks for the line $\hat{y} = w\,x + b$ that makes the **mean squared error** as small as possible:

    $$
    \text{MSE} = \frac{1}{n}\sum_{i=1}^{n} \left(y_i - \hat{y}_i\right)^2
    $$

    With our data it finds $w = 0.5$ and $b = 1.5$, so for $x = 6$: $\hat{y} = 0.5 \cdot 6 + 1.5 = 4.5$. KNN, on the other hand, does not learn a formula: it keeps the examples and measures **distances** when a new case arrives.

[Next lesson: What is a neuron? :material-arrow-right:](neuronas.md){ .md-button .md-button--primary }
