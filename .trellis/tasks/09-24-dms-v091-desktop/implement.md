# DMS v0.9.1 desktop surface — implementation plan

1. Draft `docs/ui-desktop-spec.md` (or an agreed UI addendum), and update `docs/ui-state-matrix.md` plus `docs/ui-component-contract.md` for desktop states, sizing, warning priority, and multi-screen behavior.
2. Present the concrete desktop UI contract and wait for user approval before writing final desktop QML. **Approved 2026-09-24; see `ui-gate.md`.**
3. Add a pure all-project desktop projection using existing Snapshot fields and stable project/task IDs. Preserve all projects and active tasks in the Snapshot (bounded upstream to 32 projects and 128 tasks per project); cap warning detail rows at three and report hidden warning count.
4. Implement `TrellisDesktopWidget.qml` using the DMS desktop wrapper, shared global Snapshot, Theme, host dimensions, and one vertical scroll region.
5. Add the optional `components.desktop` entry and `desktop-widget` capability to `plugin.json`; set `requires_dms` to the approved, locally verified `>=1.6.2`. Do not change daemon, parser, resolver, permissions, or core defaults.
6. Verify states and exact-case QML resource imports in the available offscreen/static harness; load multiple desktop placements and confirm one shared daemon on DMS 1.6.2 when available.
7. Verify user placement/removal, resize, multiple displays, empty/error states, and plugin reload on the selected Wayland/DMS target. Record any unavailable live gate.

## Validation targets

- Pure projection fixtures: loading/unconfigured/empty, no active task, multiple projects, multiple active tasks, warning, unknown version, degraded snapshot, over-cap counts, long names, `progress: null`.
- Manifest: optional desktop component maps to the exact QML path and does not add permission declarations.
- Host runtime: desktop is user-placed, multiple displays create no new collection work, and removing the surface leaves bar/popout healthy.

## Rollback point

If desktop registration or layout fails, remove `components.desktop` and `TrellisDesktopWidget.qml`; keep the shared daemon, Snapshot, bar, and popout unchanged.
