# Health Incident and Freshness Design

## Projection contract

Add a pure `makeHealthProjection(snapshot, detailResponse?)` helper in `trellisprojection.js`. It returns normalized runtime/freshness facts, project health summaries, incidents, incident count, and raw warning/error counts. It must not mutate its inputs.

Group warnings by internal project ID/root scope and cause category, not by message text. The parser must attach project context to task/session record errors as it appends them to global warnings, in addition to daemon project/discovery warnings. Preserve contributing raw warning codes and retain unknown warnings as bounded generic incidents instead of hiding them.

Initial cause mapping:

| Source facts | Incident category | Scope |
|---|---|---|
| `task_discovery_failed`, `session_discovery_failed`, `root_unavailable`, `project_discovery_failed`, related process/reader failure | live discovery/read failure | project or configured root |
| `task_read_failed`, `task_data_invalid`, `session_read_failed`, `session_data_invalid`, `malformed_pointer`, `malformed_json`, task/session reload failures | malformed/read failure | project |
| `archive_unavailable`, `archive_path_rejected`, and archive `detailResponse` error/warning codes | archive discovery/read failure | project archive |
| `project_limit`, `scan_root_limit`, `watcher_limit`, `reload_limit`, `archive_limit` | discovery limit | root/project/archive |
| `last_good_snapshot` | fallback state on Snapshot metadata | Snapshot-level, no standalone incident |
| `root_empty` | unconfigured state | Snapshot-level, not project degradation |

When reading archive `detailResponse`, accept only archive kinds and structured status/warning facts. Never read `content`, task names, or detail body into Health. `detailResponse` is transient; a newer success/clear/restart resolves an old archive incident.

## Snapshot runtime metadata

Use additive schema version 2. Keep every schema-1 field. New fields:

```text
runtime.scanStartedAt: ISO timestamp
runtime.lastSuccessfulDiscoveryAt: ISO timestamp or empty
runtime.snapshotIsCurrent: boolean
runtime.lastGoodFallbackActive: boolean
projects[].lastSuccessfulReadAt: ISO timestamp or empty
```

`generatedAt` remains the time the Snapshot was published. `scanStartedAt` is set when the latest topology scan begins. `lastSuccessfulDiscoveryAt` advances only after a complete successful topology discovery and is retained when using last-good data; successful known-file reloads may update a project's read timestamp but are not topology discoveries. `snapshotIsCurrent` is true when the published data came from the latest scan/reload and false when the daemon substituted the prior whole Snapshot or has no completed scan. `lastGoodFallbackActive` is true only for whole-Snapshot fallback. Record each project's successful read time only when its core project inputs were completely read; preserve the prior value after a failed read. Never derive these values from file modification times. Schema-1 inputs normalize to unavailable metadata.

Attach `projectId` to project-specific raw warnings before they are flattened into `Snapshot.warnings`. Add the same context to task/session discovery failures. Keep absolute roots/paths internal; user-facing projection uses project display names and never displays raw IDs.

## Health state

- Any incident that means required data is missing, malformed, or limited marks only its associated project/root as degraded. Archive-only failures carry `scope: archive`; live task/session facts remain visible and are not described as failed.
- Compatibility notices such as an unverified but readable Trellis version remain warnings, not degraded data.
- A full last-good fallback adds a visible fallback banner and old `lastSuccessfulDiscoveryAt`; it does not add a second incident count.
- Other healthy projects remain in the projection during a single project's failure.
- Recovery removes transient incidents when the current raw warnings/errors no longer contain their cause.

## Tests and rollback

Add pure fixtures for healthy, one-project degraded, multiple warnings from one cause, independent causes, archive error, limit, last-good, schema-1 input, immutability, and recovery. Preserve current Snapshot/task/session facts in all projection-only cases. If schema-1 compatibility breaks, revert the schema increment and projection changes before other v1.1 children continue.
