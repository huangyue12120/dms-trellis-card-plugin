# Quick Actions Check Evidence

Recorded 2026-10-08 by `v12_check`. Repository/fixture checks: **PASS**.
Supported-host behavior: **UNVERIFIED by this child**. The full candidate is
not claimed released or host-accepted by this report.

## Scope and ownership

Reviewed this child's PRD/design/implementation plan, check context, clipboard
argv research, implementation evidence, and applicable frontend contracts.
Preserved the completed Recent Changes and Global Search work and their fixes.
Main owns specs, README/progress, release/deployment, planning/context, and task
state. The implementer owns `implementation-evidence.md`. This checker changed
only daemon/widget action lifecycle, their regressions in the existing test
file, and this evidence file. No agents were spawned.

## Findings fixed

### Retained global action request could replay on daemon recreation

The implementer identified this after its initial freeze; this checker confirmed
it against installed DMS source. `Widgets/PluginGlobalVar.qml` returns the
stored object reference. `Services/PluginService.qml:552` destroys plugin and
daemon instances during unload without clearing `globalVars`. The original
action completion/cancellation left its request in those globals, allowing a
new daemon to interpret it as a fresh clipboard/folder action.

Fix in `TrellisDms/TrellisDaemon.qml`:

- Capture `pendingActionRequest` in the real `onValueChanged` handler before
  `Qt.callLater`, covering cancellation/destruction before a context exists.
- Store the original raw request reference in `context.rawRequest`; scope
  guards require that reference still owns the channel in addition to validated
  identity, generation, settings, and live/project identity checks.
- `_consumeActionRequest(request)` clears only the exact still-owned raw
  request. A replaced/newer request survives completion of the old operation.
- `_cancelAction(clearResponse, preserveRequest)` destroys only action pools.
  By default it consumes still-owned active and queued requests; the internal
  `preserveRequest` option keeps the request while starting new work or staging
  completion.
- `_finishAction` cancels local resources with preservation, publishes the
  matching completion, then consumes the raw request. The deferred null
  acknowledgement retains that completion; null clears the response only when
  it actually cancels an active context. Invalid requests are also consumed
  after bounded error publication.

Fix in `TrellisDms/TrellisWidget.qml`: `observeActionOwnership()` accepts an
already-matching completion through `observeActionResponse()` before treating
the cleared channel as superseded. This preserves truthful local copied,
accepted, and failure feedback regardless of observer ordering.

Regressions in `tests/test_trellis_contract.mjs` execute the actual deferred
request observer, daemon methods/destruction body, and coupled widget methods,
mocking host transports. They cover copied/accepted/host-error/validation-error
completion with both response-observer orderings; pending/read/clipboard-phase
destruction; root cancellation before the deferred handler; old callbacks;
new daemon creation against retained globals; equal-content replacement raw
ownership; and a second widget requesting during delivery of the first
completion. Existing root-change expectations now assert owned consumption.

### Approved live effective-ID semantics retained

Main explicitly confirmed that valid live JSON null/array/primitive values
retain directory-name fallback. No object-only task schema was introduced.
The existing fallback regression now additionally exercises string, number,
and boolean JSON values. Archive keeps its available-object summary semantics;
malformed/unreadable JSON, identity mismatch, and escaped identity still fail.

## QA1–QA5 review

| Requirement | Verified repository behavior |
| --- | --- |
| QA1: actions | Project headers offer project copy/open; live/archive detail offers task ID/path/folder and project path/folder. Actual daemon fixtures cover valid variants. |
| QA2: displayed identity and paths | Copy uses the current effective task ID, including trimmed stored ID/fallback; canonical paths and encoded URLs handle spaces, Unicode, `%`, `#`, and `?`. |
| QA3: authority | Fresh configured roots are canonicalized twice, including after task I/O. Current unique project/live identity, eight-candidate ancestor policy, exact canonical project/`.trellis`/tasks/live/archive/month/directory/direct regular JSON, settings/request/generation, and pre-launch guards are exercised. State caches do not authorize actions. |
| QA3: rejection | Traversal, raw controls, bounds/extra fields, removed/redirected roots, duplicate/stale identities, malformed/unreadable/oversized JSON, file/directory mismatches, symlink redirection at each location, and root/JSON/target changes during I/O reject without host execution. |
| QA4: host boundary | Exact clipboard argv is `["dms", "cl", "copy", "--", value]`, including flag-like `--help`, `-d`, `--type`. Success requires exit zero. Folder opening uses encoded local file URLs and reports launch acceptance only. Missing/throwing APIs, nonzero exit, and rejected URL produce local errors. |
| QA4–QA5: isolation | Action cancellation/failure leaves real Search and detail handlers functioning with their own generations/pools. Parser inputs, Snapshot/Health, pin/filter, permissions, watchers, and Trellis data remain unchanged. No new shell, network, timer, or management command exists in the action path. |
| QA5: controls | Native `DankButton` disclosures/actions use 40px height, bounded wrapping layouts, the existing scroll/focus reveal, localized fixed feedback, and archive-aware detail identity. Source/translation checks pass; rendered interaction remains a host gate. |

