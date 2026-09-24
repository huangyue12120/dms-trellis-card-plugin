# Trellis DMS v0.6 UI/UX specification

## Product and design direction

Trellis DMS is a compact, read-only developer-tool widget embedded in
DankMaterialShell. It is not a standalone dashboard or a marketing surface.
The interface preserves DMS Material 3 conventions and prioritizes truthful
status, fast scanning, and constrained bar width.

- Design mode: redesign-preserve.
- Variance: 3/10.
- Motion: 2/10.
- Density: 8/10.
- Theme: DMS semantic Theme values only.
- Icon family: DMS Material Symbols only; no emoji.

The only motion used by v0.6 is DMS's existing hover, ripple, width, and
popout feedback. There is no autonomous, looping, or decorative animation.

## Information architecture

The surfaces form three disclosure levels:

1. Bar pill: one compact projection and a warning signal.
2. Read-only popout: project, task, session-activity, version, and warning
   facts from the current Snapshot.
3. Settings: display mode, trusted scan roots, remembered-project explanation,
   rescan interval, and manual rescan.

Markdown documents, archive bodies, search, and task mutation are not part of
v0.6. Project filtering and project-qualified task pinning are the only new
interactive disclosure in this release.

## Pill display modes

`auto` is the default and recommended mode.

| Mode | Horizontal projection | Vertical projection | Intended use |
|---|---|---|---|
| `auto` | One active task label when exactly one is active; otherwise compact counts | Icon projection | Best default across changing states |
| `task` | Active task title plus `+N`; `No active task` fallback | Icon projection | Task-focused workflow |
| `project` | First project name plus `+N`; `No project` fallback | Icon projection | Multi-workspace identification |
| `counts` | Project, task, and non-zero warning icon-number groups | Icon projection | Stable compact telemetry |
| `icon` | Trellis icon plus warning glyph when needed | Same | Minimum width |
| `full` | Existing project/task/warning sentence | Icon projection | Diagnostics and large bars |

Rules:

- A title or project name is one line, elided, and limited to 180 logical px.
- `+N` always counts additional active tasks or projects, never hidden total
  tasks.
- The warning glyph remains visible in `auto`, `task`, `project`, `counts`, and
  `icon` when warnings exist. Details are never placed in the pill.
- Counts are derived from Snapshot arrays. Progress remains absent because the
  Snapshot has no authoritative progress value.
- Unknown stored modes normalize to `auto`.

### v0.6 primary selection

The bar chooses one display task without treating it as the only task. The
order is a valid project-qualified user pin, an active task in the selected or
current project, the newest valid session-backed task, then a project/no-active
fallback. Equal or missing session times keep Snapshot project/task order.

`last_seen_at` is used only to break primary-selection ties. It is not displayed
as Agent activity and never becomes progress. A pinned planning or inactive
task keeps its real state. `+N` counts additional active tasks; multiple
sessions for one task remain a popout session count.

## Read-only popout

Target width is 420 logical px and target height is 480 logical px, clamped by
the current screen through the DMS popout host where available. Content uses a
single scroll region and native spacing.

```text
Trellis                               2 projects / 7 tasks
Warning summary and recovery copy, when present

Project Alpha                                      0.6.17
  Active task title                      active / 2 sessions
  Planning task title                              planning

Project Beta                                       0.6.17
  No live tasks
```

The project header is the highest repeated level. Tasks are rows beneath it.
Warnings appear once near the top and show bounded code/message details after
the normal status summary. Errors do not replace healthy project/task facts.

Empty/recovery copy:

- Unconfigured: `Add a trusted scan folder in Trellis DMS Settings.`
- Configured but empty: `No Trellis projects were found under the trusted scan folders.`
- Project without live tasks: `No live tasks in this project.`
- Warning: show the message and `Rescan from Settings after correcting the path or file.`

### v0.6 live-task controls

The popout adds an `All` project filter followed by bounded project choices.
Filtering is a view operation only and happens before the eight-project visual
cap, so a selected project remains visible even when it was later in Snapshot
order. A stale project preference falls back to All without being deleted
during startup or a degraded scan.

Within a project, task rows are grouped in this fixed order: Active, In
progress, Planning, Error, Other. Snapshot order is preserved within each
group. Each row shows a bounded title, exact state, priority, non-recursive
parent/child summary, and valid session count. Custom and live-path
`completed` states stay in Other; archive exclusion remains an upstream path
rule.

Every task row has a native focusable pin/unpin action. The pin is an opaque
project-qualified token, so equal task IDs in different projects cannot
collide. Pin and filter changes update the current widget immediately, then use
only DMS State keys `pinnedTaskId` and `selectedProjectId`. Clearing either
choice removes only that key and never clears the shared `discoveredProjects`
cache. Synchronous State API failures keep the local choice usable and show a
bounded persistence warning; they never fall back to Trellis files or plugin
Settings.

### v0.6 recovery actions

The popout exposes two native, keyboard-focusable recovery actions after a
Snapshot is available:

