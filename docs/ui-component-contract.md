# Trellis DMS UI component contract

> The v0.9.1 desktop section at the end of this document was approved at the
> UI Gate on 2026-09-24.

## Localization (v0.9.2)

- QML source text uses literal `I18n.trFor("trellisDms", "English source")`
  calls and `TrellisDms/translations/zh_CN.json`. DMS owns locale selection and
  reloads plugin strings when its active locale changes; there is no plugin
  language selector or `en.json`.
- A missing entry or unsupported locale uses the English source term. Locale
  changes only retranslate presentation; they do not rescan or mutate Snapshot,
  DMS State, filters, pins, or archive pages.
- Translate only plugin-authored labels and stable diagnostics. Preserve
  project names, task titles, paths, Markdown, IDs, unknown statuses, and
  dynamic system/parser error details as received.
- Keep bar labels single-line and elided. Explanatory text may wrap in the
  popout, settings, and scrollable desktop surface. Launcher source terms are
  included in the same catalog; newly added Launcher copy follows this
  contract.

## `TrellisWidget.qml`

### Inputs

- `PluginGlobalVar("snapshot")`: schema version 1 Snapshot.
- `pluginData.pillMode`: one of `auto`, `task`, `project`, `counts`, `icon`,
  or `full`; invalid values normalize to `auto`. A missing `pillMode` reads
  the legacy `displayMode` value once for compatibility.
- `pluginData.showProgress`, `showArchive`, and `versionWarning`: validated
  visibility preferences with safe `true` defaults.
- DMS host properties: `axis`, `parentScreen`, bar thickness, Theme, and
  popout positioning.
- DMS State keys `pinnedTaskId`, `selectedProjectId`, bounded collapse lists,
  and `selectedArchiveMonth`; no arbitrary State namespace is owned by the
  widget.
- Ephemeral `detailRequest`/`detailResponse` globals carry validated IDs and
  bounded Markdown/archive responses. Raw bodies never enter `snapshot`.

### Derived values

- Project/task/warning counts come only from arrays in the Snapshot.
- Active tasks have `runtimeState === "active"`; no other status is promoted.
- Primary display order is Snapshot project order, then task order. Active
  tasks may be projected first in the popout without mutating the Snapshot.
- `+N` means additional items after the displayed first item.

### v0.6.1 primary projection

`trellisprojection.js` owns the project-qualified pin token and primary policy:

```text
makePinnedTaskToken(projectId, taskId) -> string
parsePinnedTaskToken(value) -> { projectId, taskId } | null
selectPrimary(snapshot, { pinnedTaskId, selectedProjectId })
  -> { projectId, taskId, reason,
       invalidPinnedTask, invalidSelectedProject }
makePillProjection(snapshot, displayMode, uiState?)
```

Task IDs are project-scoped, so a scalar task ID is not a valid pin. The
schema-1 session projection adds nullable `lastSeenAt`, normalized from the
pointer's `last_seen_at`. It selects among real resolved sessions only and is
never projected as activity or progress. Parser/daemon code does not read UI
preferences; DMS State wiring belongs to the v0.6.2 widget layer.

### Pill content

- Horizontal content is a `Row` with DMS `DankIcon` and `StyledText` items.
- Text is `Text.NoWrap`, `Text.ElideRight`, and at most 180 logical px.
- Vertical content is a centered icon stack and does not depend on string
  width.
- Warning color is `Theme.warning`; normal content uses Theme surface text.
  A warning glyph is still present so color is not the sole signal.
- No custom mouse handler is added. `PluginComponent` owns pill click/ripple
  and toggles the popout when `popoutContent` is non-null.

### Popout content

- Width target: 420 logical px. Height target: 480 logical px. Both are clamped
  to the current `parentScreen` minus semantic DMS margins and never expand on
  a larger screen.
- One root item whose `implicitHeight` is computed by its content and one
  clipped scroll region with an explicit target height. Do not assign the
  inherited read-only `implicitHeight` on `PopoutComponent`.
- Project and task row rendering is bounded by the existing Snapshot caps and
  may apply a smaller visual row cap with explicit `+N more` copy.
