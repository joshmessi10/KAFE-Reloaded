# Roadmap

Active project planning. Do not move this content into AGENTS.md (see AGENTS.md — Progress Sources).

## Machine Learning
- ✔ Base Machine (2026-07-28)
- ✔ Linear Regression (2026-07-28)
- ✔ Logistic Regression (2026-07-28)
- ✔ KNN (2026-07-28)
- ✔ Decision Tree (2026-08-04)
- ✔ Preprocessing — StandardScaler, MinMaxScaler, SimpleImputer, LabelEncoder, OneHotEncoder, OrdinalEncoder, PCA (2026-09-02)
- ✔ Preprocessing — PolynomialFeatures (2026-09-21)
- ✔ KMeans (2026-09-12)
- ✔ Gaussian Naive Bayes (2026-09-12)
- ✔ DBSCAN (2026-09-14)
- ✔ Random Forest Classifier (2026-09-14)
- ✔ Random Forest Regressor (2026-09-14)
- ✔ Ridge Regression (2026-09-14)
- ✔ Lasso Regression (2026-09-14)
- ✔ ElasticNet (2026-09-21)
- ✔ SVR (2026-09-14)
- ✔ KMeans — fixes: K-Means++ edge case, score(), fit_predict() (2026-09-14)
- ✔ Metrics — Classification & Regression (2026-07-28)
- ✔ BaseMachine — Unified contract: flexible fit, _unwrap_data, _validate_matrix_shape (2026-09-14)
- ✔ SVM (classification) (2026-09-21)
- ✔ AgglomerativeClustering (2026-09-21)
- ✔ AdaBoostClassifier (2026-09-21)
- ✔ Gradient Boosting (2026-09-21)

## Model Selection

- ✔ train_test_split (2026-09-14)
- ✔ k-fold Cross Validation (2026-09-14)
- ✔ CrossValScore wrapper (2026-09-14)
- ✔ GridSearchCV (2026-09-18)
- ✔ RandomizedSearchCV (2026-09-18)
- ✔ Pipeline (2026-09-18)

## Deep Learning

- ✔ Dense (operativa desde 2026-09-24)
- ✔ Conv2D (2026-10-08)
- ✔ SimpleRNN (2026-10-08)
- ☐ Transformer
- ✔ Validación E2E RNN — EjemploRNN1 (serie temporal) + EjemploRNN2 (texto) con KafeKaggle (2026-10-18)

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
- ✔ CI Test Suite Fixes — pre-existing broken tests fixed, CrossValScore architecture fix (2026-09-21)
- ✔ KafeGESHA clustering test — platform-independence fix (2026-09-21)
- ✔ GESHA — Conv2D y SimpleRNN sobre NUMK (2026-10-08)
- ✔ GESHA — Catálogo CNN/RNN avanzado (2026-10-10)
- ✔ GESHA — inicializadores, regularizadores y callbacks (2026-10-10, ADR-0014)
- ✔ GESHA/PARDOS — ejemplo Iris supervisado con split estratificado (2026-10-10, ADR-0017)
- ✔ KafeKAGGLE — librería de ingesta de datasets de Kaggle (2026-10-08)
- ✔ KafeKAGGLE v2 — cliente kagglehub: datasets públicos sin credenciales (2026-10-08, ADR-0013)
- ✔ KafeKAGGLE — API genérica de ingesta de imágenes (load_image/load_images/load_image_dataset, reemplaza load_cifar10) + A1 en KafeMACHINE (2026-10-13, ADR-0018)
- ✔ KafeKAGGLE — ingesta robusta por carpetas (load_image_folder_dataset) + recorte de listas en errores + verificación de descarga (2026-10-13, ADR-0019)
- ✔ GESHA/NUMK — optimización del entrenamiento de CNN (2026-10-17, ADR-0020)
- ✔ KafeKAGGLE — `load_text_dataset` (texto etiquetado, TAB/sin encabezado) + `machine.tokenizer` (2026-10-18, ADR-0021)
- ✔ Ingeniería: docs ADR-0020 + benchmark CNN registrado; .opencode/tmp eliminado (evidencia→benchmarks/, herramienta→scripts/) (2026-10-18)
- ✔ Nomenclatura inglesa en helpers privados de KafeKaggle/KafeMACHINE/KafeGESHA (12 funciones; API pública intacta) (2026-10-18)
- ✔ Ejemplos maestros documentados: docs/ejemplos/ejemplo-{cnn-cifar10,rnn1-series,rnn2-sentimiento}.kf + README (2026-10-18)
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
