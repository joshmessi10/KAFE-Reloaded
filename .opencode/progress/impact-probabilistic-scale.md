# Impact Analysis: Probabilistic models at scale

## Affected Modules

- `src/lib/KafeMACHINE/clustering/GaussianMixture.py` and `naive_bayes/GaussianNB.py`.
- GMM/GaussianNB exact-output fixtures, regression tests, Machine guides, and concept records.

## Risks

- Moving from approximate KafeMATH scalar functions to Python built-in math changes small printed decimals; update only affected snapshots after confirming predictions and mathematical identities.
- Log-space calculations must preserve class/component ordering and avoid division by zero; test extreme samples and high-dimensional input.

## Compatibility Impact

- Public signatures and return shapes remain unchanged. Numerical values of scores, probabilities, AIC, and BIC may change to represent the correct quantities.
- BIC now uses natural logarithm of sample count, matching its published formula.

## Documentation Impact

- Explain log-space evaluation, diagonal covariance, and the corrected BIC formula in the Machine guides and concept record.

## Testing Impact

- Test 800-dimensional GMM separation, extreme-sample likelihood ordering, BIC identity, and GaussianNB prediction for a distant sample.
- Run focused fixtures, full suite, Ruff, and strict MkDocs.

## Implementation Plan

1. Compute Gaussian component and feature densities as log values.
2. Normalize with log-sum-exp and retain the existing public output shapes.
3. Correct BIC base and repeat-fit convergence state.
4. Update snapshots, documentation, and verify.
