# v0.8.1 state-matrix evidence

Captured on 2026-09-24 after the parser-fixture integration and explicit lazy-response matrix additions. This is pure/static evidence, not live DMS acceptance.

## Change

The stateMatrixFixtures table now has 22 rows. Each row asserts and prints its evidence class and pass/fail result, with a pill, popout, and recovery expectation for startup, no roots, zero projects, no live tasks, planning, active/session counts, several active tasks, pin/filter recovery, project caps, relation cycles/custom statuses, State failure, long/narrow layouts, malformed task data, stale session/version, degraded scan, topology refresh, removed roots, archive empty/loaded/error, Markdown empty/error, and stale Markdown responses.

The parser fixtures and presentation fixtures previously ran separately. The contract test now reuses one parser input for makeProjectSnapshot and makeSnapshot, then feeds that Snapshot to makePopoutProjection and makePillProjection. It verifies active with three sessions, unknown and planning states, malformed task error, progress:null, archiveSummary.loaded:false, and Markdown exclusion. Assertions identify rows by task ID so projection group ordering does not affect the result.

Archive/detail path and request cases remain covered by the existing bounded resolver and disposable filesystem fixtures. Additional static source assertions check the archive empty/ready/error response branches, Markdown empty/error handling, detail request identity/generation guards, and their bounded visible recovery copy. These source assertions do not claim that QML rendered or handled an IPC response at runtime.

## Results

| Check | Result | Evidence class |
|---|---|---|
| Existing stateMatrixFixtures expectations | PASS | Pure projection + static source |
| Per-row evidence labels and pass/fail reporting | PASS: 22 rows | Test runner |
| Parser -> Snapshot -> projection | PASS | Disposable fixture |
| Active task/session count and primary pill | PASS | Disposable fixture |
| Planning, unknown, malformed task states | PASS | Disposable fixture |
| Null progress and raw Markdown exclusion | PASS | Disposable fixture |
| Archive/detail resolver and Snapshot separation | PASS | Existing disposable path fixtures |
| Archive empty, loaded, and error response states | PASS | Static source contract |
| Markdown empty/error and stale response states | PASS | Static source contract |
| Node contract suite | PASS: node tests/test_trellis_contract.mjs | Pure/static |
| Test syntax | PASS: node --check tests/test_trellis_contract.mjs | Static |
| Task context manifest validation | PASS: task.py validate for this child | Trellis task validation |

The test suite uses disposable directories under the system temporary directory and does not modify real Trellis records.

## Runtime gates

No DMS/Quickshell process was running when checked; the installed DMS CLI is 1.6.2 while the roadmap targets 1.6.1. Therefore actual task.json refresh latency, topology refresh, manual refresh/Settings recovery, bar orientation, popout interaction, archive/Markdown rendering, focus, and scroll remain UNVERIFIED. Source/fixture checks are not counted as live evidence.
