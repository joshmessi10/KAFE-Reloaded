# Builder Report — Gesha follow-ups: Functional fixture + docs scope

Feature: Gesha follow-ups (Functional-API fixture + documentation scope)
Branch: `integration/Kafe_Gesha_Clustering_v2` (no branch created or switched)
Date: 2026-10-20

## Scope note (concurrent session observed)

During this session another agent updated `src/lib/KafeGESHA/models_v2.py` (fit epoch
log format: `Loss <mean>` instead of `Loss <pct>%`, and always printing Accuracy for
classification), regenerated the corresponding KafeGESHA `.expec` snapshots, and added an
"Epoch output and shared metrics" section to `docs/libraries/gesha/models-training.md`.
Those files were NOT touched by this Builder beyond the two surgical intro edits listed
below. The new fixture was captured and verified against the current working-tree
`models_v2.py` (new epoch format). `src/lib/KafeMACHINE/metrics.py`,
`.opencode/adr/decisions.md`, and the process/impact files were not modified.

## Files created / changed

| File | Action |
|---|---|
| `tests/KafeGESHA/functional/functional_branch_merge.kf` | **Created** — Functional-API DAG fixture |
| `tests/KafeGESHA/functional/functional_branch_merge.expec` | **Created** — UTF-8 (no BOM), LF newlines, 914 bytes |
| `docs/libraries/gesha.md` | **Edited (surgical, line 9 intro)** — supported architectures MLP/CNN/RNN; Functional branch-and-merge training has a tested fixture, broader graph configurations remain experimental; soft clustering is experimental |
| `docs/libraries/gesha/models-training.md` | **Edited (surgical, line 3 intro)** — architecture scope names MLP/CNN/RNN, links the tested Functional fixture, and records the single-output `fit` limitation at line 14 |
| `.opencode/progress/current.md` | Updated current step pointer |

No changes to `_SLOW_EXAMPLES` in `tests/test_KafeGESHA.py`: the fixture trains a tiny
2-4-3-3-1 MLP on 4 samples for 14 epochs and completes in ~1 s (well under the 120 s
subprocess limit), so it is NOT skipped.

## Fixture: what DAG path it proves

`tests/KafeGESHA/functional/functional_branch_merge.kf` exercises the NON-sequential
Functional (graph/DAG) path end-to-end from a `.kf` program:

```
entrada = gesha.input_layer([2])            -- symbolic Input node
tronco  = Dense(4, tanh) connect(entrada)   -- shared trunk node
rama_izq = Dense(3, tanh) connect(trunk)    -- branch A (same inbound node)
rama_der = Dense(3, tanh) connect(trunk)    -- branch B (same inbound node)
fusion  = Add().connect([rama_izq, rama_der])  -- merge node (sum of branches)
salida  = Dense(1, sigmoid) connect(fusion) -- output layer
model   = gesha.functional(entrada, salida) -- topological sort + DAG execution
```

Then `model.compile("adam", "bce", [])`, `model.set_lr(0.1)`,
`model.fit(x_train, y_train, 14, 4)` on the seeded AND truth table, and
`show(model.predict_label(...))` + `show(machine.accuracy_score(...))`.

This is the branch/merge path that previously had only a Python backend test
(`test_functional_branch_accumulates_gradients`) and no `.kf` coverage: gradient
accumulation through a DAG with a shared trunk fan-out and an Add merge node is now
exercised end-to-end through the KAFE interpreter, including topological sorting,
multi-inbound forward, and backward gradient summing at both the merge and the shared
trunk. Training converges to labels `[0, 0, 0, 1]` with accuracy `1.0`.

Every random source is seeded (each `create_dense` layer has a fixed seed; NUMK
`random_tensor` uses a local `random.Random(seed)`), and Adam/fit are deterministic, so
the run is byte-reproducible.

## Determinism evidence

Harness conditions replicated exactly as `tests/utils.py::run_kafe_program`
(`cwd=src`, `PYTHONWARNINGS=error`, `PYTHONIOENCODING=utf-8`, child `sys.executable`
via `uv run --locked python`). Two consecutive child runs through the actual harness:

- run 1: exit 0, stderr empty, SHA-256(stdout) = `6392e0771e58c1fcc8c50ff4c3463aa065a0f695c6858128f2e9519a17183bdb`
- run 2: exit 0, stderr empty, SHA-256(stdout) = `6392e0771e58c1fcc8c50ff4c3463aa065a0f695c6858128f2e9519a17183bdb`
- byte-identical: **yes**

An earlier 40-epoch draft was also verified byte-identical (SHA-256
`0E085D4B3FB2C65C1284734D480046B5F624F54110E74109D56C626241BA494B`, two runs) before
being trimmed to 14 epochs (the training plateau added no information and the shorter
run keeps CI cost minimal). The committed `.expec` was written from the harness stdout
string (UTF-8, LF): no BOM, no CRLF, 28 em-dash byte sequences (E2 80 94), 26 LF
newlines, 914 bytes. Per-epoch loss/accuracy lines are included because two runs are
byte-identical; final shown results are integer class labels and a rounded accuracy.

## Validation (exact commands, honest results)

| Command | Result |
|---|---|
| `uv run --locked python -m pytest tests/test_KafeGESHA.py -q -p no:cacheprovider -k functional_branch_merge` | **PASS** (1 passed) |
| `uv run --locked python -m pytest tests/test_KafeGESHA.py -q -p no:cacheprovider` | **PASS** (25 passed, 4 skipped — the pre-existing slow skips) |
| `uv run --locked python -m pytest tests/ -q -p no:cacheprovider` | **PASS** (726 passed, 4 skipped, 3m25s) |
| `uv run --locked --group dev ruff check src tests` | **PASS** (All checks passed) |
| `$env:NO_MKDOCS_2_WARNING = "1"; uv run --locked --group docs --no-dev mkdocs build --strict` | **PASS** (exit 0; uses the documented scoped `NO_MKDOCS_2_WARNING=1` exception from `.opencode/knowledge/verifications.md` for Material's upstream MkDocs 2.0 advisory) |

The documented `uv run --locked --group dev pytest ...` trampoline is broken on this
host ("uv trampoline failed to canonicalize script path"); per task instructions the
working `-m pytest` form was used instead. Ruff via `--group dev` works on this host.

## Left for Tester / Reviewer

- Reviewer `/dod`: the fixture snapshots per-epoch `Loss <mean> — Accuracy <%>` lines
  from the current `models_v2.py` fit log; if the epoch-log format changes again, this
  `.expec` (like the other regenerated KafeGESHA snapshots) must be regenerated.
- Tester: cross-platform (Linux CI) reproduction is expected because all arithmetic is
  pure-Python IEEE-754 double with seeded local RNGs, but this was only demonstrated on
  this Windows host.
- Documentation scope remains conservative: MLP/CNN/RNN are the supported training
  architectures (`docs/libraries/gesha.md:9`, `models-training.md:3`). Functional
  graph training has this tested branch-and-merge fixture; broader graph configurations
  remain experimental (`gesha.md:9`, `models-training.md:11`). The current `fit`
  loop supports a single output and a single loss (`models-training.md:14`).
- No ADR needed for this portion (fixture + prose tightening only; ADR-0023 was the
  sibling's deliverable and is untouched here). Benchmark N/A (no new algorithm).
