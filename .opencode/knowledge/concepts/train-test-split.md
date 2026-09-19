# Train-Test Split

## Mathematical Foundation

Train-Test Split es el método más fundamental para evaluar modelos de machine learning. Divide el dataset en dos subconjuntos: uno para entrenamiento (training set) y otro para evaluación (test set).

### Formulación

Dados $n$ ejemplos $(x_i, y_i)$, se particionan en:

- **Training set**: $X_{train}, y_{train}$ — $(1 - \alpha) \cdot n$ ejemplos para ajustar el modelo
- **Test set**: $X_{test}, y_{test}$ — $\alpha \cdot n$ ejemplos para evaluar generalización

Donde $\alpha$ es la fracción de test (típicamente 0.2 o 0.3).

### Muestreo Aleatorio

La selección se realiza con muestreo aleatorio uniforme:

$$P(x_i \in \text{test}) = \alpha \quad \forall i \in \{1, \dots, n\}$$

Para problemas de clasificación, se usa **stratified sampling** para preservar la proporción de clases:

$$P(x_i \in \text{test} \mid y_i = c) = \alpha \quad \forall c \in \mathcal{C}$$

### Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Split | $O(n)$ | $O(n)$ |

## Step-by-Step Algorithm

1. **Determinar tamaño**: Calcular `n_test = floor(n * test_size)` y `n_train = n - n_test`
2. **Barajar índices**: Generar permutación aleatoria de $\{0, 1, \dots, n-1\}$
3. **Estratificar (opcional)**: Para cada clase $c$, barajar los índices de esa clase y asignar los primeros `floor(n_c * test_size)` al test
4. **Dividir**: Los primeros `n_train` índices van al training set, los restantes al test set
5. **Retornar**: Tupla `(X_train, X_test, y_train, y_test)`

## Motivation

Sin división train-test, no hay forma objetiva de medir la capacidad de generalización de un modelo. Un modelo puede memorizar los datos de entrenamiento (overfitting) y fallar con datos nuevos. Train-Test Split simula la situación real donde el modelo ve datos que nunca ha visto antes.

## Advantages

- **Simpleza**: Un solo paso, fácil de entender e implementar
- **Rápido**: Solo necesita una permutación de índices
- **Objetivo**: Proporciona una estimación directa del rendimiento de generalización
- **Universal**: Funciona para clasificación, regresión, y cualquier tipo de modelo

## Limitations

- **Alta varianza**: La evaluación depende de cómo se divide el dataset (una sola partición)
- **Desperdicio de datos**: El test set no se usa para entrenar, reduciendo el tamaño del training set
- **No estadísticamente robusto**: Un solo split no proporciona intervalos de confianza
- **Sensible a distribución**: Si los datos no son i.i.d., la división puede ser engañosa

## When to Use

- Datasets grandes (>$10^4$ muestras) donde un solo split es representativo
- Evaluación rápida de un modelo
- Primera exploración de un dataset
- Cuando el costo de evaluar es alto y no se pueden hacer múltiples splits

## When NOT to Use

- Datasets pequeños (el split desperdicia demasiados datos)
- Cuando se necesita una estimación robusta del rendimiento (usar cross-validation)
- Datos con estructura temporal (usar time-series split)
- Cuando hay imbalance severo de clases (usar stratified split o cross-validation)

## Dependencies

- No depende de otros módulos KAFE
- Solo necesita permutación aleatoria (random shuffle)

## Related Concepts

- **K-Fold Cross Validation**: Evaluación más robusta usando múltiples splits
- **Stratified Split**: Variante que preserva proporciones de clase
- **Time Series Split**: Para datos con orden temporal
- **Bootstrap**: Muestreo con reemplazo como alternativa

## Relationship with KAFE

KAFE implementa `train_test_split` en `model_selection.py` como función pura que opera sobre listas nativas de KAFE. La implementación:

- Acepta `List[List[NUM]]` para features y `List[NUM]` para targets
- Parámetro `test_size` (default 0.2) y `random_state` (default None)
- Soporta stratified splitting para clasificación
- Retorna tupla `(X_train, X_test, y_train, y_test)` como `List[List[NUM]]`

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0], [6.0], [7.0], [8.0], [9.0], [10.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0];

-- División 80/20
(List[List[FLOAT]] X_train, List[List[FLOAT]] X_test,
 List[FLOAT] y_train, List[FLOAT] y_test) = machine.train_test_split(X, y, 0.2, 42);

show(len(X_train));  -- 8
show(len(X_test));   -- 2
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection.py` — función `train_test_split`

## Public API

- `machine.train_test_split(X, y, test_size, random_state)` → `(List[List[NUM]], List[List[NUM]], List[NUM], List[NUM])`

## References

- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer.
- scikit-learn documentation: `sklearn.model_selection.train_test_split`