- Warning code/message text is bounded and wraps; raw files and Markdown are
  never loaded by the widget.
- The component defines no write, execute, network, or filesystem API.

### v0.6.3 responsive and recovery integration

- The popout has one vertical `DankFlickable` whose `contentWidth` equals its
  viewport width. Project filters use a wrapping `Flow`; there is no nested
  horizontal task/filter scroller.
- Project versions consume at most 35 percent/120 logical px of the header so
  long names keep a non-negative elided region. Task rows reserve a bounded
  40-px pin control and elide all one-line facts.
- `requestRefresh()` writes only the existing plugin setting `refreshToken`
  through `PluginService.savePluginData`. It records the current projected
  `generatedAt` and leaves `refreshPending` true until a newer projection is
  ready and does not contain a scan/reload degradation warning.
- `openPluginSettings()` uses `PopoutService`: it expands this plugin when the
  settings modal is loaded, otherwise opens the Plugins tab. A missing host
  API becomes bounded warning copy rather than a Trellis-file fallback.
- Recovery action errors and DMS State preference errors are separate bounded
  strings. A refresh request never reports success at click time and does not
  hide healthy last-good task rows.

### v0.6.2 State and live-task projection

```text
makePopoutProjection(snapshot, limits?, uiState?)
  -> { projects, projectOptions, selectedProjectId,
       invalidPinnedTask, invalidSelectedProject, warnings, ... }
```

- The pure projection validates both preference values. Project filtering
  occurs before project/task caps; an invalid selected project uses the All
  view without mutating or clearing State.
- Projects expose fixed Active, In progress, Planning, Error, and Other groups.
  Rows contain only bounded Snapshot-derived title/state/priority/relation/
  session fields and a project-qualified `pinned` flag. Relations are flat
  summaries, never recursive components.
- `TrellisWidget.qml` loads both keys on initialization, reloads them for this
  plugin's `pluginStateChanged` signal, and writes only after a user action.
  Local state changes first so a synchronous State failure does not disable
  the current interaction.
- Empty filter/unpin actions call `removePluginStateKey(pluginId, key)` when
  available, otherwise save an empty value for that key. `clearPluginState`
  is forbidden because it would also delete `discoveredProjects`.
- Project filter buttons and row pin buttons use native DMS focusable controls
  with Return/Space activation. This does not change the host pill's documented
  pointer-only limitation.
- Filter buttons wrap at narrow widths and use a bounded display label while
  the full bounded project name remains in the project header/projection.

## `TrellisSettings.qml`

### Desktop instance settings

- DMS loads this component for plugin-wide Settings and for a desktop widget
  instance. A non-empty `instanceId` selects the instance context; only that
  view is created, with DMS's display picker and position/size reset actions.
- Display preferences use `instanceData.config.displayPreferences`, default to
  `["all"]`, and save through the desktop instance config API. Preferences are
  independent for each desktop placement.
- Position and size reset actions clear only their corresponding saved geometry
  fields for that instance in DMS `SessionData`.
- Instance context does not load or migrate plugin-wide settings, read or write
  DMS plugin State, restore global defaults, or save through the instance-scoped
  `pluginService`. Plugin-wide Settings retain the Trellis controls below.

### Display mode

Use `SelectionSetting` with visible labels:

- Automatic (recommended)
- Active task
- Project
- Compact counts
- Icon only
- Full text

### Trusted scan roots

- `scanRoots` is an array of at most 16 unique, non-empty local paths.
- Add uses `FileBrowserModal { folderMode: true }`.
- Remove updates only DMS plugin settings and triggers the daemon's normal
  settings refresh.
- Empty means discovery disabled; it never means home/root scan.
- The complete safety statement in `ui-ux-spec.md` is visible above the list.
- The picker adds a localized `Computer` quick-access entry at `/`, so users
  can deliberately navigate to mount paths such as `/run/media` and `/mnt`.
  Opening or browsing the picker does not change `scanRoots`; only selecting a
  directory invokes the existing trusted-root validation and save path.
- The filesystem-root shortcut does not automatically trust `/` or scan any
  mount. Users still explicitly select the concrete folder they want to trust.

