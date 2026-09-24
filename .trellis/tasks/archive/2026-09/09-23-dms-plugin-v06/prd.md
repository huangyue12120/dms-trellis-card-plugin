# Complete Trellis DMS v0.6

## Goal

Complete the P0/P1 bar-pill and live-task popout milestone defined in
`PROJECT_PROGRESS.md`: choose a truthful primary task, preserve every live
task/session in the popout, support project filtering and task relationships,
and keep loading/error/warning states usable across horizontal, vertical, and
narrow layouts.

## Confirmed facts

- v0.5 already provides six display modes, Material icons, a 420 × 480
  read-only popout, bounded warnings, trusted-root discovery, manual refresh,
  and a pure projection helper.
- The schema-1 Snapshot already retains projects, live tasks, sessions,
  `activeTaskIds`, task `priority`, `parentId`, `childIds`,
  `activeSessionCount`, `storedStatus`, `runtimeState`, and `displayState`.
- `progress` remains `number | null`; v0.6 must not synthesize progress from
  status, mtime, session count, or Markdown checkboxes.
- The current projection chooses the first active task/project and does not
  implement pinning, recent-session fallback, project filtering, relationship
  display, priority display, or full state-matrix coverage.
- `Snapshot.primaryProjectId` and `Snapshot.primaryTaskId` are currently null.
  The approved architecture keeps selection in the projection/UI layer and
  never drops non-primary tasks or sessions.
- The roadmap requires task pinning in v0.6, while v0.7.3 owns broader
  Settings/State recovery. The approved boundary brings forward only
  `pinnedTaskId` and `selectedProjectId` in DMS plugin State; reset/recovery,
  collapse state, and additional filter preferences remain v0.7.

## Requirements

### R1. Primary-task bar pill

Implement the ordered primary policy: valid user pin, current/selected project
active task, most recent valid session, then project/no-active-task fallback.
The pill remains a pure Snapshot projection and must expose a truthful `+N` or
count signal when other active tasks exist. Multiple sessions for one task are
shown as a session count in the popout, not as extra tasks.

### R2. Complete live-task popout

Show all bounded live projects/tasks/sessions with project filtering, real
state grouping, priority, parent/child relationships, and active-session
counts. Archive-path content and Markdown bodies remain outside the live list
and global Snapshot; a task still located in the live directory remains a live
fact even when its stored status is `completed` or custom.

### R3. Degraded and recovery states

Cover startup/loading, topology rescan, no roots, no projects, no active task,
malformed task data, stale session pointers, read failures, unknown Trellis
versions, and last-good degraded scans. Healthy task facts stay visible when
warnings exist; recovery actions are limited to read-only navigation, Settings,
and rescan.

### R4. Responsive and accessible interaction

Keep horizontal labels bounded and elided, vertical bars icon-only, narrow
popouts one-column and scrollable, and normal popouts within the approved size
contract. Use DMS focus/keyboard primitives where the host exposes them,
Material icons, semantic Theme colors, and text/icon state cues rather than
color alone. Do not add looping/decorative animation.

### R5. Compatibility and safety

Preserve schema version 1, lowercase reload-safe helper resource names,
trusted-root authority, read-only Trellis access, one daemon publisher, bounded
projection output, and legacy v0.5 settings. Update the plugin manifest to
`0.6.0` only after the integrated v0.6 behavior passes its checks.

## Acceptance criteria

- [x] Pin, active-task, recent-session, and no-active fallbacks select the
  expected primary task/project without deleting any other task/session.
- [x] Two-project and multi-session fixtures expose project filtering, every
  live task, priority, parent/child relationships, and session counts.
- [x] Planning, in-progress, inactive, unknown, malformed, stale, empty,
  loading/rescan, warning, version-warning, and degraded states map to explicit
  state-matrix projections and recovery behavior.
- [x] Archive-path records never enter the live list. A record still located in
  the live task directory remains visible even when its stored status is
  `completed` or unknown; no Markdown/raw file content enters the projection.
- [x] Horizontal, vertical, long-name, narrow-popout, and normal-popout checks
  show no unbounded width, horizontal overflow, or unreachable primary action.
- [x] Existing discovery, watcher, path-safety, reload, settings, and Snapshot
  contract tests continue to pass.
- [x] Pure projection tests cover the primary policy, filtering/grouping,
  relationship/priority/session views, caps, and invalid preference fallback.
- [x] `pinnedTaskId` and `selectedProjectId` survive popout close and plugin
  reload through DMS plugin State; no fallback writes them into Trellis files
  or widens plugin settings when the host State backend is unavailable.
- [x] The installed DMS runtime is checked for pill/popout rendering, repeated
  reload, keyboard/pointer interaction, filter recovery, and empty-to-populated
  recovery; unavailable runtime/tooling is reported explicitly.
- [x] `plugin.json` remains valid and reports version `0.6.0` after the full
  milestone is integrated.

## Out of scope

- Markdown task detail, archive browsing/loading, task mutation, Agent
  tool/permission controls, desktop/launcher surfaces, search, custom themes,
  fabricated progress, or broad/untrusted filesystem discovery.
- Expanding remembered-project cache into scan authority.
- Silently repairing or deleting Trellis files from an error state.

## Key decisions

- v0.6 persists only `pinnedTaskId` and `selectedProjectId` in DMS plugin
  State. The widget updates its in-memory value first and uses the documented
  State API when available; it never falls back to Trellis writes.
- `pinnedTaskId` is a project-qualified token so identical task IDs in two
  projects cannot select the wrong task. Invalid/stale state is ignored
  without hiding healthy Snapshot data.
- Session `last_seen_at` is exposed as a bounded nullable projection field and
  is used only to choose among real session-backed tasks. It is never shown as
  progress or interpreted as Agent activity.
- Completing v0.6 updates the manifest to `0.6.0`; v0.7 remains responsible
  for Markdown detail, archive browsing, broader Settings/State recovery, and
  restart-persistence acceptance.

## Child task map

1. `09-23-dms-v061-primary-pill` — session recency, pure primary policy and
   responsive pill projection contracts.
2. `09-23-dms-v062-live-popout` — minimal DMS State wiring, project filter,
   pin interaction, grouped live-task projection, priority/relations/session
   counts, and keyboard flow.
3. `09-23-dms-v063-responsive-states` — P0/P1 state-matrix completion,
   responsive/runtime integration, regression checks, and version `0.6.0`.

The children execute in that order. The parent owns only cross-child scope and
final integration acceptance; product-code implementation belongs to the
children.
