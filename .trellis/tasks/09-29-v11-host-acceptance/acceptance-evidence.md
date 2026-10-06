# v1.1 Host Acceptance Evidence

Captured 2026-09-30. This task remains **in progress**. The local contract gate
passes, but no running DMS/Quickshell host is available in this session; this is
not a release acceptance record.

## Evidence classes

- **Fixture/pure**: disposable Node fixtures and projection contracts.
- **Static**: source, manifest, translation, and task-record checks.
- **Host**: behavior directly observed in a running target DMS 1.6.2 session.

Static and fixture results do not count as host evidence.

## Local checks

| Check | Result | Evidence and limits |
|---|---|---|
| `node tests/test_trellis_contract.mjs` | **PASS** | All 22 printed state-matrix cases passed; the suite ended with `trellis contract fixtures: ok`. |
| Projection JavaScript syntax | **PASS** | Removed only the first-line QML `.pragma library` directive in a pipe to `node --check -`; the source file was unchanged. This does not check QML-engine compatibility. |
| `TrellisDms/plugin.json` and `zh_CN.json` parsing | **PASS** | Both files parse as JSON. |
| Host-acceptance task context validation | **PASS** | `python3 .trellis/scripts/task.py validate .trellis/tasks/09-29-v11-host-acceptance`; both JSONL manifests validate. |
| Scoped whitespace check | **PASS** | `git diff --check` passed for the v1.1.3 feature and spec files before their commit. A pre-existing user edit in `PROJECT_PROGRESS.md` still makes a whole-tree check report trailing spaces; that file was not changed by this task. |
| QML lint/offscreen load | **UNAVAILABLE** | `qmllint`, `qmlformat`, `qmlscene`, and `qdbus` are unavailable. No offscreen QML harness was run. |

## Host preflight

| Check | Result | Evidence |
|---|---|---|
| DMS CLI version | **PASS (version only)** | `dms version` reports DMS v1.6.2. This does not prove a running host. |
| Wayland session variables | **PRESENT** | `XDG_SESSION_TYPE=wayland`, `WAYLAND_DISPLAY=wayland-1`, `DISPLAY=:2`. |
| Running DMS/Quickshell process | **UNAVAILABLE** | Process inspection found no `dms`, `quickshell`, or `qs` process. |
| DMS IPC target | **UNAVAILABLE** | `dms ipc --help` reports `Could not retrieve IPC targets`. |
| Quickshell config listing | **UNAVAILABLE** | `quickshell list` reports no default config directory or `shell.qml`. |
| Installed plugin inventory | **UNAVAILABLE** | `dms plugins list` attempted to access the official GitHub registry and failed because network access is restricted; installed-plugin state is unknown. |

The CLI being installed and the Wayland variables being present do not establish
that the target DMS shell is running. This session did not start/restart DMS or
write to the installed plugin/configuration directory.

## User-reported follow-up findings (2026-10-06)

The user reported three v1.1 behaviors from normal use:

| Observation | Evidence class | Local repair / host status |
|---|---|---|
| After changing a plugin setting, the Desktop widget disappears briefly and reappears; the user is unsure whether the widget reloads. | User report; root cause confirmed by local DMS 1.6.2 source. | **STATIC FIX / HOST UNVERIFIED** — removed the redundant `launcher` capability that triggered a full plugin reload; the visible result still needs host observation. |
| The widget's Refresh button does not show newly discovered tasks, while Settings > Refresh does. | User report; not observed in this session. | **STATIC PATH PASS / HOST UNVERIFIED** — both actions write a changing refresh token and the daemon classifies token changes as scan requests; new-task visibility remains unverified. |
| Automatic refresh appears ineffective; the user recalls an interval around 15 seconds. | User report; not observed in this session. | **STATIC FIX / HOST UNVERIFIED** — interval changes re-arm the existing timer; observed cadence remains unverified. The documented default is 30 seconds, with a 15–300 second range. |

These reports are follow-up regressions within v1.1 host acceptance. Local
source/fixture checks verify the static request and timer contracts, but do not
establish new-task discovery or timer cadence on a running DMS host. The
configured value and host-observed cadence must be distinguished.

### Confirmed Desktop reload cause

Read-only inspection of installed DMS 1.6.2 QML source traced the disappearance
to this chain:

1. `PluginService.savePluginData()` emits `pluginDataChanged(pluginId)`
   (`/usr/share/quickshell/dms/Services/PluginService.qml:921-924`).
2. DMS `PluginsTab.qml` reloads every loaded plugin whose `type` is `launcher`
   or whose `capabilities` contain `launcher`
   (`/usr/share/quickshell/dms/Modules/Settings/PluginsTab.qml:630-638`).
3. Reload unloads then loads the plugin; `DesktopPluginWrapper.qml` responds to
   both events by toggling its content Loader
   (`/usr/share/quickshell/dms/Services/PluginService.qml:877-884`,
   `/usr/share/quickshell/dms/Modules/Plugins/DesktopPluginWrapper.qml:54-66,
   406-409`).

This manifest is `type: composite` and already declares
`components.launcher`. DMS resolves and registers explicit component paths
independently of the `launcher` capability. The local repair therefore removes
only that redundant capability while retaining the Launcher component. The
`settingChanged()` signal is not the cause; no consumer exists in the inspected
DMS source. This is source evidence, not live-host evidence.

## Host acceptance matrix

Every row below requires direct DMS host evidence. All remain **UNVERIFIED**
because no DMS IPC target or running Quickshell process was available.

