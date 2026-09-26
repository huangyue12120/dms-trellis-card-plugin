# Implementation plan

## Target tasks

The parent owns this requirement set, child map, and integration review; do not start it as the code implementation target.

1. Start `09-26-desktop-settings-and-mounted-folder-picker` first. Implement R1 and R3 together because both belong to the settings surface.
2. Start `09-26-exclude-archive-root-from-live-task-scan` after the settings child is complete. This ordering avoids concurrent edits to `tests/test_trellis_contract.mjs`.
3. Return to the parent for cross-child review and host acceptance.

## Ordered work

- [x] In the settings child, make `TrellisSettings.qml` safe in both plugin-wide and desktop-instance contexts. Ensure instance cards do not execute global plugin-settings initialization or writes.
- [x] Add the DMS per-instance display selector and position/size reset controls, persisting display selection in the instance's `displayPreferences` config.
- [x] Add a picker-local filesystem-root quick-access entry to the existing DMS folder browser. Keep existing home/last-path behavior and route only explicit selection through `addScanRoot`.
- [x] Add focused contract assertions for dual settings context, instance-scoped display config, root navigation/selection, and the unchanged trusted-root boundary.
- [x] In the archive child, exclude only the reserved direct `archive` child from live-task candidate enumeration before the bounded task cap; leave resolver rejection and archive scanning intact.
- [x] Add focused assertions showing the archive root is excluded from live tasks while normal task resolution and invalid-path rejection remain enforced.
- [x] Update the relevant UI/component and path-safety documentation; capture the DMS settings-context and geometry-store contracts in the frontend spec.
- [x] Review the complete diff and run the existing repository contract suite. No QML lint/type-check tool is installed; source contracts were checked against DMS 1.6.2.
- [x] User-reported DMS 1.6.2 follow-up after copying the updated settings files and restarting: desktop display settings work, the picker reaches `/run/media` and `/mnt`, the archive warning is absent, and task/progress display remains normal. No host logs were captured.
- [ ] The conversation did not separately confirm persistence across two instances, global-settings isolation, geometry reset effects, trusted-root-list changes after selecting a folder, or invalid-path warning retention. Static contract checks cover the relevant code boundaries; these host details remain unverified.

## Validation and evidence

- Repository contract command: `node tests/test_trellis_contract.mjs`.
- Inspect the final diff and JSON/QML resources touched; run an available QML lint/load check without treating it as host-runtime evidence.
- Record DMS 1.6.2 checks as passed only after exercising them in DMS. If unavailable, mark the corresponding runtime items unverified.
- Confirm the worktree contains no edits to installed plugin directories, DMS/Quickshell source, or Trellis project data.

### Host evidence update (2026-09-26)

- User-reported DMS 1.6.2 check: the `task_path_rejected` warning for the
  reserved archive root is gone, but the desktop instance card still renders
  global Trellis settings and the picker does not show the filesystem-root
  quick-access entry.
- At report time, SHA-256 hashes of workspace and installed
  `TrellisSettings.qml`, `TrellisDaemon.qml`, and `plugin.json` matched. The
  on-disk files matched; this does not prove whether DMS had refreshed the
  in-memory settings component.
- Fix instance detection from DMS `instanceData.id` and inject the root shortcut
  after the lazily loaded browser content is available; repeat host acceptance
  after the user installs the updated settings component.
- Follow-up comparison after that fix: the installed `TrellisSettings.qml` and
  `translations/zh_CN.json` now differ from the workspace copies. The installed
  QML still uses `instanceId`-only detection, `Array.isArray`, and the original
  single `onContentChanged` hook. At that point, the fix had not yet been
  exercised by DMS; the user then copied the workspace versions to the plugin
  installation and repeated the relevant runtime checks below. This task did
  not modify the installed plugin.
- The user then copied the updated settings QML and translation into the DMS
  plugin directory and restarted DMS 1.6.2. The user confirmed the desktop
  display settings and browsing to `/run/media` and `/mnt` now work. The earlier
  report also confirmed the archive warning was gone and task/progress display
  remained normal. These are user-reported results; no runtime logs were
  captured. Separate checks of persistence across two instances, reset effects,
  trusted-root changes after selection, and invalid-path warning retention were
  not individually reported and remain outside this confirmation.

### Root-cause retrospective

1. **Root cause categories:** confirmed test-coverage gap; likely implicit
   host-integration assumption. The screenshot confirms the visible failure,
   but does not identify whether the settings context was missing at runtime or
   whether the loaded component was stale. The picker implementation relied on
   one content-change event and a strict JavaScript-array check for a DMS
   `property var` list; either is a plausible missed condition.
2. **Why the first implementation failed:** source-level checks matched DMS API
   names but did not exercise the actual settings card or lazily loaded browser
   model. The code shape passed while the DMS UI remained wrong; the exact
   runtime branch will only be known after retesting the updated component.
3. **Prevention:** prefer `instanceData.id` with `instanceId` fallback; also
   recognize DMS's instance-scoped service by its lack of Plugin State APIs so
   global settings fail closed. Handle both modal-open and content-created
   events idempotently, avoid strict `Array.isArray` checks on host QML lists,
   and keep DMS UI acceptance open until visible controls and navigation are
   confirmed.
4. **Systematic expansion:** apply the host-loader and lazy-content check to
   other plugin settings or dialogs that depend on DMS-injected data.
5. **Knowledge captured:** updated the frontend settings contract, component
   contract, and cross-layer thinking guide. No `src/templates/markdown/spec/`
   directory exists in this plugin repository to synchronize.

## Rollback points

- Settings child: revert the settings dual-context/picker change and any new settings component or related test/docs changes. No trusted root is added unless the user explicitly selected one.
- Archive child: revert the live-task enumeration filter and its regression assertions. The resolver and historical archive reader remain unchanged.
- Parent: if any runtime regression appears, roll back only the owning child before reconsidering the other child.
