# DMS v1.0.3 release handoff — implementation plan

## Ordered checklist

1. [ ] Consume the final manifest and `acceptance-evidence.md`; confirm each selected P2 item is included/verified or disabled/deferred.
2. [ ] Update `TrellisDms/README.md` for a new local user: install location, enable/reload, trusted-root setup, what empty/live/archive/warning states mean, numeric progress limits, privacy/read-only boundary, and recovery.
3. [ ] Add `docs/release-notes-v1.0.0.md` with exact version, DMS compatibility, permissions, delivered scope, P2 disposition, evidence classes, known unverified limitations, and post-v1 candidates.
4. [ ] Update `docs/registry-readiness.md` to version `1.0.0`, final optional surfaces, and local-only publication status.
5. [ ] Update `PROJECT_PROGRESS.md` only with evidence-backed gate results and a truthful final/candidate status; preserve prior context and avoid changing unrelated v0.x prose.
6. [ ] Check path links, version/permission consistency, install/disable/rollback steps, and P2 status across the manifest, README, release note, registry note, and roadmap.
7. [ ] Run Trellis context validation, `git diff --check`, and final document/diff review.

## Validation

- Parse JSON metadata affected by the accepted package scope.
- Compare all repeated version, DMS, permission, and component values against `TrellisDms/plugin.json`.
- Check markdown links resolve to existing repository files and all documented actions preserve user Trellis data.
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-25-dms-v103-release-handoff`.
- `git diff --check`.

## Rollback

If the final evidence changes or a surface is disabled late, update only the affected release note, registry metadata, README support statement, and roadmap status. Keep an unreleased/candidate status until the docs and package agree. Do not publish externally.
