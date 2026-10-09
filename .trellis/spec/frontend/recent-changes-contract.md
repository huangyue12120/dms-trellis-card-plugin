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

## 8. Health Notification Consumer

### 8.1 Scope / Trigger

`TrellisDaemon.qml` may consume Health transition events after the existing
Snapshot/Recent Changes publication. Notifications are an optional, runtime-only
projection; they must not become a second observer or alter the shared
Snapshot.

### 8.2 Signatures

```javascript
createState() -> { initialized, scopes }
observe(state, events, enabled, observedAt)
  -> { state, requests }
```

`events` accepts only `health_degraded` and `health_recovered` records. Each
request contains an internal scope key, event type, bounded display name, and
observation timestamp. Scope state is capped at 33 project/global entries and
stores independent degraded/recovered cooldown timestamps.

### 8.3 Contracts

- The first observation and every daemon restart establish a quiet baseline;
  they never notify existing incidents.
- A degraded transition sets the scope active and can emit once. A recovery
  can emit only after that scope was active. Repeated same-kind transitions
  are suppressed while active or inside the five-minute cooldown.
- Disabled mode advances the baseline without producing requests. Missing or
  malformed plugin data is treated as disabled.
- The daemon passes only events from the current `source_snapshot_generation`.
  It builds localized bounded text and invokes a fixed argv-only `dms notify`
  process. No roots, IDs, task/session content, Markdown, network, Trellis
  writes, watcher, or Snapshot warning may cross this boundary.
- Process creation/exit failure is a local log outcome. Notification process
  teardown occurs on disable, trusted-root scope change, and daemon destruction.

### 8.4 Validation & Error Matrix

| Condition | Required result |
| --- | --- |
| Initial/restart event history | Quiet baseline; no request |
| Unknown event kind | Ignore; preserve observer state |
| Disabled or invalid setting | Baseline advances; no process |
| Repeated degraded/recovered event | Suppress according to active state/cooldown |
| DMS process unavailable/non-zero | Log locally; publish Snapshot/Recent Changes normally |
| Project ID `global` or prototype-like key | Keep project scope separate from fixed global scope |
| More than 33 scopes | Ignore new scopes after the bounded cap |

### 8.5 Good / Base / Bad Cases

- Good: current-generation project degradation emits one bounded localized
  request; recovery emits one later request after the incident clears.
- Base: notifications remain disabled while Health and Recent Changes stay
  fully functional.
- Bad: replaying the entire Recent Changes ring on every publication, or
  sending a project path/task title through the DMS command.

### 8.6 Tests Required

- Pure helper fixtures cover quiet startup/restart, degraded/recovery
  transitions, duplicate suppression, cooldown, disabled mode, immutability,
  scope cap, and reserved/prototype-like IDs.
- Static daemon checks assert current-generation filtering, exact argv, no
  shell wrapper/raw-content fields, settings default/reset/localization, and
  publication ordering (`recentChangesVar.set` before the adapter call).
- Supported-host checks must cover enabled/disabled behavior, restart quietness,
  duplicate suppression, recovery, and adapter failure isolation; unavailable
  host evidence remains explicitly unverified.

### 8.7 Wrong vs Correct

```javascript
// Wrong: replays historical events and lets a project ID collide with global.
notify(recent.events);
scopes[event.project_id] = baseline;
```

```javascript
// Correct: filter current generation and keep a reserved project prefix.
observe(state, currentGenerationEvents, notificationsEnabled, Date.now());
scopeKey = projectId ? "project:" + projectId : "global";
```
