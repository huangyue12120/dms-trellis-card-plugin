# v1.2 Acceptance Evidence

Evidence started 2026-10-08. Implemented, fixture/static-verified, offscreen-loaded,
and real-host-verified are separate states. Administrative archival is not a
substitute for any runtime or release gate.

## Current preflight

| Check | Result | Evidence |
| --- | --- | --- |
| Pre-v1.2 repository baseline | PASS | `rtk proxy node tests/test_trellis_contract.mjs` passed before implementation, including existing fixture/static state matrix. |
| Approved planning artifacts | PASS | Five task context validations; parent/child linkage, UTF-8/LF, links, placeholders, and original roadmap SHA-256 checked. |
| DMS CLI / installed bundle | VERSION VERIFIED | `dms version` and `/usr/share/quickshell/dms/VERSION` both report 1.6.2. |
| Process visibility in sandbox | UNAVAILABLE | `pgrep -a -x 'dms\|quickshell\|qs'` and `ps -p 566820` see no host process; this does not establish absence of a host instance. |
| Default DMS IPC discovery | UNAVAILABLE | `dms ipc --help` reports `Could not retrieve IPC targets`, underlying exit status 255. |
| Default Quickshell config | UNAVAILABLE | `qs list` exits 255: no default config directory or shell.qml found. |
| Explicit host instance | VERIFIED | `qs list --all` lists instance `0d5cnzihmt`, PID 566820, Wayland wayland-1, config `/run/user/1000/danklinux-shell/fc3c244a314d77c8/shell.qml`; its bundle VERSION is v1.6.2. |
| Explicit read-only IPC | VERIFIED | Sandboxed `qs ipc -i 0d5cnzihmt show` gets SocketAccessError; the same read-only command with reviewed sandbox escalation successfully lists host targets. |
| Existing installed Trellis plugin | LOADED (baseline only) | Reviewed read-only `qs ipc -i 0d5cnzihmt call plugins status trellisDms` returns loaded. This is not validation of new v1.2 source. |
| Installed plugin source | HEAD BASELINE VERIFIED | All 13 files under `/home/yue/.config/DankMaterialShell/plugins/TrellisDms` match repository HEAD bytes; the directory is not a symlink. |
| QML lint/format tools | UNAVAILABLE | `shutil.which` finds neither qmllint nor qmlformat. |
| Isolated offscreen harness | UNAVAILABLE (harness environment) | A temporary offscreen config with installed-module links fails to resolve `qs.Modules.Plugins` / `qs.Modules.Settings.Widgets` for the unchanged installed HEAD baseline. Directories and file-URL corrections did not make the baseline load. Logs are under `/tmp/trellis-v12-qml-69wgm3o_/baseline-output.log`; this is neither a v1.2 regression nor a passed component check. |
| Candidate byte installation | PASS, THEN ROLLED BACK | All 14 checked source files installed and verified with a complete original backup at `/tmp/trellis-v12-host-backup-6ia84kmk`; candidate hashes are in `candidate-hashes.json`. |
| Candidate hot reload | FAIL | At 16:53:13 local time, `qs ipc -i 0d5cnzihmt call plugins reload trellisDms` returns `PLUGIN_RELOAD_FAILED`; Qt reports `lib/trellischanges.js unavailable` / `File name case mismatch` at daemon import line 11. Installed names and bytes matched exactly. |
| Original host restored | PASS (baseline only) | Restored and byte-verified all original 13 files; removed only the candidate-added library. At 16:54:31, reload returns `PLUGIN_RELOAD_SUCCESS`, new logs confirm widget/daemon load, and `plugins status trellisDms` returns `loaded`. |
| Fresh Qt library probe | PASS (library only) | Exact candidate `trellischanges.js` in `/tmp/trellis-v12-js-probe-m64x47bt` imports in a fresh offscreen Qt/Quickshell engine, prints `V12_FRESH_JS_IMPORT_PASS` with limits and empty history, then `Configuration Loaded`. The 2-second timeout intentionally stops the isolated process (exit 124); its unavailable sandbox IPC socket is separate. This is not complete DMS component/host acceptance. |
| Widget/Desktop baseline visibility | VERIFIED (baseline only) | IPC lists `trellisDms [visible]` and one enabled Desktop placement. `widget status trellisDms` returns `WIDGET_NO_POPOUT`; this IPC API cannot exercise the plugin popout. |

Existing host logs show Trellis widget/daemon loads and the previously documented
DMS State disk-write error `Property 'connect' of object false is not a function`.
No new v1.2 code was installed for that observation, so restart persistence is
still not established. Unrelated RSS-plugin warnings are outside this task.

