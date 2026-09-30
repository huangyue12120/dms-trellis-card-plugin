# Desktop View Modes Design

## Per-placement preference

Use `DesktopPluginComponent.instanceConfig.viewMode`, normalized to `overview`, `tasks`, or `health`, with `overview` as default. Add a native Selection setting to the existing Desktop-instance Settings branch and persist through `SettingsData.updateDesktopWidgetInstanceConfig(instanceId, { viewMode })`. Do not use global plugin settings or DMS UI State for this preference.

## Projection and rendering

- Reuse the shared Health projection and existing `makeDesktopProjection`; no second parser or scan.
- Overview preserves the current combined project/active-task layout and adds a compact health summary.
- Tasks shows active tasks grouped by Snapshot project order with title, display state, priority, and active-session count. Degraded status remains a single compact banner.
- Health shows project health counts, last successful discovery, last-good state, and grouped incidents. It omits the full task list; diagnostics details remain in plugin-wide Settings.
- Each mode uses one vertical scroll region, existing minimum size and resize behavior, DMS semantic colors/icons, and translated English/Chinese copy.
- A mode change only changes the projection; all placements retain the same shared Snapshot/global warnings/one daemon.

## Validation

Pure/static tests cover mode normalization/default, independent instance config keys, no rescan/extra global state, same Snapshot, empty states, and health recovery. Offscreen/load checks are reported separately from real DMS restart, locale, and resize evidence.
