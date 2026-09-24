# Trellis DMS v0.4 watcher, topology, recovery, and performance foundation

## Goal

Make the v0.3 read-only Snapshot stay current and usable while Trellis files
change. Existing task/session content changes must refresh promptly; directory
topology changes must be found on a bounded schedule; malformed data and
resource pressure must degrade to warnings and partial facts instead of taking
down DMS.

## User value

Users should not need to reload DMS after editing a task, switching the active
session, creating/deleting a task, or moving a task to the archive. When a
single file is temporarily malformed or inaccessible, healthy projects and the
last useful state remain available with an explicit warning.

## Confirmed repository facts

- `TrellisDms/TrellisDaemon.qml:11-19` documents v0.3 limits and explicitly
  leaves known-file watchers and topology timers for v0.4.
- The daemon currently creates short-lived `FileView` readers without
  `watchChanges` (`TrellisDms/TrellisDaemon.qml:56-95`), performs an initial or
  settings-triggered scan only (`:502-538`), and publishes one complete
  Snapshot from the daemon (`:475-500`).
- The v0.3 parser already keeps `progress: null`, all sessions, local errors,
  and an unloaded archive summary (`TrellisDms/lib/trellisParser.js:254-356`).
- The existing limits are 32 projects, 128 tasks/project, 128
  sessions/project, 1 MiB JSON, 256 KiB discovery output, and 256 warnings;
  they are the baseline for v0.4 resource protection.
- The verified DMS API exposes `FileView.watchChanges` for existing known
  files, but it cannot discover a file that does not exist yet. The verified
  topology fallback is a bounded `FolderListModel` or equivalent argv-based
  directory scan. The research record recommends a 15–30 second default
  topology interval and a legal 15–300 second range.
- Filesystem work belongs to the single daemon; widgets consume the one
  namespaced `snapshot` global. No live DMS process, QML linter, or usable Git
  repository is available in this checkout, so those runtime gates remain
  separately reportable.

## Requirements

### R1. Known-file content refresh

- Watch every validated existing `.trellis/.version`, live `task.json`, and
  session pointer file discovered by the current topology scan.
- A task JSON edit must be reflected in a newly published complete Snapshot
  within the v0.4 target of two seconds under normal load.
- A session pointer edit must recompute its safe resolution, active-session
  count, stale/error metadata, and primary-selection inputs without guessing a
  task.
- Consecutive events for the same file must be debounced/coalesced; a watcher
  must not publish one partially updated global variable per filesystem event.

### R2. Topology rescan and immediate refresh

- Detect newly created/deleted live task directories, new/deleted session
  pointer files, and archive moves by a bounded topology rescan. The rescan
  must reuse the v0.3 trusted roots, depth/count caps, canonical resolver, and
  argv-only discovery boundary.
- Expose a topology interval setting with a default in the roadmap's 15–30
  second range and clamp accepted values to 15–300 seconds.
- Settings changes (root or interval) and an explicit manual refresh must
  cancel/debounce stale work and start a topology scan immediately.
- A new/deleted task must appear/disappear by the next configured topology
  interval; an archive move must classify live/archive correctly without
  loading archive task bodies.

### R3. Error recovery and last-good behavior

- Malformed/oversized JSON, unreadable files, unknown Trellis versions,
  permission errors, stale pointers, and discovery failures must be represented
  as bounded structured warnings/errors. One bad record must not discard other
  projects or crash the shell.
- Repeated warnings for the same file/reason must be rate-limited while still
  retaining a useful warning in the published Snapshot.
- A transient scan-level failure must not replace a valid Snapshot with an
  unexplained empty state. An intentionally empty/unconfigured root remains a
  normal empty Snapshot with a bounded warning.
- A failed content reload must preserve the record and mark its data health;
  the next topology scan must be able to recover it without manual cleanup.

### R4. Resource and idle-performance guarantees

- Keep the existing project/task/session/JSON/output/warning limits and add
  explicit bounds for known-file watchers and pending reload work.
