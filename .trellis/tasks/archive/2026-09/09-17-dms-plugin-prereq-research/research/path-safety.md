# Safe path resolver research

Status: **verified** for the disposable matrix below, executed on
`2026-09-17` with a `tempfile.TemporaryDirectory` fixture that was removed
automatically after the run. No production resolver or fixture was added to
the repository.

## Required contract

For a configured project root, a future observer should:

1. Treat the explicit project root as the only allowed absolute input.
2. Normalize and resolve the candidate (including symlinks) before checking
   containment.
3. Require the final task path to be a real directory under
   `.trellis/tasks/`; accept `archive/<YYYY-MM>/` only for read-only archive
   views.
4. Require `task.json` before classifying a directory as a task.
5. Permit Markdown only by fixed basename (`prd.md`, `design.md`,
   `implement.md`) directly below a validated task directory, with a size cap.
6. Reject traversal, external absolute paths, symlink escapes, and any
   canonical path outside the allowed root. Never concatenate an untrusted
   runtime pointer into a shell command.

## Trellis resolver matrix

The same run called `common.task_utils.resolve_task_dir()` and, for contrast,
the broader `common.paths.resolve_task_ref()`:

| Case | Input/result | Status |
|---|---|---|
| Real repository live task | `.trellis/tasks/09-17-dms-plugin-prereq-research` accepted | verified |
| Fixture live task | `.trellis/tasks/09-17-live` accepted | verified |
| Fixture archive task | `.trellis/tasks/archive/2026-09/01-01-archived` accepted for read resolution | verified |
| Tasks root | `.trellis/tasks` rejected as “tasks directory itself” | verified |
| Traversal | `.trellis/tasks/09-17-live/../../outside` rejected outside tasks | verified |
| External absolute | `/tmp/.../outside` rejected outside tasks | verified |
| Symlink escape | `.trellis/tasks/escape-link` → external directory rejected after `resolve()` | verified |
| Broader resolver warning | `common.paths.resolve_task_ref('.trellis/tasks', root)` returns the tasks root | verified; plugin must add a task-directory/`task.json` gate |

`resolve_task_dir()` implements the strict containment chokepoint at
`.trellis/scripts/common/task_utils.py:195-277`. It resolves both candidate
and tasks root, rejects equality with the tasks root, and checks that the tasks
root is an ancestor. `paths.resolve_task_ref()` at `common/paths.py:280-347`
has a wider contract and is not sufficient by itself for a plugin task
resolver.

## Session-pointer matrix

Disposable session files were resolved with `common.active_task.resolve_active_task()`:

| Case | Observed result | Status |
|---|---|---|
| Valid pointer | `current_task=.trellis/tasks/09-17-live`, `stale=false`, `source_type=session` | verified |
| Stale pointer | path is retained, `stale=true` | verified |
| Malformed JSON | no active task (`task_path=null`) | verified |
| Non-string `current_task` | no active task (`task_path=null`) | verified |
| One-file fallback | opt-in fallback returns the task with `source_type=session-fallback` | verified |
| Two-file fallback | opt-in fallback returns no task; it refuses to guess ownership | verified |

The original real session file was healthy and pointed to the research task.
The current checkout has two real session files, both pointing to this task;
the context-less resolver refuses to select either one, as required for
multi-session safety. There is still no sample with different tasks per
session, so only the ambiguity behavior—not per-window task differentiation—
is verified.

## Fixed Markdown matrix

A research-only helper applied the fixed-name and containment policy to the
fixture task:

| Candidate | Result |
|---|---|
| `prd.md` | accepted |
| `design.md` | accepted |
| `implement.md` | accepted |
| `notes.txt` | rejected |
| `nested/prd.md` | rejected |
| `../outside/secret.md` | rejected |
| symlink to external `secret.md` | rejected |

This allow-list is stricter than
`task_context._resolve_context_entry_path()` because that helper primarily
handles JSONL references and archived self-reference remapping. The plugin
must enforce the fixed basename policy before any Markdown read.

## Reproducibility and limits

The fixture command created live/archive task directories, an external
directory, a symlink escape, and session JSON files under a temporary root;
it printed the matrix above and exited successfully after cleanup. Symlink
creation was supported on this Fedora run. Windows path semantics, permission
denials, and very large files were not exercised and are **unverified**.
