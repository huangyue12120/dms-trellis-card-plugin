# DMS hot-reload compatibility design

## Boundary and failure mechanism

The host owns component creation. `PluginService.reloadPlugin()` first destroys
the loaded plugin, then calls `loadPlugin(pluginId, true)`. In DMS 1.6.2 the
cache-busting branch appends `?t=<timestamp>` to each QML component URL before
`Qt.createComponent` resolves that component's relative JavaScript imports.
The observed Qt 6.11.2 error is:

```text
Script .../lib/trellisDiscovery.js unavailable
.../trellisDiscovery.js: File name case mismatch
```

The workspace and installed files have matching bytes and exact directory
entries, and a cold/offscreen load succeeds. Therefore the change targets the
resource names presented to the reload/cache path; it does not change daemon
logic or the v0.5 projection contract.

## Resource graph

```text
plugin.json
  ├─ TrellisDaemon.qml  ── trellisPaths.js / trellisParser.js /
  │                        trellisWatch.js / trellisDiscovery.js
  ├─ TrellisWidget.qml  ── trellisProjection.js
  └─ TrellisSettings.qml ─ trellisDiscovery.js / trellisProjection.js /
                            trellisWatch.js
```

All three QML surfaces are loaded by the same DMS cache-busting path. The pure
JavaScript modules remain the only owners of discovery/projection policy; QML
continues to render their view models and the daemon continues to be the sole
snapshot publisher.

## Proposed change

1. Normalize the two v0.5 helper filenames to lowercase:
   `trellisDiscovery.js` → `trellisdiscovery.js` and
   `trellisProjection.js` → `trellisprojection.js`.
2. Update every QML import and Node contract-test path to those exact names.
3. Add a case-sensitive resource/import assertion so a future rename cannot
   leave a loader-visible mismatch. Do not keep mixed-case copies or aliases:
   duplicate resources would preserve ambiguous cache keys.
4. Leave the v0.3/v0.4 helper names unchanged initially because they have not
   produced this reload error and changing them would enlarge the migration.
   If the live reload moves the same error to one of those existing helpers,
   apply the same mechanical lowercase normalization to the affected helper(s)
   and references before accepting the fix.

This is an internal resource migration. It changes no manifest field, setting
key, snapshot field, persisted path, permission, or public plugin behavior.

## Compatibility and rollback

- Existing settings (`displayMode`, `scanRoots`, `projectRoot`, refresh token,
  topology interval, and DMS state summaries) remain untouched.
- No installed copy is edited by the implementation. The user can copy the
  complete workspace `TrellisDms` directory after the source checks pass.
- Rollback is mechanical: restore the original two filenames and their import
  strings together. No user data migration is required.
- A cold start is not sufficient evidence. The decisive check must exercise
  DMS's unload → cache-busted component-load path and verify the new v0.5
  settings/widget surfaces afterward.

## Validation design

| Layer | Check | Expected evidence |
|---|---|---|
| Resource graph | Enumerate imports and resolve each relative path with exact case | Every import has one existing target; no old names remain |
| Pure contracts | `node tests/test_trellis_contract.mjs` | Existing v0.3–v0.5 assertions pass |
| Static QML | Manifest/source checks and the existing offscreen type/load harness | Daemon, settings, and widget components load without errors |
| Host reload | DMS 1.6.2 plugin reload after replacing the complete plugin directory | No `File name case mismatch`; v0.5 settings and popout are present |
| Lifecycle | Repeat reload and inspect DMS/plugin logs | One daemon/global publisher, no stale/duplicate generation |

If DMS or its running Wayland session is unavailable, report host-reload and
click criteria as unverified; do not substitute a cold start for them.
