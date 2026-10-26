# Tutor evaluation cases

`kafe-code.json` contains the existing general-language and learning-level prompts. `library-api.json` adds generated English and Spanish cases for all 119 intended MACHINE/GESHA top-level calls and compatibility aliases, along with known limits, unknown names, execution-evidence boundaries and the reported decision-tree teaching regression. The exact screenshot question, `Que es un decision tree y como lo implemento?`, is retained as a regression prompt.

The library dataset includes reviewed signatures, constraints, return values and evidence paths. English/Spanish concept phrases come from the reviewed contract aliases, with explicit GESHA phrase choices in `scripts/build-library-evals.cjs`. They are not machine-translated API names. Each intended call has one prompt per language. An unsupported call stays in the denominator with its actual status and negative evidence.

From `kafe-vscode`, generate and check all references and this dataset with:

```sh
npm run references:build
npm run references:check
node --test test/unit/libraryEvals.test.js
```

For a dataset-only refresh, use `node scripts/build-library-evals.cjs`, followed by the same command with `--check`. Changes to the curated contracts require a refresh; a generated-file edit alone fails the freshness test. The offline tests compare the source-derived API inventory, require both languages, exercise every natural concept and full API prompt through shipped retrieval, and check that contracts retain their signatures and limits inside the context budget. Unknown qualified names must return an explicit unavailable result rather than a different library's API.

The reviewed catalogue retains complete `.kf` examples and their expectations. Every pure example cited by either API file belongs in `reference/catalogue.json`; filesystem workflows declared under `isolatedFixtures` do not. In particular, `gesha-weights.kf` writes a file and is verified separately in a disposable runtime copy. Runtime verification requires full parsing and exact stdout, stderr and exit status against the pinned interpreter. It runs reviewed repository fixtures only; it never runs a model's suggested code.

Reference retrieval and `getLatestRunResult` provide saved evidence. Neither executes the learner's current program. The provider tools can read authorized snapshots, search references and propose changes or learning decisions. Actual Run is a separate explicit learner action that requires a trusted workspace and an available runtime. The evaluation cases check that this distinction appears in the tutor's answer when relevant.

Real-provider evaluation is **pending**. The generator and unit tests make no provider requests and do not produce model answers, quality scores or a claim that every explanation is correct. An authorized evaluation must submit these prompts to the configured provider, retain actual answers and review them against the attached facts and criteria. Use the existing learning-level cases to repeat representative tasks at Beginner, Intermediate and Expert. Assess whether answers explain the requested concept directly, use grounding quietly, give illustrative code at the requested scope, describe positional options from the full API contract, and reserve execution claims for host-observed evidence. A fixture using default arguments is one example, not proof that constructor options are unavailable.

## Study alignment

`study-alignment.json` is a static, reviewed set of 36 cases: 18 scenarios in both English and Spanish. Eight direct-concept scenarios map to sensitivity, classifier comparison, class imbalance, evaluation on new data, prediction interpretation, representation capacity, learning rate and overfitting. Additional scenarios cover a fair comparison of three fraud classifiers, an initial single-neuron XOR baseline and reasoned experiments, learner autonomy, requests for a finished submission, quiet reference use and honest claims about unrun changes. These are new synthetic scenarios. The dataset contains no actual pretest/posttest questions, linked assessment forms or answer key, and `test/**` is excluded from production packaging.

The exact reported question, `¿Cuál es la sensibilidad del modelo para detectar fraudes?`, appears in four evidence states: a supplied matrix, an authorized current run-result tool, no output, and stale run output. Every rubric starts with sensitivity as `TP/(TP+FN)` and its meaning. The tutor must establish the fraud-positive label and matrix orientation; KAFE matrices use actual-class rows and predicted-class columns in sorted class order. KAFE's `recall_score` is a macro average, so it is not automatically the fraud-positive sensitivity. If no positive samples exist, the denominator is zero and the metric is undefined for that evidence.

For an actual exercise, the tutor should locate the available TP/FN counts, ask the learner to calculate and interpret them, and avoid a finished answer or conclusion. It should inspect an authorized run-result tool before claiming that output is unavailable, ask only for missing information, and keep historical output distinct from the current code. Tool fixtures are synthetic evaluation context for a future provider harness, not actual host execution records. They never authorize a new Run. Use the dataset's shared criteria and case-specific facts together when reviewing an answer.

Run the static schema, bilingual coverage, matrix-role and evidence-oracle checks with:

```sh
node --test test/unit/studyAlignmentEvals.test.js
```

This dataset has no generator or generated freshness claim; edits require reviewing the paired prompts and their shared oracle, followed by the tests above. The tests check dataset integrity and evidence mapping. Real-provider answers, pedagogical effectiveness, participation and conceptual gains remain **pending empirical evaluation**; these checks produce no model-quality scores.
