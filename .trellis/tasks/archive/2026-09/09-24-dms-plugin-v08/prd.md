# Complete Trellis DMS v0.8 Release Candidate

## Goal

Establish whether the existing P0/P1 observer is ready to become the v0.8 release candidate through end-to-end behavior, stability/security, and target-environment evidence. Fix only verified regressions found by those gates.

## Confirmed facts

- PROJECT_PROGRESS.md defines three ordered deliverables: 0.8.1 state matrix, 0.8.2 performance/lifecycle/security, and 0.8.3 target environment and RC.
- At task start, the plugin manifest and inspected installed copy were both 0.7.0; the manifest declared DMS >=1.6.1.
- The existing contract suite already has state-matrix fixtures and parser, projection, watcher, archive, Markdown, and path-safety assertions. Extend only gaps found against the roadmap.
- This host is Fedora 44, Wayland, niri 26.04, DMS 1.6.2, Quickshell 0.3.1, Qt 6.11.2, and Trellis 0.6.17. At planning time, no DMS process was running and qmllint/qmlformat were unavailable.
- By user decision on 2026-09-24, the v0.8 target baseline is DMS 1.6.2; the planned local manual checks on that version were later reported as passing.

## Requirements

- Execute child tasks in the order 0.8.1, 0.8.2, then 0.8.3. A later child consumes earlier evidence and does not replace its acceptance criteria.
- Trace each required state from fixture or real input through parser, Snapshot, projection, and visible recovery behavior.
- Classify evidence as pure/fixture, static, offscreen, or live host evidence. Never report a stronger class than the check actually establishes.
- Keep the P0/P1 observer read-only. Do not write Trellis data, infer progress, install hooks/daemons, or add P2 functionality.
- Record fixes, regressions, host limitations, and rollback steps. Do not mark v0.8 complete or freeze v1.0 while a blocking P0/P1 gate remains unverified.
- Set the plugin manifest to 0.8.0 only at the final release-candidate gate after the required acceptance evidence is reviewed. Keep `requires_dms >=1.6.1` unless direct API evidence justifies changing the minimum.

## Acceptance criteria

- [x] All three child tasks satisfy their acceptance criteria in dependency order, with live checks marked as user-reported where not independently replayed.
- [x] The state matrix, resource/lifecycle, and security results have reproducible fixture/static evidence and explicit evidence classes.
- [x] No known P0/P1 blocker remains in the recorded evidence; unmeasured performance values and user-reported (not independently replayed) permission-denied behavior remain explicit limitations.
- [x] RC notes identify the tested versions, known limitations, installation/disable path, and rollback steps.
- [x] The manifest and PROJECT_PROGRESS.md describe the same verified release-candidate state.

## Out of scope

- v0.9 P2 features, new UI flows, Agent activity providers, hooks, external daemons, network dependencies, or changes to the Snapshot schema.
- Changing the host DMS installation or overwriting its installed plugin copy during planning.
- Modifying or cleaning real Trellis task/session/archive data to make a test pass.

## Dependencies and open questions

Child ordering is 0.8.1 -> 0.8.2 -> 0.8.3. The original 1.6.1 target was superseded by the user's explicit 1.6.2 target decision; manual runtime results remain user-reported rather than independently replayed in this session.
