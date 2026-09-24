# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

The DMS plugin is a read-only cross-layer observer. The daemon owns discovery
and file reads, pure JavaScript modules own path/data contracts, and widgets
only project the published snapshot. This contract was established by the
v0.3 data-link implementation.

---

## Forbidden Patterns

- Do not interpolate a configured root or a session pointer into shell source;
  external commands must receive argv arrays (`["realpath", "-e", "--", path]`).
- Do not let a widget read `.trellis/` or create a second parser/resolver.
- Do not pass a path to `FileView` until the canonical resolver has checked
  containment. Never read Markdown bodies in the data-link phase.
- Do not write Trellis data. `FileView` readers must set `blockWrites: true`.

---

## Required Patterns

### v0.3 data-link contract

The pure module signatures are:

```text
normalizeRoots(value) -> { roots: string[], warnings: Warning[] }
resolveTaskDir(projectRoot, candidate, canonicalCandidate, options)
  -> { ok, taskDir, taskJsonPath, kind } | { ok: false, reason }
makeSnapshot(projectInputs, warnings, generatedAt) -> Snapshot
```

`Snapshot` contains `schemaVersion: 1`, `projects[]`, nullable
`primaryProjectId`/`primaryTaskId`, and `warnings[]`. Each project contains
`tasks[]`, `sessions[]`, `activeTaskIds[]`, `archiveSummary` with
`loaded: false`, and `errors[]`. Each task keeps `storedStatus`,
`runtimeState`, `displayState`, `priority`, relations, `activeSessionCount`,
`progress: null`, `recentlyChanged: false`, and validated internal paths. Raw
task JSON and Markdown contents never cross the global-var boundary.

The daemon increments a generation for every scan, destroys old readers and
processes, and publishes only the current generation. The widget consumes the
single namespaced `trellisDms.snapshot` value.

### v0.4 watcher, topology, and recovery contract

#### 1. Scope / Trigger

This contract applies when the daemon refreshes known Trellis files, rescans
directory topology, or recovers from malformed/inaccessible data. It is a
cross-layer boundary: validated paths enter daemon-owned readers/watchers,
pure parser inputs are replaced coherently, and widgets still receive only
the single Snapshot global.

#### 2. Signatures

The shared scheduling helpers are:

```text
topologyIntervalDefaults()
  -> { minimum: 15, defaultValue: 30, maximum: 300 }
normalizeTopologyInterval(value, fallback)
  -> { value: number, clamped: boolean, invalid: boolean }
addPendingPath(pending, canonicalPath, limit)
  -> { pending: object, accepted: boolean, dropped: 0 | 1 }
recordWarning(ledger, order, warning, now, cooldown, limit)
  -> { accepted: boolean, ledger: object, order: string[], suppressedCount?: number, sample?: object }
```

The daemon refresh entry points are `startScan(reason)`,
`_onKnownFileChanged(path, generation)`, `_flushKnownReload()`, and
`_publishSnapshot(inputs, warnings)`. A watcher registry entry is keyed by a
canonical path and stores `generation`, `projectId`, `kind` (`version`,
`task`, or `session`), and the watcher object.

#### 3. Contracts

- Only existing, canonical paths accepted by `trellisPaths.js` may enter the
  watcher registry. The registry is daemon-owned and bounded by
  `maxKnownWatchers`; pending changed paths are bounded by
  `maxPendingKnownReloads`.
- Known-file `FileView` objects require `watchChanges: true`,
  `blockWrites: true`, `atomicWrites: true`, and `preload: true`. A file event
  only queues its canonical path; it never publishes a partial Snapshot.
- Events are coalesced for a 200 ms debounce window. One completed batch uses
  the same parser and emits one `setGlobalVar(pluginId, "snapshot", snapshot)`
  publication.
- A topology scan keeps `queueing: true` until every configured root has been
  submitted. This guard also covers synchronous process-creation failures, so
  `_maybeFinish()` cannot publish a partial multi-root scan.
- The topology timer defaults to 30 seconds and accepts only 15–300 seconds.
  Root/interval changes and the settings refresh token start an immediate
  topology scan; directory enumeration remains argv-only and bounded.
