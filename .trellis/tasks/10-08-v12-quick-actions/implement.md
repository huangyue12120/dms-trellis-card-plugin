# Quick Actions Execution Plan

## Ordered work

- [x] Confirm Search checks passed and start this child after approved activation.
- [x] Add pure action-schema/allowlist/bounds tests before wiring filesystem execution.
- [x] Implement fresh root/project/live/archive/task.json revalidation with independent guarded daemon resources.
- [x] Implement verified clipboard argv and encoded local-folder URL execution with truthful pending/accepted/failure feedback.
- [x] Add project/detail controls and translations, including archive detail.
- [x] Exercise traversal/symlink/authority/stale-ID and cancellation/supersession failure paths.
- [x] Run full regressions and Trellis check, including security boundary review; capture action contracts in specs.

## File responsibility

lib/trellisPaths.js, TrellisDaemon.qml, TrellisWidget.qml, necessary projection action-view helpers, translations/zh_CN.json, tests/test_trellis_contract.mjs. Preserve all prior feature edits; agents are not alone and must not reset/revert unrelated work.

## Verification

`rtk proxy node tests/test_trellis_contract.mjs`; pure syntax/JSON parsing; scoped diff/whitespace; `rtk proxy python3 .trellis/scripts/task.py validate .trellis/tasks/10-08-v12-quick-actions`. Test valid flag-like IDs (`--help`, `-d`, `--type`), spaces/non-ASCII/reserved URL characters, live/archive symlinks, removed trusted roots, identity changes after request, duplicate/prototype-like IDs, missing host APIs, process failures, stale callbacks, and unchanged Snapshot facts. Real clipboard/folder/focus checks require host evidence.

## Rollback point

Verify request policy and resolver fixtures before any external execution, then validate execution feedback before UI integration. Avoid opening arbitrary folders or overwriting the user's clipboard during fixture-only checks.

## Execution status

Repository implementation, independent full-scope check, reload replay correction,
and executable spec are complete. See implementation-evidence.md, check-evidence.md,
and the frontend Quick Actions contract. Supported-host clipboard/folder/rendering
gates remain open in the acceptance child; candidate hot reload failed and the
baseline was restored. Feature source/spec/tests are committed in the approved batch (`dc76d7a`).
Archive remains open pending the remaining host acceptance.
