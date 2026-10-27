# Current Work

## Current extension work (2026-10-27)

Feature: unified Tutor simplicity on `feature/vsc-extension`, extension 2.3.0 / runtime 0.3.0.

Status: local integration cleanup `524dac5` and packaging security patch `d074ff9` are committed. The final extension aggregate passes 1,010 tests with one existing Windows symlink skip; all 42 browser cases, reference freshness, dependency audits and candidate VSIX verification pass. Nine unchanged Python inputs retain the observed 787 passes, four documented skips and 86.89% child-inclusive coverage. Whole-branch independent review and exact-revision hosted/native acceptance remain pending. Native VS Code 1.96.0 cache is absent; provider, physical IME/speech, publication and human study evidence remain separate.

Next: independent whole-branch review and user handoff of the locally verified candidate; obtain separate authorization for any hosted/native follow-up. No push, dispatch, installation, publication or research activity is authorized by this local task.

## Separate Gesha historical/pending context

The prior record below belongs to the Gesha workstream; it is preserved for follow-up and does not describe this branch's current extension state. Later October history records Functional/metrics implementation evidence; review/integration of any remaining Gesha work must consult those records.

Feature: Gesha follow-ups: Functional fixture, docs scope, shared metrics

Status: in_progress

Current step: Metrics interoperability (Option A) + ADR-0023 complete (see `.opencode/progress/builder-gesha-metrics.md`); Functional fixture + docs scope complete (see `.opencode/progress/builder-gesha-functional.md`); awaiting review

Next step: Reviewer `/dod` on both Builder portions

Blockers: None

Related ADRs: ADR-0016, ADR-0017, ADR-0023 (new)
