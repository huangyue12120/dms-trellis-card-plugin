# DMS v0.9.1 desktop surface

## Goal

Provide an optional desktop surface for Trellis project/task status with semantics consistent with the existing bar pill and popout.

## Background

- The composite plugin currently exposes one daemon and a bar widget. The daemon publishes the shared Snapshot.
- The DMS 1.6.2 API evidence confirms `DesktopPluginComponent` and composite `components.desktop`; desktop instances are per placement/screen while the daemon is shared.
- Existing UI artifacts define bar, popout, archive, and settings behavior, but do not define desktop information hierarchy or sizing.

## Requirements

- Add a desktop projection that consumes the existing Snapshot and projection rules; it must not scan Trellis files or create watchers.
- Show a multi-project overview with active-task summaries and bounded warnings, as selected by the user during planning.
- Define desktop size behavior, empty/error states, multi-project display, and a clear disable path.
- Add and approve a desktop state/UI contract before implementing the final QML surface.
- Preserve read-only behavior, DMS Theme use, and Trellis-only core operation when desktop is disabled or unavailable.

## Acceptance Criteria

- [x] Desktop and bar/popout show the same task/session meanings from the same Snapshot.
- [x] Loading, unconfigured/empty, warnings/errors, and multiple projects have documented and implemented projections.
- [x] Multiple desktop placements/screens do not add filesystem collection or duplicate daemon resources; the surface only consumes the shared global Snapshot.
- [x] Desktop can be removed from a placement; the optional component does not change the daemon, bar, or popout.
- [x] User approves the desktop UI contract before final surface implementation.
- [x] The shared `versionWarning` setting is loaded from `PluginService` and refreshed when that plugin's setting changes; per-placement `pluginData` is not treated as shared settings.

## Implementation and validation status

- Implemented `makeDesktopProjection`, `TrellisDesktopWidget.qml`, the optional desktop manifest component/capability, and the approved DMS 1.6.2 compatibility floor.
- Final review corrected the warning preference source: desktop `pluginData` is placement-scoped, so the widget now reads the shared value through `PluginService.loadPluginData` and refreshes on this plugin's `pluginDataChanged` signal.
- `task.py validate`, manifest JSON parsing, JavaScript syntax checking (after omitting the QML `.pragma library` directive), and `git diff --check` passed. The local DMS API/schema was inspected; no JSON Schema validator, `qmllint`, or `qmlformat` is installed.
- No test suite or live DMS/Wayland desktop placement was run. QML loading, placement/removal, resize, and multi-display behavior remain target-host verification gates.

## Confirmed product decision

- The desktop default is a compact overview of all discovered projects, their active-task summaries, and bounded warnings. The remaining implementation plan must define its size behavior and disable path within the existing DMS contract.
