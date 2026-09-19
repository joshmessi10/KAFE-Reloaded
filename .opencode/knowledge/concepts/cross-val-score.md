# CrossValScore

## Name

CrossValScore

## Category

ML utility — model evaluation

## Description

CrossValScore evalúa un modelo usando k-fold cross-validation de forma orientada a objetos. Calcula scores por fold, promedio y desviación estándar, proporcionando una medida robusta del rendimiento del modelo.

## Mathematical Foundation

Dado un dataset de $n$ ejemplos y $k$ folds:

1. Barajar y particionar en $k$ folds $\{F_1, F_2, \ldots, F_k\}$
2. Para cada fold $i$:
   - Entrenar en $\bigcup_{j \neq i} F_j$
   - Evaluar en $F_i$ usando la métrica de scoring
3. Calcular: $\bar{s} = \frac{1}{k} \sum_{i=1}^k s_i$ y $\sigma = \sqrt{\frac{1}{k-1} \sum_{i=1}^k (s_i - \bar{s})^2}$

- **Time Complexity**: $O(k \cdot T_{\text{model}})$ donde $T_{\text{model}}$ es el tiempo de entrenamiento por fold
- **Space Complexity**: $O(n)$ para almacenar los folds

## Step-by-Step Algorithm

1. Recibir modelo, datos X, y, y número de folds k
2. Generar particiones de k-fold con shuffle
3. Para cada fold: separar train/test, ajustar modelo, calcular score
4. Almacenar scores, calcular promedio y desviación estándar

## Motivation

CrossValScore proporciona una forma estandarizada y reutilizable de evaluar modelos con cross-validation, encapsulando la lógica de partición y scoring en un solo objeto.

## Advantages

- Orientado a objetos (compatible con Pipeline y GridSearchCV)
- Múltiples métricas de scoring
- Desviación estándar para estimar varianza
- Reproducibilidad con random_state

## Limitations

- Solo métricas predefinidas (accuracy, r2, mse)
- No soporta custom scoring functions como k_fold_cross_validation

## When to Use

- Para evaluación rápida de modelos
- Como métrica de evaluación en GridSearchCV/RandomizedSearchCV
- Cuando se necesita desviación estándar del rendimiento

## When NOT to Use

- Cuando se necesita una métrica custom (usar k_fold_cross_validation con función personalizada)

## Dependencies

- k_fold (función de partición)
- BaseMachine (modelos con interfaz fit/predict)

## Related Concepts

- k-fold-cross-validation
- train-test-split
- GridSearchCV

## Relationship with KAFE

En KAFE, CrossValScore se implementa como una clase en `model_selection.py`. El factory `machine.cross_val_score(cv, scoring, random_state)` crea una instancia.

## Usage Examples

```kafe
import machine;

MACHINE lr = machine.linear_regression();
MACHINE cvs = machine.cross_val_score(5, "r2", 42);
cvs.fit(lr, X, y);

show(cvs.mean_score_);  -- ~0.92
show(cvs.std_score_);   -- ~0.025
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection.py` — class `CrossValScore` (línea 162)

## Public API

- `machine.cross_val_score(cv, scoring, random_state)` — crea CrossValScore
- `cvs.fit(model, X, y)` — evalúa modelo con k-fold CV
- `cvs.scores_` — scores por fold
- `cvs.mean_score_` — promedio de scores
- `cvs.std_score_` — desviación estándar

## References

- scikit-learn cross_val_score: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_score.html
