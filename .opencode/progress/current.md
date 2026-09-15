# Current Work

| Field | Value |
|-------|-------|
| Feature | score() optional metric support |
| Status | done |
| Current step | All 344 tests passing |
| Next step | — |
| Blockers | None |
| Related ADRs | — |

## Notes
- BaseMachine.score() added with metric=None param, raises NotImplementedError
- LinearRegression.score() default r2_score, supports custom metric
- LogisticRegression.score() default accuracy_score, supports custom metric
- KNN.score() default accuracy_score, supports custom metric
- DecisionTree.score() default accuracy_score, supports custom metric
- All @check_sig decorators removed from score() to allow optional metric param

