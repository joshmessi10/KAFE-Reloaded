# MACHINE · Preprocesamiento y reducción

[Return to Index](../machine.md)

[Pinned KAFE call contracts and limits](contracts.md) distinguish the supported DSL from Python backend options. Every `fit` below returns the same `MACHINE`; transformed PARDOS inputs retain PARDOS output, while matrix inputs retain matrix output.

## StandardScaler

Standardizes features by removing the mean and scaling to unit variance (z-score): $z = (x - \mu) / \sigma$.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ss.fit(X)` | `(List[List[NUM]]) -> MACHINE` | Calculates the mean and standard deviation |
| `ss.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Standardizes the data |
| `ss.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `ss.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the standardization |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ss.mean_` | `List[FLOAT]` | Mean of each feature |
| `ss.scale_` | `List[FLOAT]` | Standard deviation of each feature |

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 4.0], [3.0, 6.0], [5.0, 8.0]];

MACHINE ss = machine.standard_scaler();
List[List[FLOAT]] scaled = ss.fit_transform(data);
show(scaled);  -- [[-1.224..., -1.224...], [0.0, 0.0], [1.224..., 1.224...]]

List[List[FLOAT]] original = ss.inverse_transform(scaled);
show(original);  -- [[1.0, 4.0], [3.0, 6.0], [5.0, 8.0]]
```

---

## MinMaxScaler

Scales features to a fixed range (by default, [0, 1]): $X_{norm} = (X - X_{min}) / (X_{max} - X_{min})$.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `mms.fit(X)` | `(List[List[NUM]]) -> MACHINE` | Calculates the minimum and maximum |
| `mms.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Scales the data |
| `mms.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `mms.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the scaling |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `mms.data_min_` | `List[FLOAT]` | Minimum of each feature |
| `mms.data_max_` | `List[FLOAT]` | Maximum of each feature |
| `mms.scale_` | `List[FLOAT]` | Scale of each feature (1 / range) |

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]];

MACHINE mms = machine.minmax_scaler();
List[List[FLOAT]] scaled = mms.fit_transform(data);
show(scaled);  -- [[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]]
```

---

## RobustScaler

Scales features using statistics that are robust to outliers: the median (Q2) for centering and the IQR (Q3 − Q1) for scaling.

### Theory

Unlike StandardScaler (which uses the mean and standard deviation) or MinMaxScaler (which uses the minimum and maximum), RobustScaler uses statistics that are not affected by extreme values:

$$X_{scaled} = \frac{X - \text{median}}{IQR}$$

Here, $\text{median} = Q2$ (the 50th percentile) and $IQR = Q3 - Q1$ (the 75th percentile − the 25th percentile).

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `rs.fit(X)` | `(List[List[NUM]]) -> MACHINE` | Calculates the median and IQR for each feature |
| `rs.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Scales the data |
| `rs.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `rs.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the scaling |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `rs.center_` | `List[FLOAT]` | Median of each feature |
| `rs.scale_` | `List[FLOAT]` | IQR of each feature |

### Constructor Parameters

```kafe
-- with_centering=1 (centers using the median), with_scaling=1 (scales using the IQR)
-- The backend defaults are quantile_low=25.0 and quantile_high=75.0.
MACHINE rs = machine.robust_scaler();
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `with_centering` | INT | 1 | If 1, centers using the median (0 = no centering) |
| `with_scaling` | INT | 1 | If 1, scales using the IQR (0 = no scaling) |
| `quantile_low` | INT when supplied | 25.0 internally | Optional third positional argument |

The current KAFE gate accepts zero, one, two or three **INT** arguments. For example, `machine.robust_scaler(1, 1, 20)` changes the lower percentile. It rejects a FLOAT third argument and rejects a fourth argument; the upper percentile stays at the backend default 75.0. Do not pass Python keyword arguments or advertise a configurable fourth percentile. At least one of centering/scaling must be enabled, and the quantile range must be valid.

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]];

MACHINE rs = machine.robust_scaler();
List[List[FLOAT]] scaled = rs.fit_transform(data);
show(rs.center_);   -- [3.0, 6.0] (medians)
show(rs.scale_);    -- [2.0, 48.0] (interpolated IQRs)