- `Refresh` changes only the existing plugin setting `refreshToken`. The last
  coherent pill and popout stay visible while the scan runs. Feedback says
  that refresh was requested and clears only after a newer non-degraded
  Snapshot arrives; it never claims completion on the button click.
- `Settings` opens the DMS Plugins settings surface, and directly expands the
  Trellis plugin settings when the host modal is already available.

Neither action reads, writes, repairs, moves, or deletes a Trellis file.
Unconfigured, empty, warning, version, malformed/read-error, stale-session,
and degraded states keep these actions visible. Startup before the first
Snapshot shows only loading copy and does not add a new focus target.

## Settings copy and behavior

The settings intro must include this complete safety statement:

> Choose up to 16 folders you trust. Trellis DMS searches only inside those
> folders, up to 4 levels deep, for `.trellis` projects. It never selects your
> entire home, mounted drives, `/`, or `/proc` automatically; a broad folder is
> scanned only if you explicitly add it. It never writes to Trellis project
> files. Successfully discovered projects are remembered in DMS state and
> revalidated on later rescans.

The folder list is the source of scan authority and is capped at 16 entries.
The remembered-project list is labelled as a cache and cannot add an untrusted
root. Removing all trusted roots disables discovery. It must not enable a
fallback scan.

The legacy `projectRoot` value is accepted only while the `scanRoots` key is
absent or is not an array, so existing installations continue to work. An
explicit empty array disables discovery. The settings UI explains this as a
compatibility migration, not as a second active root control.

## Responsive behavior

- Horizontal bar: selected mode controls width. `auto` falls back to counts
  when there is not exactly one active task. Every text mode is single-line,
  elided, and bounded to 180 logical px.
- Vertical bar: icon-scale projection only. Text is neither rotated nor
  wrapped.
- Narrow screens: the plugin clamps its 420 x 480 target to the available
  screen with semantic DMS margins. Project filters wrap instead of creating
  a horizontal scroller; task/project facts remain one column in the single
  vertical scroll region. Names and row summaries elide, while explanatory,
  warning, persistence, and refresh-pending copy wraps.
- Large screens: the popout does not expand beyond the target width simply
  because space is available.

## Localization

The interface follows the locale selected in DMS Settings. The plugin ships a
`zh_CN` catalog, with English QML source text as the fallback for unsupported
locales and missing entries. Locale changes retranslate labels without
rescanning Trellis or changing Snapshot or DMS State.

Only plugin-authored labels and stable diagnostics are translated. Project
names, task titles, file paths, Markdown, IDs, unknown Trellis status values,
and dynamic system/parser error details remain unchanged. Compact bar labels
stay single-line and elide; explanatory text wraps in the popout, Settings,
and scrollable desktop widget. The Launcher uses the same catalog; its
project/task names and unknown status values remain source data.

## Accessibility

- Normal text targets WCAG AA contrast through DMS semantic colors.
- State is expressed with text/icon semantics and never by color alone.
- Settings use labelled DMS controls. Errors and safety guidance are visible
  text, not placeholders or hover-only tooltips.
- Popout content order is reading order. DMS focuses the popout on open and
  closes it with Escape.
- Filter, Refresh, Settings, and pin/unpin use DMS controls with native focus
  rings and Return/Space activation. Main actions are 40 logical px high;
  the plugin does not replace the host close button or its Escape behavior.
- The installed DMS 1.6.1 host pill is pointer-driven and has no plugin-facing
  accessible-name or keyboard-activation hook. This is a documented host
  limitation, not a capability claimed by the plugin.

## Design Gate record

Approved user direction on 2026-09-22:

- Add selectable shorter pill presentations.
- Use a bounded trusted-root model for automatic discovery.
- Remember and revalidate discovered projects.
- Explain the scan and persistence behavior clearly in settings.
- Complete the original v0.5 information architecture, visual/accessibility
  contract, and Gate work, then implement the two additions.

Accepted baseline: native DMS, `auto` default, Material Symbols, minimal
read-only popout, explicit trusted roots, DMS-state cache, no project writes.

Rejected alternatives: emoji status, automatic whole-home/mount scanning,
process-based project guessing, hidden automatic trust expansion, decorative
motion, rich Markdown/detail work, and a custom theme system.

## v0.6 validation record

The pure state-matrix fixtures cover loading, unconfigured/empty, project with
no tasks, planning/in-progress/custom/completed, active/multi-session,
malformed/read error, stale session, unverified version, healthy warning, and
degraded last-good data. Static contracts cover bounded horizontal content,
icon-only vertical composition, wrapped narrow filters, one vertical scroll
region, focusable controls, and the read-only boundary. The installed DMS
modules also load the workspace widget, settings, and daemon in the offscreen
component harness.

The current live host previously demonstrated two widget loads and one daemon
load per plugin generation, including unload/reload. Its DMS State backend
logged `Failed to write state for trellisDms Property 'connect' of object false
is not a function`; therefore pin/filter persistence after a full DMS restart
is not claimed. The workspace v0.6.3 build was not copied into the installed
plugin, so final Wayland visual, pointer, focus-scroll, settings-navigation,
and restart-persistence checks remain explicit runtime gates.
