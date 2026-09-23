# Loss Functions (Funciones de Pérdida)

## Category

Deep Learning — Componente de red neuronal

## Description

Las funciones de pérdida (loss functions) cuantifican qué tan "equivocado" está el modelo. Miden la discrepancia entre las predicciones $\hat{y}$ y los valores reales $y$. El objetivo del entrenamiento es **minimizar** esta función.

KafeGESHA implementa 5 funciones de pérdida desde cero:

| Función | Fórmula | Uso principal |
|---|---|---|
| MSE | $\frac{1}{n}\sum(y_i - \hat{y}_i)^2$ | Regresión |
| MAE | $\frac{1}{n}\sum\|y_i - \hat{y}_i\|$ | Regresión (robusta) |
| Binary Cross-Entropy | $-\frac{1}{n}\sum[y_i\log(\hat{y}_i) + (1-y_i)\log(1-\hat{y}_i)]$ | Binary classification |
| Categorical Cross-Entropy | $-\frac{1}{n}\sum\sum y_{ij}\log(\hat{y}_{ij})$ | Multiclass classification |
| Sparse Categorical CE | $-\frac{1}{n}\sum\log(\hat{y}_{y_i})$ | Multiclass (etiquetas enteras) |

Cada función implementa dos métodos:
- `compute(y_true, y_pred)` → valor escalar de pérdida
- `derivative(y_true, y_pred)` → gradiente $\frac{\partial L}{\partial \hat{y}}$

## Mathematical Foundation

### Mean Squared Error (MSE)

$$L_{\text{MSE}} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$

**Derivada**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{2(\hat{y}_i - y_i)}{n}$$

**Propiedades**:
- Penaliza errores grandes de forma cuadrática (sensible a outliers)
- Derivada lineal → gradientes proporcionales al error
- Mínimo analítico en $\hat{y} = y$
- Equivalente a asumir errores distribuidos normalmente

### Mean Absolute Error (MAE)

$$L_{\text{MAE}} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|$$

**Derivada**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{1}{n} \cdot \frac{\hat{y}_i - y_i}{|\hat{y}_i - y_i|} = \begin{cases} \frac{1}{n} & \text{si } \hat{y}_i > y_i \\ -\frac{1}{n} & \text{si } \hat{y}_i < y_i \\ 0 & \text{si } \hat{y}_i = y_i \end{cases}$$

**Propiedades**:
- Robusta ante outliers (penalización lineal)
- Derivada constante (signo del error) → no diferencia errores grandes de pequeños
- Equivalente a asumir errores distribuidos laplacianamente

### Binary Cross-Entropy (BCE)

$$L_{\text{BCE}} = -\frac{1}{n} \sum_{i=1}^{n} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$

**Derivada**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{\hat{y}_i - y_i}{\hat{y}_i(1 - \hat{y}_i) + \epsilon}$$

**Propiedades**:
- Asumida probabilidad $\hat{y}_i \in (0, 1)$
- Penaliza fuertemente predicciones confiadas y equivocadas
- Derivada estable gracias al epsilon de clipping
- Equivalente a maximum likelihood para distribución de Bernoulli

### Categorical Cross-Entropy (CCE)

$$L_{\text{CCE}} = -\frac{1}{n} \sum_{i=1}^{n} \sum_{j=1}^{k} y_{ij} \log(\hat{y}_{ij})$$

**Derivada**:

$$\frac{\partial L}{\partial \hat{y}_{ij}} = \hat{y}_{ij} - y_{ij}$$

**Propiedades**:
- $y$ es one-hot encoded (solo un $y_{ij} = 1$)
- Combinada con Softmax: la derivada se simplifica a $\hat{y} - y$
- Estable numéricamente gracias al epsilon

### Sparse Categorical Cross-Entropy

$$L_{\text{SCCE}} = -\frac{1}{n} \sum_{i=1}^{n} \log(\hat{y}_{y_i})$$

**Derivada**:

$$\frac{\partial L}{\partial \hat{y}_{ij}} = \begin{cases} \hat{y}_{ij} - 1 & \text{si } j = y_i \\ \hat{y}_{ij} & \text{si } j \neq y_i \end{cases}$$

