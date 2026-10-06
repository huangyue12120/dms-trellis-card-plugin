# v1.1 Host Acceptance and Release Design

## Gate strategy

Host acceptance is evidence collection and release gating, not a feature task. Separate source-level fixture/static results from real DMS 1.6.2 host behavior. Any unavailable item stays unverified and blocks the `1.1.0` release decision when listed as required.

## Host matrix

Exercise on the target DMS/Quickshell/Wayland session:

- normal Snapshot; one degraded project; last-good fallback; recovery;
- Diagnostics in healthy and degraded states; copied report has no username, path, project name/ID, raw error message, task content, or session content;
- Overview, Tasks, Health; two placements with different modes; per-instance config after restart; removing one placement leaves the other intact;
- English/Chinese locale; plugin disable/enable; DMS restart;
- v1.0 bar, popout, archive, Markdown, project filter, pin, Launcher, Settings, and multi-project regression.

### Follow-up regression gates (2026-10-06)

The user reported three v1.1 symptoms. Verify these separately on the supported
host after the local repair:

- Change a plugin setting while the Desktop widget is shown; confirm its view
  remains mounted and visible. Confirm Launcher remains available after the
  setting save.
- Keep `components.launcher` as the explicit Launcher surface. Do not also
  declare `launcher` in this composite manifest's `capabilities`: DMS 1.6.2
  reloads the whole plugin on `pluginDataChanged` when that capability is
  present, which unloads and recreates Desktop content.
- Confirm presentation-only settings do not request a topology scan.
- Add a task under a discovered project, use the widget's Refresh action, and
  confirm the new task appears without using Settings > Refresh.
- Confirm the default topology interval is 30 seconds, then change it within
  the supported 15–300 second range and verify automatic discovery follows the
  selected cadence. A running scan must not be necessary for an interval-only
  update to take effect.

Keep any visual-reload conclusion labeled as host evidence: static event and
timer assertions cannot prove the Desktop wrapper's visible behavior.

Record each item with result, steps, and direct evidence (host display/log or user observation). Do not count an offscreen/static check as a host pass.

## Release

Only after all required host checks pass, prepare `docs/releases/v1.1.0.md`, update README/manifest version to `1.1.0`, and verify permissions/surfaces remain unchanged. If checks fail/unavailable, keep the current package version and record the blocker for a v1.1.x follow-up. Remote tag/release/push are outside this local task until separately authorized.
