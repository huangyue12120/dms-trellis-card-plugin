# Trusted project root discovery

## Goal

Make “automatic detection and remembering” match the safe behavior users can
observe: a folder selected inside a Trellis project (including a live task
directory) is treated as that project's root, and new sibling tasks inside an
already trusted project appear on the next topology refresh without another
path entry. A project that has never been placed under a trusted scan root must
remain undiscovered and the settings copy must explain why.

## Confirmed facts

- The installed DMS setting currently has only the legacy value
  `projectRoot: "/mnt/softwares/Claude Code/bot2agent"`; the current task being
  executed in this workspace is under
  `/mnt/softwares/myProject/dms-trellis-card-plugin`. The plugin therefore has
  no authority to scan the current project.
- `TrellisDiscovery.selectRootInput()` treats an array-valued `scanRoots` as
  authoritative and otherwise falls back to legacy `projectRoot`.
- `TrellisDaemon.startScan()` canonicalizes those roots and `_discoverRoot()`
  only searches downward with `find <root> -maxdepth 4 -type d -name .trellis`.
  Selecting a task directory or a `.trellis` descendant cannot discover its
  ancestor project with the current implementation.
- Once a project is found, `_discoverProject()` enumerates the direct live task
  directories under `<project>/.trellis/tasks`; the topology timer defaults to
  30 seconds and a manual refresh starts an immediate scan.
- `discoveredProjects` is written after a coherent scan and shown in Settings,
  but is deliberately never loaded by the daemon as a scan input. It is an
  output cache, not an authority expansion mechanism.
- DMS does not expose the Codex/Trellis agent's current working directory to
  this plugin. A zero-configuration scan of arbitrary current projects would
  require broad filesystem scanning or a new Trellis/Codex bridge, both outside
  the current read-only trusted-root boundary.

## Requirements

### R1. Promote an in-project selected path

When a configured root is itself a Trellis project or is inside one (for
example `<project>/.trellis/tasks/<task>`), discover the nearest canonical
ancestor project root within a bounded number of parent levels. The resulting
project must be processed by the existing task/session parser, so sibling live
tasks are visible; do not treat the selected task directory as the project
root or emit `task_path_rejected` for a valid in-project selection.

### R2. Discover new tasks within trusted projects

After a project has been discovered from a trusted root, a normal topology
rescan must discover newly created or moved direct live task directories under
that project's `.trellis/tasks` directory. The existing configured interval
and manual “Refresh Trellis data now” action remain the timing contract; no
high-frequency polling or unbounded directory watcher is added.

### R3. Preserve authority and compatibility

`scanRoots: []` remains an explicit disable switch. Legacy `projectRoot`
fallback remains readable when `scanRoots` is absent. Remembered projects stay
output-only and never seed or authorize scanning. Roots still pass canonical
realpath, containment, depth, project/task/session, and warning caps.

### R4. Explain the boundary in Settings

Update the trusted-folder and remembered-project descriptions so users can tell
that selecting a task folder is promoted to its Trellis project, new tasks in
that project are found automatically, and a completely new project still
requires one-time addition of a containing trusted folder. The copy must not
claim that DMS can infer the current Codex task globally.

### R5. Keep v0.5 surfaces truthful

The Snapshot schema, active-session semantics, display modes, popout, warning
projection, read-only Trellis access, and hot-reload-safe helper filenames
remain unchanged. This task changes only root interpretation, topology
discovery, tests, and explanatory copy.

## Acceptance criteria

- [ ] A configured path equal to a project root, `.trellis`, `.trellis/tasks`,
  or a live task directory discovers the same canonical project root without a
  `task_path_rejected` warning for the valid in-project case.
- [ ] A project selected through a task descendant exposes its sibling live
  tasks and active sessions exactly as a project selected at its root.
- [ ] A newly created direct task directory appears after the next configured
  topology interval or an explicit manual refresh, without re-entering a path.
- [ ] Canonical ancestor promotion is bounded and rejects paths that are not
  inside a real `.trellis` project; no parent traversal escapes the trusted
  root authority.
- [ ] `scanRoots: []`, legacy `projectRoot`, root caps, path safety, degraded
  last-good behavior, and output-only `discoveredProjects` semantics remain
  covered by tests.
- [ ] Settings text accurately describes promotion, rescan timing, and the
  one-time trust requirement for an entirely new project.
- [ ] Existing Node contracts and static QML/source checks pass; no raw
  Markdown, task writes, hooks, sockets, network, or broad home scan is added.
- [ ] Live DMS checks confirm task-folder selection, automatic sibling-task
  discovery, manual refresh, and warning/copy behavior when the runtime is
  available; unavailable runtime gates are reported as unverified.

## Out of scope

- Reading the Codex, Claude, or other agent process working directory from DMS.
- Scanning `$HOME`, `/`, mounted drives, or arbitrary parent directories to
  guess a current project.
- Installing hooks, changing Trellis CLI/session files, adding an external
  daemon, or making remembered projects authoritative roots.
- Changing the v0.5 pill modes, popout actions, Snapshot schema, or task data
  write policy.

## Risks and deferred decisions

- Ancestor promotion must distinguish a real project `.trellis` directory from
  a similarly named path and must remain bounded; the design should use the
  existing canonical path/process boundary rather than trusting strings.
- Promoting a selected task path intentionally broadens that one trusted
  selection to the whole containing project so sibling tasks are useful. The
  Settings copy must make this consequence visible.
- A new project outside all trusted roots will still not appear automatically;
  this is the deliberate security/performance trade-off for the MVP.
