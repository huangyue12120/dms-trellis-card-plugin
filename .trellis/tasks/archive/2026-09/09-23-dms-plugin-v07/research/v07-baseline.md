# v0.7 planning evidence

Captured on 2026-09-23 before implementation. This note records repository
facts and decisions used by the v0.7 planning artifacts; it is not a product
runtime contract by itself.

## Roadmap and scope

- `PROJECT_PROGRESS.md:831-985` defines v0.7 as on-demand Markdown details,
  archive browsing, and recoverable Settings/State flows.
- The roadmap names three independently verifiable deliverables:
  `0.7.1` task Markdown detail, `0.7.2` archive browsing/lazy loading, and
  `0.7.3` Settings/State/recovery.
- The roadmap text says `0.7.2` depends on `0.7.1`, although `0.7.1` also
  says the two can run in parallel. This plan resolves the contradiction by
  sequencing a shared detail-read contract first, then archive integration,
  then Settings/State integration.

## Existing data and safety boundaries

- `TrellisDms/lib/trellisParser.js:331-345` publishes schema-1 project
  snapshots with `archiveSummary: { loaded: false, taskCount: null }` and no
  Markdown body. `buildSnapshot()` at `:353-370` retains one global Snapshot
  shape.
- `TrellisDms/lib/trellisPaths.js:244-275` classifies live/archive task
  directories; archive access requires explicit `allowArchive`. The same
  module's `:370-385` resolver accepts only direct `prd.md`, `design.md`, and
  `implement.md` basenames. Canonicalization and containment must remain the
  only path policy.
- The verified Trellis task layout is
  `.trellis/tasks/archive/<YYYY-MM>/<task-dir>` (see the archived prerequisite
  research `research/trellis-data-model.md:Archive contract` and
  `research/path-safety.md`). The roadmap shorthand `.trellis/archive/...` is
  not the observed layout; v0.7 will use the verified path and keep the
  resolver explicit rather than silently supporting a second root.
- `TrellisDms/TrellisDaemon.qml:819-825` is the current single Snapshot
  publisher. `:900-959` installs bounded watchers only for known version,
  task, and session files; `:1015-1075` owns topology scans and the 15-300
  second interval. It does not enumerate archive tasks or read Markdown.
- `TrellisDms/TrellisWidget.qml:30-40` consumes only the global Snapshot and
  pure projections. `:42-104` owns the two v0.6 State keys
  `pinnedTaskId`/`selectedProjectId`; there is no task-detail interaction.
- `TrellisDms/TrellisSettings.qml:15-77` already persists trusted roots and
  reads the output-only `discoveredProjects` cache. It exposes display mode,
  topology interval, and manual refresh, but no v0.7 visibility/default/reset
  controls.

## Host capability evidence

- Installed Qt 6 QML metadata exposes `Text.MarkdownText`; the DMS tree also
  contains `Common/markdown2html.js` and uses `Text.RichText` in existing
  read-only descriptions. The implementation should verify native Markdown in
  the offscreen harness and retain a bounded plain-text fallback; it must not
  add WebView or a heavy parser.
- Quickshell `FileView` exposes asynchronous `loaded`/`loadFailed`,
  `blockWrites`, `atomicWrites`, and `preload`, but no file-size property. A
  detail reader therefore needs an argv-only `stat`/size gate before creating a
  Markdown `FileView`, followed by an asynchronous read and generation/request
  guard.
- DMS `PluginGlobalVar` supports reactive cross-surface values, and
  `PluginService` exposes `savePluginState`, `loadPluginState`, and
  `removePluginStateKey`. Global vars are runtime-only; State is persistent
  UI preference storage. The existing quality contract forbids raw Markdown in
  the Snapshot, so v0.7 will document a separate bounded, one-request
  ephemeral detail channel rather than adding body text to `snapshot`.

## Historical decisions carried forward

- v0.5/v0.6 decisions keep the observer read-only, use DMS Material controls
  and semantic Theme values, never infer progress from status/mtime/checklists,
  and keep archive/Markdown outside the live Snapshot.
- v0.6 intentionally persisted only `pinnedTaskId` and `selectedProjectId`.
  v0.7 owns the broader settings migration, reset flow, collapse/filter
  preferences, and restart-persistence acceptance.
- The DMS State backend has an observed asynchronous host failure
  (`Property 'connect' of object false is not a function`). The plugin must
  report synchronous API errors and preserve local usability; it must not add
  a Trellis-file or settings fallback or claim restart persistence when the
  host write cannot be verified.

## Planning decisions

1. Keep Snapshot schema version 1 and publish no Markdown or archive task
   bodies in it.
2. Use a daemon-owned, bounded detail request/response channel for both live
   Markdown and archive index/detail reads. Requests carry only project/task
   identities and fixed document/month/page selectors; the daemon resolves
   paths from its validated current model.
3. Treat archive as a read-only view of the verified
   `.trellis/tasks/archive/<YYYY-MM>/...` tree. Index months and bounded task
   summaries first; load a selected task's `task.json`/Markdown only when
   requested. Archive failures never replace the live Snapshot.
4. Preserve legacy `displayMode` while introducing the roadmap's `pillMode`
   setting as the canonical v0.7 display preference. A one-time read/migrate
   path prevents existing v0.6 installs from silently changing mode.
5. Add only bounded UI State keys needed for the approved flow: existing pin
   and project filter plus collapsed project/group preferences and the selected
   archive month. Reset removes only those keys and never clears the
   `discoveredProjects` cache.

## Deferred or environment-gated facts

- Real Wayland pointer/focus/scroll behavior, direct Settings targeting,
  native Markdown rendering on the installed host, and full DMS restart State
  persistence remain runtime gates. Static/offscreen evidence must label them
  separately when the host is unavailable.
- The exact maximum Markdown byte limit is an implementation constant to be
  shared by the resolver/reader tests; the plan requires it to be finite,
  documented, and lower than or equal to the existing 1 MiB JSON safety
  ceiling. It is not a user-configurable setting.
