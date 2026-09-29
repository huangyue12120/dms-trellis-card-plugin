# About / Diagnostics Design

## Entry and data source

Add the About / Diagnostics section only to the plugin-wide Settings branch of `TrellisSettings.qml`; do not render it in Desktop-instance Settings and do not add a manifest surface or Launcher route. Consume the shared Snapshot, `makeHealthProjection`, plugin metadata from `PluginService.availablePlugins[pluginId]`, and Qt's `Qt.version`. Show DMS/Quickshell as unavailable unless a supported QML API is confirmed.

Show declared manifest capabilities/surfaces and whether the plugin is loaded. Do not imply which Desktop placements are currently visible.

## Redacted report

Build a bounded plain-text allowlist containing plugin/host version facts, Snapshot source/freshness timestamps, project/task/session counts, warning/error/incident counts, declared capabilities, and incident codes grouped by project ordinal. Do not include project display names, project IDs, paths/roots, raw warning messages/reasons, Markdown, task/session content, or environment variables. Do not serialize the Snapshot or `detailResponse` directly.

The Copy button invokes the locally verified `dms cl copy <text>` through an argv-only one-shot process after an explicit click. Use bounded success/failure feedback; do not auto-copy or upload. The user-facing Diagnostics panel may show project display names and bounded raw warning details, but the copied text stays on the allowlist.

## Validation

Pure tests must assert all excluded data is absent even when a warning message, project name, internal ID, or archive detail contains a path or secret-like string. Verify unknown versions stay `unavailable`, both normal/degraded views render, and multiple projects retain distinct health attribution. English and Chinese strings use existing `I18n.trFor` localization.
