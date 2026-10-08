# v1.2.2 Global Task and Project Search

## Goal

Find trusted projects and live/archive tasks quickly from the popout without expensive full-text indexing or changing the current selection while typing.

## Background

PROJECT_PROGRESS.md:1783 defines metadata search. Existing bounded archive readers are TrellisDms/TrellisDaemon.qml:651, :740, :829. trellisPaths.js:11 owns the archive limits and :526/:547 the canonical month/task policy. Existing Launcher search is a different contract and remains unchanged.

## Requirements

- GS1: Case-insensitive metadata matching for project name, task title, and task ID across Live, Archive, and All scopes. Search all discovered trusted projects, independent of the current project filter.
- GS2: Results show project context and qualified identity. Project results support existing project navigation; task results open existing live/archive detail. Searching never changes filter/pin; task detail selection never implicitly pins.
- GS3: Live matches are immediate from the shared Snapshot. A blank/whitespace-only query restores the current projection immediately and performs no archive reads.
- GS4: Archive search is lazy metadata-only work with finite per-request/file/directory/result limits, continuation, visible incomplete coverage, and safe malformed/unavailable states.
- GS5: Query/scope changes and closing the view cancel obsolete work; stale replies and removed/stale identities cannot affect the current view. A request superseded by another widget must leave loading state.
- GS6: Native keyboard navigation, visible focus, bounded labels, explicit loading/empty/partial/error states, and English/Chinese text follow the parent's UI plan.

## Acceptance Criteria

- [x] GS1–GS2: Fixtures cover same title/ID in separate projects, project/task-ID/title matching, case folding, scope isolation, and no pin/filter mutation from typing.
- [x] GS3: Empty queries issue no archive request; query clearing restores the prior projection and live Snapshot changes update current live results.
- [x] GS4: Large archives exercise existing 48-month/2048-directory/32-page-row/page-63/8-warning limits and the new global batch/result caps; Markdown is never read for search.
- [x] GS4–GS5: Malformed JSON, symlink/traversal rejection, inaccessible projects, cancelled reads, stale replies/cursors, and multi-widget supersession remain local and bounded.
- [x] GS4: No-match partial coverage is not presented as complete; continuation terminates at caps without repeatedly requesting the same capped page.
- [x] GS5–GS6: Live/archive detail selection revalidates identities, Back restores originating search, all controls are keyboard reachable, and Snapshot/parser facts remain unchanged.
- [ ] GS6: Runtime focus/scroll, narrow widths, multi-widget use, and reload are verified on DMS or explicitly marked unverified.

## Out of Scope

Markdown body indexing, filesystem-wide or HOME search, external grep/fd/rg dependencies, databases, search persistence, Launcher matching changes, Trellis writes, and new watchers.

## Dependencies

Implement after Recent Changes so successful bounded archive metadata batches can feed its observation hook. Preserve v0.7 archive/detail and v1.1 Health contracts.

## Verification status

Independent fixture/static review passed; see check-evidence.md. Real rendering
and lifecycle remain unverified in the acceptance matrix.
