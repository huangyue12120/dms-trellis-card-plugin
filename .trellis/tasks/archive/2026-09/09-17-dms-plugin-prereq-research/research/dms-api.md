# DMS and Quickshell API evidence

Observed from the installed DMS 1.6.1 / Quickshell 0.3.1 tree on
`2026-09-17`. Source inspection is verified; live reload and IPC behavior are
blocked because DMS was not running.

## Plugin discovery and manifest (0.1, 0.12)

Primary sources:

- `/usr/share/quickshell/dms/PLUGINS/plugin-schema.json`
- `/usr/share/quickshell/dms/PLUGINS/README.md`
- `/usr/share/quickshell/dms/Services/PluginService.qml`
- `/usr/share/quickshell/dms/PLUGINS/ExampleCompositePlugin/`

The schema requires `id`, `name`, `description`, `version`, `author`, `type`,
and `capabilities`. It permits either legacy `component` or a `components`
object. `type` includes `widget`, `daemon`, `launcher`, `desktop`, and
`composite`; the component map accepts any subset of `widget`, `desktop`,
`daemon`, and `launcher`. A launcher surface also requires `trigger`.
`requires_dms` is syntactically a comparison plus three-part version, and
permissions are drawn from `settings_read`, `settings_write`, `process`, and
`network`. Unknown manifest properties are allowed by the schema.

The installed README documents discovery under
`$CONFIGPATH/DankMaterialShell/plugins/<PluginDirectory>/plugin.json` and
recommends PascalCase directory/QML names while using a camelCase plugin ID.
It still describes the old single `component` form and omits `composite` from
one required-fields paragraph; the installed schema and `ExampleCompositePlugin`
are the current authority for composite work.

`ExampleCompositePlugin/plugin.json` contains this concrete composite-manifest
excerpt:

```text
"type": "composite",
"components": {
  "daemon": "./CompositeDaemon.qml",
  "widget": "./CompositeBarWidget.qml",
  "desktop": "./CompositeDesktopWidget.qml"
}
```

Its README says the daemon is instantiated once while bar/desktop surfaces are
instantiated per placement/screen. `PluginService.qml:312-420` resolves the
surface map and `:522-550` creates one daemon instance per plugin. The widget
wrapper exposes bar axis, section, screen, thickness, pill, and popout
properties (`Modules/Plugins/PluginComponent.qml:8-73`).

The example declares `requires_dms: ">=1.5.0"`, while the Linux CodeIsland
widget declares `>=1.4.0`. Those are project declarations, not proof of the
minimum version for this observer's composite/API combination. A lower
compatible version is **unverified**; use the installed 1.6.1 as the
development baseline and revalidate any `requires_dms` value before shipping.

## Lifecycle and surfaces

`PluginService.qml` uses `FolderListModel` for user and system plugin-directory
enumeration (`:85-119`), loads each `plugin.json` with a `FileView`, parses
`components`, and registers widget/desktop/launcher components. Daemons are
queued and created once after component loading (`:490-550`). Widget and
desktop objects are therefore projections; filesystem scanning belongs in the
daemon surface to avoid one scan per bar/screen instance.

`PluginComponent` provides `horizontalBarPill`, `verticalBarPill`,
`popoutContent`, `popoutWidth`, `popoutHeight`, click actions, bar axis/section,
screen, and `pluginData` (`PluginComponent.qml:44-106`, `:185-209`).
`DesktopPluginComponent` is a separate wrapper with instance sizing and
settings access (`DesktopPluginComponent.qml:1-69`). `PluginPopout` and
`PopoutComponent` supply the host popout/header/close contract
(`PluginPopout.qml`, `PopoutComponent.qml`).

## Settings, state, and global variables

`PluginService.savePluginData/loadPluginData` delegate to `SettingsData` and
the persistent plugin-settings file (`PluginService.qml:921-929`).
`SettingsData.getPluginSetting/setPluginSetting` and
`getPluginSettingsForPlugin` are at `Common/SettingsData.qml:3394-3414`; the
file path is `$XDG_CONFIG_HOME/DankMaterialShell/plugin_settings.json`.

Runtime cross-surface data belongs in global variables:

- `PluginService.setGlobalVar/getGlobalVar` replace the namespaced object and
  emit `globalVarChanged` (`PluginService.qml:1173-1189`).
- `PluginGlobalVar.qml:8-25` exposes a reactive `value` and `set()` helper.
- The plugin README explicitly says globals are runtime-only, shared across
  instances, and not persisted (`PLUGINS/README.md:794-813`).

Persistent UI state has a separate state API. The verified path is
`Paths.state/plugins/<pluginId>_state.json` (`PluginService.qml:938-960`),
loaded/saved through `FileView` with a short write debounce. Use Settings for
user configuration, State for small cross-restart UI state, and one global
`snapshot` for the daemon-to-widget runtime projection.

## File watching and topology discovery (0.11)

`/usr/lib64/qt6/qml/Quickshell/Io/FileView.qml` exposes a `path` property and
the native type metadata exposes `watchChanges: bool`
(`quickshell-io.qmltypes:343-397`). DMS uses it for known files such as
`plugin_settings.json` and other configuration files. A DMS source comment
states: “FileView cannot watch a path that does not exist yet”
(`Modules/Lock/Pam.qml:513-515`). It is therefore not a recursive directory
watcher and cannot guarantee notification for a newly created task/session
file.

`Qt.labs.folderlistmodel` is present and exposes `folder`, `count`, `status`
(`Null`, `Ready`, `Loading`), filters, and `get()` roles
(`/usr/lib64/qt6/qml/Qt/labs/folderlistmodel/plugins.qmltypes:18-100`). DMS
itself uses it in `PluginService` to detect plugin-directory topology. A future
observer can use it for bounded one-level scans, or use `Proc` with an argv
array only if native QML enumeration is insufficient and the manifest declares
the `process` permission. No evidence justifies shell-string concatenation or
assuming `fd` is installed.

Recommended split: `FileView.watchChanges` for known `task.json`, session, and
version files; a debounced 15–30 second topology rescan (plus settings/manual
refresh) for new/deleted task and archive directories. The interval is a
product target, not a runtime guarantee.

## Theme and motion (0.13)

`Common/Theme.qml` exposes Material-style semantic colors including `primary`,
`primaryText`, `surface`, `surfaceText`, `surfaceVariant`,
`surfaceContainer{Lowest,Low,High,Highest}`, `outline`, `error`, `warning`,
`info`, and `success` (`Theme.qml:401-437`). It also exposes spacing
`spacingXXS` through `spacingXL` (2, 4, 8, 12, 16, 24), font sizes from
`fontSizeSmall` through `fontSizeXLarge`, `cornerRadius`, and font-family
properties (`Theme.qml:1140-1196`).

Animation integration is available through `Theme.shortDuration`,
`mediumDuration`, `longDuration`, `standardEasing`, and `emphasizedEasing`
(`Theme.qml:892-940`). `SettingsData.reduceMotion` is a persistent shell
preference (`SettingsData.qml:247-260`), and `SpringMotion.effectiveReducedMotion`
snaps motion when that preference or a component-level reduction flag is set
(`Common/SpringMotion.qml:9-13`, `:43-47`, `:82-85`). Final QML must use these
surfaces rather than a private theme or hard-coded status palette.

## Compatibility boundary

The plugin API README labels the API experimental and warns that minor-version
breaks may occur (`PLUGINS/README.md:1247-1249`). The installed 1.6.1 runtime
is verified; a minimum lower bound and live multi-display behavior are not.
The UI/UX gate and a user-approved design remain prerequisites for final visual
implementation.
