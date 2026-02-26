# Test Results Summary

**Date**: Test run completed
**Total Tests**: 143 collected
**Passed**: 115 ✓
**Failed**: 25 ✗
**Errors**: 2 ⚠
**Skipped**: 3 ⊘

## Test Breakdown by Module

### ✓ Passing Modules (100%)

- **test_Algorithms.py**: 8/8 passed
- **test_KafeMATH.py**: 4/4 passed
- **test_KafeNUMK.py**: 10/10 passed
- **test_base.py**: 29/29 passed
- **test_bucles.py**: 14/14 passed
- **test_condicionales.py**: 7/7 passed
- **test_funciones.py**: 25/25 passed
- **test_import.py**: 3/3 passed

### ⚠ Modules with Failures

#### test_KafeFiles.py (4/8 failed)

**Failed tests**:

- `file_append.kf` - File path/content mismatch
- `file_create.kf` - Empty output mismatch
- `file_read.kf` - File not found or path issue
- `file_write.kf` - Empty output mismatch
- `file_read_nonexistent_error.kf` - Wrong error message

**Issue**: File operations tests are failing due to file path resolution or expected output mismatches.

#### test_KafeGESHA.py (1/4 failed, 2 errors)

**Errors**:

- `neural_network_and_gate.kf` - Test appears to have duplicate entries (ERROR status)

**Failed**:

- `neural_network_multiclass.kf` - Output format mismatch

**Issue**: Neural network tests have output format issues, possibly due to floating-point precision or formatting differences.

#### test_KafePARDOS.py (11/11 failed)

**All tests failing**:

- `dataframe_basic_operations.kf`
- `dataframe_export.kf`
- `dataframe_filtering.kf`
- `dataframe_float_column.kf`
- `dataframe_groupby.kf`
- `dataframe_mixed_types.kf`
- `dataframe_sorting.kf`
- `dataframe_statistics.kf`
- `dataframe_string_column.kf` - File not found: 'test3.csv'
- `dataframe_invalid_column_error.kf` - Wrong error message
- `dataframe_type_mismatch_error.kf` - Wrong error message

**Issue**: DataFrame tests are systematically failing. Main issues:

1. Missing CSV test files (test3.csv)
2. Output format mismatches (quotes, formatting)
3. Error message mismatches

#### test_KafePLOT.py (8/17 failed)

**Failed tests**:

- `plot_dense_data.kf` - SVG file mismatch
- `plot_descending_values.kf` - SVG file mismatch
- `plot_empty_list.kf` - SVG file mismatch
- `plot_mixed_positive_negative.kf` - SVG file mismatch
- `plot_multiple_points.kf` - SVG file mismatch
- `plot_negative_values.kf` - SVG file mismatch
- `plot_sine_wave.kf` - Non-zero exit code
- `plot_sparse_data.kf` - SVG file mismatch

**Issue**: Plot tests are failing due to SVG output mismatches. The generated SVG files don't match the expected reference SVGs.

## Priority Issues to Fix

### High Priority

1. **KafePARDOS (11 failures)**: All dataframe tests failing
   - Missing test data files (test3.csv)
   - Output format inconsistencies
   - Error message mismatches

2. **KafePLOT (8 failures)**: SVG generation issues
   - Generated plots don't match expected SVGs
   - One test crashes (plot_sine_wave.kf)

### Medium Priority

3. **KafeFiles (5 failures)**: File I/O issues
   - File path resolution problems
   - Expected output mismatches

4. **KafeGESHA (3 issues)**: Neural network output formatting
   - Duplicate test entries causing errors
   - Output format differences

## Next Steps

1. Investigate KafePARDOS failures - check for missing CSV files
2. Review KafePLOT SVG generation - may need to regenerate reference SVGs
3. Fix KafeFiles path resolution issues
4. Clean up KafeGESHA test duplicates and output formatting