Source inspection locates the existing write failure in installed DMS
`Services/PluginService.qml:1018`: `_flushStateToDisk()` calls
`fv.loaded.connect(...)`, while this host exposes `loaded` as a boolean.
The catch logs the failure at line 1025 and does not establish successful disk
writing. This is host-owned code; the plugin continues using supported State
APIs and adds no alternate persistence store. Restart persistence remains a
required unresolved host gate.


## Feature and regression matrix

Update rows as checks execute; NOT RUN is not a pass.

| Scenario | Fixture/static | Offscreen | Live host | Required evidence |
| --- | --- | --- | --- | --- |
| Recent Changes: all event types and provenance | PASS — RC check | NOT RUN | UNVERIFIED | Deterministic before/after assertions; actual rows on host |
| Repeated Snapshot, timestamps, warning order | PASS — RC check | N/A | UNVERIFIED | No duplicate semantic events |
| Initial load, reload, archive first observation | PASS — RC check | NOT RUN | UNVERIFIED | Quiet baseline; no history flood |
| Partial project/task/session failure and recovery | PASS — RC check | NOT RUN | UNVERIFIED | No false completion, recreation, or detachments |
| History/baseline caps and cleanup | PASS — RC check | NOT RUN | UNVERIFIED | Finite structures; no duplicate observer resources |
| Live / Archive / All metadata search | PASS — GS check (render unverified) | NOT RUN | UNVERIFIED | Project context and correct scope/matches |
| Empty query, partial coverage, continuation/caps | PASS — GS check (render unverified) | NOT RUN | UNVERIFIED | Zero archive I/O on blank input; honest terminal states |
| Malformed archive and cancelled/stale cursors | PASS — GS check (render unverified) | NOT RUN | UNVERIFIED | Bounded local errors and generation guards |
| Search/detail Back and keyboard focus/scroll | PASS — GS check (render unverified) | NOT RUN | UNVERIFIED | Clear returns prior projection; visible reachable controls |
| Copy ID and canonical live/archive/project paths | PASS — QA check | NOT RUN | UNVERIFIED | Exact real clipboard values |
| Folder open and URL-sensitive/non-ASCII paths | PASS — QA check | NOT RUN | UNVERIFIED | Validated target; accepted/failed launch feedback |
| Traversal, symlink escape, stale identity/root | PASS — QA check | N/A | UNVERIFIED | Rejected operations; no arbitrary launch |
| Missing clipboard/opener and action cancellation | PASS — QA check | NOT RUN | UNVERIFIED | Local errors; unchanged Snapshot/Health |
| v1.1 Health/freshness/last-good/recovery | PASS — full fixture/static suite | NOT RUN | UNVERIFIED | Raw facts and projected incidents agree |
| About/Diagnostics and redacted diagnostics copy | PASS — full fixture/static suite | NOT RUN | UNVERIFIED | Redaction plus host clipboard evidence |
| Desktop Overview/Tasks/Health and two placements | PASS — full fixture/static suite | NOT RUN | UNVERIFIED | Independent settings, shared Snapshot, resize |
| Settings save keeps Desktop available | PASS — source regression | NOT RUN | UNVERIFIED | Carry-forward v1.1 host regression |
| Widget refresh discovers a new task | PASS — fixture/static regression | NOT RUN | UNVERIFIED | Carry-forward v1.1 host regression |
| Automatic topology refresh follows interval | PASS — fixture/static regression | N/A | UNVERIFIED | Carry-forward v1.1 host regression |
| v1.0 bar/popout/filter/pin/archive/detail/Launcher | PASS — full fixture/static suite | NOT RUN | UNVERIFIED | Existing core and source regression suite |
| Narrow/normal widths, long names, locale | PASS — source/fixtures only | NOT RUN | UNVERIFIED | English/Chinese copy and visible focus |
| Multi-widget, reload, disable/enable, restart | PASS — full suite, including action replay regression | NOT RUN | FAIL — candidate hot reload; baseline restored; other interactions UNVERIFIED | Sharing, pending-operation cleanup, State behavior |
| Read-only, no network/permission/watcher increase | PASS — source/boundary review | N/A | UNVERIFIED | Diff/source review and host resource observations |
| Package contents/version/import case/tag contract | PASS — local ZIP and exact workflow verifier; release ancestry/tag NOT RUN | N/A | N/A | ZIP inspection and matching release metadata |

## Recent Changes repository review

Independent `trellis-check` full-scope review passed after fixes for capacity
turnover, incomplete/null archive inputs, and localization. Evidence:
`../10-08-v12-recent-changes/check-evidence.md`. The actual daemon publisher
and selection functions execute in the Node harness with host transport mocked.
These fixture/static results do not establish any live-host UI behavior.

## Global Search repository review

