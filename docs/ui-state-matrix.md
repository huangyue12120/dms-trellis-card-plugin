# Trellis DMS UI state matrix

Every row is a normal modeled state. A compact projection may summarize it,
but the Snapshot and popout keep the available facts.

> v0.9.1 Desktop UI Gate approved 2026-09-24; desktop entries below are the
> accepted implementation contract.

> v0.9.2 interface labels follow DMS's active locale. The `zh_CN` plugin
> catalog is used when available; untranslated or unsupported-locale strings
> fall back to the English source. Trellis names, titles, paths, Markdown,
> IDs, and unknown status values remain unchanged.

| State | Pill projection | Popout projection | User action / recovery |
|---|---|---|---|
| Startup before first Snapshot | Trellis icon; no fabricated counts | `Loading Trellis status...` | Wait; no focus movement |
| No trusted roots | `No project` in text modes; icon otherwise | Unconfigured guidance plus Refresh/Settings controls | Open DMS plugin Settings and add a trusted folder |
| Trusted roots, no project found | `0` counts or `No project` | Empty discovery message plus Refresh/Settings controls | Check the trusted root or request a rescan |
| One project, no live tasks | Project/count summary | Project header and `No live tasks in this project.` | Create/start a Trellis task outside the plugin |
| Planning/in-progress task, no active session | `No active task` in task mode unless pinned; counts otherwise | Exact `planning`/`in_progress` group | Read-only; no synthetic active state |
| One active task/session | Active title in `auto`/`task` | Active task and session count | Open popout for context |
| Several sessions for one task | Same task title | `active / N sessions` | No session is discarded |
| Several active tasks | Count projection in `auto`; first title `+N` in `task` | All bounded loaded tasks, active first | Inspect list; no arbitrary deletion |
| Valid pinned planning/inactive task | Pinned task title and real state semantics | Pinned task remains one row among all live tasks | Unpin from the v0.6 popout |
| Stale or malformed pin/project preference | Deterministic active/recent/project fallback | Healthy Snapshot data remains visible | Select a current project or pin again |
| Equal/missing session times | Snapshot project/task order breaks the tie | All sessions remain counted | No fabricated recency |
| Several projects | First project `+N` or project count | Project sections in Snapshot order | Inspect list |
| All-project filter | Normal primary pill | Bounded project sections after fixed task grouping | Choose a project filter |
| Selected project beyond visual cap | Normal primary pill; pin remains global | Selected project is shown because filtering precedes the cap | Choose All to restore the bounded multi-project view |
| Duplicate task IDs across projects | Project-qualified pinned task | Each row's pin action targets its own project/task pair | Pin/unpin the intended row |
| Relationship cycle/conflict | Normal primary pill plus warning when present | Flat parent/child summary; no recursive task tree | Correct task metadata outside the plugin |
| Live-path custom/completed status | Truthful primary/fallback semantics | Exact bounded status under Other | Archive outside the plugin if appropriate |
| DMS State save failure | Local selection remains usable | Bounded synchronous persistence warning; no settings/Trellis fallback | Retry after fixing the DMS State backend; asynchronous host disk failures remain a reported runtime limitation |
| Second widget State change | Both pills recompute from the shared values | Both popouts converge after `pluginStateChanged` | No extra action |
| Long project/task name | Single-line elided label | Elided row title; full bounded value in project/task data | Popout gives more context; no wrapping pill |
| Warning with healthy data | Warning glyph/count does not replace normal summary | Warning summary plus healthy data | Correct source then rescan |
| Malformed task JSON | Normal aggregate plus warning glyph | Task error state and bounded warning | Fix JSON outside plugin; rescan/watch recovers |
| Unreadable/oversized file | Normal aggregate plus warning glyph | Read failure detail without raw content | Fix permissions/size; rescan |
| Stale session pointer | Normal aggregate plus warning glyph | Stale session warning; no invented task | Repair pointer outside plugin |
| Unknown Trellis version | Normal aggregate plus warning glyph | Version and compatibility warning | Upgrade/check compatibility |
| Degraded scan with last-good data | Last-good summary plus warning glyph | Retained data and degraded warning | Check root/filesystem; rescan |
| Archive summary unloaded | No archive count in pill | `Archive not loaded` only if shown | Rich archive is deferred |
| Topology rescan | Keep last coherent pill | Keep last coherent popout; `Refresh requested` remains visible until a newer non-degraded Snapshot | Manual rescan remains available; clicking never claims completion |
| Vertical bar | Icon plus warning glyph | Same popout as horizontal | Click to inspect |
| Narrow screen/popout | Selected compact pill | Screen-clamped one-column scroll; filters wrap, row text elides, help wraps | Scroll vertically; no horizontal overflow |
| Unknown display-mode value | Normalize to `auto` | Normal popout | Choose a mode in Settings |
| Legacy `displayMode` with no `pillMode` | Preserve the valid v0.6 mode; unknown values use `auto` | Normal bounded popout | Change Bar display mode in Settings |
| Show progress disabled or Snapshot progress is `null` | Unchanged pill summary | No progress line; no fabricated percentage | Keep the setting enabled only when numeric progress is useful |
| Archive visibility disabled | Normal live projection | Archive entry/index is hidden; live facts remain | Re-enable archive in Settings |
| Version warnings disabled | Healthy projection without version warning presentation | Non-version warnings remain visible; daemon version fact is retained | Re-enable warning presentation or inspect source data |
| Invalid/capped UI State | Deterministic fallback primary | Bounded rows with invalid-State copy; stored value is not silently deleted | Select a current project/pin or collapse choice |
| Restore defaults | `auto`/safe visibility defaults | Known UI State is removed individually; remembered-project cache is not a reset target | Add trusted folders again if discovery is intentionally empty |
| Root removed from settings | Recompute from remaining roots | Removed-root projects disappear after scan | Re-add only if trusted |
| Remembered project no longer found | Never used as live data | Absent from successful replacement cache | Re-add valid root or leave removed |

