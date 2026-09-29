# v1.1.4 Host Acceptance, Regression, and Release

## Goal

Verify the v1.1 features on a real supported DMS host and ensure they preserve the v1.0 read-only observer behavior before releasing `1.1.0`.

## Requirements

- After tasks 1.1.1–1.1.3, exercise normal Snapshot, degraded project, last-good fallback, recovery, Diagnostics, Copy diagnostics, all Desktop modes, two Desktop placements, DMS restart, locale switch, and plugin disable/enable.
- Regress the bar widget, popout, archive, Markdown detail, project filter, pin, Launcher, Settings, and multi-project behavior.
- Do not add features during acceptance. Record unavailable or unverified host checks without presenting static checks as runtime evidence.
- Confirm there are no new permissions, Trellis writes, network behavior, or duplicate watchers.
- Publish release notes and update the package version only when required host/release gates pass.

## Acceptance Criteria

- Each host check and v1.0 regression is individually recorded as pass/fail/unverified with evidence.
- Incident projection agrees with raw warnings; Diagnostics is redacted; multiple Desktop placements share one watcher/snapshot and persist according to State/config behavior.
- Restart and enable/disable behavior match the project contract.
- No new permission or Trellis write exists.
- Release notes state additions and known limitations; manifest is `1.1.0` only after the release decision passes.

## Dependencies

- Depends on completion of tasks 1.1.1, 1.1.2, and 1.1.3.