List[List[FLOAT]] restored = rs.inverse_transform(scaled);
show(restored);  -- [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]]
```

### Comparison with Other Scalers

| Scaler | Center | Scale | Robust to outliers |
|--------|--------|-------|-------------------:|
| StandardScaler | Mean | Standard deviation | No |
| MinMaxScaler | Min | Max − Min | No |
| **RobustScaler** | **Median** | **IQR** | **Yes** |

### When to Use

- **Outliers are present** — the primary use case
- Data with a skewed distribution
- When the mean/standard deviation are not representative

---

## SimpleImputer

Imputes missing values in PARDOS or nested matrix input using a configurable strategy. Use `math.nan` for a missing numeric value in a pure KAFE example; backend None is also treated as missing.

### Strategies

| Strategy | Description |
|----------|-------------|
| `"mean"` | Fills with the mean of each column |
| `"median"` | Fills with the median of each column |
| `"most_frequent"` | Fills with the mode of each column |
| `"constant"` | Fills with a constant value (use `simple_imputer_constant(v)`) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `imp.fit(X)` | `(PARDOS or matrix) -> MACHINE` | Calculates per-column statistics. All-missing columns fail outside the constant strategy |
| `imp.transform(X)` | `(PARDOS or matrix) -> same container form` | Imputes missing values |
| `imp.fit_transform(X)` | `(PARDOS or matrix) -> same container form` | Fit + transform |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `imp.statistics_` | List of fill values | Numeric statistics or the selected constant/category value per column |

### Example

```kafe
import pardos;
import machine;

PARDOS df = pardos.read_csv("data.csv");
-- df contains: [[2.0, 6.0, 5.0], [4.0, nan, 5.0], [6.0, 12.0, nan], [4.0, 6.0, 5.0]]

