# Trellis data model and CLI evidence

Observed on `2026-09-17` from the current checkout. The project is a
single-repository Trellis project with backend and frontend spec layers:

```text
python3 ./.trellis/scripts/get_context.py --mode packages
→ Single-repo project (no packages configured)
→ Spec layers: backend, frontend
```

## Bounded layout (0.4)

`find .trellis -maxdepth 4 -print | sort` shows the following relevant
topology:

```text
.trellis/.version
.trellis/.runtime/sessions/<codex-session>.json
.trellis/scripts/{task.py,get_context.py,common/...}
.trellis/spec/{backend,frontend,guides}/
.trellis/tasks/00-bootstrap-guidelines/
.trellis/tasks/09-17-dms-plugin-prereq-research/
.trellis/tasks/archive/
.trellis/workspace/huangyue12120/{index.md,journal-1.md}
```

The target task contains `task.json`, `prd.md`, `design.md`, `implement.md`,
and empty `implement.jsonl`/`check.jsonl` manifests before this research was
curated. The `research/` directory is the output directory for this task.

## Real task records (0.5)

Two live records were read directly from disk:

| Path | Status | Other observed values |
|---|---|---|
| `.trellis/tasks/00-bootstrap-guidelines/task.json` | `in_progress` | `id`/`name`/`title`/`description` strings; `dev_type="docs"`; `priority="P1"`; assignee/creator `huangyue12120`; `relatedFiles` is an array; nullable branch/PR/worktree fields; `children` and `subtasks` arrays; `meta` object. |
| `.trellis/tasks/09-17-dms-plugin-prereq-research/task.json` | `planning` | Same core shape; `dev_type`, `scope`, and `package` are null; `priority="P2"`; `base_branch="main"`; `relatedFiles`, `children`, and `subtasks` are empty arrays; `meta` is an object. |

The complete field vocabulary is declared as a read-path `TypedDict` in
`.trellis/scripts/common/types.py:15-49` with `total=False`:

```text
id, name, title, description, status, dev_type, scope, package, priority,
creator, assignee, createdAt, completedAt, branch, base_branch,
worktree_path, commit, pr_url, subtasks, children, parent, relatedFiles,
notes, meta
```

`TaskInfo.raw` keeps the original dictionary (`types.py:50-61`), so unknown or
future custom fields must not be discarded by a consumer or a write-back path.
`load_task()` (`common/tasks.py:24-61`) uses `title`, then `name`, then
`"unknown"`; missing status becomes `"unknown"`; missing priority becomes
`P2`; malformed/unreadable JSON is warned about and skipped. `iter_active_tasks()`
(`tasks.py:64-83`) sorts directories and skips `archive/` and invalid records.

## Lifecycle and status (0.6)

- `task_store.cmd_create()` writes a new task with `status: "planning"`
  (`common/task_store.py:528-558`).
- `task.py start` changes only `planning → in_progress` and records a branch
  when appropriate (`task.py:83-169`). It also refuses an empty curated
  `implement.jsonl` or `check.jsonl` unless `--allow-empty-context` is given
  (`task.py:194-215`). At the original 2026-09-17 capture this research task
  had not been started; the validation session later started it.
- `task_store.cmd_archive()` writes `status: "completed"` and
  `completedAt`, then moves the directory (`task_store.py:1317-1457`).
  The archived status is therefore a stored historical value, not an active
  task state.
- `task.py list` computes a display-only `active` label for a planning parent
  with a child past planning (`task.py:356-371`); it does not mutate the stored
  status.
- `common/tasks.py:100-122` emits a child-only string such as ` [2/3 done]`.
  A child absent from active tasks is counted as done because it was archived;
  this is not an overall percentage.

The parser contract should therefore keep `storedStatus`, runtime pointer
state, and display projection separate, preserve unknown statuses, and keep
archived tasks in a separate collection.

## Session pointers (0.7)

The real runtime session file observed in the original 2026-09-17 capture was:

`.trellis/.runtime/sessions/codex_01a0ae4f-a96b-79d2-a4b2-62a4f8d7e693.json`

