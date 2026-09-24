# v0.4 implementation plan

## Ordered work

1. Re-read the approved v0.3 artifacts and the v0.4 PRD/design. Confirm no
   production code is changed during planning and preserve the documented
   live-DMS/QML/Git limitations.
2. Add focused pure helpers/tests only where a deterministic seam is needed for
   interval normalization, pending-path coalescing, warning throttling, and
   snapshot input replacement. Do not duplicate the path or JSON contracts
   already owned by `trellisPaths.js` and `trellisParser.js`.
3. Refactor `TrellisDaemon.qml` lifecycle:
   - add daemon-owned topology/debounce timers and explicit generation cleanup;
   - retain the v0.3 argv-only discovery and resolver path;
   - retain last-good input/snapshot state and bounded warning bookkeeping;
   - route every refresh mode through one coherent Snapshot publisher.
4. Implement known-file watching:
   - create validated `FileView` watchers for existing version/task/session
     files with `watchChanges: true` and `blockWrites: true`;
   - coalesce repeated events and perform bounded incremental reads;
   - update task/session/version records through the existing parser and safe
     pointer resolver;
   - replace/destroy watcher registries atomically on topology changes.
5. Implement topology and settings refresh:
   - add a clamped 15–300 second `topologyInterval` setting (30 s default);
   - add a settings-level manual refresh token/button;
   - trigger immediate scans for settings/manual events and interval timer
     events; keep directory enumeration bounded and low frequency.
6. Implement recovery and limits:
   - add watcher/pending-work caps and warning codes;
   - rate-limit repeated per-file warnings and preserve healthy records;
   - distinguish normal empty roots/deleted projects from transient scan-level
     failures and publish last-good data only for the latter;
   - ensure teardown removes timers, watchers, readers, processes, and stale
     callbacks.
7. Extend `tests/test_trellis_contract.mjs` and add static checks for:
   - watcher/timer presence and one daemon publisher;
   - interval bounds/default and manual-refresh setting;
   - no shell-string commands, writes, network, hooks, sockets, Markdown
     reads, or raw Markdown in the Snapshot;
   - debounced/coalesced event and warning-limit behavior where the chosen
     pure seam permits deterministic assertions.
8. Run focused validation and review the diff/working tree. If the DMS shell
   is available, run the manual reload/multi-widget/topology checks; otherwise
   report the exact blocked gates rather than claiming runtime success.

## Validation commands

```bash
python3 -m json.tool TrellisDms/plugin.json
node tests/test_trellis_contract.mjs
python3 ./.trellis/scripts/task.py validate 09-22-v04-implementation
rg -n "watchChanges|topology|refreshToken|setGlobalVar|Timer|watcher_limit|reload_limit" TrellisDms tests
rg -n "sh[[:space:]]*-c|Quickshell\.exec|Socket|network|CodeIsland|hook|writeAdapter|setText|save\(" TrellisDms
```

Additional checks:

- Parse the manifest and assert components/permissions remain valid; no
  `network` permission or P2 surface may appear.
- Run disposable fixtures that create/change/delete task and session files,
  move a task under archive, write malformed/oversized JSON, and exceed each
  configured cap. Do not commit fixture Trellis data or modify the project's
  own `.trellis/` records.
- Check the QML source has one `setGlobalVar` publisher, explicit watcher and
  timer destruction, no widget-owned filesystem work, and no high-frequency
  interval.
- Run `qmllint`/`qmlformat` and live DMS IPC/reload/multi-screen checks only if
  the tools/process exist; record unavailable checks explicitly.

## Review gates

- Before `task.py start`: PRD convergence, design/implement completeness,
  non-empty `implement.jsonl` and `check.jsonl`, and explicit user approval of
  the final planning summary.
- After implementation: run the full v0.4 acceptance matrix and dispatch the
  Trellis quality checker. Resolve only verified findings; do not weaken path
  safety or the v0.3 Snapshot contract.
- Before finish/archive: update the frontend quality spec with any durable
  watcher/lifecycle convention, then run the project finish/commit workflow.

## Risky files and rollback points

- `TrellisDms/TrellisDaemon.qml` — watcher ownership, generation guards,
  incremental model replacement, and last-good publication. Roll back the
  watcher path first if callbacks can outlive the daemon.
- `TrellisDms/TrellisSettings.qml` — persistent interval/manual-refresh inputs;
  keep the existing root key and do not write Trellis data.
- `TrellisDms/lib/trellisParser.js` — shared Snapshot contract; preserve
  nullable progress, all sessions, and raw-content exclusion.
- `tests/test_trellis_contract.mjs` — tests must exercise shared helpers, not a
  second implementation.
- `TrellisDms/plugin.json` — do not broaden permissions beyond the existing
  read-only process/settings boundary.

## Rollback points

1. Disable known-file watchers but retain the v0.3 scan if watcher callbacks
   cannot be safely cancelled.
2. Disable incremental model replacement and use a debounced full scan for
   content events while preserving the topology timer and error limits.
3. Restore the v0.3 settings surface if the manual-refresh control cannot be
   represented by the verified DMS settings API. Do not remove root safety or
   empty-state behavior.