- Do not poll at high frequency. Only the topology timer may enumerate
  directories; known-file changes use `FileView.watchChanges`.
- Do not load archive contents or Markdown bodies into the global Snapshot.
- Reuse one daemon-owned watcher/timer set across every bar/widget instance;
  plugin reload and daemon destruction must release all readers, watchers,
  timers, and pending callbacks.

### R5. Snapshot and compatibility contract

- Preserve the v0.3 Snapshot schema, nullable progress semantics, complete
  session retention, path-resolver ownership, and one atomic `setGlobalVar`
  publication per coherent refresh.
- Keep the plugin read-only: no Trellis file writes, hooks, sockets, network,
  CodeIsland dependency, or final UI/popout work.
- A project-less startup remains loadable and configurable; it must not become
  a hard `startupCheck` failure.

## Out of scope

- Final pill/popout/desktop visual design, UI/UX Gate deliverables, project
  filters, archive browsing, Markdown rendering, or progress computation.
- Agent activity providers, CodeIsland sockets, hooks, network access,
  interaction writes, or changes to any `.trellis/` file.
- A guarantee stronger than the documented two-second content-refresh target
  on an unavailable or overloaded DMS runtime.
- Large archive enumeration or archive body loading; v0.4 only maintains the
  topology and unloaded archive summary needed by later versions.

## Acceptance criteria

### Static / pure-contract criteria completed

- [x] The deterministic helper and source contracts cover coalescing repeated
      known-file events into one coherent publication; live callback timing is
      a separate gate below.
- [x] The pure parser/resolver fixtures cover session pointer updates,
      active-session accounting, malformed pointers, traversal rejection, and
      safe stale/valid metadata; live FileView delivery remains unverified.
- [x] Root/interval/manual-refresh source contracts are present, interval
      values use the shared 15–300 second policy, and normalization emits a
      bounded warning.
- [x] Pure parser/static checks cover malformed and oversized JSON, unreadable
      record health fields, stale pointers, unknown versions, warning cooldown,
      and bounded warning metadata. Live discovery-failure recovery remains a
      runtime gate.
- [x] Existing project/task/session limits plus watcher and pending-work caps,
      daemon ownership, and low-frequency topology scheduling are enforced by
      the implementation and source checks. Multi-widget sharing remains a
      runtime gate.
- [x] Generation guards and destruction paths explicitly clean old watchers,
      timers, readers, processes, and callbacks in source review.
- [x] Snapshot schema remains v0.3-compatible (`progress: null`, all sessions,
      no raw Markdown), and source checks find no writes, network, hooks,
      sockets, or shell-string commands.
- [x] Pure contract tests, QML/static source checks, manifest validation, and
      Trellis context validation pass.

### Runtime criteria pending an available DMS/QML environment

- [ ] Editing an existing validated `task.json` updates the corresponding
      Snapshot within two seconds in a deterministic watcher fixture or live
      DMS gate, without duplicate watcher callbacks.
- [ ] Editing a known session pointer updates active-session counts through the
      running FileView path; repeated events publish one batch rather than a
      burst of partial global-var updates.
- [ ] Creating/deleting a live task, adding/removing a session file, and moving
      a task into archive are reflected by the configured topology interval;
      no archive body is loaded at runtime.
- [ ] Root/interval settings and the manual refresh control trigger an
      immediate topology scan in DMS, and reload/hot-reload/multi-widget or
      multi-screen scenarios leave no residual resources.
- [ ] The two-second watcher target, topology behavior, and live DMS/QML
      checks are run; the current checkout has no usable DMS runtime,
      `qmllint`/`qmlformat`, or standalone `qs.*` import environment, so these
      results are explicitly unverified rather than inferred from static tests.

## Open questions

None blocking. The task follows the existing roadmap: one combined v0.4
implementation with the internal order known-file refresh → topology/immediate
refresh → recovery/limits/performance. A 30-second default is the selected
implementation point inside the already approved 15–30 second range; the
setting remains user-adjustable within 15–300 seconds.
