# DMS v1.0.3 release handoff

## Goal

Deliver user-facing v1.0 documentation that accurately describes the accepted local package, how to configure it, and how to disable or roll it back.

## Requirements

- Update `TrellisDms/README.md` with compatibility, installation, trusted-root setup, empty/project/task behavior, status/progress meaning, read-only/privacy boundary, and troubleshooting.
- Provide release notes with package version, target/minimum DMS versions, permissions, P0/P1 capabilities, selected P2 outcomes, evidence/known limits, and post-v1 candidates.
- Document disable/uninstall and rollback without deleting or changing Trellis data. Describe cleanup of only plugin-owned DMS State if the user chooses to remove it.
- Update `PROJECT_PROGRESS.md` and local registry-readiness metadata to match the final manifest and verified/disabled/deferred feature set.
- Keep local registry readiness local-only; no registry submission, external release, push, or deployment.

## Acceptance Criteria

- [ ] A new user can install the local package, add trusted roots, recognize empty/core task states, and reach Settings from the docs.
- [ ] Version, DMS compatibility, permission set, read-only/privacy behavior, P0/P1 features, P2 disposition, and known limitations match the candidate files and task 1.0.2 evidence.
- [ ] Disable/uninstall and rollback steps can restore the previous package without changing Trellis task/session/archive data.
- [ ] Post-v1 items clearly exclude deferred provider/Control Center/registry publication from v1.0 support claims.
- [ ] Project version/status and release checklist contain no unsupported “passed” claim.

## Dependencies and boundaries

- Depends on task 1.0.1's frozen package contract and task 1.0.2's final evidence/package contents.
- This is local documentation and handoff. External registry publication or distribution requires a separate user authorization.
