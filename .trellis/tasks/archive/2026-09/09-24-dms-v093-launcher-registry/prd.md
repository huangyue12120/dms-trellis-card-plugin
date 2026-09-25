# DMS v0.9.3 Launcher and registry readiness

## Goal

Add the user-approved optional DMS Launcher entry point for read-only Trellis discovery and prepare local plugin metadata for later registry review.

## Requirements

- Add the Launcher surface only, using `!trellis` to search project names and task titles; keep results read-only and make selection navigate to the corresponding project/task view.
- On a task result, save the project filter and project-qualified task pin in DMS plugin State, then open the existing Trellis popout when a bar widget is present. This user-approved behavior replaces the current pin.
- On a project result, save the project filter and open the existing Trellis popout when a bar widget is present.
- Reuse the shared Snapshot; do not scan the filesystem or add watchers in the launcher component.
- Prepare local registry-readiness metadata, compatibility/permission declarations, and install documentation. Actual registry publication is a separate external action requiring confirmation.
- Do not add a Control Center surface in v0.9.3.
- Disabled or failed launcher behavior must not change the core plugin behavior.

## Acceptance Criteria

- [x] Launcher results use the `!trellis` trigger, search project names and live task titles, and navigate read-only to matching views.
- [x] Selecting a task updates its project-qualified pin and project filter and requests the existing popout; selecting a project filters to that project.
- [x] Results and status use the same Snapshot semantics as the bar/popout.
- [x] Disabling the surface leaves the core plugin usable.
- [x] Manifest/permission/compatibility metadata is reviewed; no external publication occurred.

## Confirmed product decision

- User selected Launcher only, using the recommended `!trellis` trigger, project-name/task-title search, task selection that replaces the saved pin and opens the popout, and local registry-readiness work. Control Center is deferred. Actual registry publication is not included.
- The Launcher UI/state Gate in `launcher-ui-gate.md` was approved on 2026-09-24.

## Implementation and validation status

- Implemented bounded Snapshot search, current-Snapshot action validation, the Launcher QML surface, `!trellis` manifest registration, and local registry-readiness/install documentation.
- Search returns up to 20 matches plus a non-action overflow row. The DMS 1.6.2 scorer ordering behavior was inspected; descending `_preScored` values preserve the approved Snapshot result order.
- Static checks passed for JS syntax, manifest JSON/fields, task context, whitespace, and the absence of filesystem/process/network/Trellis-write operations in the Launcher. No tests were run.
- Live DMS 1.6.2 Launcher loading/search/selection, popout/no-widget behavior, State persistence, reload, and disable behavior remain unverified host gates. Registry publication remains excluded.
