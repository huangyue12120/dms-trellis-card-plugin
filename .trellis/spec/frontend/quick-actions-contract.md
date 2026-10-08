# Read-only Quick Actions Contract

## 1. Scope / Trigger

v1.2 project headers and live/archive task detail expose identity/path copies
and local folder opening. The daemon is the only filesystem/execution owner.
Actions have an independent serialized generation and Process/FileView pools;
they cannot authorize Search/detail, mutate parser inputs/Snapshot/Health,
install watchers, persist history, or write Trellis data.

## 2. Signatures

```javascript
TrellisPaths.validateActionRequest(value)
TrellisPaths.actionFileUrl(path)
TrellisProjection.makeActionContext(snapshot, kind, projectId, taskId, month, dirName)
// Daemon:
_handleActionRequest(value)
_authorizeActionProject(context, callback)
_validateActionTarget(context, callback)
_readActionIdentity(context, taskResult, callback)
_revalidateActionLocations(context, callback)
_guardAction(context)
_executeAction(context)
_finishAction(context, status, code, value)
_cancelAction(clearResponse, preserveRequest?)
_consumeActionRequest(rawRequest)
// Widget:
requestAction(action, context)
cancelAction()
observeActionOwnership()
observeActionResponse()
```

## 3. Contracts

```javascript
actionRequest = { requestId, action, kind, projectId, taskId?, month?, dirName? }
actionResponse = { /* echoed validated request */, status, code, value? }
```

Kinds are `project`, `live`, and `archive`. Project actions are
`copy-project-path` and `open-project-folder`; task kinds additionally allow
`copy-task-id`, `copy-task-path`, and `open-task-folder`. Task kinds require
taskId; archive requires valid `YYYY-MM` month and direct directory name.
Only kind-specific request keys are accepted. Paths, commands, executables,
documents, and URLs are never caller input.

Reject controls in raw strings before trimming. Bound requestId to 128,
projectId to 4096, taskId/directory to 256, and execution values to 4096
characters. `makeActionContext()` returns only current qualified UI identity,
excluding ambiguous duplicate project/live task IDs through array lookup;
prototype-like IDs remain ordinary data. This helper grants no filesystem
authority. Archive tasks retain month/directory selectors.

Fresh `_configuredRoots()` settings, at most 16 roots, are canonicalized as
directories with action-owned resources. Reuse `_projectAuthorizedByRoots()`
containment and the existing eight-candidate ancestor promotion policy for a
configured scan root inside its owning project. State discovery caches and
Search/detail requests cannot authorize an action.

Require a unique current project, canonical project and `.trellis`, existing
safe live/archive resolvers, direct canonical directory targets and direct
regular `task.json`. Canonical results must exactly equal validated lexical
paths, rejecting symlink redirection. Task JSON uses stat and actual UTF-8
byte limits of 1 MiB. Compare its effective ID with the displayed task ID.
Live preserves parser semantics: trimmed stored string ID, otherwise trimmed
directory-name fallback, including valid JSON null/array/primitive values.
Malformed/unreadable JSON still fails. Archive retains its existing available
object summary rules. Do not introduce a new object-only live JSON schema.

After JSON I/O, revalidate all target locations and configured-root authority.
Check current generation, owned request, effective roots, unique project, and
live directory/identity at every queue launch/callback and just before launch.
Command output retains the existing post-collection 256*1024-character bound;
it is not a measured producer-memory limit.

Clipboard uses a managed Process with exactly
`["dms", "cl", "copy", "--", value]`; the separator keeps `--help`, `-d`,
and `--type` as data. No shell is used. Folder URLs are `file://` plus
percent-encoded path segments from `actionFileUrl()`, preserving spaces,
Unicode, `%`, `#`, and `?`. `Qt.openUrlExternally()` acceptance is not proof
that a window opened.

