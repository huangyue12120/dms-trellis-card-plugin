# Settings and UI State Contract

## 1. Scope / Trigger

This contract applies when changing `TrellisSettings.qml`, the widget's DMS
State preferences, global-versus-instance settings, or the visibility settings
that shape the live/archive UI. The settings surface owns plugin-data writes,
trusted-root controls, and DMS desktop instance configuration; the widget owns
local projection state and key-scoped State I/O. Neither surface reads or
writes Trellis files.

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

Desktop instance settings use these DMS 1.6.2 fields and APIs:

```text
instanceId: string -> DMS desktop instance ID when supplied
instanceData.id: string -> DMS desktop instance ID in the settings loader
effective desktop instance ID -> instanceData.id, then instanceId
desktop instance context -> effective ID, instanceData, or scoped pluginService
instanceData.config.displayPreferences -> preference records or ["all"]
SettingsData.updateDesktopWidgetInstanceConfig(effectiveInstanceId, updates)
SessionData.desktopWidgetInstancePositions[effectiveInstanceId][screenKey]
  -> { x?, y?, width?, height? }
SessionData.set("desktopWidgetInstancePositions", positionsByInstance)
```

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
- DMS 1.6.2 loads the manifest settings component in both plugin-wide Settings
  and desktop instance cards. Declare `instanceId` and `instanceData`; derive
  the effective instance ID from `instanceData.id` first and `instanceId`
  second. Activate only the instance view for either that ID, present
  `instanceData`, or the DMS instance-scoped `pluginService` adapter (which
  lacks either global Plugin State API). The instance path must not load or
  migrate global plugin settings, read or write DMS Plugin State, or save
  display preferences through the instance-scoped `pluginService` adapter. If
  instance context exists without an effective ID, show a diagnostic instead
  of global settings or inert controls.
- Desktop display preferences default to `instanceData.config.displayPreferences`
  or `["all"]` and persist with
  `SettingsData.updateDesktopWidgetInstanceConfig(effectiveInstanceId, { displayPreferences })`.
  Each instance has its own config.
- DMS 1.6.2 desktop geometry is stored in
  `SessionData.desktopWidgetInstancePositions[effectiveInstanceId][screenKey]`, not in
  `instanceData.config.positions`. Reset Position removes only `x` and `y`;
  Reset Size removes only `width` and `height` across that instance's screen
  entries, then persists the updated map with `SessionData.set`. Preserve other
  screen entries, geometry fields, and instance IDs.
- The trusted-folder picker may expose `/` as a navigation shortcut. Opening
  or browsing it must not change `scanRoots`; only selecting a concrete
  directory calls the existing trusted-root validation and save path. This does
  not authorize or scan `/` automatically.
- DMS 1.6.2 lazily creates the file-browser content when the modal opens.
  Inject custom quick-access entries after the content is available and copy
  its `property var` model using `length` and indexed reads; do not assume the
  exposed QML list passes JavaScript `Array.isArray` checks. Schedule the
  injection after the modal opens as well as after its content loads, and make
  insertion idempotent.
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
| Desktop settings component has `instanceData`, an effective instance ID, or the instance-scoped `pluginService` | Create instance controls only; leave plugin-data migration and plugin State untouched |
| Desktop instance context exists but no effective ID is available | Show an ID-unavailable diagnostic; do not show global settings or inert controls |
| Desktop instance lacks `displayPreferences` | Show the all-displays default and persist a change only to that instance config |
| Reset Position / Reset Size clicked | Remove only the matching geometry fields from this instance's SessionData map; preserve other dimensions and instances |
| Picker opened or navigated to `/`, `/run/media`, or `/mnt` | Keep `scanRoots` unchanged until a concrete directory is selected |

## 5. Good / Base / Bad Cases

- Good: a valid legacy display mode is copied to `pillMode`, a toggle updates
  the widget through plugin-data signaling, and an invalid collapse list is
  ignored with visible bounded copy.
- Base: no State keys produce the normal All view; the first user action writes
  only its own normalized key.
- Bad: treating `displayMode` as authoritative when `pillMode` exists,
  fabricating progress from task status, clearing the whole State namespace,
  or leaving collapsed Repeater delegates in the layout is forbidden.
- Good: a desktop instance updates only its own `displayPreferences`; its
  position and size reset buttons remove only `x/y` or `width/height` from
  DMS's per-instance SessionData map.
- Base: an instance with no saved display preference shows `["all"]`; a reset
  with no saved geometry leaves the default centered placement and size.
- Bad: using the instance-scoped `pluginService` fallback for global migration,
  writing `positions: {}` into instance config as a geometry reset, or adding
  `/` to `scanRoots` just because the picker navigated there is forbidden.

## 6. Tests Required

- Pure assertions cover all six modes, legacy/unknown migration, boolean
  defaults, progress null/number gating, warning filtering, and State caps.
- Static QML assertions cover permission checks, cache priming, key-scoped
  save/remove, plugin State synchronization, restore-defaults scope, archive
  visibility, and empty Repeater models. They also cover global-versus-instance
  Loader gating, instance display preference writes, targeted geometry field
  removal, and picker navigation without trusted-root mutation.
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

For desktop instance controls, write display preferences through the DMS
instance config API and reset geometry in the SessionData map:

```qml
SettingsData.updateDesktopWidgetInstanceConfig(instanceId, {
    displayPreferences: preferences
})

// After cloning desktopWidgetInstancePositions, remove only the selected fields
// from this instance's screen records, then persist through the keyed setter.
SessionData.set("desktopWidgetInstancePositions", positionsByInstance)
```
