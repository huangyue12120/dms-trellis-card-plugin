# Settings, State, and recovery flow

## Goal and user value

Make v0.7 behavior configurable and recoverable: users can choose what to show,
restore safe defaults, retain useful UI choices, and recover from empty roots,
bad data, archive/detail failures, and DMS State limitations without restarting
the shell or modifying Trellis files.

## Confirmed facts

- `TrellisDms/TrellisSettings.qml:15-77` already owns trusted-root loading,
  legacy `projectRoot` migration, remembered-project display, and State-change
  refresh; `:88-280` exposes display mode, interval, root management, and
  manual refresh.
- `TrellisDms/TrellisWidget.qml:22-174` currently owns only
  `pinnedTaskId`/`selectedProjectId`, refresh/settings recovery, and State
  synchronization.
- `TrellisDms/lib/trellisWatch.js` and the daemon enforce the 15-300 second
  interval; explicit empty `scanRoots` is authoritative and must remain so.
- DMS exposes key-scoped State APIs. The host has an observed asynchronous disk
  write error, so local interaction must remain usable and persistence must not
  fall back to Settings or Trellis files.

## Requirements

1. Add settings for `pillMode`, `showProgress`, `showArchive`, and
   `versionWarning`, with safe defaults and immediate UI effects. Retain the
   existing six display modes; read/migrate a valid legacy `displayMode` only
   when `pillMode` is absent, and normalize unknown values to `auto`.
2. Keep trusted roots, interval bounds, remembered-project safety copy, manual
   refresh, and no-project empty state. Add a clearly labelled restore-defaults
   action that resets plugin settings without clearing `discoveredProjects` or
   writing `.trellis/`.
3. Preserve pin/filter State and add bounded `collapsedProjectIds`,
   `collapsedTaskGroups`, and `selectedArchiveMonth` (or the exact equivalent
   settled by the parent design). Load all keys at startup and on this plugin's
   `pluginStateChanged`; update locally before persistence; display bounded
   synchronous persistence warnings.
4. Add recovery copy for settings unavailable, invalid roots/intervals,
   Markdown/archive errors, version warnings, refresh pending, and State
   failures. Invalid State falls back visibly without silently deleting it.
5. Ensure `showProgress` never creates a progress value when Snapshot
   `progress` is `null`; `showArchive` controls archive entry/index visibility;
   `versionWarning` controls only warning presentation, not the daemon's
   compatibility fact.

## Acceptance criteria

- [ ] First install, explicit empty roots, roots with no projects, multiple
  projects, invalid interval, and legacy `displayMode` all load safe settings
  and remain usable without a startup failure.
- [ ] `pillMode` migration preserves a valid v0.6 display choice; unknown
  mode/State values normalize or degrade to `auto`/empty with bounded copy.
- [ ] Show-progress/archive/version-warning toggles change the visible
  projection immediately and never fabricate progress or delete source facts.
- [ ] Pin, selected project, collapse/group, and archive-month preferences
  persist through widget reload when State succeeds; second widgets converge
  after `pluginStateChanged`; one-key reset preserves other keys and
  `discoveredProjects`.
- [ ] Restore defaults and manual refresh are observable; settings/State API
  absence or synchronous throw leaves local choices usable and reports a
  bounded error. No fallback writes Trellis data.
- [ ] Offscreen/static/state-matrix checks cover all new settings, reset,
  migration, invalid-state, empty/error/degraded, and responsive paths. Real
  host restart persistence is verified or explicitly unverified.

## Out of scope

- New discovery authority, archive mutation, Markdown reader implementation,
  task mutation/search, progress/checklist computation, custom themes, and
  unapproved P2 surfaces.

## Decisions and dependencies

- `pillMode` is canonical for v0.7; `displayMode` remains a compatibility alias.
- Restore defaults removes only known UI State keys individually. The daemon's
  output-only `discoveredProjects` cache is preserved.
- Depends on child 0.7.1 detail mode and child 0.7.2 archive mode so the
  visibility/collapse controls can be integrated and tested across the full
  state matrix. It is the final product-code child before parent integration.

## Verification status

- **Passed:** `node tests/test_trellis_contract.mjs`, Node syntax checks for
  the contract suite and all plugin JavaScript helpers (after removing the
  QML-only `.pragma library` directive for the parser check), task artifact
  validation, and `plugin.json` JSON parsing.
- **Passed by static/pure coverage:** settings migration/defaults, permission
  and State-cache guards, key-scoped reset, bounded State normalization,
  invalid-State recovery copy, empty/error/degraded state matrix, progress-null
  gating, archive/version visibility, and collapsed layout models.
- **Unverified runtime gates:** `qmllint`/QML type tooling is not installed;
  the installed Quickshell/DMS environment has no working offscreen host
  harness. Real DMS Settings navigation, Wayland focus/scroll, two-widget
  visual convergence, native Markdown rendering, State persistence across a
  full restart, and the observed asynchronous DMS State disk-write failure
  therefore remain target-host checks rather than claimed passes.
- **Known contract boundary:** restore defaults never targets or clears
  `discoveredProjects`; however, writing the required authoritative
  `scanRoots: []` can cause the daemon's later coherent empty scan to replace
  that output-only cache with `[]`, as required by the existing trusted-root
  contract. This is not a reset-time namespace clear or a Trellis-file write.
