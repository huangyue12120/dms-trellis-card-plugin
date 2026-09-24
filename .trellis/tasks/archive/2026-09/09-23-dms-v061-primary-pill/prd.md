# v0.6.1 Primary task bar pill

## Goal

Implement the deterministic v0.6 primary-task policy and project it through a
truthful, responsive bar pill without discarding any project, task, or session.

## Requirements

### R1. Session recency input

Expose valid session `last_seen_at` as nullable `lastSeenAt` in the schema-1
Snapshot. Missing/invalid values remain null and do not invalidate an otherwise
valid session. The timestamp is selection input only, never progress or Agent
activity.

### R2. Pure primary policy

Implement pure project-qualified pin normalization and primary selection in
`trellisprojection.js`. Select an eligible pin first, then an active task in
the selected/current project, then the newest visible valid session-backed
task, then a project/no-active fallback. Resolve ties by Snapshot order.

### R3. UI preference contract

Define and validate the two preference inputs consumed by the pure projection:
project-qualified `pinnedTaskId` and scalar `selectedProjectId`. Malformed or
stale preferences are ignored and reported through selection flags. Child
0.6.2 owns DMS State loading, saving, clearing, and multi-widget sync.

### R4. Pill projection

All six v0.5 display modes remain compatible. Horizontal text stays bounded
and elided, vertical output stays icon-only, warnings do not replace healthy
facts, and multi-active state exposes truthful additional counts.

## Acceptance criteria

- [x] Parser fixtures cover valid, missing, and invalid `last_seen_at` values
  while keeping schema version 1 and every session.
- [x] Pure tests cover pin, selected-project active task, recent-session,
  stable-tie, stale pin, stale project, no-project, and no-active fallbacks.
- [x] Duplicate task IDs in two projects cannot resolve a pin to the wrong
  project.
- [x] Primary-selection output includes IDs, selection reason, and invalid
  preference flags without mutating the Snapshot.
- [x] Pill modes preserve v0.5 behavior while using the selected primary and
  reporting additional active tasks truthfully; multiple sessions for one task
  remain a popout session count rather than `+N` tasks.
- [x] Parser/daemon code never reads UI preferences; the pure projection works
  with omitted/default state and remains backward compatible.
- [x] Existing Node contract, manifest, read-only, and exact-case resource
  checks pass; live DMS reload/state limitations are reported explicitly.

## Out of scope

- DMS State wiring, project-filter controls, task-row pin buttons,
  relationship/priority rows, Markdown/archive, preference reset UI, and
  manifest version bump.

## Dependency

This is the first v0.6 child. `09-23-dms-v062-live-popout` consumes its state
and projection contracts and must not start implementation before this child
passes review.
