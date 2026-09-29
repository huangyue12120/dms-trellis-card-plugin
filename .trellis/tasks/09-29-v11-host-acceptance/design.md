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

Record each item with result, steps, and direct evidence (host display/log or user observation). Do not count an offscreen/static check as a host pass.

## Release

Only after all required host checks pass, prepare `docs/releases/v1.1.0.md`, update README/manifest version to `1.1.0`, and verify permissions/surfaces remain unchanged. If checks fail/unavailable, keep the current package version and record the blocker for a v1.1.x follow-up. Remote tag/release/push are outside this local task until separately authorized.
