# Trellis DMS v0.7 integration design

## Architecture and boundaries

v0.7 preserves the v0.6 read-only pipeline and adds a bounded, asynchronous
detail/archive channel:

```text
Trellis files
   │
   ├─ daemon discovery/parser ──> schema-1 live Snapshot ──> pure projection ──> pill/live popout
   │                                  (no Markdown/archive bodies)
   │
   └─ explicit widget request (IDs/document/month/page)
          │
          └─ daemon resolver → stat gate → async FileView/parser
                 └─ ephemeral detail/archive response → widget detail/archive view

DMS Settings ──> pluginData ──> daemon interval/roots + widget visibility
DMS State ─────> bounded UI preferences (pin/filter/collapse/archive month)
```

The daemon remains the only filesystem reader. Widget QML never constructs a
path, reads a file, executes a process, or reparses Snapshot semantics. The
single `snapshot` global remains the live data publisher. A separate
`detailRequest`/`detailResponse` runtime channel is allowed only for the
currently requested bounded detail/index response; it is not persistent and is
never merged into `snapshot`.

## Runtime contracts

### Detail request

The widget sends a bounded object through a plugin global variable using a
monotonic `requestId`:

```text
{
  requestId: string,
  kind: "markdown" | "archive-index" | "archive-task",
  projectId: string,
  taskId?: string,
  document?: "prd.md" | "design.md" | "implement.md",
  month?: "YYYY-MM",
  page?: non-negative integer
}
```

The widget never sends `taskDir`, `taskJsonPath`, an absolute path, or raw
content. The daemon accepts a request only if the IDs exist in its current
validated input model (or in a validated archive index) and the fixed selector
passes the pure resolver policy.

### Detail/archive response

The daemon publishes one bounded response object for the latest request:

```text
{
  requestId,
  kind,
  status: "loading" | "ready" | "empty" | "error",
  projectId,
  taskId?,
  document?,
  month?,
  page?,
  content?: string,        // Markdown only; never in snapshot
  format?: "markdown" | "plain",
  truncated?: boolean,
  months?: [{ month, taskCount, hasMore }],
  tasks?: [{ id, dirName, title, storedStatus, taskDir }],
  hasMore?: boolean,
  warnings: [{ code, message }]
}
```

`taskDir` may exist only in daemon-owned intermediate/index data and is removed
from the widget-facing response. All strings, arrays, pages, and response
warnings are bounded. A response whose `requestId` is not the widget's current
request is ignored. A newer request cancels/destroys the previous reader or
lets its generation callback become a no-op.

### Markdown rendering

Use native `Text.MarkdownText` after an offscreen capability check on the
installed Qt/DMS baseline. The detail component must keep a plain-text
`Text.PlainText` fallback for unsupported syntax, missing native capability,
or a read/parser error. The implementation may use a small, escaping basic
Markdown helper for fallback; it must not add WebView, network links, or a
large third-party parser. Checkboxes are display-only text and never feed a
progress field.

## Safe read flow

1. Resolve the request's project/task/document through pure IDs and the
   current daemon model.
2. Canonicalize the selected task directory and Markdown path with
   `TrellisPaths.resolveTaskDirectory(..., { allowArchive })` and
   `resolveMarkdownFile()` immediately before reading.
3. Run an argv-only `stat` size check. Reject missing, non-regular, unreadable,
   or oversized files before `FileView` is created.
4. Create a daemon-owned asynchronous, `blockWrites: true`/`atomicWrites:
   true` `FileView`; cap the returned text again, publish a local error or
   truncated state, and destroy the reader after the callback.
5. Publish a response only if the daemon/plugin generation and request ID are
   current. Never republish the live Snapshot for a detail response.

The same flow handles live and archive Markdown; the only difference is the
resolver's explicit archive opt-in and the source record.

## Archive index design

The canonical archive root is `projectRoot/.trellis/tasks/archive`. On an
archive-index request, the daemon:

