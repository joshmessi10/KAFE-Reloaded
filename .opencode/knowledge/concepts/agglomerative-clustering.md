# Agglomerative Clustering

## Mathematical Foundation

Agglomerative Clustering es un algoritmo de clustering jerárquico aglomerativo (bottom-up).

### Algoritmo

1. Iniciar: cada punto es un cluster separado
2. Calcular matriz de distancias entre todos los pares de clusters
3. Encontrar los dos clusters más cercanos
4. Merge esos dos clusters
5. Repetir hasta tener n_clusters

### Criterios de Enlace (Linkage)

- **Single**: distancia mínima entre puntos de diferentes clusters
  $d(C_i, C_j) = \min_{x \in C_i, y \in C_j} ||x - y||$

- **Complete**: distancia máxima entre puntos
  $d(C_i, C_j) = \max_{x \in C_i, y \in C_j} ||x - y||$

- **Average**: distancia promedio entre puntos
  $d(C_i, C_j) = \frac{1}{|C_i||C_j|} \sum_{x \in C_i} \sum_{y \in C_j} ||x - y||$

- **Ward**: minimiza incremento de varianza intra-cluster
  $\Delta = \frac{|C_i||C_j|}{|C_i| + |C_j|} ||\mu_i - \mu_j||^2$

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(n^3)$ | $O(n^2)$ |

## Ventajas

1. **No requiere número de clusters** — puede usar dendrograma para elegir k
2. **Captura estructura jerárquica** — muestra relaciones anidadas
3. **Flexible** — múltiples criterios de enlace
4. **Determinístico** — mismo resultado siempre

## Limitaciones

1. **Escalabilidad** — O(n³) no funciona con datasets grandes
2. **No reasigna** — una vez merge, no se deshace
3. **Sensible a ruido** — outliers afectan el resultado
4. **Greedy** — no garantiza óptimo global

## Cuando Usar

- Datasets pequeños/medianos
- Estructura jerárquica en los datos
- Necesitas dendrograma
- No sabes el número de clusters

## Cuando NO Usar

- Datasets grandes (>10k puntos)
- Clusters esféricos (usar KMeans)
- Muchos outliers

## Relación con KAFE

KAFE implementa AgglomerativeClustering desde scratch con 4 criterios de enlace: single, complete, average, ward. El algoritmo es determinístico y no requiere semilla aleatoria.

## References

- Ward, J. H. (1963). Hierarchical Grouping to Optimize an Objective Function. *JASA*.
- agglomerative, A. (1979). An efficient agglomerative hierarchical clustering algorithm. *The Computer Journal*.
