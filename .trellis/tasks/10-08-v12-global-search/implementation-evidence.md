# Global Search Implementation Evidence

Recorded 2026-10-08. These are implementation self-checks before the independent Trellis check. Supported-host loading and interaction remain separate evidence gates.

## Delivered behavior

- Metadata search is global across the current shared Snapshot, independent of the saved project filter. Project name, task title and task ID use case-insensitive substring matching. Live, Archive and All scopes have separate result groups.
- Live projection reads the current Snapshot on every change. It includes at most 64 qualified project/task rows and reports the exact additional match count. Duplicate project identities and duplicate live task identities are excluded; prototype-like IDs use array lookup.
- Search query/scope/results are transient widget state. The native input caps text at 256 characters. A blank query immediately returns to the existing projection, cancels owned work and schedules no archive work. Archive requests debounce for 250 ms.
- Archive search uses its own daemon request, response, processes, readers and generation. Traversal is deterministic by project ID and reverse sorted month/task path. It reads metadata JSON only and uses existing canonical archive/month/task/direct-task.json policy, directory/regular-file checks, stat checks and byte-limited FileViews.
- Every continuation attempts at most 128 task candidates and performs at most 16 directory listings. Invalid candidates conservatively consume the record budget. Empty months consume the listing budget. Existing 48-month, 2048-directory, 32-row page, page-63, 8-warning, command-output and JSON-byte limits remain finite. At most 64 archive matches are retained.
- A continuation cursor is an opaque, daemon-owned, single-use token. At a record/listing batch boundary the UI offers Continue. Reaching a result or source cap explicitly reports incomplete coverage; capped traversal cannot keep requesting the same page. Partial no-match text never claims a complete global absence.
- Changing query/scope, closing the popout, destroying the widget, root changes and daemon destruction cancel owned work. Replies are checked against current request/query/scope. Another widget's request ends the old widget's loading state. Closing an old widget does not cancel another widget's request.
- Selecting a project uses existing project navigation. Selecting a live/archive task opens the existing qualified detail request without changing filter or pin. Opening details cancels archive work and discards its cursor while retaining the bounded displayed results/query/scope. Back uses the current live Snapshot and offers explicit Retry for interrupted archive coverage; it cannot submit the dropped cursor.
- Search uses the existing screen-clamped popout, one vertical DankFlickable, native 40-pixel controls, labeled DankTextField, wrapping control Flows and localized bounded feedback. Return in the input focuses the first available result; focused controls request scroll visibility.

## Product files

- `TrellisDms/lib/trellisprojection.js`: pure query normalization, metadata matching and qualified live search projection. Launcher matching is retained.
- `TrellisDms/lib/trellisPaths.js`: strict identity-only search request validation.
- `TrellisDms/TrellisDaemon.qml`: independent bounded archive search, reliable page observations, and fresh detail authority guards.
- `TrellisDms/TrellisWidget.qml`: transient search UI, ownership/cancellation, scope/results/continuation and detail Back behavior.
- `TrellisDms/translations/zh_CN.json`: new English source keys and Chinese translations.
- `tests/test_trellis_contract.mjs`: pure and actual daemon/widget behavior fixtures; existing regressions retained. One existing bounded source-regex allowance was extended from 120 to 160 characters to accommodate the added normal-view visibility predicate.

## Interfaces and retained state

```text
TrellisProjection.normalizeSearchQuery(value) -> <=256-character trimmed string
TrellisProjection.normalizeSearchScope(value) -> live | archive | all
TrellisProjection.searchMetadataMatches(query, projectName, title, taskId) -> boolean
TrellisProjection.makeSearchProjection(snapshot, query, scope)
  -> { ready, active, query, scope, live[<=64], liveOverflow }
TrellisPaths.validateSearchRequest(value) -> {ok, request} | bounded rejection
```

The validator allowlists only `requestId`, `kind`, `query` and `cursor`. Request ID is bounded to 128 characters; query input is bounded to 256 and rejects controls; cursor is at most 128 and allows only letters, digits and hyphens. No UI path is accepted.

```javascript
searchRequest = { requestId, kind: "archive-search", query, cursor? }
searchResponse = {
    requestId, kind: "archive-search", query,
    status: "ready" | "empty" | "error",
    results, partial, hasMore, cursor,
    examinedCount, batchExamined, batchListings, truncated,
    sourceSnapshotGeneration, warnings
}
result = {
    kind: "archive", projectId, projectName, taskId, title,
    storedStatus, month, dirName
}
```

`sourceSnapshotGeneration` is the daemon's publication generation; it is not a second Snapshot. Archive rows stay outside parser/live inputs, sessions, pins, watchers and shared Snapshot publication. Only one search session and its current cursor are retained. The session holds bounded project identities, one project's months, one month's candidates, current offsets, 64 results and eight warnings.

