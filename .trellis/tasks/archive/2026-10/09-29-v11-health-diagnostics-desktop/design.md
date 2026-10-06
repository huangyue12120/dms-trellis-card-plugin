# v1.1 Integration Design

## Boundaries

- `TrellisDaemon.qml` remains the only Trellis file collector and publisher.
- `trellisParser.js` continues to own the Snapshot contract; `trellisprojection.js` owns pure user-facing incidents and Desktop projections.
- Settings and Desktop consume the shared Snapshot/runtime data. Neither reads `.trellis/` or starts a scan.
- Keep Trellis read-only, permissions unchanged, and agent/network/telemetry integrations out of scope.

## Data flow and contracts

1. The daemon publishes additive Snapshot schema version 2 metadata: `scanStartedAt`, `lastSuccessfulDiscoveryAt`, `snapshotIsCurrent`, `lastGoodFallbackActive`, plus per-project `lastSuccessfulReadAt`. `generatedAt` remains publication time and is not described as last successful discovery.
2. Preserve every existing warning/error. Attach an internal `projectId` or root scope to project-specific discovery warnings before parser aggregation so the projection can group by source without matching message strings. Never display these IDs as paths.
3. Add a pure Health Incident projection that consumes Snapshot warnings/errors and, when present, the existing archive `detailResponse`. Group by project/root and root cause; retain contributing raw warning codes. Treat `last_good_snapshot` as fallback metadata, not a second incident. Archive-only failures stay scoped to archive; core live-data failures determine degraded project health.
4. Accept schema-1 Snapshots during plugin reload/compatibility transitions and normalize absent runtime metadata as unavailable. Newly published Snapshots use schema 2. Preserve all schema-1 fields and `progress: null`.
5. Project the same Health output into the Desktop Health mode and plugin-wide Diagnostics. Desktop Overview and Tasks remain projections of the same Snapshot. Per-placement `viewMode` lives in DMS desktop instance config and defaults to Overview.
6. Diagnostics obtains plugin version/capabilities from `PluginService.availablePlugins[pluginId]`, loaded state from `isPluginLoaded`, and Qt version from `Qt.version`. Show unavailable values for host versions without a verified QML API.
7. Build copied diagnostics with an allowlist: stable codes, counts, bounded version facts, state, and project ordinals only. Omit project names/IDs, paths, raw warning messages, task/session content, and arbitrary environment data. A user-initiated argv call to `dms cl copy <text>` uses the existing `process` permission; no shell is used.

## UI decisions

- `ui-gate.md` is the reviewable proposal for the v1.1 Desktop modes and Settings Diagnostics section. The selected Diagnostics entry is the existing plugin-wide Settings page; do not add a Launcher route or manifest capability.
- Follow the already approved DMS Material baseline: semantic Theme colors, Material Symbols, bounded labels, one vertical scroll region, low motion, and explicit loading/healthy/degraded states.
- Do not begin final QML changes for the new controls/layout until the user approves the proposal with the parent planning summary.

## Compatibility, privacy, and rollback

- No on-disk Trellis schema changes, migrations, permissions, or stored user data are introduced.
- Keep schema-1 projection compatibility and treat absent metadata as unavailable.
- Archive failures come from the existing `detailResponse` channel. Only `kind`, `status`, `projectId`, warning codes, and bounded safe fields are inspected; Markdown/detail `content` and archive task records never enter Diagnostics.
- If a release candidate fails host acceptance, leave the package at its prior version and record the failed/unverified gate. Reverting the v1.1 source changes returns the existing schema-1 UI contract.

## Work sequence

See the parent `implement.md` and child artifacts. Order is 1.1.1, 1.1.2, 1.1.3, then host acceptance/release 1.1.4. The last task is a release gate, not a place to add features.
