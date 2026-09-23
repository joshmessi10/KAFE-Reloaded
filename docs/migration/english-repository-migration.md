# English repository migration inventory

This is the path, route, and compatibility contract for the approved English migration. It records the tracked tree at `58bf7d51ac1dcbc462e735bcfe5d555192a9a106` before renaming. The migration changes owned English-facing names and prose while preserving KAFE execution semantics, CLI exit codes, and fixture purposes. Old Python aliases, KAFE aliases, file paths, and documentation redirects are **not retained**. Consumers must adopt the replacements below.

The Spanish spellings in this note are literal old paths, source symbols, fixture names, or code examples needed for migration. The explanatory prose and target names are English.

KAFE syntax stays English and unchanged. In particular, the lexer literals `drip`, `pour`, `show`, `len`, `remove`, `append`, `return`, `if`, `elif`, `else`, `match`, `FUNC`, `range`, `import`, `int`, `float`, `str`, `bool`, `List`, `INT`, `FLOAT`, `BOOL`, `VOID`, `STR`, `GESHA`, `PARDOS`, `MACHINE`, `True`, and `False` are not translated. The built-in import keys `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`, and `huggingface` remain exactly as registered by `EvalVisitorPrimitivo.self.libraries`.

## Work ownership and text surfaces

| Later task | Tracked surfaces to review and translate |
|---|---|
| 2 — core | `src/Kafe.py`, `src/EvalVisitorPrimitivo.py`, `src/TypeUtils.py`, `src/global_utils.py`, `src/globals.py`, `src/errores.py`, both `.g4` grammars, and all `src/componentes_lenguaje/**`. Translate internal identifiers, comments, diagnostics, and paths; preserve lexer literals. `src/Ejemplo.kf` is a first-party example and becomes `src/Example.kf`. |
| 3 — libraries | Every owned `src/lib/**` Python file, including comments, docstrings, parameters, diagnostics, import references, and Spanish internal helpers. Public English library calls and object methods remain spelled as they are. |
| 4 — tests and data | Every owned `tests/**/*.py`, `.kf`, `.in`, `.expec`, `.error.expec`, `.error.stderr.expec`, `.error.stdout.expec`, `.txt`, `.csv`, `.json`, and `.svg`. Translate meaningful strings, comments, test identifiers, data headers/labels, and SVG text/metadata while retaining cases, values, pairings, and stream contracts. |
| 5 — site | All tracked `docs/**/*.md` and `docs/**/*.kf`, `docs/assets/css/custom.css` if human-readable text exists, `mkdocs.yml`, `README.md`, and documentation references in `OPENCODE.md`. Change `theme.language: es` to `en`, translate site/nav labels and prose, update links/anchors, and retain correct KAFE syntax in examples. |
| 6 — records and retirement | `AGENTS.md`, `CLAUDE.md`, `OPENCODE.md`, all tracked `.opencode/**/*.md` (ADR, agents, benchmarks, commands, history, knowledge/concepts, memory, progress, skills, templates), and root guidance/configuration prose. Translate historical entries faithfully while preserving dates, IDs, decisions, and measured results; add ADR-0011 for this one-time backfill. The root instruction mirrors must remain substantively equal. Remove only the three approved artifacts listed below. |
| 7 — final audit | Re-enumerate `git ls-files` across source, tests, docs, records, `.github/workflows/*.yml`, `pyproject.toml`, `opencode.json`, `flake.nix`, `src/Makefile`, and all tracked text-bearing assets. Search old names and Spanish prose manually; technical data, established product/proper names, mathematical notation, third-party symbols, and KAFE syntax are not prose to translate blindly. |

The tracked baseline contains 1,458 paths: 116 under `src/`, 1,174 under `tests/`, 38 under `docs/`, and 112 under `.opencode/`. The other 18 are root/configuration/workflow files. These counts are a baseline for coverage, not a requirement that the final count remain fixed.

## Source and Python import path map

Every listed directory move applies to **every tracked descendant**, including files whose basename stays English, such as `utils.py`. The `base` and `method_calling` subdirectories retain those names under the new parent. Entries below resolve all renamed source modules; names absent from the table stay at their present paths.

