# Technical design

## Settings component context

DMS 1.6.2 registers `manifest.settings` as the plugin's desktop `settingsComponent`. The desktop settings loader injects `instanceId`, `instanceData`, and an instance-scoped `pluginService` only when the loaded component declares those properties. `TrellisSettings.qml` must declare the instance properties and branch on instance context.

The global plugin settings view remains the existing trusted-root/display-mode/refresh UI. In desktop instance context, render only the desktop instance controls and skip all plugin-wide load, migration, restore-defaults, and State flows. Use DMS's `SettingsDisplayPicker` over `instanceData.config.displayPreferences`, defaulting to `["all"]`, and write via the DMS desktop instance config API. Preserve the generic position/size reset actions. Keep DMS's injected `pluginService` available only for the appropriate context and avoid saving plugin setting keys through the instance-scoped adapter.

## Mounted-root navigation

Continue using the DMS `FileBrowserModal` already used by Settings. Its `content` alias exposes the `FileBrowserContent` object, whose `quickAccessLocations` property is mutable. On content creation, idempotently add a localized `Computer` shortcut whose path is `/`. The modal keeps its existing home/last-path default. Navigation alone does not modify the trusted-root list; the existing folder-selected handler remains the only path into `addScanRoot`.

The user may then choose a narrow folder or project under a mount. Existing normalization, root cap, project promotion, canonicalization, scan depth, and argv-only discovery continue to apply. Browsing the root does not trigger scanning it.

## Files and compatibility

- Expected plugin changes: `TrellisDms/TrellisSettings.qml`, a small desktop instance settings component if separation improves clarity, `tests/test_trellis_contract.mjs`, and UI/usage docs as needed.
- No plugin manifest change or stored plugin setting migration is needed. DMS already defaults instance config to `displayPreferences: ["all"]`.
- Use DMS 1.6.2 imports already present on the host. Runtime QML loading and settings persistence remain host acceptance gates.

## Risk and rollback

The main risk is a global settings listener or child default initializer running under the instance-scoped service. Guard or avoid instantiating global controls in that mode. A rollback reverts plugin QML/docs/tests; DMS's per-instance display config may remain saved and should stay compatible with DMS itself.
