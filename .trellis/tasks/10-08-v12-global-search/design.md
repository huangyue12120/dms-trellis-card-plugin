# Global Search Design

## Live projection

Extend the existing pure trellisprojection.js owner with a global search projection; do not alter makeLauncherProjection semantics. Normalize query to at most 256 characters and trim whitespace; match case-insensitive substrings in project name, task title, and task ID. Preserve deterministic Snapshot order and qualify task identities by project. Keep at most 64 live results and an exact live overflow count.

Blank queries return normal projection metadata and make no filesystem request. Live rows always project the current Snapshot, not a cached second Snapshot. Project result selection uses selectProject; task result selection opens detail without automatic pinning or project-filter changes.

## Archive protocol and bounded traversal

A dedicated searchRequest/searchResponse channel carries identity-safe requests:
`{requestId, kind: "archive-search", query, cursor?}`.
Replies echo request identity/query and include status, project-qualified results, partial, hasMore, cursor, examined-count, truncation, bounded warnings, and source publication provenance.

The daemon owns one active bounded search session and opaque cursors. Reject unknown keys, invalid query/cursor bounds, obsolete cursors, and scope/root changes. New queries cancel old search work. Search resources and generation guards are independent of the existing detail channel; reuse safe path/size/argv policies, extracting small helpers only where necessary.

Traverse current trusted projects, canonical YYYY-MM months, and bounded direct task candidates in deterministic order. Reuse existing month/task/task.json resolver rules and pre-read regular-file/stat checks. Each request examines at most 128 JSON records and 16 directory listings; use existing 48-month, 2048-directory/month, 32-row page, page-63, command-byte, JSON-byte, and warning caps. Retain at most 64 archive matches for a query. No Markdown body is read.

Continuation is explicit user action. Empty months consume the directory-listing budget too. A no-match batch with remaining coverage is partial, not a global no-results answer. Reaching the archive result cap terminates continuation with narrow-query copy. Existing source-output caps are not claims about measured producer memory or latency.

Only successful validated metadata observations feed the Recent Changes archive hook; first coverage stays quiet. Search/archive summaries never enter parser inputs, live tasks, sessions, pins, or watcher registries.

## UI lifecycle

Use native labeled input and focusable Live/Archive/All controls. Keep query/scope/results transient in the widget; All groups live and archive results separately (maximum 128 displayed rows). Changing/clearing query invalidates old replies immediately. Request IDs must distinguish widget instances.

A shared-channel request from another widget supersedes the prior session. Observe ownership changes so the old widget shows a local superseded/retry state instead of waiting forever. Root changes, disable/reload, and close destroy owned search processes/readers/cursors.

Selecting a result suspends search I/O and opens the existing detail channel with the full qualified live or archive identity. Back restores the prior query/scope and existing bounded result view; it does not pin the task.

## Necessary detail authorization guard

Source inspection during implementation found that the existing detail channel
can resolve old `currentInputs` while a configured-root removal is waiting for
a new scan. GS5 requires search-selected details to reject that stale authority.
Add a small fresh-root/canonical-project guard at the daemon detail entry while
preserving its own transport/generation and existing bounded readers/rendering.
If a small shared authority helper is extracted, Search and later Quick Actions
may reuse it; searchSession must not authorize an independent detail request.
Test removed/redirected roots against retained Snapshot identities. This is a
necessary GS5 dependency, not a new surface or behavior feature.

## Rollback

Remove search globals/pools, pure search helpers, and search UI only. Preserve existing archive browsing, detail requests, Recent Changes, and Launcher behavior.
