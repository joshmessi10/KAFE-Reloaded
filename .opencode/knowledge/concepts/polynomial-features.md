# PolynomialFeatures

## Name

PolynomialFeatures — Generación de Features Polinomiales

## Category

ML preprocessing

## Description

PolynomialFeatures transforma un conjunto de $d$ features en todas las combinaciones polinomiales hasta un grado especificado $n$. Dado un vector $[x_1, x_2]$ y grado 2, genera $[1, x_1, x_2, x_1^2, x_1 x_2, x_2^2]$. Esto permite que un modelo lineal capture relaciones no lineales entre las variables de entrada.

El término de sesgo (bias) es una columna de 1s que representa el intercepto del modelo.

## Mathematical Foundation

Para $d$ features de entrada y grado $n$, el número total de features de salida es:

$$\text{n\_features\_out} = \binom{d + n}{n} = \frac{(d + n)!}{d! \cdot n!}$$

Incluyendo el término de sesgo (grado 0). Sin sesgo, se resta 1.

Cada feature de salida es el producto de las entradas originales elevadas a potencias no negativas $p_1, p_2, \ldots, p_d$ donde:

$$p_1 + p_2 + \cdots + p_d \leq n$$

**Ejemplo** con $[x_1, x_2]$ y grado 2:

| Combinación | Potencias | Valor |
|-------------|-----------|-------|
| Bias | $(0,0)$ | $1$ |
| $x_1$ | $(1,0)$ | $x_1$ |
| $x_2$ | $(0,1)$ | $x_2$ |
| $x_1^2$ | $(2,0)$ | $x_1^2$ |
| $x_1 x_2$ | $(1,1)$ | $x_1 \cdot x_2$ |
| $x_2^2$ | $(0,2)$ | $x_2^2$ |

**Complejidad**:

- **Tiempo de transformación**: $O(n_{samples} \cdot \binom{d+n}{n} \cdot d)$
- **Espacio**: $O(n_{samples} \cdot \binom{d+n}{n})$

**Número de combinaciones**:

| d (features) | n (grado) | Con bias | Sin bias |
|---------------|-----------|----------|----------|
| 2 | 2 | 6 | 5 |
| 3 | 2 | 10 | 9 |
| 2 | 3 | 10 | 9 |
| 5 | 2 | 21 | 20 |
| 3 | 3 | 20 | 19 |

## Step-by-Step Algorithm

1. **Validar entrada**: Verificar que $d > 0$ y $n \geq 1$.
2. **Generar combinaciones de potencias**: Para cada combinación de potencias $(p_1, \ldots, p_d)$ donde $\sum p_i \leq n$, crear un feature resultante.
3. **Calcular dimensiones de salida**: Contar combinaciones, restar 1 si se excluye bias.
4. **Transformar cada muestra**: Para cada fila del dataset, calcular el producto de las entradas elevadas a las potencias correspondientes.
5. **Retornar resultado**: Matriz de $n_{samples} \times n_{features\_out}$.

## Motivation

Muchos algoritmos de ML (regresión lineal, SVM lineal) solo pueden capturar relaciones lineales entre features y target. PolynomialFeatures permite que estos modelos capturen interacciones y no linealidades al crear features polinomiales. Es una técnica fundamental de feature engineering.

## Advantages

- Captura no linealidad: Permite que modelos lineales ajusten relaciones cuadráticas, cúbicas, etc.
- Flexible: El grado $n$ controla la complejidad del polinomio.
- Combinación con regularización: Usado junto con Ridge/Lasso puede manejar la dimensionalidad expandida.
- Simple de entender: Cada feature de salida es una combinación polinomial clara.

## Limitations

- **Maldición de la dimensionalidad**: El número de features crece exponencialmente con el grado. Para $d=10$ y $n=2$, se generan 66 features.
- **Overfitting**: Features polinomiales de alto grado pueden memorizar ruido en los datos.
- **Escalado requerido**: Los valores polinomiales pueden tener magnitudes muy diferentes; requiere StandardScaler.
- **No invertible**: No existe inverse_transform (la transformación pierde información de la estructura original).
- **Multicolinealidad**: Las features polinomiales son altamente correlacionadas entre sí.

## When to Use

- Cuando la relación features→target es no lineal y se usa un modelo lineal.
- Cuando se sospecha que existen interacciones entre features.
- Para datasets pequeños/medianos donde la dimensionalidad expandida es manejable.
- En combinación con regularización (Ridge, Lasso, ElasticNet) para controlar overfitting.

## When NOT to Use

- Con modelos que ya capturan no linealidad (Random Forest, SVM con kernel RBF, redes neuronales).
- Con datasets de alta dimensionalidad (miles de features) — la explosión combinatoria es inmanejable.
- Cuando el grado es alto (>3) en datasets grandes — riesgo de overfitting extremo.

## Dependencies

- `BaseMachine` (superclass)
- `DataFrame` from KafePARDOS (for DataFrame support)
- `check_sig` from global_utils (signature validation)

## Related Concepts

- LinearRegression, RidgeRegression, LassoRegression — modelos que combinan bien con PolynomialFeatures
- StandardScaler — se recomienda escalar después de generar features polinomiales
- Feature engineering — técnica fundamental de preprocesamiento

## Relationship with KAFE

PolynomialFeatures se implementó como transformador KafeMACHINE siguiendo el contrato de BaseMachine:

- `fit(data)` calcula las dimensiones de salida y genera nombres de features.
- `transform(data)` aplica la expansión polinomial.
- `fit_transform(data)` combina ambos pasos.
- Soporte nativo para PARDOS DataFrames (preserve columnas).
- `inverse_transform` lanza error intencionalmente (transformación no invertible).

La generación de combinaciones usa recursión para enumerar todas las combinaciones de potencias.

## Usage Examples

```kafe
import machine;

-- Crear PolynomialFeatures de grado 2
MACHINE pf = machine.polynomial_features(2, true);

-- Datos de entrada: 2 features
List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

-- Transformar
List[List[FLOAT]] X_poly = pf.fit_transform(X);
-- Resultado: [[1.0, 1.0, 2.0, 1.0, 2.0, 4.0],
--              [1.0, 3.0, 4.0, 9.0, 12.0, 16.0],
--              [1.0, 5.0, 6.0, 25.0, 30.0, 36.0]]

-- Combinar con regresión lineal
MACHINE lr = machine.linear_regression();
lr.fit(X_poly, y);
```

## Implementation Location

- File: `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py`

## Public API

```kafe
-- Factory function
MACHINE pf = machine.polynomial_features(degree, include_bias);

-- Parameters:
-- degree: INT (default 2) — máximo grado del polinomio
-- include_bias: BOOL (default true) — incluir columna de sesgo (1s)

-- Methods:
pf.fit(data)           -> MACHINE
pf.transform(data)     -> List[List[FLOAT]] o PARDOS
pf.fit_transform(data) -> List[List[FLOAT]] o PARDOS

-- Properties (after fit):
pf.n_features_in_  -> INT
pf.n_features_out_ -> INT
```

## References

- Wikipedia: Polynomial Regression
- Scikit-learn documentation: `sklearn.preprocessing.PolynomialFeatures`
- Bishop, C.M. (2006). Pattern Recognition and Machine Learning, Section 3.1.2
