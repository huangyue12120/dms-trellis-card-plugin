# v1.1 Diagnostics and Desktop View UI Gate

Status: **approved by user on 2026-09-29**

## Goal

Review the minimum user-facing structure for v1.1 Diagnostics and the three Desktop projections before final QML implementation.

## Accepted baseline to reuse

- Native DMS Material components, semantic `Theme` colors, Material Symbols, and existing spacing/typography.
- Compact, read-only developer-tool presentation; no custom palette or decorative motion.
- One vertical scroll region in Desktop at the existing 180×160 minimum; elide labels, wrap explanation text, and preserve healthy facts beside incidents.
- Use shared Snapshot/runtime data only. No new manifest capability, global surface, scanner, watcher, or permission.

## Proposed entry and settings

- Put **About / Diagnostics** in the existing plugin-wide Settings page. Keep desktop-instance Settings separate.
- Put a native `Overview / Tasks / Health` selection control in each Desktop placement's Settings. Default to Overview and save only to that placement's DMS config.
- Do not add a clickable in-widget navigation route; mode changes happen through the already established Desktop Settings control.

## Proposed content structure

### Desktop: Overview

Keep the current combined layout. Add a compact health summary while retaining project totals and active-task summaries.

```text
Trellis DMS                         3 projects
2 healthy · 1 needs attention
Project Alpha                       1 active · 4 live
  Review migration · Active · 1 session
```

### Desktop: Tasks

Use the same project order and group active tasks under each project. Each task row contains title, display state, priority, and active-session count. Keep any degraded state to one small summary row; do not repeat the full warning list.

```text
Trellis DMS · Tasks                  2 active
Project Alpha
  Review migration
  Active · P1 · 1 session
```

Show a clear empty state when there are no active tasks.

### Desktop: Health

Start with healthy/degraded project counts, last successful discovery, and an explicit last-good label when active. Group incidents under project display names. Show one healthy empty state when there are no incidents; direct users to plugin Settings for raw diagnostics.

```text
Trellis DMS · Health                 1 needs attention
Showing the last valid snapshot
Last successful scan: 3 minutes ago
Project Alpha
  Could not read the current task directory
  Showing the previous valid status
```

### Plugin Settings: About / Diagnostics

Add one read-only section after existing settings. Show verified version/capability facts, Snapshot and health counts, last successful scan, and per-project health/incident summaries. Use `unavailable` for unsupported host-version APIs. Place a clearly labeled **Copy diagnostics** button after a short explanation that the copied report is redacted.

The copied report uses project ordinals rather than names/IDs, includes bounded counts and stable warning/incident codes, and omits raw warning messages and all paths/content. Give bounded success/failure feedback after the user presses Copy.

## Interaction and visual constraints

- Preserve keyboard focus and native button/selection affordances.
- Keep loading, zero-task, all-healthy, degraded, and last-good states distinct.
- Do not rely on color alone to distinguish project health; pair semantic color with text/icon labels.
- No horizontal scrolling, charts, new animation, task operation, or unrelated system details.

## Gate decision requested

Approve this v1.1 UI structure with the parent planning summary, or request changes before the UI tasks are activated. The user has already selected the plugin-wide Settings page as the Diagnostics entry point.
