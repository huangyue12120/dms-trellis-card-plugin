# End-to-End State-Matrix Verification Contract

## 1. Scope / Trigger

Use this contract when changing the path from Trellis task/session inputs through the parser and Snapshot into pill or popout projections. It prevents individually passing parser and projection fixtures from hiding a broken boundary between them.

## 2. Signatures

    makeProjectSnapshot(projectInput) -> ProjectSnapshot
    makeSnapshot(projectInputs, globalWarnings, generatedAt) -> Snapshot
    makePillProjection(snapshot, configuredMode, uiState?) -> PillProjection
    makePopoutProjection(snapshot, limits?, uiState?) -> PopoutProjection

## 3. Contracts

- At least one deterministic disposable fixture must be passed through makeSnapshot and then through both pill and popout projections.
- The same projectInput must also be inspected as a ProjectSnapshot when the task verifies project-level normalization; avoid rebuilding a second, hand-authored Snapshot for the projection assertions.
- Assert projected task identity by task ID, not array position: projection groups intentionally reorder rows by state.
- Keep progress null when no authoritative progress is present; retain all valid sessions; represent malformed tasks and stale pointers as bounded local errors.
- Archive and Markdown remain lazy, read-only side channels. Assert they do not enter the live Snapshot.
- Record fixture/static/offscreen/live evidence separately. A fixture or source assertion does not prove DMS/Wayland timing or interaction.

## 4. Validation & Error Matrix

| Input | Required result |
|---|---|
| Active task with multiple valid sessions | One task projection with the full session count; primary pill does not count sessions as tasks |
| Planning or unknown status | Stored/display state survives parser, Snapshot, and projection |
| Malformed task or stale/malformed session | Bounded error/stale state; healthy rows remain available |
| Missing authoritative progress | Snapshot retains progress:null; UI shows no invented percentage |
| Archive or Markdown fixture | Lazy/detail facts remain outside the live Snapshot |
| Runtime unavailable | Keep live timing, focus, reload, and rendering gates explicitly unverified |

## 5. Good / Base / Bad Cases

- Good: one projectInput flows through parser, makeSnapshot, and both projections; assertions find rows by stable task ID.
- Base: empty inputs produce an empty, schema-valid Snapshot and the normal no-project projection.
- Bad: separately constructing a parser fixture and a different projection Snapshot, or assuming a row index remains stable after grouping, can hide a cross-layer defect.

## 6. Tests Required

- tests/test_trellis_contract.mjs must include a parser-to-Snapshot-to-projection fixture and keep the existing stateMatrixFixtures expectations for pill, popout, and recovery.
- Assertions should cover active/multi-session, planning, unknown, malformed, stale, progress:null, and body-free Snapshot behavior.
- Archive/detail path tests remain separate where the feature is intentionally outside the Snapshot.
- Host timing, Settings, bar orientation, popout, focus, and scroll must be recorded as live checks or explicitly unverified.

## 7. Wrong vs Correct

    Wrong:
    project = makeProjectSnapshot(realInput)
    display = makePopoutProjection(handAuthoredSnapshot)

    Correct:
    project = makeProjectSnapshot(projectInput)
    snapshot = makeSnapshot([projectInput], warnings, generatedAt)
    pill = makePillProjection(snapshot, mode)
    popout = makePopoutProjection(snapshot)
