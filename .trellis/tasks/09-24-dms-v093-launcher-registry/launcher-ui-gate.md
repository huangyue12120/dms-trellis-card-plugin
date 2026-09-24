# v0.9.3 Launcher UI Gate

Status: **approved by user on 2026-09-24**  
Target API evidence: locally installed DMS 1.6.2 plugin guide, schema, and service QML.

## Purpose and interaction

The Launcher is a read-only search and navigation entry for the existing Trellis popout. It does not create a second Trellis view or change task data.

```text
!trellis
  Project Alpha                 2 active · 5 live tasks
  Project Beta                  0 active · 3 live tasks
  Project Gamma                 1 active · 1 live task

!trellis migration
  Project: Project Beta         1 active · 4 live tasks
  Review migration              Project Beta · Active · 1 session
  Review migration notes        Project Gamma · in_progress
```

- The root trigger is `!trellis`. DMS passes the remaining query to `getItems(query)` and sends a chosen result to `executeItem(item)`.
- Search is a case-insensitive substring match over project names and live task titles only. It does not match comments, IDs, status strings, paths, warning text, archive records, or Markdown.
- With an empty query, show project results only, in Snapshot order. With a non-empty query, show matching project-name results first, then matching task-title results in project/task Snapshot order. A task result stays distinct by `(projectId, taskId)`, including duplicate task IDs in different projects.
- Return at most 20 matching results. If more match, append a non-action `N more matches; refine your search` item. Project results show active/live counts. Task results show project name, exact bounded state, and active session count when present. Names and comments are bounded; filesystem paths and raw IDs are never visible.
- Existing warning details remain in the popout. A healthy match remains available when the Snapshot also contains warnings.

## Selection behavior

- Selecting a project saves `selectedProjectId`, preserves the current task pin, then requests the existing `trellisDms` popout.
- Selecting a task revalidates the project and task against the current Snapshot, saves `selectedProjectId` and its project-qualified `pinnedTaskId` (replacing the previous pin), then requests the existing popout.
- Save State before requesting the popout so the existing widget receives the intended filter/pin. These are DMS UI State changes only; no Trellis file is written.
- If the selected IDs are stale or malformed, do nothing: no State update and no popout request.
- If a State API method is absent, keep search results available but make selection a no-op. Do not write a fallback store or open a popout that cannot navigate to the chosen result.
- If no bar widget is registered, keep the valid saved selection. `BarWidgetService.triggerWidgetPopout("trellisDms")` returns `false`; do not claim that a popout opened.

## Empty and failure states

| Snapshot / query condition | Launcher result |
|---|---|
| No valid Snapshot yet | One bounded `Trellis status is loading` information item; selecting it requests the existing popout when a bar widget is present |
| Ready Snapshot, `root_empty`, no projects | One trusted-folder guidance item; selecting it requests the existing popout when available |
| Ready Snapshot, configured roots, no projects | One `No Trellis projects found` information item; selecting it requests the existing popout when available |
| Empty query with projects | Project results only, preserving Snapshot order |
| Non-empty query with no match | Return no plugin items and let DMS show its normal no-results state |
| Healthy Snapshot with warnings | Keep matching results; the popout remains the warning-detail surface |
| Project/task disappears after results were produced | Treat the action as stale and make it a no-op |
| State API unavailable | Keep results searchable; selecting a project/task makes no State or popout change |
| No bar widget is placed | Save valid selection; popout request returns false and the core plugin remains usable |

## Host rendering, lifecycle, and disable path

- DMS owns result-row rendering, focus, and keyboard activation. The component supplies bounded `name`, `comment`, `icon`, `action`, and category fields only.
- The Launcher reads the daemon's shared Snapshot; it creates no filesystem reader, process, timer, watcher, socket, or independent cache.
- The component is created on first Launcher use. Removing `components.launcher` and its root `trigger` disables this entry while leaving daemon, bar, popout, settings, and desktop surfaces intact.
- `components.launcher` requires root `trigger` in the installed composite schema. The existing v0.9.1 compatibility floor `>=1.6.2` remains in effect; no permission is added.
- Actual registry publication, Control Center, Trellis mutation, agent launch, and activity collection remain out of scope.

## Local API evidence

- `/usr/share/quickshell/dms/PLUGINS/README.md` documents the `getItems(query)` / `executeItem(item)` contract and says Launcher components are created on first use.
- `/usr/share/quickshell/dms/PLUGINS/plugin-schema.json` requires root `trigger` when a composite manifest declares `components.launcher`.
- `AppSearchService.qml` calls `getItems` and `executeItem` behind exception guards.
- `PluginService.qml` exposes `loadPluginState(pluginId, key, defaultValue)` and `savePluginState(pluginId, key, value)`; the current Trellis widget uses the same project filter and qualified pin keys.
- `BarWidgetService.qml` returns `false` when no matching widget is registered on the focused screen.
- These are local DMS 1.6.2 source observations. Launcher runtime behavior and persisted State across a DMS restart remain separate host checks.
