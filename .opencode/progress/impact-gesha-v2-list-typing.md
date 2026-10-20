# Impact: heterogeneous Python classes in GESHA lists

## Current behavior

`global_utils.verify_homogeneity` compares the concrete Python class of each flattened list element. A valid Sequential layer list containing `SimpleRNN` and `Dense` is rejected before the `geshaV2.sequential` call, although both values have KAFE type `GESHA`.

## Affected modules

- `TypeUtils.get_data_type`: classify the redesigned Gesha initializer, regularizer, optimizer, loss, and callback objects as `GESHA` before the callable fallback.
- `global_utils.verify_homogeneity`: accept different Python classes only when each element has KAFE type `GESHA`.
- Gesha RNN fixtures and list typing documentation.

## Risks and validation

Mixed primitive lists must remain invalid. Existing `geshaDeep` lists must retain their behavior. Run the two new RNN interpreter fixtures, a focused positive/negative homogeneity test, and the full test suite. Record the compatibility decision in ADR-0015.
