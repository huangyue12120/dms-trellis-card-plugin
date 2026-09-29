# v1.1.1 Health Incident Aggregation and Snapshot Freshness

## Goal

Give users a clear project-level health view and distinguish a current Snapshot from last-good data retained after degraded discovery.

## Requirements

- Preserve every existing raw warning/error as diagnostic facts; add a separate incident projection grouped by project/root and root cause.
- Cover task/session/archive discovery failure, permission/read failure, malformed data, discovery limits, and last-good fallback.
- Preserve root cause, user impact, current fallback behavior, and contributing raw warning codes.
- Do not count `last_good_snapshot` as a duplicate incident; show it as a fallback/degradation state attached to the relevant incident or Snapshot state.
- Expose scan time, last successful discovery time, whether the published Snapshot is current/live, and whether last-good fallback is active, using daemon-owned runtime metadata.
- Keep healthy projects visible when another project fails. Keep raw diagnostics reachable.
- Resolve incidents on recovery without leaving a stale red status.
- Do not infer Agent activity or staleness from task/session/Markdown mtimes; do not write to `.trellis/`.

## Acceptance Criteria

- Fixtures cover healthy state, one degraded project among healthy projects, multiple warnings from one root cause, independent failures, last-good fallback, and recovery.
- The same discovery root cause appears as one user-facing incident while all underlying warnings remain inspectable.
- Last-good mode is visibly distinct, shows the last successful discovery time, and does not change project/task/session facts.
- Recovery clears or marks the incident recovered without retaining an error badge.
- No Trellis write behavior is introduced.

## Dependencies

- Uses the v1.0 schema-1 Snapshot, warnings/errors, and existing last-good recovery behavior.
- Supplies the Health data used by tasks 1.1.2 and 1.1.3.