- JSON and command-output limit semantics are not pre-read memory bounds:
  ordinary task/session `FileView` reads call `text()` before checking the
  1 MiB JavaScript-string limit, and `StdioCollector` accumulates stdout before
  the 256 KiB line parser truncates it. Markdown/archive detail performs an
  argv-only `stat` size check before creating its reader and checks UTF-8 size
  again after load.
- `ownedProcesses` and `ownedReaders` are cleanup registries, not independent
  simultaneous-object caps. Do not infer peak memory or active-object counts
  from parser limits or destruction tracking; a hard concurrency cap must be
  explicit if one is introduced.
- A task reload replaces its parsed value or retains the previous value while
  marking `readError`. A session reload reruns the safe pointer resolver. A
  version reload updates only the project version and compatibility warning.
- Warning cooldown suppresses duplicate growth, not the warning itself: every
  newly built Snapshot retains one diagnostic for each still-present condition.
- A scan-level failure may publish `last_good_snapshot` only when the same
  configured roots have a last-good input model. An intentionally empty root
  publishes a normal empty Snapshot. The v0.3 Snapshot schema,
  `progress: null`, complete session retention, unloaded archive summary, and
  raw-Markdown exclusion remain unchanged.

#### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Missing/invalid topology interval | Clamp to 15–300 (or use the 30-second default) and publish one `topology_interval` warning. |
| Repeated event for a queued canonical path | Keep one pending entry and restart the debounce timer; do not publish per event. |
| Pending queue cap reached | Emit bounded `reload_limit`; leave excess work for a later topology scan. |
| Watcher cap reached | Emit bounded `watcher_limit`; do not create an unbounded watcher. |
| Malformed/oversized task or session JSON | Preserve the record with `readError` and a bounded warning; healthy records remain published. |
| Stale or unsafe session pointer | Keep the session with stale/error metadata; never select a guessed task. |
| Discovery/process failure with matching last-good roots | Mark degraded and retain the last-good inputs with `last_good_snapshot`. |
| Empty/unconfigured root or successful zero-project scan | Publish a usable empty Snapshot plus bounded warning when appropriate. |
| Old generation callback or daemon destruction | Ignore the callback and destroy readers, processes, watchers, timers, and pending work. |

#### 5. Good / Base / Bad Cases

- Good: a validated `task.json` event is coalesced, parsed, and published as
  one complete Snapshot; a valid session pointer is resolved through the
  canonical resolver.
- Base: a 30-second topology scan finds no project and publishes an empty,
  schema-valid Snapshot without reading archive bodies or Markdown.
- Bad: a watcher is created for an unvalidated path, a callback from an old
  generation publishes, or a hot file fills the warning/pending maps with
  duplicates. These are rejected or bounded instead.

#### 6. Tests Required

- `tests/test_trellis_contract.mjs` must assert interval bounds/default,
  pending-path coalescing and caps, warning cooldown/ledger eviction, one
  daemon publisher, watcher properties, generation cleanup, and the unchanged
  Snapshot/raw-content contract.
- Static source checks must reject shell-string commands, writes, network,
  hooks, sockets, widget-owned readers, high-frequency polling, and archive or
  Markdown body loading.
- Tests/evidence must distinguish pre-read `stat` checks from post-read JSON
  and command-output limits. Source assertions do not establish peak
  simultaneous process/reader counts or runtime memory.
- Runtime DMS checks should measure the two-second task refresh target,
  settings/manual refresh, topology changes, reload/hot-reload cleanup, and
  multi-widget sharing. If DMS/QML tooling is unavailable, record those gates
  as unverified rather than treating static checks as runtime evidence.

#### 7. Wrong vs Correct

##### Wrong

```qml
FileView { path: changedPath; watchChanges: true }
onFileChanged: pluginService.setGlobalVar(pluginId, "snapshot", partial)
```

##### Correct

```qml
onFileChanged: root._onKnownFileChanged(canonicalPath, generation)
// _flushKnownReload() reads the bounded batch, runs the parser/resolver,
// then _publishSnapshot() performs one atomic global publication.
```

### v0.5 UI projection and trusted-root discovery contract

#### 1. Scope / Trigger

This contract applies when adding a pill/popout projection, changing project
discovery settings, or persisting discovery summaries. It spans DMS Settings,
DMS State, daemon-owned discovery, the Snapshot global, pure projection helpers,
and widget/settings QML.

