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

- [ ] The full safety matrix rejects unsafe inputs without widening resolver policy.
- [ ] Watcher, pending-work, warning, process, timer, and read limits remain bounded at their existing caps.
- [ ] Reload, screen/bar changes, settings updates, and daemon destruction leave no stale callback, timer, reader, watcher, or duplicate subscription.
- [ ] Idle behavior and large-data behavior have reproducible observations; any missing live measurement is explicitly unverified.
- [ ] The shell remains usable with empty, malformed, inaccessible, and changing inputs.

## Dependencies and out of scope

Depends on v0.8.1 state-matrix results. Does not add a daemon, network access, hooks, external services, relaxed path checks, dropped sessions, or unrelated performance features.
