# v0.9.3 Launcher Snapshot Projection Contract

### 1. Scope / Trigger

Use this contract when changing the composite Launcher's search projection,
result actions, or its interaction with the DMS Launcher host. The Launcher is
a read-only navigation surface over the daemon's shared Snapshot.

### 2. Signatures

```text
makeLauncherProjection(snapshot, query) -> { ready, items[], overflowCount }
resolveLauncherAction(snapshot, encodedAction) -> action | null
getItems(query) -> DMS launcher result[]
executeItem(item) -> void
```

Project and task results carry `{ kind, name, action }`. Project rows also carry
`projectId`, `activeTaskCount`, and `taskCount`. Task rows carry `projectId`,
`taskId`, `projectName`, bounded display state, and `activeSessionCount`. The
action is bounded JSON containing stable IDs; task IDs are always qualified by
their project ID when converted to the existing `pinnedTaskId` token.

### 3. Contracts

- Read `PluginGlobalVar("snapshot")` from the parent component's `pluginId`;
  never scan files, create a process/watcher/timer/socket, or cache a separate
  Snapshot in the Launcher.
- `PluginGlobalVar.qml` is supplied by DMS's `qs.Widgets` module. Any Launcher
  component that instantiates it must include `import qs.Widgets`; without this
  import, DMS cannot instantiate the Launcher and logs
  `PluginGlobalVar is not a type`.
- A Launcher that declares `PluginGlobalVar {}` as a child must use a QML root
  with a default child property, such as `Item`. A `QtObject` root has no
  default property and DMS fails component creation with
  `Cannot assign to non-existent default property`.
- Empty query returns project rows only. A non-empty query matches project
  names first, then live task titles, using case-insensitive substring matching
  in Snapshot order. Do not search IDs, comments, paths, warnings, archive rows,
  status, or Markdown.
- Return at most 20 matches. Append one non-action overflow row when additional
  matches exist. Bound query text to 256 characters, visible labels/comments,
  IDs, and encoded action payloads.
- Revalidate action JSON, project identity, and task identity against the
  current ready Snapshot before writing State. A project action writes only
  `selectedProjectId`; a task action writes `selectedProjectId` and its
  project-qualified `pinnedTaskId` through key-scoped `PluginService` methods.
- Save valid navigation State before calling
  `BarWidgetService.triggerWidgetPopout("trellisDms")`. Missing State APIs make
  task/project selection a no-op. A missing bar widget leaves saved State in
  place and does not imply that a popout opened.
- DMS 1.6.2's Launcher `Scorer.scoreItems` sorts returned rows by score. The
  inspected host source honors `_preScored`; assign strictly descending scores
  in result order so project/task Snapshot order and the overflow position
  survive host sorting. The plugin result transform preserves this field, and
  each plugin uses its own `plugin_<id>` section.
- `_preScored` is a host implementation detail verified in the installed DMS
  1.6.2 source, not a documented public extension API. Recheck the Launcher
  scorer when raising the compatibility floor or when host ordering changes.

### 4. Validation & Error Matrix

| Input / condition | Required result |
|---|---|
| Missing / unsupported Snapshot | One bounded loading row; action opens the existing popout only if still valid when selected |
| Ready Snapshot with no projects | One unconfigured or no-project information row based on `root_empty` |
| Empty query with projects | Project rows only, up to the match cap, in Snapshot order |
| Non-empty query | Matching project rows, then matching live task rows in Snapshot order |
| More than 20 matches | 20 actionable matches plus one non-action overflow row with exact hidden count |
| No matches | Return an empty plugin result list for DMS's normal no-results UI |
| Malformed / stale action | No State write and no popout request |
| State API unavailable | Keep results searchable; project/task selection makes no State write or popout request |
| No bar widget | Preserve valid State selection; report no successful popout from a false host return |
| Host scorer sorts rows | Descending `_preScored` values preserve the projection order in the plugin section |

### 5. Good / Base / Bad Cases

- Good: the pure projection returns project-name matches before task-title
  matches, and host scoring preserves that order without reading UI comments.
- Base: a valid empty Snapshot returns the existing empty-state navigation row;
  an over-cap query returns bounded results and one overflow row.
- Bad: accepting an old action after its task disappeared, using a bare task ID
  as the saved pin, or relying on array order while the host re-scores rows.
- Bad: treating `_preScored` as a permanent public API or claiming live DMS
  behavior from the source-only inspection.

### 6. Tests Required

- Projection assertions should cover empty/non-empty query ordering, case
  folding, equal task IDs in different projects, 20-row cap and overflow count,
  bounded payloads, and no matches.
- Action assertions should cover malformed JSON, duplicate/stale IDs, project
  filter updates, project-qualified pin replacement, State API failure, and
  unchanged Snapshot data.
- Host checks should inspect scorer ordering and exercise Launcher selection,
  popout/no-widget behavior, and multi-surface reload on DMS 1.6.2. These live
  checks remain distinct from pure/static verification.
- The source contract test should assert that `TrellisLauncher.qml` imports
  `qs.Widgets` whenever it uses `PluginGlobalVar`.
- The source contract test should assert that the Launcher root is `Item` when
  it declares `PluginGlobalVar` as a child.

### 7. Wrong vs Correct

```qml
// Wrong: array order alone can be changed by the DMS launcher scorer.
return projectedItems.map(toLauncherItem)
```

```qml
// Correct: preserve the projection order when DMS 1.6.2 re-scores plugin rows.
function appendResult(items, item) {
    item._preScored = 1000 - items.length
    items.push(item)
}
```
