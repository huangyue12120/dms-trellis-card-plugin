# Integration Acceptance and Release Execution Plan

## Ordered work

- [x] Confirm all feature children are checked; start the acceptance child after approved activation.
- [x] Run the full fixture/static harness, syntax/JSON/import checks, and scoped diff/boundary review.
- [x] Create the evidence matrix and carry over unresolved v1.1 host checks.
- [ ] Run available offscreen and real DMS checks; capture keyboard, clipboard, folder opening, reload, multi-widget, Desktop, and refresh evidence.
- [ ] Fix only verified regressions within v1.2/core preservation and repeat affected checks.
- [x] Update executable specs, README/release notes, and source-backed PROJECT_PROGRESS.md completion markers.
- [ ] Build/inspect candidate ZIP and validate version/tag/source/package contracts.
- [ ] Release v1.2.0 only after all required gates pass; otherwise preserve explicit incomplete stable-release status.
- [ ] Follow commit/finish/archive workflow for actually completed deliverables.

## File responsibility

Acceptance evidence in this child; v1.2 release notes/package automation; necessary README/spec/progress/manifest updates; focused regression repairs only when verified. Preserve the user's original roadmap additions and prior feature edits. Do not introduce v1.3 or unrelated fixes.

## Commands and checks

`rtk proxy node tests/test_trellis_contract.mjs`; `rtk proxy python3 .trellis/scripts/task.py validate .trellis/tasks/10-08-v12-acceptance-release`; JS syntax/JSON parsing; scoped `rtk git diff --check`; exact ZIP membership; candidate/stable tag-to-manifest and source ancestry checks. Probe available QML tooling before choosing lint/offscreen commands. Missing tooling/host/network is recorded, never reported as pass.

## Rollback points

Check the implementation diff before release metadata, inspect the local package before any tag/publication, and retain evidence of failed/unverified gates. Do not create a stable tag to bypass an unavailable host check.

## Execution status

All feature repository checks passed. Main final fixture/static checks passed.
Real candidate hot reload failed at the new library import; installed baseline
was restored and loaded. Fresh isolated Qt library import passes, but complete
fresh DMS load and interaction/restart gates remain open. See acceptance-evidence.md.
Stable release, matching version decision/tag/publication, and archival remain open.

Local draft package is built and reproducibility/contents/version/workflow format
checks passed. Actual release ancestry/tag/publish remains unexecuted.