Statuses are `copied` (clipboard exit zero), `accepted` (opener accepted), and
`error`. Success includes the verified value. Codes are fixed local strings:
`action_copied`, `action_open_accepted`, `action_request`,
`action_validation_failed`, `action_scope_changed`, `action_host_failed`.
The widget checks the entire echoed identity/status and a code of at most 64
characters. Pending/superseded are widget-local states with fixed localized
feedback. Pin/filter, Back, Search, and detail remain independent.

DMS retains plugin globals when unloading components. Completed/cancelled
requests must therefore be consumed only while still owned, including requests
awaiting their deferred handler. Publish completion before consuming its request,
and let widget ownership observation accept an already-matching completion.
`pendingActionRequest` captures the raw object in `onValueChanged`, and the active
context retains `rawRequest`. Ownership requires that exact raw reference.
`_cancelAction()` normally consumes both owned active/queued requests; completion
passes `preserveRequest=true`, publishes its response, then calls
`_consumeActionRequest(rawRequest)`. The deferred null acknowledgement retains
completed feedback when no active cancellation remains.
Never clear a newer widget's request. Destroy action-owned pools on cancellation,
root changes, disable/reload, and destruction; obsolete callbacks cannot revive
work. Recreating a daemon cannot replay a finished or cancelled user action.

## 4. Validation & Error Matrix

| Condition | Result |
| --- | --- |
| Extra request fields, unsupported action/kind, controls, bounds | `action_request`; no filesystem/host launch |
| Missing/duplicate project/live identity, removed roots, unsafe locations | `action_validation_failed`; no host launch |
| Malformed/unreadable/oversized JSON or changed effective ID | `action_validation_failed` |
| Effective roots/current identity changes during work | `action_scope_changed` or owned cancellation; stale callback ignored |
| Missing/throwing host API, clipboard nonzero, rejected folder URL | `action_host_failed`; local only |
| New widget request | Old work superseded; cannot clear the newer request |
| Completion followed by request null | Preserve matching completion feedback; no reload replay |
| Root change/destruction before deferred handler | Consume owned pending request; no recreation replay |

## 5. Good / Base / Bad Cases

Good: a task displayed as `--help` is freshly validated and copied as the last
argument after `--`. A directory containing `#` opens via an encoded file URL.

Base: a live task without a stored ID copies its established directory fallback;
opening the popout or recreating the daemon executes no prior action.

Bad: an archive `task.json` redirects through a symlink after reading; the
post-read location check rejects it. A retained Snapshot cannot authorize an
action after its configured root is removed.

## 6. Tests Required

Run `rtk proxy node tests/test_trellis_contract.mjs`. Assert pure allowlist/key,
raw-control/bounds and encoded-URL policy; all copy/open variants; flag-like,
prototype-like, fallback, Unicode and reserved-path identities; current unique
identity and trusted-descendant promotion/cap; traversal and symlink redirection
at each live/archive/project/JSON location; direct file/directory types; malformed,
oversized and unreadable JSON; authority/identity/location changes during I/O
and just before Process launch; missing API, exception and nonzero exit.

Execute actual daemon/widget functions with only host transports mocked. Cover
owned cancellation, serialized/multi-widget supersession, stale callbacks,
response identity, completion/null ordering, daemon recreation after completion
or cancellation, and cancellation before the deferred handler. Confirm Search
and detail still succeed and parser inputs/Snapshot/Health/pin/filter stay intact.

Real clipboard bytes, folder target/window, native focus/scroll/narrow layout,
two visible widgets, and host reload/disable/enable remain separately recorded
supported-host checks. Source/fixture passes do not establish rendering.

## 7. Wrong vs Correct

Wrong: concatenate a shell command or send `dms cl copy --help`; leave completed
requests in plugin globals for a new daemon to execute again.

Correct: validate identity-only requests under fresh authority, invoke
`["dms", "cl", "copy", "--", verifiedValue]`, publish guarded completion,
then consume only the still-owned request. Display accepted folder launch
separately from observed external-window success.
