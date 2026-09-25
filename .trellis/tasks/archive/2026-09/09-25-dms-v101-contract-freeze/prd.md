# DMS v1.0.1 P0/P1 contract freeze

## Goal

Freeze the implemented P0/P1 observer contract and the exact v1.0 candidate package metadata before final acceptance.

## Requirements

- Compare the current implementation and approved UI/data contracts with `PROJECT_PROGRESS.md`, v0.8 archived evidence, and v0.9 planning/implementation artifacts.
- Keep Snapshot schema and state semantics stable: preserve all valid sessions, separate stored/runtime/display state, and keep progress `number | null`; show no percentage without an authoritative value.
- Preserve the safe resolver, read-only Trellis boundary, daemon-only collection, shared Snapshot, and existing P0/P1 surfaces.
- Freeze manifest version `1.0.0`, `requires_dms >=1.6.2`, and the existing `settings_read`, `settings_write`, and `process` permission set; do not add network permission.
- Keep the user-approved Desktop, zh_CN catalog, and Launcher in the v1.0 candidate as optional P2 items subject to task 1.0.2 host acceptance. Define an individual disable/defer path for each.
- Reconcile release-gate statements with evidence class and source. Change documentation or contracts only where a concrete mismatch exists.

## Acceptance Criteria

- [x] Manifest package version is `1.0.0`; permissions and minimum DMS requirement match this PRD and the cited API evidence.
- [x] Snapshot, progress, safe path, read-only, watcher, archive/Markdown, UI, and Settings/State contracts are consistent across implementation, existing UI documents, and release metadata; the full contract suite remains assigned to final acceptance.
- [x] Each core and optional v1.0 item has a linked, observable acceptance check and an explicit failure/disable response.
- [x] `PROJECT_PROGRESS.md` marks historical gates only at the evidence level supported by their task records and identifies all final host checks as pending until observed.
- [x] No new core feature, data field, permission, network access, hook, external daemon, or Trellis write is introduced.

## Dependencies and boundaries

- Depends on the v0.8 RC and the approved v0.9 product decisions recorded in `research/baseline-evidence.md`.
- Must complete before task 1.0.2. It freezes scope; it does not claim final runtime acceptance or external publication.
- If a contract defect is found, make only the smallest correction needed to restore the existing approved contract and add a regression check under task 1.0.2.
