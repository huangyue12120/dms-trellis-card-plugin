# v1.1 Runtime and API Evidence

Observed locally on 2026-09-29. These findings describe repository/runtime source; they do not claim DMS host acceptance.

## Snapshot and health inputs

- `TrellisDms/lib/trellisParser.js:353-370` builds schema-version-1 Snapshots with `generatedAt`, `projects`, primary IDs, and global `warnings`; it has no scan/freshness metadata.
- `TrellisDms/TrellisDaemon.qml:1615-1620` stamps `generatedAt` at publication. `_maybeFinish` at `:1765-1799` replaces all project inputs with matching-root `lastGoodInputs` on a degraded scan and adds the global `last_good_snapshot` warning.
- `TrellisDms/TrellisDaemon.qml:301-319` collects project warnings, but `TrellisDms/lib/trellisParser.js:267-350` flattens them into the global warning list. Most project warning objects currently lack `projectId`; discovery failures for tasks/sessions are also scan-level warnings. A project/root field must be attached before aggregation to support reliable grouping.
- Existing discovery warning sources include `task_discovery_failed`, `session_discovery_failed`, `archive_unavailable`, `archive_path_rejected`, `project_discovery_failed`, `root_unavailable`, and bounded watcher/reload/project limit warnings (`TrellisDaemon.qml:1100-1480`, `:1700-1789`). Parser record errors include `task_read_failed`, `task_data_invalid`, `session_read_failed`, `session_data_invalid`, `malformed_pointer`, and `malformed_json` (`trellisParser.js:72-126`, `:224-239`).
- `TrellisDms/lib/trellisprojection.js:692-771` already creates a pure Desktop projection from the shared Snapshot, preserves all loaded projects/active tasks, classifies degraded warning codes, and caps warning details. A Health incident projection can extend this shared helper rather than add a second parser.

## Archive failures

- Archive summaries are intentionally lazy and begin as `{ loaded: false, taskCount: null }` (`trellisParser.js:341-344`). Archive requests already run through the daemon's existing `detailRequest` / `detailResponse` plugin globals.
- `_archiveResponse` includes `kind`, `status`, and `projectId`, but no Markdown body (`TrellisDaemon.qml:552-566`). Archive-index/page failures are emitted with structured codes by `_publishArchiveError` (`:569-575`, `:822-845`). The same `detailResponse` channel also carries task Markdown responses, so projections must branch on archive `kind` and ignore `content`, task rows, and all unneeded fields.
- Desktop currently reads only the `snapshot` global; it can subscribe to the existing `detailResponse` global without adding a reader, process, timer, or watcher. Only archive errors from the most recent shared response can be projected; successful replacement/clear/restart removes this transient incident.

## DMS settings, manifest metadata, and clipboard

- Per-placement config is already supported through `SettingsData.updateDesktopWidgetInstanceConfig(instanceId, patch)` and `instanceData.config` (`TrellisSettings.qml:695-704`; `docs/ui-component-contract.md:142-158`). This is the supported location for `viewMode`; it is independent for each Desktop placement.
- The DMS `PluginService.availablePlugins[pluginId]` entry copies manifest fields, including `version` and `capabilities` (`/usr/share/quickshell/dms/Services/PluginService.qml:334-390`). `isPluginLoaded(pluginId)` is also exposed (`:757-765`). Use these values for plugin version, loaded state, and declared surfaces rather than duplicating manifest constants.
- The local DMS plugin QML API search found no supported property for the running DMS or Quickshell version. Show `unavailable` unless an explicit API is confirmed during implementation. Qt's built-in `Qt.version` can supply the Qt version.
- DMS provides `dms cl copy [text]` as a text-copy CLI command; `dms cl copy --help` reports this contract locally. A button-triggered argv process is compatible with the plugin's existing `process` permission. Do not use shell source, and pass only a bounded redacted summary. This help inspection did not write to the clipboard.
- Warning `path`/`root`/`reason` values and Snapshot project IDs may contain absolute paths (`TrellisDaemon.qml:1134`, `:1448`, `:1567`, `:1767`; `trellisParser.js:331-337`). The export serializer must use an allowlist of codes and counts, never raw messages, paths, project IDs, or project names.

## Existing UX and verification contracts

- The accepted design baseline is native DMS Material styling, semantic Theme values, Material Symbols, low motion, bounded explanatory copy, and a single vertical Desktop scroll region (`docs/ui-ux-spec.md:1-23`; `docs/ui-component-contract.md:243-278`). The existing v0.9.1 Desktop and Launcher each have separate approved UI Gate records; v1.1 changes require review of the new modes and Settings section.
- The contract test entry point is `node tests/test_trellis_contract.mjs`; it covers pure projection and static repository assertions. No tests were run during planning.
- Real DMS/Wayland/restart behavior remains a distinct host acceptance gate; static tests do not establish it.
