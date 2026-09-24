# v0.9.1 Desktop Snapshot Projection Contract

### 1. Scope / Trigger

Use this contract when changing the v0.9.1 desktop surface or its pure Snapshot
projection. The daemon remains the only filesystem collector; desktop
placements render one shared Snapshot.

### 2. Signatures

```text
makeDesktopProjection(snapshot, uiState?) -> DesktopProjection
```

The projection returns `ready`, `projectCount`, `unconfigured`, `degraded`,
`projects[]`, `warningCount`, `warnings[]`, and `hiddenWarningCount`. Each
project has `{ id, name, taskCount, activeTaskCount, activeTasks[] }`; each
active task has `{ id, title, activeSessionCount }`; each warning has
`{ code, message }`.

### 3. Contracts

- The QML surface reads `PluginGlobalVar("snapshot")` and loads the shared
  `versionWarning` preference with
  `PluginService.loadPluginData(pluginId, key, defaultValue)`. Reload it when
  `PluginService.pluginDataChanged(pluginId)` fires for this plugin. Desktop
  `pluginData` is per-placement config and is not the source of shared settings.
- The surface creates no reader, process, timer, watcher, persistent UI State,
  or filesystem scan.
- Keep projects and tasks in Snapshot order. Include every loaded project and
  every task whose `runtimeState === "active"`; do not add a project/task cap
  beyond the daemon's 32-project / 128-task-per-project limits.
- Project `taskCount` counts all loaded live task records. `activeTaskCount`
  counts only active tasks. Each task's `activeSessionCount` comes from the
  Snapshot; session recency is never described as Agent activity.
- Filter version-warning presentation through `normalizeUiState(uiState)`.
  `warningCount` is the count after filtering; return no more than three
  bounded detail rows and report the rest in `hiddenWarningCount`. Prioritize
  one degraded-scan warning among the displayed rows when present.
- Set `unconfigured` only when a ready Snapshot has `root_empty`; distinguish
  that from a valid configured scan with zero projects. Degraded warnings
  augment healthy facts and do not replace them.
- Do not copy task `progress`, session timestamps, archive content, or Markdown
  into the desktop projection. The UI uses one vertical scroll region and
  leaves placement/resize persistence to the DMS host.

### 4. Validation & Error Matrix

| Input / condition | Required result |
|---|---|
| Missing or unsupported Snapshot | `ready: false`; QML shows loading copy without fabricated counts |
| Ready Snapshot with `root_empty` and no projects | `unconfigured: true`; show trusted-root guidance |
| Ready Snapshot with no projects and no `root_empty` | `unconfigured: false`; show empty discovery copy |
| Multiple projects/tasks | Preserve order and include all loaded projects and active tasks |
| No active task in a project | Retain project/live-task count and show the no-active-session copy |
| More than three visible warnings | Return three details, total visible count, and exact hidden count |
| Degraded warning after the first three warnings | Include one degraded warning in the three displayed details |
| Version-warning display disabled | Filter version-warning presentation only; do not mutate Snapshot |
| This plugin's shared setting changes | Reload `versionWarning` after `pluginDataChanged(pluginId)` |
| Another plugin's setting changes | Keep this surface's current preference |

### 5. Good / Base / Bad Cases

- Good: one shared Snapshot supplies every placement, every active task remains
  available in order, and warnings are capped with an explicit overflow count.
- Base: an empty but valid Snapshot produces either unconfigured guidance or
  empty-discovery copy based on `root_empty`.
- Bad: rescanning from QML, slicing projects/tasks at the surface, deriving
  Agent activity from session recency, or turning missing progress into a
  percentage is forbidden.

### 6. Tests Required

- Projection assertions cover null/invalid Snapshot, configured and
  unconfigured empty states, project/task order, active-session counts,
  warning filtering/cap/overflow, degraded-warning priority, immutability, and
  absence of `progress` in the view model.
- Static QML checks cover the exact helper/global import and absence of file
  readers, processes, sockets, timers, watchers, and State writes.
- Live DMS checks separately cover plugin load, desktop placement/removal,
  resize, multiple screens, and unchanged single-daemon lifecycle. Static
  checks do not stand in for those runtime results.

### 7. Wrong vs Correct

```qml
// Wrong: placement-specific widget config is mistaken for shared plugin settings.
versionWarning = pluginData.versionWarning
```

```qml
// Correct: load the shared setting and refresh only for this plugin's changes.
function reloadVersionWarningPreference() {
    versionWarning = PluginService.loadPluginData(pluginId, "versionWarning", true)
}

Connections {
    target: PluginService
    function onPluginDataChanged(changedPluginId) {
        if (changedPluginId === root.pluginId)
            root.reloadVersionWarningPreference()
    }
}
```
