# Archive Browsing Contract

## 1. Scope / Trigger

This contract applies to the v0.7.2 archive index/page/detail channel. Archive
data is historical, read-only, and must never become a live Snapshot input.

## 2. Signatures

Pure path helpers:

```text
validateArchiveRequest(value)
normalizeArchivePage(page, pageSize)
resolveArchive(root, candidate, canonical)
resolveArchiveMonth(root, month, candidate, canonical)
resolveArchiveTask(root, month, dirName, candidate, canonical)
resolveTaskJson(taskResult, canonical)
```

Requests are `archive-index {requestId, kind, projectId, page, pageSize}`;
`archive-page` adds `month`; `archive-task` adds `month, taskId, dirName,
document`. Documents remain the three Markdown basenames allowed by the
Markdown detail contract. Responses contain `requestId`, `kind`, `status`,
`projectId`, `selectedMonth`, `page`, bounded `months`, `tasks`, `hasMore`, and
bounded `warnings`. Archive task document responses additionally contain the
validated month and directory identity.

## 3. Contracts

- The only trusted root is `.trellis/tasks/archive`.
- Months must match `YYYY-MM`; tasks must be direct canonical children of a
  validated month. No `.trellis/archive` fallback is allowed.
- Indexing is explicit and lazy. Only the selected page's direct task children
  have `task.json` read, with finite command, JSON, warning, month, directory,
  and page caps.
- The daemon canonicalizes and size-checks every file immediately before an
  asynchronous read. `FileView` is read-only. Archive records never enter
  `currentInputs`, watchers, sessions, groups, pin state, refresh state, or the
  schema-1 Snapshot.
- The widget sends project/month/task identity only and accepts responses only
  when request ID, kind, project, and (for detail) month/directory match.

## 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Missing/inaccessible archive root | `archive_unavailable` |
| Permission/list failure | `archive_permission` |
| Non-month entry or nested/non-directory task | `archive_layout_unknown` |
| Traversal, symlink escape, or wrong direct child | `archive_month_invalid` / `archive_task_rejected` |
| Invalid page/size or finite cap reached | Normalize and emit `archive_limit` |
| Missing, malformed, or oversized task JSON | Bounded unreadable row / `archive_task_read_failed` or `archive_limit` |
| Stale task identity/detail callback | `archive_detail_stale`; old generation is ignored |
| Empty root/month/page | Explicit `empty` response |

At the maximum page, `hasMore` must be false even if discovery was truncated;
otherwise the UI can repeatedly request a page that normalizes back to the same
bounded selector.

## 5. Good / Base / Bad Cases

- Good: a page request reads only bounded summaries and an archive Markdown
  request reuses the safe detail reader after revalidating the direct task.
- Base: an empty or partially malformed archive produces a usable local state
  while the live Snapshot remains unchanged.
- Bad: adding archive rows to live parser inputs, accepting a symlink's
  canonical target, passing a raw path from the widget, or exposing a next-page
  affordance at the cap.

## 6. Tests Required

- Pure fixtures assert month/name/page normalization, root/month/task containment,
  direct `task.json`, traversal, symlink escape, malformed/oversized summaries,
  multiple months, empty months, and non-month entries.
- Static checks assert exactly one live Snapshot publisher, argv-only archive
  commands, read-only readers, no `.trellis/archive`, no archive Snapshot/live
  controls, request/generation guards, and the maximum-page `hasMore` guard.
- Runtime DMS/Wayland archive scrolling, focus, detail loading, and native
  Markdown rendering are evidence gates; when unavailable, record them as
  unverified rather than inferring runtime success from static tests.

## 7. Wrong vs Correct

```qml
// Wrong: advertise continuation forever at the normalized page cap.
var hasMore = truncated || candidates.length > offset + pageSize;

// Correct: the bounded selector is terminal at the maximum page.
var hasMore = page < archiveLimits.pageMaximum
    && (truncated || candidates.length > offset + pageSize);
```
