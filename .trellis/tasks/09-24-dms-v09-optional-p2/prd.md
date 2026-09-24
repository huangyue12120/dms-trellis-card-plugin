# DMS v0.9 optional P2 enhancements

## Goal

Plan and deliver the approved v0.9 P2 work after the v0.8 release-candidate baseline, while preserving the Trellis-only plugin as the usable, read-only core.

## Background and confirmed constraints

- `PROJECT_PROGRESS.md` defines four independent optional v0.9 items: desktop surface, zh_CN/en i18n, launcher/Control Center/registry, and Agent Activity Provider feasibility evaluation.
- Optional surfaces must reuse the existing snapshot/projection and remain disableable; their failure must not block the core plugin.
- New UI surfaces require their own UI/UX gate. The existing UI artifacts cover bar, popout, archive, and settings, not these new surfaces.
- Agent activity work in this version is an evaluation only. It must preserve the Linux `codeIsland-dms` versus macOS Code Island boundary, collect no prompt or I/O content, install no hooks, and keep Trellis-only behavior when no socket is available.
- Registry publication is an external release action and requires separate confirmation. Local metadata/readiness work can be planned independently.
- The current repository baseline is clean on `codex/dms-plugin-v081-state-matrix`; archived v0.8.3 artifacts record target-environment RC checks and limitations.
- The user approved planning all four v0.9 roadmap items. Registry publication remains separately gated; activity remains an evaluation only.
- The user selected an all-project desktop overview, DMS-managed locale behavior, and a Launcher-only v0.9.3 surface using `!trellis` to search project names and task titles.
- The user selected Launcher task activation to replace the saved project-qualified pin and open the existing Trellis popout.

## Requirements

- Plan all four v0.9 items as independently verifiable deliverables with explicit scope, acceptance criteria, and a disable/defer path.
- Preserve read-only Trellis observation, current snapshot semantics, path-safety boundaries, and existing v1.0 core behavior.
- Keep unapproved surfaces, Agent hooks, and user-agent configuration edits out of scope.
- Record incomplete or unavailable runtime evidence as pending rather than claiming it passed.

## Acceptance Criteria

- [x] Desktop, i18n, Launcher/local registry readiness, and Agent Activity Provider evaluation are recorded as separate, testable deliverables; Control Center is explicitly deferred.
- [x] Each selected deliverable has a reviewable plan and approved UI contracts before implementation.
- [x] Optional Desktop and Launcher surfaces can be disabled through their manifest entries; neither adds a collector or daemon dependency.
- [x] No external publication, hook installation, agent configuration change, or activity content collection occurred.
- [x] `PROJECT_PROGRESS.md` records the v0.9 implementation and remaining runtime gates without overstating completion.

## Scope boundary

- All four roadmap items are in scope for planning and local implementation/evaluation as specified in `PROJECT_PROGRESS.md`.
- Actual registry publication and Agent Activity Provider runtime integration are not authorized by this scope; publication requires a separate confirmation, and provider implementation would require a later task and approval.

## Integration and verification status

- All four deliverables are implemented locally or completed as an evaluation. Desktop, i18n, Launcher search/navigation, manifest, and local registry-readiness artifacts have static source checks; the activity evaluation is archived with a defer recommendation.
- The manifest is integrated as `0.9.0`, requires DMS `>=1.6.2`, and retains the existing permission set. The local package is not published.
- Target-host desktop placement/resize/multi-display, Launcher selection/popout/State persistence, live locale switching/layout, and multi-surface reload remain unverified runtime gates.
