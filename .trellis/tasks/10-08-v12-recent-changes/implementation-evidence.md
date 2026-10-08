# Recent Changes implementation evidence

Recorded 2026-10-08. Fixture/static checks below do not establish rendered QML or live DMS interaction.

## Changes and boundaries

- Added `TrellisDms/lib/trellischanges.js` using the existing lowercase reload-resource contract. It owns deterministic semantic observations, runtime baselines, event allowlists, and bounded history. Snapshot/parser inputs are not mutated.
- The daemon retains one Snapshot publisher. Optional `runtime.observationEpoch` and `runtime.publicationGeneration` identify publications independently of `scanGeneration`; `recentChanges` publishes separately with matching provenance. Consumers retain prior history through publication skew and tolerate an absent global.
- Existing Snapshot Health and primary-selection projections remain authoritative. Initial/reloaded/configured-root scope observations are quiet. Later primary projection changes, including those caused by source facts, are labeled `ui_selection`; this label does not imply a manual click. Timestamp-only source changes never produce Trellis-data events; an actual changed UI primary projection remains a selection observation.
- Read/discovery/fallback failures preserve reliable task/session records. Status is independently comparable where reliable; runtime state/count and detachments require reliable session coverage. Qualified duplicate IDs are excluded from comparisons. Missing tasks never imply completion/deletion.
- Pin/project preferences are read centrally through the two existing DMS State keys. Selection observations add no scan or persistence write. State read failures are not interpreted as selections or Health incidents.
- `observeArchiveMetadata(project, response)` is the reusable daemon hook for the Search child. Call it only after that consumer's cancellation/canonical-read guards, with a complete bounded `archive-page` response: `ready`/`empty`, `selectedMonth`, numeric page 0–63, pageSize 1–32, no warnings, and at most 32 available/error-free summary rows. First observation of each project/month/page/pageSize coverage unit is quiet. Later newly observed project/month/directory identities are deduplicated across retained units. Failed, cancelled, incomplete, or malformed responses preserve the baseline. No observation starts an archive read.
- Tracking caps: 200 events; 32 project baselines; 128 reliable tasks and 128 reliable sessions per project; 33 project/global Health summaries; 128 archive units and 4096 retained archive row identities. FIFO retirement bounds retained baselines; retired archive units rebaseline quietly. Summaries bound titles to 240, names to 160, statuses to 48, identities to 1024, and timestamps to 64 characters.
- Event batches sort by qualified project/task/session identity, then the documented kind order. IDs use epoch, publication generation, and a runtime sequence; selection/archive observations can share a publication generation without sharing IDs.
- The native popout exposes Recent Changes, a dedicated bounded history, Back, project/task/session context, source labels, English/zh_CN text, and quiet/unavailable/fallback explanations. Focusable history rows use the existing Theme and scroll into view; keyboard navigation stays within the existing single vertical scroll region. Back restores live-list scroll position.

## Verification

- PASS: `rtk proxy node tests/test_trellis_contract.mjs`, including every approved event kind, semantic timestamp/order noise, repeated generations, deterministic reordered inputs, same task IDs in different projects, prototype-like/duplicate/invalid identities, partial task/session reads, malformed pointers, discovery failure, fallback and recovery, reliable detach/reassignment, ring/baseline caps, archive page shifts/deduplication/error retention/eviction/growth, Snapshot immutability, and publication skew.
- PASS: tests execute the daemon's actual publication/selection functions with only host transport mocked. Initial primary is quiet; later Snapshot-driven primary changes emit `primary_changed`/`ui_selection`; repeated facts stay quiet; State changes do not scan/publish; new root-scope baseline stays quiet.
- PASS: exact-case QML resources and source contracts for the single publisher, central State observer, guarded lazy archive hook, source labels, focus/scroll, and the one existing Flickable.
- PASS: helper JavaScript syntax after stripping only `.pragma library` in memory; `node --check` for the contract harness; zh_CN JSON parsing; scoped `git diff --check`; task context validation.

## Remaining host gates

- `qmllint` and `qmlformat` are unavailable. No live/offscreen QML load is claimed by this implementation pass.
- The main session found a running DMS 1.6.2 host, but its installed plugin still matches HEAD and does not contain this candidate. Candidate installation/reload and log inspection remain with the parent.
- Real rendering at normal/narrow widths, Tab/Shift-Tab/arrow/page focus and scroll, two-widget history convergence, reload/disable/enable quiet baselines, watcher ownership, and degraded/recovery UI behavior remain unverified on the target host.
- Existing DMS State disk-write failures reported by the parent remain a host limitation; this work does not claim restart persistence or replace State with another persistence mechanism.
- Parent owns the independent Trellis check and executable-spec updates; this implementer did not dispatch agents, change specifications/release files, commit, or archive the child.
