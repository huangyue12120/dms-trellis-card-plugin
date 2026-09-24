# v0.7.1 On-Demand Markdown Detail Contract

## 1. Scope / Trigger

This contract applies when a widget opens one approved live-task Markdown
document. It is the only exception to the rule that Markdown bodies never cross
the global-var boundary: the body may travel through the separate ephemeral
`detailRequest`/`detailResponse` channel, never through schema-1 `snapshot`.

## 2. Signatures

```text
validateMarkdownRequest(value)
  -> { ok: true, request: { requestId, kind, projectId, taskId, document } }
   | { ok: false, reason, message }
markdownByteLimit() -> 262144
resolveMarkdownFile(taskDir, document, canonicalPath)
  -> { ok, path, basename } | { ok: false, reason }
```

The request allows only `requestId`, `kind: "markdown"`, `projectId`,
`taskId`, and one of `prd.md`, `design.md`, or `implement.md`. The widget sends
identities and the fixed document selector, never a path or raw content.

The daemon publishes a bounded response with the request identity,
`status: "error" | "empty" | "ready"`, `format: "markdown" | "plain"`,
bounded content, and at most four bounded warnings. A response is accepted by
the widget only when its request ID and task/document identities match the
current detail selection.

## 3. Contracts

- The daemon resolves the selected task from its current validated live input,
  canonicalizes the Markdown path with `realpath -e --`, calls
  `resolveMarkdownFile()` immediately before reading, and never enables archive
  access for this child.
- An argv-only `test -f` and `stat -c %s -- <canonicalPath>` gate runs before
  an asynchronous `FileView`; the reader is `blockWrites: true`,
  `atomicWrites: true`, and `preload: true`.
- A 256 KiB UTF-8 byte cap is checked both before and after the asynchronous
  read. Missing, non-regular, unreadable, oversized, empty, and stale results
  remain local detail states and never trigger Snapshot publication.
- A new request increments the detail generation, destroys prior readers and
  processes, and makes old callbacks no-ops. Component destruction clears the
  same owned resources.
- The widget uses one vertical popout scroll region, native focusable Back/tab
  controls, native `Text.MarkdownText` when available, and `Text.PlainText` as
  the safe fallback. Markdown checkboxes are display-only.

## 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Extra request field, control character, invalid ID, or non-allow-listed name | Reject locally; do not create a reader |
| Unknown/stale project or task identity | Bounded error response; live Snapshot remains unchanged |
| Realpath failure, symlink escape, nested/external document | Bounded path error; no `FileView` |
| Missing/non-regular/unreadable file | Local missing/read error |
| Size above 256 KiB or reader returns above the byte cap | Local size-limit error |
| Empty file | Local empty state |
| Old request/generation callback | Ignore; it cannot overwrite current detail or Snapshot |
| Native Markdown unavailable | Render bounded content as plain text |

## 5. Good / Base / Bad Cases

- Good: a validated live task/document request passes the canonical and size
  gates, then one current read publishes a bounded detail response.
- Base: a missing or empty approved document shows local recovery copy while
  the healthy live list remains usable.
- Bad: a widget constructs a task path, a daemon reads before canonical
  containment, a callback publishes stale content, or Markdown is merged into
  `snapshot`.

## 6. Tests Required

- Pure tests cover request allow-list/field rejection, UTF-8 byte caps,
  traversal and symlink containment, missing/empty/oversized fixtures, and
  unchanged body-free Snapshot output.
- Static checks cover one live Snapshot publisher, argv-only `realpath`/`test`/
  `stat`, read-only async `FileView`, generation/request guards, exact-case
  resources, and the widget's absence of `FileView`/`Process`/path access.
- Offscreen loading may verify QML shape and installed module imports, but real
  Markdown rendering, file-channel behavior, Wayland focus/scroll, and full
  host popout integration remain explicit runtime evidence gates.

## 7. Wrong vs Correct

```qml
// Wrong: raw path crosses the widget boundary or body is added to snapshot.
detailRequestVar.set({ path: taskDir + "/" + document });
pluginService.setGlobalVar(pluginId, "snapshot", { markdown: body });
```

```qml
// Correct: IDs cross the boundary; the daemon resolves and reads safely.
detailRequestVar.set({
    requestId: id, kind: "markdown", projectId: projectId,
    taskId: taskId, document: "prd.md"
});
```
