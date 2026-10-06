# v1.1 Health, Diagnostics, and Desktop Views

## Goal

Make project health understandable and diagnosable, show whether displayed data is current or retained as last-good, and let each Desktop placement focus on Overview, Tasks, or Health while retaining the v1.0 read-only observer boundary.

## Confirmed Background

- The current candidate is manifest version `1.0.0`, with `requires_dms: ">=1.6.2"`.
- One daemon publishes the shared schema-version-1 Snapshot. It contains `generatedAt`, project task/session/error records, and a top-level warning list; project discovery warnings are flattened into that list.
- The daemon can retain last-good project inputs and adds the `last_good_snapshot` warning on degraded discovery. The Snapshot has no separate scan/freshness metadata or user-facing incident model yet.
- Desktop currently renders one combined projection from the shared Snapshot. Desktop settings already use DMS per-placement configuration for display preferences.
- Existing UI and data contracts require healthy project facts to remain visible alongside warnings; Desktop placements must not scan `.trellis/` or create another watcher.
- `PROJECT_PROGRESS.md` is modified in the working tree and contains the v1.1 source requirements; preserve that existing change.

## Requirements

- Deliver the four v1.1 work items defined in `PROJECT_PROGRESS.md`: Health Incident/Freshness; About/Diagnostics and redacted export; Desktop Overview/Tasks/Health modes; and host acceptance/release.
- Keep raw warning/error facts available while adding a separate, user-facing incident projection.
- Report scan/freshness and last-good behavior from daemon-owned runtime metadata, without inferring Agent activity or freshness from task/session/Markdown modification times.
- Keep all surfaces on the shared daemon Snapshot; do not add filesystem reads, watchers, timers, background processes, network behavior, telemetry, hooks, or external daemons for UI diagnostics. The explicit Copy action may invoke the existing DMS clipboard CLI once with argv after user input.
- Keep Diagnostics export opt-in and redacted by default. Never include absolute project paths, home path, username, task Markdown, session content, or unconfirmed sensitive environment variables.
- Keep Trellis files read-only and add no permissions.
- Complete real DMS host acceptance before declaring v1.1 released or changing the manifest to `1.1.0`.

## Out of Scope

- Trellis writes or task-management actions.
- Agent runtime activity, hung/stuck inference, notifications, telemetry, uploads, and new plugin surfaces.
- Compatibility claims beyond behavior verified against the supported DMS host.

## Acceptance Criteria

- Child tasks 1.1.1 through 1.1.3 meet their listed fixture, projection, privacy, per-instance state, localization, and responsive-layout criteria.
- Child task 1.1.4 records every required host check and v1.0 regression as passed, deferred with an explicit limitation, or failed; no unverified host behavior is reported as passed.
- No new permission, Trellis write, or duplicate scanner/watcher is introduced.
- Release notes describe v1.1 additions and known limitations; version `1.1.0` is published only after the required release gates pass.

## Decision

- About / Diagnostics opens from a section in the existing plugin-wide Settings page. This reuses the established entry point and adds no manifest surface or navigation route.
