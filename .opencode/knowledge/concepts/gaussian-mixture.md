# Gaussian Mixture Model (GMM)

## Mathematical Foundation

Un modelo probabilístico que asume que los datos son generados por una mezcla de distribuciones Gaussianas.

### Modelo

$$P(\mathbf{x}) = \sum_{k=1}^{K} \pi_k \cdot \mathcal{N}(\mathbf{x} | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)$$

Donde:
- $\pi_k$ = peso de la componente k ($\sum \pi_k = 1$)
- $\boldsymbol{\mu}_k$ = media de la componente k
- $\boldsymbol{\Sigma}_k$ = covarianza de la componente k
- $\mathcal{N}(\mathbf{x} | \boldsymbol{\mu}, \boldsymbol{\Sigma})$ = Gaussiana multivariante

### Algoritmo EM (Expectation-Maximization)

**E-step:** Calcular responsabilidades
$$\gamma(z_k) = \frac{\pi_k \cdot \mathcal{N}(\mathbf{x}_n | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)}{\sum_j \pi_j \cdot \mathcal{N}(\mathbf{x}_n | \boldsymbol{\mu}_j, \boldsymbol{\Sigma}_j)}$$

**M-step:** Actualizar parámetros
$$\boldsymbol{\mu}_k = \frac{\sum_n \gamma(z_{kn}) \cdot \mathbf{x}_n}{N_k}$$
$$\boldsymbol{\Sigma}_k = \frac{\sum_n \gamma(z_{kn}) \cdot (\mathbf{x}_n - \boldsymbol{\mu}_k)(\mathbf{x}_n - \boldsymbol{\mu}_k)^T}{N_k}$$
$$\pi_k = \frac{N_k}{N}$$

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| fit (EM) | $O(T \cdot n \cdot K \cdot d)$ | $O(n \cdot K)$ |
| predict | $O(n \cdot K \cdot d)$ | $O(n)$ |

Donde $T$ = iteraciones, $n$ = muestras, $K$ = componentes, $d$ = features.

## Ventajas

1. **Soft clustering** — probabilidades de pertenencia, no solo asignaciones
2. **Formas elípticas** — puede capturar clusters elípticos (no solo esféricos como K-Means)
3. **Modelo generativo** — puede generar nuevos puntos
4. **Principled** — basado en teoría estadística sólida

## Limitaciones

1. **Sensible a inicialización** — puede converger a óptimos locales
2. **Asume Gaussianas** — si los datos no son Gaussianos, no funciona bien
3. **Sensible a outliers** — los outliers afectan las medias
4. **Número de componentes** — debe especificarse K (usar AIC/BIC para seleccionar)

## Comparación con K-Means

| Aspecto | K-Means | GMM |
|---------|---------|-----|
| Tipo | Hard clustering | Soft clustering |
| Forma de clusters | Esféricos | Elípticos |
| Modelo | Distancia a centroides | Probabilístico |
| Salida | Etiquetas | Probabilidades |

## Selección del número de componentes

Usar AIC o BIC para seleccionar K:
- **AIC**: $2p - 2\ln(\hat{L})$ (menor es mejor)
- **BIC**: $p\ln(n) - 2\ln(\hat{L})$ (menor es mejor, penaliza más modelos complejos)

## KAFE Implementation

La implementación en KAFE (`GaussianMixture.py`) soporta:

- **Covarianza diagonal** — cada feature tiene su propia varianza, independiente de las demás
- **Inicialización aleatoria** — selección aleatoria de puntos como medias iniciales
- **Convergencia** — basada en cambio de log-verosimilitud con tolerancia configurable
- **AIC/BIC** — criterios de información para selección de número de componentes

### Métodos principales

| Método | Descripción |
|--------|-------------|
| `fit(X)` | Ajusta el modelo usando EM |
| `predict(X)` | Asigna cada punto al componente más probable |
| `predict_proba(X)` | Devuelve responsabilidades (probabilidades) |
| `fit_predict(X)` | Ajusta y devuelve etiquetas |
| `score(X)` | Retorna log-verosimilitud negativa |
| `aic(X)` | Criterio de Akaike |
| `bic(X)` | Criterio Bayesiano |

## Cuando Usar

- Clustering con formas elípticas
- Necesitas probabilidades de pertenencia
- Datos generados por Gaussianas
- Necesitas modelo generativo

## Cuando NO Usar

- Clusters de formas arbitrarias (usar DBSCAN)
- Muchos outliers (afectan medias)
- Datos categóricos (GMM asume continuos)
