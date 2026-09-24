# Trellis DMS v0.2 composite skeleton

## Goal

Build the smallest loadable DMS composite plugin that proves the v0.2
architecture: one daemon publishes one runtime snapshot, one or more bar
widgets consume that snapshot, and a settings surface loads in DMS. The result
is a technical skeleton for the later Trellis data pipeline, not the finished
Trellis UI.

## User value

The project obtains a runnable DMS integration boundary before any filesystem
parser or final visual design is added. This makes the daemon/widget lifecycle,
global-variable contract, plugin settings namespace, and DMS installation
shape observable and debuggable early.

## Confirmed facts and constraints

- Stage 0 observed DMS 1.6.1; the implementation-time runtime currently
  reports DMS 1.6.2. Both use the installed composite manifest schema and the
  same Quickshell 0.3.1 baseline documented in the archived research.
- DMS creates one composite daemon instance per plugin and can create widget
  instances per bar/placement/screen; filesystem work must therefore not live
  in the widget.
- Runtime cross-surface state belongs in one namespaced global variable;
  settings are persistent plugin data and are not the runtime snapshot.
- The project is not a usable Git repository. Validation must not claim a Git
  diff or commit succeeded.
- The v0.2 skeleton may use a hard-coded, schema-shaped snapshot. Real Trellis
  discovery, parser, resolver, watcher, topology rescan, and final UI are later
  tasks.
- `requires_dms: ">=1.6.1"` remains compatible with the current 1.6.2 runtime;
  the lower release bound is still not a public compatibility claim.

## In scope

1. Add a root-level `TrellisDms/` plugin source directory with:
   - `plugin.json`
   - `TrellisDaemon.qml`
   - `TrellisWidget.qml`
   - `TrellisSettings.qml`
2. Declare a `composite` manifest with `daemon` and `widget` components and a
   shared settings component.
3. Use the verified DMS 1.6.1 development baseline for `requires_dms`, while
   documenting that the lower compatible bound remains unverified for release.
4. Have the daemon publish a deterministic debug snapshot through the
   `trellisDms` global `snapshot` variable on startup.
5. Have the widget consume `snapshot` reactively through `PluginGlobalVar` and
   render only diagnostic skeleton text in horizontal and vertical bar modes.
6. Provide a loadable settings page in the plugin namespace. A placeholder
   root setting may prove settings persistence, but it must not be read as
   though v0.3 discovery already exists.
7. Validate manifest/schema shape, QML/source structure, daemon singleton
   intent, widget/global-var data flow, plugin reload cleanup, and—if a DMS
   process is available—enable/reload and multiple widget instances.

## Out of scope

- Reading or writing `.trellis/`, scanning project roots, parsing `task.json`,
  session pointers, archive files, or Markdown.
- `FileView.watchChanges`, topology timers, filesystem permissions, safe path
  resolution, progress calculation, or warning aggregation.
- Final pill/popout visual design, UI/UX Design Gate decisions, archive/detail
  views, desktop surface, launcher, Control Center, or i18n.
- Agent activity, CodeIsland socket integration, Agent hooks, network/process
  permissions, trellis-card runtime or any external daemon.
- Writing Trellis files or changing user agent/DMS configuration automatically.
- Treating a runtime failure caused by DMS not running as a passed live
  lifecycle test.

## Requirements

### R1 — Manifest and package shape

`TrellisDms/plugin.json` must pass the installed DMS schema and contain the
required identity fields, `type: "composite"`, `components.daemon`,
`components.widget`, settings path, semver `0.2.0`, a non-empty author, and
only the permissions needed for settings (`settings_read`, `settings_write`).
It must not declare `process` or `network` for this skeleton.

### R2 — Single daemon publisher

`TrellisDaemon.qml` must be a DMS plugin component that publishes a stable
debug object under the plugin-global key `snapshot`. It must not perform
filesystem or process work. Its creation/destruction logging and publication
must make the singleton lifecycle observable without requiring a second daemon
per bar.

### R3 — Reactive widget consumer

`TrellisWidget.qml` must be a DMS plugin component that consumes the global
`snapshot` through the DMS reactive helper and exposes both horizontal and
vertical diagnostic bar components. It must not call a filesystem API or
reimplement daemon business logic.

### R4 — Settings surface

`TrellisSettings.qml` must load as the plugin's settings component and use the
`trellisDms` settings namespace. Any placeholder root setting must be clearly
labelled as reserved for the later data-link task and must not affect the
skeleton snapshot.

### R5 — Lifecycle safety

The skeleton must be reloadable without adding duplicate timers, watchers,
processes, or global subscriptions. Multiple widget instances must read the
same snapshot and must not create additional data collectors.

### R6 — Honest validation

Static checks must be runnable without a DMS process. Live enable/reload,
multiple-screen, and plugin IPC checks must be reported as verified only when a
running DMS actually produces evidence; otherwise they remain explicit
limitations.

## Acceptance criteria

- [x] `TrellisDms/plugin.json` parses as JSON, passes the installed schema
      constraints, and references files that exist.
- [x] The manifest declares exactly the v0.2 surfaces (`daemon`, `widget`) and
      no P2 surface or external dependency.
- [x] The daemon publishes one hard-coded debug `snapshot` containing a stable
      skeleton marker and generated timestamp through the `trellisDms` global
      namespace.
- [x] The widget reads that global value reactively and renders a diagnostic
      marker in both horizontal and vertical bar components.
- [x] The settings QML loads with `pluginId: "trellisDms"`; settings access is
      namespaced and does not touch `.trellis/`.
- [x] Source inspection confirms no filesystem, `Process`, shell command,
      network, CodeIsland, hook, or Trellis write path exists in v0.2 files.
- [ ] **UNVERIFIED — DMS is not running:** live discovery/enable/reload and
      multiple-bar instance behavior cannot be claimed; the static singleton
      injection contract is verified and the IPC limitation is recorded.
- [x] JSON validation, focused lifecycle/data-flow checks, forbidden-surface
      checks, and task context validation pass; QML lint tooling is absent and
      explicitly reported as unavailable.

## Implementation result

- Implemented `TrellisDms/plugin.json`, `TrellisDaemon.qml`,
  `TrellisWidget.qml`, and `TrellisSettings.qml`.
- Static checks pass against the installed DMS schema shape. The current
  runtime reports DMS 1.6.2 and Quickshell 0.3.1; the manifest bound
  `>=1.6.1` remains compatible.
- `dms ipc call plugins list` could not run because no DMS shell process is
  active. `qmllint`, `qmlformat`, and equivalent QML command-line tools are
  unavailable. The workspace is not a usable Git repository.

## Open questions and deferred decisions

There are no blocking user-owned decisions for this skeleton. The following
are deliberately deferred and must not change v0.2 behavior:

- the final lower bound for `requires_dms`;
- the final pill/popout design and public plugin presentation;
- the real Snapshot schema and Trellis root settings behavior;
- whether a later P2 activity provider is useful.

## Traceability

- Product scope: `trellis-dms-plugin-spec-revised.md` sections 3, 4.2, 7
  Stage 1.
- DMS lifecycle/global/settings evidence:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/dms-api.md`.
- Runtime limitations and compatibility baseline:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/environment.md`.