MACHINE imp = machine.simple_imputer("mean");
PARDOS imputed = imp.fit_transform(df);
show(imputed);
-- [[2.0, 6.0, 5.0], [4.0, 8.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]

-- Constant strategy
MACHINE imp_c = machine.simple_imputer_constant(0.0);
PARDOS imputed_c = imp_c.fit_transform(df);
```

---

## LabelEncoder

Encodes text labels as ordinal integer values.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `le.fit(labels)` | `(List[ANY]) -> MACHINE` | Learns the unique classes (sorted) |
| `le.transform(labels)` | `(List[ANY]) -> List[INT]` | Converts labels to integers |
| `le.fit_transform(labels)` | `(List[ANY]) -> List[INT]` | Fit + transform in one step |
| `le.inverse_transform(encoded)` | `(List[INT]) -> List[STR]` | Converts integers back to labels |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `le.classes_` | `List[STR]` | Sorted list of unique classes |

### Example

```kafe
import machine;

MACHINE le = machine.label_encoder();

List[STR] labels = ["cat", "dog", "bird", "cat", "bird"];
le.fit(labels);
show(le.classes_);  -- [bird, cat, dog]

List[INT] encoded = le.transform(labels);
show(encoded);  -- [1, 2, 0, 1, 0]

List[STR] decoded = le.inverse_transform(encoded);
show(decoded);  -- [cat, dog, bird, cat, bird]
```

---

## OneHotEncoder

Encodes categorical DataFrame columns as a binary (one-hot) representation.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ohe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Learns categories from selected columns |
| `ohe.transform(df)` | `(PARDOS) -> PARDOS` | Transforms the DataFrame using one-hot encoding |
| `ohe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform |
| `ohe.inverse_transform(df)` | `(PARDOS) -> PARDOS` | Restores categories; each encoded group must have exactly one active category |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["color", "size"];
List[List[STR]] data = [
    ["red", "S"],
    ["blue", "M"],
    ["green", "L"],
    ["red", "M"]
];
PARDOS df = pardos.DataFrame(cols, data);

-- One-hot encode a single column
MACHINE ohe = machine.one_hot_encoder();
PARDOS encoded = ohe.fit_transform(df, ["color"]);
show(encoded);
-- Columns: size, color_blue, color_green, color_red
-- Rows: [[S,0,0,1], [M,1,0,0], [L,0,1,0], [M,0,0,1]]

-- Multiple columns
MACHINE ohe2 = machine.one_hot_encoder();
PARDOS encoded2 = ohe2.fit_transform(df, ["color", "size"]);
show(encoded2);
```

---

## OrdinalEncoder

Encodes categorical DataFrame columns as ordinal integer values, ordered alphabetically by category.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `oe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Learns the sorted unique categories in the specified columns |
| `oe.transform(df)` | `(PARDOS) -> PARDOS` | Transforms categorical columns into ordinal integer values |
| `oe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform in one step |
| `oe.inverse_transform(df)` | `(PARDOS) -> PARDOS` | Converts ordinal values back to the original categories |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `oe.categories_` | Backend mapping | Mapping of columns to lists of sorted categories |
| `oe.columns_` | `List[STR]` | Names of the encoded columns |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["color", "size"];
List[List[STR]] data = [
    ["red", "S"],
    ["blue", "M"],
    ["green", "L"],
    ["red", "M"]
];
PARDOS df = pardos.DataFrame(cols, data);

-- Ordinal-encode a single column
MACHINE oe = machine.ordinal_encoder();
PARDOS encoded = oe.fit_transform(df, ["color"]);
show(encoded);
-- Columns: color, size
-- Rows: [[2, S], [0, M], [1, L], [2, M]]
-- Categories sorted alphabetically: blue=0, green=1, red=2

-- Multiple columns
MACHINE oe2 = machine.ordinal_encoder();
PARDOS encoded2 = oe2.fit_transform(df, ["color", "size"]);

-- Reverse the encoding
PARDOS decoded = oe2.inverse_transform(encoded2);
show(decoded);
```

---

## PCA (Principal Component Analysis)

Reduces data dimensionality by finding the directions of greatest variance using the Jacobi algorithm.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `pca.fit(X)` | `(PARDOS or List[List[NUM]]) -> MACHINE` | Fits the model to the data |
| `pca.transform(X)` | `(PARDOS or List[List[NUM]]) -> same container form` | Transforms data into principal components |
| `pca.fit_transform(X)` | `(PARDOS or matrix) -> same container form` | Fit and project |
| `pca.inverse_transform(X)` | `(PARDOS or matrix) -> same container form` | Reconstructs an approximation from the retained components |
| `pca.round(n)` | `(INT) -> MACHINE` | Rounds internal values to n decimal places |

`pca.round()` uses four decimals by default. It changes fitted state and returns the same receiver.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pca.components_` | `List[List[FLOAT]]` | Eigenvectors (components) |
| `pca.mean_` | `List[FLOAT]` | Mean of each feature |
| `pca.explained_variance_` | `List[FLOAT]` | Variance explained by each component |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["X", "Y", "Z"];
List[List[FLOAT]] data = [
    [1.0, 1.0, 2.5],
    [2.0, 1.0, 4.5],
    [3.0, 2.0, 7.0],
    [1.0, 2.0, 3.0],
    [2.0, 2.0, 5.0],
    [3.0, 1.0, 6.5]
];

PARDOS df = pardos.DataFrame(cols, data);

-- Reduce from 3D to 2D
MACHINE pca_model = machine.pca(2);
pca_model.fit(df);
pca_model.round(4);

show(pca_model.mean_);
show(pca_model.explained_variance_);

PARDOS reduced = pca_model.transform(df);
show(reduced.round(4));
```

### Internal Algorithm

PCA uses the **Jacobi algorithm** to calculate eigenvalues and eigenvectors:

1. **Mean centering**: Subtract the mean of each feature
2. **Covariance matrix**: $C = (X^T \cdot X) / (n - 1)$
3. **Jacobi**: Iterations to diagonalize the covariance matrix
4. **Sorting**: Sort components by explained variance (descending)

---

## LinearDiscriminantAnalysis (Linear Discriminant Analysis)

Implements LDA, a supervised dimensionality-reduction technique that maximizes class separation and also works as a linear classifier.

### Theory

LDA maximizes the ratio of between-class to within-class variance:

$$J(w) = \frac{w^T S_B w}{w^T S_W w}$$

Where:
- $S_W = \sum_{k=1}^{K} \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$ — within-class scatter
- $S_B = \sum_{k=1}^{K} n_k (\mu_k - \mu)(\mu_k - \mu)^T$ — between-class scatter

**Solution**: Solve the eigenvalue problem $S_W^{-1} S_B w = \lambda w$. The eigenvectors with the largest eigenvalues are the optimal directions.

**Constraint**: $n\_components \leq K - 1$ (at most the number of classes minus one components).

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `lda.fit(X, y)` | `(List[List[NUM]], List[INT]) -> MACHINE` | Fits LDA by calculating scatter matrices and eigenvectors |
| `lda.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Projects data into a lower-dimensional space |
| `lda.fit_transform(X, y)` | `(List[List[NUM]], List[INT]) -> List[List[FLOAT]]` | Fit + transform in one step |
| `lda.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes by distance in the projected space |
| `lda.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy (default) or a custom metric |

### Constructor Parameters

```kafe
-- n_components: number of components (default: None = min(n_classes-1, n_features))
MACHINE lda = machine.linear_discriminant_analysis(2);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_components` | INT | None | Number of components (max: n_classes - 1) |

Only the component count is a KAFE factory argument. Backend solver/covariance options are not exposed. The current Jacobi implementation assumes at least two input features; a one-feature fit fails with an index error despite the broad numeric input gate.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `lda.scalings_` | `List[List[FLOAT]]` | Eigenvectors (projection directions) |
| `lda.explained_variance_ratio_` | `List[FLOAT]` | Proportion of variance explained by each component |
| `lda.means_` | `List[List[FLOAT]]` | Mean of each feature for each class |
| `lda.classes_` | `List[INT]` | Unique classes |
| `lda.prior_` | `List[FLOAT]` | Prior probability of each class |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Reduce from 2D to 1D
MACHINE lda = machine.linear_discriminant_analysis(1);
lda.fit(X, y);

-- Transform into the projected space
List[List[FLOAT]] X_proj = lda.transform(X);
show(X_proj);

-- Classify
List[INT] preds = lda.predict([[2.0, 2.0], [7.0, 7.0]]);
show(preds);  -- [0, 1]

-- Evaluate
FLOAT acc = lda.score(X, y);
show(acc);  -- 1.0
```

### Comparison with PCA

| Aspect | PCA | LDA |
|--------|-----|-----|
| Objective | Maximize total variance | Maximize class separation |
| Supervision | Unsupervised | Supervised |
| Input | X only | X and y |
| Directions | Components with the greatest variance | Directions with the greatest discrimination |
| n_components | ≤ d (features) | ≤ K - 1 (classes - 1) |
| Main use | Visualization, noise reduction | Classification, supervised reduction |

### Internal Algorithm

1. **Calculate per-class means**: Mean of each feature for each class
2. **Within-class scatter ($S_W$)**: Sum of outer products $(x - \mu_k)(x - \mu_k)^T$
3. **Between-class scatter ($S_B$)**: Weighted sum of outer products of means
4. **Invert $S_W$**: Gauss-Jordan elimination with partial pivoting
5. **Product $M = S_W^{-1} S_B$**: Combined matrix
6. **Jacobi**: Diagonalize the symmetrized $M$ to obtain eigenvalues and eigenvectors
7. **Sort**: Select eigenvectors with the largest eigenvalues
8. **Project**: $Y = X \cdot W$

### When to Use

- Classification with linearly separable classes
- Supervised dimensionality reduction (preprocessing)
- Data with Gaussian distributions for each class
- When the projection directions need to be interpretable

### When Not to Use

- Nonlinear relationships (use Kernel LDA)
- Classes with very different covariances (use QDA)
- Categorical data without transformation

---

## PolynomialFeatures

Generates polynomial features up to a specified degree, allowing linear models to capture nonlinear relationships.

### Theory

For $d$ features and degree $n$, it generates all combinations of powers $p_1 + p_2 + \cdots + p_d \leq n$:

$$[x_1, x_2] \xrightarrow{\text{degree}=2} [1, x_2, x_2^2, x_1, x_1 x_2, x_1^2]$$

Number of output features (with bias): $\binom{d+n}{n} = \frac{(d+n)!}{d! \cdot n!}$

**Example** with degree=2 and 2 features:

| Feature | Powers | Value |
|---------|--------|-------|
| 1 (bias) | $(0,0)$ | $1$ |
| x1 | $(0,1)$ | $x_2$ |
| x1² | $(0,2)$ | $x_2^2$ |
| x0 | $(1,0)$ | $x_1$ |
| x0*x1 | $(1,1)$ | $x_1 \cdot x_2$ |
| x0² | $(2,0)$ | $x_1^2$ |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `pf.fit(data)` | `(List[List[NUM]] or PARDOS) -> MACHINE` | Fits PolynomialFeatures (calculates dimensions) |
| `pf.transform(data)` | `(List[List[NUM]] or PARDOS) -> List[List[FLOAT]]` | Transforms features into polynomial features |
| `pf.fit_transform(data)` | `(List[List[NUM]] or PARDOS) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- degree=2, include_bias=True (default values)
MACHINE pf = machine.polynomial_features(2, True);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `degree` | INT | 2 | Maximum polynomial degree |
| `include_bias` | BOOL | `True` | Whether to include a bias column (ones) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pf.n_features_in_` | `INT` | Number of input features |
| `pf.n_features_out_` | `INT` | Number of output features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

MACHINE pf = machine.polynomial_features(2, True);
List[List[FLOAT]] X_poly = pf.fit_transform(X);

show(pf.n_features_in_);   -- 2
show(pf.n_features_out_);  -- 6 (1 bias + 2 original + 3 polynomial)

```

This is a feature-expansion example. Training a regression model additionally needs declared targets and enough independent training samples; a tiny expanded or collinear matrix can make ordinary least squares singular. Output column ordering is the KAFE implementation ordering above, not an assumed sklearn ordering.

### Comparison with a Simple Linear Model

| Aspect | Linear Regression | PolynomialFeatures + Linear Regression |
|--------|-------------------|----------------------------------------|
| Relationships captured | Linear only | Linear + polynomial |
| Number of features | $d$ | $\binom{d+n}{n}$ |
| Overfitting | Low | Possible if the degree is high |
| Scaling required | Optional | Recommended |

### Limitations

- **Curse of dimensionality**: The number of features grows exponentially with the degree
- **Overfitting**: A high degree can memorize noise
- **Not invertible**: `inverse_transform` is not implemented
- **Multicollinearity**: Polynomial features are highly correlated

---

## VarianceThreshold

Removes features with variance below a threshold. This unsupervised feature-selection method filters constant or nearly constant features.

### Theory

For each feature $j$, it calculates the population variance:

$$\text{Var}(j) = \frac{1}{n} \sum_{i=1}^{n} (x_{ij} - \bar{x}_j)^2$$

**Selection rule**: Keep feature $j$ if $\text{Var}(j) > \text{threshold}$.

- Feature with variance 0 → constant → no information
- Feature with low variance → little discriminatory power
- Default threshold: 0.0 (removes only constant features)

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `vt.fit(X)` | `(List[List[NUM]]) -> MACHINE` | Calculates variances and selects features |
| `vt.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Removes low-variance features |
| `vt.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- threshold=0.0 (default value)
MACHINE vt = machine.variance_threshold(0.0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | FLOAT | 0.0 | Minimum variance threshold (non-negative) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `vt.variances_` | `List[FLOAT]` | Variance of each feature |
| `vt.selected_indices_` | `List[INT]` | Indices of the selected features |
| `vt.n_features_in_` | `INT` | Number of input features |
| `vt.n_features_out_` | `INT` | Number of output features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0, 3.0],
                        [2.0, 0.0, 6.0],
                        [3.0, 0.0, 9.0],
                        [4.0, 0.0, 12.0]];

-- Remove constant features (threshold=0)
MACHINE vt = machine.variance_threshold(0.0);
List[List[FLOAT]] X_new = vt.fit_transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0]]

show(vt.variances_);       -- [1.25, 0.0, 10.125]
show(vt.selected_indices_); -- [0, 2]
show(vt.n_features_out_);   -- 2
```

### Comparison with Other Methods

| Aspect | VarianceThreshold | Lasso (L1) | RFE |
|--------|-------------------|------------|-----|
| Type | Filter (unsupervised) | Embedded (supervised) | Wrapper (supervised) |
| Requires y | No | Yes | Yes |
| Speed | Very fast | Fast | Slow |
| Detects interactions | No | Partially | Yes |
| Computational cost | $O(n \cdot d)$ | $O(n \cdot d \cdot iter)$ | $O(d \cdot T_{model} \cdot (d-k))$ |

---

## RecursiveFeatureElimination (RFE)

Selects features by recursive elimination using the factory's fixed linear-regression estimator. It repeatedly trains that model and removes the least important feature until the desired number remains. The Python class can receive another estimator, but that constructor capability is not exposed by the KAFE factory.

### Theory

RFE is a **wrapper method** that uses an estimator to evaluate feature importance:

1. Train the estimator with all active features
2. Calculate importance: $\text{importance}_j = |w_j|$ for linear models
3. Remove the least important feature
4. Repeat until $k$ features remain

**Ranking**: Features removed first receive a high rank (less important). The remaining features receive rank 1.

- **Time complexity**: $O(d \cdot T_{model} \cdot (d - k))$, where $T_{model}$ is the training time
- **Space**: $O(d)$ for ranking and support

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `rfe.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> MACHINE` | Recursively trains and selects features |
| `rfe.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Selects only the chosen features |
| `rfe.fit_transform(X, y)` | `(List[List[NUM]], List[NUM]) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- Default linear estimator; select two features.
MACHINE rfe = machine.recursive_feature_elimination(2);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_features` | INT | 1 | Number of features to select |
| `max_iter` | INT | 100 | Accepted second positional argument; currently ignored |

The valid positional forms are `machine.recursive_feature_elimination()`, `(n_features)` and `(n_features, max_iter)`. Passing a `MACHINE` estimator is rejected. Use nonsingular training features; an intermediate linear fit can fail on a singular matrix. `inverse_transform` is explicitly unimplemented.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `rfe.selected_indices_` | `List[INT]` | Indices of the selected features |
| `rfe.ranking_` | `List[INT]` | Importance ranking (1 = most important) |
| `rfe.support_` | `List[BOOL]` | Boolean mask of the selected features |
| `rfe.n_features_in_` | `INT` | Number of input features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[5.0, 0.1, 3.0], [4.0, 9.2, 6.0],
                     [7.0, 0.3, 1.0], [10.0, 4.4, 8.0]];
List[FLOAT] y = [1.0, 2.0, 3.0, 4.0];

-- Select the 2 best features
MACHINE rfe = machine.recursive_feature_elimination(2);
rfe.fit(X, y);

show(rfe.selected_indices_); -- [0, 2]
show(rfe.support_);          -- [True, False, True]

List[List[FLOAT]] X_new = rfe.transform(X);
show(len(X_new[0]));  -- 2
```

### Comparison with Other Methods

| Aspect | RFE | VarianceThreshold | Lasso (L1) |
|--------|-----|-------------------|------------|
| Type | Wrapper | Filter | Embedded |
| Requires y | Yes | No | Yes |
| Speed | Slow | Very fast | Fast |
| Detects interactions | Yes | No | Partially |
| Instability | High | None | Medium |
| KAFE factory base model | Fixed linear regression | None | Linear |

---

## Tokenizer

`machine.tokenizer()` accepts optional positional `num_words: INT` and then `oov_token: STR`. A nonnegative word limit of 0 keeps all words. `fit(texts)` returns the same MACHINE and replaces its previous vocabulary. `transform(texts)` and `fit_transform(texts)` return one integer sequence per string.

```kafe
import machine;

MACHINE tokens = machine.tokenizer(10, "<oov>");
show(tokens.fit_transform(["red red blue", "blue green"]));
show(tokens.transform(["new red"]));
show(tokens.vocabulary_size);
```

Expected output:

```text
[[2, 2, 3], [3, 4]]
[[1, 2]]
5
```

The word order is descending training frequency with first occurrence breaking ties. Index 0 is reserved for padding; a nonempty OOV token uses index 1, and known words start at 2. Without an OOV token unknown words are skipped. `vocabulary_size` includes the reserved indices and can supply an embedding input size. `word_index` and `index_word` are backend mappings, not a KAFE `Dict` declaration type.

Tokenization lowercases and splits with ASCII `[a-z0-9]`. Accents and other characters can split a word; the implementation does not preserve arbitrary Unicode words or provide stemming/stop-word configuration. Fit requires a nonempty list of strings; transform requires fit first. See the [call contracts](contracts.md) for shape and method boundaries.
