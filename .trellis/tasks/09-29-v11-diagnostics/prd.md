# v1.1.2 About / Diagnostics Center and Redacted Export

## Goal

Provide an always-available read-only diagnostic view and a user-controlled, redacted text summary that can be copied into a support issue.

## Requirements

- Provide About / Diagnostics in a section of the existing plugin-wide Settings page; do not add a Launcher route or manifest surface.
- Show plugin version; DMS/Quickshell/Qt versions only when reliably available; detected Trellis versions; project and task/session counts; current Snapshot/fallback state; last successful scan; raw warning/error count; incident count; and enabled capabilities/surfaces.
- Show per-project display name, detected Trellis version, health, incident summary, and last successful read.
- Copy diagnostics only after explicit user action. Default output excludes the home path, username, absolute project paths, task Markdown, session contents, and unconfirmed sensitive environment variables.
- Unknown or unavailable version facts must be shown as unknown/unavailable, never guessed.
- Use only shared Snapshot/runtime metadata and the existing archive `detailResponse` status; add no watcher/timer, reader, background process, permission, telemetry, upload, or network behavior. The Copy button may use the existing DMS clipboard CLI as a one-shot argv process after explicit user action.
- Keep diagnostics available while Snapshot is degraded.

## Acceptance Criteria

- The view opens in normal and degraded states.
- Copy output is redacted and corresponds to the current Snapshot and incident projection across multiple projects.
- Raw warnings map back to their incident summary; unavailable versions remain explicit.
- No additional watcher/timer, filesystem permission, background reader/process, or network behavior is introduced.

## Dependencies

- Depends on task 1.1.1 for health incidents and freshness metadata.
- Uses the existing plugin-wide Settings entry point.
