# v0.6.2 Live task popout and project filter

## Goal

Turn the minimal v0.5 popout into the complete read-only v0.6 live-task view,
with persistent pin/filter preferences, deterministic grouping, and truthful
priority, relationship, and multi-session information.

## Requirements

### R1. Minimal DMS State integration

Load, update, save, remove, and synchronize only `pinnedTaskId` and
`selectedProjectId` through DMS plugin State. A pin is globally eligible when
its project/task pair remains live. Empty selected project means All projects.
Never call `clearPluginState`, because it would also delete the independent
`discoveredProjects` cache.

### R2. Project filter and visual caps

Provide All-projects and per-project controls. Apply filtering before visual
project/task caps so a selected project remains visible even when it is beyond
the unfiltered cap. Invalid state falls back to All without deleting it during
startup or a degraded scan.

### R3. Complete live-task projection

Group rows deterministically as active, in-progress, planning, error, then
other/unknown while preserving Snapshot order within each group. Show bounded
task title, exact state, priority, parent/child summary, and active-session
count. A live-path `completed`/custom status stays in Other; only archive-path
data is excluded upstream.

### R4. Safe relationships and warnings

Display relation summaries without recursively constructing a task tree, so
conflicts/cycles cannot create infinite layout. Preserve healthy task rows when
stale/malformed/version/read warnings exist and keep warnings traceable by
bounded code/message text.

### R5. Accessible interaction

Use focusable native DMS controls for filter and pin/unpin actions, preserve
reading/focus order, and keep the approved one-column 420 × 480 scroll model.
No action writes Trellis task/session/archive data.

## Acceptance criteria

- [x] All/single-project filters work for two or more projects, including a
  selected project beyond the normal visual cap.
- [x] Pin/unpin uses a project-qualified token, works for active/planning/
  inactive tasks, and never resolves a duplicate task ID in another project.
- [x] Popout close, plugin reload, and a second widget instance preserve/sync
  the two State values when the host State API is available.
- [x] Unpin/filter reset removes only its own State key and leaves
  `discoveredProjects` untouched.
- [x] Group order is stable; priority, parent/child summary, exact bounded
  state, and session count all originate from Snapshot fields.
- [x] Multiple sessions for one task produce one task row with `N sessions`,
  not `+N` extra tasks; stale/malformed sessions remain bounded warnings.
- [x] Relationship cycles/conflicts and unknown statuses remain visible and do
  not recurse, crash, or fabricate hierarchy.
- [x] Project filtering affects projection only; Snapshot contents, discovery
  authority, and daemon watchers remain unchanged.
- [x] Filter and pin controls are keyboard-focusable under the DMS control
  contract; no unsupported pill keyboard activation is claimed.
- [x] Existing v0.3-v0.5 Node/static/read-only/reload checks remain green.

## Out of scope

- Markdown/task detail, archive browsing, search, task mutation, preference
  reset screens, custom themes, and manifest version bump.

## Dependency

Depends on reviewed `09-23-dms-v061-primary-pill` pure contracts. Child
`09-23-dms-v063-responsive-states` owns final state-matrix/runtime integration.