### Remembered projects

- Read from DMS state key `discoveredProjects` for explanation/summary only.
- No remembered entry is promoted into `scanRoots` automatically.
- Each record contains only `root`, `name`, and `lastSeenAt`.

### Rescan controls

- Preserve the 15-300 second `topologyInterval` contract.
- Manual rescan writes a changing `refreshToken` setting.
- Button feedback may use DMS native pressed/ripple state; no fabricated
  completion toast is shown before the daemon publishes.

## `TrellisDaemon.qml`

- Effective roots are `scanRoots` whenever the setting is an array, including
  an explicit empty array. Only an absent/non-array key falls back to the
  legacy `projectRoot` string.
- Roots still pass through `TrellisPaths.normalizeRoots`, canonical `realpath`,
  containment checks, depth 4 discovery, and all existing caps.
- After a non-degraded coherent scan, write a maximum of `maxProjects`
  summaries to plugin state key `discoveredProjects`.
- Never read that state key to authorize or seed discovery.
- A degraded scan does not erase the last successful cache.
- Project-state persistence is the only new write and targets DMS state, never
  a Trellis root.

## Focus, sizing, and motion

- DMS controls own focus rings and pointer/touch target behavior.
- Refresh, Settings, and filter buttons are 40 logical px high; row pin actions
  are 40 x 40. The plugin keeps their visual/focus order identical.
- Popout visual order equals reading/focus order and host Escape closes it.
- DMS bar thickness may be below the general 44 px touch recommendation; the
  plugin fills the host pill target and cannot enlarge the shell's bar policy.
- No animation is added beyond existing DMS `Theme.shortDuration` feedback.
- All layout remains valid when system motion is reduced because v0.6 adds no
  semantic dependency on animation completion.

## Runtime evidence and limitations

- Pure/static contracts and the offscreen installed-module load cover the
  state matrix, exact-case resources, screen-clamped dimensions, wrapping
  structure, native controls, and read-only boundary.
- The running DMS log shows two Trellis widget loads and one daemon load per
  generation across unload/reload, with no duplicate publisher path.
- The same host logged an asynchronous DMS State disk-write failure:
  `Property 'connect' of object false is not a function`. DMS exposes no
  completion/failure signal for that deferred write, so the plugin cannot
  truthfully promise pin/filter survival after a full DMS restart and does not
  add a settings or Trellis-file fallback.
- The v0.6.3 workspace build has not been installed. Real Wayland visual,
  click, focus/scroll, direct Settings navigation, and restart persistence are
  still unverified release-environment gates.

## `TrellisDesktopWidget.qml` (v0.9.1 approved UI Gate)

### Inputs and projection

- Read the daemon's shared `PluginGlobalVar("snapshot")`; read the existing
  `versionWarning` setting only to filter presentation.
- A pure `makeDesktopProjection(snapshot, uiState?)` owns readiness, the
  unconfigured/empty distinction, warning bounds, and project/task summaries.
- Preserve all projects and active tasks in the loaded Snapshot order. The
  current daemon bounds inputs to 32 projects and 128 tasks per project; do not
  add another project/task cap or discard rows at the surface.
- Active means `runtimeState === "active"`. It is a Trellis session-derived
  state, not a new claim about Agent activity. Preserve `progress: null`.
- Show active-task count and live-task count per project. When there are no
  active tasks, say `No active session-backed tasks` while retaining the live
  task count.
- Show total visible warning count and at most three bounded warning detail
  rows. `+N more warnings` accounts for details omitted from the desktop view;
  prioritize one degraded-scan warning within those rows when present. The
  existing popout shows up to eight details and its own overflow count.

### Rendering and lifecycle

- Use `DesktopPluginComponent`, DMS Theme semantic colors, existing icon
  conventions, and injected `widgetWidth`/`widgetHeight`.
- Minimum dimensions are 180×160 logical px against the DMS 200×200
  default. Use one vertical scroll region at every size; elide project/task
  labels and wrap explanatory and warning copy.
