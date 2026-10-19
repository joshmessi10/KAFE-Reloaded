# Backlog

Candidate items not yet on the roadmap. Add items here during Impact Analysis and planning sessions.

## Machine Learning

- Gradient Boosting (ensemble method, combines weak learners sequentially)
- SVM (Support Vector Machine, kernel methods)

## Deep Learning

- Conv2D (convolutional layers for image processing)
- LSTM (recurrent layers for sequence modeling)
- Transformer (attention-based architecture)

## Language / Core

- Vectorization (batch operations for performance)
- Parallel execution (multi-threading support)
- Fix `Model.predict` single-sample en secuencias (distinguir lote por profundidad de anidamiento en vez de `isinstance(X[0], list)`; ADR-0021 D4; known-issues; prioridad alta)
- Fix `KafeMATH.log` error de signo cerca de 1 (BCE.compute puede imprimirse negativa; technical-debt; prioridad media)

## Libraries

- [x] KafeKAGGLE — importación de datasets de Kaggle (patrón KafeHF / ADR-0012) — completado 2026-10-08
- [x] KafeKAGGLE — interfaz genérica de ingesta de imágenes (reemplaza load_cifar10) — completado 2026-10-13
- [x] KafeKAGGLE — ingesta robusta de datasets de imágenes (etiquetas por carpetas) — completado 2026-10-13

## Documentation

- Review tasks for legacy implementations (BaseMachine, LinearRegression, LogisticRegression, KNN, Metrics)
