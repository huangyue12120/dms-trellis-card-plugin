# Trusted project root discovery design

## Boundary and data flow

```text
Settings folder picker / legacy projectRoot
  → TrellisDiscovery.selectRootInput
  → TrellisPaths.normalizeRoots + canonical realpath
  → bounded ancestor project probe + downward `.trellis` discovery
  → existing project/task/session parser
  → one Snapshot publication + output-only rememberedProjects state
```

The daemon remains the only filesystem reader and Snapshot publisher. The pure
path module owns lexical normalization and ancestor candidate generation. The
settings surface only stores user-selected trusted roots and explains the
result; it does not read task files or use remembered projects as authority.

## Root interpretation

Add a pure `TrellisPaths.ancestorPaths(value, maxCount)` helper:

```text
ancestorPaths(absolutePath, maxCount) -> string[]
```

It normalizes an absolute path, returns the input followed by its parents, and
stops at `/` or the bounded candidate count. Invalid/relative/control-character
paths return `[]`. This helper does not claim that any candidate exists.

For every canonical configured root, the daemon probes candidates from nearest
to farthest. For each candidate it runs an argv-only `test -d <candidate>/.trellis`
and, on success, canonicalizes that `.trellis` path with the existing
`realpath -e --` helper. The first valid ancestor is the project root's
`.trellis` parent. The probe is bounded by a daemon constant (eight candidates
including the selected root) and never scans arbitrary parents beyond that
bound.

This handles all of these inputs without changing the configured authority:

```text
/project                         → /project
/project/.trellis                → /project
/project/.trellis/tasks          → /project
/project/.trellis/tasks/live     → /project
```

Once the project root is identified, the existing `_discoverProject()` path
enumerates the complete direct live-task directory set. The normal downward
`find <configured-root> ... -name .trellis` remains in place so configured
parent folders can still discover multiple projects; both paths deduplicate via
the existing project registry.

## Topology refresh and remembering

No new high-frequency watcher is introduced. A newly created direct task is
found on the next configured topology interval (default 30 seconds) or after
the existing manual refresh action. A successful coherent scan continues to
write bounded canonical `{root,name,lastSeenAt}` summaries to DMS state. The
daemon never loads those summaries to seed discovery, so an old remembered path
cannot silently expand the trust boundary.

## Settings contract

Update the visible trusted-folder explanation to state:

- a selected task/`.trellis` descendant is promoted to its containing project;
- sibling/new tasks are found at the next topology refresh or manual refresh;
- a project outside trusted folders still needs one-time user authorization;
- DMS does not infer the current Codex/agent working directory globally.

Keep the existing safety statements about depth, broad folders, no project-file
writes, the `scanRoots: []` disable switch, and legacy `projectRoot` fallback.

## Compatibility and rollback

- Snapshot fields, parser behavior, display projections, popout, settings keys,
  hot-reload-safe helper filenames, and output-state schema do not change.
- No Trellis files, task JSON, session pointers, hooks, sockets, or external
  daemon are written or installed.
- Rollback removes the ancestor probe/helper and restores the previous settings
  copy; no persisted data migration is needed because configured roots and
  remembered summaries retain their existing shapes.

## Validation matrix

| Layer | Check | Expected evidence |
|---|---|---|
| Pure path policy | `ancestorPaths` fixtures for project/task/`.trellis`/root/cap/invalid input | Ordered, bounded candidates; no relative/traversal acceptance |
| Daemon source | Probe is argv-only, bounded, nearest-first, and deduplicated | No shell string, broad parent scan, or second publisher |
| Settings | Safety/promotion/rescan copy and legacy/empty-root behavior | Users can predict what is scanned and when |
| Existing contracts | Node v0.3–v0.5 suite and manifest/static checks | No regression in Snapshot or trust rules |
| Runtime | Select task descendant, refresh, create sibling task, wait interval/reload | One project, sibling tasks, and remembered summary appear |

If DMS/Wayland runtime or installed-plugin replacement is unavailable, static
results remain valid but task-folder promotion and live topology gates must be
reported as unverified.
