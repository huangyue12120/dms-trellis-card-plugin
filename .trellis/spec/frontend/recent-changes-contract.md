# Recent Changes Contract

## 1. Scope / Trigger

`TrellisDms/lib/trellischanges.js` owns runtime observations. The daemon calls it
from the existing Snapshot publisher, central selection observer, and guarded
archive metadata reads. It never reads files, installs watchers, persists
history, or changes parser inputs. The resource name is lowercase and exact-case.

This is observed Trellis data, not Agent Activity. Task disappearance never
means completion/deletion. Archive observations never mean task completion.

## 2. Signatures

```javascript
limits()
createTracker(epoch)
resetScope(state, scopeKey)
observeSnapshot(state, snapshot, health, generation, observedAt)
selectionSummary(pin, primary)
observeSelection(state, selection, observedAt, quiet)
observeArchivePage(state, project, response, observedAt)
history(state)
makeHistoryProjection(recent, snapshot)
```

The daemon bridge is `observeArchiveMetadata(project, response)`. Callers must
finish their canonical-read and current-request guards before invoking it.
The hook starts no reads. `history()` returns copied records; consumers cannot
mutate tracker baselines. `resetScope()` preserves history/sequence but quietly
rebaselines projects, health, archive coverage, and selection.

## 3. Contracts

The single Snapshot publisher adds optional
`runtime.observationEpoch` and `runtime.publicationGeneration`. Publication
generation is monotonic and independent of scan cancellation generation.
`recentChanges` is a separate global:

```javascript
{ epoch, source_snapshot_generation, events }
```

Each event contains `event_id`, `observed_at`, `epoch`,
`source_snapshot_generation`, `project_id`, `project_name`, `task_id`,
`task_title`, `session_key`, `event_type`, `source`, `before`, and `after`.
Nullable identities support project/unscoped Health observations. Event IDs
combine epoch, publication generation, and a monotonic runtime sequence.
Within a batch, order by qualified project/task/session identity, then kind:

`project_discovered`, `project_unavailable`, `project_recovered`,
`task_discovered`, `task_status_changed`, `task_state_changed`,
`session_detached`, `session_attached`, `active_session_count_changed`,
`archive_item_observed`, `pin_changed`, `primary_changed`,
`health_degraded`, `health_recovered`.

`source` is `trellis_data`, except pin/primary events use `ui_selection`.
This label identifies the projection, not a manual click: a later primary
change caused by new Snapshot facts also emits a selection event. Only initial
or root-scope preference baselines are quiet. State changes cause no scan or
Snapshot publication.

Before/after values allow only status/state/count, availability, attachment,
qualified selection, archive month/directory/status, or degraded summaries.
Ignore clocks, mtime, warning order/count, and raw task/session contents.

Limits: 200 events, 32 projects, 128 tasks and 128 sessions per project,
33 project/global Health summaries, 128 archive coverage units, and 4096
retained archive identities. Bound identities to 1024 characters, names to
160, titles to 240, statuses to 48, and timestamps to 64. Exclude invalid or
ambiguous duplicate identities; array lookup supports prototype-like keys.
At capacity, prefer retiring absent identities so records still awaiting
comparison in the same batch are not evicted. Retirement remains finite;
it is not permanent change history.

Archive hook input must be a complete `archive-page` response with `ready` or
`empty` status, a valid `selectedMonth` (`YYYY-MM`), numeric page 0–63 and
pageSize 1–32 (defaults 0/16), explicit empty `warnings`, and explicit `tasks`
of at most 32 non-null available/error-free rows with valid `dirName`.
Coverage identity is `[project.id, month, page, pageSize]`; row identity is
`[project.id, month, dirName]`. First coverage is quiet. Subsequent new rows
deduplicate across retained units; page shifts retain prior row identities.
Evicted coverage rebaselines quietly.

`makeHistoryProjection()` returns `{ready, synchronized, events}` newest first.
The two global writes are not atomic: synchronized requires matching epoch and
generation. Absent globals are tolerated; publication skew retains bounded
previous history with an explicit pending state.

## 4. Validation & Error Matrix

| Condition | Behavior |
| --- | --- |
| Initial/reload/root-scope baseline | Quiet; runtime history may reset on reload |
| Same facts, later clocks/order | No semantic event |
| Same or older publication generation | No Snapshot comparison |
| Project/root discovery failure or last-good fallback | Preserve reliable task/session baselines; report availability/Health separately |
| Task read failure | Keep its previous reliable facts |
| Incomplete/malformed session coverage | Do not infer runtime state/count or missing-session detachments |
| Reliable session reassignment | Detach/attach only with reliable old and new targets |
| Missing task | No deletion/completion event |
| Failed/incomplete/cancelled archive read | No new coverage baseline or observation |
| State read failure | No inferred selection or Health incident |
| Pin/primary projection changes after baseline | `ui_selection` event, including Snapshot-driven primary changes |
| Global publication skew | Preserve history and expose synchronization state |

## 5. Good / Base / Bad Cases

Good: reliable task status changes from planning to in_progress; one event
contains both bounded statuses and the new publication generation.

Base: the daemon loads the same tasks and preferences; history stays empty.
Archive page 0 is first read and quietly establishes coverage.

Bad: an unreadable project returns unchanged tasks later; do not announce every
task as newly discovered. A newly read archive page cannot claim completion.

## 6. Tests Required

Run `rtk proxy node tests/test_trellis_contract.mjs`. Assert every event type,
qualified identities, deterministic ordering, publication skew, unchanged
Snapshot inputs, clock/order silence, duplicate/prototype-like identities,
failure retention/recovery, reliable detach/reassignment, and all caps.
Exercise full-capacity turnover with new identities before and after existing
sort order, retained rows changing in that batch, and reliable detachments.
Archive assertions cover quiet first reads, page shifts, cross-page dedup,
malformed/null rows, explicit complete arrays, failures, growth and retirement.

Execute actual daemon publication/selection functions with only host transport
mocked: first primary quiet, later source-driven primary event, repeated facts
silent, root change quiet, and State selection changes without scans.

QML source checks do not establish rendering. History focus/scroll, narrow
widths, multiple widgets, reload/disable/enable, and watcher lifecycle require
supported-host evidence; unavailable tools remain unverified.

## 7. Wrong vs Correct

Wrong: rebaseline selection on every Snapshot publication, suppressing actual
primary projection changes; infer completion when a task disappears.

Correct: quietly baseline only initial/root scope selection, compare later
projections centrally, and retain reliable task facts through failures. Feed
the archive observer only complete, guarded metadata responses:

```javascript
if (_isCurrentDetail(context.generation, context.request.requestId))
    observeArchiveMetadata(context.project, response);
```

Search uses its own request guard before this same bridge. Neither consumer
may feed search matches as if they were a complete archive page.
