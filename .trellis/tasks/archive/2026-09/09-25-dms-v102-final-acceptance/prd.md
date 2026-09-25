# DMS v1.0.2 final acceptance

## Goal

Verify the frozen v1.0 candidate against the P0/P1 state, security, lifecycle, compatibility, and selected v0.9 P2 acceptance gates.

## Requirements

- Run the Node contract suite, JavaScript syntax checks for project-owned helpers, manifest checks, Trellis context validation, and whitespace review.
- Recheck traversal, absolute path, symlink escape, stale/malformed pointer, allow-listed Markdown, size/resource bounds, progress-null behavior, archive/live separation, and local failure recovery using the existing fixtures/contracts.
- Reconcile fixture/static results with existing user-reported v0.8 core runtime evidence; do not claim that this session independently replayed those checks.
- On the target DMS 1.6.2 host, verify core loading/empty state, configured and removed roots, bar/popout, multi-bar/display where available, refresh/reload/disable cleanup, and the v0.9 Desktop, locale, Launcher, and multi-surface behaviors.
- Classify each result as fixture, static, offscreen, independently observed host, or user-reported host. Keep unavailable tests pending with an exact reason.
- Fix only verified P0/P1 regressions. If an optional P2 item fails, disable or defer that item alone, then rerun core acceptance and record the final package contents.

## Acceptance Criteria

- [ ] The repository contract suite and applicable syntax, manifest, Trellis-context, and diff checks pass.
- [ ] P0: empty/error recovery, discovery, complete task/session preservation, update behavior, Settings, safe resolver, and honest progress semantics pass the available fixture/static gates.
- [ ] P1: selection/filtering, task relations/priority/session counts, Markdown/archive lazy reads, resource caps, and responsive projection pass the available fixture/static gates.
- [ ] Target DMS 1.6.2 runtime evidence covers required core flows and every P2 item retained in the package; unavailable runtime evidence remains explicitly pending and blocks a final release claim.
- [ ] The shell remains usable with empty, malformed, stale, denied, or unsupported-version inputs; no Trellis data is written.
- [ ] Any disabled/deferred optional item has a documented manifest/catalog change, English/core fallback, and post-v1 note.

## Dependencies and boundaries

- Depends on task 1.0.1's frozen contracts and candidate manifest.
- Run before task 1.0.3; failure rolls back to the relevant v0.x fix or disables one optional P2 item.
- Do not install/restart DMS, overwrite an installed plugin, publish externally, or change user configuration as part of automated checks. Host UI testing must be performed in an already available session or recorded from the user's target-host run.