- canonicalizes and validates the archive root;
- enumerates month directories with a bounded argv-only `find`/equivalent;
- accepts only `YYYY-MM` month names and only direct task directories below a
  validated month;
- returns a bounded month/page summary, reading only the page's `task.json`
  records for title/status when available;
- records `archive_empty`, `archive_unavailable`, `archive_layout_unknown`,
  `archive_limit`, and per-task read warnings locally;
- never adds archive records to `currentInputs`, live watchers, or the live
  Snapshot.

Archive task selection is identified by `(projectId, month, taskId/dirName)`.
Its detail path uses the same Markdown allow-list and size gate. No archive
operation can write, move, restore, delete, or mutate a Trellis record.

## Settings and State design

### Settings

Keep existing keys and introduce the roadmap names with safe defaults:

| Key | Default | Owner/effect |
|---|---:|---|
| `scanRoots` | `[]` (legacy migration applies) | daemon trust boundary |
| `topologyInterval` | `30` | daemon, clamped to 15–300 s |
| `pillMode` | `auto` | widget projection |
| `displayMode` | legacy alias | read only when `pillMode` absent |
| `showProgress` | `true` | widget; render only numeric Snapshot progress |
| `showArchive` | `true` | widget archive entry/index |
| `versionWarning` | `true` | widget warning filtering |
| `refreshToken` | absent | daemon manual refresh trigger |

`pillMode` accepts the existing six v0.6 values. If it is absent, a valid
`displayMode` value is normalized and copied to `pillMode`; no invalid value is
copied. Settings changes are immediately observable through the existing DMS
plugin-data signal. Restore defaults writes only these plugin data keys (and
resets roots to an explicit empty array); it does not clear DMS State or touch
Trellis.

### State

Retain `pinnedTaskId` and `selectedProjectId`. Add only bounded UI preferences:

- `collapsedProjectIds`: unique project IDs, maximum 32;
- `collapsedTaskGroups`: unique `projectId/groupKey` tokens, maximum 128;
- `selectedArchiveMonth`: one `YYYY-MM` value or empty.

The widget updates local state first, persists one key through
`savePluginState`/`removePluginStateKey`, and reloads all keys on this plugin's
`pluginStateChanged`. Invalid values are ignored and surfaced as a bounded
warning; reset removes these keys individually. `discoveredProjects` is never
cleared because it is the daemon's output-only cache. The settings component
uses the same key-scoped API for restore defaults when available.

## UI and responsive boundaries

- Keep the approved 420 × 480 target and one vertical `DankFlickable`.
- Add a task-detail mode inside the same popout with a clear back action and
  three bounded document tabs; tab controls are native DMS buttons.
- Add an archive mode with month/page controls and a separate “Archive” label;
  archive rows never share the live task groups or pin action.
- Detail Markdown wraps within viewport width; code/table fallback is readable
  plain text. Loading/error copy is local and bounded. No horizontal scroller,
  recursive task tree, or custom theme is introduced.
- `showProgress` can only reveal an existing numeric `task.progress`; current
  v0.6 data remains `null`, so enabling it cannot display a fabricated value.

## Compatibility, rollout, and rollback

- Snapshot schema remains version 1. Existing widgets can continue consuming
  live Snapshot data while a v0.7 widget ignores absent detail/archive globals.
- Existing `displayMode`, trusted roots, interval, pin, selected-project, and
  discovered-project data are migrated/retained. Unknown State keys are left
  untouched.
- Child order is deliberate: 0.7.1 establishes request/response and safe
  reader primitives; 0.7.2 adds archive enumeration; 0.7.3 adds settings and
  preference integration; parent integration changes the manifest to 0.7.0.
- Rollback removes the detail/archive surfaces and restores manifest 0.6.0;
  newly written settings/State keys are inert to v0.6 and need not be deleted.
  No rollback step writes or removes Trellis files.
