# Archive browsing and lazy loading

## Goal and user value

Give users a separate, read-only view of historical Trellis tasks without
mixing archived work into the live list or loading a large archive into the
shell at startup.

## Confirmed facts

- The verified Trellis layout is `.trellis/tasks/archive/<YYYY-MM>/<task-dir>`;
  `TrellisDms/lib/trellisPaths.js:232-287` already derives and validates the
  archive root and `:244-275` requires explicit archive opt-in.
- The current daemon checks archive-root availability but does not enumerate
  archive months/tasks or publish archive content (`TrellisDms/TrellisDaemon.qml`
  around the project discovery path). The live parser keeps archive unloaded.
- The v0.6 widget renders only bounded live projections and has no archive
  entry or archive-specific State.

## Requirements

1. Reuse child 0.7.1's bounded daemon request/response channel and safe
   Markdown reader. Add request kinds for archive index/page and selected
   archive task detail; the widget sends only project/month/task/page identity.
2. Canonicalize the archive root, accept only `YYYY-MM` month directories and
   direct task children, and list a bounded page. Read `task.json` summaries
   only for the requested page; do not read all archive Markdown or put archive
   records in the live Snapshot.
3. Keep live and archive views visibly separate. Archive rows show historical
   status/title and a read-only detail affordance; live pin/group/session
   controls do not act on archive rows.
4. Support empty archive, inaccessible root/month/task, unknown month/layout,
   page cap, stale selection, and archive-task Markdown errors with explicit
   local statuses. Archive failure must leave the current live Snapshot and
   refresh state usable.
5. Do not move, restore, delete, edit, or otherwise mutate archive tasks. Do
   not add a second unverified `.trellis/archive` trust root.

## Acceptance criteria

- [ ] Fixture archive tasks in multiple months appear only in the archive view;
  none appears in live task groups or primary selection.
- [ ] Month/task index is lazy, bounded, paginated/limited, and exposes clear
  loading/empty/error/unknown-layout states. A large fixture does not load all
  Markdown bodies or freeze the shell.
- [ ] Selecting an archived task opens the same three safe Markdown documents
  through the child 0.7.1 channel, with archive opt-in and request-ID guards.
- [ ] Traversal, symlink escape, non-month names, nested task directories,
  unreadable/oversized task JSON, and archive permission failures are rejected
  or degraded locally.
- [ ] Static/pure/offscreen checks prove archive paths are read-only, live and
  archive collections are disjoint, and existing v0.3-v0.6 contracts pass.
- [ ] Real Wayland archive scrolling and host behavior are verified or listed
  as explicit runtime gates.

## Verification status

- Node contract fixtures, JavaScript syntax, plugin manifest JSON, and Trellis
  task-context validation pass.
- Pure archive fixtures cover multiple months, empty months, unknown layouts,
  malformed/oversized task JSON, direct-child enumeration, traversal, and
  symlink containment checks. Static contracts confirm archive data stays out
  of the live Snapshot, watchers, groups, sessions, and pin controls.
- Real archive index/detail execution in the DMS host, Wayland scrolling and
  focus behavior, and native Markdown rendering remain unverified in this
  environment; they are explicit runtime gates rather than claimed evidence.

## Out of scope

- Archive mutation, restore/delete, search, arbitrary file browsing, full
  archive history analytics, new desktop/launcher surfaces, and changes to
  Snapshot schema or live primary policy.

## Decisions and dependencies

- Canonical root is `.trellis/tasks/archive`, based on the verified Trellis
  task store and existing resolver. The roadmap's `.trellis/archive` shorthand
  is recorded as resolved evidence, not implemented as a fallback.
- Child 0.7.1 must land first because archive detail reuses its request,
  stat/read, response, and Markdown fallback contracts. Child 0.7.3 owns the
  archive visibility and selected-month State/default integration.
