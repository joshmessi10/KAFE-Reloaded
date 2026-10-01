# VS Code extension development handoff

Checkpoint: 2026-10-01, America/Bogota. Continue on `feature/vsc-extension`, not `main`. The user authorized committing and pushing the completed work for continuation on another PC. This is a source-development checkpoint, not Marketplace or managed-runtime release approval.

## Repository and commits

- Repository: `https://github.com/joshmessi10/KAFE-Reloaded.git`.
- Existing remote commit `2467ec9` was incorporated with a fast-forward. Its diagrams/SVG did not overlap the extension work. No history was rewritten.
- `4503c303194a0cc06dab8c8dee5f59d0f52bf698`: direct-conversation extension, runtime-independent knowledge, retained native safeguards, tests, documentation and pinned CI host prerequisite.
- `afcbcc0`: preserves pre-existing lecture-diagram layout edits separately. That diagram contains historical request-review wording; use PRODUCT.md and current code for the implemented behavior.
- This handoff is committed after those changes. Resolve the final branch tip with `git rev-parse HEAD`; verify remote synchronization before further work.

## Implemented and approved behavior

The Tutor is one conversation. Enter or Send submits once; Shift+Enter adds a newline; IME composition cannot submit. One assistant answer streams into one message. Stop replaces Send while responding, and the next draft remains editable. Retry uses the original question and current authorized context without duplicating the learner message or automatically resending after key configuration.

The Prepare/Review/Send request pipeline, provenance/payload cards, readiness messages and formal goal/milestone/check/progress workflow were removed from production. Teaching, plans and summaries remain ordinary dialogue. Existing legacy progress is preserved and omitted from provider context. Its separately confirmed clear command does not reset chat or credentials.

The eligible active `.kf` is included by default. Other visible same-workspace `.kf` files are metadata only until explicitly selected. An optional selection survives becoming active, returning to another editor and closing its own editors. Active source capture happens once. Explicit removal, lost authorization, Restricted Mode and New conversation revoke selection.

Conversation, draft, selection, requests and output are host-memory state. View recreation retains the live state; host restart discards it. New conversation preserves credentials, legacy records and an independently running process.

Restricted Mode has production manifest support `limited`: message-only conversation is available, while workspace files, file tools, edits and Run require trust. The production manifest is the native fixture's capability source; development-host activation does not substitute for installed acceptance.

Send only stages a proposed change. **Review change** opens the native diff; **Apply** requires reviewed identity and matching target/dependency authorization, URI, version and hash. **Dismiss** discards it. Authorized editor-focus changes do not discard a settled proposal, but edits/deletion of any captured dependency, trust loss and reset revoke it. Applying does not Run.

Run remains explicit, saved-file and named-target bound. Its process/PTY owner survives chat reset and closes once when the process settles. Provider tools cannot execute programs. Settled `exitCode: null` renders an unknown exit outcome and bounded partial stdout/stderr/truncation; missing exitCode remains unsettled.

Validated cached knowledge is independent of executable runtime readiness. An unavailable pack produces an honest limitation; integrity/lineage changes fail closed. Initial retrieval uses a separate trimmed first-300-character query while preserving the full submitted message. Tool retrieval retains its original bounds. Continued tool rounds use the already authorized pack without a second Send.

Retained bounds: eight eligible whole history pairs within 32 KiB UTF-8, 64 KiB per source snapshot, 1 MiB Run evidence, four tools, four calls per round and four rounds per turn. Source revision fencing covers awaited capture and immediate provider admission. Secrets, source bytes, requests, transcripts and raw transport errors are not persisted or logged by the Tutor.

See [PRODUCT.md](../../kafe-vscode/PRODUCT.md), [extension README](../../kafe-vscode/README.md) and [extension guide](vscode.md). Kilo was behavioral guidance, without copying its framework/assets/services. Reference repository: `https://github.com/kilo-org/kilocode`, inspected revision `ccb6673bf501b1d64ed3711e97d8572128298fa7`. The sibling clone is outside this repository and is not pushed here.

## Verification evidence

The five implementation tasks used fresh implementers and independent task reviewers, followed by a whole-change review, one combined final fix wave and one independent scoped re-review. The final seven findings were addressed with no new scoped breakage.

| Gate | Recorded result |
| --- | --- |
| Focused final fixes | 148 passed |
| Full unit suite | 413 passed, zero failures, one existing Windows symlink-creation capability skip |
| Cached VS Code 1.96.0 hosts | 12 trusted and 12 genuinely restricted tests passed |
| Native helper/pinned policy tests | 10 passed |
| Final Windows native acceptance | 34/34 scenarios passed, retaining all previous 32 and adding selection-retention/null-exit cases |
| Native captures | 31 complete, stable pre/post geometry records |
| Final VSIX inspection | 46 ZIP entries, all 44 source entries byte-equal |