```json
{
  "platform": "codex",
  "last_seen_at": "2026-09-17T07:49:36Z",
  "current_task": ".trellis/tasks/09-17-dms-plugin-prereq-research",
  "current_run": null
}
```

`common/active_task.py:646-703` resolves a context-keyed file and returns an
`ActiveTask(task_path, source_type, context_key, stale)` value. A stale pointer
is returned with `stale=true`; malformed JSON or a non-string `current_task`
produces no active task. A single-session fallback is opt-in, and fallback with
two or more session files returns no task rather than guessing ownership.
`task_context.py` restricts context manifests to `implement.jsonl` and
`check.jsonl`, validates file paths, and has explicit archive self-reference
remapping (`task_context.py:217-260`).

The original capture had one real runtime session, so its multi-session
behavior was initially **unverified**. During validation on 2026-09-21 there
are two real session files, both pointing at this task:

```text
.trellis/.runtime/sessions/codex_01a0ae4f-a96b-79d2-a4b2-62a4f8d7e693.json
.trellis/.runtime/sessions/codex_01a0c323-e4f8-7b20-a3d6-f3e26414fedc.json
```

The context-less `task.py current --json` validation returned no current task,
because the resolver refuses to choose between multiple session pointers when
no matching context identity is available; the command emitted JSON and exited
with status 1. This confirms the multi-session ambiguity guard; it is not a
sample of two sessions targeting different tasks.
The disposable fixture outcomes remain recorded in `path-safety.md`.

## CLI machine-readable behavior (0.8)

The current help is authoritative for this installation:

```text
task.py list [-h] [--mine] [--status STATUS] [--json]
task.py current [-h] [--source] [--json]
task.py list-archive [-h] [month]
```

`python3 ./.trellis/scripts/task.py list --json` returned:

```json
{"tasks":[
  {"dir":".trellis/tasks/00-bootstrap-guidelines","id":"00-bootstrap-guidelines","title":"Bootstrap Guidelines","status":"in_progress","display_status":"in_progress","priority":"P1","assignee":"huangyue12120","parent":null,"children":[],"package":null},
  {"dir":".trellis/tasks/09-17-dms-plugin-prereq-research","id":"dms-plugin-prereq-research","title":"Trellis DMS plugin prerequisite research","status":"planning","display_status":"planning","priority":"P2","assignee":"huangyue12120","parent":null,"children":[],"package":null}
]}
```

The original `current --json` returned a `current_task` object with `dir`, `id`, `title`,
`status`, `parent`, `children`, `branch`, and `base_branch`, plus `source` and
`stale`. The source was the Codex session file above and `stale=false`.
`current --source` prints the same path/source in human-readable form.

`list-archive` has no `--json` option. It returned an empty archive heading,
and `list-archive 2026-09` returned `No archives for 2026-09`.

On 2026-09-21, a validation rerun of `list --json` reported this research task
as `in_progress` (it had been `planning` in the original capture). The same
validation reran `current --json` with no matching session identity and got a
null `current_task`; the two-pointer ambiguity is described above. These are
current runtime observations and do not replace the original command samples.

## Archive contract (0.10)

`common/task_utils.py:110-164` defines the destination as
`.trellis/tasks/archive/<YYYY-MM>/<task-dir>`. `resolve_task_dir()` accepts an
archived task path, while `is_within_tasks_dir()` narrows archive operations to
a direct child of the live `tasks/` directory (`task_utils.py:32-52`). The
present `archive/` directory has no month/task children, so an archived sample
and a large-archive performance observation are **blocked** in this checkout.

## Consumer implications

The future observer may use `task.py list --json` as a local oracle, but its
file parser must still read the full `task.json` and retain unknown fields. It
must not treat `display_status`, child counters, or the active pointer as an
overall progress percentage. It must also require a real task directory and
`task.json`; the broader `common/paths.py:280-347` resolver can return the
`tasks/` root, whereas `task_utils.resolve_task_dir()` rejects that root.
