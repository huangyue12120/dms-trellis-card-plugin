# v0.8 ordered execution plan

## Ordered checklist

1. Start child 0.8.1 only after this plan is approved. Compare the existing stateMatrixFixtures and parser fixtures with every roadmap row; add only missing assertions or fix a reproduced behavior defect. Verify the parser-to-Snapshot-to-projection path and recovery behavior.
2. Review child 0.8.1 evidence and archive it only when its acceptance criteria are met. Start child 0.8.2 next; measure the existing bounded watcher, queue, timer, and reader behavior, then run the complete path-safety matrix and fix only reproduced regressions.
3. Review child 0.8.2 results. Start child 0.8.3 only after both earlier children pass. Inspect the host versions, plugin installation and manifest, then collect the available install/enable/reload/disable and multi-surface evidence. Preserve the existing installed copy before any authorized replacement.
4. At parent integration, reconcile the evidence ledger, known issues, rollback steps, manifest version, and PROJECT_PROGRESS.md. Set 0.8.0 only if the RC gate can be truthfully closed.

## Validation commands

Run from the repository root for each code-bearing child:

- node tests/test_trellis_contract.mjs
- node --check tests/test_trellis_contract.mjs
- Parse TrellisDms/plugin.json and verify its expected version and requires_dms value.
- python3 ./.trellis/scripts/task.py validate <active-child-task-directory>

For host evidence, record the outputs of dms version, qs --version, qtpaths6 --query QT_VERSION, niri --version, /etc/fedora-release, and .trellis/.version. Use installed-module offscreen loading and live DMS checks only when their harness/session is actually available.

## Review gates

- After 0.8.1: each roadmap state has a visible expectation, deterministic fixture or real evidence, and recovery result; progress remains null unless authoritative data exists.
- After 0.8.2: resolver attacks and resource caps remain bounded; idle/reload/topology behavior has measurements or is explicitly unverified.
- After 0.8.3: manifest, permission, installation, disable, multi-screen/bar, popout, reload, and warning behavior have evidence; release notes and rollback are usable.
- Before parent completion: no P0/P1 blocker is hidden by a fixture/static pass; all docs match the evidence and current code.

## Risk files and rollback points

| Risk area | Likely files | Rollback boundary |
|---|---|---|
| State matrix or contract fixes | tests/test_trellis_contract.mjs, affected pure module/QML | Revert the single reproduced regression fix and its assertion |
| Daemon lifecycle and resolver | TrellisDms/TrellisDaemon.qml, TrellisDms/lib/trellisWatch.js, TrellisDms/lib/trellisPaths.js | Revert only the affected watcher/resolver fix; preserve prior bounded contract |
| RC metadata and notes | TrellisDms/plugin.json, PROJECT_PROGRESS.md, task research notes | Revert version and RC status together if a gate remains open |
| Installed host copy | /home/yue/.config/DankMaterialShell/plugins/TrellisDms | Preserve and restore the exact pre-check copy; do not overwrite an unresolved target |

Never modify production Trellis data or broaden a resolver/permission boundary to satisfy a test.