#### 2. Signatures

```text
normalizeDisplayMode(value)
  -> "auto" | "task" | "project" | "counts" | "icon" | "full"
makePillProjection(snapshot, configuredMode)
  -> { ready, mode, kind, label, extraCount, iconName,
       projectCount, taskCount, warningCount, activeTaskCount }
makePopoutProjection(snapshot, limits?)
  -> bounded read-only project/task/warning view model

selectRootInput(settings, maxRoots)
  -> { value: string | string[], source: "scanRoots" | "projectRoot",
       truncated: number }
makeRememberedProjects(projectInputs, lastSeenAt, maxProjects)
  -> { root, name, lastSeenAt }[]
normalizeRememberedProjects(value, maxProjects)
  -> bounded { root, name, lastSeenAt }[]
```

#### 3. Contracts

- `trellisProjection.js` is the sole owner of display-mode normalization and
  Snapshot-to-UI projection. QML renders its view models and never reparses
  files or invents progress.
- `PopoutComponent` inherits a read-only `implicitHeight` from its `Column`
  base. Define a separate target height for the scroll region and let the
  column compute its own implicit height; assigning `implicitHeight` prevents
  the QML component from loading.
- `auto` is the fallback mode. Horizontal labels are single-line and bounded;
  vertical bars use icon-scale projection. Warning glyphs remain discoverable
  in every compact mode.
- `scanRoots` is authoritative whenever its value is an array, including an
  explicit empty array. Only an absent/non-array key falls back to the legacy
  `projectRoot`; this prevents deleting the last root from silently re-enabling
  legacy discovery.
- At most 16 trusted roots enter normalization. They still pass through
  `TrellisPaths.normalizeRoots`, canonical `realpath`, containment checks,
  depth-4 discovery, and the existing project/task/session/resource caps.
- `discoveredProjects` is an output-only DMS State cache containing at most
  `maxProjects` `{root,name,lastSeenAt}` records after a coherent non-degraded
  topology scan. It is never read by the daemon to authorize or seed discovery.
- A degraded scan keeps the previous cache. A successful empty scan replaces
  it with `[]`. The only new write targets this plugin's DMS state, never a
  Trellis project.

#### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| `displayMode` missing/unknown | Normalize to `auto`. |
| One active task in `auto` | Show its bounded title and retain warning glyph. |
| Zero or multiple active tasks in `auto` | Show compact counts, not an arbitrary title. |
| Long project/task name | Elide one line; never grow the pill without a bound. |
| `scanRoots` absent, legacy absolute `projectRoot` present | Use the legacy value for compatibility. |
| `scanRoots: []` | Disable discovery; do not fall back to legacy/root/home. |
| More than 16 scan roots | Keep the first 16 and emit `scan_root_limit`. |
| Invalid/duplicate root | Let `TrellisPaths.normalizeRoots` reject/deduplicate with warnings. |
| Coherent successful scan | Replace bounded DMS State summaries. |
| Degraded scan | Preserve the prior DMS State cache. |
| Stale remembered path | It has no discovery authority and disappears after a later successful scan. |

#### 5. Good / Base / Bad Cases

- Good: two user-selected roots discover canonical projects, publish one
  Snapshot, and write only bounded project summaries to DMS State.
- Base: explicit `scanRoots: []` publishes the normal unconfigured Snapshot and
  clears the remembered cache after the coherent empty scan.
- Bad: treating an empty list as falsy and falling back to `projectRoot`, or
  using remembered paths as scan inputs. Both silently expand the trust boundary.

#### 6. Tests Required

- Pure tests for all six display modes, invalid-mode fallback, `+N`, active
  ordering, warning/row caps, and unconfigured projection.
- Pure tests for absent vs empty `scanRoots`, 16-root cap, legacy fallback,
  summary field stripping/deduplication/caps, and invalid remembered records.
- Static tests proving the daemon writes but never loads `discoveredProjects`,
  persists only after `!scan.degraded`, and keeps argv-only canonical discovery.
- Source checks for DMS folder mode, visible safety copy, read-only widget
  boundaries, semantic Theme/icons, and no raw Markdown/progress computation.
- An offscreen QML type/load harness must instantiate widget, settings, and
  daemon components against the installed DMS modules when available; it must
  reject assignments to inherited read-only layout properties.
