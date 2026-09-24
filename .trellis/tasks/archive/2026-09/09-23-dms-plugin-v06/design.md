# Trellis DMS v0.6 integration design

## Architecture and boundaries

v0.6 keeps the existing four-stage read-only flow:

```text
Trellis files -> daemon/parser -> schema-1 Snapshot
              -> pure projection -> pill/popout QML
                               DMS State -> UI preferences only
```

The daemon remains the sole filesystem reader and Snapshot publisher. The
widget receives a complete Snapshot and two UI preferences. It never reads
Trellis files, mutates task/session data, or filters facts before publication.

## Data contract additions

The parser maps a valid session pointer's optional `last_seen_at` string to
nullable `session.lastSeenAt`. Invalid/missing timestamps become `null` and do
not invalidate the pointer. This is an additive schema-1 field because the
Snapshot shape remains backward compatible.

The projection helper owns these pure operations:

```text
makePinnedTaskToken(projectId, taskId) -> string
parsePinnedTaskToken(value) -> { projectId, taskId } | null
selectPrimary(snapshot, uiState) -> PrimarySelection
makePillProjection(snapshot, displayMode, uiState) -> PillProjection
makePopoutProjection(snapshot, limits, uiState) -> PopoutProjection
```

`uiState` contains only `pinnedTaskId` and `selectedProjectId`. A pin is
eligible when both referenced records still exist anywhere in the live
Snapshot; the project filter changes the popout view, not the global pin. The
ordered primary policy is:

1. eligible pinned task;
2. an active task in the selected/current project, using newest valid session
   time as a tie-breaker and Snapshot order as the stable fallback;
3. the newest valid session-backed task in any visible project;
4. current project with no task, or global no-project/no-active fallback.

No branch treats status, mtime, child counts, or checklist data as progress.
All non-primary records remain in the popout projection.

## UI State contract

- `selectedProjectId`: plain project ID; empty means all projects.
- `pinnedTaskId`: JSON-encoded `[projectId, taskId]` token so task IDs remain
  unambiguous across projects.
- Local properties update immediately. When the documented DMS State API is
  available, writes use `savePluginState` and sibling widget instances reload
  on `pluginStateChanged`.
- Missing, malformed, stale, or filtered-out state is ignored. It never makes
  the Snapshot empty and is not rewritten automatically during projection.
- If the host cannot flush State, the current component remains usable and
  logs/reports the limitation. There is no fallback to plugin settings or
  Trellis data. Cross-process restart persistence remains a v0.7 acceptance
  concern; v0.6 verifies popout close and plugin reload.

## Popout information architecture

The popout retains one bounded scroll region. A compact project filter appears
before live tasks. Empty selection means all projects. Within each visible
project tasks are grouped in deterministic order: active, in-progress,
planning, error, then other/unknown. Rows show title, truthful state, priority,
parent/child summary, active-session count, and a Material pin control.

Completed/archive records are not manufactured in this view. Stale/malformed
session conditions remain warnings. Project/task caps and explicit `+N more`
copy remain in force.

## Responsive and accessibility contract

- Horizontal pill: single-line bounded label/count projection plus warning.
- Vertical pill: Material icon stack only.
- Popout: target 420 × 480, one-column, clipped vertical scrolling, no
  horizontal overflow; long identifiers elide while recovery text wraps.
- Native DMS controls own focus/ripple. Filter and pin controls participate in
  reading/focus order and support Return/Space through their control contract.
- State always has text/icon semantics; no semantic dependence on color or
  animation.

## Compatibility, rollout, and rollback

The public Snapshot stays schema version 1 and all existing settings remain
valid. Helper filenames remain lowercase for reload compatibility. The
manifest changes from `0.5.0` to `0.6.0` only in the final integration child.

Rollback is ordered: revert the final widget/projection/parser/test changes as
one v0.6 set and restore manifest `0.5.0`. Persisted UI State keys are inert to
v0.5 and need not be deleted.
