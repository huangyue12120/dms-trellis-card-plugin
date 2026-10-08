# v1.2 Execution Plan

## Planning and activation gates

- [x] Obtain task-creation consent for all v1.2 roadmap work.
- [x] Create parent and four child tasks, all in planning.
- [x] Inspect source/spec/history and verify the current fixture/static baseline.
- [x] Write child PRDs/designs/execution plans and curate real context manifests.
- [x] Present the final scope and UI summary; obtain subsequent explicit implementation approval (2026-10-08).
- [x] Start the Recent Changes child, not this coordination parent.

## Sequential delivery

1. Run the Recent Changes child's plan; verify duplicate/reload/recovery semantics and bounds; check before proceeding.
2. Run the Global Search child's plan; verify scopes, identities, partial coverage, cancellation, and archive limits; check before proceeding.
3. Run the Quick Actions child's plan; verify canonical authority, stale IDs, argv/URL safety, and local errors; check before proceeding.
4. Run the acceptance child's matrix; regress v1.0/v1.1, inspect diff/boundaries, and prepare the package/release evidence.
5. Update relevant executable specs and roadmap progress from evidence. Preserve the user's original additions; unresolved host gates remain explicit.
6. Follow finish/commit/archive workflow only for completed work. Publication and completion must satisfy the release criteria.

## Agent coordination

After approval, dispatch Trellis implement/check agents sequentially. Each prompt begins with the active child task path and assigns its listed files/responsibility. Agents are not alone in the workspace and must preserve others' edits; no recursive delegation or overlapping edits.

## Verification

- Baseline/regression: `rtk proxy node tests/test_trellis_contract.mjs`.
- Each task manifest: `rtk proxy python3 .trellis/scripts/task.py validate <task-path>`.
- Inspect changed QML/JS imports and exact resource case; syntax-check pure JS after removing only the QML pragma in memory.
- Parse manifest/translations; inspect the scoped diff and whitespace.
- Run QML/offscreen/host checks only where tools/runtime permit; record unavailable checks explicitly.
- Keep fixture/static evidence separate from real keyboard, clipboard, folder-open, multi-widget, reload/restart, and watcher behavior.

## Rollback points

The primary shared files are TrellisDaemon.qml, TrellisWidget.qml, trellisprojection.js, trellisPaths.js, and the contract harness. Verify each child before the next edits them. Roll back only the failing child's scoped changes; do not reset the workspace or overwrite PROJECT_PROGRESS.md.
