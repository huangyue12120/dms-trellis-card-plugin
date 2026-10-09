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
`versionWarning`, `scanRoots`, `topologyInterval`, `notificationsEnabled`, and
the existing `refreshToken`. `displayMode` is a read-only migration source when
`pillMode` is absent.

`notificationsEnabled` is an explicit opt-in boolean with a safe default of
`false`. It controls only the daemon's bounded Health notification adapter;
toggling it must not start a scan, mutate Snapshot data, write Trellis files,
or enable task/session/Markdown notifications. Restore Defaults writes
`false`, and malformed or absent values are treated as disabled.

Desktop instance settings use these DMS 1.6.2 fields and APIs:

```text
instanceId: string -> DMS desktop instance ID when supplied
instanceData.id: string -> DMS desktop instance ID in the settings loader
effective desktop instance ID -> instanceData.id, then instanceId
desktop instance context -> effective ID, instanceData, or scoped pluginService
instanceData.config.displayPreferences -> preference records or ["all"]
instanceData.config.viewMode -> "overview" | "tasks" | "health" (default "overview")
SettingsData.updateDesktopWidgetInstanceConfig(effectiveInstanceId, updates)
SessionData.desktopWidgetInstancePositions[effectiveInstanceId][screenKey]
  -> { x?, y?, width?, height? }
SessionData.set("desktopWidgetInstancePositions", positionsByInstance)
```

## Scenario: Composite plugin data saves and Desktop lifecycle

### 1. Scope / Trigger

This contract applies to plugin-data settings writes from `TrellisSettings.qml`
when the manifest exposes multiple explicit components, including both Desktop
and Launcher surfaces. It records the DMS 1.6.2 reload behavior that otherwise
recreates Desktop content after each setting save.

### 2. Signatures

```text
PluginService.savePluginData(pluginId, key, value)
  -> writes plugin setting; emits pluginDataChanged(pluginId)
PluginService.reloadPlugin(pluginId)
  -> unloads then loads a currently loaded plugin
DesktopPluginWrapper
  -> pluginLoaded/pluginUnloaded(pluginId) calls contentLoader.reloadComponent()
PluginService.getLauncherPlugins()
  -> plugins with registered `components.launcher` and loaded state

Composite manifest fields:
  type: "composite"
  components.launcher: component path or absent
  capabilities: string[]
```

### 3. Contracts

- DMS 1.6.2 `PluginsTab` handles every `pluginDataChanged(pluginId)` for a
  loaded plugin whose `type` is `launcher` or whose `capabilities` include
  `launcher` by calling `reloadPlugin(pluginId)`, regardless of which setting
  key changed. That unload/load cycle makes `DesktopPluginWrapper` disable and
  re-enable its content Loader.
- For a composite manifest with explicit `components`, DMS resolves component
  surfaces from those keys and registers `components.launcher` independently of
  `capabilities`. Keep `type: "composite"` and the explicit launcher component,
  but do not also list `launcher` in `capabilities`; that redundant declaration
  triggers an unnecessary whole-plugin reload after settings saves.
- Normal plugin-data signaling remains enabled so `PluginComponent` instances
  can refresh their settings data and the daemon can classify scan-relevant
  changes. Only the redundant launcher capability is removed.
- In the inspected DMS 1.6.2 source, `PluginSettings.settingChanged()` has no
  consumer and is not the reload trigger. DMS versions may change this
  behavior; keep a host acceptance check for the supported runtime.
- Removing the launcher capability changes declared capability metadata.
  The explicit component remains the runtime Launcher surface; consumers that
  only inspect `capabilities` may no longer display a launcher capability badge.

### 4. Validation & Error Matrix

| Manifest / event | Required result |
|---|---|
| Composite manifest has `components.launcher` and omits launcher capability | Settings save does not satisfy DMS's launcher-triggered reload predicate; Launcher remains in `getLauncherPlugins()` while loaded |
| Composite manifest includes launcher capability and plugin data changes | DMS 1.6.2 reloads the plugin; Desktop content Loader is recreated |
| Explicit launcher component is absent | No Launcher component is registered, regardless of capability metadata |
| Desktop wrapper receives `pluginLoaded` or `pluginUnloaded` | Its content Loader may reload; ordinary plugin-data updates alone do not trigger this wrapper path |

