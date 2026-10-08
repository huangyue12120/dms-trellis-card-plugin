# Quick Actions Design

## Protocol and authority

Add an independent actionRequest/actionResponse channel with bounded requestId, an allowlisted action, projectId, and taskId when needed. Archive task requests additionally carry validated month/dirName identity. Accept no raw path, executable, command, or URL. Responses echo request/action identity and contain status, bounded local code/message, and validated value only when needed.

The daemon serializes action execution in one bounded lifecycle with its own generation/resources. New requests supersede old work; widgets observe ownership changes and end pending state. Destruction, root changes, disable, and reload cancel processes/callbacks. This channel must not cancel Markdown/archive detail or mutate the Snapshot.

## Safe revalidation

1. Validate request shape, bounds, action allowlist, and qualified current identity; reject duplicate/ambiguous project/task IDs.
2. Re-read effective scan-root settings, canonicalize current roots, and require the selected canonical project to remain authorized. Reuse Search's `_configuredRoots()` and `_projectAuthorizedByRoots()` policy with action-owned transports: preserve current discovery's containment/bounded-ancestor contract when a configured scan root lies inside its known owning project. Do not use discoveredProjects State or last-good cache as authorization.
3. Canonicalize the selected project and its .trellis identity; reject redirection/escape or stale project metadata.
4. For live tasks, resolve the existing known task-directory identity through resolveTaskDir. For archive tasks, validate archive root, YYYY-MM month, and direct directory through existing archive resolvers.
5. Canonicalize and bounded-read direct task.json to revalidate its displayed task ID before task actions. Preserve existing effective-identity semantics (trimmed stored ID, or the established directory-name fallback); do not invent a stricter JSON schema than the parser/archive reader. Reject mismatch, malformed/unreadable identity, and escaped files. Folder targets must still be directories.
6. Immediately before executing, confirm the operation/request and configured-root authority remain current.

Pure request/path policy stays in trellisPaths.js. Filesystem operations remain in the daemon. Existing resolver semantics are retained, with no UI-composed path fallback.

## Host execution and feedback

Clipboard uses a managed Process with argv ["dms", "cl", "copy", "--", value], where value is only the verified task ID or canonical path. The `--` separator is required: supported DMS 1.6.2 exposes copy flags and a valid ID such as `--help` must remain data, not trigger CLI options. A preflight probe with an isolated unavailable Wayland runtime verified this parsing without accessing the host clipboard. Bound output/input; success requires exit code zero. No shell is used.

Folder opening uses Qt.openUrlExternally with a local file URL constructed from percent-encoded path segments. Reserved URL characters must not change the target. Return/catch feedback reports whether launch was accepted, not whether an external window appeared. Absence/failure remains local.

No terminal/editor action enters this MVP. Existing process permission suffices; add no capability or permission. Action failure never creates a Trellis health incident or changes parser inputs.

## UI and rollback

Use project-header and task-detail action controls under the parent's UI plan, including archive detail. Disable only pending/invalid actions, keep Back/search/core available, and render bounded native focus/feedback.

Rollback only this action channel, policy extensions, UI controls, and corresponding tests/translations. Preserve the prior two feature children and existing Diagnostics copy.