**Propiedades**:
- Equivalente a CCE pero acepta etiqueta entera en lugar de one-hot
- Más eficiente en memoria para muchos clases
- La derivada es la misma que CCE cuando se combina con Softmax

## Step-by-Step Algorithm

### MSE — Forward

1. Recibir vectores $y_{\text{true}}$ y $y_{\text{pred}}$, ambos de longitud $n$.
2. Para cada par $(y_i, \hat{y}_i)$, calcular error cuadrático: $(y_i - \hat{y}_i)^2$.
3. Promediar: $L = \frac{1}{n} \sum (y_i - \hat{y}_i)^2$.

### MSE — Backward

4. Para cada par, calcular gradiente: $\frac{2(\hat{y}_i - y_i)}{n}$.
5. Retornar vector de gradientes.

### Binary Cross-Entropy — Forward

6. Recibir $y_{\text{true}}$ y $y_{\text{pred}}$.
7. Para cada par:
   a. Clippear $\hat{y}_i$ al rango $(\epsilon, 1 - \epsilon)$.
   b. Calcular $-(y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i))$.
8. Promediar sobre $n$ muestras.

### Binary Cross-Entropy — Backward

9. Para cada par:
   a. Clippear $\hat{y}_i$.
   b. Calcular $\frac{\hat{y}_i - y_i}{\hat{y}_i(1 - \hat{y}_i) + \epsilon}$.
10. Retornar vector de gradientes.

### Categorical Cross-Entropy — Forward

11. Recibir matrices $Y_{\text{true}}$ y $Y_{\text{pred}}$ (one-hot).
12. Para cada muestra $i$:
    a. Calcular $-\sum_j y_{ij} \log(\hat{y}_{ij} + \epsilon)$.
13. Promediar sobre $n$.

### Categorical Cross-Entropy — Backward

14. Para cada muestra $i$ y clase $j$:
    a. Calcular $\hat{y}_{ij} - y_{ij}$.
15. Retornar matriz de gradientes.

## Motivation

La elección de la función de pérdida determina qué tan bien el modelo aprende un tipo de tarea específico. MSE es ideal para regresión pero inadecuada para clasificación (penalización cuadrática no alinea con la métrica de accuracy). Cross-Entropy es el estándar para clasificación porque sus gradientes son más informativos y estables. KafeGESHA implementa cada una desde cero para que el estudiante entienda por qué se usan funciones diferentes para tareas diferentes.

## Advantages

- **Clipping numérico**: BCE y CCE usan epsilon para evitar $\log(0)$, making el entrenamiento estable.
- **Derivadas simplificadas**: CCE + Softmax produce la derivada más elegante del deep learning: $\hat{y} - y$.
- **Compatibilidad con sparse labels**: SparseCCE permite usar etiquetas enteras sin one-hot, saving memoria.
- **Elección educativa**: Incluir MSE y MAE side-by-side permite comparar sus comportamientos ante outliers.

## Limitations

- **MSE sensible a outliers**: Un solo punto con error grande domina la pérdida.
- **MAE no diferenciable en cero**: $|x|$ no tiene derivada en $x = 0$; KafeGESHA usa 0 como convención.
- **BCE requiere probabilidades**: Si el modelo produce valores fuera de $(0,1)$, necesita clipping.
- **No incluye regularización**: Las funciones de pérdida de KafeGESHA no incorporan términos de regularización (L1/L2); esto se maneja en la capa Dense.

## When to Use

- **MSE**: Regresión cuando los errores grandes son significativamente peores que los pequeños.
- **MAE**: Regresión cuando hay outliers y se necesita robustez.
- **BCE**: Binary classification con salida sigmoid (probabilidad).
- **CCE**: Multiclass classification con salida Softmax y etiquetas one-hot.
- **SparseCCE**: Multiclass con etiquetas enteras (eficiente en memoria).

## When NOT to Use

- **MSE para clasificación**: Los gradientes de MSE son ineficientes para probabilidades (se "saturan" lejos del óptimo).
- **BCE para regresión**: BCE asume distribución de Bernoulli, no aplica a valores continuos.
- **CCE sin Softmax**: La derivada $\hat{y} - y$ solo es correcta cuando se combina con Softmax.

## Dependencies

- `lib.KafeMATH.functions` — `log()` (logaritmo natural), `math_abs()` (valor absoluto).

