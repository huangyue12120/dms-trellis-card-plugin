# Global Search full-scope review evidence

Recorded 2026-10-08 by the dispatched `trellis-check` reviewer. Result: PASS for GS1-GS6 repository fixture/static verification after one local fix. Candidate QML loading and supported-host interaction remain unverified.

## Finding fixed

`TrellisDms/TrellisDaemon.qml::_searchPage` assumed that page boundaries aligned with the 128-candidate batch budget. A one-row month followed by full 32-row pages reproduced a 129-candidate batch. The reviewer first added a failing actual-daemon regression, then checked the remaining budget before starting a page. A page that does not fit is deferred intact to the next explicit continuation, preserving complete-page observations and cursor progress.

The regression traverses 257 records across two months, asserts every batch is at most 128, verifies complete final coverage without duplicate reads, and verifies all nine complete pages reach Recent Changes. No public signature or resource limit changed.

## Additional behavioral verification

- Added a retained-baseline regression for a malformed month listing: its warning is stored at session level, but `monthReliable` prevents its pages from being submitted with empty page warnings. Existing Recent coverage remains unchanged; a later complete recovery reports the new row exactly once. Existing source-cap regressions also reject page observations for truncated directory listings. Archive-root month-list truncation can leave global search partial while an independently validated month's complete page remains a reliable qualified coverage unit.
- Added both directions of actual reader/generation isolation: cancelling metadata search leaves the active detail reader usable, and cancelling detail leaves metadata search usable.
- Coupled the actual daemon settings cancellation with the actual widget response observer. With an active Search FileView and the old request global retained, rootsChanged destroys Search pools and publishes null; the widget immediately becomes superseded, clears cursor/hasMore, and exposes Retry. An obsolete captured reader callback and the remaining queue cannot publish again or alter that ending state. Current inputs remain unchanged. No protocol redesign is necessary.

## Full-scope review

Reviewed task PRD/design/plan/check context, implementation evidence, applicable frontend contracts and quality sections, pure helpers, actual daemon/detail/Search paths, widget lifecycle/UI, translations, and tests.

| Requirement | Verified repository behavior |
| --- | --- |
| GS1 | Case-insensitive project/title/task-ID metadata matching; Live/Archive/All isolation; current global Snapshot rather than selected-project scope; qualified same-ID/title rows; duplicate/prototype-like identities |
| GS2 | Project results use existing project navigation; live/archive results use qualified detail identity; typing and task selection preserve pin/filter; archive detail revalidates month/directory/task ID |
| GS3 | Live results derive from the current Snapshot, including after detail Back; blank query schedules zero archive I/O and ignores old replies |
| GS4 | 64 live rows with exact overflow; 64 retained archive matches; at most 128 attempted candidates and 16 listings per batch; 48 months, 2048 candidates/month, 32 rows/page, terminal page 63, eight warnings; regular-file/stat/read bounds; explicit partial/source/result cap behavior |
| GS5 | Single-use opaque cursors and deterministic continuation, including empty/short months; query/scope/close cancellation; independent resources; another-widget supersession leaves loading; stale scope/cursors/identities rejected; Back keeps bounded archive view/query/scope and drops the cancelled cursor, with Retry for interrupted coverage |
| GS6 | One existing screen-clamped Flickable; native input/buttons and 40-pixel targets; focus visibility/reveal and input Return-to-first-result; bounded/elided labels, wrapping local feedback, English/Chinese keys; actual focus/layout remain host gates |

Search JSON, archive rows and cursors never enter parser inputs, live tasks/sessions, pin State, watcher registries, or Snapshot Health/publication. Launcher title-only matching is unchanged. The existing single Snapshot publisher, read-only canonical Markdown/archive policies, key-scoped State, and daemon-owned scanner/watchers remain intact.

## Fresh detail authority

GS5's detail correction remains within the existing transport and readers. The entry freshly resolves directory-valued configured roots and canonical project/.trellis, rejects duplicate project/live-task identities, and dispatches only after authorization. Both detail process/file queues check current settings/project identity at launch and callback. Root settings changes cancel owned detail resources and publish a bounded local error.

Actual fixtures verify accepted live/archive detail, removed roots despite retained inputs, root/project redirection, root removal during process authorization and FileView callback, and settings cancellation before a queued reader executes. Old requests cannot publish ready content after settings cancellation. Fixtures also assert input immutability; no Snapshot or Health mutation was added.

