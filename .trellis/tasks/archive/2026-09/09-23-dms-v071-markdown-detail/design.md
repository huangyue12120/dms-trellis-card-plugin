# v0.7.1 Markdown detail design

## Ownership

- `trellisPaths.js` remains the sole path-policy owner and gains only the
  smallest helper needed to validate a selected Markdown basename.
- `TrellisDaemon.qml` owns request validation, size checks, async `FileView`
  lifecycle, generation/request guards, and the ephemeral response global.
- `TrellisWidget.qml` owns selection/back/tab controls and renders response
  view-model fields. It does not read paths or files.
- Pure Node fixtures own resolver, bounded response, and stale-request tests.

## Request/response contract

```text
request = {
  requestId, kind: "markdown", projectId, taskId,
  document: "prd.md" | "design.md" | "implement.md"
}

response = {
  requestId, kind: "markdown", status,
  projectId, taskId, document,
  content?, format: "markdown" | "plain", truncated?, warnings[]
}
```

The widget sets a runtime-only global request through `PluginGlobalVar`. The
daemon listens for the request, resolves the ID against `currentInputs`, and
sets a bounded response through a separate `PluginGlobalVar`. The response is
never included in `snapshot`, `lastGoodInputs`, `currentInputs`, or DMS State.

## Read sequence

1. Validate request shape and lengths with a pure helper. Reject unknown
   document names before touching the filesystem.
2. Find the project/task record in the daemon's validated model. Use its
   canonical `taskDir`; never trust a path from the widget.
3. Canonicalize the selected Markdown path with `realpath -e --` and
   `resolveMarkdownFile()`. A missing document returns `empty`/`error` without
   creating a reader.
4. Run `stat -c %s -- <canonicalPath>` via an argv array. Reject non-zero,
   non-regular, or over-limit results. The reader also checks the returned
   string length after load.
5. Create a dedicated async `FileView` with `blockWrites: true`,
   `atomicWrites: true`, `preload: true`, and `printErrors: false`. Destroy it
   after `loaded`/`loadFailed`. Publish only if both daemon generation and
   request ID still match.

This read path is independent from topology scan completion, so opening a
detail never delays or republishes the live Snapshot.

## Rendering and fallback

The detail body uses an existing DMS-styled `Text`/`StyledText` inside the
popout's one vertical viewport. The implementation first verifies
`Text.MarkdownText` in the installed offscreen harness. It uses native Markdown
for headings, emphasis, lists, code, and links supported by Qt. If the host
cannot load the native format or a document is unsupported, the response is
shown as escaped plain text with a concise fallback label. No external URL is
opened automatically and no checkbox is interpreted as progress.

## Error and cap model

All status/error strings are bounded and identify only the safe reason (for
example `markdown_missing`, `markdown_size_limit`, `markdown_read_failed`, or
`detail_request_stale`). The content cap is shared by stat and post-read
checks. A later request clears the visible old body to loading/empty state only
after its response ID is current; an old callback is discarded.

## Compatibility and rollback

The Snapshot schema stays version 1 and v0.6 widgets can ignore the new global
vars. Removing this child restores the v0.6 live list and leaves no Trellis
files changed. Any new helper follows the lowercase exact-case import rule.