## Related Concepts

- `activation-functions.md` — Las funciones de activación producen las salidas que se evalúan con loss functions.
- `dense-layer.md` — Las capas Dense usan los gradientes de loss functions para backward.
- `optimizers.md` — Los optimizadores aplican los gradientes de loss functions para actualizar pesos.

## Relationship with KAFE

### Implementación en `LossFunction.py`

La clase abstracta `LossFunction` define el contrato:

```python
class LossFunction(ABC):
    def compute(self, y_true, y_pred) → float   # Pérdida promedio
    def derivative(self, y_true, y_pred) → list  # Gradiente ∂L/∂ŷ
```

### Decisión de diseño: Clipping en BCE

BinaryCrossEntropy introduce un epsilon por defecto de $10^{-8}$ y clippea las predicciones al rango $(\epsilon, 1-\epsilon)$. Esto previene $\log(0)$ que produciría $-\infty$. El mismo patrón se usa en CCE y SparseCCE.

### Decisión de設計: Derivada de CCE simplificada

La derivada de Categorical Cross-Entropy es simplemente $\hat{y}_{ij} - y_{ij}$. Esto es un resultado matemático elegante que ocurre cuando se combina CCE con Softmax. En KafeGESHA, la capa Dense aplica la Jacobiana de Softmax al gradiente de CCE, producing esta simplificación automáticamente.

### Decisión de diseño: SparseCCE acepta etiquetas enteras

`SparseCategoricalCrossEntropy` recibe `y_true` como vector de enteros (ej: `[0, 2, 1, 3]`) en lugar de one-hot. Internamente accede a $\hat{y}_{y_i}$ usando la etiqueta como índice. Esto ahorra memoria significativa cuando hay muchas clases.

### Decisión de diseño: MSE y MAE como base para regresión

MSE y MAE son las funciones de pérdida estándar para regresión en KafeGESHA. No incluyen Huber Loss (que combina MSE y MAE), pero esto podría agregarse en el futuro.

## Usage Examples

```kafe
import gesha;

-- Regresión con MSE
GESHA reg = gesha.deep("regression");
reg.add(gesha.dense(16, activation: "relu", input_shape: [3]));
reg.add(gesha.dense(1, activation: "identity"));
reg.compile(optimizer: "sgd", loss: "mse");
reg.fit(x_train, y_train, epochs: 50);

-- Binary classification con Binary Cross-Entropy
GESHA bin_model = gesha.deep("binary");
bin_model.add(gesha.dense(8, activation: "relu", input_shape: [4]));
bin_model.add(gesha.dense(1, activation: "sigmoid"));
bin_model.compile(optimizer: "adam", loss: "binary_crossentropy");

-- Multiclass con Categorical Cross-Entropy
GESHA multi = gesha.deep("classification");
multi.add(gesha.dense(32, activation: "relu", input_shape: [784]));
multi.add(gesha.dense(10, activation: "softmax"));
multi.compile(optimizer: "adam", loss: "categorical_crossentropy");
```

## Implementation Location

- `src/lib/KafeGESHA/LossFunction.py` — clases `MeanSquaredError`, `MeanAbsoluteError`, `BinaryCrossEntropy`, `CategoricalCrossEntropy`, `SparseCategoricalCrossEntropy`
- `src/lib/KafeGESHA/GeshaDeep.py` — mapeo de strings a objetos de pérdida en `compile()`

## Public API

- Nombres en `compile()`: `"mse"`, `"mae"`, `"binary_crossentropy"`, `"categorical_crossentropy"`, `"sparse_categorical_crossentropy"`
- Método: `compute(y_true, y_pred)` → float (pérdida promedio)
- Método: `derivative(y_true, y_pred)` → list (gradientes)

## References

- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning, Chapter 5.5: Output Units. MIT Press.
- Bishop, C. M. (2006). Pattern Recognition and Machine Learning, Chapter 4.3: Bayesian Linear Regression.
- De Boer, P. T., et al. (2005). A tutorial on the cross-entropy method. Annals of Operations Research, 134(1), 19-67.
- Rubinstein, R. (1999). The cross-entropy method for combinatorial and continuous optimization. Methodology and Computing in Applied Probability, 1(2), 127-190.
