# v0.6 planning evidence

## Current implementation gap

- `TrellisDms/lib/trellisprojection.js` implements six v0.5 display modes and
  a bounded minimal popout, but selects the first active task/project and has
  no primary reason, project filter, priority, relation, or grouping contract.
- `TrellisDms/TrellisWidget.qml` renders the minimal v0.5 project/task/warning
  view and has no DMS State preference wiring or task-row controls.
- `TrellisDms/lib/trellisParser.js` preserves all session records but currently
  emits `mtime: null`; it does not project the real pointer field
  `last_seen_at`.
- Real `.trellis/.runtime/sessions/*.json` records contain `last_seen_at` and
  `current_task`, so recent-session selection can use authoritative pointer
  data without filesystem mtime.

## DMS API evidence

- `/usr/share/quickshell/dms/Modules/Plugins/PluginComponent.qml` injects
  `pluginService` into bar widgets.
- `/usr/share/quickshell/dms/Services/PluginService.qml` provides
  `loadPluginState`, `savePluginState`, `removePluginStateKey`, and a
  plugin-scoped `pluginStateChanged` signal. Writes are debounced before disk
  flush.
- `clearPluginState` clears the whole plugin namespace and therefore must not
  be used for pin/filter reset because `discoveredProjects` already shares the
  namespace.
- The current host has logged a State write-back failure for the remembered
  project cache. v0.6 must keep local interaction usable, attempt the documented
  State API, report disk-persistence failure, and never fall back to Trellis
  writes or unrelated settings.

## Settled product boundary

- v0.6 brings forward only `pinnedTaskId` and `selectedProjectId` State.
- `pinnedTaskId` is an opaque project-qualified token; task IDs alone are not
  globally unique.
- Broader preference reset/recovery and additional UI State remain v0.7.
- Markdown, archive bodies, task mutation, Agent controls, desktop/launcher,
  custom themes, and fabricated progress stay outside v0.6.

## Review conclusions

- Add nullable bounded `session.lastSeenAt` without changing schema version 1.
- Keep primary/filter/grouping logic pure and deterministic; QML renders the
  projection and alone owns State I/O.
- Execute 0.6.1, 0.6.2, and 0.6.3 sequentially because they touch shared
  projection/widget surfaces.
- The archive boundary is the resolved path. A live-path record with custom or
  `completed` stored status remains a visible live fact rather than being
  silently discarded.
