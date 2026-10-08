# v1.2.3 Read-only Navigation Quick Actions

## Goal

Copy task identities and safe project/task paths, or open their folders, without turning the observer into a Trellis manager.

## Background

PROJECT_PROGRESS.md:1845 defines the required actions. The centralized resolver is TrellisDms/lib/trellisPaths.js:480, :526, :547. TrellisSettings.qml:459 establishes the argv-based dms clipboard contract; installed DMS Controller.qml:2155/:2162 uses Qt.openUrlExternally for local folders.

## Requirements

- QA1: Provide Copy task ID, Copy project path, Copy task path, Open task folder, and Open project folder for valid live/archive contexts.
- QA2: Copy IDs agree with displayed identity. Path actions use freshly validated canonical paths within current trusted roots, with explicit read-only archive validation.
- QA3: Revalidate current project/task identity and filesystem containment immediately before acting. Reject arbitrary paths, traversal/control characters, symlink escape, stale/ambiguous IDs, and removed trusted roots.
- QA4: Actions use supported host APIs or argv arrays with no user-controlled shell strings. Missing clipboard/opener, cancelled operations, or failed validation produce only local action feedback.
- QA5: Existing core, Snapshot, health, pin/filter, and detail behavior continue during action failures. All controls have native keyboard access and English/Chinese feedback.

## Acceptance Criteria

- [x] QA1–QA2: Live and archive copies agree with visible task ID and canonical resolved paths, including spaces, non-ASCII names, and URL-sensitive characters.
- [x] QA3: Tests reject traversal, control characters, external or redirected roots, live/archive/task.json symlink escape, stale JSON identity, duplicate IDs, and removed configuration authority.
- [x] QA3–QA4: Surfaces never send arbitrary path/command arguments; each launch is revalidated under the current operation generation and request identity.
- [x] QA4–QA5: Clipboard/opener absence, nonzero clipboard exit, URL rejection, cancellation, and supersession keep errors local without changing Snapshot/Health or blocking detail.
- [x] QA4: No shell concatenation, task mutation, deletion, Trellis management command, network behavior, additional watchers, or new permission is introduced.
- [ ] QA5: Supported-host tests cover real clipboard output, folder opening, keyboard focus, two widgets, and disable/reload; unavailable checks remain unverified.

## Out of Scope

Terminal/VS Code integration, arbitrary-path launching, task start/finish/archive, deletion, writes to Trellis, hard-coded editor requirements, and persistent action history. Optional terminal/editor integration is deferred from this MVP.

## Dependencies

Implement after Search for consistent live/archive result-to-detail identity handoff. Actions also work in existing project/task detail views when no search is active.

## Evidence boundary

Checked criteria above use repository fixture/static evidence, including actual
daemon/widget JavaScript with mocked host transport; they do not establish real
clipboard/folder/rendering success. The supported-host criterion stays open.
See check-evidence.md and the acceptance matrix.
