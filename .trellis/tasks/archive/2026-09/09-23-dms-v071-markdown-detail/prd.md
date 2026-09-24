# Task Markdown on-demand details

## Goal and user value

Let a user select a live task and read its approved `prd.md`, `design.md`, or
`implement.md` inside the DMS popout without exposing arbitrary files, blocking
the shell, or changing the live schema-1 Snapshot.

## Confirmed facts

- The live Snapshot contains validated task IDs and internal task paths but no
  Markdown (`TrellisDms/lib/trellisParser.js:331-370`).
- `TrellisDms/lib/trellisPaths.js:370-385` already allows exactly the three
  direct Markdown basenames after a task directory has been validated.
- The daemon owns `FileView`/`Process` readers; the widget currently consumes
  only `snapshot` (`TrellisDms/TrellisDaemon.qml:104-130`,
  `TrellisDms/TrellisWidget.qml:30-40`).
- Installed Qt metadata exposes `Text.MarkdownText`; DMS also has a small
  Markdown-to-HTML helper, but no project-local Markdown component is present.

## Requirements

1. Add a bounded request/response contract for one live task/document at a
   time. Requests carry only `requestId`, project/task IDs, and one allow-listed
   basename. Responses carry status, bounded content, format, and warnings;
   raw content is never added to the global Snapshot.
2. Resolve the task through the daemon's current validated inputs and call the
   safe resolver immediately before reading. Reject traversal, symlink escape,
   archive-without-opt-in, external paths, nested names, and non-allow-listed
   files.
3. Gate the read with an argv-only size/stat check and a finite Markdown byte
   cap, then use an asynchronous daemon-owned `FileView` with writes blocked.
   Missing, unreadable, oversized, empty, stale, or malformed responses become
   local detail states; they never abort the live scan.
4. Provide a task-row/detail interaction with a back action and three document
   choices. Use native Qt Markdown when available and a safe plain-text/basic
   fallback otherwise. Wrap detail content in the existing single vertical
   popout region and keep controls focusable.
5. Do not read `.trellis/spec/`, journals, arbitrary task files, archive data,
   task checkboxes as progress, or use WebView/heavy Markdown dependencies.

## Acceptance criteria

- [ ] A fixture live task opens each of the three documents, switches documents,
  shows loading/empty/error states, and returns to the live list.
- [ ] Valid content is bounded and rendered by the verified native/fallback
  path; raw content is absent from `snapshot`, pill projections, and task rows.
- [x] Resolver fixtures reject traversal, symlink escape, non-allow-listed
  names, nested paths, absent files, oversized files, and archive paths when
  the request is live-only.
- [ ] A second click/request supersedes the first; an old callback cannot
  overwrite the current detail view or live Snapshot.
- [x] Node/static/offscreen checks prove the widget has no `FileView`/`Process`,
  the daemon reader is async/read-only, and the current v0.3-v0.6 contracts
  still pass.
- [x] Wayland pointer/focus/scroll and native Markdown behavior are either
  verified or recorded as unverified runtime gates.

## Verification status

- Node contract fixtures, JavaScript syntax, manifest JSON, and Trellis task
  context validation pass.
- Installed-module offscreen component/popout parsing passes without a window.
- Real native Markdown rendering, file-channel execution, Wayland
  pointer/focus/scroll, and full host `PluginComponent` popout integration are
  unverified in this environment; they remain explicit runtime gates.

## Out of scope

- Archive month/task enumeration (child 0.7.2), settings migration/reset or
  additional State keys (child 0.7.3), task mutation, search, arbitrary file
  browsing, full GFM guarantees, progress computation, and WebView.

## Decisions and dependencies

- This child establishes the shared detail channel that 0.7.2 reuses for
  archive detail. The response is ephemeral and request-ID guarded.
- The fixed byte limit is centralized with the resolver/reader tests and is
  not user-configurable. It must not exceed the existing JSON safety ceiling.
- Depends on v0.6.2/live popout, task 0.3.3 resolver, and the approved v0.6
  component contract. It must complete before archive UI integration.
