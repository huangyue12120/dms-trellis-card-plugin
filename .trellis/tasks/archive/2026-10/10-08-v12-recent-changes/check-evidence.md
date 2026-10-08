# Recent Changes full-scope review evidence

Recorded 2026-10-08 by the dispatched `trellis-check` reviewer. Result: PASS for repository fixture/static verification after local fixes. Candidate QML and live-host gates remain unverified.

## Findings fixed

- `TrellisDms/lib/trellischanges.js`: eager bounded retention could evict identities still awaiting comparison in the same observation. At a full baseline, one lexically early insertion reproduced 32 project-discovered, 128 task-discovered, or 128 session-attached events. Retention now protects currently observed identities and prefers retiring absent identities. Project absence and reliable session detachment are observed before retirement. Health comparisons use the same protection. New regressions cover insertions before and after retained IDs, full-cap replacement, surviving status/Health comparisons, exact detached identity and facts, repeated observations, and unchanged caps.
- `TrellisDms/lib/trellischanges.js`: a missing/non-array archive `tasks` value could establish a false first-coverage baseline, and a null row threw an exception. Require task/warning arrays and reject null rows. Regressions verify malformed responses preserve existing coverage, establish no new coverage, and leave the first complete read quiet.
- `TrellisDms/translations/zh_CN.json`: the history's unscoped Health context used an untranslated `Snapshot` label. Added `快照` and expanded source assertions to verify every widget English translation key.

## Full-scope coverage

Reviewed the helper, actual daemon publication/State/archive integration, history UI, translations, and behavioral tests against RC1-RC6 and applicable data, watcher, State, archive, primary-selection, recovery, responsive, and exact-case resource contracts.

- All 14 event kinds have behavioral assertions. Semantic repeated snapshots, clocks, warning order, and repeated generations remain quiet; reload and configured-root rebaselines remain quiet.
- Reliable task/session facts survive record, discovery, scoped-root, and last-good failures. Recovery reports valid changes without false completion, recreation, or read-error detachments. Reassignment requires reliable targets; other readable projects continue comparing.
- Project-qualified duplicate/prototype-like/invalid identities, event provenance/IDs, ring eviction, record/Health caps, archive unit/row caps, cross-page deduplication, page shifts, errors/cancellation, and retired coverage rebaselines are covered.
- Tests execute the daemon's actual publication and selection functions with mocked host transport. Snapshot-driven primary changes and subsequent State changes are `ui_selection`, initial preferences are quiet, and selection observation does not scan or publish source facts.
- The daemon remains the sole observer/publisher and watcher owner. Parser facts, schema 2, read-only canonical archive access, lazy metadata, key-scoped State, and the existing scanner boundaries remain intact. No extra reader, watcher, timer, permission, persistence, or surface was introduced by this review.
- The history uses the existing screen-clamped popout and one Flickable, with project/task/session context, source distinction, native Back/entry controls, focus indicators, explicit unavailable/skew/fallback/empty copy, and English/Chinese labels. Static source checks do not establish rendered focus or scroll behavior.

## Public contracts to preserve for Search

- Daemon hook: `observeArchiveMetadata(project, response)`. Call after Search's own current-request/cancellation and canonical-read guards, for complete safely read `archive-page` metadata only. It starts no read and publishes only `recentChanges`.
- Accepted response: `kind: archive-page`, `status: ready|empty`, valid `selectedMonth: YYYY-MM`, task and warning arrays, no warnings, and at most 32 non-null available/error-free rows with bounded valid directory identity. Production callers supply numeric page 0-63 and pageSize 1-32. The helper's omitted-selector defaults remain page 0/pageSize 16; Search should supply both explicitly.
- Coverage identity is `[projectId, selectedMonth, page, pageSize]`; row identity is `[projectId, selectedMonth, dirName]`. First coverage and evicted coverage are quiet; later newly observed rows deduplicate across retained units and never imply task completion. Failed/cancelled/malformed reads retain prior coverage.
- Optional Snapshot provenance: `runtime.observationEpoch` and monotonically increasing `runtime.publicationGeneration`; published history: `{ epoch, source_snapshot_generation, events }`. Selection/archive events may share a generation and have distinct runtime sequence IDs. Consumers tolerate absent globals and publication skew without discarding prior history.
- Events expose allowlisted bounded `event_id`, `observed_at`, `epoch`, generation, qualified project/task/session identity/context, kind/source, and before/after summaries. `ui_selection` describes a changed projection or preference and does not establish a manual click.
- Caps: 200 newest events; 32 projects; 128 tasks and 128 sessions per project; 33 project/global Health baselines; 128 archive coverage units and 4096 retained row identities. Summaries cap title 240, project name 160, status/state 48, identity 1024, and observation time 64 characters. Retention must preserve comparisons of current identities before bounded retirement.

## Verification

- PASS: `rtk proxy node tests/test_trellis_contract.mjs`, including all existing state-matrix contracts and added turnover/malformed-archive/localization regressions.
- PASS: JavaScript syntax checks using `vm.Script` after removing only the QML pragma; `node --check` for the contract harness.
- PASS: zh_CN JSON parsing and all widget translation keys; scoped diff whitespace; task JSONL context validation.
- Lint: unavailable; `qmllint`, `qmlformat`, and `eslint` are not installed and there is no repository linter configuration.
- TypeCheck: unavailable/not configured for this JS/QML project; `tsc` is absent. Syntax and behavioral checks above are separate evidence.
- No candidate offscreen/live-host validation is claimed. The parent's isolated offscreen harness fails host module imports even against unchanged installed HEAD; the reachable installed DMS plugin still matches HEAD. Parent owns candidate deployment/reload and host checks.
- Remaining host gates: normal/narrow rendering; Tab/Shift-Tab/arrow/page focus, scroll, and Back restoration; two-widget history convergence; reload/disable/enable quietness; watcher ownership; degraded/recovery UI semantics. Existing host State disk-write failures also leave restart persistence unverified.

## Parent-owned follow-up

No unresolved product/design/code finding remains from this review. The parent added `.trellis/spec/frontend/recent-changes-contract.md`; its public signatures, present-identity retention, archive-array guards, provenance, limits, and evidence boundaries match the reviewed implementation. No further spec correction is requested. No roadmap, specification, release/manifest, commit, or archive state was changed by this reviewer.
