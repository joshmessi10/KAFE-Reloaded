# Roadmap

Active project planning. Do not move this content into AGENTS.md (see AGENTS.md — Progress Sources).

## Repository Policy Alignment

The policy baseline and earlier uv, interpreter-evidence, and English-repository workstreams are complete on their respective branches. The Python quality-gates implementation is complete on `chore/python-quality-gates`: implementation/workflow SHA `c23163de6fee34b8da7d9a25b4f2896b331c22e1` passed the hosted `Run Tests` and `Deploy Docs` workflows, including 503 tests at 83.86% coverage and the strict docs build. Final branch acceptance is gated on the plan-required CI check for the evidence-update SHA; the branch remains unmerged. See `.opencode/progress/repository-alignment.md` for scope, exact run IDs, and the observed ruleset.

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

- ☐ Dense
- ☐ Conv2D
- ☐ LSTM
- ☐ Transformer

## Optimization

- ☐ Vectorization
- ☐ Parallel execution

## Documentation & Engineering

- ✔ Interpreter subprocess quality evidence — pushed as `6e8edd5`; 497 tests passed, 83.78%; GitHub exact-SHA CI passed (2026-09-23)
- ✔ MkDocs theme — Black/White/Yellow palette (2026-08-04)
- ✔ Knowledge concepts — All ML algorithms documented (2026-08-04)
- ✔ Benchmarks — Full suite characterization (2026-08-04)
- ✔ BaseMachine Architectural Review — ADR-0007 (2026-09-14)
- ✔ score() optional metric support (2026-09-14)
- ✔ Preprocessing validation improvements — PCA, OneHotEncoder, SimpleImputer (2026-09-14)
- ✔ Model validation improvements — dimension checks, len(X)==len(y), hyperparameter validation (2026-09-14)
- ✔ CI Test Suite Fixes — pre-existing broken tests fixed, CrossValScore architecture fix (2026-09-21)
- ✔ KafeGESHA clustering test — platform-independence fix (2026-09-21)
- ✔ English repository migration — Tasks 1–7 completed (2026-09-24)
- ✔ Python quality-gates implementation — hosted tests and strict docs validation passed at exact SHA `c23163de6fee34b8da7d9a25b4f2896b331c22e1` (2026-09-24); Task 9 final branch acceptance is tied to CI on the resulting evidence-update SHA
- ☐ Harness Engineering — Update rules for five benchmarks, enriched concepts, and context verification
- ☐ Engineering Lead permissions — review complete edit/write access for documentation and records

## Historical Review Tasks — Full Review Pending

Each implementation must pass through the full engineering-harness workflow:
Impact Analysis → Implementation → Five Benchmarks → Enriched Concept → Docs → History → Definition of Done

- ☐ Review BaseMachine — fit/transform/score, enriched concept, five benchmarks, July 28 history
- ☐ Review LinearRegression — OLS normal equation, enriched concept, five benchmarks, July 28 history
- ☐ Review LogisticRegression — gradient descent + sigmoid, enriched concept, five benchmarks, July 28 history
- ☐ Review KNN — Euclidean distance, enriched concept, five benchmarks, July 28 history
- ☐ Review classification metrics — accuracy/precision/recall/F1, enriched concept, five benchmarks, July 28 history
- ☐ Review regression metrics — MSE/MAE/R², enriched concept, five benchmarks, July 28 history
