# Stage 0 execution plan

This is a research execution checklist, not a production implementation plan.
The original 2026-09-17 run was performed while the task was `planning`; the
task is now `in_progress` as of the current research-validation session. Do
not run another `task.py start` as part of this checklist.

## Ordered checklist

1. Record local environment and command capability (`dms`, `qs`/Quickshell,
   Qt, niri, `trellis`, `.trellis/.version`).
2. Capture a bounded `.trellis` tree and inspect multiple live task records,
   any archived records, all runtime session pointers, `task_store.py`, and
   active-task resolver code.
3. Run `task.py --help`, `list --json`, `current --json`, and relevant no-data
   cases; record the actual machine-readable schema and exit behavior.
4. Determine progress semantics from task metadata and `implement.md`
   checklists, including parent/child behavior and missing/unknown fields.
5. Locate and inspect installed/authoritative DMS plugin guidance, composite
   examples, `FileView` documentation/source, and Theme/Settings/State/global
   variable APIs. Record the minimum version only when proven.
6. Inspect the Linux `payprays/codeIsland-dms` QML and
   `linux-skeleton/README.md` (or record source access as blocked), then record
   the macOS `rifqiakrm/code-island` project boundary separately.
7. Build disposable path fixtures and exercise allowed, traversal, absolute,
   symlink-escape, stale-pointer, malformed-pointer, and fixed-Markdown cases.
8. Write all six research reports with command/source provenance and a row for
   every Stage 0 item 0.1–0.16.
9. Review the reports against the specification, update the acceptance
   checklist, and present a planning/research summary to the user.

## Validation commands

- `python3 ./.trellis/scripts/task.py validate 09-17-dms-plugin-prereq-research`
- `python3 ./.trellis/scripts/task.py current --json`
- `python3 -m json.tool .trellis/tasks/09-17-dms-plugin-prereq-research/task.json`
- `find .trellis/tasks/09-17-dms-plugin-prereq-research/research -maxdepth 1 -type f -print`
- targeted `jq`/Python JSON parsing checks against the recorded real samples
- `git diff --check` and a final `git diff --stat`

## Risk and rollback points

- If an upstream reference is unavailable, keep the report explicitly
  `blocked/unverified` and do not fill the gap with memory.
- If a command mutates state by default, stop and use its help/read-only form;
  no rollback of user data should be necessary.
- If disposable fixtures are needed, scope cleanup to the exact `mktemp -d`
  path and record the test before removal.
- If a finding changes the product scope, return to planning and update
  `prd.md`; do not start implementation in this task.