| Old path | New path | Owner |
|---|---|---|
| `src/Ejemplo.kf` | `src/Example.kf` | 2 |
| `src/EvalVisitorPrimitivo.py` | `src/InterpreterVisitor.py` | 2 |
| `src/errores.py` | `src/errors.py` | 2 |
| `src/componentes_lenguaje/` | `src/language_components/` | 2; all tracked descendants |
| `src/componentes_lenguaje/bucles/` | `src/language_components/loops/` | 2; all tracked descendants |
| `src/componentes_lenguaje/condicionales/` | `src/language_components/conditionals/` | 2; all tracked descendants |
| `src/componentes_lenguaje/funciones/` | `src/language_components/functions/` | 2; all tracked descendants |
| `src/componentes_lenguaje/importar/` | `src/language_components/imports/` | 2; all tracked descendants |
| `src/componentes_lenguaje/librerias/` | `src/language_components/libraries/` | 2; all tracked descendants |
| `src/componentes_lenguaje/base/funciones.py` | `src/language_components/base/functions.py` | 2 |
| `src/componentes_lenguaje/bucles/funciones.py` | `src/language_components/loops/functions.py` | 2 |
| `src/componentes_lenguaje/condicionales/funciones.py` | `src/language_components/conditionals/functions.py` | 2 |
| `src/componentes_lenguaje/funciones/funciones.py` | `src/language_components/functions/functions.py` | 2 |
| `src/componentes_lenguaje/funciones/utils.py` | `src/language_components/functions/utils.py` | 2 |
| `src/componentes_lenguaje/importar/funciones.py` | `src/language_components/imports/functions.py` | 2 |
| `src/componentes_lenguaje/librerias/funciones.py` | `src/language_components/libraries/functions.py` | 2 |
| `src/componentes_lenguaje/method_calling/funciones.py` | `src/language_components/method_calling/functions.py` | 2 |
| `src/lib/KafeFILES/funciones.py` | `src/lib/KafeFILES/functions.py` | 3 |
| `src/lib/KafeGESHA/funciones.py` | `src/lib/KafeGESHA/functions.py` | 3 |
| `src/lib/KafeHF/funciones.py` | `src/lib/KafeHF/functions.py` | 3 |
| `src/lib/KafeMACHINE/funciones.py` | `src/lib/KafeMACHINE/functions.py` | 3 |
| `src/lib/KafeMATH/funciones.py` | `src/lib/KafeMATH/functions.py` | 3 |
| `src/lib/KafeMATH/errores.py` | `src/lib/KafeMATH/errors.py` | 3 |
| `src/lib/KafeNUMK/funciones.py` | `src/lib/KafeNUMK/functions.py` | 3 |
| `src/lib/KafeNUMK/errores.py` | `src/lib/KafeNUMK/errors.py` | 3 |
| `src/lib/KafePARDOS/funciones.py` | `src/lib/KafePARDOS/functions.py` | 3 |
| `src/lib/KafePLOT/funciones.py` | `src/lib/KafePLOT/functions.py` | 3 |