- Live DMS checks for click-to-popout, horizontal/vertical rendering, folder
  picker focus, settings persistence, rescan, and light/dark appearance. Report
  them as unverified when the runtime/tooling is unavailable.

#### 7. Wrong vs Correct

##### Wrong

```qml
var roots = settings.scanRoots || settings.projectRoot || "/home/user"
var remembered = pluginService.loadPluginState(pluginId, "discoveredProjects", [])
roots = roots.concat(remembered.map(project => project.root))
```

##### Correct

```qml
var rootInput = TrellisDiscovery.selectRootInput(settings, root.maxScanRoots)
var normalized = TrellisPaths.normalizeRoots(rootInput.value)
// remembered projects are written only after a successful scan and never read
// into discovery.
```

#### 8. Trusted descendant promotion

##### Scope / Trigger

This contract applies when a user-selected scan root is a project root,
`.trellis`, `.trellis/tasks`, or a concrete task descendant and must still
resolve to the containing project without granting remembered state authority.

##### Signatures

```text
ancestorPaths(absolutePath, maxCount) -> string[]
```

The path helper returns nearest-first normalized absolute candidates, including
the input and at most `maxCount` parents. The daemon probes at most eight
candidates with argv-only `test -d <candidate>/.trellis`, then validates the
first hit with the existing `realpath -e --` canonicalizer.

##### Contracts

- A successful probe feeds the canonical `.trellis` parent into the existing
  `_discoverProject()` path, so all sibling live tasks and sessions use the
  normal parser and snapshot flow.
- The existing bounded downward `find` remains enabled for configured parent
  folders; `_newProject()` deduplicates ancestor and downward results.
- `discoveredProjects` remains output-only. A remembered path never becomes a
  scan input, and no global Codex/agent working-directory lookup is added.
- `joinPath("/", child)` must preserve the absolute root slash; otherwise the
  root ancestor candidate becomes relative and can silently fail validation.

##### Validation & Error Matrix

| Condition | Required result |
|---|---|
| Absolute task/`.trellis` descendant | Probe nearest-first and discover its canonical containing project |
| Relative, control-character, or empty input | `ancestorPaths` returns `[]`; no probe is queued |
| No real `.trellis` candidate within the cap | Downward discovery still runs; no ancestor warning is required |
| Canonical `.trellis` hit outside the selected path's containing project | Reject the hit and continue/finish without widening authority |
| New sibling task inside a discovered project | Appears on the existing 15–300 second topology interval or manual refresh |

##### Good / Base / Bad Cases

- Good: `/project/.trellis/tasks/live` resolves to `/project`, then the normal
  task enumeration exposes sibling tasks.
- Base: a trusted folder with no ancestor project still uses bounded downward
  discovery and publishes the existing empty/degraded model.
- Bad: scanning all parents, loading remembered roots, or using a shell string
  to test `.trellis` would broaden authority and is forbidden.

##### Tests Required

- Pure assertions cover nearest-first order, root termination, the candidate
  cap, invalid inputs, and `joinPath("/", ".trellis") === "/.trellis"`.
- Static daemon assertions cover the eight-candidate bound, argv-only probe,
  canonical validation, project deduplication, and unchanged downward `find`.
- Settings assertions explain promotion, refresh timing, one-time trust for a
  new project, and the absence of global Codex working-directory inference.

##### Wrong vs Correct

```qml
// Wrong: a remembered project or arbitrary parent becomes an implicit root.
roots = roots.concat(rememberedProjects.map(project => project.root));
```

```qml
// Correct: probe only bounded ancestors of the explicitly trusted selection.
var candidates = TrellisPaths.ancestorPaths(canonicalRoot, root.maxAncestorCandidates);
_queueProcess(scan, ["test", "-d", candidateTrellis], onProbeFinished);
```

---

## v0.6 Primary Selection and Session Recency Contract

### 1. Scope / Trigger

This contract applies when parsing session recency, choosing the bar's primary
task, or changing pill behavior. The parser remains the only owner of session
JSON normalization; the pure projection owns preference validation and primary
selection; widget State I/O must not leak into either layer.

### 2. Signatures

