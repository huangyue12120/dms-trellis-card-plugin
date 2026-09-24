# Trellis DMS v0.3 data link and safe resolver

## Goal

Replace the v0.2 hard-coded skeleton snapshot with a bounded, read-only
Trellis data link. The daemon must discover configured Trellis projects,
parse live tasks and all session pointers into one tolerant Snapshot, and route
every task/session path through one canonical safe resolver.

## User value

Users can configure a trusted project or scan root and see real Trellis task
and session facts in the existing DMS widget transport without modifying
Trellis files. Broken or unfamiliar data degrades to warnings and partial
records instead of taking down DMS.

## Why this is one implementation task

The roadmap names three sub-tasks—0.3.1 discovery, 0.3.2 parsing, and 0.3.3
safe resolution—but they share one asynchronous daemon scan, one Snapshot
contract, and one path-security chokepoint. They will be implemented and
verified as one task with the following explicit internal order:

1. **0.3.1 Project discovery and version recognition** — produce bounded,
   canonical project candidates from configured settings.
2. **0.3.3 Safe resolver** — validate every candidate/task/session/Markdown
   path before it can reach a file reader. This contract is established before
   parsing is enabled.
3. **0.3.2 Task/session parser and projection** — read validated files and
   build the complete v0.3 Snapshot.

## Confirmed facts and constraints

- Stage 0 verified the current Trellis layout, task fields, lifecycle, session
  pointer shape, unknown-status behavior, and `progress: number | null`.
- A real task directory must contain a readable `task.json`; the broad Trellis
  path helper is not sufficient by itself because it can return the tasks root.
- Session pointers are session-scoped and must all be retained. A pointer may
  be stale or malformed; the parser must record that fact without guessing.
- Stage 0 verified traversal, external absolute paths, symlink escapes, stale
  pointers, malformed pointers, ambiguous multi-session fallback, and fixed
  Markdown allow-list behavior with disposable fixtures.
- Quickshell `FileView` reads known files but does not discover files that do
  not exist yet. v0.3 performs an explicit initial/settings-triggered scan;
  v0.4 owns watchers and topology timers.
- DMS 1.6.2 / Quickshell 0.3.1 is the current runtime; Stage 0 recorded 1.6.1
  historically. The existing `>=1.6.1` manifest bound remains compatible.
- The root is not a usable Git repository and no DMS shell process is running;
  live DMS reload/multi-display checks remain separate environmental limits.

## Scope by internal sub-task

### 0.3.1 — Bounded project discovery and version recognition

#### Requirements

- Read a trusted `projectRoot` setting from the DMS plugin namespace and
  normalize it to an internal `projectRoots[]` list, even though v0.3 exposes
  one settings field.
- Reject empty/non-absolute roots with an empty state or warning; do not scan
  `$HOME` implicitly.
- Use a bounded, argv-based discovery command (no shell string) to find
  `.trellis` directories at a fixed maximum depth, with project and output
  caps. The explicit root itself must be discoverable.
- Canonicalize/dedupe discovered project roots and read each `.trellis/.version`
  with a non-fatal warning for missing or unverified versions.
- Fail closed with a warning if the optional discovery command is unavailable;
  do not make a missing project a startup failure.

#### Not in this sub-task

- No directory watcher, topology interval, archive enumeration, or recursive
  unbounded scan.
- No project creation, root migration, or writes outside DMS settings.

### 0.3.3 — Canonical safe path resolver

#### Requirements

- Keep all path policy in one shared resolver module; QML callers must not
  concatenate untrusted pointer strings themselves.
- Normalize relative session pointers and reject absolute pointers, traversal
  beyond the project root, malformed path lines, and empty candidates.
- Resolve symlinks/canonical paths before containment checks using an argv-based
  `realpath` operation; accept only the configured project, its
  `.trellis/tasks/` subtree, and read-only archive paths where applicable.
- Require a task directory plus `task.json` before classifying a task.
- Keep fixed Markdown allow-list helpers (`prd.md`, `design.md`,
  `implement.md`) ready for v0.7, but do not read Markdown in v0.3.
- Return structured rejection reasons/warnings and never throw a shell-fatal
  exception for untrusted data.

#### Not in this sub-task

- No arbitrary file browser, shell command construction, symlink creation,
  cleanup, or Trellis write operation.

### 0.3.2 — Tolerant task/session parser and Snapshot

#### Requirements

- Read validated `.trellis/.version`, live `tasks/*/task.json`, and all
  `.runtime/sessions/*.json` through bounded `FileView` readers.
- Preserve the three state layers: `storedStatus` from disk, `runtimeState`
  from session pointers/data health, and `displayState` as a projection.
- Normalize task fields with safe defaults (`title`/`name`, `unknown` status,
  `P2` priority), retain unknown statuses, and derive parent/child relations
  without dropping records.
- Resolve every session pointer to a task when safe; retain all sessions,
  count active sessions per task, and mark stale/malformed/ambiguous pointers
  with explicit metadata.
- Emit `progress: null` for the current Trellis data model. Child summaries,
  status, and session counts must not populate a fabricated percentage.