## Contracts for Quick Actions and parent specs

```text
TrellisProjection.normalizeSearchQuery(value) -> trimmed bounded string (256)
TrellisProjection.normalizeSearchScope(value) -> live|archive|all
TrellisProjection.searchMetadataMatches(query, projectName, title, taskId)
TrellisProjection.makeSearchProjection(snapshot, query, scope)
  -> {ready, active, query, scope, live[<=64], liveOverflow}
TrellisPaths.validateSearchRequest(value) -> {ok, request}|bounded rejection
```

Requests allow only `{requestId, kind: archive-search, query, cursor?}`. Request IDs/cursors are bounded to 128; query input to 256; controls, raw paths/extra keys and invalid cursor characters are rejected. The cursor belongs to one daemon session and is consumed once. A continuation repeats the same normalized query and current scope; callers do not interpret the token.

Responses contain requestId/kind/query, ready|empty|error status, bounded qualified archive results, partial/hasMore/cursor, examinedCount/batchExamined/batchListings, truncated, sourceSnapshotGeneration, and warnings. Archive identity includes projectId/taskId/month/dirName. Results are accumulated up to 64; continuation is explicit. An examined candidate may fail validation and still consumes budget. A page must fit the remaining candidate budget before it starts.

`_configuredRoots()` reads current settings using the authoritative scanRoots/legacy-input policy and normalizes at most 16 trusted roots. It never reads the discoveredProjects cache. `_projectAuthorizedByRoots(projectRoot, canonicalRoots)` shares containment and the existing bounded ancestor promotion policy (eight candidates). Callers must supply freshly canonicalized directory-valued roots and validate the current unique project plus canonical project/.trellis; neither a retained Snapshot nor searchSession authorizes an independent action. Quick Actions must use its own request/resources/callback guards.

Recent Changes bridge remains `observeArchiveMetadata(project, response)`. Supply only complete current-request, canonical/read-validated page metadata with all rows, explicit task/warning arrays and numeric month/page/pageSize identity. Capped/failed month listings, failed rows, cancellation, and mid-page result-cap stops do not establish coverage. Search matches are never substituted for complete pages.

Search retains one session, bounded project identities, one project's month list, one month's candidate list, current offsets/cursor, 64 matches and eight warnings. JSON is limited to 1 MiB with pre-read stat and UTF-8 byte-limited reader checks; source output uses the existing 256*1024-character post-collection bound. These are finite work/retention policies, not measured producer-memory or latency claims.

## Verification

- PASS: `rtk proxy node tests/test_trellis_contract.mjs`, including existing Recent Changes/Launcher/archive/Markdown/State/Health/scanner/resource contracts and all added Search regressions.
- PASS: helper JavaScript syntax using `vm.Script` after removing only `.pragma library`; `node --check` for the harness; zh_CN JSON and all literal widget translation keys.
- PASS: scoped `git diff --check`; child task context validation (seven implementation/eight check entries).
- Lint: unavailable (`qmllint`, `qmlformat`, ESLint absent; no configured repository linter).
- TypeCheck: unavailable/not configured for this JS/QML project. Syntax/function fixtures do not establish QML type loading.
- Read-only installed DankTextField source confirms the used text/maximumLength aliases, label property, and textEdited/focusStateChanged/accepted/focus APIs; this is API inspection, not rendered evidence.
- No candidate deployment, offscreen load or live-host PASS is claimed. The installed DMS 1.6.2 plugin is baseline only; the isolated offscreen harness cannot resolve host modules even for unchanged HEAD.

## Remaining gates and ownership

No unresolved requirement/design/code finding remains. Main owns executable-spec synchronization, candidate deployment and supported-host gates: normal/narrow rendering, native Tab/Shift-Tab/Return/focus/scroll, partial continuation timing, detail Back rendering, simultaneous widgets, root settings transitions, reload/disable/enable and resource cleanup. Existing host State write limitations are not changed or hidden by transient Search.

This reviewer modified only `_searchPage`, meaningful tests, and this note. Recent Changes fixes and all other edits were preserved. No implementation-evidence, planning/context, README, progress, specification, manifest/release/workflow, commit or archive state was changed by this reviewer.