Eleven bounded native invocations were recorded; intermediate failures remain failures. Final cleanup recorded zero owned Code processes/listeners and removed temporary profiles, with audited PID lists empty. At 200% zoom, the physical 1024x768 window measured 243x292 CSS pixels/DPR2; a separate ordinary 1440x900 window measured 280x358 CSS pixels/DPR2. Exact 280 CSS width was not falsely claimed inside the smaller window.

The final native fixture waits for matching host/render session, generation, revision and learner/assistant identity before checking settled content. Hostile Markdown had zero executable nodes and only the permitted HTTPS link. Closing selected B closes every test-owned B text tab, not merely the active tab. Watcher scenarios reset independently.

Fresh pre-commit unit verification after the remote fast-forward again passed 413 tests with the same skip. Staged whitespace verification exposed two errors in formerly untracked tests; only trailing whitespace/extra EOF blank lines were removed before commit. No production behavior changed after final host/native verification.

The local verified VSIX SHA256 was `FB6ED37FE546C9AD827B9F3903B86D1AA069C1317BDA31896066678866A9C2A7`. It was neither installed nor published and is intentionally not a Git payload; rebuild from source. Packaging can vary in archive metadata even with identical source files.

Raw logs, screenshots, review packages, baseline copies and local Superpowers spec/plan remain ignored on the original PC under `.superpowers/sdd/2026-09-30-kafe-conversation-simplification` and `docs/superpowers`. They were not deleted or substituted with a new-PC proof. This tracked handoff preserves the portable decisions/results without cached binaries, temporary profiles or private local data. The attempted Windows PowerShell 5 review package was invalid; the authoritative package used PowerShell 7 and immutable baseline hashes. The final independent reviewer rechecked 21 corrected paths and all 44 archive/source entries.

## Setup on the next PC

```powershell
git clone --branch feature/vsc-extension https://github.com/joshmessi10/KAFE-Reloaded.git
Set-Location KAFE-Reloaded
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/feature/vsc-extension
Set-Location kafe-vscode
npm.cmd ci
npm.cmd run test:unit
```

Use Node compatible with the workflow's Node 20 baseline; the original local verification used Node 24.15.0. `package-lock.json` is tracked. Dependencies, keys and VS Code's SecretStorage do not travel with Git.

Local host/native tests are Windows-specific and require an independently supplied cached VS Code **1.96.0 win32-x64 archive**, with executable at `kafe-vscode/.vscode-test/vscode-win32-x64-archive-1.96.0/Code.exe`. They fail closed when absent and do not download automatically. Do not fake GitHub CI environment variables to bypass the local boundary. Obtain/cache that pinned host only as an explicitly authorized setup step before executing:

```powershell
npm.cmd run test:extension
node --test test/native/harness.test.cjs test/native/host-policy.test.cjs
node test/native/acceptance.cjs <fresh-ignored-evidence-directory>
```

GitHub's Windows extension job explicitly provisions this host after `npm ci` and before host tests. `test/provision-vscode.js` requires both `CI=true` and `GITHUB_ACTIONS=true`; its mocked clean-cache/config/ordering tests passed. The workflow runs unit tests on Windows/Linux/macOS, then Windows trusted/restricted host tests and package inspection with read-only permissions. Read current Actions results for the actual pushed branch tip; historical local green logs are not hosted CI evidence.

Build an inspection artifact after source validation, without installing or publishing it:

```powershell
$inspectionVsix = Join-Path $env:TEMP ('kafe-inspection-' + [guid]::NewGuid().ToString() + '.vsix')
& '.\node_modules\.bin\vsce.cmd' package --out $inspectionVsix
node test/verify-vsix.js $inspectionVsix
Get-FileHash -LiteralPath $inspectionVsix -Algorithm SHA256
```

Run commands separately and stop on a failing exit code. The native helper controls only recorded test-owned PIDs, windows, profiles and ports; preserve failed evidence rather than resizing or terminating unrelated applications.

## Remaining acceptance boundaries

Managed runtime `releasePublished: false` remains unchanged. No runtime release, Marketplace publication, installation, main-branch merge or PR was authorized by this transfer request.

Not established by deterministic evidence: ordinary installed-extension Restricted Mode activation, real DeepSeek availability/responses, managed-runtime/knowledge release availability, OS SecretStorage persistence, physical Windows IME candidate interaction, spoken screen-reader behavior, Linux/macOS native UI or pedagogical efficacy. Hosted CI/bootstrap must be read at the actual remote tip after push.

Known diagnostic limits: DEP0168 N-API warnings of unknown origin; cached product API-proposal mismatches; expected restricted test-mode trust-dialog refusal; forwarded native debugging flags; cached-workbench iframe sandbox warnings; unexplained taskkill unsupported-operation messages despite verified zero-owned cleanup. The removed `--no-cached-data` warning is absent from the final host run. Historical onig.wasm shutdown diagnostics were retained. CRLF advisories, the named symlink skip and incomplete Impeccable template-linked color analysis are not a zero-warning or full accessibility claim.

Continue with repository orientation and current Git/CI verification. Preserve the direct-chat design and existing security/native ownership boundaries; do not restore the removed administrative workflow as a prerequisite for conversation.
