# v0.7.2 archive browsing design

## Archive data boundary

Archive data is requested on demand and never appended to `currentInputs`,
`lastGoodInputs`, live watchers, or schema-1 `snapshot`. The daemon maintains a
bounded in-memory archive index per project/request, while the widget consumes
only a sanitized response projection.

```text
archive request(projectId, month?, page?)
  → validate project/root → enumerate bounded months/tasks
  → read page task.json summaries → archive-index response

archive task request(projectId, month, taskId/dirName, document)
  → resolve validated index entry → child-0.7.1 safe Markdown read
  → archive-detail response
```

## Index contract

```text
{
  requestId, kind: "archive-index", status,
  projectId, selectedMonth?, page,
  months: [{ month, taskCount, hasMore }],
  tasks: [{ id, dirName, title, storedStatus, priority, month }],
  hasMore, warnings[]
}
```

Months are restricted to `/^\d{4}-(0[1-9]|1[0-2])$/`. A task entry must be a
direct canonical child of a validated month directory and pass
`resolveTaskDirectory(..., { allowArchive: true })` plus a direct `task.json`
check. `task.json` summaries are bounded to the existing JSON cap and page
limit; malformed summaries remain visible as bounded error rows rather than
being promoted to live facts.

The index uses finite caps for months, task directories, page size, warning
count, and command output. Page continuation is explicit (`page`/`hasMore`),
and a selected month may be loaded independently of the overall month list.

## UI boundary

The popout has mutually exclusive live, archive-index, and archive-detail
content modes. The archive header labels the view as historical/read-only and
provides Back, month, page, and task controls using native DMS buttons. Archive
rows do not show pin/unpin, live session counts, or live state grouping. The
existing one vertical scroll region and 420 × 480 clamp remain unchanged.

## Failure behavior

`archive_unavailable`, `archive_permission`, `archive_layout_unknown`,
`archive_month_invalid`, `archive_limit`, `archive_task_read_failed`, and
`archive_detail_stale` are local bounded warnings. A failed archive request
does not call `setGlobalVar(..., "snapshot", ...)`, alter refresh pending, or
erase a live view; Back always returns to the last live projection.

## Compatibility and rollback

The archive response is optional. A v0.6 widget ignores the new global channel
and continues to display the live Snapshot. Removing this child disables only
the archive entry/index/detail views and leaves live discovery/watcher code
unchanged.
