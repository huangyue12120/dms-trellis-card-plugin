# v0.8.1 end-to-end state matrix regression

## Goal

Demonstrate that required project/task/session/archive/Markdown states remain truthful and usable from parser input through Snapshot, projection, and visible recovery.

## Requirements

- Cover no trusted roots, zero projects, no live tasks, planning, in-progress, unknown status, multiple sessions, stale/malformed records, long names, archive empty/error/loaded states, Markdown empty/error/stale states, horizontal and vertical bars, and narrow/normal popouts.
- Assert progress remains null when no authoritative value exists; verify live/archive separation and project-qualified deterministic primary selection.
- Verify task.json refresh target of at most two seconds, topology interval behavior, manual refresh, and Settings recovery where the runtime is available.
- Prefer the existing disposable fixtures and matrix table. Add assertions only for roadmap gaps; use real project data only read-only and only if already configured.
- Record each row's expected pill/popout/recovery outcome and classify evidence as fixture, static, offscreen, or live.

## Acceptance criteria

- [x] Every roadmap state row has an explicit observable expectation and a pass/fail record.
- [x] Parser, resolver, Snapshot, projection, and UI source contracts agree for healthy, degraded, stale, unknown, live, and archive states; actual runtime rendering remains a separate gate.
- [x] Fixture and static checks pass without writing to real Trellis data.
- [x] Runtime refresh, topology, Settings, horizontal/vertical, and popout results are separately recorded; unavailable checks remain unverified.
- [x] No percentage is fabricated and no archive/detail body enters the live Snapshot.

## Dependencies and out of scope

Depends on completed v0.7. No new user-facing feature, data model, implicit fallback, or production Trellis mutation is in scope. This is the first child in the v0.8 sequence.
