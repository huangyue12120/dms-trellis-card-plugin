# Degraded-State and Responsive Recovery Contract

## 1. Scope / Trigger

This contract applies to widget refresh/Settings recovery and constrained
popouts. Recovery stays inside DMS APIs and never reads or writes Trellis
files.

## 2. Signatures

```text
isNewerGeneratedAt(candidate, baseline) -> boolean
makePopoutProjection(snapshot, limits?, uiState?)
  -> { ready, generatedAt, degraded, projects, warnings, ... }
```

The only refresh write is
`pluginService.savePluginData(pluginId, "refreshToken", uniqueValue)`.

## 3. Contracts

- Refresh writes only `refreshToken` with `savePluginData`, preserves current
  facts, and never claims success at click time. Pending clears only for a
  parseable `generatedAt` later than the baseline and no scan/reload
  degradation; equal, older, malformed, retained-last-good, dropped/orphaned
  reload, and version/task/session reload failures keep it pending.
- Source warnings remain visible without automatically making a coherent scan
  degraded. Settings recovery uses `PopoutService`; missing APIs show bounded
  copy and never trigger a Settings/Trellis persistence fallback.
- Clamp the 420 × 480 target to `parentScreen`; use one viewport-width vertical
  `DankFlickable`, wrapping `Flow`s, elided facts, and native 40-px controls.
- Tests must cover timestamp ordering, degradation classification, read-only
  recovery surfaces, exact bounds, narrow/long-name offscreen loading, and
  multi-widget State convergence. Real Wayland focus/scroll/Settings navigation
  and restart persistence remain explicit runtime gates; report host State
  write failures instead of masking them.

## 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| New coherent Snapshot has a strictly newer valid `generatedAt` | Clear refresh pending and retain the new facts. |
| Timestamp is equal, older, missing, or invalid | Keep pending; do not infer refresh completion. |
| Scan/reload warning is classified degraded | Keep last-good facts visible and keep pending. |
| Source warning accompanies a coherent scan | Show the warning without discarding healthy project/task facts. |
| Refresh or Settings API is unavailable/throws | Keep the UI usable and show bounded failure copy. |
| Screen is smaller than 420 × 480 | Clamp popout bounds; retain one vertical scroll surface and reachable controls. |
| Real Wayland/restart gate is unavailable | Record it as unverified; never convert an offscreen/static pass into runtime evidence. |

## 5. Good / Base / Bad Cases

- Good: Refresh preserves the current task list, shows pending copy, and clears
  only after a newer coherent Snapshot arrives.
- Base: a coherent Snapshot with warnings keeps healthy rows, bounded warning
  text, native controls, and viewport-width content.
- Bad: clearing pending on any changed string, nesting horizontal popout
  scrollers, claiming a completed refresh on click, or using Settings/Trellis
  writes as a State fallback is forbidden.

## 6. Tests Required

- Pure fixtures cover all P0/P1 rows, strict timestamp ordering, degraded-code
  classification, last-good retention, and warning-with-healthy-data behavior.
- Static UI assertions cover screen clamps, 180-px pill text, icon-only
  vertical content, wrapping action/filter flows, elision, one scroll surface,
  native focusable controls, and read-only recovery calls.
- Offscreen QML loads normal/narrow/long-name cases when tooling is available;
  real Wayland pointer/focus/scroll, Settings targeting, empty-to-populated scan,
  and restart persistence remain separately reported gates.

## 7. Wrong vs Correct

### Wrong

```qml
onSnapshotChanged: refreshPending = snapshot.generatedAt !== baseline
onRefreshClicked: text = "Refresh complete"
```

### Correct

```qml
if (!projection.degraded
        && TrellisProjection.isNewerGeneratedAt(
            projection.generatedAt, refreshBaselineGeneratedAt)) {
    refreshPending = false;
}
```

## v0.7.3 Settings, State, and Collapse Addendum

### 1. Scope / Trigger

This addendum applies to settings migration, widget-owned preference State,
restore-defaults, and project/task collapse UI.

### 2. Signatures

```text
normalizeUiState(value) -> bounded settings-independent UI State
normalizeCollapsedProjectIds(value) -> <= 32 unique IDs
normalizeCollapsedTaskGroups(value) -> <= 128 project/group tokens
normalizeSelectedArchiveMonth(value) -> "" | "YYYY-MM"
```

### 3. Contracts

- Defaults are `pillMode: "auto"`, `showProgress: true`,
  `showArchive: true`, and `versionWarning: true`; legacy `displayMode` is
  read only when `pillMode` is absent.
- State keys are pin, project filter, collapsed projects/groups, and archive
  month. Invalid values fall back locally, remain stored, and show bounded
  copy. Writes update local state first and touch only the changed key.
- Prime DMS State with `loadPluginState` before
  `removePluginStateKey`; the host otherwise treats an unloaded cache removal
  as a no-op. Never call `clearPluginState` or use Settings/Trellis writes as
  a State fallback.
- QML Repeater delegates are parented alongside the Repeater. Collapse must
  use `model: collapsed ? [] : items`, not only `Repeater.visible`.
- `showProgress` preserves `null`; `versionWarning` filters presentation only.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Settings/State API absent or throws | Keep local interaction usable and show bounded warning. |
| Invalid State | Normalize for projection; warn; do not erase stored value. |
| Restore defaults | Reset known keys and local roots immediately; preserve unknown State/cache keys. |
| Collapsed project/group | No delegates or phantom row spacing for collapsed content. |
| Snapshot progress is `null` | Do not render or infer a percentage. |

### 5. Good / Base / Bad Cases

- Good: sibling widgets converge after `pluginStateChanged`; reset removes
  only the five known UI keys.
- Base: a synchronous write failure leaves the clicked choice visible locally
  and reports recovery copy.
- Bad: namespace-wide State clearing, unprimed key removal, or a hidden
  Repeater whose delegates remain in the parent layout.

### 6. Tests Required

- Pure/static tests assert migration/defaults, State caps, null progress,
  warning filtering, key-scoped reset/cache priming, and empty-model collapse.
- Offscreen/live tests cover toggles, reset, two-widget convergence, focus,
  scroll, and restart persistence; unavailable host gates remain unverified.

### 7. Wrong vs Correct

```qml
// Wrong: may be a no-op when the State cache is unloaded.
pluginService.removePluginStateKey(pluginId, key)

// Correct: load first, then remove only the requested key.
pluginService.loadPluginState(pluginId, key, "")
pluginService.removePluginStateKey(pluginId, key)
```

```qml
// Wrong: delegate visibility is not controlled by the Repeater item.
Repeater { visible: !collapsed; model: items }

// Correct: the model owns collapse and layout contribution.
Repeater { model: collapsed ? [] : items }
```