```text
makePinnedTaskToken(projectId, taskId) -> JSON array string | ""
parsePinnedTaskToken(value) -> { projectId, taskId } | null
selectPrimary(snapshot, uiState)
  -> { projectId, taskId, reason,
       invalidPinnedTask, invalidSelectedProject }
makePillProjection(snapshot, configuredMode, uiState?) -> PillProjection
```

Schema-1 sessions add nullable `lastSeenAt`, normalized from bounded,
parseable `last_seen_at`. The schema version does not change.

### 3. Contracts

- A pin is an opaque JSON `[projectId, taskId]` token. Task IDs are
  project-scoped and must never be resolved without the project ID.
- Primary order is: valid live pin; newest active task in the selected/current
  project; newest valid resolved session-backed task; project/no-project
  fallback. Equal or missing times preserve Snapshot project/task order.
- Stale, unresolved, or errored sessions never influence recency. A valid
  pinned planning/inactive task remains eligible and keeps its real state.
- `lastSeenAt` is selection input only. It is never activity, progress, or a
  reason to discard a session record.
- Malformed or stale preferences are ignored and reported through the two
  invalid flags. The Snapshot is never mutated.
- `auto` preserves the v0.5 counts behavior for multiple active tasks unless a
  valid pin is present. `+N` counts additional active tasks, not sessions.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Missing/invalid/oversized `last_seen_at` | Keep the session and expose `lastSeenAt: null`. |
| Two projects contain the same task ID | Resolve a pin only inside its encoded project. |
| Stale pin or selected project | Set the matching invalid flag and use deterministic fallback. |
| Stale/error/unresolved session has newest timestamp | Ignore it for primary selection. |
| Equal or missing valid session times | Keep Snapshot project/task order. |
| Multiple sessions reference one task | Count one active task in the pill; retain the session count for popout. |
| Snapshot/UI State omitted | Return a stable v0.5-compatible projection without throwing. |

### 5. Good / Base / Bad Cases

- Good: a project-qualified pin selects the exact live task while all other
  project/task/session facts remain available.
- Base: no preference selects an active task in the current project, then
  falls back deterministically when no active task exists.
- Bad: selecting by scalar task ID, sorting the Snapshot in place, treating
  `lastSeenAt` as Agent activity, or using session count as `+N` is forbidden.

### 6. Tests Required

- Parser fixtures cover valid, missing, invalid, and bounded timestamps while
  retaining every session and schema version 1.
- Pure projection fixtures cover pin, duplicate IDs, selected-project active,
  recent-session, stale preference/session, equal/missing time, no-active,
  no-project, immutability, and all six pill modes.
- Existing manifest, exact-case resource, read-only, daemon, discovery, and
  watcher contract assertions continue to pass.

### 7. Wrong vs Correct

#### Wrong

```javascript
var task = allTasks.find(function (item) { return item.id === pinnedTaskId; });
var activity = session.lastSeenAt;
```

#### Correct

```javascript
var pin = parsePinnedTaskToken(pinnedTaskId);
var project = _findProject(snapshot.projects, pin.projectId);
var task = _findTask(project, pin.taskId);
// lastSeenAt is used only by deterministic primary selection.
```

---

## v0.6 Live Popout and Preference State Contract

### 1. Scope / Trigger

This contract applies when filtering the live-task popout, rendering grouped
task facts, or reading and writing widget preferences through DMS State. The
pure projection owns preference validation and view-model bounds; the widget
owns only State I/O and renders the projection without reparsing Snapshot data.

### 2. Signatures

```text
makePopoutProjection(snapshot, limits?, uiState?)
  -> { projects, projectOptions, selectedProjectId,
       invalidPinnedTask, invalidSelectedProject, warnings, ... }
```

The widget-owned State keys are exactly `pinnedTaskId` and
`selectedProjectId`.

### 3. Contracts

- Apply a valid selected-project filter before the project and task visual
  caps. Invalid project State falls back to the bounded All view without
  mutating or deleting the stored value during load or degraded scans.
- Group tasks in fixed Active, In progress, Planning, Error, then Other order,
  while preserving Snapshot order within each group. Keep live-path custom and
  `completed` states in Other.
- Task rows contain only bounded Snapshot-derived title, exact state, priority,
  flat parent/child summary, active-session count, and project-qualified pin
  state. Never recursively construct a relation tree.
