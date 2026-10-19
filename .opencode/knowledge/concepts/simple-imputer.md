# SimpleImputer

## Name

SimpleImputer

## Category

ML preprocessing

## Description

SimpleImputer reemplaza valores faltantes (NaN) usando una estrategia configurable: media, mediana, moda, o un valor constante. Es el primer paso esencial en cualquier pipeline de preprocessing.

## Mathematical Foundation

Para cada columna $j$ con valores faltantes:

- **mean**: $\hat{x}_j = \frac{1}{n_{\text{valid}}} \sum_{i: x_{ij} \neq \text{NaN}} x_{ij}$
- **median**: $\hat{x}_j = \text{median}(\{x_{ij} : x_{ij} \neq \text{NaN}\})$
- **most_frequent**: $\hat{x}_j = \text{mode}(\{x_{ij} : x_{ij} \neq \text{NaN}\})$
- **constant**: $\hat{x}_j = c$ (valor constante dado por el usuario)

- **Time Complexity**: $O(n \cdot d)$ para fit (calcular estadísticas), $O(n \cdot d)$ para transform
- **Space Complexity**: $O(d)$ para almacenar estadísticas por columna

## Step-by-Step Algorithm

1. **fit(X)**: Para cada columna, calcular la estadística elegida (media/mediana/moda) ignorando NaN
2. **transform(X)**: Reemplazar cada NaN en la columna por la estadística calculada
3. **fit_transform(X)**: Combinar fit y transform en un solo paso

## Motivation

Los datos del mundo real frecuentemente contienen valores faltantes. SimpleImputer proporciona una forma consistente y reproducible de manejarlos, evitando que los modelos fallen o produzcan resultados incorrectos.

## Advantages

- Múltiples estrategias (mean, median, most_frequent, constant)
- Integración con Pipeline para evitar data leakage
- Validación de tipo numérico para mean/median
- Simple y predecible

## Limitations

- No captura la incertidumbre de la imputación (todos los valores imputados son iguales)
- La media/mediana pueden distorsionar la distribución
- No usa relaciones entre features para imputar

## When to Use

- Datos con valores faltantes que deben ser imputados antes de modelar
- Como paso en un Pipeline de preprocessing
- Cuando la estrategia simple (media/mediana) es apropiada

## When NOT KAFE

- Cuando los patrones de faltantes son informativos (MCAR, MAR, MNAR)
- Cuando se necesita imputación multivariada (KNNImputer, IterativeImputer)

## Dependencies

- BaseMachine
- PARDOS DataFrame (para integración)

## Related Concepts

- standard-scaler
- minmax-scaler
- pipeline

## Relationship with KAFE

En KAFE, SimpleImputer se implementa como una clase que extiende BaseMachine. Soporta tanto listas como PARDOS DataFrames. El factory `machine.simple_imputer(strategy)` crea una instancia con la estrategia especificada.

## Usage Examples

```kafe
import machine;

-- Imputar con media
MACHINE imp = machine.simple_imputer("mean");
PARDOS imputed = imp.fit_transform(df);

-- Imputar con valor constante
MACHINE imp_c = machine.simple_imputer_constant(0.0);
PARDOS imputed_c = imp_c.fit_transform(df);
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/SimpleImputer.py`

## Public API

- `machine.simple_imputer(strategy)` — crea SimpleImputer con estrategia ("mean", "median", "most_frequent")
- `machine.simple_imputer_constant(value)` — crea SimpleImputer con estrategia constante
- `imp.fit(X)` — calcula estadísticas por columna
- `imp.transform(X)` — imputa valores faltantes
- `imp.fit_transform(X)` — fit + transform
- `imp.statistics_` — estadísticas calculadas por columna

## References

- scikit-learn SimpleImputer: https://scikit-learn.org/stable/modules/generated/sklearn.impute.SimpleImputer.html
