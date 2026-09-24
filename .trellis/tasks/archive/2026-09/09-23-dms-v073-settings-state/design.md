# v0.7.3 Settings and State design

## Settings contract

`TrellisSettings.qml` remains the only user-settings surface. Keep the current
trusted-root and interval controls, then add:

| Key | Type/default | Effect |
|---|---|---|
| `pillMode` | string/`auto` | projection mode |
| `displayMode` | legacy string | migration source only when pillMode absent |
| `showProgress` | bool/`true` | reveal numeric progress only |
| `showArchive` | bool/`true` | show archive entry/index |
| `versionWarning` | bool/`true` | show/hide version compatibility copy |

Use the existing DMS setting controls so values save through
`savePluginData` and trigger the host's plugin-data signal. On settings load,
normalize mode and perform a one-time alias migration without changing a
valid existing selection. The daemon continues to read `scanRoots`,
`topologyInterval`, and `refreshToken`; visibility settings are widget-only and
must not alter the trust boundary.

Restore defaults writes safe values for these keys and an explicit empty
`scanRoots` (plus removes legacy `projectRoot` only if the host provides a
key-scoped removal API). It never calls `clearPluginState`, never clears
`discoveredProjects`, and surfaces an error if a required DMS API is absent.

## State contract

```text
pinnedTaskId          JSON project/task token (existing)
selectedProjectId     string (existing)
collapsedProjectIds   string[] ≤ 32 unique IDs
collapsedTaskGroups   string[] ≤ 128 `projectId/groupKey` tokens
selectedArchiveMonth  empty or `YYYY-MM`
```

The widget owns local normalization and persistence. A single `loadPreferenceState`
path loads all keys, preserving unknown keys in DMS State. User actions update
the local property first; `persistPreference` calls only `savePluginState` or
`removePluginStateKey` for the changed key. Sibling widgets reload all values
on `pluginStateChanged`. Invalid values set a warning and fall back for the
current projection without erasing the stored value. Restore defaults removes
only the five UI keys above (pin/filter included).

## Projection and recovery integration

- Pass normalized visibility settings to the pure projection or gate rendering
  in QML; `showProgress` checks `typeof progress === "number"` and the current
  Snapshot remains null.
- Filter version warnings at the view layer only when `versionWarning` is
  false; the daemon still retains the compatibility warning for diagnostics.
- Keep archive/detail response state separate from live Snapshot state. Hiding
  archive does not delete an existing request response or State month; showing
  it again can request a fresh bounded index.
- Keep refresh pending until a newer, non-degraded live Snapshot as already
  specified. Settings or State failures have separate copy and do not clear
  healthy live/archive/detail facts.

## UI and accessibility

Add labelled native toggles/buttons, an explicit “Restore defaults” action,
and bounded explanatory/error text to the existing Settings column. Keep
native DMS focus/keyboard behavior, semantic Theme colors, 40-pixel controls,
one popout scroll region, and no animation-dependent semantics.

## Compatibility and rollback

Existing v0.6 settings and State remain readable. New keys are additive and
ignored by older widgets. Rollback restores `displayMode` reads and two-key
State behavior; inert v0.7 keys may remain in DMS State without touching
Trellis files.
