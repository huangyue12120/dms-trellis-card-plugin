# v0.2 Composite Skeleton Design

## Architecture and boundaries

The source package is a root-level `TrellisDms/` directory. It is a local DMS
plugin source tree; installation into the user's DMS plugin directory is a
manual/runtime validation step, not a side effect of the implementation.

```text
plugin.json
   ├── daemon  → TrellisDaemon.qml  → PluginService.setGlobalVar("trellisDms", "snapshot", ...)
   ├── widget  → TrellisWidget.qml   → PluginGlobalVar(varName: "snapshot") → debug text
   └── settings → TrellisSettings.qml → PluginSettings(pluginId: "trellisDms")
```

The daemon is the only publisher. The widget has no filesystem, process,
network, or Trellis knowledge. Settings only exercises the DMS plugin settings
namespace; it does not configure a parser that does not exist yet.

## Manifest contract

`plugin.json` uses the installed DMS 1.6.x schema. Stage 0 observed 1.6.1;
the implementation-time runtime reports 1.6.2, which remains compatible with
the selected development bound:

- `id`: `trellisDms`
- `name`: `Trellis DMS`
- `type`: `composite`
- `version`: `0.2.0`
- `capabilities`: `daemon`, `dankbar-widget`
- `components.daemon`: `./TrellisDaemon.qml`
- `components.widget`: `./TrellisWidget.qml`
- `settings`: `./TrellisSettings.qml`
- `requires_dms`: `>=1.6.1` as the local development baseline only
- `permissions`: `settings_read`, `settings_write`

The `requires_dms` value is intentionally conservative for this skeleton. It
must be re-evaluated before public release because Stage 0 did not prove a
lower compatible bound.

## Snapshot contract

The daemon publishes one object under the global variable name `snapshot`:

```js
{
  schemaVersion: 0,
  source: "v0.2-skeleton",
  generatedAt: "<ISO-8601 timestamp>",
  projects: [],
  warnings: []
}
```

This is a debug contract, not the final Trellis Snapshot schema. It is shaped
as an object so later tasks can replace its producer without changing the
daemon/widget transport boundary. No consumer may infer task progress or
activity from this skeleton marker.

## QML lifecycle

1. DMS loads `plugin.json` and creates one daemon for the enabled composite
   plugin.
2. `Component.onCompleted` publishes the debug snapshot and logs a scoped
   startup message.
3. Each bar widget instance creates a reactive `PluginGlobalVar` child and
   renders the current snapshot marker in the axis-specific component.
4. Plugin reload destroys the daemon and widget objects. The skeleton owns no
   Timer, FileView, Process, Socket, or external callback, so reload must not
   leave resources behind.
5. `Component.onDestruction` logs shutdown for manual lifecycle inspection. No
   Trellis or user file is modified on destruction.

## Settings contract

`TrellisSettings.qml` uses `PluginSettings { pluginId: "trellisDms" }` and a
single clearly labelled placeholder root setting (or equivalent minimal
settings content) to prove the namespace is loadable. The setting is not read
by the daemon in v0.2. This prevents users from mistaking a stored value for a
working discovery feature.

## Compatibility and operational notes

- The implementation was designed against the Stage 0 DMS 1.6.1 / Quickshell
  0.3.1 baseline and checked against the current DMS 1.6.2 / Quickshell 0.3.1
  runtime.
- No `startupCheck` is declared: a missing Trellis project is not a hard
  dependency, and v0.2 has no external binary requirement.
- No `process` permission is declared because there is no `Proc`, `Process`,
  shell command, or directory scan.
- If DMS is not running, static validation remains valid but live enable,
  reload, and multi-screen behavior remain unverified.
- Manual installation must target the DMS plugin directory documented in the
  research; it must not overwrite the project source or modify DMS settings
  automatically.

## Trade-offs

- A hard-coded snapshot gives no user feature yet, but isolates the lifecycle
  and cross-surface contract before parser complexity or UI decisions.
- `>=1.6.1` may exclude older DMS versions, but avoids claiming compatibility
  that Stage 0 did not prove. This is a development constraint, not a final
  release decision.
- Keeping the skeleton to four QML/JSON files reduces surface area and makes
  static review straightforward; shared parser utilities belong to v0.3.

## Rollback

The change is additive. Rollback is deleting/disabling the local
`TrellisDms/` source directory and removing the plugin from DMS layout if it
was manually installed. No `.trellis/` file, agent configuration, or user
settings file is modified by the source implementation.
