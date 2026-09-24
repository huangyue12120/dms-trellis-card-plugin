# v0.8.1 state-matrix evidence

Captured on 2026-09-24 after the fixture integration change. This is pure/static evidence, not live DMS acceptance.

## Change

The existing stateMatrixFixtures table already asserts a visible pill, popout, and recovery expectation for startup, no roots, zero projects, no live tasks, planning, active/session counts, several active tasks, pin/filter recovery, project caps, relation cycles/custom statuses, State failure, long/narrow layouts, malformed task data, stale session/version, degraded scan, topology refresh, and removed roots.

The parser fixtures and presentation fixtures previously ran separately. The contract test now reuses one parser input for makeProjectSnapshot and makeSnapshot, then feeds that Snapshot to makePopoutProjection and makePillProjection. It verifies active with three sessions, unknown and planning states, malformed task error, progress:null, archiveSummary.loaded:false, and Markdown exclusion. Assertions identify rows by task ID so projection group ordering does not affect the result.

Archive/detail path and request cases remain covered by the existing bounded resolver and archive/Markdown fixtures. UI source checks retain the read-only widget boundary and recovery expectations.

## Results

| Check | Result | Evidence class |
|---|---|---|
| Existing stateMatrixFixtures expectations | PASS | Pure projection + static source |
| Parser -> Snapshot -> projection | PASS | Disposable fixture |
| Active task/session count and primary pill | PASS | Disposable fixture |
| Planning, unknown, malformed task states | PASS | Disposable fixture |
| Null progress and raw Markdown exclusion | PASS | Disposable fixture |
| Archive/detail resolver and Snapshot separation | PASS | Existing disposable path fixtures |
| Node contract suite | PASS: node tests/test_trellis_contract.mjs | Pure/static |
| Test syntax | PASS: node --check tests/test_trellis_contract.mjs | Static |
| Task context manifest validation | PASS: task.py validate for this child | Trellis task validation |

The test suite uses disposable directories under the system temporary directory and does not modify real Trellis records.

## Runtime gates

No DMS/Quickshell process was running when checked; the installed DMS CLI is 1.6.2 while the roadmap targets 1.6.1. Therefore actual task.json refresh latency, topology refresh, manual refresh/Settings recovery, bar orientation, popout interaction, archive/Markdown rendering, focus, and scroll remain UNVERIFIED. Source/fixture checks are not counted as live evidence.