- Load both preference keys on component initialization and for this plugin's
  `pluginStateChanged` signal. User actions update local State first and persist
  only a changed normalized value.
- Determine unpin by the parsed project/task pair, not raw token-string
  equality; semantically valid JSON tokens need not use identical whitespace.
- Empty filter/unpin actions remove only their own key when
  `removePluginStateKey` is available, otherwise save an empty value for that
  key. Never call `clearPluginState`, because `discoveredProjects` shares the
  plugin namespace.
- Use native `DankButton` and `DankActionButton` controls for project and pin
  actions. The widget never reads or writes Trellis files and does not fall
  back to plugin Settings for preference persistence.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Selected project lies beyond the All-view project cap | Show that project because filtering happens first |
| Selected project is missing or malformed | Set `invalidSelectedProject`; show All; retain State until a user reset |
| Duplicate task IDs in different projects | Pin/unpin only the encoded project/task pair |
| Valid pin token uses different JSON whitespace | Render it as pinned and unpin it on the first action |
| Relationship cycle or conflict | Show bounded flat summaries; never recurse |
| Multiple valid sessions resolve to one task | Show one task row with the full active-session count |
| State API throws synchronously | Keep the local interaction and show bounded persistence warning copy |
| User clears one preference | Remove/save only that key; preserve `discoveredProjects` |

### 5. Good / Base / Bad Cases

- Good: a selected project beyond the All-view cap renders by itself, while a
  project-qualified pin continues to drive the global pill and only its exact
  task row is marked pinned.
- Base: empty preference State renders the bounded All view and writes nothing
  until the user chooses a filter or pin.
- Bad: cap-before-filter, scalar task-ID pins, recursive relation delegates,
  raw-token equality, or namespace-wide State clearing is forbidden.

### 6. Tests Required

- Pure fixtures cover filter-before-cap, invalid project fallback, fixed group
  order, within-group Snapshot order, custom/completed states, duplicate task
  IDs, cycle-safe relation summaries, per-group hidden counts, and pin flags.
- Static widget checks cover both State loads, key-scoped save/remove, plugin
  State synchronization, semantic unpin comparison, native controls, and the
  absence of `clearPluginState`, settings fallback, file readers, and process
  execution.
- Offscreen QML loading should instantiate the widget against installed DMS
  modules when available. Live focus, popout, reload, persistence, and
  multi-widget convergence remain separate runtime gates.

### 7. Wrong vs Correct

```qml
// Wrong: cap first, compare an opaque token as raw text, or clear all State.
projects = snapshot.projects.slice(0, projectLimit).filter(matchesSelection)
nextToken = pinnedTaskId === token ? "" : token
pluginService.clearPluginState(pluginId)
```

```qml
// Correct: the projection filters before caps and the widget compares identity.
var currentPin = TrellisProjection.parsePinnedTaskToken(pinnedTaskId)
var pinnedHere = currentPin && currentPin.projectId === projectId
    && currentPin.taskId === taskId
pluginService.removePluginStateKey(pluginId, "pinnedTaskId")
```

---

## v0.6 Degraded-State and Responsive Recovery Contract

See [Degraded-State and Responsive Recovery Contract](./recovery-responsive-contract.md)
for the executable refresh, degradation, responsive, validation, and runtime
evidence rules.

---

## QML Reload Resource Naming Contract

### 1. Scope / Trigger

This contract applies when a QML surface imports a plugin-local JavaScript
helper and the component may be loaded through DMS `PluginService.reloadPlugin`.
DMS adds a cache-busting query to the component URL before Qt resolves relative
imports; a stale or case-ambiguous helper path can then surface as
`File name case mismatch` even when a cold load succeeds.

### 2. Signatures

```text
QML import "lib/<helper>.js" as Namespace
  -> one exact-case file at <surface-directory>/lib/<helper>.js
```

### 3. Contracts

- New or renamed plugin-local JavaScript helpers use lowercase filenames.
- Every QML import and Node fixture uses the exact filesystem spelling.
- Do not keep mixed-case aliases or duplicate files for the same helper; the
  loader must see one resource and one cache key.
- A resource rename is internal: it must not change the Snapshot, settings, or
  public plugin manifest contract.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Exact-case import target exists once | Component may proceed to QML load. |
