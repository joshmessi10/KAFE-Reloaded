# Maintaining KAFE Tutor code guidance

The Tutor receives a small bundled KAFE fundamentals reference and up to three complete query-matched repository fixtures before composing its answer. English and Spanish requests use the same catalogue. This guidance is available independently of executable runtime or full knowledge-pack readiness. A bare greeting receives the fundamentals but no incidental fixture search; the teaching policy keeps it brief.

The generated `kafe-vscode/src/tutor/kafeReferences.json` contains reviewed pairs of `.kf`, `.expec`, and optional `.in` files selected by `reference/catalogue.json`, including clearly labelled expected-error fixtures. Unreviewed fixtures are listed as omitted. An admitted fixture missing an expectation fails the build. Full programs and outputs remain intact, with a maximum of three examples and 12 KiB total example text per request. Oversized examples are skipped rather than truncated. Repository fixture licensing is preserved in the packaged reference directory.

The bundle separately fingerprints the current checkout implementation and the actual pinned Git runtime sources. The generator requires the pinned revision to exist locally; CI fetches full history. The execution gate rejects a runtime whose source fingerprint differs from that pinned revision. A passing checkout test alone does not establish pinned-runtime compatibility. These identities do not establish that an installed runtime, an arbitrary new program, or every model answer is correct. Bundled sources have their own provenance. They never impersonate managed/development knowledge-pack results, learner files, or host-observed execution.

## Contributor workflow

Install extension dependencies inside `kafe-vscode` before launching the Development Host:

```powershell
npm ci
```

For each language or library change:

1. Add positive and relevant negative `.kf` fixtures with expected output. Review suitable examples and add their paths to `reference/catalogue.json`. Keep examples and explanations aligned with the implementation. Do not admit side-effectful file fixtures or cases that pass only because trailing source was ignored.
2. Update `reference/essentials.md` only when core syntax or execution rules change. Confirm those statements against the grammar, interpreter, and controlled fixtures.
3. Run `npm run references:build` from `kafe-vscode`. The generation step uses repository inputs, not learner files or a provider.
4. Run `npm run references:check` and `npm run test:unit`. The freshness check fails on implementation or fixture drift, including newly added files.
5. With the documented Python/ANTLR environment prepared, archive `src/` from `runtimeManifest.json`'s pinned `sourceRevision` into a separate ignored directory and generate its ANTLR parser there. Set `KAFE_REFERENCE_RUNTIME_ROOT` to that directory and run `uv run --locked --group dev python kafe-vscode/scripts/verify-tutor-references.py` from the repository root. The workflow contains the corresponding Linux commands. The verifier executes reviewed repository fixtures in fresh temporary runtime copies, never code supplied by the model. Run `uv run --locked --group dev pytest tests/ -q` as the broader checkout regression check.
6. Package locally for inspection. The VSIX verifier requires the bundled reference loader, catalogue, and fixture license.

The reference verifier requires full token consumption with no parser/lexer diagnostics before execution, then checks exact exit codes and both complete output streams. This catches the existing parser's ability to stop before an unexpected trailing `else`. Eight controlled fundamentals fixtures also exercise input, a full conditional chain, built-in output, user-defined `print`, and explicit invocation. Zero exit alone is never a passing check. Parsing and execution each have a 15-second timeout. Temporary copies keep repeated checks from mutating the checkout; they are not a security sandbox for arbitrary code. Run only reviewed repository fixtures in this development/CI gate, not silently in a learner's project.

The extension workflow now runs when language source or tests change. It checks freshness, validates reference expectations against the interpreter, and checks rendered conversation layout. Workflow configuration is not evidence of a hosted CI pass; read the result for the actual pushed commit.

## Model evaluation and limits

`kafe-vscode/test/evals/kafe-code.json` contains synthetic prompts and review criteria for real-provider evaluation. Repeat them when the language, model, teaching instructions, or retrieval changes. Include new capabilities and discovered mistakes. Compare answers against expected behavior, not only the presence of instruction text. Provider evaluations require a configured authorized provider; the deterministic tests do not contact DeepSeek.

The Tutor should use `show(...)` for ordinary built-in output and explicitly invoke a driver function when a complete program defines one. Top-level snippets do not require a `main` wrapper. A user-defined `print` remains valid. Missing library documentation must remain an explicit uncertainty rather than a guessed API. Syntax parsing alone cannot prove those semantic or behavioral properties.

Suggested code remains a suggestion. Preparation, native Review, Apply, and learner-started Run retain separate permissions. A no-file proposal request receives an unavailable tool result and conversation can continue. A valid file target still requires current scope confirmation. Editing or removing a dependency invalidates a stale scope.

## Rendered layout regression

The layout suite runs the shipped HTML, CSS, and browser scripts with synthetic conversation state. It checks document overflow, conversation reachability, fixed composer placement, and accessible speaker headings at narrow, short, and enlarged-text sizes.

Run `npm run test:layout` with an installed Playwright. `KAFE_PLAYWRIGHT_MODULE` can name an existing installation and `KAFE_LAYOUT_BROWSER` an existing Chromium/Edge executable. The local test never downloads a browser. CI provisions an isolated pinned Playwright installation explicitly. This browser evidence is separate from native VS Code, physical IME, and screen-reader acceptance.
