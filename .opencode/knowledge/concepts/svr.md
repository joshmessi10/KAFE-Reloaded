# Support Vector Regression (SVR)

## Mathematical Foundation

SVR es una extensión de SVM para regresión que encuentra un hiperplano que ajusta los datos dentro de un margen de ε (epsilon).

### Epsilon-Insensitive Loss

SVR usa una función de pérdida epsilon-insensitive:

$$L_\epsilon(y, f(x)) = \max(0, |y - f(x)| - \epsilon)$$

Solo penaliza predicciones que están fuera del tubo de radio ε.

### Formulación

Minimiza:

$$\frac{1}{2}||w||^2 + C \sum_{i=1}^{n} L_\epsilon(y_i, f(x_i))$$

Donde:
- $w$ = pesos del modelo
- $C$ = parámetro de regularización (trade-off entre flatness y tolerancia)
- $\epsilon$ = ancho del tubo epsilon-insensitive
- $f(x) = w \cdot x + b$

### Support Vectores

Los puntos que están fuera o en el borde del tubo ε son los **support vectors**. Solo estos puntos contribuyen al modelo.

### Kernels

- **Lineal**: $K(x_i, x_j) = x_i \cdot x_j$
- **RBF (Gaussian)**: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- **Polinomial**: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(n^2 \cdot m)$ (kernel) o $O(n \cdot m)$ (linear) | $O(n^2)$ (kernel) o $O(m)$ (linear) |
| Prediction | $O(n_{sv} \cdot m)$ (kernel) o $O(m)$ (linear) | $O(n_{sv})$ |

Donde $n$ = muestras, $m$ = features, $n_{sv}$ = vectores de soporte.

## Ventajas

1. **Robusto a outliers** — epsilon-insensitive loss ignora errores pequeños
2. **Efectivo en alta dimensión** — kernel trick maneja features no lineales
3. **Generalización** — maximiza el margen, minimiza overfitting
4. **Sparse model** — solo usa support vectors para predicción

## Limitaciones

1. **Escalabilidad** — entrenamiento O(n²) con kernels
2. **Sensible a hiperparámetros** — C y ε deben ajustarse cuidadosamente
3. **No probabilístico** — no produce probabilidades comooutput
4. **Interpretabilidad limitada** — kernel no lineal es difícil de interpretar

## Cuando Usar

- Datos con outliers
- Relaciones no lineales (con kernel)
- Alta dimensionalidad
- Necesitas robustez

## Cuando NO Usar

- Datasets muy grandes (entrenamiento lento)
- Necesitas probabilidades
- Interpretabilidad crítica

## Relación con KAFE

KAFE implementa SVR desde scratch:
- **Lineal**: Coordinate Descent con epsilon-insensitive loss
- **Kernel**: SMO simplificado con kernel matrix
- Soporta kernels lineal, RBF y polinomial

## References

- Drucker, H., Burges, C. J., Kaufman, L., Smola, A., & Vapnik, V. (1997). Support Vector Regression Machines. *NeurIPS*.
- Smola, A. J., & Schölkopf, B. (2004). A Tutorial on Support Vector Regression. *Statistics and Computing*, 14(3), 199-222.
