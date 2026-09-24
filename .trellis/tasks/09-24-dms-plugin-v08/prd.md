# Complete Trellis DMS v0.8 Release Candidate

## Goal

Establish whether the existing P0/P1 observer is ready to become the v0.8 release candidate through end-to-end behavior, stability/security, and target-environment evidence. Fix only verified regressions found by those gates.

## Confirmed facts

- PROJECT_PROGRESS.md defines three ordered deliverables: 0.8.1 state matrix, 0.8.2 performance/lifecycle/security, and 0.8.3 target environment and RC.
- The plugin manifest and inspected installed copy are both 0.7.0; the manifest declares DMS >=1.6.1.
- The existing contract suite already has state-matrix fixtures and parser, projection, watcher, archive, Markdown, and path-safety assertions. Extend only gaps found against the roadmap.
- This host is Fedora 44, Wayland, niri 26.04, DMS 1.6.2, Quickshell 0.3.1, Qt 6.11.2, and Trellis 0.6.17. The DMS process is not running; qmllint/qmlformat are unavailable.
- The roadmap's exact target is DMS 1.6.1. Current 1.6.2 results do not by themselves prove behavior on 1.6.1.

## Requirements

- Execute child tasks in the order 0.8.1, 0.8.2, then 0.8.3. A later child consumes earlier evidence and does not replace its acceptance criteria.
- Trace each required state from fixture or real input through parser, Snapshot, projection, and visible recovery behavior.
- Classify evidence as pure/fixture, static, offscreen, or live host evidence. Never report a stronger class than the check actually establishes.
- Keep the P0/P1 observer read-only. Do not write Trellis data, infer progress, install hooks/daemons, or add P2 functionality.
- Record fixes, regressions, host limitations, and rollback steps. Do not mark v0.8 complete or freeze v1.0 while a blocking P0/P1 gate remains unverified.
- Set the plugin manifest to 0.8.0 only at the final release-candidate gate after the required acceptance evidence is reviewed.

## Acceptance criteria

- [ ] All three child tasks satisfy their own acceptance criteria in dependency order.
- [ ] The state matrix, resource/lifecycle, and security results have reproducible evidence and clear evidence classes.
- [ ] No known P0/P1 blocker remains. Any unavailable runtime gate is named and remains open rather than being inferred from static checks.
- [ ] RC notes identify the tested versions, known limitations, installation/disable path, and rollback steps.
- [ ] The manifest and PROJECT_PROGRESS.md describe the same verified release-candidate state.

## Out of scope

- v0.9 P2 features, new UI flows, Agent activity providers, hooks, external daemons, network dependencies, or changes to the Snapshot schema.
- Changing the host DMS installation or overwriting its installed plugin copy during planning.
- Modifying or cleaning real Trellis task/session/archive data to make a test pass.

## Dependencies and open questions

Child ordering is 0.8.1 -> 0.8.2 -> 0.8.3. There are no blocking product questions in the roadmap. Exact DMS 1.6.1 runtime evidence is an environment dependency; if unavailable, report it as unverified and keep the release gate open.
