# End-to-End State-Matrix Verification Contract

## 1. Scope / Trigger

Use this contract when changing the path from Trellis task/session inputs through the parser and Snapshot into pill or popout projections. It prevents individually passing parser and projection fixtures from hiding a broken boundary between them.

## 2. Signatures

    makeProjectSnapshot(projectInput) -> ProjectSnapshot
    makeSnapshot(projectInputs, globalWarnings, generatedAt, runtimeMetadata?) -> Snapshot v2
    makePillProjection(snapshot, configuredMode, uiState?) -> PillProjection
    makePopoutProjection(snapshot, limits?, uiState?) -> PopoutProjection
    makeHealthProjection(snapshot, detailResponse?) -> HealthProjection

## 3. Contracts

- At least one deterministic disposable fixture must be passed through makeSnapshot and then through both pill and popout projections.
- The same projectInput must also be inspected as a ProjectSnapshot when the task verifies project-level normalization; avoid rebuilding a second, hand-authored Snapshot for the projection assertions.
- Assert projected task identity by task ID, not array position: projection groups intentionally reorder rows by state.
- Keep progress null when no authoritative progress is present; retain all valid sessions; represent malformed tasks and stale pointers as bounded local errors.
- Archive and Markdown remain lazy, read-only side channels. Assert they do not enter the live Snapshot.
- Record fixture/static/offscreen/live evidence separately. A fixture or source assertion does not prove DMS/Wayland timing or interaction.
- Schema 2 keeps every schema-1 field and adds daemon-owned scan/discovery freshness plus each project's last successful core-input read time. `generatedAt` remains publication time; freshness never comes from mtimes.
- During last-good fallback, a known-file reload may advance that project's read time but does not clear the fallback/current flags or advance `lastSuccessfulDiscoveryAt`; a later topology scan recalculates those flags.
- Schema-1 Snapshots remain readable. Health reports their freshness metadata as unavailable, except that an existing `last_good_snapshot` warning still proves fallback is active.
- Attach `projectId` to project warnings and parser-generated task/session diagnostics before flattening. Keep the raw Snapshot warning objects intact.
- `makeHealthProjection` groups current warnings by project/root and cause, keeps healthy projects visible, and removes transient incidents when their source warning clears. `last_good_snapshot` is a fallback banner, not a second incident.
- Archive detail enters Health only for structured `archive-index`, `archive-page`, or `archive-task` responses and only through status/warning codes. Ignore response content, task rows, and Markdown detail.
- Health view models use project display names and stable array indexes; raw IDs, roots, paths, and warning messages stay internal.

## 4. Validation & Error Matrix

| Input | Required result |
|---|---|
| Active task with multiple valid sessions | One task projection with the full session count; primary pill does not count sessions as tasks |
| Planning or unknown status | Stored/display state survives parser, Snapshot, and projection |
| Malformed task or stale/malformed session | Bounded error/stale state; healthy rows remain available |
| Missing authoritative progress | Snapshot retains progress:null; UI shows no invented percentage |
| Archive or Markdown fixture | Lazy/detail facts remain outside the live Snapshot |
| Schema-1 Snapshot | Existing facts remain readable; freshness is unavailable unless `last_good_snapshot` proves fallback |
| Last-good fallback | Show fallback state and last successful discovery time without a duplicate incident |
| Structured archive error | Add an archive-scope incident while retaining live task/session health |
| Recovered warning source | Remove its transient incident from the next projection |
| Runtime unavailable | Keep live timing, focus, reload, and rendering gates explicitly unverified |

## 5. Good / Base / Bad Cases

- Good: one projectInput flows through parser, makeSnapshot, and both projections; assertions find rows by stable task ID.
- Base: empty inputs produce an empty, schema-valid Snapshot and the normal no-project projection.
- Bad: separately constructing a parser fixture and a different projection Snapshot, or assuming a row index remains stable after grouping, can hide a cross-layer defect.

## 6. Tests Required

- tests/test_trellis_contract.mjs must include a parser-to-Snapshot-to-projection fixture and keep the existing stateMatrixFixtures expectations for pill, popout, and recovery.
- Assertions should cover active/multi-session, planning, unknown, malformed, stale, progress:null, and body-free Snapshot behavior.
- Archive/detail path tests remain separate where the feature is intentionally outside the Snapshot.
- Health fixtures cover grouped and independent causes, one degraded project among healthy projects, archive isolation, fallback, schema-1 input, privacy, immutability, and recovery.
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