Independent `trellis-check` passed after the short-month page-budget fix.
Actual daemon/widget/detail/Recent bridge fixtures cover traversal and UI state,
including root-change cancellation and incomplete-page baseline recovery. See
`../10-08-v12-global-search/check-evidence.md`; native rendering is unverified.


## Quick Actions repository review

Independent `trellis-check` passed, including the retained-global reload replay
fix. Completion/cancellation consumes only the owned active/queued raw request,
preserves newer ownership and matching feedback, and cannot replay on daemon
recreation. Legal live JSON retains the parser's effective-ID fallback. See
`../10-08-v12-quick-actions/check-evidence.md` and the executable action contract.

## Integrated repository checks

On the frozen checked source, main ran the full Node suite (exit zero), including
v1.0/v1.1 regressions, Search/detail/Recent bridging, action isolation, and retained
request recreation. `/tmp/trellis-v12-static.mjs` parses six pure modules and
105 daemon / 50 widget root methods. Node test syntax, JSON, exact-case resource
imports, and task contexts pass. These are fixture/static checks, not QML types.

Independent final full-scope `trellis-check` passes the repository integration,
all five task contexts, executable/document contracts, and ZIP/source/hash checks.
No additional source or document fix was required; product/tests stay frozen.
See `check-evidence.md`. The native candidate hot reload failure and remaining
host/stable-release gates remain open despite this repository pass.

Scoped `git diff --check -- . ':(exclude)PROJECT_PROGRESS.md'` passes. The complete
dirty-tree check reports pre-existing Markdown hard-break spaces at progress
lines 1381–1383/2087 and a blank EOF line at 2332. Their bytes match the original
user roadmap; they are preserved. Own progress status text is checked separately.

## Live load failure and rollback

Candidate installation verified all 14 files against the frozen repository,
then a supported cache-busted plugin reload failed to import the added library
with `File name case mismatch`. The exact library executes in a fresh Qt engine;
a stale running loader directory cache is a hypothesis, not a verified root
cause. No source workaround or DMS patch was made. Full fresh DMS load remains
unverified. The original backup was restored, verified, and successfully loaded.
The host currently runs its original baseline. No real clipboard content was
read/written and no folder was opened during these checks.

Local logs: `/tmp/trellis-v12-host-first-load.log` and
`/tmp/trellis-v12-host-load-and-rollback.log`. The latter confirms failure at
16:53:13 and restored widget/daemon load at 16:54:31. The independent library
probe's runtime logs are under `/tmp/trellis-v12-js-probe-m64x47bt/runtime`.
A fresh whole-shell DMS load affects the user's other surfaces; it has not been
started as a substitute for the failed targeted plugin reload.


## Local package and release contract

Artifact: `/tmp/trellis-dms-v1.2-unreleased.zip`; manifest version **1.0.0**; **16 files**.
SHA-256: `2a7c74757173bce0db7164b7d0e632af77ad64f15aefc995df94914b26849655`.

Two independent builds produce identical bytes. ZIP CRC, unique/sorted exact
membership, byte equality with source, manifest, fixed 1980-01-01 timestamps
and 0644 modes pass. Membership is only the 14-file `TrellisDms/` bundle plus
LICENSE/README; no tasks, journal, repository metadata or private evidence.
The temporary builder is `/tmp/trellis-v12-package.py`.

The exact existing candidate workflow's Node heredoc verifier was executed
without creating tags: `v1.0.0-rc.1` accepts the current manifest;
`v1.2.0-rc.1`, stable `v1.0.0`, and malformed `v1.0.0-rc.bad` reject.
The workflow explicitly requires source ancestry on origin/main and uses
`--prerelease`. Source is still the frozen uncommitted working tree: no actual
release tag/ancestry check, remote publication or stable automation was run.
This package is an unreleased integration artifact, not a v1.2.0 release.

## Release decision

The checked feature source/spec/tests were committed as `dc76d7a` in the first
approved batch. Documentation and the session journal follow in separate batches.

The user approved the three-batch commit plan and chose to retain the restored
original plugin for later manual host acceptance. Do not reinstall the candidate
or restart DMS in this session. This decision does not close any remaining host
or stable-release gate; the acceptance task stays in progress and unarchived.

Stable v1.2.0 is NOT RELEASED. Required v1.2 live checks remain unverified;
an existing DMS 1.6.2 host is reachable using explicit reviewed read-only IPC.
Independent implementation and local checks continue; missing feature checks
are not waived by passing fixture/static tests or by an older plugin being loaded.

The current manifest is 1.0.0. Before the reviewed version decision, any local
draft package retains/reports this version and is labeled an unreleased
integration artifact. No stable tag or release has been created.
