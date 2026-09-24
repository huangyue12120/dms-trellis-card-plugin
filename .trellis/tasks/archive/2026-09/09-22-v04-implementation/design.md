# v0.4 watcher, topology, and recovery design

## Scope and boundaries

Keep `TrellisDms/TrellisDaemon.qml` as the only filesystem coordinator. Keep
`trellisPaths.js` as the only path-policy owner and `trellisParser.js` as the
pure record-to-Snapshot owner. `TrellisWidget.qml` remains a projection of the
single `snapshot` global and never creates a watcher, timer, process, or file
reader.

The data flow is:

```text
PluginSettings(projectRoot, topologyInterval, refreshToken)
    → daemon scan coordinator
    → bounded topology discovery + validated known-file registry
    → FileView content events or topology timer
    → coherent project/task/session inputs
    → trellisParser.makeSnapshot(...)
    → one pluginService.setGlobalVar(pluginId, "snapshot", snapshot)
    → all widget instances
```

The existing v0.3 snapshot shape is unchanged. Archive remains a summary
only, Markdown remains absent, and `progress` remains `null`.

## Runtime state owned by the daemon

Add explicit daemon-owned state alongside the existing generation/ownership
arrays:

- `topologyTimer` and a one-shot `knownReloadTimer` for scheduling;
- normalized/clamped topology interval and the last observed refresh token;
- the current coherent project input model (task/session records plus project
  warnings) used for incremental known-file refreshes;
- a registry of validated watcher records keyed by canonical path. Each record
  stores generation, project id/root, file kind (`version`, `task`, or
  `session`), task/session identity, and the watcher object;
- a bounded set of pending changed paths, a reload-in-flight flag, and a
  `lastGoodSnapshot`/last-good input model;
- a bounded warning ledger keyed by file/reason so repeated malformed data is
  rate-limited without suppressing the first useful diagnostic.

Do not expose this mutable coordinator state through the global variable.

## Topology scan lifecycle

1. `startScan(reason)` increments the existing generation, cancels pending
   readers/processes, destroys the prior known-file watcher registry, and
   records whether the reason is initial, settings/manual, or interval.
2. The existing v0.3 discovery/resolver path remains the source of truth for
   configured roots, `.trellis/.version`, live task directories, and session
   pointer files. Reuse argv arrays and all existing caps; do not add a shell
   command or a whole-home fallback.
3. When all asynchronous work for the generation completes, build one coherent
   Snapshot. Replace the current input model and install watchers only for
   canonical files that were successfully discovered and validated.
4. A scan-level discovery/process failure marks the scan degraded. If a
   last-good model exists and the configured roots are still present, publish
   that model with one bounded degraded warning; otherwise publish the partial
   model. An empty configured root or a successful zero-project scan publishes
   the normal empty state, so deleted projects do not remain forever.
5. Restart the topology timer with the clamped interval after a successful or
   degraded scan. Settings/manual scans restart it immediately instead of
   waiting for the old deadline.

The generation guard applies to topology callbacks, watcher callbacks,
debounce timers, and file readers. No callback from an older generation may
replace the current model or Snapshot.

## Known-file watcher design

Use a dynamically created `FileView` component for each existing validated
`.version`, `task.json`, and session JSON path:

- `blockWrites: true`, `atomicWrites: true`, `preload: true`, and
  `watchChanges: true` are mandatory;
- `onFileChanged` records the canonical path in the daemon's bounded pending
  map and restarts the one-shot debounce timer; it does not publish directly;
- after the debounce window (target 200 ms), read each pending file through a
  bounded `FileView`/`reload()` path, parse it with the existing pure parser,
  and update a copy of the current input model;
- session changes rerun the existing safe pointer resolution. If a pointer
  names a task not present in the current topology model, retain an explicit
  stale/not-loaded result until the next topology rescan rather than inventing
  a task;
- version changes update the project version and compatibility warning without
  reading unrelated files;
- publish once after all pending reads/resolutions complete, using the same
  parser path as a topology scan.

Watchers are rebuilt atomically after topology replacement. A path that is
deleted cannot be watched reliably; its failed content read becomes a local
record error and the next topology scan removes the obsolete watcher.

## Topology interval, settings, and manual refresh

Add a persistent `topologyInterval` setting backed by a bounded slider/value
with a 30-second default and 15–300 second limits. Add a settings-only
`refreshToken` action/button that writes a changing token through the existing
settings API. `onPluginDataChanged` treats root, interval, and token changes as
an immediate topology refresh; the token is not part of the Snapshot.

This is intentionally a settings-level control, not final popout UI. It gives
v0.4 a deterministic manual-refresh entry point while the v0.5 UI Gate remains
responsible for final surface design.

## Error, warning, and resource policy

- Reuse `maxProjects`, `maxTasksPerProject`, `maxSessionsPerProject`,
  `maxCommandBytes`, `maxJsonBytes`, and the 256-warning publication cap.
- Add explicit caps for the watcher registry (bounded by a fixed maximum) and
  pending known-file reload entries. Exceeding either cap emits one
  `watcher_limit`/`reload_limit` warning and leaves excess paths for the next
  topology scan rather than growing unbounded state.
- Rate-limit the same `(canonical path, error code)` warning with a monotonic
  wall-clock cooldown and retain a suppressed-count field when useful. The
  ledger itself is bounded and evicts the oldest entries.
- Preserve malformed records in the input model with `readError`, allowing the
  parser to produce task/session error metadata and keep healthy projects.
- Do not retry a failed file in a tight loop. Recovery comes from the next
  watcher event or topology interval; a debounce timer is not a polling loop.
- Archive enumeration stays unloaded and Markdown is never read by this
  version, so those costs cannot leak into idle Snapshot publication.

## Publication and compatibility

Every refresh path (initial scan, topology scan, settings/manual refresh, and
known-file reload) funnels through one `makeSnapshot` + one
`setGlobalVar` call. The widget's `PluginGlobalVar` contract and the v0.3
schema remain stable. `generatedAt` changes per coherent publication, not per
filesystem event.

## Validation and rollback

Pure Node fixtures continue to validate parser/path behavior. Add source/static
checks for `watchChanges`, timer interval clamping, one global publisher,
bounded watcher state, and destruction cleanup. Add a deterministic test seam
or source-level harness for debounce/coalescing, topology interval clamping,
manual refresh token handling, and warning suppression where live QML cannot be
started.

If watcher lifecycle or incremental model replacement proves unsafe, rollback
the watcher registry first and retain the v0.3 initial scan; then reintroduce
the timer and settings refresh independently. Never weaken canonical path
checks or change the global snapshot contract to make a runtime test pass.
