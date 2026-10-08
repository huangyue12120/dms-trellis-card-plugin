# Global Search Execution Plan

## Ordered work

- [x] Confirm Recent Changes checks passed and start this child only after approved activation.
- [x] Implement/test bounded query and live metadata projection with qualified identities and exact live overflow.
- [x] Add archive-search request validation, daemon cursor/batch traversal, separate resource lifecycle, and safe metadata read reuse.
- [x] Feed reliable page/batch observations to the existing Recent Changes hook.
- [x] Guard existing detail entry against removed/redirected configured-root authority before accepting retained Snapshot identities; preserve detail transport/readers.
- [x] Add transient popout input/scope/results/continuation/Back behavior and translations.
- [x] Verify cancellation, stale request/cursor rejection, empty-query zero-I/O, and multi-widget supersession.
- [x] Run full regressions and Trellis check; update search/archives executable specs.

## File responsibility

TrellisDaemon.qml, TrellisWidget.qml, lib/trellisprojection.js, necessary lib/trellisPaths.js request-policy additions, translations/zh_CN.json, tests/test_trellis_contract.mjs. Reuse prior child work; no parallel edits or unrelated Launcher changes.

## Verification

`rtk proxy node tests/test_trellis_contract.mjs`; pure JS syntax/JSON parsing; scoped diff/whitespace; `rtk proxy python3 .trellis/scripts/task.py validate .trellis/tasks/10-08-v12-global-search`. Fixtures cover matching/scopes, malformed archive, directory/file/batch/result caps, cursor progress, empty months, stale identities, duplicate/prototype-like IDs, and unchanged Snapshot facts. Host: typing/clear, native keyboard traversal, partial continuation, detail Back, two widgets, and reload.

## Rollback point

Verify the pure projection first, then the daemon metadata channel before adding UI. Preserve old detail and archive request behavior while extracting shared safe-read helpers.

## Execution status

Repository implementation/check/spec steps passed; see implementation-evidence.md,
check-evidence.md and the frontend Global Search contract. Host gates remain
unverified in the acceptance matrix. Feature source/spec/tests are committed in the approved batch (`dc76d7a`).
The user later reported overall manual acceptance and explicitly requested
archival; detailed host/release evidence limits remain in the acceptance record.

## User-requested close-out

Overall manual acceptance was reported on 2026-10-08 and the user requested
archival/commit. This closes task tracking; it does not claim all individual
host cases or stable v1.2.0 publication passed. See the parent closure.md.