- Keep loading, no-root, no-project, no-active-task, warning, and degraded
  last-good states explicit. Warnings augment healthy data.
- No new State keys, controls, filesystem API, process, timer, watcher, or
  daemon resource. The desktop component does not change bar/popout behavior.
- Users disable the visible surface by removing its desktop placement; the
  shared plugin and bar/popout remain enabled. Multiple placements read the
  same Snapshot.

### Compatibility floor

DMS 1.6.2 is the locally inspected desktop API baseline. The existing 1.6.1
minimum is not verified against the desktop component. The approved decision is
to raise `requires_dms` to `>=1.6.2` with the optional component and document the
older version as unverified.

## `TrellisLauncher.qml` (v0.9.3 approved UI Gate)

### Inputs and search projection

- The optional `components.launcher` surface uses root trigger `!trellis` and
  receives DMS `getItems(query)` / `executeItem(item)` calls.
- Read the daemon's shared `PluginGlobalVar("snapshot")`; do not create a
  reader, process, timer, watcher, socket, filesystem scan, or local cache.
- A pure `makeLauncherProjection(snapshot, query)` returns bounded project and
  task result view models plus a truncation count. Empty query returns project
  results only. Non-empty query matches project names and live task titles by
  case-insensitive substring, preserving Snapshot order and distinguishing
  tasks by `(projectId, taskId)`.
- Return at most 20 matches plus a non-action overflow result. Search does not
  match comments, IDs, paths, warning text, archive entries, or Markdown.
- Project results show active/live counts. Task results show project name,
  stored/display status as defined by the Snapshot, and active session count
  when present. Visible text and comments are bounded and contain no path/raw
  ID.

### Selection and failure behavior

- Project selection writes only `selectedProjectId` through key-scoped DMS
  State APIs, preserves the existing pin, and then requests the existing
  `trellisDms` popout.
- Task selection revalidates both IDs against the current Snapshot, writes
  `selectedProjectId` and a project-qualified `pinnedTaskId` token (replacing
  the prior pin), then requests the existing popout.
- Stale/malformed IDs are a no-op. If key-scoped State APIs are unavailable,
  selection does not mutate state or request the popout. Do not use settings or
  Trellis files as fallback storage.
- Missing Snapshot and valid empty Snapshots produce bounded informational
  results. No-match queries use DMS's normal empty-result UI. Warnings remain
  available in the popout and do not hide matching results.
- If `BarWidgetService.triggerWidgetPopout("trellisDms")` returns false, keep
  the valid State selection but do not claim the popout opened. DMS owns result
  rows, focus, and keyboard activation.
- Removing `components.launcher` and root `trigger` disables only the Launcher.
  Registry publication, Control Center, task mutation, agent launch, and
  activity collection remain out of scope.

The approved implementation contract is recorded in
`.trellis/tasks/09-24-dms-v093-launcher-registry/launcher-ui-gate.md`.

## v0.7.3 Settings and State addendum

- `pillMode` is canonical with the six existing modes; `displayMode` is read
  only as a migration source when `pillMode` is absent. Unknown values use
  `auto`. `showProgress`, `showArchive`, and `versionWarning` default to true.
- Widget State additionally owns bounded `collapsedProjectIds` (32),
  `collapsedTaskGroups` (128), and `selectedArchiveMonth` (`""` or
  `YYYY-MM`). Invalid values remain stored, fall back locally, and show
  bounded warning copy.
- Restore defaults resets known settings and these five UI State keys
  individually, primes DMS State before key removal, clears local scan roots,
  and never calls `clearPluginState` or writes Trellis files. The
  `discoveredProjects` cache is not a reset target.
- `showProgress` renders only finite numeric Snapshot values; `null` remains
  absent. `showArchive` gates archive entry/index visibility, while
  `versionWarning` filters warning presentation without changing daemon facts.
- Collapsed QML `Repeater`s use an empty model to remove delegates and layout
  contribution; `Repeater.visible` alone is not a collapse mechanism.
- Settings/State API failures keep local interaction usable and show bounded
  recovery copy. Real host restart persistence, focus/scroll, and installed
  offscreen QML loading remain runtime evidence gates.