### 5. Good / Base / Bad Cases

- Good: a composite manifest keeps `components.launcher`, omits the redundant
  launcher capability, and a settings save updates consumers without unloading
  the Desktop widget.
- Base: a non-Launcher composite plugin saves settings and retains its normal
  `pluginDataChanged` propagation.
- Bad: adding `launcher` to both `components` and `capabilities` on DMS 1.6.2
  makes every plugin-data save unload/reload all plugin components.

### 6. Tests Required

- `tests/test_trellis_contract.mjs` asserts `type: "composite"`, the explicit
  `components.launcher` path, the absence of `launcher` in `capabilities`, and
  the unchanged registered surfaces.
- DMS source compatibility checks confirm component registration comes from
  explicit `components` and that Launcher discovery uses the registered
  component map.
- On a supported running host, save a plugin setting and verify the Desktop
  widget remains mounted while the Launcher surface remains discoverable. Static
  manifest assertions do not establish visible runtime behavior.

### 7. Wrong vs Correct

```json
// Wrong on DMS 1.6.2: the capability causes a full plugin reload on each save.
{
  "type": "composite",
  "capabilities": ["launcher"],
  "components": { "launcher": "./TrellisLauncher.qml" }
}
```

```json
// Correct: the explicit component declares the Launcher surface once.
{
  "type": "composite",
  "capabilities": ["daemon", "dankbar-widget", "desktop-widget"],
  "components": { "launcher": "./TrellisLauncher.qml" }
}
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
- A `PluginGlobalVar` resolves its plugin ID from its immediate parent. When
  nested under a settings container such as a `Column`, that container must
  expose `pluginId: root.pluginId`. Plugin-wide Settings reads plugin metadata
  through the injected `root.pluginService` (`availablePlugins` and
  `isPluginLoaded`), not an unimported `PluginService` singleton.
- Desktop display preferences default to `instanceData.config.displayPreferences`
  or `["all"]` and persist with
  `SettingsData.updateDesktopWidgetInstanceConfig(effectiveInstanceId, { displayPreferences })`.
  Each instance has its own config.
- Desktop view mode accepts only `overview`, `tasks`, or `health`; missing and
  invalid values resolve to `overview`. The widget reads
  `DesktopPluginComponent.instanceConfig.viewMode`, and the instance Settings
  selector persists `{ viewMode }` with
  `SettingsData.updateDesktopWidgetInstanceConfig(effectiveInstanceId, updates)`.
  It is placement-specific and must not use plugin data, DMS Plugin State, or
  trigger a Snapshot scan.
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
| Desktop instance lacks a valid `viewMode` | Show Overview and persist future changes only to that instance config |
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
- Good: two Desktop placements read and write independent `viewMode` values
  through their DMS instance IDs; changing a mode reuses the shared Snapshot.
- Base: missing or malformed `viewMode` displays Overview without rewriting
  global settings or forcing a scan.
- Bad: saving `viewMode` through plugin-wide settings or DMS UI State, or
  storing it in a shared Snapshot, is forbidden.

## 6. Tests Required

- Pure assertions cover all six modes, legacy/unknown migration, boolean
  defaults, progress null/number gating, warning filtering, and State caps.
- Static QML assertions cover permission checks, cache priming, key-scoped
  save/remove, plugin State synchronization, restore-defaults scope, archive
  visibility, and empty Repeater models. They also cover global-versus-instance
  Loader gating, instance display preference writes, targeted geometry field
  removal, and picker navigation without trusted-root mutation.
- Desktop mode assertions cover normalization, instance-scoped config writes,
  absence of global/State writes, and the shared Snapshot boundary. Runtime
  DMS checks separately cover independent placements and restart persistence.
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

// Desktop view mode is saved to the same placement-specific config boundary.
SettingsData.updateDesktopWidgetInstanceConfig(instanceId, {
    viewMode: "health"
})

// After cloning desktopWidgetInstancePositions, remove only the selected fields
// from this instance's screen records, then persist through the keyed setter.
SessionData.set("desktopWidgetInstancePositions", positionsByInstance)
```
