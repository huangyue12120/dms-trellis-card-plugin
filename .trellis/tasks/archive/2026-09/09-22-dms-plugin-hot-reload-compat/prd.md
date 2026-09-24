# Fix DMS plugin hot-reload compatibility

## Goal

After a user replaces the installed `TrellisDms` directory and asks DMS to
reload the plugin, the current v0.5 component set must load instead of leaving
the previous component generation active. Settings must show the v0.5 options,
the bar widget must use the selected compact projection, and clicking it must
continue to open the read-only popout.

The fix is for the plugin source and its reload-compatible resource references;
it must not modify DMS itself or write to the user's installed plugin copy.

## Confirmed facts

- The workspace and installed plugin copies currently have identical hashes for
  `plugin.json`, all three QML surfaces, and the two v0.5 helper modules.
- The installed manifest is v0.5.0 and exposes daemon, widget, and settings
  surfaces.
- DMS 1.6.2 uses `PluginService.reloadPlugin()` to unload the plugin and then
  call `loadPlugin(pluginId, true)`. The latter appends `?t=<timestamp>` to each
  component QML URL before `Qt.createComponent`.
- The observed reload error is a QML/Qt component error while resolving the
  relative `lib/trellisDiscovery.js` import: `File name case mismatch`. DMS
  retains the previous loaded generation after this failure, which explains
  the stale v0.4 settings/widget and missing popout observed by the user.
- The source filenames and import spellings match on disk. Existing Node
  contract tests and the offscreen component harness pass, so this is a
  runtime hot-reload/cache compatibility defect rather than a v0.5 data or UI
  contract failure.
- The plugin's v0.5 behavior is already accepted: six display modes, bounded
  read-only popout, trusted scan roots, remembered-project output cache, legacy
  `projectRoot` fallback, and read-only Trellis access must remain unchanged.

## Requirements

### R1. Reload-safe helper resources

Make the plugin's relative JavaScript helper resource names deterministic for
the DMS cache-busting reload path. Update every QML import and contract-test
fixture reference together; do not leave aliases or duplicate files that could
make the loader choose different casing.

### R2. Preserve v0.5 behavior and compatibility

The change must not alter the Snapshot schema, discovery trust boundary,
display-mode semantics, popout bounds, warning rendering, or settings storage.
The legacy `projectRoot` setting remains readable when `scanRoots` is absent;
an explicit empty `scanRoots` remains authoritative.

### R3. Prevent stale-generation success claims

When reload is exercised, the observable result must be the newly loaded v0.5
components. A failed component load must be reported as a failed validation,
not treated as success merely because DMS kept an older generation alive.

### R4. Keep the change scoped and safe

Do not edit `/home/yue/.config/DankMaterialShell/plugins/TrellisDms`, DMS/
Quickshell sources, Trellis project files, or user state. Do not add a network,
hook, socket, write, or new runtime dependency.

## Acceptance criteria

- [x] All relative JS imports resolve to an existing, uniquely named file in a
  case-sensitive path check; no stale v0.5 import path remains in QML/tests.
- [x] `node tests/test_trellis_contract.mjs` passes after the resource rename and
  still covers v0.5 projection/discovery contracts.
- [x] The manifest remains valid at version `0.5.0`, and static source checks
  still prove one snapshot publisher, widget read-only boundaries, and the
  existing v0.5 settings/popout contracts.
- [ ] An offscreen QML load/type check instantiates daemon, settings, and widget
  components using the renamed helper files without a component error.
- [x] In a real DMS 1.6.2 session, replacing the plugin directory and invoking
  plugin reload succeeds without `File name case mismatch`; the settings page
  shows `Bar display` and trusted-folder controls, the bar uses the configured
  mode, and clicking it opens the popout.
- [x] Reloading more than once does not produce duplicate daemon instances,
  timers, watchers, or global-var publishers; the existing generation cleanup
  contract remains intact.
- [x] If the live DMS process is unavailable, the report explicitly marks the
  live reload/click criteria unverified rather than claiming completion.

Final live validation on 2026-09-22 confirmed that the installed plugin copy
matches the workspace, repeated DMS 1.6.2 unload/load cycles complete with one
daemon load per cycle and no later `File name case mismatch`, and clicking the
bar opens the current read-only popout. Standalone `qmllint` remains unavailable.

## Out of scope

- Redesigning the v0.5 UI or adding new display modes/popout actions.
- Changing DMS `PluginService`, Qt, Quickshell, or the plugin installation
  workflow.
- Making remembered projects authoritative scan roots or removing the legacy
  `projectRoot` migration path.
- Claiming a fix based only on matching workspace/install hashes or a cold
  start; the reload path is the defect under test.

## Risks and deferred technical checks

- The minimal candidate is to normalize the two v0.5 helper filenames and all
  references to lowercase, invalidating the problematic mixed-case cache keys.
  If a real reload reports the same error for an older helper, the implementation
  may apply the same mechanical normalization to that helper and its references
  before final validation; this does not change the public plugin contract.
- DMS's post-failure behavior (retaining an older generation) is host behavior;
  the plugin can only ensure its component graph is reloadable and that tests do
  not mistake retained stale UI for a successful load.
