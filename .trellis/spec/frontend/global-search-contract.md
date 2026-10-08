# Global Search and Fresh Detail Authority

## 1. Scope / Trigger

v1.2 popout metadata search uses the shared Snapshot for Live and an independent
daemon channel for Archive. Match project name, task title, and task ID without
changing Launcher title-only semantics. Search facts never enter parser inputs,
sessions, pins, watchers, Health, or a second Snapshot publisher.

Search result navigation also requires fresh authority at the existing detail
entry: retained `currentInputs` alone cannot authorize a removed root.

## 2. Signatures

```javascript
TrellisProjection.normalizeSearchQuery(value)
TrellisProjection.normalizeSearchScope(value)
TrellisProjection.searchMetadataMatches(query, projectName, title, taskId)
TrellisProjection.makeSearchProjection(snapshot, query, scope)
TrellisPaths.validateSearchRequest(value)
// Daemon helpers; each channel keeps its own transport and guards:
_configuredRoots()
_projectAuthorizedByRoots(projectRoot, canonicalRoots)
_authorizeDetailProject(generation, requestId, project, callback)
_detailScopeCurrent()
_rejectDetailScope(generation, requestId)
```

## 3. Contracts

Query normalization trims, bounds to 256 characters, and matches case-insensitive
substrings. Scopes are `live`, `archive`, `all`; invalid scope defaults to Live.
`makeSearchProjection()` returns `{ready, active, query, scope, live, liveOverflow}`.
Project/live task identities are qualified and unique; duplicate IDs are excluded
using array lookups, including prototype-like keys. Keep 64 Live rows and report
the exact additional match count. Live always derives from the latest Snapshot,
independent of the saved project filter. Blank query issues zero archive I/O.

```javascript
searchRequest = { requestId, kind: "archive-search", query, cursor? }
searchResponse = {
    requestId, kind: "archive-search", query,
    status: "ready" | "empty" | "error", results,
    partial, hasMore, cursor, examinedCount, batchExamined, batchListings,
    truncated, sourceSnapshotGeneration, warnings
}
// Archive row:
{ kind: "archive", projectId, projectName, taskId, title,
  storedStatus, month, dirName }
```

Only the four request keys are accepted. IDs/cursors are bounded to 128; raw
queries to 256. Reject controls, extra keys/paths and invalid cursor characters
(letters/digits/hyphens only). Cursors are opaque, daemon-owned, single-use and
query/scope-specific. Requests from another widget supersede existing work.

One session retains bounded project identities, one project's months, one month's
candidates, offsets/cursor, 64 Archive matches and eight warnings. Each explicit
continuation attempts at most 128 candidates and 16 directory listings. Invalid
candidates count toward the record budget; empty months count toward listings.
Before starting a page, require that its entire bounded candidate count fits the
remaining budget. Defer it intact otherwise: short pages across months do not
justify assuming 32-row alignment with the 128-record cap.

Retain existing 48-month, 2048-directory/month, 32-row/page and terminal page-63
policies. JSON is stat-checked and UTF-8 byte-limited to 1 MiB; source output uses
the existing post-collection 256*1024-character bound. No Markdown is read for
search. These bounds do not establish measured producer memory or latency.
Coverage/result/source caps remain visibly partial. `hasMore` is false at terminal
caps; partial no-match never means globally no matches.

Only complete safely read pages feed `observeArchiveMetadata(project, response)`
after Search's own request/canonical/read guards. Supply all rows, not matches,
with explicit arrays, no warnings, selectedMonth and numeric page/pageSize selectors.
`monthReliable` excludes capped/failed/incomplete task directory listings even
when page-local warnings are empty. A truncated global month index may still
contain an independently validated month's complete coverage unit. Failed rows,
cancellation or a mid-page result-cap stop do not establish page coverage.

`_configuredRoots()` reads current effective settings, normalizing at most 16
roots; `discoveredProjects` State is never authority. The pure authorization
helper preserves existing containment and eight-candidate ancestor promotion
(a selected scan root may lie inside its known owning project). Callers freshly
canonicalize directory-valued roots and validate the current unique project and
canonical project/.trellis with their own channel resources.

Detail entry captures root/project authority. Detail process/file queues check it
at launch and callback; settings root changes destroy owned readers/processes and
publish a bounded local `detail_scope_changed` error. Search root changes destroy
its own pools and publish null; the owning widget reliably enters superseded,
clears cursor/hasMore and offers Retry. Obsolete callbacks cannot revive work.

The native widget keeps transient query/scope/results, a 250 ms archive debounce,
one existing screen-clamped scroll area and at most 64+64 rows. Typing preserves
filter/pin. Project selection uses existing navigation; task selection opens
qualified detail without auto-pinning. Detail suspends archive work, preserves
bounded results/query/scope, drops the cancelled cursor and offers Retry on Back.
Back derives Live from the current Snapshot. Closing an old widget cannot cancel
another widget's request. Keyboard/focus/source checks remain distinct from
actual rendered evidence.

## 4. Validation & Error Matrix

| Condition | Result |
| --- | --- |
| Blank/cleared query | Current projection immediately; zero archive request |
| Query/scope/root/project change, close or destruction | Cancel owned work; ignore stale replies |
| Unknown/consumed cursor or changed canonical roots | Bounded local error; no continuation from stale state |
| Unsafe/malformed/oversized/missing archive record | Budget consumed, bounded warning and partial coverage; no parser mutation |
| Listing or result cap | Terminal/incomplete coverage; no repeated capped page |
| Complete page cannot fit remaining budget | Preserve offset; resume that page on explicit continuation |
| Incomplete month directory listing | Retain prior Recent Changes baseline |
| Another widget supersedes request | Stop old loading and offer retry |
| Removed/redirected configured root at detail entry | Reject despite retained Snapshot/input |
| Root configuration changes during detail process/read | Destroy pools and emit local error; no ready content from old callbacks |

## 5. Good / Base / Bad Cases

Good: equal task titles/IDs in two projects retain qualified context and open the
correct detail without changing pin. Continue advances without duplicate reads.

Base: Live is the default; clearing text restores the existing projection and
does not enumerate archives.

Bad: one short month plus full pages exceeds 128 candidates; an interrupted
detail Back reuses a destroyed session's cursor; old roots are authorized from
State. All three are prohibited.

## 6. Tests Required

Run `rtk proxy node tests/test_trellis_contract.mjs`. Execute actual daemon
traversal, detail queues/settings guards, Recent bridge and widget lifecycle with
only host transport mocked. Cover 300 records (128/128/44), short-month crossover
(257 records, no batch above 128, nine complete observations), empty months,
every cap, malformed/unsafe metadata, duplicates/prototype IDs, blank zero I/O,
single-use cursors, cancellation/supersession, independent detail resources,
failed page baseline retention/recovery and Snapshot immutability.

Couple daemon root cancellation to the actual widget observer: retained old
request plus null response ends loading; old reader callbacks cannot republish.
Back preserves bounded rows/query/scope, discards cursor, uses current Live and
explicit Retry. Root removal/redirection and in-flight settings changes are
tested against retained input identities. Real focus/scroll/narrow widths,
multiple visible widgets and reload/lifecycle remain supported-host gates.

## 7. Wrong vs Correct

Wrong: split a complete archive page into matching rows or read a whole new page
despite insufficient remaining budget; open retained details solely from cache.

Correct: defer intact pages at budget boundaries, publish only reliable complete
page observations, and independently revalidate current root/project authority
before detail/actions. Search state never grants another channel path access.