`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, token files, and `.interp` files are generated by ANTLR 4.13.2 and ignored, not tracked rename targets. The grammar labels `unaryExpresion`, `primaryExpresion`, and `lambdaExpresion` become `unaryExpression`, `primaryExpression`, and `lambdaExpression`. Their generated visitor methods become `visitUnaryExpression`, `visitPrimaryExpression`, and `visitLambdaExpression`; update `visitUnaryExpresion` and `visitLambdaExpresion` in the owned visitor and check whether a `visitPrimaryExpresion` override is needed. Grammar rule/token names and token literals remain stable.

## Dispatch and public-name audit

`visitObjectFunctionCall` and `visitObjectConstant` resolve `object.name` against the eight-entry library registry, then `getattr(library_module, name)` or `getattr(object_t, name)`. Thus top-level functions/constants in a registered `src/lib/Kafe*/functions.py` and callable or readable object attributes are KAFE-visible; the old filename `funciones.py` was an internal Python import path. Existing exported names in these libraries are English (including `math` functions, `numk` operations, `files.create/read/write/delete`, `plot.figure/graph/render/bar/pie`, `pardos.read_csv/read_json/concat/merge`, Gesha layer/model functions, machine constructors/metrics, and Hugging Face functions). **The audit found no Spanish KAFE public callable requiring a spelling change.** Do not translate their English names to a different API.

`src/componentes_lenguaje/librerias/funciones.py` uses `getattr` for library function and constant dispatch; `src/componentes_lenguaje/method_calling/funciones.py` uses it for object functions and constants. Other `getattr` calls in `funciones/funciones.py`, `funciones/utils.py`, and `src/lib/KafeMACHINE/BaseMachine.py` inspect English Python attributes (`signature`, `_name`, `_is_fitted`) and are not KAFE name translations. `DataFrame.query(query_str)` calls the generated KAFE lexer/parser on a KAFE expression, injects column values into visitor scope via `asignar_variable`, and evaluates the tree. Its method name and expression grammar remain unchanged; the internal helper import changes with Task 2.

Spanish Python names are externally importable but not reached as KAFE built-in call names. Rename `EvalVisitorPrimitivo` to `InterpreterVisitor`; `revisarImportacion` to `check_imported`; `esObjeto` to `is_object`; `obtener_tipo_dentro_lista`/`obtener_tipo_lista`/`obtener_tipo_dato` to `get_inner_list_type`/`get_list_type`/`get_data_type`; `esTipoCorrecto`/`asignar_variable`/`obtener_nivel_anidamiento`/`verificarHomogeneidad` to `is_correct_type`/`assign_variable`/`get_nesting_level`/`verify_homogeneity`; `inferir_tipo` to `infer_type`; `globals.ruta_programa` to `globals.program_path`; and `tests.utils.obtener_parametros` to `tests.utils.get_parameters`. The additional cross-module helper mappings below are part of the same Python import migration. These are source-level Python import/attribute migrations; change all first-party references atomically. Spanish parameters, locals, and comments are translated in the owning task. Do not claim a KAFE call spelling changed merely because its Python implementation signature changes.

| Old Python helper | English replacement | Definition and callers to update |
|---|---|---|
| `construir_tipo_lista` | `build_list_type` | Defined and recursively called in `src/TypeUtils.py`; used there to construct type constants and imported/called by `src/lib/KafePLOT/funciones.py` for `bar` and `pie` signatures. Tasks 2 and 3 must update both modules together. |
| `es_misma_dimension` | `has_same_dimensions` | Defined in `src/lib/KafeNUMK/utils.py`; imported and called by `src/lib/KafeNUMK/funciones.py` in `add` and `sub`. It compares outer lengths and each corresponding row length. Task 3. |
| `es_uniforme` | `is_uniform_matrix` | Defined in `src/lib/KafeNUMK/utils.py`; imported and called by `src/lib/KafeNUMK/funciones.py` in `mul`, `inv`, and `dot_matrix`. It checks equal row lengths and accepts an empty matrix. Task 3. |
| `operar_matrices` | `apply_matrix_operation` | Defined in `src/lib/KafeNUMK/utils.py`; imported and called by `src/lib/KafeNUMK/funciones.py` in `add` and `sub` to apply the supplied operation element by element. Task 3. |

### Task 3 shared type and decorator migration

The following exact Python identifier moves were rescanned across `src/TypeUtils.py`, `src/global_utils.py`, `src/language_components/**`, and every `src/lib/**` file before editing. `src/TypeUtils.py` defines every type name below. Library consumers include the listed root files and all imports in their nested `KafeGESHA` and `KafeMACHINE` packages; references to these names are changed together, with no aliases. The type *values* (`INT`, `List[...]`, and others) stay unchanged.

| Old Python name | New Python name | Caller surfaces found |
|---|---|---|
| `nombre_tipos` | `type_names` | `TypeUtils.py` only |
| `vector_numeros_t` | `numeric_vector_types` | 31 files in `src/lib/KafeGESHA`, `KafeMACHINE`, `KafeMATH`, `KafeNUMK`, `KafePLOT` |
| `matriz_numeros_t` | `numeric_matrix_types` | 33 files in `src/lib/KafeGESHA`, `KafeMACHINE`, `KafeNUMK`, `KafePLOT` |
| `matriz_cualquiera_t` | `any_matrix_type` | `KafeNUMK/funciones.py`, `KafePARDOS/DataFrame.py`, `KafeMACHINE/preprocessing/SimpleImputer.py` |
| `lista_cadenas_t` | `string_list_type` | `KafeGESHA/funciones.py`, `KafeGESHA/core/model.py`, `KafePARDOS/DataFrame.py`, `KafeMACHINE/preprocessing/OneHotEncoder.py`, `OrdinalEncoder.py` |
| `numeros_t` | `number_types` | `TypeUtils.py` only as a complete token; 40 substring matches arise from the numeric vector/matrix names |
| `entero_t` | `integer_type` | `global_utils.py`, `language_components/base/functions.py`, `language_components/functions/functions.py`, and 18 library files |
| `flotante_t` | `float_type` | `global_utils.py`, `language_components/base/functions.py`, and 14 library files |
| `booleano_t` | `boolean_type` | `global_utils.py`, `language_components/base/functions.py`, and 5 library files |
| `cadena_t` | `string_type` | `global_utils.py`, `language_components/base/functions.py`, `language_components/loops/functions.py`, and 11 library files |
| `lista_t` | `list_type` | `global_utils.py`, `language_components/base/functions.py` |
| `gesha_t` | `gesha_type` | `language_components/base/functions.py` and 3 library files |
| `pardos_t` | `pardos_type` | `language_components/base/functions.py` and 29 library files |
| `machine_t` | `machine_type` | `KafeMACHINE/preprocessing/LabelEncoder.py` |
| `funcion_t` | `function_type` | `global_utils.py`, `language_components/functions/functions.py` |
| `lista_cualquiera_t` | `any_list_types` | `global_utils.py`, `language_components/functions/functions.py`, and 5 library files |
| `todos_t` | `all_types` | `language_components/functions/functions.py` |
| `func_nombre` | `function_name` | `global_utils.py` decorator keyword lookup; keyword callers in `language_components/functions/functions.py` and `KafePLOT/funciones.py` |

`void_t` is already English and remains unchanged. The other Task 3 internal helpers map as `es_misma_dimension` → `has_same_dimensions`, `es_uniforme` → `is_uniform_matrix`, `operar_matrices` → `apply_matrix_operation`, and `inferir_tipo` → `infer_type`; `construir_tipo_lista` → `build_list_type` was completed in Task 2.

Task 3 translated library diagnostics before the fixture-wide Task 4 rename. To keep Task 3's exact-stream fixture gate executable, it updated only the directly corresponding KafeGESHA expected sidecars: the valid `neural_network_xor_gate.expec` summary line and the paired `.error.expec`/`.error.stderr.expec` files for `invalid_loss`, `invalid_optimizer`, and `set_lr_before_compile`. Their programs, fixture names, exit codes, and other output were unchanged. Task 4 still owns the broader fixture content and path translation.

`importStmt` first recognizes the unchanged registry keys. For user modules it searches `<current KAFE program directory>/<module>.kf`, then `<directory of imports/functions.py>/<module>.kf`, then its parent `<language_components>/<module>.kf`. Moving the module changes those latter two fallback directories; preserve this search behavior intentionally and document the resulting paths in import diagnostics. `tests/import/matematica.kf` is a user module, not a built-in library key; programs must change `import matematica` to `import math_module` when that fixture moves.

## Test and fixture path map

| Old path/pattern | New path/pattern | Contract |
|---|---|---|
| `tests/bucles/<relative path>` | `tests/loops/<same relative path>` | Move every tracked `.kf`, `.expec`, `.in`, `.error.stderr.expec`, and `.error.stdout.expec` descendant as one set. |
| `tests/condicionales/<relative path>` | `tests/conditionals/<same relative path>` | Same pairing rule. |
| `tests/funciones/<relative path>` | `tests/functions/<same relative path>` | Same pairing rule. |
| `tests/test_bucles.py` | `tests/test_loops.py` | Update collector directory. |
| `tests/test_condicionales.py` | `tests/test_conditionals.py` | Update collector directory. |
| `tests/test_funciones.py` | `tests/test_functions.py` | Update collector directory. |
| `tests/import/matematica.kf` | `tests/import/math_module.kf` | Update user-module imports. |
| `tests/import/matematica.expec` | `tests/import/math_module.expec` | Keep expected output paired. |
| `tests/KafeGESHA/{clustering,multiclass}/grafico_<stem>.svg` | `tests/KafeGESHA/{clustering,multiclass}/graph_<stem>.svg` | Both tracked SVG assets. |
| `tests/KafePLOT/grafico_<stem>.svg` | `tests/KafePLOT/graph_<stem>.svg` | All 22 tracked SVG assets; update the two plot test modules' `grafico_` filename construction consistently. |

For the last two SVG rows, `<stem>` is exactly the unchanged suffix after `grafico_` in each tracked filename; no other suffix substitution is implied. `src/lib/KafePLOT/utils.py` writes `<program basename>.svg`, while `tests/test_KafePLOT.py` and `tests/test_KafeGESHA.py` construct the tracked `grafico_<basename>.svg` comparison paths. Keep actual generated names and comparison paths aligned. `tests/utils.py` discovers valid `*.kf` except `*.error.kf` and invalid `*.error.kf` recursively; `obtener_parametros` reads matching `.in` and `.expec` by base. Invalid cases additionally require full `.stderr.expec`, optional `.stdout.expec`, final semantic error, and exit code 1; valid cases require exact stdout, empty stderr, and exit code 0. Do not collapse `.error.expec` into stream sidecars or drop a case. The remaining first-party KAFE fixtures in `tests/Algorithms`, `tests/Kafe*`, `tests/base`, `tests/data`, and `tests/import` keep their path unless explicitly mapped above, but their Spanish identifiers, prose, data labels, and expected diagnostics are Task 4 content changes.

## Documentation file and route map

Routes below are relative to `https://joshmessi10.github.io/KAFE-Reloaded/`. MkDocs Markdown routes end in `/`; the `.kf` example routes keep their extension. The exact file move also defines the new repository link target. `docs/index.md`, `docs/assets/css/custom.css`, and already-English basenames remain in place. `docs/migration/english-repository-migration.md` is a new `/migration/english-repository-migration/` route.

| Old file | New file | Old route → new route |
|---|---|---|
| `docs/PLAN.md` | `docs/documentation-plan.md` | `/PLAN/` → `/documentation-plan/` |
| `docs/about/creditos.md` | `docs/about/credits.md` | `/about/creditos/` → `/about/credits/` |
| `docs/about/licencia.md` | `docs/about/license.md` | `/about/licencia/` → `/about/license/` |
| `docs/bibliotecas/files.md` | `docs/libraries/files.md` | `/bibliotecas/files/` → `/libraries/files/` |
| `docs/bibliotecas/gesha.md` | `docs/libraries/gesha.md` | `/bibliotecas/gesha/` → `/libraries/gesha/` |
| `docs/bibliotecas/machine.md` | `docs/libraries/machine.md` | `/bibliotecas/machine/` → `/libraries/machine/` |
| `docs/bibliotecas/math.md` | `docs/libraries/math.md` | `/bibliotecas/math/` → `/libraries/math/` |
| `docs/bibliotecas/numk.md` | `docs/libraries/numk.md` | `/bibliotecas/numk/` → `/libraries/numk/` |
| `docs/bibliotecas/pardos.md` | `docs/libraries/pardos.md` | `/bibliotecas/pardos/` → `/libraries/pardos/` |
| `docs/bibliotecas/plot.md` | `docs/libraries/plot.md` | `/bibliotecas/plot/` → `/libraries/plot/` |
| `docs/ejemplos/decision-tree.kf` | `docs/examples/decision-tree.kf` | `/ejemplos/decision-tree.kf` → `/examples/decision-tree.kf` |
| `docs/ejemplos/ejemplo-clustering-plot.kf` | `docs/examples/clustering-plot-example.kf` | `/ejemplos/ejemplo-clustering-plot.kf` → `/examples/clustering-plot-example.kf` |
| `docs/ejemplos/fibo-curri.kf` | `docs/examples/fibonacci-currying.kf` | `/ejemplos/fibo-curri.kf` → `/examples/fibonacci-currying.kf` |
| `docs/ejemplos/hola-mundo.kf` | `docs/examples/hello-world.kf` | `/ejemplos/hola-mundo.kf` → `/examples/hello-world.kf` |
| `docs/ejemplos/merge-sort.kf` | `docs/examples/merge-sort.kf` | `/ejemplos/merge-sort.kf` → `/examples/merge-sort.kf` |
| `docs/ejemplos/red-neuronal.kf` | `docs/examples/neural-network.kf` | `/ejemplos/red-neuronal.kf` → `/examples/neural-network.kf` |
| `docs/ejemplos/regresion-lineal.kf` | `docs/examples/linear-regression.kf` | `/ejemplos/regresion-lineal.kf` → `/examples/linear-regression.kf` |
| `docs/errores/errores-lexicos.md` | `docs/errors/lexical-errors.md` | `/errores/errores-lexicos/` → `/errors/lexical-errors/` |
| `docs/errores/errores-semanticos.md` | `docs/errors/semantic-errors.md` | `/errores/errores-semanticos/` → `/errors/semantic-errors/` |
| `docs/errores/errores-sintacticos.md` | `docs/errors/syntax-errors.md` | `/errores/errores-sintacticos/` → `/errors/syntax-errors/` |
| `docs/errores/referencia-errores.md` | `docs/errors/error-reference.md` | `/errores/referencia-errores/` → `/errors/error-reference/` |
| `docs/errores/tipos-error.md` | `docs/errors/error-types.md` | `/errores/tipos-error/` → `/errors/error-types/` |
| `docs/especificacion/analisis-lexico-sintactico-semantico.md` | `docs/specification/lexical-syntactic-semantic-analysis.md` | `/especificacion/analisis-lexico-sintactico-semantico/` → `/specification/lexical-syntactic-semantic-analysis/` |
| `docs/especificacion/gramatica-ebnf.md` | `docs/specification/ebnf-grammar.md` | `/especificacion/gramatica-ebnf/` → `/specification/ebnf-grammar/` |
| `docs/especificacion/precedencia-operadores.md` | `docs/specification/operator-precedence.md` | `/especificacion/precedencia-operadores/` → `/specification/operator-precedence/` |
| `docs/especificacion/semantica-operacional.md` | `docs/specification/operational-semantics.md` | `/especificacion/semantica-operacional/` → `/specification/operational-semantics/` |
| `docs/guia-inicio/ejemplos-basicos.md` | `docs/getting-started/basic-examples.md` | `/guia-inicio/ejemplos-basicos/` → `/getting-started/basic-examples/` |
| `docs/guia-inicio/instalacion.md` | `docs/getting-started/installation.md` | `/guia-inicio/instalacion/` → `/getting-started/installation/` |
| `docs/guia-inicio/primer-programa.md` | `docs/getting-started/first-program.md` | `/guia-inicio/primer-programa/` → `/getting-started/first-program/` |
| `docs/lenguaje/estructura-lexica.md` | `docs/language/lexical-structure.md` | `/lenguaje/estructura-lexica/` → `/language/lexical-structure/` |
| `docs/lenguaje/estructuras-control.md` | `docs/language/control-structures.md` | `/lenguaje/estructuras-control/` → `/language/control-structures/` |
| `docs/lenguaje/funciones.md` | `docs/language/functions.md` | `/lenguaje/funciones/` → `/language/functions/` |
| `docs/lenguaje/importaciones.md` | `docs/language/imports.md` | `/lenguaje/importaciones/` → `/language/imports/` |
| `docs/lenguaje/listas.md` | `docs/language/lists.md` | `/lenguaje/listas/` → `/language/lists/` |
| `docs/lenguaje/operadores.md` | `docs/language/operators.md` | `/lenguaje/operadores/` → `/language/operators/` |
| `docs/lenguaje/sistema-tipos.md` | `docs/language/type-system.md` | `/lenguaje/sistema-tipos/` → `/language/type-system/` |

Update every `mkdocs.yml` nav entry (including labels), internal Markdown links, anchors, README links, and repository guidance references to these targets. MkDocs currently omits the clustering plot example from nav but it is still a tracked example and must move. The current `not_in_nav: /PLAN.md` setting keeps the documentation plan out of navigation while leaving its built route available. Task 5 must preserve that unlisted status by changing the setting to `not_in_nav: /documentation-plan.md`; the new `/documentation-plan/` route remains available without a redirect.

## Approved retirement and migration notice

Only `KAFE LANGUAGE Deep Learning for Dummies .pdf`, `test_results.txt`, and `test_output.txt` are approved for removal from the current tree. Their Git objects remain historical recovery points. `src/stderr.txt` and test input/output data are not on the removal list; inspect and translate or retain them according to content. No other file is implicitly retired by this inventory.

The new paths and Python names are intentional breaking changes for callers that import internals or link old site routes. There are no old-name aliases and no route redirects. KAFE's existing executable vocabulary and built-in import keys remain unchanged. Release notes must point users to this map and call out the renamed user-module fixture only as an example migration, not as a KAFE syntax change.
