# K-Fold Cross Validation

## Mathematical Foundation

K-Fold Cross Validation es un método de evaluación que particiona el dataset en $k$ subconjuntos (folds) y entrena/evalúa el modelo $k$ veces, cada vez usando un fold diferente como test set y los demás como training set.

### Formulación

Dado un dataset $D$ de tamaño $n$, se particiona en $k$ folds disjuntos $D_1, D_2, \dots, D_k$ de tamaño aproximado $n/k$:

$$D = \bigcup_{i=1}^{k} D_i, \quad D_i \cap D_j = \emptyset \quad \forall i \neq j$$

Para cada fold $i \in \{1, \dots, k\}$:

- **Training set**: $D_{train}^{(i)} = D \setminus D_i$ — tamaño $(k-1) \cdot n/k$
- **Test set**: $D_{test}^{(i)} = D_i$ — tamaño $n/k$

### Score Agregado

El score final es el promedio de los scores de cada fold:

$$\text{CV}_k = \frac{1}{k} \sum_{i=1}^{k} \text{score}(f^{(i)}, D_i)$$

Donde $f^{(i)}$ es el modelo entrenado en $D_{train}^{(i)}$.

### Varianza del Estimador

La varianza de la estimación CV se puede calcular como:

$$\text{Var}(\text{CV}_k) = \frac{1}{k} \sum_{i=1}^{k} \left( \text{score}_i - \text{CV}_k \right)^2$$

### Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Partición | $O(n)$ | $O(n)$ |
| Evaluación completa | $O(k \cdot T(n))$ | $O(n)$ |

Donde $T(n)$ es el costo de entrenar el modelo en $n$ muestras.

## Step-by-Step Algorithm

1. **Barajar dataset**: Permutar aleatoriamente los $n$ índices
2. **Crear folds**: Dividir los índices en $k$ grupos de tamaño aproximado $n/k$
3. **Para cada fold $i = 1 \dots k$**:
   a. Asignar fold $i$ como test set
   b. Concatenar los demás folds como training set
   c. Entrenar modelo $f^{(i)}$ en el training set
   d. Evaluar $\text{score}_i$ en el test set
   e. Almacenar $\text{score}_i$
4. **Promediar**: Calcular $\text{CV}_k = \frac{1}{k} \sum_{i=1}^{k} \text{score}_i$
5. **Opcional**: Calcular desviación estándar para intervalos de confianza

## Motivation

El problema fundamental de Train-Test Split es su alta varianza: la evaluación depende de una única partición. K-Fold CV resuelve esto evaluando en múltiples particiones y promediando, proporcionando una estimación más estable y robusta del rendimiento de generalización.

La intuición es que cada muestra es usada exactamente una vez para test y $k-1$ veces para training, maximizando el uso de los datos disponibles.

## Advantages

- **Baja varianza**: Promedia múltiples evaluaciones, reduciendo la sensibilidad a la partición
- **Uso eficiente de datos**: Cada muestra se usa tanto para training como para test
- **Estimación robusta**: Proporciona intervalos de confianza del rendimiento
- **Universal**: Aplicable a cualquier modelo y cualquier métrica
- **Sin desperdicio**: A diferencia de train-test split, no se descarta ningún dato

## Limitations

- **Costo computacional**: Entrena el modelo $k$ veces (vs 1 vez con train-test split)
- **No adecuado para series temporales**: La mezcla temporal rompe la dependencia temporal
- **Sesgo de evaluación**: El modelo se evalúa en $k-1$ folds, no en el dataset completo
- **Overlapping de folds**: Los folds de training se solapan significativamente

## When to Use

- Datasets pequeños o medianos donde cada muestra importa
- Cuando se necesita una estimación robusta del rendimiento
- Comparación de modelos (selección de hiperparámetros)
- Validación de estabilidad del modelo
- Cuando el dataset es demasiado pequeño para un split único confiable

## When NOT to Use

- Datasets muy grandes (>$10^5$): train-test split es suficiente y más rápido
- Datos con dependencia temporal: usar TimeSeriesSplit
- Cuando el entrenamiento es extremadamente costoso (usar holdout)
- Cuando se necesita evaluar en datos completamente nuevos (usar holdout)

## Dependencies

- No depende de otros módulos KAFE
- Solo necesita permutación aleatoria y partición

## Related Concepts

- **Train-Test Split**: Versión simplificada (1 partición)
- **Stratified K-Fold**: K-Fold que preserva proporciones de clase
- **Leave-One-Out (LOO)**: K-Fold con $k = n$
- **Repeated K-Fold**: Repite K-Fold múltiples veces
- **Nested Cross-Validation**: Para selección de hiperparámetros sin sesgo

## Relationship with KAFE

KAFE implementa `k_fold_cross_validation` en `model_selection.py` como función que retorna scores por fold y el score promedio. La implementación:

- Acepta una función `evaluate_fn(model, X_test, y_test)` como callback
- Retorna `(List[FLOAT], FLOAT)` — scores por fold y promedio
- Soporta stratified folding para clasificación
- Compatible con cualquier modelo KafeMACHINE

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 4.0],
                        [4.0, 5.0], [5.0, 6.0], [6.0, 7.0],
                        [7.0, 8.0], [8.0, 9.0], [9.0, 10.0], [10.0, 11.0]];
List[FLOAT] y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

MACHINE lr = machine.linear_regression();
(List[FLOAT] scores, FLOAT mean_score) = machine.k_fold_cross_validation(
    lr, X, y, 5, machine.r2_score
);
show(scores);      -- [0.92, 0.95, 0.88, 0.91, 0.94]
show(mean_score);  -- ~0.92
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection.py` — función `k_fold_cross_validation`

## Public API

- `machine.k_fold_cross_validation(model, X, y, k, scoring_fn)` → `(List[FLOAT], FLOAT)`

## References

- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer.
- Kohavi, R. (1995). A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection. *IJCAI*.
- scikit-learn documentation: `sklearn.model_selection.cross_val_score`
