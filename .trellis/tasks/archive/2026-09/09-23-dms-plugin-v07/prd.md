# Complete Trellis DMS v0.7

## Goal and user value

Complete the v0.7 milestone in `PROJECT_PROGRESS.md` so a user can open a
live task's approved planning documents, browse historical archived tasks
without confusing them with live work, and configure/recover the plugin's
visibility and UI preferences without changing any Trellis file. The result
must remain useful with no project, missing archive data, malformed Markdown,
large histories, unavailable State writes, or an unavailable runtime feature.

## Confirmed facts and constraints

- v0.6 publishes one schema-1 global Snapshot containing complete bounded live
  project/task/session facts. `archiveSummary` is intentionally unloaded and
  no Markdown body enters that Snapshot (`TrellisDms/lib/trellisParser.js:331-370`).
- The daemon is the only filesystem reader and current Snapshot publisher;
  widgets render pure projection output (`TrellisDms/TrellisDaemon.qml:819-825`,
  `TrellisDms/TrellisWidget.qml:30-40`).
- `TrellisDms/lib/trellisPaths.js:244-385` already enforces canonical
  containment, explicit archive opt-in, and the fixed Markdown allow-list
  (`prd.md`, `design.md`, `implement.md`).
- Verified Trellis archive layout is
  `.trellis/tasks/archive/<YYYY-MM>/<task-dir>`, even though the roadmap uses
  the shorter `.trellis/archive` wording. The implementation follows the
  observed Trellis layout and records the discrepancy rather than broadening
  path authority.
- DMS/Qt exposes asynchronous `FileView` and native `Text.MarkdownText` in the
  installed environment, but `FileView` has no size property. A size check and
  async read must therefore be explicit and bounded.
- v0.6 State keys `pinnedTaskId` and `selectedProjectId` are already part of
  the compatibility surface. The host has an observed asynchronous State disk
  write failure; v0.7 must not mask it with a Trellis/settings fallback.

## Requirements

### R1. Live task Markdown detail (child 0.7.1)

- Selecting a live task opens a detail surface with tabs or equivalent
  controls for the existing `prd.md`, `design.md`, and `implement.md` files.
- Reads are on demand, asynchronous, canonicalized, and limited to a fixed
  allow-list and finite byte cap. The UI shows loading, missing, permission,
  oversized, malformed/unsupported, and empty-document states locally.
- Native Qt/DMS Markdown capability is verified. Basic Markdown is rendered
  when supported; a safe plain-text fallback remains readable when it is not.
- The detail request carries only validated project/task identity and document
  name. No arbitrary path, `.trellis/spec/`, journal, or task-external file is
  exposed, and Markdown checkboxes never become progress.

### R2. Archive browsing and lazy loading (child 0.7.2)

- A visible archive entry is separate from the live task list and is controlled
  by the archive visibility setting.
- The daemon indexes the verified `.trellis/tasks/archive/<YYYY-MM>/...`
  layout only after an explicit archive request. The default response is a
  bounded month/task summary; a selected month/task and page are loaded on
  demand.
- Archived tasks never enter live projections, and archive operations are
  strictly read-only. Empty archive, permission failure, unknown month layout,
  cap/pagination, and stale selection states have explicit local copy.
- Archive index/detail failure cannot block or replace a healthy live
  Snapshot. Archive Markdown uses the same detail resolver/reader contract as
  live Markdown.

### R3. Settings and compatibility migration (child 0.7.3)

- Settings expose trusted `scanRoots`, the existing 15-300 second topology
  interval, `pillMode`, `showProgress`, `showArchive`, and `versionWarning`.
  Defaults are safe (`auto`, progress visible only when a real numeric value
  exists, archive/version warnings visible) and changes take effect without a
  DMS restart.
- Existing `displayMode` values remain accepted; migration to `pillMode` must
  not silently reset an existing v0.6 selection. Unknown modes normalize to
  `auto`.
- Settings provide manual refresh, restore defaults, bounded error copy, and
  the existing trusted-root/empty-state guidance. Restore defaults removes
  only plugin-owned preference keys; it never clears the output-only
  `discoveredProjects` cache or writes `.trellis/`.

### R4. UI State and recovery (child 0.7.3)

- Preserve v0.6 pin/filter keys and add bounded collapse/filter preferences for
  project/group sections plus the selected archive month (or an equivalent
  bounded UI preference set). State loads on startup and on this plugin's
  `pluginStateChanged`, updates locally before persistence, and reports
  synchronous State API failures without disabling the interaction.
- Invalid/stale State is ignored with recovery guidance. A reset is
  key-scoped; State failure never falls back to plugin settings or Trellis
  files. Full restart persistence is claimed only when verified on the target
  host.
- Refresh retains the last coherent live data until a newer non-degraded
  Snapshot arrives. Settings/archive/detail errors remain local and do not
  fabricate progress or completion.

### R5. Cross-layer safety and boundedness

- Keep schema version 1 and the live Snapshot body-free. Use a separate
  ephemeral, request-id-checked detail/archive response channel with strict
  caps; document this exception to the older “raw Markdown never crosses a
  global-var boundary” rule.
- Reuse the safe resolver and argv-only process calls. Every canonical path is
  checked again immediately before a reader. No shell interpolation, network,
  WebView, arbitrary file browser, task mutation, or extra filesystem reader
  in the widget is allowed.
