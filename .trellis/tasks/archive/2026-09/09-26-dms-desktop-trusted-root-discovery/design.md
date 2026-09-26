# Technical design

## Boundaries

This is a plugin-only maintenance change with two child implementation targets. The parent task coordinates their contract and final integration. DMS 1.6.2 is the locally inspected host API baseline; do not modify installed DMS source or the user's plugin installation.

## Data flow and contracts

### Desktop instance settings

The plugin manifest has one `settings` component. DMS uses that component both for plugin settings and as the desktop widget's custom instance-settings component. DMS injects `instanceId`, `instanceData`, and an instance-scoped `pluginService` when those properties exist. The current component assumes global settings context, so the implementation must explicitly distinguish an empty `instanceId` (plugin-wide settings) from a desktop instance.

In desktop instance context, render only the instance settings surface. Use DMS's `SettingsDisplayPicker` semantics and `displayPreferences` config, defaulting to `["all"]`; persist changes through the instance config API. Preserve the generic DMS position and size reset actions. Do not run global settings initialization, restore-defaults logic, state loading, or global data listeners against the instance-scoped service. In plugin-wide Settings context, retain current behavior and values unchanged.

### Mounted folder picker

Keep DMS's existing `FileBrowserModal` and current selection callback. Add a picker-local quick-access location for the filesystem root by setting the modal's exposed content `quickAccessLocations` when its content becomes available. This gives the user a deliberate route to `/run/media` and `/mnt` while leaving the chooser initially at its existing last path/home behavior. Selecting a directory remains the only action that calls the existing `addScanRoot`; no root is added by opening or browsing the picker.

The scanner continues to canonicalize only configured roots and apply its existing depth/result caps. The new shortcut does not scan `/` or `/proc` unless the user explicitly chooses such a root.

### Reserved archive directory

The live-task `find` enumerates only direct directories under `.trellis/tasks`, but includes the reserved `archive` directory. Exclude that exact reserved child from the live enumeration before calling `_discoverTask`. Keep `resolveTaskDir` unchanged as a defense-in-depth boundary, and keep the archive-specific scanner as the only route into historical records.

## Compatibility and migration

- No manifest or stored plugin setting migration is required.
- DMS already initializes desktop instance config with `displayPreferences: ["all"]`; keep that default and persist preferences per instance.
- Trusted roots retain their current format, cap, legacy fallback, and explicit-empty semantics.
- The archive change affects only discovery candidates; it does not alter archive paths, task IDs, or project files.
- Codex discovery remains excluded per the user's decision and the existing trusted-root policy.

## Risks and acceptance evidence

- DMS's custom settings loader currently sends the same QML component two different services. A missed global listener or default-setting initializer could write plugin keys into a desktop instance config. Review every load/save/listener path in `TrellisSettings.qml` and exercise both contexts on DMS 1.6.2.
- The root quick-access entry relies on DMS's public `FileBrowserModal.content` alias and `FileBrowserContent.quickAccessLocations` property, confirmed in the installed DMS source. Verify it appears after modal creation and navigates correctly to both mount prefixes.
- Static checks can establish the candidate filter and QML wiring but cannot prove live display selection, mount permissions, or actual filesystem navigation. Record runtime results separately.

## Rollback

Revert only the plugin settings/picker and live-task enumeration changes. No Trellis data is written. DMS may retain ordinary per-instance `displayPreferences` values; the plugin must tolerate DMS's saved instance config after rollback.
