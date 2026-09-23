# Pipeline

## Name

Pipeline

## Category

ML utility — model selection / workflow composition

## Description

Pipeline encadena múltiples pasos de preprocessing con un modelo final en un solo objeto. Cada paso se ajusta y transforma secuencialmente, evitando data leakage al garantizar que cada transformador solo vea los datos de entrenamiento durante `fit()`.

## Mathematical Foundation

Dado un pipeline $P = [T_1, T_2, \ldots, T_n, M]$ donde $T_i$ son transformadores y $M$ es el modelo final:

**Entrenamiento**:
$$X' = T_1.\text{fit\_transform}(X)$$
$$X'' = T_2.\text{fit\_transform}(X')$$
$$\vdots$$
$$M.\text{fit}(X^{(n)}, y)$$

**Predicción**:
$$X' = T_1.\text{transform}(X)$$
$$X'' = T_2.\text{transform}(X')$$
$$\vdots$$
$$\hat{y} = M.\text{predict}(X^{(n)})$$

- **Time Complexity**: $O(\sum_{i=1}^{n} T_{\text{fit}}(T_i) + T_{\text{fit}}(M))$ para entrenamiento, $O(\sum_{i=1}^{n} T_{\text{transform}}(T_i) + T_{\text{predict}}(M))$ para predicción
- **Space Complexity**: $O(n \cdot d)$ donde $d$ es el número de features, ya que cada transformación crea una nueva representación

**Key Formulas**: Cada paso $T_i$ aplica su propia transformación matemática (ej: StandardScaler aplica $z = (x - \mu) / \sigma$), y el pipeline las encadena.

## Step-by-Step Algorithm

1. Recibir datos de entrada $X$ e $y$
2. Para cada transformador $T_i$ (excepto el último paso):
   a. Llamar $T_i.\text{fit\_transform}(X_{\text{actual}})$ si tiene `fit_transform`
   b. Si no, llamar $T_i.\text{fit}(X_{\text{actual}})$ y luego $T_i.\text{transform}(X_{\text{actual}})$
   c. Actualizar $X_{\text{actual}}$ con la salida transformada
3. Para el modelo final $M$: llamar $M.\text{fit}(X_{\text{actual}}, y)$
4. Almacenar todos los pasos ajustados en `steps_` y `named_steps_`
5. Para predicción: aplicar `transform()` de cada transformador secuencialmente, luego `predict()` del modelo

## Motivation

Pipeline resuelve un problema fundamental en ML: **data leakage**. Sin Pipeline, es fácil accidentalmente ajustar un scaler en todo el dataset (incluyendo test) antes de dividir, lo que contamina la evaluación. Pipeline garantiza que cada transformador solo se ajuste en los datos de entrenamiento.

También proporciona **modularidad**: permite experimentar fácilmente con diferentes combinaciones de preprocessing + modelo sin reescribir código.

## Advantages

- **Prevención de data leakage**: Cada transformador se ajusta solo en training data durante cross-validation
- **Modularidad**: Combinar transformaciones y modelos como bloques LEGO
- **Reproducibilidad**: El mismo pipeline produce los mismos resultados en cada ejecución
- **Código limpio**: Un solo objeto reemplaza múltiples llamadas manuales a fit/transform
- **Integración con GridSearchCV/RandomizedSearchCV**: Permite buscar hiperparámetros de preprocessing y modelo simultáneamente

## Limitations

- **Menos flexible que código manual**: Casos edge (ej: transformaciones condicionales) requieren diseño personalizado
- **Debugging más difícil**: Errores en pasos intermedios pueden ser difíciles de rastrear
- **Solo secuencial**: No soporta grafos de transformación (ej: ramas paralelas)
- **Último paso debe ser modelo**: Pipeline asume que el último elemento es un modelo con `fit(X, y)` y `predict(X)`

## When to Use

- Cuando se necesita encadenar preprocessing con un modelo
- Cuando se usa cross-validation y se quiere evitar data leakage
- Cuando se quiere buscar hiperparámetros de preprocessing y modelo juntos (con GridSearchCV/RandomizedSearchCV)
- Para workflows de ML reproducibles y modulares

## When NOT to Use

- Transformaciones que necesitan acceso simultáneo a X e y en pasos intermedios
- Grafos de transformación con ramas paralelas (se necesitaría un DAG)
- Cuando el preprocessing es tan simple que un Pipeline agrega complejidad innecesaria

## Dependencies

- BaseMachine (clase base)
- Cualquier transformador con interfaz fit/transform (StandardScaler, MinMaxScaler, PCA, etc.)
- Cualquier modelo con interfaz fit/predict

## Related Concepts

- train-test-split
- k-fold-cross-validation
- GridSearchCV
- RandomizedSearchCV
- StandardScaler
- BaseMachine

## Relationship with KAFE

En KAFE, Pipeline se implementa como una clase que extiende BaseMachine. El factory `machine.pipeline()` acepta pares alternados de nombre y paso:

```
machine.pipeline("scaler", scaler, "model", lr)
```

Pipeline hereda de BaseMachine, lo que le da compatibilidad con GridSearchCV y RandomizedSearchCV para búsqueda de hiperparámetros anidada.

## Usage Examples

```kafe
import machine;

-- Crear transformadores y modelo
MACHINE scaler = machine.standard_scaler();
MACHINE lr = machine.linear_regression();

-- Crear pipeline: escalar → regresión lineal
MACHINE pipe = machine.pipeline("scaler", scaler, "model", lr);

-- Entrenar pipeline completo
pipe.fit(X_train, y_train);

-- Predecir (aplica scaler automáticamente)
List[FLOAT] preds = pipe.predict(X_test);

-- Evaluar
FLOAT r2 = pipe.score(X_test, y_test);

-- Usar con GridSearchCV
Dict param_grid = {"scaler__strategy": ["mean", "median"]};
MACHINE gs = machine.grid_search_cv(pipe, param_grid, 5, machine.r2_score);
gs.fit(X_train, y_train);
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection.py` — class `Pipeline(BaseMachine)` (línea 487)
- `src/lib/KafeMACHINE/functions.py` — factory `pipeline()` (línea 302)

## Public API

- `machine.pipeline(name1, step1, name2, step2, ...)` — crea un Pipeline con pasos nombrados
- `pipe.fit(X, y)` — ajusta todos los pasos del pipeline
- `pipe.predict(X)` — aplica transformaciones y predice
- `pipe.score(X, y, metric)` — evalúa usando el modelo final
- `pipe.transform(X)` — aplica solo las transformaciones (sin el modelo)
- `pipe.fit_transform(X, y)` — fit + transform
- `pipe.get_params()` — retorna nombres de los pasos
- `pipe.named_steps_` — dict de pasos por nombre (después de fit)
- `pipe.steps_` — lista de tuplas (nombre, paso) ajustadas (después de fit)

## References

- scikit-learn Pipeline documentation: https://scikit-learn.org/stable/modules/compose.html#pipeline-chaining-estimators
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). The Elements of Statistical Learning. Chapter 7: Model Assessment and Selection.
