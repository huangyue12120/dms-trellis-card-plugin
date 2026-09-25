# v0.9 platform and runtime evidence

Captured 2026-09-24 from the repository, archived research, and the locally installed DMS 1.6.2 API tree.

## Baseline

- The v0.8.3 RC record names the selected target as Fedora 44, Wayland, niri 26.04, DMS 1.6.2, Quickshell 0.3.1, Qt 6.11.2, and Trellis 0.6.17.
- The RC's DMS load/reload, multi-bar/screen, popout, disable, and cleanup checks were reported by the user. They were not independently replayed in the recorded development shell. `qmllint`/`qmlformat` were unavailable there.
- Current manifest version is `0.8.0`; it exposes composite daemon/widget and settings surfaces with `settings_read`, `settings_write`, and `process`, and no network permission.

## Desktop surface

- `/usr/share/quickshell/dms/PLUGINS/plugin-schema.json` supports an optional `components.desktop` QML path in a composite manifest.
- The Desktop Plugin contract injects `pluginService`, `pluginId`, `editMode`, `widgetWidth`, and `widgetHeight`; plugins may declare minimum dimensions and use `requestResize`/`clearResize`.
- `DesktopWidgetRegistry.qml` registers discovered plugin desktop components as available widgets. It assigns plugin widgets a 200×200 default size; the user controls placement and size. A desktop component is not a second daemon or automatically placed surface.
- The composite desktop example is a QML projection and uses the same DMS Theme system. The current project has no desktop QML component.

## Localization

- DMS 1.6.2's plugin guide supports `I18n.trFor("trellisDms", "English source")` and per-plugin JSON translation files under `TrellisDms/translations/`.
- DMS loads the file matching the active locale and reloads translations on locale changes. Lookup falls through the plugin translation, the global DMS catalog, then the English source term. English needs no `en.json`.
- `PluginService.qml` calls `I18n.localeCandidates()`, loads `translations/<candidate>.json`, and registers the parsed table. The exact introduction version of `trFor` was not established from local history; 1.6.2 is the locally inspected API baseline.

## Launcher and navigation

- The installed manifest schema supports `components.launcher` and requires a root `trigger` for that surface.
- The launcher contract passes the query to `getItems(query)` and invokes `executeItem(item)` for a chosen result. Launcher components are created on first launcher use, not at shell startup.
- `AppSearchService.qml` calls those methods and catches plugin errors. `BarWidgetService.triggerWidgetPopout(pluginId)` can open the registered plugin widget on the focused screen, and returns `false` when no widget is present.
- `PluginService.qml` exposes key-scoped `loadPluginState`, `savePluginState`, and `removePluginStateKey`; state changes notify widgets through `pluginStateChanged`. The existing Trellis widget already understands `selectedProjectId` and project-qualified `pinnedTaskId`.
- This supports the approved navigation plan without reading Trellis files in the launcher. If the bar widget is not placed, the launcher can still save the selection, but no popout is available.

## Agent activity availability

- Archived v0.1 research inspected the Linux `payprays/codeIsland-dms` reference at commit `f6143cecc61c5edd9c31bf4862ce48423fbdc975` on 2026-09-17. It describes a newline-delimited Unix socket protocol with `snapshot.full`/`snapshot.patch`, but calls its Linux daemon a Phase 0/reference skeleton; runtime deployment and stability were not verified.
- That research records no daemon in the installed runtime at the time. A fresh check in this planning shell found `XDG_RUNTIME_DIR` set, no `codeislandd.sock` at the standard or UID fallback path, and no `codeislandd` executable on `PATH`.
- The current-shell check does not prove whether the user's target graphical session has a running daemon. The task must report that limitation and must not install a daemon or hooks to make the check pass.
- The macOS `rifqiakrm/code-island` checkout is GPLv3/macOS-only and remains a conceptual reference, not an implementation basis.
