# LabelEncoder

## Name

LabelEncoder

## Category

ML preprocessing

## Description

LabelEncoder codifica etiquetas de texto a valores enteros ordinales. Asigna un entero único a cada categoría única, ordenadas alfabéticamente.

## Mathematical Foundation

Dado un conjunto de etiquetas $L = \{l_1, l_2, \ldots, l_n\}$ con categorías únicas $C = \{c_1, c_2, \ldots, c_k\}$ ordenadas alfabéticamente:

$$\text{encode}(c_j) = j - 1 \quad \text{para } j = 1, \ldots, k$$

- **Time Complexity**: $O(n \log n)$ para fit (ordenar categorías), $O(n)$ para transform
- **Space Complexity**: $O(k)$ para almacenar el mapeo de categorías

## Step-by-Step Algorithm

1. **fit(labels)**: Extraer categorías únicas, ordenarlas alfabéticamente, crear mapeo $c_j \to j-1$
2. **transform(labels)**: Para cada etiqueta, retornar su entero correspondiente
3. **inverse_transform(encoded)**: Para cada entero, retornar la categoría correspondiente

## Motivation

Muchos modelos de ML requieren entrada numérica. LabelEncoder convierte variables categóricas ordinales (donde el orden importa) a representación numérica.

## Advantages

- Simple y rápido
- Inversión trivial (inverse_transform)
- Orden alfabético determinista

## Limitations

- Solo para etiquetas (target), no para features (usar OneHotEncoder o OrdinalEncoder)
- Impone un orden ordinal que puede no ser apropiado para variables nominales
- Solo funciona con una columna a la vez

## When to Use

- Para codificar el target (variable dependiente) en clasificación
- Cuando las categorías tienen un orden natural

## When NOT to Use

- Para features categóricas (usar OneHotEncoder o OrdinalEncoder)
- Cuando las categorías no tienen orden (OneHotEncoder)

## Dependencies

- BaseMachine

## Related Concepts

- one-hot-encoder
- ordinal-encoder
- pipeline

## Relationship with KAFE

En KAFE, LabelEncoder se implementa como una clase que extiende BaseMachine. El factory `machine.label_encoder()` crea una instancia sin parámetros.

## Usage Examples

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

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/LabelEncoder.py`

## Public API

- `machine.label_encoder()` — crea LabelEncoder
- `le.fit(labels)` — aprende las clases únicas
- `le.transform(labels)` — codifica etiquetas a enteros
- `le.fit_transform(labels)` — fit + transform
- `le.inverse_transform(encoded)` — decodifica enteros a etiquetas
- `le.classes_` — lista ordenada de clases únicas

## References

- scikit-learn LabelEncoder: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.LabelEncoder.html