- Publish one immutable-ish snapshot to the existing `trellisDms` global
  `snapshot` variable. The widget may show a diagnostic project/task count,
  but final UI projection remains a later task.
- Treat malformed files, unknown versions, missing archive directories, and
  per-record read failures as local warnings/errors; do not crash the daemon or
  discard healthy projects.

#### Not in this sub-task

- No FileView `watchChanges`, topology timer, archive task loading, Markdown
  body, primary pill design, or progress algorithm.

## Cross-cutting requirements

- Update the manifest to version `0.3.0` and add only the `process` permission
  needed for safe argv-based discovery/canonicalization; never add `network`.
- Replace the v0.2 `reservedRoot` placeholder with a clearly labelled
  `projectRoot` setting. It is a trusted user input, not a Trellis write target.
- Keep all external command calls as argument arrays with stable owner/lifetime
  and bounded output. Never use `sh -c`, interpolate user paths into shell
  source, or depend on `fd`.
- Use generation tokens/cancellation cleanup so a settings-triggered rescan
  cannot let stale asynchronous readers publish an older snapshot.
- Bound projects, tasks, sessions, JSON size, and command output; publish
  warnings when limits are reached.
- Do not claim v0.2 live DMS runtime verification merely because the new
  daemon code exists.

## Out of scope

- v0.4 known-file watchers, topology rescan interval, error-rate limiting,
  performance tuning, or multi-widget watcher sharing beyond the v0.3 single
  initial scan.
- v0.5 UI/UX Design Gate and final pill/popout visual language.
- v0.6 live task grouping, project filters, archive/detail views, or desktop
  surface.
- v0.7 Markdown rendering and archive browsing.
- Agent activity, CodeIsland, hooks, permissions/interaction writes, network,
  trellis-card IPC, or changes to any `.trellis/` file.

## Acceptance criteria

- [x] The `projectRoot` setting is normalized to bounded `projectRoots[]`; an
      empty/invalid root produces an explicit empty/warning state and never
      scans `$HOME`.
- [x] A disposable fixture with a project at the root and within the allowed
      depth is discovered; a project beyond the depth or over the cap is
      excluded with a warning.
- [x] Every discovered project reads `.trellis/.version` and carries its
      version or an explicit non-fatal warning.
- [x] `trellisPaths` rejects absolute/untrusted session pointers, traversal,
      tasks-root equality, symlink escape, external paths, non-task directories,
      and non-whitelisted Markdown names; valid live paths are accepted.
- [x] Real `task.json` records normalize title/name, status, priority,
      parent/children, unknown status, and `progress: null` without crashing
      on malformed JSON.
- [x] All session pointer files are retained. Valid pointers map to tasks;
      stale/malformed/ambiguous pointers become explicit session warnings and
      never cause a guessed task selection.
- [x] The published snapshot contains projects, tasks, sessions,
      `activeTaskIds`, `archiveSummary` (not loaded), warnings/errors, and
      nullable progress fields without Markdown full text.
- [x] The daemon publishes only the newest scan generation; settings-triggered
      rescans cannot overwrite it with stale asynchronous callbacks.
- [x] Source inspection confirms no Trellis writes, Markdown reads, watcher/
      topology timer, network, hooks, CodeIsland, or shell-string command.
- [x] Static JSON/QML-source checks, pure parser/resolver fixture tests, and
      task context validation pass. Live DMS behavior remains explicitly
      unverified if the shell is not running.

## Implementation result

- Implemented the bounded discovery coordinator, canonical resolver, tolerant
  parser, v0.3 settings/manifest, diagnostic widget projection, and disposable
  Node contract fixtures.
- Independent quality review fixed and rechecked oversized JSON handling,
  relation inverse links, malformed-task state preservation, exact Trellis
  root validation, archive opt-in, and missing `task.json` handling.
- Verified: manifest JSON, task context validation, pure fixture tests,
  discovery depth/cap fixture, resolver containment matrix, forbidden-surface
  scan, QML delimiter sanity, and one `setGlobalVar` publisher.
- Unverified environment gates: live DMS enable/reload/multi-display behavior,
  `qmllint`/`qmlformat`, and Git diff/commit checks. No DMS or user config was
  modified.

## Deferred decisions and risks

There are no blocking user-owned decisions. The following are explicit
technical/product deferrals:

- v0.3 uses one `projectRoot` setting normalized to an array; a multi-root
  editor belongs to a later settings/UX task.
- `find` and `realpath` are standard Linux command dependencies used through
  argv and `process` permission. If unavailable, the plugin degrades to a
  warning/empty state rather than adding a shell fallback.
- Session/file modification times may be `null` until v0.4 watcher support
  provides a verified source; no mtime is converted to Agent activity.
- Live DMS IPC/multi-display behavior is an environment gate, not a reason to
  fabricate success or expand v0.3 into runtime deployment work.

## Traceability

- Product scope/data flow: `trellis-dms-plugin-spec-revised.md` sections 3,
  4.1–4.5, 5, and 7 Stage 2.
- Trellis fields and lifecycle:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/trellis-data-model.md`.
- Progress semantics:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/progress-semantics.md`.
- Path contract:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/path-safety.md`.
- DMS FileView/Proc/manifest evidence:
  `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/dms-api.md`.
