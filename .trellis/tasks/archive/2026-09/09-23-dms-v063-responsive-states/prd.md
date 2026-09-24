# v0.6.3 Degraded states and responsive validation

## Goal

Close the v0.6 integration gate: make every approved P0/P1 state recoverable,
verify horizontal/vertical/narrow behavior in real or deterministic DMS
environments, preserve prior safety contracts, and release the integrated
plugin as version `0.6.0`.

## Requirements

### R1. State-matrix completion

Provide fixtures and UI behavior for startup/loading, rescan with last coherent
data, no trusted roots, no projects, project without tasks, no active task,
planning/in-progress/unknown/live-path completed state, malformed/read error,
stale session, unknown version, warning with healthy data, and degraded
last-good scan.

### R2. Recovery actions

Keep healthy facts visible. Recovery is limited to manual rescan, opening DMS
plugin settings, or read-only inspection. It must never rewrite, delete, move,
or silently repair Trellis files. Refresh feedback cannot claim completion
until a new coherent Snapshot arrives.

### R3. Responsive integration

Verify bounded horizontal labels, icon-only vertical pill, long-name elision,
one-column narrow popout scrolling, normal popout sizing, focus order, and
reachable filter/pin/refresh/settings controls. Do not claim keyboard pill
activation because the target DMS host exposes a pointer-only pill hook.

### R4. Lifecycle and compatibility

Verify repeated plugin reload, one daemon publisher, no duplicate timers/
watchers, multi-widget State synchronization, and preference retention across
popout close/plugin reload. Attempt DMS restart persistence and report any
host State-backend failure explicitly; do not add an unsafe fallback.

### R5. Release evidence

Update v0.6 UI/component/state docs, frontend quality contracts, and
`PROJECT_PROGRESS.md` with verified versus unavailable gates. Set
`plugin.json` to `0.6.0` only after all blocking static/pure/integration checks
pass.

## Acceptance criteria

- [x] Every P0/P1 state-matrix row has a deterministic fixture and explicit
  pill, popout, and recovery expectation.
- [x] Empty/unconfigured state recovers to project/task data after adding a
  trusted root or refreshing, without restarting DMS.
- [x] Warning/error/version/degraded states retain healthy tasks and never
  fabricate progress, activity, archive contents, or repairs.
- [x] Horizontal, vertical, long-name, narrow, and normal layouts have no
  unbounded width, horizontal overflow, clipped primary control, or focus trap.
- [x] Filter, pin, refresh, settings, close, and scrolling interactions remain
  reachable under supported pointer/keyboard host behavior.
- [x] Repeated reload and multiple widget instances do not duplicate the
  daemon, Snapshot publisher, timers, watchers, or State writes.
- [x] Pin/filter survive popout close and plugin reload. DMS restart State
  persistence is observed and any host write failure is recorded truthfully.
- [x] Node contracts, syntax, manifest parsing, exact-case resources,
  path-safety, discovery, watcher, read-only, and task-context validation pass.
- [x] Runtime/tooling gates that are unavailable are named explicitly rather
  than reported as successful.
- [x] `plugin.json` reports `0.6.0`, roadmap status matches reality, and no
  v0.7/v0.9 feature entered the v0.6 main flow.

## Out of scope

- Implementing new primary/filter semantics that belong to children 0.6.1 or
  0.6.2, Markdown/archive content, task mutation, desktop/launcher surfaces,
  custom themes, and fixes inside DMS itself.

## Dependency

Starts only after `09-23-dms-v061-primary-pill` and
`09-23-dms-v062-live-popout` pass their own quality reviews.

## Runtime acceptance note

Pure/static contracts and the installed-module offscreen load pass. Previous
reload evidence covers two widgets, one daemon per generation, and in-memory
State convergence. The current DMS host also logged an asynchronous State
write failure (`Property 'connect' of object false is not a function`), so a
successful pin/filter round trip across a full DMS restart is not claimed and
no unsafe fallback was added. The workspace v0.6.3 build was not copied to the
installed plugin; real Wayland visual, pointer, focus/scroll, direct Settings
navigation, and restart persistence remain named environment gates.
