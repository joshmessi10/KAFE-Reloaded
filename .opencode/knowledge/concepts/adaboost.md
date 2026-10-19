# AdaBoost (Adaptive Boosting)

## Mathematical Foundation

AdaBoost es un algoritmo de ensemble learning que combina múltiples weak classifiers de forma secuencial.

### Algoritmo

1. **Inicializar**: pesos uniformes $w_i = 1/n$
2. **Para cada iteración t = 1, ..., T**:
   - Entrenar weak classifier $h_t$ con pesos $w_i$
   - Calcular error: $\epsilon_t = \sum w_i \cdot I(h_t(x_i) \neq y_i)$
   - Calcular peso: $\alpha_t = 0.5 \cdot \ln\left(\frac{1 - \epsilon_t}{\epsilon_t}\right)$
   - Actualizar pesos: $w_i \leftarrow w_i \cdot \exp(-\alpha_t \cdot y_i \cdot h_t(x_i))$
   - Normalizar pesos: $w_i \leftarrow \frac{w_i}{\sum w_j}$
3. **Predicción**: $H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t \cdot h_t(x)\right)$

### Weak Classifier (Decision Stump)

Un decision stump es un árbol de decisión con profundidad 1:
- Selecciona una feature y un umbral
- Predice una clase a la izquierda, otra a la derecha

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m)$ | $O(T)$ |
| Prediction | $O(T \cdot m)$ | $O(1)$ |

Donde $T$ = n_estimators, $n$ = muestras, $m$ = features.

## Ventajas

1. **Reduce overfitting** — ensemble de weak learners generaliza mejor
2. **No necesita modelo complejo** — usa decision stumps (muy simples)
3. **Adaptativo** — enfatiza errores del clasificador anterior
4. **Interpretable** — se puede ver la importancia de cada stump

## Limitaciones

1. **Solo binario** — nativamente solo clasifica 2 clases
2. **Sensible a outliers** — puede overfittear en datos ruidosos
3. **Secuencial** — no se puede paralelizar
4. **Depende de weak learner** — si el weak learner es muy débil, converge lento

## Cuando Usar

- Clasificación binaria
- Weak learners simples (decision stumps)
- Datos limpios (sin mucho ruido)
- Necesitas interpretabilidad

## Cuando NO Usar

- Clasificación multiclase (usar One-vs-One)
- Datos con muchos outliers
- Datasets muy grandes (entrenamiento secuencial)

## Relación con KAFE

KAFE implementa AdaBoostClassifier desde scratch:
- Usa decision stumps como weak learners
- Implementa el algoritmo AdaBoost.R2 adaptado
- Soporta `learning_rate` para controlar contribución de cada stump

## References

- Freund, Y., & Schapire, R. E. (1997). A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting. *Journal of Computer and System Sciences*.
- Schapire, R. E. (2013). The Boosting Approach to Machine Learning: An Overview. *Nonlinear Estimation and Classification*.
