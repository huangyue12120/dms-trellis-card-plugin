# End-to-End State-Matrix Verification Contract

## 1. Scope / Trigger

Use this contract when changing the path from Trellis task/session inputs through the parser and Snapshot into pill or popout projections. It prevents individually passing parser and projection fixtures from hiding a broken boundary between them.

## 2. Signatures

    makeProjectSnapshot(projectInput) -> ProjectSnapshot
    makeSnapshot(projectInputs, globalWarnings, generatedAt, runtimeMetadata?) -> Snapshot v2
    makePillProjection(snapshot, configuredMode, uiState?) -> PillProjection
    makePopoutProjection(snapshot, limits?, uiState?) -> PopoutProjection
    makeHealthProjection(snapshot, detailResponse?) -> HealthProjection
    makeDiagnosticsProjection(snapshot, detailResponse?, metadata?) -> DiagnosticsProjection

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

## Diagnostics Projection and Redacted Export Contract

### 1. Scope / Trigger

Use this contract when changing the plugin-wide About / Diagnostics panel or
the text copied from it. Diagnostics is a read-only projection of the shared
Snapshot and structured archive `detailResponse`; it does not discover or read
Trellis data itself.

### 2. Signatures

```text
makeDiagnosticsProjection(snapshot, detailResponse?, metadata?)
  -> { ready, pluginVersion, dmsVersion, quickshellVersion, qtVersion,
       pluginLoaded, capabilities[], surfaces[], snapshotState, schemaVersion,
       generatedAt, scanStartedAt, lastSuccessfulDiscoveryAt,
       snapshotIsCurrent, lastGoodFallbackActive,
       projectCount, taskCount, sessionCount, rawWarningCount, rawErrorCount,
       incidentCount, projects[], report }

projects[] -> { index, name, trellisVersion, status, incidentCount,
                archiveIncidentCount, lastSuccessfulReadAt,
                incidentCodes[], incidentCodesTruncated }

Copy action -> Process.command = ["dms", "cl", "copy", report]
```

### 3. Contracts

- Render About / Diagnostics only in the plugin-wide Settings Loader. It may
  show project display names and bounded incident codes; desktop instance
  Settings do not load this panel.
- Consume the shared `snapshot` and structured `detailResponse` globals plus
  plugin metadata and Qt's version fact. Show DMS/Quickshell/Qt or Trellis
  versions as `unavailable` when they cannot be read reliably; never infer or
  launch a process to guess them.
- The copied report is an explicit, bounded allowlist: plugin/host facts,
  declared capabilities and surfaces, Snapshot state/schema/freshness,
  project/task/session/raw-warning/raw-error/incident counts, and per-project
  ordinal, Trellis version, last successful read time, and stable incident
  codes. Keep the report at or below 8192 characters.
- Validate version and timestamp formats; accept capability, surface, and
  warning codes only from fixed allowlists. Replace unknown warning codes with
  `unknown_warning`. Preserve project-to-incident attribution through stable
  Snapshot array ordinals.
- Never serialize Snapshot or `detailResponse`. Exclude project names and IDs,
  roots, paths, usernames, environment variables, raw warning text, archive
  content, task Markdown, session contents, and arbitrary metadata.
- A last-good Snapshot remains diagnosable and reports its fallback state.
  The projection must not mutate the shared Snapshot or read source files.
- Start `dms cl copy <text>` only after a user clicks Copy, using an argv array.
  Show bounded pending/success/failure feedback; never copy or upload
  automatically. Add no watcher, timer, permission, persistent write, or
  network behavior for diagnostics.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Snapshot unavailable or schema unsupported | Show an unavailable Snapshot state and a bounded report; do not infer project facts |
| Schema-1 Snapshot | Keep counts and project health; report freshness as unavailable |
| Last-good fallback active | Keep Diagnostics available and identify fallback state |
| Host/Trellis version missing or unsafe | Display `unavailable`; do not guess or preserve arbitrary strings |
| Unknown capability, surface, or warning code | Omit unknown capability/surface; map warning code to `unknown_warning` |
| Project name, ID, root, raw warning, or archive detail contains a secret/path | Keep UI attribution as appropriate; copied report contains none of those values |
| Report reaches its output cap | Keep aggregate counts, truncate project detail, and mark truncation |
| Copy clicked while process is running | Do not start a duplicate process |
| Clipboard command exits nonzero | Show bounded failure feedback; do not claim the report was copied |

### 5. Good / Base / Bad Cases

- Good: two projects retain separate health and incident-code ordinals in the
  report while malicious names, IDs, roots, warning text, and archive content
  remain absent.
- Base: an empty but valid Snapshot produces counts and explicit unavailable
  freshness/version facts without reading disk.
- Bad: `JSON.stringify(snapshot)`, interpolating raw warning text, or passing a
  shell command string to the clipboard process is forbidden.

### 6. Tests Required

- Contract tests assert normal, degraded/fallback, schema-1, empty, and
  multi-project projections; per-project incident mapping; unavailable and
  malformed version facts; and Snapshot immutability.
- Adversarial fixtures put path- or secret-like values in project names/IDs,
  roots, warning codes/messages, task/session data, metadata, and archive
  responses; assert each prohibited substring is absent from `report`.
- Static Settings checks assert global-only placement, shared globals,
  click-triggered argv execution, bounded feedback, and no shell interpolation
  or direct serialization of Snapshot/archive detail.
- JSON translation, task validation, and scoped diff checks pass before archive.
  DMS/Wayland rendering and an actual user-clicked clipboard run remain separate
  host checks; static tests do not prove them.

### 7. Wrong vs Correct

```qml
// Wrong: copy raw state or run a shell command during component creation.
Process { command: ["sh", "-c", "dms cl copy " + JSON.stringify(snapshot)] }
```

```qml
// Correct: a pure allowlist report is copied only after an explicit click.
Process { command: ["dms", "cl", "copy", diagnostics.report] }
```
