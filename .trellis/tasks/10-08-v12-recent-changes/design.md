# Recent Changes Design

## Ownership and flow

A new pure exact-case lib/trellischanges.js owns deterministic comparison and finite history/tracking policies. The lowercase resource name follows the existing QML reload-resource contract. The daemon invokes it around _publishSnapshot; parser inputs/facts remain unchanged. Reuse existing Health and primary selection projections rather than duplicating their semantics.

Add a daemon runtime epoch and monotonic publication generation, distinct from scanGeneration. Attach optional daemon-owned provenance to the published snapshot runtime, then publish recentChanges as a separate global with matching provenance. Consumers tolerate absent globals and generation skew between two publications.

## Event contract

Events contain event_id, observed_at, project_id (nullable for unscoped health), optional task_id/session identity, event_type, source (trellis_data or ui_selection), whitelisted before/after summaries, source_snapshot_generation, and epoch. Bound titles to 240 characters and status/identity summaries using existing metadata limits. Never copy whole snapshots or raw task/session payloads into events.

Event IDs derive from epoch/generation plus an ordered event sequence. Compare semantic fields only; ignore generatedAt, scan clocks, lastSeenAt, mtime, and warning ordering. Keep the 200 newest events. Deterministic ordering follows qualified project/task/session identity and a documented event-kind order.

## Reliability and lifecycle

Maintain finite per-project reliable task/session baselines within existing 32-project/128-task/128-session limits. Root/discovery/fallback and record-level errors gate the affected comparisons. Preserve the last reliable record instead of replacing it with an unreadable or missing record. An actual absence never maps to completed; no task-deleted event is required.

A recovery compares against retained reliable facts: unchanged tasks are not recreated, while genuinely new facts can be observed. Valid session identity reassignment produces detach/attach only when both observations are reliable. Read errors do not imply detachments.

Initial daemon/root-scope observations are quiet. Explicit configured-root changes retire or rebaseline affected scope without mislabeling configuration removal as data deletion. Snapshot Health drives health events; transient quick-action errors do not.

Observe successful archive page metadata separately from Snapshot facts. First observation of each qualified coverage unit is quiet; later reads may emit newly-observed identities, never completion. Track at most 128 page units / 4096 row identities; evicted units rebaseline quietly. Deduplicate identities across retained units. Errors/cancelled reads retain the baseline.

Load current pin/primary preferences through key-scoped DMS State and observe changes centrally in the daemon. Initial preference loading is quiet; later changes are UI selection events and do not rewrite parser facts or cause scans.

## UI and compatibility

Use the parent's interaction plan: a Recent Changes entry, dedicated bounded history view, Back, project-qualified rows, and English/zh_CN text. Widget/desktop/Launcher scanner boundaries remain. Existing consumers accept optional runtime provenance without a schema change.

## Rollback

Remove only this child's helper/import/global/history-view additions and its source-test updates. Preserve the single Snapshot publication path and pre-existing root/refresh behavior.
