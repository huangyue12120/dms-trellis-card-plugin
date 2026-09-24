# Progress semantics

Status: **verified** for the current Trellis checkout; no authoritative
overall percentage exists. The implementation contract is explicitly
`progress: number | null`.

## Evidence

1. A search of both real task records found zero `"progress"` fields. The
   records contain status, priority, relationships, and metadata only.
2. `task.py list --json` exposes `status` and computed `display_status`, not a
   percentage (`.trellis/scripts/task.py:388-415`). Its human-readable form
   also shows only status and the child counter.
3. `common/tasks.py:100-122` defines `children_progress()` as a string
   `" [done/total done]"`. It counts a missing active child as done because
   the child was moved to archive. This is a relationship summary, not a
   normalized task or project percentage.
4. `implement.md` is an ordered prose checklist and the PRD contains Markdown
   checkboxes. These are planning artifacts, not a Trellis runtime progress
   field. They cannot safely be interpreted as a global progress source.
5. `rg` over `.trellis/tasks` and `.trellis/scripts` found progress-related code
   only for the child counter and status transitions; no persisted overall
   percentage or progress API is present.

## Required model

```text
progress: number | null
```

- Return a finite numeric value only if a future, version-validated source
  explicitly defines one and its scale is known.
- Return `null` for the current data model, even when the observer can count
  planning checkboxes, child statuses, mtimes, or active sessions.
- Never derive a percentage from `planning`/`in_progress`/`review` counts,
  elapsed time, file mtimes, or the number of checked Markdown boxes.
- A child summary may be exposed separately as `{done, total}` or its display
  string, but it must not populate `progress`.

This prevents the pill from presenting a fabricated percentage. A UI may show
status, priority, child summary, or a neutral “no progress reported” state when
`progress === null`.

## Status layers

The current code demonstrates three distinct layers:

| Layer | Source | Meaning |
|---|---|---|
| Stored | `task.json.status` | Persistent workflow value, including unknown/custom strings. |
| Runtime | session `current_task`, `stale` | Which task a particular agent session points at; not task completion. |
| Display | `_display_status()` and child counter | A UI/list projection that may say `active` for a planning parent without changing disk data. |

`completed` is written at archive time and the directory leaves the active task
set. It should not be silently treated as an active percentage denominator.

## Current sample summary

At the original 2026-09-17 capture the checkout had two live tasks, one
`in_progress` and one `planning`; neither had a numeric progress field. The
research task is now `in_progress`, but still has no numeric progress field.
Its `implement.md` has a numbered execution checklist but no machine-readable
progress values. This remains consistent with `progress: null` for both
records.

## Downstream rule

The snapshot should carry the nullable field for schema stability, while the
projection decides how to communicate “unknown/no authoritative progress.”
When a future Trellis release adds a documented percentage, the parser must
version-check and fixture-test that field before changing this rule.
