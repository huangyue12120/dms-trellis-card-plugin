# v1.1.4 Host Acceptance, Regression, and Release

## Goal

Verify the v1.1 features on a real supported DMS host and ensure they preserve the v1.0 read-only observer behavior before releasing `1.1.0`.

## Requirements

- After tasks 1.1.1–1.1.3, exercise normal Snapshot, degraded project, last-good fallback, recovery, Diagnostics, Copy diagnostics, all Desktop modes, two Desktop placements, DMS restart, locale switch, and plugin disable/enable.
- Regress the bar widget, popout, archive, Markdown detail, project filter, pin, Launcher, Settings, and multi-project behavior.
- Do not add features during acceptance. Record unavailable or unverified host checks without presenting static checks as runtime evidence.
- Treat the user's 2026-10-06 reports as regression gates: a settings save must not disrupt the Desktop view, the widget Refresh action must discover newly added tasks, and automatic discovery must honor the configured topology interval.
- Confirm there are no new permissions, Trellis writes, network behavior, or duplicate watchers.
- Publish release notes and update the package version only when required host/release gates pass.

## Acceptance Criteria

- Each host check and v1.0 regression is individually recorded as pass/fail/unverified with evidence.
- Incident projection agrees with raw warnings; Diagnostics is redacted; multiple Desktop placements share one watcher/snapshot and persist according to State/config behavior.
- Restart and enable/disable behavior match the project contract.
- Presentation-only setting changes do not start a topology scan; root or refresh-token changes do, and an interval-only change updates the existing schedule. The timer retains its documented 30-second default and 15–300 second range.
- On a supported host, saving a setting keeps the Desktop view available, the widget Refresh action reveals a newly added task, and automatic discovery follows the configured interval.
- No new permission or Trellis write exists.
- Release notes state additions and known limitations; manifest is `1.1.0` only after the release decision passes.

## Dependencies

- Depends on completion of tasks 1.1.1, 1.1.2, and 1.1.3.
