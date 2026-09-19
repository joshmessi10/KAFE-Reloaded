# MinMaxScaler

## Name

MinMaxScaler

## Category

ML preprocessing

## Description

MinMaxScaler escala cada feature a un rango fijo, por defecto [0, 1]. Aplica la transformación lineal: $X_{norm} = (X - X_{min}) / (X_{max} - X_{min})$.

## Mathematical Foundation

Para cada feature $j$:

$$X_{ij}^{norm} = \frac{X_{ij} - \min(X_j)}{\max(X_j) - \min(X_j)}$$

Donde $\min(X_j)$ y $\max(X_j)$ son el mínimo y máximo de la feature $j$ en el conjunto de entrenamiento.

- **Time Complexity**: $O(n \cdot d)$ para fit, $O(n \cdot d)$ para transform
- **Space Complexity**: $O(d)$ para almacenar min y max por feature

## Step-by-Step Algorithm

1. **fit(X)**: Para cada feature $j$, calcular $\min(X_j)$ y $\max(X_j)$
2. **transform(X)**: Para cada feature $j$, aplicar $(X_j - \min_j) / (\max_j - \min_j)$
3. **inverse_transform(X_norm)**: Para cada feature $j$, aplicar $X_j = X_j^{norm} \cdot (\max_j - \min_j) + \min_j$

## Motivation

MinMaxScaler es útil cuando se necesita que los datos estén en un rango fijo, como para redes neuronales que esperan entradas en [0, 1], o cuando la distribución de los datos no es gaussiana.

## Advantages

- Preserva la forma de la distribución original
- Garantiza un rango exacto para los datos escalados
- Inversión trivial (inverse_transform)
- Rápido: operaciones element-wise

## Limitations

- Sensible a outliers (un outlier comprime todos los demás valores)
- No centraliza los datos (media no es 0)
- No es robusto a cambios en el rango de datos

## When to Use

- Cuando se necesita un rango fijo [0, 1] o [-1, 1]
- Cuando la distribución no es gaussiana
- Para redes neuronales con activaciones sigmoidales

## When NOT to Use

- Cuando hay outliers significativos (usar StandardScaler o RobustScaler)
- Cuando se necesita media 0 y varianza 1

## Dependencies

- BaseMachine

## Related Concepts

- standard-scaler
- base-machine

## Relationship with KAFE

En KAFE, MinMaxScaler se implementa como una clase que extiende BaseMachine. El factory `machine.minmax_scaler()` crea una instancia sin parámetros.

## Usage Examples

```kafe
import machine;

MACHINE mms = machine.minmax_scaler();
List[List[FLOAT]] scaled = mms.fit_transform(data);
show(scaled);  -- valores en [0, 1]

List[List[FLOAT]] original = mms.inverse_transform(scaled);
show(original);  -- valores originales
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/MinMaxScaler.py`

## Public API

- `machine.minmax_scaler()` — crea MinMaxScaler
- `mms.fit(X)` — calcula min y max
- `mms.transform(X)` — escala a [0, 1]
- `mms.fit_transform(X)` — fit + transform
- `mms.inverse_transform(X)` — revierte el escalado
- `mms.data_min_` — mínimo de cada feature
- `mms.data_max_` — máximo de cada feature
- `mms.scale_` — escala de cada feature

## References

- scikit-learn MinMaxScaler: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html
