# Hot-reload runtime evidence

## Host source inspected

The installed DMS source is `/usr/share/quickshell/dms/Services/PluginService.qml`
on the current machine. The relevant implementation is:

- `loadPlugin(pluginId, bustCache)` builds `file://` component URLs and, when
  `bustCache` is true, appends `?t=` plus `Date.now()` before
  `Qt.createComponent` (lines 434–483).
- `reloadPlugin(pluginId)` unloads the loaded plugin and calls
  `loadPlugin(pluginId, true)` (lines 877–884).
- A component error calls `pluginLoadFailed` and returns `false`; the host's
  prior visible surfaces can therefore remain observable even though the new
  generation did not load.

The observed environment is DMS 1.6.2, Quickshell 0.3.1, and Qt 6.11.2.

## Plugin evidence

The workspace and `/home/yue/.config/DankMaterialShell/plugins/TrellisDms`
copies have matching SHA-256 values for the manifest, all QML surfaces,
`lib/trellisDiscovery.js`, and `lib/trellisProjection.js`. Directory entries
and import spellings also match exactly. The manifest is v0.5.0.

The DMS journal reported during a real reload:

```text
component error trellisDms daemon .../TrellisDaemon.qml?t=...
Script .../lib/trellisDiscovery.js unavailable
.../lib/trellisDiscovery.js: File name case mismatch
```

The existing Node contract test and the recorded offscreen DMS component/type
harness pass on a cold load. This separates the defect from the v0.5 data/UI
contracts and points to the cache-busted relative-resource path.

## Limits

The current shell session does not expose a running default Quickshell config,
so host reload/click behavior is not re-run during planning. It remains a
required post-implementation acceptance gate. No installed plugin or DMS file
is modified by this task.
