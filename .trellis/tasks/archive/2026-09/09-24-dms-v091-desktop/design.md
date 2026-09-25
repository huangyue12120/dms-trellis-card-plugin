# DMS v0.9.1 desktop surface — design

## Surface contract

- Add `TrellisDesktopWidget.qml` as the optional `components.desktop` surface. It is a `DesktopPluginComponent` projection of `PluginGlobalVar("snapshot")`.
- Reuse the existing Snapshot semantics and a pure `TrellisProjection.makeDesktopProjection(snapshot, uiState?)` helper. Do not call daemon scan functions, open `FileView`, create a `Process`, or duplicate discovery/watchers.
- DMS currently registers plugin desktop surfaces as available widgets and leaves placement/size to the user. The API's plugin default size is 200×200; the component may declare minimum dimensions and respond to injected `widgetWidth`/`widgetHeight`.
- Preserve project and task Snapshot order. The approved layout is one vertical scroll area with a header/count/warning summary and a project section for each Snapshot project. Each section shows its project name, active/live-task counts, and every active task in that project Snapshot; task titles are elided. Snapshot bounds (32 projects and 128 tasks per project) bound the view without another project/task cap.
- Show the visible warning count and at most three warning-detail rows; show `+N more warnings` for additional details. Respect the shared `versionWarning` presentation preference.
- Loading, no trusted roots, zero projects, projects with no active tasks, healthy warnings, unknown Trellis version, and degraded last-good Snapshot receive explicit non-fabricated states.
- Use DMS Theme tokens and existing Material Symbols. No task pin/filter controls, Markdown, archive bodies, or custom theme/motion are added.

## Disable and lifecycle

- The desktop component is optional in the composite manifest and is not auto-placed. Users can remove the desktop placement; omitting `components.desktop` removes availability without affecting bar/popout.
- Desktop instances may exist on multiple displays, but all read the same daemon Snapshot. They own no timer, watcher, reader, process, or persistent UI state.
- DMS `widgetWidth`/`widgetHeight` control the responsive layout; scroll keeps all projects available on small placements.

## Contracts

- Snapshot remains schema version 1 and is unchanged. Desktop projection returns bounded strings/counts and preserves the total project count/hidden count if a presentation cap is reached.
- `progress` remains `null`; session recency and file changes are never described as Agent activity.
- Warnings augment healthy project/task facts instead of replacing them.
- The UI Gate proposal in `ui-gate.md`, with its state-matrix and component-contract updates, was approved by the user on 2026-09-24. Final QML may now follow that contract.
