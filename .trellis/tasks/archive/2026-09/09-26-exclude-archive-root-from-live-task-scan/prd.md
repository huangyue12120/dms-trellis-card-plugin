# Exclude the archive root from live task discovery

## Goal

Remove the false `task_path_rejected` warning caused by enumerating `.trellis/tasks/archive` as if it were a live task.

## Requirements

- The live-task candidate scan must skip the exact reserved `archive` directory.
- Keep the archive index/page flow as the only source of archived tasks.
- Keep canonical path resolution and rejection for invalid, escaping, or symlinked live task candidates.
- Preserve all normal live-task fields, active-session projection, and progress behavior.

## Acceptance criteria

- [ ] A Trellis project with an archive directory no longer emits `task_path_rejected` for that directory.
- [ ] Normal direct live-task directories are still discovered.
- [ ] Archived tasks remain available through the existing archive flow.
- [ ] A deliberately invalid or escaping task path remains rejected.

## Parent and sequencing

- Parent: `09-26-dms-desktop-trusted-root-discovery`.
- Implement after the settings child so sibling work does not overlap edits to `tests/test_trellis_contract.mjs`.

## Out of scope

- Relaxing `resolveTaskDir`, changing archive storage layout, or altering project data.
