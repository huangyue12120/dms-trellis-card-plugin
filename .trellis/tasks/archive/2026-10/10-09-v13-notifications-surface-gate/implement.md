# v1.3 Execution Plan

## Ordered checklist

1. [x] Finish child PRDs and product-gate records; keep `DEFER` decisions explicit.
2. [x] Read the frontend/backend spec indexes and the cross-layer/code-reuse
   thinking guides before editing product files.
3. [x] Implement `trellisnotifications.js` as a pure bounded transition helper and
   add deterministic tests for initial, degraded, duplicate, recovery,
   cooldown, disabled, and restarted-baseline cases.
4. [x] Add the opt-in setting and default/reset/localization entries without
   changing the manifest permission set.
5. [x] Integrate the helper and an isolated argv-only DMS notification process into
   the daemon's existing Snapshot publication path. Verify that scan failure,
   notification failure, disable, and daemon teardown remain local.
6. [x] Update README/release notes and source-backed `PROJECT_PROGRESS.md` only for
   the implemented notification, the two deferred gates, and evidence status.
7. [x] Run focused syntax/JSON/contract tests, then the full Node contract suite
   and task/context validation. Inspect the complete diff and `git diff --check`.
8. [ ] Perform supported DMS 1.6.2 host checks when available: opt-in setting,
   degraded/recovered transitions, duplicate suppression, restart quietness,
   disable behavior, and notification-process failure isolation. Record missing
   host tooling or unavailable scenarios as unverified.
9. [x] Re-run full-scope quality checks after all documentation and test updates;
   do not bump the manifest or create a release/tag without the release gate.

## Validation commands

- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/10-09-v13-notifications-surface-gate`
- `node --check` on a temporary `.js` copy after removing only the QML
  `.pragma library` line
- `node --check tests/test_trellis_contract.mjs`
- `node tests/test_trellis_contract.mjs`
- JSON parsing for `TrellisDms/plugin.json` and
  `TrellisDms/translations/zh_CN.json`
- `git diff --check`
- Targeted QML/static checks for exact-case imports, settings defaults,
  notification argv, and absence of `ccWidget`/new manifest surfaces
- Supported-host DMS reload/runtime evidence, if the host is available

## Risk and rollback points

- Before helper integration: pure state tests must pass and prove no mutation.
- Before QML settings changes: preserve the current default/reset behavior and
  ensure no settings-only scan is introduced.
- Before daemon process integration: verify notification failure cannot enter
  Snapshot warnings or block `_publishSnapshot`.
- Before documentation/release metadata: inspect the source diff and retain
  explicit unverified host evidence.
- Roll back only the v1.3 helper, adapter, setting, translations, tests, and
  release notes if a host or contract check fails; preserve v1.2 core behavior.

## Completion criteria

- Health notification child passes its deterministic and available host gates.
- Task Change and Control Center children each contain an explicit `DEFER`
  decision backed by repository evidence.
- Parent release/defer notes distinguish implemented, deferred, and unverified
  items, with no new permission, network, Trellis write, watcher, or surface.
