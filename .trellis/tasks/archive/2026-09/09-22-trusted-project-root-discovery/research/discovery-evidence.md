# Trusted-root discovery evidence

## Current observed configuration

The installed DMS plugin settings contain:

```json
{
  "trellisDms": {
    "projectRoot": "/mnt/softwares/Claude Code/bot2agent",
    "displayMode": "auto"
  }
}
```

There is no `scanRoots` array in that state, so the v0.5 compatibility path
uses the legacy root. The active Trellis task for this workspace is under
`/mnt/softwares/myProject/dms-trellis-card-plugin/.trellis/tasks`, which is not
within the configured `bot2agent` project. No plugin bug can discover it without
expanding the authority boundary.

## Current source behavior

- `TrellisDms/lib/trellisdiscovery.js::selectRootInput` selects `scanRoots`
  when it is an array, including `[]`; otherwise it returns `projectRoot`.
- `TrellisDms/TrellisDaemon.qml::startScan` normalizes and canonicalizes only
  those selected roots.
- `_discoverRoot` runs an argv-only bounded `find` below the canonical root for
  `.trellis` directories. It never checks parent ancestors of the selected
  root.
- `_discoverProject` then enumerates direct directories under
  `<project>/.trellis/tasks`; new task directories are therefore visible only
  after the next topology scan or manual refresh.
- `_rememberProjects` writes bounded canonical summaries after a non-degraded
  scan. Settings reads those summaries for display, but the daemon does not
  load them as scan roots.

## Design implication

The safe MVP is not global “current agent task” detection. It is bounded
ancestor promotion for a user-selected path plus normal topology refresh inside
the trusted project. A global current-task bridge or broad filesystem scan is a
separate, higher-risk design and remains out of scope.
