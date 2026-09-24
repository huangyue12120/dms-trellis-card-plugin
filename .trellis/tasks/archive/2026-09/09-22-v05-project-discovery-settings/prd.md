# v0.5 safe project discovery settings

## Goal

Remove manual single-project setup while keeping the user in control of exactly
which filesystem areas are searched.

## Requirements

- Provide a folder picker and removable list for unique trusted `scanRoots`.
- Search only those roots, to the existing maximum depth 4, with every v0.4
  canonicalization and resource cap intact.
- Preserve `projectRoot` as a legacy fallback only while `scanRoots` is empty.
- Store at most `maxProjects` last-success records (`root`, `name`,
  `lastSeenAt`) in DMS plugin state.
- Revalidate through normal scans and never seed scans from remembered state.
- Show the complete approved safety/persistence explanation in Settings.
- Empty roots disable discovery; never infer `$HOME`, `/`, mounts, or `/proc`.

## Acceptance criteria

- [ ] Adding/removing a folder persists `scanRoots` and triggers rescan.
- [ ] Multiple roots discover multiple projects under the existing caps.
- [ ] Existing `projectRoot` users continue to work until they configure roots.
- [ ] Successful scans replace bounded remembered summaries; degraded scans do
      not erase the last-success cache.
- [ ] Tests prove empty roots do not create an implicit broad scan.
- [ ] No write targets a project or `.trellis` path.
