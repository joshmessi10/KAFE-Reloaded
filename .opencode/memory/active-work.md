# Active Work

## Current extension work (2026-10-27)

Feature: unified Tutor simplicity on `feature/vsc-extension`, extension 2.3.0 / runtime 0.3.0.

Status: final review correction `c944d88` fences nested source/authorization revocation and original-owner cancellation cleanup; installed README guidance links use an explicit reviewed source ref. The final extension aggregate passes 1,032 tests with one existing Windows symlink skip; all 42 browser cases, syntax, reference freshness and revised VSIX inspection pass. Nine unchanged Python inputs retain 787 passes, four documented skips and 86.89% strict child-inclusive coverage; Task11 zero-finding audits are retained with unchanged locks/configuration. The initial whole-plan review requested these corrections; scoped final re-review and exact-revision hosted/native acceptance remain pending. Native VS Code 1.96.0 cache is absent; provider, physical IME/speech, publication and human study evidence remain separate.

Next: one scoped final re-review of the consolidated corrections and handoff of the revised local candidate; obtain separate authorization for hosted/native follow-up. No push, dispatch, installation, publication or research activity is authorized by this local task.

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
