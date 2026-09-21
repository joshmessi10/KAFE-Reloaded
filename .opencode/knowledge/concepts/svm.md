# Support Vector Machine (SVM)

## Mathematical Foundation

SVM es un algoritmo de clasificación que encuentra el hiperplano de máximo margen que separa las clases.

### Hiperplano de Máximo Margen

El objetivo es encontrar el hiperplano $w \cdot x + b = 0$ que maximice el margen entre las clases.

**Margen**: distancia perpendicular del hiperplano al punto más cercano de cada clase.

### Función de Coste (Hinge Loss)

$$J(w) = \frac{1}{2}||w||^2 + C \sum_{i=1}^{n} \max(0, 1 - y_i \cdot f(x_i))$$

Donde:
- $w$ = pesos del modelo
- $C$ = parámetro de regularización
- $y_i \in \{-1, +1\}$ = etiquetas de clase
- $f(x_i) = w \cdot x_i + b$

### Kernels

- **Lineal**: $K(x_i, x_j) = x_i \cdot x_j$
- **RBF (Gaussian)**: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- **Polinomial**: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

### Support Vectores

Los puntos que están sobre o dentro del margen son los **support vectors**. Solo estos puntos determinan el hiperplano.

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(n^2 \cdot m)$ (kernel) o $O(n \cdot m)$ (linear) | $O(n^2)$ (kernel) o $O(m)$ (linear) |
| Prediction | $O(n_{sv} \cdot m)$ (kernel) o $O(m)$ (linear) | $O(n_{sv})$ |

## Ventajas

1. **Efectivo en alta dimensionalidad** — funciona bien con muchos features
2. **Kernel trick** — maneja relaciones no lineales
3. **Generalización** — maximiza el margen, minimiza overfitting
4. **Memoria eficiente** — solo usa support vectors para predicción

## Limitaciones

1. **Escalabilidad** — entrenamiento O(n²) con kernels
2. **Solo binario** — nativamente solo clasifica 2 clases
3. **Sensible a escala** — requiere normalización
4. **No probabilístico** — no produce probabilidades nativamente

## Cuando Usar

- Clasificación binaria
- Alta dimensionalidad
- Relaciones no lineales (con kernel)
- Necesitas margen claro

## Cuando NO Usar

- Clasificación multiclase (usar One-vs-One o One-vs-Rest)
- Datasets muy grandes
- Datos con mucho ruido

## Relación con KAFE

KAFE implementa SVM desde scratch:
- **Lineal**: SGD con hinge loss + L2 regularization
- **Kernel**: SMO simplificado con kernel matrix
- Soporta kernels lineal, RBF y polinomial
- Incluye `predict_proba()` para probabilidades calibradas

## References

- Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning*, 20(3), 273-297.
- Platt, J. (1998). Sequential Minimal Optimization: A Fast Algorithm for Training Support Vector Machines. *Microsoft Research Technical Report*.
