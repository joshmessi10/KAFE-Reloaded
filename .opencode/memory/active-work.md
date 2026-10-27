# Active Work

## Current extension work (2026-10-27)

Feature: unified Tutor simplicity on `feature/vsc-extension`, extension 2.3.0 / runtime 0.3.0.

Status: local integration cleanup `524dac5` and packaging security patch `d074ff9` are committed. The final extension aggregate passes 1,010 tests with one existing Windows symlink skip; all 42 browser cases, reference freshness, dependency audits and candidate VSIX verification pass. Nine unchanged Python inputs retain the observed 787 passes, four documented skips and 86.89% child-inclusive coverage. Whole-branch independent review and exact-revision hosted/native acceptance remain pending. Native VS Code 1.96.0 cache is absent; provider, physical IME/speech, publication and human study evidence remain separate.

Next: independent whole-branch review and user handoff of the locally verified candidate; obtain separate authorization for any hosted/native follow-up. No push, dispatch, installation, publication or research activity is authorized by this local task.

## Separate Gesha historical/pending context

The prior record below belongs to the Gesha workstream; it is preserved for follow-up and does not describe this branch's current extension state. Later October history records Functional/metrics implementation evidence; review/integration of any remaining Gesha work must consult those records.

## Current Feature

Gesha follow-ups: Functional fixture, docs scope, shared metrics.

## Status

in_progress on branch integration/Kafe_Gesha_Clustering_v2 (last closed work: commit 7d41ce0).

## Current Step

Implement metrics interoperability (Option A) and ADR-0023.

## Next Step

Functional fixture + docs scope.

## Expected Outcome

KafeMACHINE metrics accept both flat machine predictions and single-column gesha batch predictions, verified by new fixtures and the full suite.