Current request and response protocol:

```javascript
actionRequest = { requestId, action, kind, projectId, taskId?, month?, dirName? }
actionResponse = { /* validated request identity */, status, code, value? }
```

Request keys/actions are allowlisted by kind; no caller path/command/executable/
URL/document is accepted. Bounds are requestId 128, projectId 4096, taskId and
direct archive directory 256, and success value/canonical execution path 4096
characters. Archive month uses exact `YYYY-MM` validation. Task JSON retains
both stat and actual UTF-8 limits of 1 MiB. Command output is bounded after
collection to 256*1024 characters; this is not measured producer memory.

Statuses are `copied`, `accepted`, or `error`; daemon codes are fixed local
strings. Widget checks matching full echoed identity/status and code length
at most 64, with local pending/superseded states and fixed translated feedback.

Relevant lifecycle signatures for the executable spec:

```javascript
_handleActionRequest(value)
_cancelAction(clearResponse, preserveRequest)
_consumeActionRequest(request) // raw reference, not normalized identity
_isCurrentAction(context)
_actionScopeCurrent(context)
_guardAction(context)
_finishAction(context, status, code, value)
observeActionOwnership()
observeActionResponse()
```

The main-owned `quick-actions-contract.md` already captures these behaviors;
the optional cancellation argument and consume helper signature were reported
to main for synchronization. Other pure/authority/execution interfaces retain
the documented design signatures.

## Verification

- **Tests PASS:** `rtk proxy node tests/test_trellis_contract.mjs`, including all
  prior regressions and the final retained-global completion/cancellation/
  recreation fixtures. Exit zero on the final product/test state.
- **JavaScript syntax PASS:** `rtk proxy node --check tests/test_trellis_contract.mjs`;
  `/tmp/trellis-v12-static.mjs` parses all six pure JS modules and 105 daemon /
  50 widget root methods with `vm.Script`. This is not QML load/type checking.
- **JSON/resources PASS:** manifest and Chinese translations parse; all widget
  translation keys and exact-case QML resource imports pass through the suite.
  Manifest remains the baseline `1.0.0`; version changes belong to main.
- **Text/diff PASS:** six owned product/test files decode as UTF-8 and retain
  LF; scoped `git diff --check` passes for the seven frozen paths below.
- **Context PASS:** task validator passes: implement.jsonl 10 entries and
  check.jsonl 11 entries.
- **Lint/TypeCheck N/A:** no configured project linter/type checker; `qmllint`,
  `qmlformat`, `eslint`, and `tsc` are unavailable. Syntax/fixture passes are not
  represented as successful lint or QML type checking.

Installed DMS native button source exposes tab focus, Return/Space handling,
and FocusRing. This is API/source evidence, not rendered keyboard evidence.
No real clipboard contents were read/written and no folder was opened by this
child. The clipboard preflight remains isolated argv-parsing evidence only.

## Findings not fixed / remaining gates

No remaining product-code issue was found within this child's approved scope.
Real clipboard output, local folder target/window, normal/narrow rendered
layout, Tab/Shift-Tab/Return/Space/scroll, two visible widgets, and actual host
disable/enable/reload remain unverified and are owned by main's acceptance
child. The installed baseline's earlier State disk-write failure and isolated
offscreen DMS-module resolution failure remain outside this action correction;
no new offscreen/live PASS is claimed.

## Freeze handoff

Product/tests frozen after final verification; main was notified before any
candidate installation. No further checker product/test edits are planned.
SHA-256 values on the frozen state:

| File | SHA-256 |
| --- | --- |
| `TrellisDms/TrellisDaemon.qml` | `8e38d41891fb86249ec8c8478de813872ae7ba263e129030e256b5190d37a83d` |
| `TrellisDms/TrellisWidget.qml` | `aaae714476ec2882fbecc0cddd54ccb4e119c420829bc3411f12cc592387119b` |
| `TrellisDms/lib/trellisPaths.js` | `a888d80adc993e435c3a45566ecea57e8efa03edced1e5c232e7de9c0ddbd947` |
| `TrellisDms/lib/trellisprojection.js` | `ed8b68fa6d4cfa16ade550c113cb304f0c57f3532d4b530e5ccb7c8a83e89e36` |
| `TrellisDms/lib/trellischanges.js` | `314296221cdbc943b81d2c9bedf935e9264435d7e6bc526b9097a285b4013508` |
| `TrellisDms/translations/zh_CN.json` | `d1fd0acc63ce23549837c55ea5087160d97530fd5d29a0902564d26e5dc8064e` |
| `tests/test_trellis_contract.mjs` | `98bb9c04e42bcd92e1802e177cbe412ea2f2e2fe6bf08450a6ad4c84f5b7b16a` |