- All child deliverables retain exact-case helper naming, one daemon instance,
  generation cleanup, resource limits, and DMS semantic Theme/native controls.

## Acceptance criteria

- [x] Fixture live tasks can open, switch, reload, and return from all three
  Markdown documents; missing, oversized, malformed, traversal, symlink, and
  non-allow-listed cases remain local warnings and do not freeze/exit DMS.
- [x] Markdown/raw task content is absent from `snapshot` and from live pill
  and list projections; request/response data is bounded and stale responses
  cannot overwrite a newer selection.
- [x] Fixture archive tasks under each month are excluded from the live list,
  appear under a separate archive view, and support bounded page/month/task
  detail loading. Empty, permission-denied, unknown-layout, and large-archive
  states are observable without blocking live data.
- [x] `scanRoots`, interval, `pillMode`, `showProgress`, `showArchive`, and
  `versionWarning` have validated defaults, persistence, migration behavior,
  and immediate observable effects; invalid roots/intervals are rejected or
  clamped through the existing contracts.
- [x] Pin, selected project, collapse/filter state, and selected archive month
  survive widget reload when the host State backend succeeds; key-scoped reset
  leaves `discoveredProjects` intact and State failures keep local choices
  usable with bounded warnings.
- [x] Manual refresh, restore-defaults, empty/no-project, archive-read error,
  Markdown-read error, version-warning, and degraded-last-good paths have
  explicit recovery copy and never write Trellis data or synthesize progress.
- [x] Existing v0.3-v0.6 Node/static/offscreen contracts pass, including
  one live Snapshot publisher, safe resolver coverage, watcher cleanup,
  exact-case resources, and no widget-owned `FileView`/`Process`.
- [x] Real Wayland rendering/focus/scroll, direct Settings targeting, native
  Markdown support, and full DMS restart persistence are either verified with
  evidence or listed as explicit unverified runtime gates.
- [x] `plugin.json` is valid and reports `0.7.0` only after all three child
  deliverables and the integrated checks pass.

## Integration verification (2026-09-23)

- Contract suite, Node syntax checks, all JavaScript helper VM syntax checks,
  manifest JSON parsing, parent context validation, and all three archived child
  context validations passed.
- Static review confirms one live Snapshot publisher, daemon-only filesystem
  reads, canonical/size-gated read-only detail and archive channels, bounded
  responses, no widget `FileView`/`Process`, archive/live separation, and no
  fabricated progress.
- `qmllint`/`qmlformat` are not installed. Direct workspace QuickShell loading
  lacks the project `qs.*` modules, and the available legacy harness does not
  prove the current workspace build. Real Wayland rendering/focus/scroll,
  native Markdown/file-channel behavior, two-widget State convergence, and
  cross-restart State persistence remain explicit unverified runtime gates.
- The host has reported asynchronous State disk-write failure
  `Property 'connect' of object false is not a function`; the implementation
  keeps local choices usable and does not add a Settings/Trellis fallback.
- Restore defaults writes authoritative `scanRoots: []`; a subsequent coherent
  empty scan may replace the output-only `discoveredProjects` cache with `[]`.
  The reset itself remains key-scoped and does not clear that namespace-wide
  cache.

## Out of scope

- Task mutation, archive move/restore/delete, task checkbox/progress
  computation, search, arbitrary file browsing, `.trellis/spec/`/journal
  reading, WebView/heavy Markdown engines, or any write below `.trellis/`.
- Agent activity providers, hooks, sockets, network access, desktop/launcher
  surfaces, i18n, custom themes, and new UI not covered by the v0.5 Gate.
- Whole-home/mount discovery or remembered-project trust expansion.
- Claiming successful cross-restart persistence when DMS asynchronous State
  writes cannot be observed or when the target runtime is unavailable.

## Key decisions and deferred items

- The verified archive root is `.trellis/tasks/archive`; no second
  `.trellis/archive` authority is added without new Trellis evidence.
- A daemon-owned ephemeral detail channel is the only approved way to move a
  selected Markdown body or archive index to a widget. The live Snapshot stays
  schema-1 and body-free.
- Child order is 0.7.1 shared detail contract → 0.7.2 archive integration →
  0.7.3 Settings/State/recovery → parent integration. The split is sequential
  where contracts are shared, even though the roadmap permits partial
  parallel exploration.
- `pillMode` is the v0.7 name; `displayMode` is a compatibility alias and is
  migrated only when the new key is absent.
- The exact finite Markdown byte limit and page-size constants are technical
  implementation choices, not user decisions; they must be centralized,
  tested, and documented before `task.py start`.

## Child task map

1. `09-23-dms-v071-markdown-detail` — safe on-demand detail request/response,
   Markdown capability/fallback, live-task detail UI, and resolver/parser
   tests.
2. `09-23-dms-v072-archive-browsing` — verified archive month/task index,
   bounded pagination, separate read-only archive UI, and archive fixtures.
3. `09-23-dms-v073-settings-state` — settings migration/defaults, additional
   UI State, reset/recovery actions, and integrated state-matrix/runtime gates.

The parent owns cross-child contracts, final integration, version update, and
the explicit runtime limitation record. Product-code ownership stays in the
children.