| Import differs only by case | Static test fails before installation. |
| Case-insensitive directory has duplicate targets | Static test fails; remove the alias. |
| Cold load passes but reload reports a case mismatch | Treat reload as failed; verify resource names and repeat the cache-busted path. |
| DMS runtime unavailable | Keep static results, but report live reload/click as unverified. |

### 5. Good / Base / Bad Cases

- Good: `import "lib/trellisprojection.js"` resolves to the sole
  `lib/trellisprojection.js` entry and the contract test checks both spelling
  and existence.
- Base: legacy helper names remain unchanged until they are touched; a new
  helper still follows lowercase naming.
- Bad: `trellisProjection.js` and `trellisprojection.js` coexist, or a QML
  import is updated without its Node fixture/resource assertion.

### 6. Tests Required

- Enumerate every relative `.js` import from all QML surfaces and assert that
  the target exists with exact case and has no case-insensitive duplicate.
- Load each pure helper fixture after the resource graph check.
- Exercise DMS reload when the runtime is available; do not infer reload success
  from a stale widget that survived a failed component load.

### 7. Wrong vs Correct

#### Wrong

```qml
import "lib/trellisProjection.js" as TrellisProjection
// The file was renamed to trellisprojection.js, or both spellings exist.
```

#### Correct

```qml
import "lib/trellisprojection.js" as TrellisProjection
// tests assert that this exact path is the only case-insensitive match.
```

---

## Validation & Error Matrix

| Input / event | Required result |
|---|---|
| Empty or relative `projectRoot` | Empty snapshot plus bounded warning; never scan `$HOME`. |
| Absolute/traversal/control-character pointer | Resolver rejection with a reason; no reader is created. |
| Canonical path outside project/tasks subtree or symlink escape | Rejection after `realpath`; no task/session classification. |
| Tasks root or missing `task.json` | Not a task; warning only. |
| Malformed/oversized JSON | Local record error/warning; healthy projects remain published. |
| Stale or malformed session pointer | Retain the session with `stale`/`error` metadata; never guess a task. |
| Unknown Trellis version/status | Preserve the value and add a non-fatal warning. |
| No authoritative progress source | Keep `progress` as `null`; never derive a percentage. |

---

## Good / Base / Bad Cases

- Good: canonical live task directory, directly contained `task.json`, and a
  valid session pointer produce one task and one active session.
- Base: no configured root or no project produces a loadable empty snapshot
  with a warning.
- Bad: `sh -c "find ${root} ..."`, a `../` pointer, or a symlink to an
  external task is rejected and never reaches `FileView`.

---

## Tests Required

- Pure Node fixtures must assert traversal, absolute paths, tasks-root
  equality, symlink containment, archive opt-in, and fixed Markdown names.
- Parser fixtures must assert title/name defaults, unknown status, relation
  inverse links, malformed/oversized JSON, all-session retention, stale and
  malformed pointers, `progress === null`, and absence of raw Markdown.
- Static checks must assert one `setGlobalVar` publisher, argv-only commands,
  daemon-owned `watchChanges`/topology timer behavior, and no
  network/hooks/socket surface. Live DMS behavior is a separate environment
  gate.

---

## Wrong vs Correct

### Wrong

```qml
Process { command: ["sh", "-c", "find " + rootPath + " -name .trellis"] }
FileView { path: projectRoot + "/" + session.current_task + "/task.json" }
```

### Correct

```qml
Process { command: ["find", canonicalRoot, "-maxdepth", "4", "-type", "d", "-name", ".trellis", "-print"] }
// Pass only TrellisPaths.resolveTaskJson(result, canonicalJson).path to FileView.
```

---

## Code Review Checklist

- [ ] Resolver is the sole owner of path policy and is called before every
      task/session/version file reader.
- [ ] Snapshot state layers remain separate and all session files are retained.
- [ ] Known-file events are coalesced through the daemon generation guard and
      publish one coherent Snapshot per completed batch.
- [ ] Topology interval uses the shared 15–300 second policy (30-second
      default), and settings/manual refresh restarts the daemon scan.
- [ ] Watcher, reader, timer, process, and pending-work cleanup is explicit on
      scan replacement and daemon destruction.
- [ ] New UI code reads the global snapshot rather than raw files or payload
      fields with local casts.
- [ ] Tests cover bad input and the relevant environment limitation is stated.
