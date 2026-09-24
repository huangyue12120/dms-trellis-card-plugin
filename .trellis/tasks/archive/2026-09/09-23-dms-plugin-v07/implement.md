# Trellis DMS v0.7 execution plan

## Ordered delivery

1. **Activate and implement `09-23-dms-v071-markdown-detail`.** Freeze the
   request/response object, add resolver/size/read helpers, verify native
   Markdown and fallback, and add live task selection/detail UI. Do not add
   archive enumeration or Settings reset in this child.
2. **Implement `09-23-dms-v072-archive-browsing` after child 1 checks.** Reuse
   the detail channel and reader, add verified month/task indexing with page
   caps, separate archive projection/UI, and archive fixtures. Archive errors
   must remain local to the archive response.
3. **Implement `09-23-dms-v073-settings-state` after child 2 checks.** Add
   `pillMode` migration, visibility/version/progress settings, bounded collapse
   and archive-month State, key-scoped restore defaults, and recovery/state
   matrix coverage.
4. **Parent integration review.** Run the complete contract suite, offscreen
   component load, manifest/version checks, and available runtime checks. Update
   docs/specs and `PROJECT_PROGRESS.md` with verified results and explicit
   unverified Wayland/host limitations. Set `plugin.json` to `0.7.0` only at
   this final gate.

## Shared validation commands

Run from the workspace root unless a command says otherwise:

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json", "utf8"))'
python3 ./.trellis/scripts/task.py validate .trellis/tasks/archive/2026-09/09-23-dms-v071-markdown-detail
python3 ./.trellis/scripts/task.py validate .trellis/tasks/archive/2026-09/09-23-dms-v072-archive-browsing
python3 ./.trellis/scripts/task.py validate .trellis/tasks/archive/2026-09/09-23-dms-v073-settings-state

The child tasks are archived under the verified Trellis archive layout by the
time of this parent integration check; while a child is active, validate its
active `.trellis/tasks/<child>` path instead.
```

Add child-specific Node fixtures for resolver, Markdown size/error, detail
request IDs, archive month/task pagination, settings migration, and State
normalization. Re-run the existing v0.3-v0.6 fixtures unchanged. If `qmllint`,
the offscreen QML harness, DMS, or Wayland is unavailable, record the exact
gate as unverified instead of treating static checks as runtime evidence.

## Review gates

- **After child 0.7.1:** no widget `FileView`/`Process`; detail requests carry
  IDs only; every read is resolver- and size-gated; stale requests cannot
  publish; Snapshot JSON contains no Markdown; native Markdown/fallback loads.
- **After child 0.7.2:** archive paths are canonical and opt-in; live and
  archive collections are disjoint; month/page/task caps and empty/permission/
  unknown-layout responses are bounded; archive failure never changes the live
  Snapshot.
- **After child 0.7.3:** migration preserves v0.6 settings; all new settings
  normalize immediately; State reset is key-scoped; local choices survive
  synchronous State failure; refresh/default/error copy matches the matrix.
- **Before parent archive:** v0.3-v0.6 safety, watcher, resource, exact-case,
  and one-publisher contracts pass; `PROJECT_PROGRESS.md` and spec/docs match
  actual behavior; manifest is `0.7.0`.

## Risk files and rollback points

| Risk area | Files | Rollback boundary |
|---|---|---|
| Resolver/detail channel | `TrellisDms/lib/trellisPaths.js`, new helper, `TrellisDaemon.qml` | Revert child 0.7.1 as one reader/request set |
| Detail/archive UI | `TrellisWidget.qml`, new QML/helper | Remove detail/archive modes while keeping v0.6 live projection |
| Archive enumeration | `TrellisDaemon.qml`, parser/projection tests | Disable archive requests; preserve live scan/watcher path |
| Settings/State | `TrellisSettings.qml`, `TrellisWidget.qml` | Restore v0.6 displayMode and two State keys; leave inert new keys |
| Docs/spec/version | `docs/*`, `.trellis/spec/*`, `PROJECT_PROGRESS.md`, `plugin.json` | Restore docs/version only after product behavior rollback |

Never use `git reset --hard` or broad deletion. The workspace is not a Git
repository at its root, so validation and task archive records must state that
commit verification is unavailable rather than inventing a commit.

## Follow-up checks before `task.py start`

- Parent and all three child PRDs have no blocking open questions and contain
  testable acceptance criteria.
- `design.md` and `implement.md` exist for every complex task.
- `implement.jsonl` and `check.jsonl` contain real spec/research entries, not
  placeholder rows.
- The archive path discrepancy is recorded and the canonical path is fixed.
- The user has seen this final planning summary and explicitly approves it in a
  subsequent message. Do not run `task.py start` in the planning turn.
