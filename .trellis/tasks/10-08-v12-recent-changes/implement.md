# Recent Changes Execution Plan

## Ordered work

- [x] After final plan approval, start this child and load its curated spec/research context.
- [x] Implement pure semantic comparison, reliable baselines, event provenance, quiet initial observations, and bounded history/tracking.
- [x] Integrate the daemon publication hook, central UI-selection observation, archive-page hook, and cleanup/root-scope resets.
- [x] Render the approved popout history and add translations.
- [x] Add meaningful fixtures for every event type, duplicate timestamps/generations, prototype-like/duplicate IDs, partial failure/recovery, archive baseline/caps, and ring eviction.
- [x] Update exact-case import/resource assertions and run the full contract harness.
- [x] Dispatch Trellis check for this child; record runtime checks separately; update executable specs before completion.

## File responsibility

lib/trellischanges.js, TrellisDaemon.qml, TrellisWidget.qml, necessary trellisprojection.js integration, translations/zh_CN.json, and tests/test_trellis_contract.mjs. Parent research is read-only. No agent may revert another child's edits or modify unrelated files.

## Verification

`rtk proxy node tests/test_trellis_contract.mjs`; JS syntax after stripping only the QML pragma in memory; JSON parsing; scoped diff/whitespace; `rtk proxy python3 .trellis/scripts/task.py validate .trellis/tasks/10-08-v12-recent-changes`. Host: history focus/scroll, two widgets, reload/disable/enable, one watcher registry, and degraded/recovery semantics. Missing tools/host mean unverified.

## Rollback point

Verify the pure helper before daemon integration, and the daemon event stream before UI integration. Preserve parser facts and the existing Snapshot publisher throughout.

## Execution status

Repository implementation/check/spec steps passed; see `implementation-evidence.md`,
`check-evidence.md`, and `.trellis/spec/frontend/recent-changes-contract.md`.
Host interaction gates remain unverified and are carried by the acceptance child.
Feature source/spec/tests are committed in the approved batch (`dc76d7a`).
Archive remains open pending the remaining host acceptance.
