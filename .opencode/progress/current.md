# Current Work

| Field | Value |
|-------|-------|
| Feature | Pipeline |
| Status | done |
| Current step | 5 pipeline tests passing (415 passed, 9 pre-existing failures) |
| Next step | — |
| Blockers | None |
| Related ADRs | — |

## Notes
- Implemented Pipeline desde scratch en `src/lib/KafeMACHINE/model_selection.py`
- Pipeline encadena transformaciones de preprocessing con un modelo final
- Extiende BaseMachine para compatibilidad con el tipo MACHINE de KAFE
- API: `machine.pipeline("name1", step1, "name2", step2, ...)` con pares alternados nombre/paso
- Esto se debió a que la homogeneidad de listas de KAFE no permite listas con tipos Python mezclados (StandardScaler vs LinearRegression)
- Métodos: fit(X, y), predict(X), score(X, y), transform(X), fit_transform(X, y), get_params()
- Factory function sin check_sig por argumentos variables
- 5 tests: pipeline_basic, pipeline_transform, pipeline_three_steps, pipeline_get_params, pipeline_regression_score
- 2 error fixtures: error_empty.error.kf, error_not_fitted.error.kf
- Previous feature: GridSearchCV y RandomizedSearchCV
