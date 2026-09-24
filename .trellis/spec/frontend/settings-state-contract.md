# Settings and UI State Contract

## 1. Scope / Trigger

This contract applies when changing `TrellisSettings.qml`, the widget's DMS
State preferences, or the visibility settings that shape the live/archive UI.
The settings surface owns plugin-data writes and trusted-root controls; the
widget owns local projection state and key-scoped State I/O. Neither surface
reads or writes Trellis files.

## 2. Signatures

```text
normalizeDisplayMode(value)
  -> "auto" | "task" | "project" | "counts" | "icon" | "full"
normalizeBooleanSetting(value, fallback) -> boolean
normalizeCollapsedProjectIds(value) -> string[] (maximum 32)
normalizeCollapsedTaskGroups(value) -> string[] (maximum 128)
normalizeSelectedArchiveMonth(value) -> "" | "YYYY-MM"

PluginService State keys:
  pinnedTaskId          -> project-qualified JSON token or empty string
  selectedProjectId     -> bounded project ID or empty string
  collapsedProjectIds   -> unique bounded project IDs
  collapsedTaskGroups   -> unique `projectId/groupKey` tokens
  selectedArchiveMonth  -> one bounded `YYYY-MM` value or empty string
```

Plugin-data settings are `pillMode`, `showProgress`, `showArchive`,
`versionWarning`, `scanRoots`, `topologyInterval`, and the existing
`refreshToken`. `displayMode` is a read-only migration source when
`pillMode` is absent.

## 3. Contracts

- `pillMode` accepts the six existing v0.6 values. A missing `pillMode` may
  migrate a valid `displayMode`; an unknown value becomes `auto`.
- Visibility defaults are `showProgress: true`, `showArchive: true`, and
  `versionWarning: true`. Progress is projected only when the Snapshot field
  is a finite number; a `null` field remains absent.
- `versionWarning` filters only warning presentation. The daemon's version
  value and compatibility diagnostics remain in the Snapshot.
- `showArchive` hides the archive entry/index and closes an open archive mode;
  it does not mutate live Snapshot data or archive State.
- The widget loads all five State keys on startup and this plugin's
  `pluginStateChanged`, updates local values before persistence, and persists
  only the changed key. Invalid stored values remain stored, fall back locally,
  and produce bounded recovery copy.
- Empty pin/filter/month values use `removePluginStateKey` when available and
  otherwise save an empty value. Before key removal from Settings, call
  `loadPluginState` once so DMS's cache-backed removal API is effective.
- Restore defaults checks `hasPermission`, resets known plugin-data settings and
  roots, removes only the five UI State keys, and never calls
  `clearPluginState` or targets `discoveredProjects`.
- A collapsed project/group uses an empty QML `Repeater.model`; setting
  `Repeater.visible` alone does not reliably remove sibling delegates or their
  layout contribution.

> **Cache boundary:** setting `scanRoots` to an explicit empty array is still
> an authoritative daemon input. The reset action does not directly delete
> `discoveredProjects`, but a later coherent empty scan may replace that
> output-only cache with `[]` under the trusted-root contract.

## 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Missing/invalid `pillMode` | Use `auto`; migrate only from an absent `pillMode` |
| Invalid boolean setting | Use its safe `true` default |
| Snapshot `progress: null` | Do not render or synthesize a percentage |
| Invalid/capped collapse or month State | Use empty/bounded local fallback and show copy; do not delete State |
| State API missing or synchronous throw | Keep local interaction and show bounded warning |
| No `settings_write` permission | Do not claim defaults/refresh were saved; show bounded warning |
| State removal API without a loaded cache | Prime with `loadPluginState` before removing keys |
| Restore defaults | Remove only known UI keys; preserve unknown keys and do not call `clearPluginState` |
| Explicit `scanRoots: []` after reset | Disable discovery; allow the daemon's normal empty-scan cache replacement |

## 5. Good / Base / Bad Cases

- Good: a valid legacy display mode is copied to `pillMode`, a toggle updates
  the widget through plugin-data signaling, and an invalid collapse list is
  ignored with visible bounded copy.
- Base: no State keys produce the normal All view; the first user action writes
  only its own normalized key.
- Bad: treating `displayMode` as authoritative when `pillMode` exists,
  fabricating progress from task status, clearing the whole State namespace,
  or leaving collapsed Repeater delegates in the layout is forbidden.

## 6. Tests Required

- Pure assertions cover all six modes, legacy/unknown migration, boolean
  defaults, progress null/number gating, warning filtering, and State caps.
- Static QML assertions cover permission checks, cache priming, key-scoped
  save/remove, plugin State synchronization, restore-defaults scope, archive
  visibility, and empty Repeater models.
- State-matrix fixtures cover empty roots, no projects, invalid State, healthy
  warnings, degraded refresh, archive/detail failure, and narrow responsive
  layout.
- Runtime DMS checks should cover settings changes, two-widget convergence,
  restore defaults, focus/scroll, and restart persistence. If host State writes
  or the offscreen QML harness are unavailable, record those gates as
  unverified rather than inferring them from static tests.

## 7. Wrong vs Correct

```qml
// Wrong: clear unrelated output state, or hide a Repeater without removing
// delegates that are parented alongside it.
pluginService.clearPluginState(pluginId)
Repeater { visible: projectCollapsed; model: project.groups }
```

```qml
// Correct: prime the cache, remove only known keys, and make the model empty.
pluginService.loadPluginState(pluginId, "pinnedTaskId", "")
pluginService.removePluginStateKey(pluginId, "pinnedTaskId")
Repeater { model: projectCollapsed ? [] : project.groups }
```
