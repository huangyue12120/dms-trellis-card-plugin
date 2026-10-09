# v1.3 Notifications and Surface Product Gate

## Goal

Give users an optional, low-noise signal when a project crosses a meaningful
Health boundary, then close the v1.3 product decisions for Task Change
notifications and a Control Center surface without expanding the read-only
Trellis observer contract.

## User value

Users who opt in can learn that a project became degraded or recovered without
keeping the DMS popout open. The existing Health and Recent Trellis Changes
views remain the source of detail; notifications only point to a bounded
summary and never carry task or Markdown content.

## Confirmed repository facts

- `TrellisDms/TrellisDaemon.qml:_publishSnapshot` is the single Snapshot and
  Recent Changes publisher. The daemon already owns the `health_degraded` and
  `health_recovered` semantic events through `TrellisChanges.observeSnapshot`.
- `TrellisDms/lib/trellisprojection.js:makeHealthProjection` already groups
  warnings into project/root Health incidents and exposes freshness/fallback
  state. It does not infer activity from mtimes.
- `TrellisDms/lib/trellischanges.js` establishes a quiet initial/reload
  baseline, so a daemon restart has no prior event to report. Recent Changes is
  runtime-only and bounded.
- `TrellisDms/TrellisSettings.qml` persists plugin settings through DMS
  `PluginSettings`; the manifest already declares `settings_read`,
  `settings_write`, and `process`, and declares no network permission.
- The installed DMS 1.6.3 CLI exposes `dms notify`; the installed plugin docs
  expose `ToastService` for in-shell feedback but no documented plugin method
  for emitting a notification into the DMS notification center. DMS source uses
  argv-based local notification commands. The project release baseline remains
  DMS 1.6.2, so live host compatibility is an acceptance item, not a planning
  assumption.
- No Control Center component or `ccWidget*` projection exists in this
  repository. Bar/popout, Desktop Health, Recent Changes, diagnostics, and
  Launcher are already implemented projections of the shared Snapshot.

## Requirements

### R1 Health Notification

- Add an independently persisted, explicit opt-in setting; the default is
  disabled and the setting can be disabled without changing Snapshot or scan
  behavior.
- Notify only on a project/root Health transition from healthy to degraded or
  from degraded to recovered. Do not notify for every task/session event,
  warning count change, freshness clock change, or long period without change.
- Use a daemon-owned transition ledger with bounded keys and a startup quiet
  baseline. A continuous incident emits at most one degraded notification; a
  recovery emits at most one notification and only after a corresponding
  degraded transition was observed in the current notification lifecycle.
- Keep notification text bounded and privacy-safe: include plugin/project
  display context and a short Health summary, never raw paths, task content,
  session pointers, Markdown, or inferred Agent activity.
- Send through a local DMS notification mechanism using argv-only process
  execution when available. Notification failure is recorded locally and must
  not block or mutate the core Snapshot publication path.
- Clicking/opening the notification may route to an existing Health or
  diagnostics surface only if the supported DMS API can do so without adding a
  new scanner, daemon, permission, or arbitrary path authority. Otherwise the
  notification remains informational.

### R2 Task Change Notification product evaluation

- Evaluate `task entered archive` and `new active task observed` against the
  existing v1.2 Recent Changes contract and available usage evidence.
- Close the task with exactly one decision: `IMPLEMENT LIMITED SET`, `DEFER`,
  or `REJECT`. Do not implement task-change notifications unless low noise and
  distinct user value are demonstrated.
- Do not notify on inferred activity, every watcher event, session-count
  changes, or task/Markdown content.

### R3 Control Center product gate

- Evaluate the unique user scenario, overlap with existing Popout/Desktop/
  Launcher surfaces, need for a new projection, maintenance cost, DMS UX
  consistency, and whether the feature can reuse the current Snapshot without
  a new scanner or watcher.
- Close the gate with exactly one decision: `APPROVE`, `DEFER`, or `REJECT`.
- If approved, this task produces only the Product Gate and a follow-up
  implementation task; it does not add production QML or a manifest surface.

### R4 Release / defer record

- Record implemented, deferred, and rejected candidates in v1.3 release notes
  and the source-backed `PROJECT_PROGRESS.md` status.
- Preserve the current manifest permission set and read-only Trellis boundary.
- Publish a v1.3 version only if an implemented candidate passes its required
  host acceptance; do not create an empty release when all candidates defer or
  reject.

## Acceptance criteria

- [x] With notifications disabled, no notification process is started and
  Snapshot, watcher, reload, and recovery behavior are unchanged.
- [x] A deterministic fixture or pure helper test proves one degraded
  transition produces one notification, repeated degraded snapshots produce
  none, one recovery produces one notification, repeated recovery produces
  none, and initial/restarted baselines do not re-notify an old incident.
- [x] Notification command arguments and text are bounded, argv-only, free of
  raw paths/task content, and failures cannot prevent Snapshot publication.
- [x] The current v1.2 Recent Changes fixtures remain green and the Task Change
  evaluation cites their semantics plus a clear product decision.
- [x] The Control Center gate cites existing surface coverage and records an
  explicit decision; no manifest or production QML changes occur unless a
  separate approved implementation task is opened.
- [ ] A supported DMS 1.6.2 host check records notification enabled/disabled,
  degraded/recovered transitions, restart behavior, and failure isolation;
  unavailable host evidence is recorded as unverified rather than pass.
- [x] No new network permission, Trellis write, Agent hook, external push
  service, or additional scanner/watcher is introduced.

## Out of scope

- Notifications for ordinary task/session changes, Markdown, inferred Agent
  activity, or lack of file changes.
- A custom notification center, full Control Center duplicate, arbitrary path
  opening, external push service, or new parser/scanner.
- Stable release/tag publication without the existing release gates.

## Resolved product decisions

- Implement only the explicit opt-in Health notification in this task.
- Close Task Change notifications as `DEFER`: Recent Changes provides passive
  observation, but the repository has no usage evidence proving that active
  task/archive notifications add value without noise.
- Close the Control Center gate as `DEFER`: the existing Desktop Health,
  Popout, Recent Changes, Diagnostics, and Launcher cover the proposed use
  cases; no unique Control Center scenario or new projection is established.
- If the Health implementation passes static and supported-host checks, record
  a v1.3.0 candidate release. Keep external publication and any manifest bump
  behind the existing host/release gates.

## Task map

- `10-09-v131-health-notification`: implementation child; owns the settings,
  pure transition helper, daemon notification adapter, and feature tests.
- `10-09-v132-task-change-gate`: lightweight product-evaluation child; owns the
  evidence and `DEFER` decision for Task Change notifications.
- `10-09-v133-control-center-gate`: lightweight product-gate child; owns the
  evidence and `DEFER` decision for a Control Center surface.
- This parent owns cross-child integration, release/defer notes, progress
  markers, full-scope verification, and the final candidate decision.