The search page observer executes the existing `observeArchiveMetadata(project, response)` bridge after its own request/authority/read guards. Each input is a complete reliable `archive-page` with explicit `tasks`, `warnings: []`, selectedMonth, numeric page and pageSize. Nonmatching metadata rows are included. Capped/failed listings, failed rows and a result cap reached mid-page do not establish complete observation coverage. The real Recent Changes observer is executed by integration fixtures: first coverage is quiet; later page growth emits one `archive_item_observed` event.

## Necessary GS5 authority correction

The previous detail entry selected a current input before freshly checking configured roots. Removing a configured root while discovery had not yet replaced the retained Snapshot/input could therefore keep an old task selectable. Search's existing-detail navigation needed the same authorization boundary as its metadata traversal.

The minimal correction preserves detail's own transport, readers and generation:

- `_configuredRoots()` reads the current settings authority; it never consults State's discoveredProjects cache.
- `_projectAuthorizedByRoots(projectRoot, canonicalRoots)` shares only pure containment/bounded-ancestor policy with Search. Quick Actions can reuse these two helpers with its own fresh canonical root resolution.
- `_authorizeDetailProject(generation, requestId, project, callback)` freshly resolves directory-valued configured roots and canonical project/.trellis before dispatching the existing detail reader. Duplicate current project IDs and duplicate live task IDs are rejected.
- `_detailScopeCurrent()` compares current configured roots and the current unique project/root with the captured request authority.
- `_queueDetailProcess` and `_queueDetailFile` check authority at queue time and callback time. Root settings changes immediately call `_rejectDetailScope`, destroy owned detail resources, and publish a bounded `detail_scope_changed` response. These local errors do not publish or mutate a Snapshot.

Actual function fixtures verify accepted live and archive detail, removed roots with retained inputs, redirected roots/projects, removal during canonical validation, removal during a FileView callback, and actual settings-change cancellation of queued readers/processes before completion.

## Verification completed

| Check | Result / evidence |
| --- | --- |
| `rtk proxy node tests/test_trellis_contract.mjs` | PASS, complete existing suite plus new pure/Search/bridge/Widget/detail authority fixtures |
| Pure matching/projection | Case folding; project/title/ID; separate projects with equal task IDs/titles; blank query; scope isolation; 64 cap/exact overflow; duplicate/prototype-like IDs; Snapshot immutability |
| Actual daemon traversal | 300 nonmatching records progress 128/128/44 without duplicate reads; complete nonmatching page observations; zero Markdown; 20 empty months stop at 16 listings then resume |
| Finite caps | 64 archive matches stop; 2048 task directories stop at page 63; 50 months stop at 48; eight warnings; output/file byte caps; source truncation stays partial |
| Invalid archive / authority | Malformed JSON; oversized JSON rejected before FileView; month/task/task.json symlink escape; non-directory month; malformed month/outside path; stale/missing/duplicate projects; untrusted input; root/project retarget |
| Cancellation / cursor | Blank zero I/O; stale and consumed cursor rejection; root/scope changes; cancelled queued FileView; newer request supersession; destroyed owned pools |
| Actual Widget lifecycle | Debounce; typing leaves pin/filter unchanged; clearing ignores late replies; two-widget ownership ends old loading; old-widget close retains newer owner; live/archive/project selection; detail Back retains bounded results but discards cursor; Retry starts a fresh query; newer live Snapshot immediately appears after Back |
| Fresh detail authority | Actual entry/queue/reader/settings functions; root removal/redirect with retained data; async validation/read root changes; local error response and resource cancellation; live/archive success; input immutability |
| `rtk proxy node --check tests/test_trellis_contract.mjs` | PASS |
| JS syntax | PASS using vm.Script after removing only the QML `.pragma library` line in memory for Paths, projection and Recent Changes helpers |
| JSON / translations | PASS; zh_CN parses and the full harness verifies all literal Widget translation keys |
| Exact-case resources | PASS through full existing import/resource harness |
| UTF-8 / LF | PASS for all six owned product/test files |
| Scoped `git diff --check` | PASS |
| `task.py validate .trellis/tasks/10-08-v12-global-search` | PASS, seven implementation and eight check context entries |
| qmllint / qmlformat | UNAVAILABLE in this environment |

## Supported-host gates

UNVERIFIED here: candidate QML loading and cache-busted reload; native keyboard/Tab traversal and focus visibility; pointer/scroll and narrow widths; partial continuation timing; detail Back rendering; simultaneous visible widgets; root settings transitions; disable/enable resource lifecycle.

A supported running DMS host exists, but this implementer did not install a candidate or treat static/fixture evidence as host acceptance. Main owns the reversible candidate installation, supported-host checks, executable spec update, independent Trellis check, and acceptance/release decisions. Product/test files were handed off frozen after the self-checks above; only this task-local evidence was written afterward.
