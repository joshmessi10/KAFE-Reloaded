# OneHotEncoder

## Name

OneHotEncoder

## Category

ML preprocessing

## Description

OneHotEncoder codifica columnas categóricas de un DataFrame a representación binaria (one-hot). Crea una columna binaria por cada categoría única.

## Mathematical Foundation

Dado una columna categórica con $k$ categorías únicas $\{c_1, c_2, \ldots, c_k\}$, OneHotEncoder crea $k$ columnas binarias:

$$\text{one\_hot}(x) = [e_1, e_2, \ldots, e_k] \quad \text{donde } e_j = \begin{cases} 1 & \text{si } x = c_j \\ 0 & \text{si no} \end{cases}$$

- **Time Complexity**: $O(n \cdot k)$ para transform
- **Space Complexity**: $O(n \cdot k)$ para la representación resultante

## Step-by-Step Algorithm

1. **fit(df, columns)**: Para cada columna, extraer categorías únicas y crear mapeo
2. **transform(df)**: Para cada fila y columna categórica, crear vector one-hot y reemplazar la columna original
3. **fit_transform(df, columns)**: Combinar fit y transform

## Motivation

Las variables categóricas nominales (sin orden) no pueden ser codificadas con enteros directamente, ya que el modelo interpretaría un orden falso. OneHotEncoder crea representaciones binarias que evitan esta interpretación errónea.

## Advantages

- Elimina la interpretación ordinal incorrecta
- Compatible con cualquier modelo que acepte features numéricas
- Soporte para múltiples columnas
- `handle_unknown` parameter para categorías nuevas en transform

## Limitations

- Aumenta la dimensionalidad significativamente (curse of dimensionality)
- Crea columnas altamente correlacionadas (multicolinealidad)
- No preserva información de frecuencia

## When to Use

- Variables categóricas nominales (color, tamaño, país)
- Cuando el número de categorías es moderado

## When NOT to Use

- Variables ordinales con orden natural (usar OrdinalEncoder)
- Cuando hay muchas categorías únicas (usa otro encoding)

## Dependencies

- BaseMachine
- PARDOS DataFrame

## Related Concepts

- label-encoder
- ordinal-encoder
- pipeline

## Relationship with KAFE

En KAFE, OneHotEncoder se implementa como una clase que extiende BaseMachine. Trabaja directamente con PARDOS DataFrames. El factory `machine.one_hot_encoder()` crea una instancia.

## Usage Examples

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

MACHINE ohe = machine.one_hot_encoder();
PARDOS encoded = ohe.fit_transform(df, ["color"]);
show(encoded);
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/OneHotEncoder.py`

## Public API

- `machine.one_hot_encoder()` — crea OneHotEncoder
- `ohe.fit(df, columns)` — aprende categorías de columnas
- `ohe.transform(df)` — transforma a one-hot
- `ohe.fit_transform(df, columns)` — fit + transform
- `ohe.inverse_transform(df)` — revierte la codificación

## References

- scikit-learn OneHotEncoder: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html
