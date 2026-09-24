# v0.3 Data Link and Safe Resolver Implementation Plan

## Ordered checklist

1. Re-read the approved v0.3 PRD/design, archived Stage 0 data/path/progress
   research, and current v0.2 skeleton. Confirm the v0.2 live DMS limitation
   remains recorded rather than silently promoted to verified.
2. Add focused pure modules under `TrellisDms/lib/`:
   - `trellisPaths.js` for lexical pointer/path policy, containment, and fixed
     Markdown allow-list helpers;
   - `trellisParser.js` for task/session/project normalization, relation
     reconciliation, warnings, and nullable progress.
3. Update `plugin.json` to `0.3.0` and add only `process` permission. Keep no
   `network`, dependency, startupCheck, desktop, launcher, or activity surface.
4. Update `TrellisSettings.qml` from the v0.2 placeholder to one `projectRoot`
   setting with an explicit bounded/read-only description.
5. Refactor `TrellisDaemon.qml` into a generation-guarded scan coordinator:
   - normalize configured root(s);
   - call `realpath`/bounded `find` with argv arrays;
   - validate every candidate through `trellisPaths` before FileView;
   - read `.version`, task JSON, and session JSON asynchronously;
   - reconcile all sessions and publish exactly one v0.3 snapshot per current
     generation;
   - destroy stale readers and report bounded warnings.
6. Update `TrellisWidget.qml` only enough to display diagnostic project/task
   counts or warnings from the new snapshot. Do not implement final UI, popout,
   filters, archive, or progress presentation.
7. Add pure contract fixture tests (prefer `tests/test_trellis_contract.mjs`
   using Node `vm` to evaluate the QML-compatible JS modules) covering:
   - absolute/traversal/tasks-root/symlink containment decisions;
   - fixed Markdown basenames;
   - task defaults, unknown status, parent/child relations, malformed JSON;
   - valid/stale/malformed/multi-session pointer reconciliation;
   - `progress === null` and no raw Markdown in snapshots.
8. Build temporary disposable filesystem fixtures outside the repository for
   the realpath/traversal/symlink matrix. Do not commit fixture task data or
   alter `.trellis/`.
9. Run static and pure tests, manifest/context validation, source forbidden
   scans, and QML delimiter checks. If DMS is running, perform a manual initial
   scan; otherwise report live runtime as unverified. Do not install the plugin
   outside the workspace without explicit runtime authorization.

## Validation commands

```bash
python3 -m json.tool TrellisDms/plugin.json
python3 ./.trellis/scripts/task.py validate 09-21-dms-plugin-v03-data-link-safe-resolver
node tests/test_trellis_contract.mjs
rg -n "sh[[:space:]]*-c|Quickshell\.exec|Socket|network|CodeIsland|hook|writeAdapter|setText|write|archive.*move" TrellisDms
```

The source scan must distinguish the documented read-only resolver from any
write or shell-string behavior. The test command may be replaced by an
equivalent local harness only if the chosen QML-compatible module shape cannot
be loaded by Node; record the exact alternative and outcome.

Additional checks:

- parse the manifest and assert exact components, `process` permission, no
  `network`, and referenced files;
- run disposable Python or shell fixtures for `..`, external absolute paths,
  symlink escape, stale pointer, malformed JSON, and fixed Markdown names;
- check that only the newest scan generation calls `setGlobalVar` in source;
- confirm no `FileView.watchChanges` or topology Timer is introduced;
- report `qmllint`/`qmlformat` and live DMS availability separately.

## Risky files and rollback points

- `TrellisDms/TrellisDaemon.qml`: asynchronous ownership and publication; keep
  generation cleanup local and revert this file first if a scan can hang.
- `TrellisDms/lib/trellisPaths.js`: security chokepoint; reject closed cases
  rather than relaxing containment to make a fixture pass.
- `TrellisDms/lib/trellisParser.js`: shared schema/defaults; preserve raw data
  only internally and keep progress nullable.
- `TrellisDms/plugin.json`: adding `process` broadens permission; verify every
  command is argv-based and no network permission appears.
- `TrellisDms/TrellisSettings.qml`: key change from placeholder to
  `projectRoot`; no settings migration or Trellis write is allowed.
- `tests/test_trellis_contract.mjs`: tests must exercise shared modules, not a
  duplicated implementation.

## Completion criteria before `task.py start`

- PRD/design/implementation artifacts are converged with no blocking
  user-owned decision.
- Both context manifests contain real spec/research entries.
- The user approves the final planning summary.

## Completion criteria after implementation

- All static and pure-contract acceptance criteria pass; any DMS runtime gate
  is explicitly verified or left unverified with evidence.
- Snapshot contains complete project/task/session facts for the tested fixtures,
  nullable progress, safe warnings, and no Markdown full text.
- No `.trellis/` or user DMS/agent configuration is modified.
- Independent quality review confirms the resolver is the sole path policy
  owner and parser/UI boundaries are not duplicated.

## Execution result

- Implemented the bounded argv-only discovery and generation-guarded daemon,
  `trellisPaths.js`, `trellisParser.js`, v0.3 manifest/settings/widget, and
  `tests/test_trellis_contract.mjs`.
- Independent checker fixed and verified oversized JSON handling, relation
  inverse links, data-health state preservation, exact Trellis root checks,
  archive opt-in, missing `task.json` handling, and FileView size guards.
- Passed: `node tests/test_trellis_contract.mjs`, manifest JSON validation,
  Trellis context validation, resolver/discovery fixtures, forbidden-surface
  scan, QML delimiter sanity, and single publisher count.
- Live DMS enable/reload/multi-display behavior remains unverified because no
  DMS shell is running. `qmllint`/`qmlformat` are unavailable and the workspace
  has no usable Git metadata, so those checks are reported rather than claimed.
