# Roadmap

Active project planning. Do not move this content into AGENTS.md (see AGENTS.md — Progress Sources).

## Machine Learning
- ✔ Base Machine (2026-07-28)
- ✔ Linear Regression (2026-07-28)
- ✔ Logistic Regression (2026-07-28)
- ✔ KNN (2026-07-28)
- ✔ Decision Tree (2026-08-04)
- ✔ Preprocessing — StandardScaler, MinMaxScaler, SimpleImputer, LabelEncoder, OneHotEncoder, OrdinalEncoder, PCA (2026-09-02)
- ✔ KMeans (2026-09-12)
- ✔ Gaussian Naive Bayes (2026-09-12)
- ✔ DBSCAN (2026-09-14)
- ✔ Random Forest Classifier (2026-09-14)
- ✔ Random Forest Regressor (2026-09-14)
- ✔ Ridge Regression (2026-09-14)
- ✔ Lasso Regression (2026-09-14)
- ✔ SVR (2026-09-14)
- ✔ KMeans — fixes: K-Means++ edge case, score(), fit_predict() (2026-09-14)
- ✔ Metrics — Classification & Regression (2026-07-28)
- ✔ BaseMachine — Unified contract: flexible fit, _unwrap_data, _validate_matrix_shape (2026-09-14)
- ☐ SVM (classification)
- ☐ Gradient Boosting

## Deep Learning

- ☐ Dense
- ☐ Conv2D
- ☐ LSTM
- ☐ Transformer

## Optimization

- ☐ Vectorization
- ☐ Parallel execution

## Documentation & Engineering

- ✔ MkDocs theme — Black/White/Yellow palette (2026-08-04)
- ✔ Knowledge concepts — All ML algorithms documented (2026-08-04)
- ✔ Benchmarks — Full suite characterization (2026-08-04)
- ✔ BaseMachine Architectural Review — ADR-0007 (2026-09-14)
- ✔ score() optional metric support (2026-09-14)
- ✔ Preprocessing validation improvements — PCA, OneHotEncoder, SimpleImputer (2026-09-14)
- ✔ Model validation improvements — dimension checks, len(X)==len(y), hyperparameter validation (2026-09-14)
- ☐ Harness Engineering — Actualizar reglas (5 benchmarks, conceptos enriquecidos, verificación de contexto)
- ☐ Engineering Lead Permissions — Permisos edit/write para docs y records

## Review Tasks (Historical) — Pendientes de Revisión Full

Cada implementación debe pasar por el flujo completo del harness engineering:
Impact Analysis → Implementación → 5 Benchmarks → Concepto Enriquecido → Docs → History → DoD

- ☐ Revisión de BaseMachine — fit/transform/score, concepto enriquecido, 5 benchmarks, history 28 julio
- ☐ Revisión de LinearRegression — OLS normal equation, concepto enriquecido, 5 benchmarks, history 28 julio
- ☐ Revisión de LogisticRegression — gradient descent + sigmoid, concepto enriquecido, 5 benchmarks, history 28 julio
- ☐ Revisión de KNN — Euclidean distance, concepto enriquecido, 5 benchmarks, history 28 julio
- ☐ Revisión de Métricas de Clasificación — accuracy/precision/recall/F1, concepto enriquecido, 5 benchmarks, history 28 julio
- ☐ Revisión de Métricas de Regresión — MSE/MAE/R², concepto enriquecido, 5 benchmarks, history 28 julio
