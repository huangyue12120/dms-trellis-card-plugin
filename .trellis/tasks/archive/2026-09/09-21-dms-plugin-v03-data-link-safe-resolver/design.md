# v0.3 Data Link and Safe Resolver Design

## Boundary and source layout

The existing `TrellisDms/` skeleton remains the only plugin package. v0.3 adds
pure data-contract helpers and makes the daemon an asynchronous coordinator:

```text
TrellisSettings.qml
    └── pluginData.projectRoot
            ↓
TrellisDaemon.qml
    ├── Proc argv: realpath / bounded find (discovery only)
    ├── FileView readers (validated .version, task.json, session JSON)
    ├── lib/trellisPaths.js (lexical + containment policy)
    ├── lib/trellisParser.js (unknown → normalized domain records)
    └── PluginService.setGlobalVar("trellisDms", "snapshot", snapshot)
            ↓
TrellisWidget.qml (diagnostic projection only)
```

Expected implementation files:

- `TrellisDms/plugin.json` — version `0.3.0`, add `process` permission.
- `TrellisDms/TrellisSettings.qml` — replace `reservedRoot` with
  `projectRoot` and explain the bounded scan contract.
- `TrellisDms/TrellisDaemon.qml` — scan coordinator, asynchronous readers,
  generation guard, and snapshot publisher.
- `TrellisDms/TrellisWidget.qml` — retain skeletal UI; optionally display
  project/task counts from the new snapshot without final pill design.
- `TrellisDms/lib/trellisPaths.js` — pure path normalization, containment,
  pointer and Markdown allow-list helpers. It never reads files or runs a
  command.
- `TrellisDms/lib/trellisParser.js` — pure JSON-to-domain normalization and
  relation/session reconciliation. It never knows DMS visual APIs.
- `tests/test_trellis_contract.mjs` — disposable-free Node fixture tests for
  the two pure modules, if the implementation keeps the modules Node-evaluable
  without changing their QML import contract.

## Discovery contract

1. Read `pluginData.projectRoot`; if empty, publish an empty snapshot with a
   warning and stop.
2. Expand only the explicit root form supported by DMS settings, require an
   absolute path, and reject unsafe control/newline input.
3. Run bounded argv-only discovery. Recommended command shape is equivalent to
   `find <root> -maxdepth <N> -type d -name .trellis -print`, with a hard cap on
   output lines. The root is passed as one argument, never interpolated into a
   shell string.
4. Canonicalize each discovered `.trellis` directory and its parent with
   `realpath -e -- <candidate>`. Deduplicate by canonical project root and
   reject candidates that resolve outside the configured root.
5. For each project, derive only the fixed paths needed for v0.3:
   `.trellis/.version`, `.trellis/tasks`, and
   `.trellis/.runtime/sessions`. Discover immediate task/session candidates
   with bounded argv commands; do not walk archive contents.

`find`/`realpath` failures are project-level warnings. They must not block the
plugin from loading or cause a shell crash. `process` is declared because the
current Quickshell API does not provide a verified canonical-realpath primitive
for this plugin boundary.

## Safe resolver contract

`trellisPaths.js` owns pure checks before any `FileView` receives a path:

1. Normalize separators and strip only the supported `file://` representation.
2. Reject empty, absolute, control-character, and traversal input when the
   input is a session-relative pointer.
3. Join relative pointers only to the canonical project root, then require the
   canonical result to remain under the exact `.trellis/tasks/` subtree (or the
   read-only archive subtree when a future caller opts in).
4. Reject equality with the tasks root; require a candidate task directory and
   a separately canonicalized `task.json` before parsing.
5. Allow Markdown only when the caller supplies one of the fixed basenames and
   the final canonical file remains directly under the validated task directory.
6. Return `{ok, path, reason}` or an equivalent structured result. Callers
   convert rejection reasons into warnings; they never concatenate a rejected
   pointer or invoke a shell with it.

The external `realpath` result is treated as untrusted output too: trim one
line, reject multi-line/empty output, then apply containment again.

## Parser and Snapshot contract

`trellisParser.js` accepts already-read text/objects and returns bounded plain
objects. It must not expose the raw task JSON or Markdown body in the global
snapshot.

```text
Snapshot
├── schemaVersion: 1
├── generatedAt
├── projects[]
├── primaryProjectId: null       # primary policy is v0.6
├── primaryTaskId: null
└── warnings[]

ProjectSnapshot
├── id / name / root
├── trellisVersion: string|null
├── tasks[]
├── sessions[]
├── activeTaskIds[]
├── archiveSummary: { loaded: false, taskCount: null }
└── errors[]

TaskSnapshot
├── id / dirName / title
├── storedStatus / runtimeState / displayState
├── priority / parentId / childIds[]
├── activeSessionCount
├── progress: null
├── recentlyChanged: false
└── paths: validated internal paths only

SessionSnapshot
├── sessionKey / taskId|null / source
├── mtime: null
└── stale / error metadata
```

Normalization rules:

- title: `title`, then `name`, then `"unknown"`;
- storedStatus: string status or `"unknown"`, preserving custom values;
- priority: string priority or `"P2"`;
- parent/children: normalize known IDs, dedupe, and add inverse links where
  safe; preserve unknown relationships as warnings rather than inventing IDs;
- runtimeState: `active` for at least one valid pointer, `stale` for a pointer
  to a missing/moved task, `inactive` for an existing task without a pointer,
  and `error` for unusable task data;
- displayState is a projection only and never writes back to storedStatus;
- progress is always `null` for the current Trellis checkout;
- mtime/recentlyChanged remain null/false until a verified watcher source.

## Asynchronous lifecycle

- `scanGeneration` increments at each initial/settings-triggered scan.
- Every Proc callback and FileView reader carries its generation and project
  context. A callback from an older generation is ignored and its reader is
  destroyed.
- The daemon collects all project results before one `setGlobalVar` call. A
  malformed task only adds a project warning/error; it does not prevent healthy
  project records from publishing.
- The v0.3 scan has no Timer and does not set `watchChanges`; v0.4 will add
  known-file watchers and topology rescan using this generation boundary.
- Reader/process ownership is bound to the daemon. Widget instances never
  create readers or processes.

## Settings and compatibility

The v0.3 settings key is `projectRoot`, with a description that it may be a
project or bounded scan root and that no files are modified. The old v0.2
`reservedRoot` key was explicitly a placeholder and need not be migrated. An
empty root remains a valid empty state.

Unknown Trellis versions and fields are accepted with warnings. The parser
must not depend on a future `progress` field until its scale and semantics are
version-validated.

## Trade-offs and rollback

- `find`/`realpath` add a process permission and Linux command dependency, but
  provide the canonical/symlink security evidence unavailable from the verified
  QML APIs. Missing commands fail closed rather than weakening security.
- FileView keeps JSON reading inside the Quickshell runtime and avoids shell
  `cat`; dynamic readers are bounded and destroyed after completion.
- No archive scan or watcher in v0.3 keeps the first data link bounded; those
  features are intentionally sequenced into v0.4/v0.7.
- Rollback is additive: restore the v0.2 daemon/settings/manifest and remove
  `lib/` plus any test file. No `.trellis/` or DMS user data is touched.
