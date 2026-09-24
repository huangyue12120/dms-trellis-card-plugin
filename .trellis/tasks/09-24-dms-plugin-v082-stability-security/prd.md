# v0.8.2 performance, lifecycle, and security regression

## Goal

Verify that the singleton daemon remains bounded and recoverable under idle, reload, topology, malformed-data, and path-boundary conditions.

## Requirements

- Verify multiple widgets consume one daemon snapshot and do not create duplicate watchers or readers.
- Check idle polling/timers, known-file refresh, topology refresh, settings changes, reload/destruction cleanup, archive lazy loading, and exclusion of Markdown bodies from Snapshot.
- Re-run traversal, external absolute path, symlink escape, stale/malformed pointer, Markdown allow-list/size, archive containment, malformed/oversized JSON, and bounded-queue/watcher cases.
- Record current caps and measured behavior. Do not invent new numeric thresholds beyond the roadmap's two-second task refresh and existing contract limits.
- Classify static, fixture, offscreen, and live results; do not claim multi-screen/IPC from source checks.

## Acceptance criteria

- [x] The full safety matrix rejects unsafe inputs without widening resolver policy.
- [x] Watcher, pending-work, warning, process, timer, and read limits remain bounded at their existing caps by source contracts and fixture assertions.
- [x] Reload, screen/bar changes, settings updates, and daemon destruction passed in the user's reported local manual suite; this live evidence was not independently replayed in this session.
- [x] Idle behavior and large-data behavior have reproducible fixture/source observations; the user reports live idle/reload checks passed. Peak memory, throughput, and simultaneous process/reader counts were not numerically measured and remain explicitly unverified.
- [x] The existing empty/malformed/changing-input fixtures pass; the user also reports that the permission-denied manual case recovered normally.

## Dependencies and out of scope

Depends on v0.8.1 state-matrix results. Does not add a daemon, network access, hooks, external services, relaxed path checks, dropped sessions, or unrelated performance features.
