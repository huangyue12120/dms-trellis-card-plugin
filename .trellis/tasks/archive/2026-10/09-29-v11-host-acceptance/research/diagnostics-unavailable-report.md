# Research: Diagnostics report fields unavailable

- Query: Explain why the copied diagnostics show plugin/host metadata and Snapshot fields as unavailable despite `snapshot.source=daemon`; determine whether a healthy empty Snapshot could produce the report; identify relevant test coverage and a narrow fix.
- Scope: internal
- Date: 2026-10-06

## Findings

The report combines two independent QML data-access failures:

1. **Snapshot lookup has no plugin ID in its immediate parent.** DMS 1.6.2 `PluginGlobalVar.qml` reads `parent?.pluginId` (lines 11–16) and returns its default when that value or the corresponding global-var map is absent. In `TrellisSettings.qml`, both diagnostics globals are children of `globalSettingsView`, a `Column` that does not define `pluginId` (lines 391–392, 470–481). Therefore the globals resolve to their declared `defaultValue: null`, regardless of the daemon having published a Snapshot. `TrellisWidget.qml` demonstrates the working shape: its `PluginGlobalVar` objects are children of the root plugin component, which has `pluginId` (lines 793–809).

2. **The metadata binding refers to an unimported singleton.** `TrellisSettings.qml` imports `qs.Common`, `qs.Widgets`, and `qs.Modules.Plugins`, but not `qs.Services` (lines 1–10). Its diagnostics binding directly evaluates `PluginService.availablePlugins` and `PluginService.isPluginLoaded` (lines 395–405). DMS's `PluginListItem` instead injects the service on the settings root as `item.pluginService = PluginService` (DMS 1.6.2 `Modules/Settings/PluginListItem.qml`, lines 417–420); the `PluginSettings` base type exposes that `pluginService` property (DMS `Modules/Plugins/PluginSettings.qml`, line 12 onward). Thus this settings component should use `root.pluginService` or explicitly import `qs.Services`. With the current unresolved reference, the metadata binding cannot return its object, so projection inputs for plugin version/load state/capabilities/surfaces/Qt version are absent. The repo contract test only matches the text `PluginService.availablePlugins` / `Qt.version` (tests `test_trellis_contract.mjs`, lines 1094–1103); it does not check QML imports or service injection.

`TrellisProjection.makeDiagnosticsProjection` defaults missing metadata to `{}` (lines 888–899), formats absent plugin version/Qt as `unavailable`, absent loaded state as `unavailable`, and empty sanitized lists as `unavailable` (lines 892–899, 944–969). DMS and Quickshell versions are always hardcoded to `unavailable` in the report and returned projection (lines 967–969, 1010–1015); this part of the output is intentional under the current implementation.

The exact `snapshot.state=unavailable` and `snapshot.schema_version=unavailable` mean `_snapshotFacts(snapshot).ready` was false: readiness requires schema version 1 or 2 and `projects` and `warnings` arrays (`trellisprojection.js`, lines 396–400). A null global var from the missing parent `pluginId` satisfies this. Counts then default to zero because the unavailable facts contain empty project/warning arrays (lines 400–428 and 900–903). `snapshot.source=daemon` is a literal report line (line 970), not a check that a daemon Snapshot was read or is live.

A healthy empty daemon Snapshot **cannot** produce this exact Snapshot section. The daemon publishes `TrellisParser.makeSnapshot(...)` via the `snapshot` global (`TrellisDaemon.qml`, lines 1719–1729); `buildSnapshot` always returns schema version 2, generated time, runtime metadata, empty-or-populated `projects`, and `warnings` arrays (`trellisParser.js`, lines 373–400). An empty valid Snapshot may have zero counts, but projection readiness would be true and schema version would be 2; freshness would be `current` when valid runtime facts are available, or `freshness_unavailable` if those facts are not. Existing tests cover valid populated, fallback, and schema-1 diagnostics (`tests/test_trellis_contract.mjs`, lines 2424–2537), but do not exercise a valid empty Snapshot in the diagnostics projection or assert the QML `PluginGlobalVar` parent-ID contract.

**Narrow fix recommendation:** give `globalSettingsView` a `pluginId` binding equal to `root.pluginId` (or place these `PluginGlobalVar`s directly under the plugin settings root); change diagnostics metadata lookup to the injected `root.pluginService` (or explicitly import `qs.Services`). Add focused contract coverage for the parent plugin ID/service source and a valid empty diagnostics Snapshot. These two changes address distinct fields: the first Snapshot state/counts/timestamps, the second plugin metadata and `host.qt`.

## Files found

- `TrellisDms/TrellisSettings.qml` — diagnostics metadata binding and Snapshot/detail `PluginGlobalVar` objects.
- `TrellisDms/TrellisWidget.qml` — working plugin-root-parent examples of `PluginGlobalVar`.
- `TrellisDms/lib/trellisprojection.js` — input readiness, unavailable defaults, and report formatting.
- `TrellisDms/TrellisDaemon.qml` — publishes the shared daemon Snapshot.
- `TrellisDms/lib/trellisParser.js` — Snapshot schema-2 shape, including empty arrays.
- `TrellisDms/plugin.json` — plugin manifest version, capabilities, and component surfaces supplied to DMS.
- `tests/test_trellis_contract.mjs` — current static QML assertions and projection fixtures.
- `.trellis/spec/frontend/state-matrix-contract.md` — diagnostics source and validation contract.
- `/usr/share/quickshell/dms/Widgets/PluginGlobalVar.qml` — DMS 1.6.2 parent-based plugin ID lookup.
- `/usr/share/quickshell/dms/Modules/Settings/PluginListItem.qml` — injects `PluginService` as `item.pluginService` when loading plugin settings.
- `/usr/share/quickshell/dms/Modules/Plugins/PluginSettings.qml` — exposes injected `pluginService` property.
- `/usr/share/quickshell/dms/Services/PluginService.qml` — copies manifest properties into `availablePlugins`, derives surface list, and records loaded state.

## Caveats / Not Found

- This was a read-only source trace; no active DMS/QML host was used to capture the QML binding warnings or reproduce the copied report. The two failures follow directly from the inspected DMS 1.6.2 source contracts and current plugin QML.
- DMS and Quickshell version values are not currently sourced by this plugin; the projection deliberately emits `unavailable` for both.
