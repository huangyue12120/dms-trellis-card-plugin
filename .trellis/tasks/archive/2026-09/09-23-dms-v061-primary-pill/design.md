# v0.6.1 design

## Data flow

`trellisParser.js` copies a bounded valid `last_seen_at` string into
`session.lastSeenAt`; invalid timestamps become null. No filesystem mtime is
introduced. `trellisprojection.js` then consumes Snapshot plus UI State and
returns a primary selection and pill model. QML renders fields only.

## Pure contracts

```text
makePinnedTaskToken(projectId, taskId) -> JSON array string | ""
parsePinnedTaskToken(value) -> { projectId, taskId } | null
selectPrimary(snapshot, uiState) -> {
  projectId, taskId, reason,
  invalidPinnedTask, invalidSelectedProject
}
makePillProjection(snapshot, mode, uiState) -> PillProjection
```

The encoded pin is project-qualified. Selection validates all referenced IDs
against the current Snapshot and never mutates input arrays. Valid session
times compare chronologically; missing/equal times fall back to project/task
and session array order.

## Preference boundary

This child defines the normalized preference input and pure invalid-state
flags but performs no State I/O. Child 0.6.2 uses `TrellisWidget.qml` as the
only DMS State boundary. Neither daemon nor parser sees UI preferences.

## Compatibility

The Snapshot remains schema version 1, with nullable additive
`session.lastSeenAt`. Existing callers that omit preferences get empty/default
values and retain deterministic v0.5-compatible output.