| Host check | Result | Evidence |
|---|---|---|
| Normal Snapshot display | UNVERIFIED | No running DMS host. |
| Degraded-project display | UNVERIFIED | No running DMS host. |
| Last-good fallback display | UNVERIFIED | No running DMS host. |
| Recovery after a degraded scan | UNVERIFIED | No running DMS host. |
| Diagnostics in a healthy state | UNVERIFIED | No running DMS host. |
| Diagnostics in a degraded state | UNVERIFIED | No running DMS host. |
| Copy diagnostics redaction | UNVERIFIED | Clipboard output cannot be exercised without the host UI. |
| Desktop Overview view | UNVERIFIED | No Desktop placement available. |
| Desktop Tasks view | UNVERIFIED | No Desktop placement available. |
| Desktop Health view | UNVERIFIED | No Desktop placement available. |
| Saving a plugin setting preserves Desktop view availability | UNVERIFIED | The DMS reload chain is source-confirmed and its trigger removed; visible behavior still requires a host check. |
| Launcher remains discoverable after settings saves | UNVERIFIED | Explicit component path remains; runtime Launcher behavior not exercised. |
| Widget Refresh discovers a newly added task | UNVERIFIED | No running DMS host; local assertions cover the refresh-token request path. |
| Default 30-second and configured 15–300 second topology cadence | UNVERIFIED | No running DMS host; local assertions cover interval normalization and timer re-arming. |
| Two placements share one Snapshot/watcher | UNVERIFIED | No running DMS host. |
| Per-placement modes remain independent | UNVERIFIED | No running DMS host. |
| Per-placement mode persists across DMS restart | UNVERIFIED | No running DMS host. |
| Removing one placement preserves the other | UNVERIFIED | No running DMS host. |
| English/Chinese locale switch and layout | UNVERIFIED | No running DMS host. |
| Plugin disable/enable lifecycle | UNVERIFIED | No running DMS host. |
| DMS restart behavior | UNVERIFIED | No running DMS host. |
| v1.0 bar widget regression | UNVERIFIED | No running DMS host. |
| v1.0 popout regression | UNVERIFIED | No running DMS host. |
| Archive browsing regression | UNVERIFIED | No running DMS host. |
| Markdown detail regression | UNVERIFIED | No running DMS host. |
| Project filter regression | UNVERIFIED | No running DMS host. |
| Task pin regression | UNVERIFIED | No running DMS host. |
| Launcher regression | UNVERIFIED | No running DMS host. |
| Settings regression | UNVERIFIED | No running DMS host. |
| Multi-project regression | UNVERIFIED | No running DMS host. |
| One-watcher lifecycle across surfaces | UNVERIFIED | Static code adds no watcher; live lifecycle is not observed. |

## Follow-up local checks (2026-10-06)

| Check | Result | Evidence and limits |
|---|---|---|
| `node tests/test_trellis_contract.mjs` | **PASS** | All 22 printed state-matrix cases passed; the suite ended with `trellis contract fixtures: ok`. Assertions cover settings-change classification, both Refresh request paths, and the explicit Launcher component with no reload-trigger capability. This remains fixture/static evidence. |
| `node --check tests/test_trellis_contract.mjs` | **PASS** | The updated contract test parses successfully. |
| `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-29-v11-host-acceptance` | **PASS** | Both task JSONL manifests validate. |
| Scoped `git diff --check` | **PASS** | Passed for the changed implementation, test, frontend spec, PRD, and design files. The pre-existing user edit in `PROJECT_PROGRESS.md` was excluded. |
| DMS/QML runtime verification | **UNAVAILABLE** | No running DMS/Quickshell process or IPC target; QML lint/offscreen tooling remains unavailable. |

## Diagnostics report correction (2026-10-06)

| Observation | Result | Evidence and limits |
|---|---|---|
| User copied Diagnostics while the widget was working; plugin metadata and Snapshot fields were `unavailable`, although `snapshot.source=daemon` appeared. | **FAIL, root cause confirmed** | DMS 1.6.2 `PluginGlobalVar` reads `parent.pluginId`, but the diagnostics variables' immediate parent had no `pluginId`. The metadata binding also referenced `PluginService` without using the service injected on the `PluginSettings` root. `snapshot.source=daemon` was a literal, not evidence that a Snapshot was read. |
| Diagnostics data wiring and report source marker | **STATIC FIX** | `globalSettingsView` now exposes `root.pluginId`; metadata reads use injected `root.pluginService`; source is `daemon` only for a ready Snapshot. Regression assertions cover null and valid empty Snapshots. |
| Re-copying Diagnostics on the user's running DMS host | **UNVERIFIED** | No running DMS/Quickshell host is available in this session. DMS and Quickshell version fields remain `unavailable` by design because this plugin does not read them reliably. |

## Static boundary checks

- **PASS (static):** the v1.1.3 work commit does not change `plugin.json`; the
  current manifest remains version `1.0.0` with the existing
  `settings_read`, `settings_write`, and `process` permissions and no network
  permission.
- **PASS (static):** Desktop mode assertions reject new file readers,
  processes, timers, scans, and DMS State writes.
- **UNVERIFIED (host):** watcher count and runtime Trellis write behavior were
  not observed in a running host.

## Release gate

The `1.1.0` release gate remains **BLOCKED** until required host rows are
verified. Do not bump the manifest version or publish release notes as though
host acceptance passed. No installed plugin, DMS configuration, or Trellis
project file was changed during this session.
