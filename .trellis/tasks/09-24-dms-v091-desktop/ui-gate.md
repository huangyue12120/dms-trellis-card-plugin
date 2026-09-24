# v0.9.1 Desktop UI Gate

Status: **approved by user on 2026-09-24**  
Target API evidence: DMS 1.6.2 local plugin documentation and schema  
Approved decision: implement the reviewed information hierarchy, warning cap, sizing, and compatibility floor below.

## Purpose and hierarchy

The desktop surface is a compact, read-only overview of every project in the shared Snapshot. It prioritizes project identity and active-task summaries, then shows a bounded set of warnings. The bar pill and popout keep their existing projection and behavior.

```text
┌ Trellis DMS                 3 projects · 4 warnings ┐
│ ⚠ root_unavailable · One configured root is missing │
│ ⚠ task_read_failed · Task metadata could not load    │
│ ⚠ +2 more warnings                                  │
│                                                     │
│ Project Alpha              2 active · 5 live tasks  │
│   Build release             Active · 2 sessions     │
│   Review migration           Active · 1 session      │
│                                                     │
│ Project Beta                0 active · 3 live tasks │
│   No active session-backed tasks                    │
│                                                     │
│ Project Gamma               1 active · 1 live task  │
│   …                                                   │
└──────────────────── one vertical scroll ───────────┘
```

The desktop view shows projects in Snapshot order and every active task already present in each project Snapshot, also in Snapshot order. A project header reports its active-task and live-task counts. An active task row shows its bounded title and active session count. A project with no active tasks says `No active session-backed tasks`; it does not imply that the project has no live tasks.

Warnings stay supplementary to healthy project/task facts. Show the total visible warning count, then at most three warning detail rows; if more remain, show `+N more warnings`. If a degraded-scan warning exists, prioritize one within those three rows. Each displayed message is bounded and wraps within the desktop width. The shared `versionWarning` preference filters version-warning presentation, matching the existing widget. The existing bar popout shows a larger warning detail set (up to eight), with its own overflow count.

## States

| Snapshot condition | Desktop projection |
|---|---|
| No Snapshot yet | `Loading Trellis status...`; no fabricated counts |
| No trusted roots (`root_empty`) | `Add a trusted scan folder in Trellis DMS Settings.` |
| Configured roots, no discovered projects | `No Trellis projects were found under the trusted scan folders.` |
| Project with live tasks but no active task | Project and live-task count remain visible; show `No active session-backed tasks` |
| Active task | Project name/counts, task title, `Active`, and resolved session count |
| Warning with healthy data | Keep all project/task facts; place up to three warning details below the header |
| More than three visible warnings | Show three details and `+N more warnings`; the total count remains visible |
| Degraded scan with last-good Snapshot | Keep last-good projects visible and add a bounded degraded warning |
| Empty Snapshot plus warning | Show the appropriate unconfigured/empty copy and warning summary together |

## Layout, Theme, and accessibility

- Use DMS `DesktopPluginComponent`, `Theme` semantic colors, Material Symbols, and the existing Trellis visual direction. Do not add a plugin-specific theme or decorative animation.
- The host's default desktop size is 200×200 logical px. Proposed minimum size is 180×160 logical px so the default fits; the component reads `widgetWidth`/`widgetHeight` and remains one column at every size.
- Keep all content in one vertical scroll region. Do not switch to a multi-column grid at wide sizes. Elide project/task names on single-line summary rows; allow warning and empty-state copy to wrap.
- State meaning uses text plus icon; color is supplementary. Preserve a logical reading/focus order. This surface adds no focusable action.
- Do not add progress, archive bodies, Markdown, activity claims, project filters, task pins, or task mutation.

## Lifecycle and disable path

- Read only `PluginGlobalVar("snapshot")` and the shared warning-visibility preference. The desktop surface creates no reader, process, timer, watcher, or filesystem scan and owns no persistent State.
- The DMS desktop registry makes the component available but does not auto-place it. Users can remove its desktop placement; this leaves the bar widget, popout, daemon, and plugin enabled. On a build without the desktop component, the composite continues to expose its other components.
- Multiple placements/screens render the same Snapshot and add no collection work.

## Compatibility decision proposed for the Gate

The installed DMS 1.6.2 schema and documentation establish the desktop component contract. The existing manifest allowed DMS 1.6.1, but this checkout has no 1.6.1 API tree to verify that component. The approved resolution is to raise `requires_dms` to `>=1.6.2` and document 1.6.1 as unverified. The selected RC target is already DMS 1.6.2.

## Implementation files after approval

- `TrellisDms/lib/trellisprojection.js`: pure desktop projection, preserving the whole loaded project list and bounding warning presentation.
- `TrellisDms/TrellisDesktopWidget.qml`: read-only Theme-based desktop rendering and its explicit loading/empty/recovery states.
- `TrellisDms/plugin.json`: optional `components.desktop` mapping, the `desktop-widget` capability, and the locally evidenced minimum DMS version; no permission changes.
- `docs/ui-state-matrix.md` and `docs/ui-component-contract.md`: accepted contract; this proposal remains the review record.