### Desktop surface (v0.9.1 approved UI Gate)

| State | Desktop projection |
|---|---|
| Startup before first Snapshot | Loading copy; no fabricated counts |
| No trusted roots | Unconfigured guidance plus warning summary |
| Trusted roots, no project found | Empty-discovery copy plus warning summary |
| Project has live tasks but no active task | Project/live-task counts and `No active session-backed tasks` |
| Active task/session | Project section and every active task title/session count in Snapshot order |
| Warning with healthy data | Preserve project/task facts; show up to three bounded warning details |
| More than three visible warnings | Show total count, three details, and `+N more warnings` |
| Degraded scan with last-good Snapshot | Preserve last-good project/task facts and add a bounded degraded warning |
| Narrow or short widget | One vertical scroll region; elide names and wrap explanatory/warning copy |

The desktop surface is a read-only projection of the shared Snapshot. It adds
no progress, archive body, activity claim, project filter, or task action.

### Launcher surface (v0.9.3 approved UI Gate)

| State | Launcher result / action |
|---|---|
| `!trellis` with empty query | Project results only, in Snapshot order |
| Query matches project names or live task titles | Case-insensitive substring results; project-name matches first, then task-title matches in Snapshot order |
| More than 20 matches | Show 20 results and one non-action `N more matches; refine your search` item |
| Non-empty query with no match | Let DMS show its normal no-results state |
| No valid Snapshot | Bounded loading item; selecting requests the existing popout when a bar widget is present |
| No trusted roots / no discovered projects | Corresponding guidance item; selecting requests the existing popout when available |
| Healthy Snapshot with warnings | Keep matching results; warning details remain in the popout |
| Select a project | Save its `selectedProjectId`, preserve the current pin, then request the popout |
| Select a task | Revalidate current IDs, save its project filter and project-qualified pin, then request the popout |
| Stale or malformed result | No State update and no popout request |
| State API unavailable | Keep results searchable; selection makes no State or popout change |
| No bar widget | Keep valid saved selection; popout request returns false without claiming it opened |
| Launcher disabled | Remove `components.launcher` and root `trigger`; other surfaces remain available |

Search matches project names and live task titles only. It does not search
paths, IDs, comments, Markdown, warnings, or archive entries. The approved
implementation contract is in
`.trellis/tasks/09-24-dms-v093-launcher-registry/launcher-ui-gate.md`.

## Priority rules

1. Keep current healthy facts visible.
2. Add a warning glyph/count without replacing those facts.
3. Put recovery detail in the popout/settings, not the pill.
4. Never claim progress, activity, archive counts, or project validity that the
   Snapshot/current trusted-root scan did not establish.
5. Recovery controls may change only `refreshToken` or open the DMS settings
   surface. They never repair Trellis data or clear plugin State.
